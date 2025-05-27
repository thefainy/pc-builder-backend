// src/types/component.types.ts

// Enum для категорий компонентов
export enum ComponentCategory {
  CPU = 'CPU',
  GPU = 'GPU',
  MOTHERBOARD = 'MOTHERBOARD',
  RAM = 'RAM',
  STORAGE = 'STORAGE',
  PSU = 'PSU',
  CASE = 'CASE',
  COOLING = 'COOLING',
  PERIPHERALS = 'PERIPHERALS'
}

// Базовый интерфейс компонента
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
  description?: string;
  features: string[];
  inStock: boolean;
  popularity: number;
  rating: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейс для создания компонента
export interface CreateComponentRequest {
  name: string;
  brand: string;
  model: string;
  category: ComponentCategory;
  price: number;
  currency?: string;
  specs?: Record<string, any>;
  images?: string[];
  description?: string;
  features?: string[];
  inStock?: boolean;
}

// Интерфейс для обновления компонента
export interface UpdateComponentRequest {
  name?: string;
  brand?: string;
  model?: string;
  category?: ComponentCategory;
  price?: number;
  currency?: string;
  specs?: Record<string, any>;
  images?: string[];
  description?: string;
  features?: string[];
  inStock?: boolean;
}

// Интерфейс для поиска компонентов
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

// Ответ со списком компонентов
export interface ComponentsListResponse {
  components: ComponentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Компонент с характеристиками (для обратной совместимости)
export interface ComponentWithSpecs extends ComponentResponse {
  // Дополнительные поля для специфических характеристик
  cpu?: any;
  gpu?: any;
  motherboard?: any;
  ram?: any;
  storage?: any;
  psu?: any;
  pcCase?: any;
  cooling?: any;
}

// Статистика компонентов
export interface ComponentsStats {
  total: number;
  inStock: number;
  outOfStock: number;
  categories: Array<{
    category: string;
    count: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}
