// src/components/components.schema.ts
import { z } from 'zod';
import { ComponentCategory } from '../types/component.types';

// Получаем список валидных категорий
const validCategories = Object.values(ComponentCategory) as [string, ...string[]];

export const createComponentSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Название должно содержать минимум 2 символа')
      .max(200, 'Название не должно превышать 200 символов'),
    brand: z.string()
      .min(2, 'Бренд должен содержать минимум 2 символа')
      .max(100, 'Бренд не должен превышать 100 символов'),
    model: z.string()
      .min(1, 'Модель обязательна')
      .max(100, 'Модель не должна превышать 100 символов'),
    category: z.enum(validCategories, {
      errorMap: () => ({ message: 'Некорректная категория компонента' })
    }),
    price: z.number()
      .positive('Цена должна быть положительным числом')
      .max(10000000, 'Цена слишком высокая'),
    currency: z.string()
      .min(1, 'Валюта обязательна')
      .default('KZT'),
    description: z.string()
      .max(1000, 'Описание не должно превышать 1000 символов')
      .optional(),
    inStock: z.boolean()
      .default(true),
    specs: z.record(z.string(), z.any())
      .default({}),
    features: z.array(z.string())
      .max(20, 'Максимум 20 особенностей')
      .default([]),
    images: z.array(z.string().url('Некорректный URL изображения'))
      .max(10, 'Максимум 10 изображений')
      .default([]),
  }),
});

export const updateComponentSchema = z.object({
  params: z.object({
    id: z.string()
      .uuid('Некорректный формат ID')
      .min(1, 'ID обязателен'),
  }),
  body: createComponentSchema.shape.body.partial(),
});

export const getComponentByIdSchema = z.object({
  params: z.object({
    id: z.string()
      .uuid('Некорректный формат ID')
      .min(1, 'ID обязателен'),
  }),
});

export const getComponentsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.enum(validCategories).optional(),
    brand: z.string().optional(),
    minPrice: z.string()
      .transform(val => val ? parseFloat(val) : undefined)
      .refine(val => val === undefined || val >= 0, 'Минимальная цена должна быть неотрицательной')
      .optional(),
    maxPrice: z.string()
      .transform(val => val ? parseFloat(val) : undefined)
      .refine(val => val === undefined || val >= 0, 'Максимальная цена должна быть неотрицательной')
      .optional(),
    inStock: z.string()
      .transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
      .optional(),
    sortBy: z.enum(['price', 'rating', 'name', 'popularity', 'createdAt'])
      .default('popularity'),
    sortOrder: z.enum(['asc', 'desc'])
      .default('desc'),
    page: z.string()
      .transform(val => parseInt(val) || 1)
      .refine(val => val >= 1, 'Страница должна быть положительным числом')
      .default('1'),
    limit: z.string()
      .transform(val => parseInt(val) || 20)
      .refine(val => val >= 1 && val <= 100, 'Лимит должен быть от 1 до 100')
      .default('20'),
  }),
});
