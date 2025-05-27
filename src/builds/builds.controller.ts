import { Request, Response, NextFunction } from 'express';
import { BuildsService } from './builds.service';
import type { CreateBuildRequest, UpdateBuildRequest } from '../types/build.types';

export class BuildsController {
  /**
   * Получение всех сборок пользователя
   */
  static async getUserBuilds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1 || limit > 50) {
        res.status(400).json({ error: 'Некорректные параметры пагинации' });
        return;
      }

      const result = await BuildsService.getUserBuilds(userId, page, limit);

      res.status(200).json({
        message: 'Сборки получены успешно',
        data: result
      });
    } catch (error) {
      console.error('Get user builds error:', error);
      next(error);
    }
  }

  /**
   * Получение публичных сборок
   */
  static async getPublicBuilds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      if (page < 1 || limit < 1 || limit > 50) {
        res.status(400).json({ error: 'Некорректные параметры пагинации' });
        return;
      }

      const validSortFields = ['createdAt', 'name', 'totalPrice'];
      if (!validSortFields.includes(sortBy)) {
        res.status(400).json({ error: 'Некорректное поле сортировки' });
        return;
      }

      if (!['asc', 'desc'].includes(sortOrder)) {
        res.status(400).json({ error: 'Некорректный порядок сортировки' });
        return;
      }

      const result = await BuildsService.getPublicBuilds(page, limit, sortBy, sortOrder);

      res.status(200).json({
        message: 'Публичные сборки получены успешно',
        data: result
      });
    } catch (error) {
      console.error('Get public builds error:', error);
      next(error);
    }
  }

  /**
   * Получение сборки по ID
   */
  static async getBuildById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        res.status(400).json({ error: 'ID сборки обязателен' });
        return;
      }

      const build = await BuildsService.getBuildById(id, userId);

      res.status(200).json({
        message: 'Сборка получена успешно',
        data: build
      });
    } catch (error) {
      console.error('Get build by ID error:', error);

      if (error instanceof Error) {
        if (error.message === 'Сборка не найдена') {
          res.status(404).json({ error: 'Сборка не найдена' });
          return;
        }
        if (error.message === 'Доступ запрещен') {
          res.status(403).json({ error: 'Доступ к приватной сборке запрещен' });
          return;
        }
      }

      next(error);
    }
  }

  /**
   * Создание новой сборки
   */
  static async createBuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const buildData: CreateBuildRequest = {
        ...req.body,
        userId
      };

      // Валидация данных
      if (!buildData.name || buildData.name.trim().length < 3) {
        res.status(400).json({ error: 'Название сборки должно содержать минимум 3 символа' });
        return;
      }

      if (!buildData.components || Object.keys(buildData.components).length === 0) {
        res.status(400).json({ error: 'Сборка должна содержать хотя бы один компонент' });
        return;
      }

      const build = await BuildsService.createBuild(buildData);

      res.status(201).json({
        message: 'Сборка создана успешно',
        data: build
      });
    } catch (error) {
      console.error('Create build error:', error);
      next(error);
    }
  }

  /**
   * Обновление сборки
   */
  static async updateBuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        res.status(400).json({ error: 'ID сборки обязателен' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const updateData: UpdateBuildRequest = req.body;

      const build = await BuildsService.updateBuild(id, userId, updateData);

      res.status(200).json({
        message: 'Сборка обновлена успешно',
        data: build
      });
    } catch (error) {
      console.error('Update build error:', error);

      if (error instanceof Error) {
        if (error.message === 'Сборка не найдена') {
          res.status(404).json({ error: 'Сборка не найдена' });
          return;
        }
        if (error.message === 'Доступ запрещен') {
          res.status(403).json({ error: 'Вы можете редактировать только свои сборки' });
          return;
        }
      }

      next(error);
    }
  }

  /**
   * Удаление сборки
   */
  static async deleteBuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        res.status(400).json({ error: 'ID сборки обязателен' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const result = await BuildsService.deleteBuild(id, userId);

      res.status(200).json({
        message: result.message
      });
    } catch (error) {
      console.error('Delete build error:', error);

      if (error instanceof Error) {
        if (error.message === 'Сборка не найдена') {
          res.status(404).json({ error: 'Сборка не найдена' });
          return;
        }
        if (error.message === 'Доступ запрещен') {
          res.status(403).json({ error: 'Вы можете удалять только свои сборки' });
          return;
        }
      }

      next(error);
    }
  }

  /**
   * Копирование чужой сборки
   */
  static async copyBuild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { name } = req.body;

      if (!id) {
        res.status(400).json({ error: 'ID сборки обязателен' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      if (!name || name.trim().length < 3) {
        res.status(400).json({ error: 'Название новой сборки обязательно (минимум 3 символа)' });
        return;
      }

      const build = await BuildsService.copyBuild(id, userId, name.trim());

      res.status(201).json({
        message: 'Сборка скопирована успешно',
        data: build
      });
    } catch (error) {
      console.error('Copy build error:', error);

      if (error instanceof Error) {
        if (error.message === 'Сборка не найдена') {
          res.status(404).json({ error: 'Сборка для копирования не найдена' });
          return;
        }
        if (error.message === 'Приватная сборка') {
          res.status(403).json({ error: 'Нельзя копировать приватную сборку' });
          return;
        }
      }

      next(error);
    }
  }
}
