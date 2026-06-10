import type { Product } from "@/features/products/productTypes";
import type { User } from "@/features/users/userTypes";

export type WarehouseType = "manufacturer" | "distributor";

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  type: WarehouseType;
  distributor?: string | User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseStock {
  _id: string;
  warehouse: string | Warehouse;
  product: string | Product;
  quantity: number;
  averageCost: number;
  sellingPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  type: WarehouseType;
  distributor?: string;
}

export interface InitializeWarehouseStockRequest {
  product: string;
  quantity: number;
  averageCost: number;
  sellingPrice?: number;
}

export interface UpdateWarehouseSellingPriceRequest {
  sellingPrice: number;
}

export interface UpdateWarehouseStatusRequest {
  isActive: boolean;
}
