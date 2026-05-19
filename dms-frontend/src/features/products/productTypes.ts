import type { Category } from "@/features/categories/categoryTypes";

export interface Product {
  _id: string;
  name: string;
  code: string;
  description?: string;
  category: string | Category;
  price: number;
  unit: string;
  stock: number;
  minStock: number;
  image?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  code: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  minStock: number;
  image?: string;
}

export interface UpdateProductRequest {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  price?: number;
  unit?: string;
  stock?: number;
  minStock?: number;
  image?: string;
  isActive?: boolean;
}
