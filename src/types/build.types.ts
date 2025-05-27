import { ComponentCategory } from './component.types';

export interface BuildComponentData {
  componentId: string;
  quantity: number;
}

export interface CreateBuildRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  userId: string;
  components: Record<string, BuildComponentData>;
}

export interface UpdateBuildRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  components?: Record<string, BuildComponentData>;
}

export interface BuildUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface BuildComponentInfo {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  currency: string;
  image?: string;
  specs: Record<string, any>;
}

export interface BuildComponent {
  category: ComponentCategory;
  component: BuildComponentInfo;
  quantity: number;
}

export interface BuildResponse {
  id: string;
  name: string;
  description?: string;
  totalPrice: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: BuildUser;
  components: BuildComponent[];
}

export interface BuildsListResponse {
  builds: BuildResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
