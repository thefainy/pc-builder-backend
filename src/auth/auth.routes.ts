import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticateToken } from './auth.middleware';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './auth.schema';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Регистрация нового пользователя
 * @access  Public
 */
router.post('/register', validate(registerSchema), (req, res, next) => {
  AuthController.register(req, res).catch(next);
});

/**
 * @route   POST /api/auth/login
 * @desc    Вход пользователя в систему
 * @access  Public
 */
router.post('/login', validate(loginSchema), (req, res, next) => {
  AuthController.login(req, res).catch(next);
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Обновление токенов доступа
 * @access  Public
 */
router.post('/refresh', (req, res, next) => {
  AuthController.refreshTokens(req, res).catch(next);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Выход из системы
 * @access  Private
 */
router.post('/logout', authenticateToken, (req, res, next) => {
  AuthController.logout(req, res).catch(next);
});

/**
 * @route   GET /api/auth/me
 * @desc    Получение текущего пользователя
 * @access  Private
 */
router.get('/me', authenticateToken, (req, res, next) => {
  AuthController.getCurrentUser(req, res).catch(next);
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Обновление профиля пользователя
 * @access  Private
 */
router.put('/profile', authenticateToken, validate(updateProfileSchema), (req, res, next) => {
  AuthController.updateProfile(req, res).catch(next);
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Смена пароля
 * @access  Private
 */
router.put('/change-password', authenticateToken, validate(changePasswordSchema), (req, res, next) => {
  AuthController.changePassword(req, res).catch(next);
});

export default router;