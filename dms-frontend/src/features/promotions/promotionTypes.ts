import type { Product } from "@/features/products/productTypes";

export type PromotionType = "percent" | "amount" | "product_gift";

export interface Promotion {
  _id: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  giftProduct?: string | Product;
  giftQuantity?: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  giftProduct?: string;
  giftQuantity?: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
}

export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {
  isActive?: boolean;
}
