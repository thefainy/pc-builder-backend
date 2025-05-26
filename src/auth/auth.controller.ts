import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateTokenPair, JwtPayload } from '../utils/jwt';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';

const prisma = new PrismaClient();

export class AuthController {
  /**
   * Регистрация пользователя
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Валидация пароля
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Слабый пароль',
          details: passwordValidation.errors
        });
        return;
      }

      // Проверяем существование пользователя
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        const errorMessage = existingUser.email === email.toLowerCase()
          ? 'Пользователь с таким email уже существует'
          : 'Пользователь с таким username уже существует';

        res.status(400).json({ error: errorMessage });
        return;
      }

      // Хешируем пароль
      const hashedPassword = await hashPassword(password);

      // Создаем пользователя (без поля name - используем firstName и lastName)
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role: 'USER',
          isVerified: true // В production должно быть false до подтверждения email
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true
        }
      });

      // Генерируем токены
      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const tokens = generateTokenPair(jwtPayload);

      // Сохраняем refresh token в БД (опционально)
      try {
        await prisma.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
          }
        });
      } catch (refreshTokenError) {
        // Если таблица RefreshToken не существует, просто логируем
        console.warn('RefreshToken table not found, skipping refresh token storage');
      }

      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            // Создаем поле name из firstName и lastName
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username,
            role: user.role,
            isVerified: user.isVerified
          },
          tokens
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        error: 'Ошибка регистрации',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Вход пользователя
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Ищем пользователя
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        res.status(400).json({ error: 'Неверный email или пароль' });
        return;
      }

      // Проверяем пароль
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({ error: 'Неверный email или пароль' });
        return;
      }

      // Проверяем подтверждение аккаунта
      if (!user.isVerified) {
        res.status(400).json({ error: 'Аккаунт не подтвержден. Проверьте свой email' });
        return;
      }

      // Генерируем токены
      const jwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const tokens = generateTokenPair(jwtPayload);

      // Сохраняем refresh token в БД (опционально)
      try {
        await prisma.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
          }
        });
      } catch (refreshTokenError) {
        console.warn('RefreshToken table not found, skipping refresh token storage');
      }

      // Обновляем время последнего входа
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });

      res.json({
        message: 'Успешный вход в систему',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            // Создаем поле name из firstName и lastName
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username,
            role: user.role,
            isVerified: user.isVerified
          },
          tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Ошибка входа',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Обновление токенов
   */
  static async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token обязателен' });
        return;
      }

      // Верифицируем refresh token
      const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
      const payload = jwt.verify(refreshToken, secret) as JwtPayload;

      // Проверяем существование refresh token в БД (опционально)
      try {
        const token = await prisma.refreshToken.findFirst({
          where: {
            token: refreshToken,
            userId: payload.userId,
            expiresAt: {
              gt: new Date() // Токен еще не истек
            }
          }
        });

        if (!token) {
          res.status(401).json({ error: 'Недействительный refresh token' });
          return;
        }
      } catch (refreshTokenError) {
        console.warn('RefreshToken table not found, skipping token validation');
      }

      // Проверяем существование пользователя
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true
        }
      });

      if (!user || !user.isVerified) {
        res.status(401).json({ error: 'Пользователь не найден или не подтвержден' });
        return;
      }

      // Генерируем новые токены
      const newJwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const newTokens = generateTokenPair(newJwtPayload);

      // Обновляем refresh token в БД (опционально)
      try {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: {
            token: newTokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      } catch (refreshTokenError) {
        console.warn('RefreshToken table not found, skipping token update');
      }

      res.json({
        message: 'Токены обновлены успешно',
        data: newTokens
      });
    } catch (error) {
      console.error('Refresh tokens error:', error);
      res.status(401).json({ error: 'Недействительный refresh token' });
    }
  }

  /**
   * Получение текущего пользователя
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return;
      }

      res.json({
        message: 'Профиль пользователя получен успешно',
        data: {
          ...user,
          // Добавляем виртуальное поле name
          name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'Ошибка получения профиля',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Обновление профиля
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || req.user?.id;
      const { firstName, lastName, avatar } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(avatar !== undefined && { avatar }),
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Профиль обновлен успешно',
        data: {
          ...user,
          // Добавляем виртуальное поле name
          name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Ошибка обновления профиля',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Смена пароля
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Пользователь не аутентифицирован' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return;
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ error: 'Неверный текущий пароль' });
        return;
      }

      // Валидируем новый пароль
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Слабый пароль',
          details: passwordValidation.errors
        });
        return;
      }

      // Хешируем новый пароль и обновляем
      const hashedNewPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Ошибка смены пароля',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Выход из системы (logout)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Удаляем refresh token из БД (опционально)
      if (refreshToken) {
        try {
          await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
          });
        } catch (refreshTokenError) {
          console.warn('RefreshToken table not found, skipping token deletion');
        }
      }

      res.json({ message: 'Выход выполнен успешно' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Ошибка выхода',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }
}
