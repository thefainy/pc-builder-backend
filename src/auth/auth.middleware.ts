import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { JwtPayload } from '../utils/jwt';

// Расширяем тип Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string; // Дублируем для совместимости
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

/**
 * Middleware для проверки аутентификации
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token обязателен' });
      return;
    }

    // Верифицируем токен
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Получаем пользователя из БД для актуальных данных
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isVerified: true
      }
    });

    if (!user || !user.isVerified) {
      res.status(401).json({ error: 'Пользователь не найден или не подтвержден' });
      return;
    }

    // Добавляем пользователя в request
    req.user = {
      id: user.id,
      userId: user.id, // Для совместимости
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Недействительный access token' });
    return;
  }
};

/**
 * Middleware для проверки роли пользователя
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Пользователь не аутентифицирован',
        message: 'Сначала выполните аутентификацию'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Недостаточно прав',
        message: `Требуется роль: ${roles.join(' или ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware только для администраторов
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware для администраторов и модераторов
 */
export const requireModerator = requireRole(['ADMIN', 'MODERATOR']);

/**
 * Optional authentication - не требует токен, но если он есть, то верифицирует
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Если токена нет - просто продолжаем без пользователя
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    // Если токен есть - пытаемся его верифицировать
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isVerified: true
      }
    });

    if (user && user.isVerified) {
      req.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined
      };
    }

    next();
  } catch (error) {
    // Если токен невалидный - просто продолжаем без пользователя
    next();
  }
};
