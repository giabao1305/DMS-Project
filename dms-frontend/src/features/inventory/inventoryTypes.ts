import type { Product } from "@/features/products/productTypes";
import type { User } from "@/features/users/userTypes";

export type InventoryType =
  | "import"
  | "export"
  | "order"
  | "return"
  | "adjustment";

export interface InventoryTransaction {
  _id: string;
  product: string | Product;
  type: InventoryType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  note?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryRequest {
  type: "import" | "export" | "adjustment";
  product: string;
  quantity: number;
  note?: string;
}

export interface ImportStockRequest {
  product: string;
  quantity: number;
  note?: string;
}

export interface ExportStockRequest {
  product: string;
  quantity: number;
  note?: string;
}

export interface AdjustStockRequest {
  product: string;
  newStock: number;
  note?: string;
}
