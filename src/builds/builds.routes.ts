import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../auth/auth.middleware';
import { BuildsController } from './builds.controller';

const router = Router();

// Wrapper функция для корректной работы с Express
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * @route   GET /api/builds/my
 * @desc    Получить мои сборки
 * @access  Private
 */
router.get('/my',
  authenticateToken,
  asyncHandler(BuildsController.getUserBuilds)
);

/**
 * @route   GET /api/builds/public
 * @desc    Получить публичные сборки
 * @access  Public
 */
router.get('/public',
  asyncHandler(BuildsController.getPublicBuilds)
);

/**
 * @route   GET /api/builds/:id
 * @desc    Получить сборку по ID
 * @access  Public (с ограничениями для приватных)
 */
router.get('/:id',
  optionalAuth,
  asyncHandler(BuildsController.getBuildById)
);

/**
 * @route   POST /api/builds
 * @desc    Создать новую сборку
 * @access  Private
 */
router.post('/',
  authenticateToken,
  asyncHandler(BuildsController.createBuild)
);

/**
 * @route   PUT /api/builds/:id
 * @desc    Обновить сборку
 * @access  Private (только владелец)
 */
router.put('/:id',
  authenticateToken,
  asyncHandler(BuildsController.updateBuild)
);

/**
 * @route   DELETE /api/builds/:id
 * @desc    Удалить сборку
 * @access  Private (только владелец)
 */
router.delete('/:id',
  authenticateToken,
  asyncHandler(BuildsController.deleteBuild)
);

/**
 * @route   POST /api/builds/:id/copy
 * @desc    Скопировать публичную сборку
 * @access  Private
 */
router.post('/:id/copy',
  authenticateToken,
  asyncHandler(BuildsController.copyBuild)
);

export default router;
