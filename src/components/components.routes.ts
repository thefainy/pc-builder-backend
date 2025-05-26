// src/components/components.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth, requireAdmin } from '../auth/auth.middleware';
import { ComponentsController } from './components.controller';

const router = Router();

// Wrapper функция для корректной работы с Express
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * @route   GET /api/components
 * @desc    Получить список компонентов с фильтрами и пагинацией
 * @access  Public
 */
router.get('/',
  asyncHandler(ComponentsController.getComponents)
);

/**
 * @route   GET /api/components/popular
 * @desc    Получить популярные компоненты
 * @access  Public
 */
router.get('/popular', asyncHandler(ComponentsController.getPopularComponents));

/**
 * @route   GET /api/components/category/:category
 * @desc    Получить компоненты по категории
 * @access  Public
 */
router.get('/category/:category', asyncHandler(ComponentsController.getComponentsByCategory));

/**
 * @route   GET /api/components/stats
 * @desc    Получить статистику компонентов
 * @access  Private (Admin only)
 */
router.get('/stats',
  authenticateToken,
  requireAdmin,
  asyncHandler(ComponentsController.getComponentsStats)
);

/**
 * @route   GET /api/components/:id
 * @desc    Получить компонент по ID
 * @access  Public
 */
router.get('/:id',
  optionalAuth,
  asyncHandler(ComponentsController.getComponentById)
);

/**
 * @route   POST /api/components
 * @desc    Создать новый компонент
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  asyncHandler(ComponentsController.createComponent)
);

/**
 * @route   PUT /api/components/:id
 * @desc    Обновить компонент
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(ComponentsController.updateComponent)
);

/**
 * @route   DELETE /api/components/:id
 * @desc    Удалить компонент
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(ComponentsController.deleteComponent)
);

export default router;
