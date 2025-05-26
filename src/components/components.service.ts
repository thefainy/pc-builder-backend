// src/components/components.service.ts
import prisma from '../config/database';
import type {
  ComponentResponse,
  ComponentSearchQuery,
  ComponentsListResponse,
  CreateComponentRequest,
  UpdateComponentRequest,
  PrismaComponent
} from '../types/component.types';

export class ComponentsService {
  /**
   * Маппер компонента из Prisma в API формат
   */
  private static mapComponent(comp: PrismaComponent): ComponentResponse {
    const specs = comp.specs as Record<string, any> || {};
    return {
      id: comp.id,
      name: comp.name,
      brand: comp.brand,
      model: comp.model,
      category: comp.category,
      price: comp.price,
      currency: comp.currency,
      specs: specs,
      features: comp.features || [],
      images: comp.images || [],
      rating: typeof comp.rating === 'number' ? comp.rating : 4.5,
      description: comp.description || undefined,
      inStock: comp.inStock,
      popularity: comp.popularity,
      createdAt: comp.createdAt,
      updatedAt: comp.updatedAt
    };
  }

  /**
   * Получение всех компонентов с пагинацией и фильтрами
   */
  static async getComponents(query: ComponentSearchQuery): Promise<ComponentsListResponse> {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = query;

    // Строим условия для поиска
    const where: any = {};

    // Поиск по названию, бренду или модели
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Фильтр по категории
    if (category) {
      where.category = category;
    }

    // Фильтр по бренду
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    // Фильтр по цене
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Фильтр по наличию
    if (inStock !== undefined) {
      where.inStock = inStock;
    }

    // Сортировка
    const orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'rating':
        orderBy.rating = sortOrder;
        break;
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.popularity = sortOrder;
    }

    // Пагинация
    const skip = (page - 1) * limit;

    try {
      // Выполняем запросы параллельно
      const [components, total] = await Promise.all([
        prisma.component.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.component.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        components: components.map((comp: PrismaComponent) => this.mapComponent(comp)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      console.error('Error fetching components:', error);
      throw new Error('Ошибка при получении компонентов');
    }
  }

  /**
   * Получение компонента по ID
   */
  static async getComponentById(id: string): Promise<ComponentResponse> {
    try {
      const component = await prisma.component.findUnique({
        where: { id },
        include: {
          reviews: {
            select: {
              id: true,
              rating: true,
              title: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!component) {
        throw new Error('Компонент не найден');
      }

      // Увеличиваем популярность при просмотре
      await prisma.component.update({
        where: { id },
        data: { popularity: { increment: 1 } }
      });

      return this.mapComponent(component as PrismaComponent);
    } catch (error) {
      console.error('Error fetching component:', error);
      if (error instanceof Error && error.message === 'Компонент не найден') {
        throw error;
      }
      throw new Error('Ошибка при получении компонента');
    }
  }

  /**
   * Создание нового компонента (только для админов)
   */
  static async createComponent(data: CreateComponentRequest): Promise<ComponentResponse> {
    try {
      // Валидация данных
      if (!data.name || !data.brand || !data.category || data.price <= 0) {
        throw new Error('Некорректные данные компонента');
      }

      const component = await prisma.component.create({
        data: {
          name: data.name,
          brand: data.brand,
          model: data.model,
          category: data.category,
          price: data.price,
          currency: data.currency || 'KZT',
          specs: data.specs || {},
          images: data.images || [],
          description: data.description,
          features: data.features || [],
          inStock: data.inStock !== undefined ? data.inStock : true,
          popularity: 0,
          rating: 0.0
        }
      });

      return this.mapComponent(component as PrismaComponent);
    } catch (error) {
      console.error('Error creating component:', error);
      throw new Error('Ошибка при создании компонента');
    }
  }

  /**
   * Обновление компонента (только для админов)
   */
  static async updateComponent(id: string, data: UpdateComponentRequest): Promise<ComponentResponse> {
    try {
      // Проверяем существование компонента
      const existingComponent = await prisma.component.findUnique({
        where: { id }
      });

      if (!existingComponent) {
        throw new Error('Компонент не найден');
      }

      const component = await prisma.component.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      return this.mapComponent(component as PrismaComponent);
    } catch (error) {
      console.error('Error updating component:', error);
      if (error instanceof Error && error.message === 'Компонент не найден') {
        throw error;
      }
      throw new Error('Ошибка при обновлении компонента');
    }
  }

  /**
   * Удаление компонента (только для админов)
   */
  static async deleteComponent(id: string): Promise<{ message: string }> {
    try {
      // Проверяем существование компонента
      const existingComponent = await prisma.component.findUnique({
        where: { id }
      });

      if (!existingComponent) {
        throw new Error('Компонент не найден');
      }

      // Удаляем связанные записи
      await prisma.$transaction([
        // Удаляем из wishlist'ов
        prisma.wishlistItem.deleteMany({ where: { componentId: id } }),
        // Удаляем из сборок
        prisma.buildComponent.deleteMany({ where: { componentId: id } }),
        // Удаляем отзывы
        prisma.review.deleteMany({ where: { componentId: id } }),
        // Удаляем сам компонент
        prisma.component.delete({ where: { id } })
      ]);

      return { message: 'Компонент успешно удален' };
    } catch (error) {
      console.error('Error deleting component:', error);
      if (error instanceof Error && error.message === 'Компонент не найден') {
        throw error;
      }
      throw new Error('Ошибка при удалении компонента');
    }
  }

  /**
   * Получение популярных компонентов
   */
  static async getPopularComponents(limit: number = 10): Promise<ComponentResponse[]> {
    try {
      const components = await prisma.component.findMany({
        where: { inStock: true },
        orderBy: { popularity: 'desc' },
        take: limit
      });

      return components.map((comp: PrismaComponent) => this.mapComponent(comp));
    } catch (error) {
      console.error('Error fetching popular components:', error);
      throw new Error('Ошибка при получении популярных компонентов');
    }
  }

  /**
   * Получение компонентов по категории
   */
  static async getComponentsByCategory(category: string, limit: number = 20): Promise<ComponentResponse[]> {
    try {
      const components = await prisma.component.findMany({
        where: {
          category: category as any,
          inStock: true
        },
        orderBy: { popularity: 'desc' },
        take: limit
      });

      return components.map((comp: PrismaComponent) => this.mapComponent(comp));
    } catch (error) {
      console.error('Error fetching components by category:', error);
      throw new Error('Ошибка при получении компонентов по категории');
    }
  }

  /**
   * Получение статистики компонентов
   */
  static async getComponentsStats() {
    try {
      const [
        total,
        inStock,
        byCategory,
        avgPrice
      ] = await Promise.all([
        prisma.component.count(),
        prisma.component.count({ where: { inStock: true } }),
        prisma.component.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        prisma.component.aggregate({
          _avg: { price: true }
        })
      ]);

      return {
        total,
        inStock,
        outOfStock: total - inStock,
        byCategory: byCategory.reduce((acc: Record<string, number>, item: any) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        averagePrice: Math.round(avgPrice._avg.price || 0)
      };
    } catch (error) {
      console.error('Error fetching components stats:', error);
      throw new Error('Ошибка при получении статистики компонентов');
    }
  }
}
