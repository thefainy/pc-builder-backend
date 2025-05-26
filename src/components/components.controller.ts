import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import type { ComponentSearchQuery, CreateComponentRequest, UpdateComponentRequest } from '../types/component.types';
import { ComponentsService } from './components.service';

export class ComponentsController {
  /**
   * Валидация для создания компонента
   */
  static createValidation = [
    body('name')
      .notEmpty()
      .isLength({ min: 2, max: 200 })
      .withMessage('Название должно содержать от 2 до 200 символов'),
    body('brand')
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage('Бренд должен содержать от 2 до 100 символов'),
    body('model')
      .notEmpty()
      .isLength({ min: 1, max: 100 })
      .withMessage('Модель должна содержать от 1 до 100 символов'),
    body('category')
      .isIn(['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLING', 'PERIPHERALS'])
      .withMessage('Некорректная категория'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Цена должна быть положительным числом'),
    body('specs')
      .isObject()
      .withMessage('Характеристики должны быть объектом'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Изображения должны быть массивом'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Особенности должны быть массивом'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Описание не должно превышать 1000 символов')
  ];

  /**
   * Валидация для поиска
   */
  static searchValidation = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage('Страница должна быть положительным числом'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Лимит должен быть от 1 до 100'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .toFloat()
      .withMessage('Минимальная цена должна быть положительной'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .toFloat()
      .withMessage('Максимальная цена должна быть положительной'),
    query('sortBy')
      .optional()
      .isIn(['price', 'rating', 'name', 'popularity', 'createdAt'])
      .withMessage('Некорректное поле сортировки'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Порядок сортировки должен быть asc или desc')
  ];

  /**
   * Получение списка компонентов
   */
  static async getComponents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Проверяем валидацию
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Ошибка валидации',
          details: errors.array()
        });
        return;
      }

      const searchQuery: ComponentSearchQuery = {
        search: req.query.search as string,
        category: req.query.category as any,
        brand: req.query.brand as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
        sortBy: (req.query.sortBy as any) || 'popularity',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await ComponentsService.getComponents(searchQuery);

      res.status(200).json({
        message: 'Компоненты получены успешно',
        data: result
      });
    } catch (error) {
      console.error('Get components error:', error);
      next(error);
    }
  }

  /**
   * Получение компонента по ID
   */
  static async getComponentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID компонента обязателен'
        });
        return;
      }

      const component = await ComponentsService.getComponentById(id);

      res.status(200).json({
        message: 'Компонент получен успешно',
        data: component
      });
    } catch (error) {
      console.error('Get component by ID error:', error);

      if (error instanceof Error && error.message === 'Компонент не найден') {
        res.status(404).json({
          error: 'Компонент не найден'
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Создание компонента (только для админов)
   */
  static async createComponent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Проверяем валидацию
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Ошибка валидации',
          details: errors.array()
        });
        return;
      }

      const componentData: CreateComponentRequest = {
        name: req.body.name,
        brand: req.body.brand,
        model: req.body.model,
        category: req.body.category,
        price: req.body.price,
        currency: req.body.currency || 'KZT',
        specs: req.body.specs || {},
        images: req.body.images || [],
        description: req.body.description,
        features: req.body.features || [],
        inStock: req.body.inStock !== undefined ? req.body.inStock : true
      };

      const component = await ComponentsService.createComponent(componentData);

      res.status(201).json({
        message: 'Компонент создан успешно',
        data: component
      });
    } catch (error) {
      console.error('Create component error:', error);
      next(error);
    }
  }

  /**
   * Обновление компонента (только для админов)
   */
  static async updateComponent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID компонента обязателен'
        });
        return;
      }

      const updateData: UpdateComponentRequest = req.body;

      const component = await ComponentsService.updateComponent(id, updateData);

      res.status(200).json({
        message: 'Компонент обновлен успешно',
        data: component
      });
    } catch (error) {
      console.error('Update component error:', error);

      if (error instanceof Error && error.message === 'Компонент не найден') {
        res.status(404).json({
          error: 'Компонент не найден'
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Удаление компонента (только для админов)
   */
  static async deleteComponent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID компонента обязателен'
        });
        return;
      }

      const result = await ComponentsService.deleteComponent(id);

      res.status(200).json({
        message: result.message
      });
    } catch (error) {
      console.error('Delete component error:', error);

      if (error instanceof Error && error.message === 'Компонент не найден') {
        res.status(404).json({
          error: 'Компонент не найден'
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Получение популярных компонентов
   */
  static async getPopularComponents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const components = await ComponentsService.getPopularComponents(limit);

      res.status(200).json({
        message: 'Популярные компоненты получены успешно',
        data: components
      });
    } catch (error) {
      console.error('Get popular components error:', error);
      next(error);
    }
  }

  /**
   * Получение компонентов по категории
   */
  static async getComponentsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!category) {
        res.status(400).json({
          error: 'Категория обязательна'
        });
        return;
      }

      const components = await ComponentsService.getComponentsByCategory(category, limit);

      res.status(200).json({
        message: `Компоненты категории ${category} получены успешно`,
        data: components
      });
    } catch (error) {
      console.error('Get components by category error:', error);
      next(error);
    }
  }

  /**
   * Получение статистики компонентов (только для админов)
   */
  static async getComponentsStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ComponentsService.getComponentsStats();

      res.status(200).json({
        message: 'Статистика получена успешно',
        data: stats
      });
    } catch (error) {
      console.error('Get components stats error:', error);
      next(error);
    }
  }
}
