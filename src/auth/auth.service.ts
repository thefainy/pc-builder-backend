import prisma from '../config/database';
import { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, UserProfileResponse } from '../types/auth.types';
import { generateTokenPair, JwtPayload, verifyRefreshToken } from '../utils/jwt';
import { comparePassword, hashPassword, validatePasswordStrength } from '../utils/password';

export class AuthService {
  /**
   * Регистрация нового пользователя
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, username, password, firstName, lastName } = data;

    // Валидация пароля
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Слабый пароль: ${passwordValidation.errors.join(', ')}`);
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
      if (existingUser.email === email.toLowerCase()) {
        throw new Error('Пользователь с таким email уже существует');
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new Error('Пользователь с таким username уже существует');
      }
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
        isVerified: true // В production здесь должно быть false до подтверждения email
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

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens
    };
  }

  /**
   * Вход пользователя в систему
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Неверный email или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Неверный email или пароль');
    }

    // Проверяем подтверждение аккаунта
    if (!user.isVerified) {
      throw new Error('Аккаунт не подтвержден. Проверьте свой email');
    }

    // Генерируем токены
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const tokens = generateTokenPair(jwtPayload);

    // Обновляем время последнего входа (опционально)
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens
    };
  }

  /**
   * Обновление токенов через refresh token
   */
  static async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Верифицируем refresh token
      const payload = verifyRefreshToken(refreshToken);

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
        throw new Error('Пользователь не найден или не подтвержден');
      }

      // Генерируем новые токены
      const newJwtPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      return generateTokenPair(newJwtPayload);
    } catch (error) {
      throw new Error('Недействительный refresh token');
    }
  }

  /**
   * Получение профиля пользователя
   */
  static async getUserProfile(userId: string): Promise<UserProfileResponse> {
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
      throw new Error('Пользователь не найден');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Обновление профиля пользователя
   */
  static async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfileResponse> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
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

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Смена пароля
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    // Получаем текущего пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Неверный текущий пароль');
    }

    // Валидируем новый пароль
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Слабый пароль: ${passwordValidation.errors.join(', ')}`);
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

    return { message: 'Пароль успешно изменен' };
  }
}