import prisma from '../config/database';
import type {
  BuildResponse,
  BuildsListResponse,
  CreateBuildRequest,
  UpdateBuildRequest,
  BuildComponentData
} from '../types/build.types';

export class BuildsService {
  /**
   * Маппер сборки из Prisma в API формат
   */
  private static mapBuild(build: any): BuildResponse {
    return {
      id: build.id,
      name: build.name,
      description: build.description || undefined,
      totalPrice: build.totalPrice,
      isPublic: build.isPublic,
      createdAt: build.createdAt,
      updatedAt: build.updatedAt,
      user: {
        id: build.user.id,
        username: build.user.username,
        firstName: build.user.firstName || undefined,
        lastName: build.user.lastName || undefined
      },
      components: build.components ? build.components.map((bc: any) => ({
        category: bc.component.category,
        component: {
          id: bc.component.id,
          name: bc.component.name,
          brand: bc.component.brand,
          model: bc.component.model,
          price: bc.component.price,
          currency: bc.component.currency,
          image: bc.component.images?.[0],
          specs: bc.component.specs || {}
        },
        quantity: bc.quantity
      })) : []
    };
  }

  /**
   * Получение сборок пользователя
   */
  static async getUserBuilds(userId: string, page: number = 1, limit: number = 10): Promise<BuildsListResponse> {
    try {
      const skip = (page - 1) * limit;

      const [builds, total] = await Promise.all([
        prisma.build.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            components: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    category: true,
                    price: true,
                    currency: true,
                    images: true,
                    specs: true
                  }
                }
              }
            }
          }
        }),
        prisma.build.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        builds: builds.map((build: any) => this.mapBuild(build)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error fetching user builds:', error);
      throw new Error('Ошибка при получении сборок пользователя');
    }
  }

  /**
   * Получение публичных сборок
   */
  static async getPublicBuilds(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): Promise<BuildsListResponse> {
    try {
      const skip = (page - 1) * limit;

      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [builds, total] = await Promise.all([
        prisma.build.findMany({
          where: { isPublic: true },
          orderBy,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            components: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    category: true,
                    price: true,
                    currency: true,
                    images: true,
                    specs: true
                  }
                }
              }
            }
          }
        }),
        prisma.build.count({ where: { isPublic: true } })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        builds: builds.map((build: any) => this.mapBuild(build)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error fetching public builds:', error);
      throw new Error('Ошибка при получении публичных сборок');
    }
  }

  /**
   * Получение сборки по ID
   */
  static async getBuildById(id: string, requestUserId?: string): Promise<BuildResponse> {
    try {
      const build = await prisma.build.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          components: {
            include: {
              component: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  model: true,
                  category: true,
                  price: true,
                  currency: true,
                  images: true,
                  specs: true
                }
              }
            }
          }
        }
      });

      if (!build) {
        throw new Error('Сборка не найдена');
      }

      // Проверяем доступ к приватной сборке
      if (!build.isPublic && build.userId !== requestUserId) {
        throw new Error('Доступ запрещен');
      }

      return this.mapBuild(build);
    } catch (error) {
      console.error('Error fetching build by ID:', error);
      throw error;
    }
  }

  /**
   * Создание новой сборки
   */
  static async createBuild(data: CreateBuildRequest): Promise<BuildResponse> {
    try {
      // Получаем все componentId из запроса
      const componentIds = Object.values(data.components).map((comp: BuildComponentData) => comp.componentId);

      // Проверяем, что все компоненты существуют
      const components = await prisma.component.findMany({
        where: { id: { in: componentIds } },
        select: { id: true, price: true }
      });

      // Проверяем, что все запрошенные компоненты найдены
      const foundComponentIds = components.map(c => c.id);
      const missingComponentIds = componentIds.filter(id => !foundComponentIds.includes(id));

      if (missingComponentIds.length > 0) {
        throw new Error(`Компоненты не найдены: ${missingComponentIds.join(', ')}`);
      }

      // Вычисляем общую стоимость
      const totalPrice = Object.values(data.components).reduce((sum: number, comp: BuildComponentData) => {
        const component = components.find((c: any) => c.id === comp.componentId);
        return sum + (component ? component.price * comp.quantity : 0);
      }, 0);

      // Создаем сборку в транзакции
      const build = await prisma.$transaction(async (tx: any) => {
        // Проверяем, что пользователь существует
        const userExists = await tx.user.findUnique({
          where: { id: data.userId },
          select: { id: true }
        });

        if (!userExists) {
          throw new Error(`Пользователь с ID ${data.userId} не найден`);
        }

        // Создаем сборку
        const newBuild = await tx.build.create({
          data: {
            name: data.name,
            description: data.description,
            totalPrice,
            isPublic: data.isPublic || false,
            userId: data.userId
          }
        });

        // Добавляем компоненты по одному для лучшей диагностики ошибок
        for (const [category, comp] of Object.entries(data.components)) {
          try {
            await tx.buildComponent.create({
              data: {
                buildId: newBuild.id,
                componentId: comp.componentId,
                quantity: comp.quantity || 1
              }
            });
          } catch (error) {
            console.error(`Ошибка создания связи для компонента ${comp.componentId}:`, error);
            throw new Error(`Не удалось добавить компонент ${comp.componentId} в сборку`);
          }
        }

        // Возвращаем сборку с компонентами
        return tx.build.findUnique({
          where: { id: newBuild.id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            components: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    category: true,
                    price: true,
                    currency: true,
                    images: true,
                    specs: true
                  }
                }
              }
            }
          }
        });
      });

      if (!build) {
        throw new Error('Ошибка создания сборки');
      }

      return this.mapBuild(build);
    } catch (error) {
      console.error('Error creating build:', error);

      // Более детальная обработка ошибок
      if (error instanceof Error) {
        throw error; // Пробрасываем уже обработанные ошибки
      }

      throw new Error('Ошибка при создании сборки');
    }
  }

  /**
   * Обновление сборки
   */
  static async updateBuild(id: string, userId: string, data: UpdateBuildRequest): Promise<BuildResponse> {
    try {
      // Проверяем существование и владельца
      const existingBuild = await prisma.build.findUnique({
        where: { id }
      });

      if (!existingBuild) {
        throw new Error('Сборка не найдена');
      }

      if (existingBuild.userId !== userId) {
        throw new Error('Доступ запрещен');
      }

      // Обновляем в транзакции
      const build = await prisma.$transaction(async (tx: any) => {
        // Если обновляются компоненты, пересчитываем цену
        let updateData: any = {
          ...data,
          updatedAt: new Date()
        };

        if (data.components) {
          // Проверяем, что все новые компоненты существуют
          const componentIds = Object.values(data.components).map((comp: BuildComponentData) => comp.componentId);

          const components = await tx.component.findMany({
            where: { id: { in: componentIds } },
            select: { id: true, price: true }
          });

          const foundComponentIds = components.map((c: any) => c.id);
          const missingComponentIds = componentIds.filter(id => !foundComponentIds.includes(id));

          if (missingComponentIds.length > 0) {
            throw new Error(`Компоненты не найдены: ${missingComponentIds.join(', ')}`);
          }

          // Удаляем старые компоненты
          await tx.buildComponent.deleteMany({
            where: { buildId: id }
          });

          // Вычисляем новую стоимость
          const totalPrice = Object.values(data.components).reduce((sum: number, comp: BuildComponentData) => {
            const component = components.find((c: any) => c.id === comp.componentId);
            return sum + (component ? component.price * comp.quantity : 0);
          }, 0);

          updateData.totalPrice = totalPrice;

          // Добавляем новые компоненты по одному
          for (const [category, comp] of Object.entries(data.components)) {
            try {
              await tx.buildComponent.create({
                data: {
                  buildId: id,
                  componentId: comp.componentId,
                  quantity: comp.quantity || 1
                }
              });
            } catch (error) {
              console.error(`Ошибка обновления связи для компонента ${comp.componentId}:`, error);
              throw new Error(`Не удалось обновить компонент ${comp.componentId} в сборке`);
            }
          }
        }

        // Обновляем сборку
        await tx.build.update({
          where: { id },
          data: updateData
        });

        // Возвращаем обновленную сборку
        return tx.build.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            components: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    category: true,
                    price: true,
                    currency: true,
                    images: true,
                    specs: true
                  }
                }
              }
            }
          }
        });
      });

      if (!build) {
        throw new Error('Ошибка обновления сборки');
      }

      return this.mapBuild(build);
    } catch (error) {
      console.error('Error updating build:', error);
      throw error;
    }
  }

  /**
   * Удаление сборки
   */
  static async deleteBuild(id: string, userId: string): Promise<{ message: string }> {
    try {
      // Проверяем существование и владельца
      const existingBuild = await prisma.build.findUnique({
        where: { id }
      });

      if (!existingBuild) {
        throw new Error('Сборка не найдена');
      }

      if (existingBuild.userId !== userId) {
        throw new Error('Доступ запрещен');
      }

      // Удаляем в транзакции
      await prisma.$transaction([
        prisma.buildComponent.deleteMany({ where: { buildId: id } }),
        prisma.build.delete({ where: { id } })
      ]);

      return { message: 'Сборка успешно удалена' };
    } catch (error) {
      console.error('Error deleting build:', error);
      throw error;
    }
  }

  /**
   * Копирование сборки
   */
  static async copyBuild(id: string, userId: string, name: string): Promise<BuildResponse> {
    try {
      // Получаем оригинальную сборку
      const originalBuild = await prisma.build.findUnique({
        where: { id },
        include: {
          components: true
        }
      });

      if (!originalBuild) {
        throw new Error('Сборка не найдена');
      }

      if (!originalBuild.isPublic) {
        throw new Error('Приватная сборка');
      }

      // Создаем копию
      const components: Record<string, BuildComponentData> = {};

      originalBuild.components.forEach((bc: any, index: number) => {
        components[`component_${index}`] = {
          componentId: bc.componentId,
          quantity: bc.quantity
        };
      });

      const buildData: CreateBuildRequest = {
        name,
        description: `Копия сборки: ${originalBuild.name}`,
        isPublic: false,
        userId,
        components
      };

      return this.createBuild(buildData);
    } catch (error) {
      console.error('Error copying build:', error);
      throw error;
    }
  }
}
