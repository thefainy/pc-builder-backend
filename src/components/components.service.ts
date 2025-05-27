import prisma from '../config/database';
import type {
  ComponentResponse,
  ComponentsListResponse,
  CreateComponentRequest,
  UpdateComponentRequest,
  ComponentSearchQuery
} from '../types/component.types';

export class ComponentsService {
  /**
   * Маппер компонента из Prisma в API формат
   */
  private static mapComponent(component: any): ComponentResponse {
    return {
      id: component.id,
      name: component.name,
      brand: component.brand,
      model: component.model,
      category: component.category,
      price: component.price,
      currency: component.currency,
      description: component.description || undefined,
      inStock: component.inStock,
      specs: component.specs || {},
      features: component.features || [],
      images: component.images || [],
      rating: component.rating || 0,
      popularity: component.popularity || 0,
      reviewCount: component.reviewCount || 0,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt
    };
  }

  /**
   * Получение списка компонентов с фильтрами
   */
  static async getComponents(query: ComponentSearchQuery): Promise<ComponentsListResponse> {
    try {
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

      const skip = (page - 1) * limit;

      // Построение условий фильтрации
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (category) {
        where.category = category;
      }

      if (brand) {
        where.brand = { contains: brand, mode: 'insensitive' };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (inStock !== undefined) {
        where.inStock = inStock;
      }

      // Построение сортировки
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
        case 'popularity':
        default:
          orderBy.popularity = sortOrder;
          break;
      }

      const [components, total] = await Promise.all([
        prisma.component.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.component.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        components: components.map(component => this.mapComponent(component)),
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
        where: { id }
      });

      if (!component) {
        throw new Error('Компонент не найден');
      }

      return this.mapComponent(component);
    } catch (error) {
      console.error('Error fetching component by ID:', error);
      throw error;
    }
  }

  /**
   * Создание нового компонента
   */
  static async createComponent(data: CreateComponentRequest): Promise<ComponentResponse> {
    try {
      const component = await prisma.component.create({
        data: {
          name: data.name,
          brand: data.brand,
          model: data.model,
          category: data.category,
          price: data.price,
          currency: data.currency || 'KZT',
          description: data.description,
          inStock: data.inStock !== undefined ? data.inStock : true,
          specs: data.specs || {},
          features: data.features || [],
          images: data.images || []
        }
      });

      return this.mapComponent(component);
    } catch (error) {
      console.error('Error creating component:', error);
      throw new Error('Ошибка при создании компонента');
    }
  }

  /**
   * Обновление компонента
   */
  static async updateComponent(id: string, data: UpdateComponentRequest): Promise<ComponentResponse> {
    try {
      // Проверяем существование
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

      return this.mapComponent(component);
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  /**
   * Удаление компонента
   */
  static async deleteComponent(id: string): Promise<{ message: string }> {
    try {
      // Проверяем существование
      const existingComponent = await prisma.component.findUnique({
        where: { id }
      });

      if (!existingComponent) {
        throw new Error('Компонент не найден');
      }

      await prisma.component.delete({
        where: { id }
      });

      return { message: 'Компонент успешно удален' };
    } catch (error) {
      console.error('Error deleting component:', error);
      throw error;
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

      return components.map(component => this.mapComponent(component));
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
          category: category.toUpperCase() as any,
          inStock: true
        },
        orderBy: { rating: 'desc' },
        take: limit
      });

      return components.map(component => this.mapComponent(component));
    } catch (error) {
      console.error('Error fetching components by category:', error);
      throw new Error('Ошибка при получении компонентов по категории');
    }
  }

  /**
   * Получение статистики компонентов
   */
  static async getComponentsStats(): Promise<any> {
    try {
      const [
        totalComponents,
        inStockComponents,
        categoriesStats,
        priceStats
      ] = await Promise.all([
        prisma.component.count(),
        prisma.component.count({ where: { inStock: true } }),
        prisma.component.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        prisma.component.aggregate({
          _avg: { price: true },
          _min: { price: true },
          _max: { price: true }
        })
      ]);

      return {
        total: totalComponents,
        inStock: inStockComponents,
        outOfStock: totalComponents - inStockComponents,
        categories: categoriesStats.map(stat => ({
          category: stat.category,
          count: stat._count.category
        })),
        priceRange: {
          min: priceStats._min.price,
          max: priceStats._max.price,
          average: priceStats._avg.price
        }
      };
    } catch (error) {
      console.error('Error fetching components stats:', error);
      throw new Error('Ошибка при получении статистики компонентов');
    }
  }
}
