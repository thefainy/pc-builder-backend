// src/types/component.types.ts
// @ts-ignore
import { ComponentCategory } from '@prisma/client';

export interface CreateComponentRequest {
  name: string;
  brand: string;
  model: string;
  category: ComponentCategory;
  price: number;
  currency?: string;
  specs: Record<string, any>;
  images?: string[];
  description?: string;
  features?: string[];
  inStock?: boolean;
}

export interface UpdateComponentRequest extends Partial<CreateComponentRequest> { }

export interface ComponentSearchQuery {
  search?: string;
  category?: ComponentCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price' | 'rating' | 'name' | 'popularity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ComponentResponse {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: ComponentCategory;
  price: number;
  currency: string;
  specs: Record<string, any>;
  images: string[];
  description?: string | null;
  features: string[];
  inStock: boolean;
  popularity: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentsListResponse {
  components: ComponentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Экспортируем для совместимости с frontend
export { ComponentCategory };

// Prisma типы для внутреннего использования
export type PrismaComponent = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: ComponentCategory;
  price: number;
  currency: string;
  specs: any; // Json type from Prisma
  images: string[];
  description: string | null;
  features: string[];
  inStock: boolean;
  popularity: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
};
