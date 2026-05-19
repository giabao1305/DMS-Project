import type { Customer } from "@/features/customers/customerTypes";
import type { Product } from "@/features/products/productTypes";
import type { Promotion } from "@/features/promotions/promotionTypes";
import type { User } from "@/features/users/userTypes";

export type OrderStatus =
  | "pending"
  | "approved"
  | "delivered"
  | "return_requested"
  | "cancelled"
  | "returned";

export interface OrderItem {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderCode: string;
  seller: string | User;
  customer: string | Customer;
  items: OrderItem[];
  promotion?: string | Promotion;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  note?: string;
  approvedBy?: string | User;
  approvedAt?: string;
  deliveredAt?: string;
  returnReason?: string;
  returnRequestedBy?: string | User;
  returnRequestedAt?: string;
  returnApprovedBy?: string | User;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemRequest {
  product: string;
  quantity: number;
}

export interface CreateOrderRequest {
  seller?: string;
  customer: string;
  items: CreateOrderItemRequest[];
  promotion?: string;
  note?: string;
}

export interface UpdateOrderRequest {
  seller?: string;
  customer?: string;
  items?: CreateOrderItemRequest[];
  promotion?: string | null;
  note?: string;
}

export interface RequestReturnOrderRequest {
  reason: string;
}
