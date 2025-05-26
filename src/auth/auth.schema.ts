// src/auth/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Некорректный формат email')
      .min(1, 'Email обязателен'),
    username: z.string()
      .min(3, 'Username должен содержать минимум 3 символа')
      .max(30, 'Username не должен превышать 30 символов')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username может содержать только буквы, цифры и подчеркивание'),
    password: z.string()
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать минимум одну строчную букву, одну заглавную и одну цифру'),
    firstName: z.string()
      .min(2, 'Имя должно содержать минимум 2 символа')
      .max(50, 'Имя не должно превышать 50 символов')
      .optional(),
    lastName: z.string()
      .min(2, 'Фамилия должна содержать минимум 2 символа')
      .max(50, 'Фамилия не должна превышать 50 символов')
      .optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Некорректный формат email')
      .min(1, 'Email обязателен'),
    password: z.string()
      .min(1, 'Пароль обязателен'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, 'Имя должно содержать минимум 2 символа')
      .max(50, 'Имя не должно превышать 50 символов')
      .optional(),
    lastName: z.string()
      .min(2, 'Фамилия должна содержать минимум 2 символа')
      .max(50, 'Фамилия не должна превышать 50 символов')
      .optional(),
    avatar: z.string()
      .url('Avatar должен быть валидным URL')
      .optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string()
      .min(1, 'Текущий пароль обязателен'),
    newPassword: z.string()
      .min(8, 'Новый пароль должен содержать минимум 8 символов')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Новый пароль должен содержать минимум одну строчную букву, одну заглавную и одну цифру'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token обязателен'),
  }),
});
