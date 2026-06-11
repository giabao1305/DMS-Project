import type { Customer } from "@/features/customers/customerTypes";
import type { Product } from "@/features/products/productTypes";
import type { Promotion } from "@/features/promotions/promotionTypes";
import type { User } from "@/features/users/userTypes";
import type { Warehouse } from "@/features/warehouses/warehouseTypes";

export type OrderType = "manufacturer_to_distributor" | "distributor_to_store";

export type OrderStatus =
  | "pending"
  | "approved"
  | "delivered"
  | "return_requested"
  | "cancelled"
  | "returned";

export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentMethod = "cash" | "bank_transfer" | "online_qr" | "other";

export interface OrderPayment {
  amount: number;
  method: PaymentMethod;
  note?: string;
  collectedBy: string | User;
  collectedAt: string;
}

export interface OrderRefund {
  amount: number;
  method: PaymentMethod;
  note?: string;
  refundedBy: string | User;
  refundedAt: string;
}

export interface OrderItem {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  sellingPrice?: number;
  subtotal: number;
  costPrice?: number;
  grossProfit?: number;
}

export interface Order {
  _id: string;
  orderCode: string;
  orderType?: OrderType;
  distributor?: string | User;
  warehouse?: string | Warehouse;
  seller?: string | User;
  customer?: string | Customer;
  createdBy?: string | User;
  items: OrderItem[];
  promotion?: string | Promotion;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  totalCost?: number;
  grossProfit?: number;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  balanceDue?: number;
  payments?: OrderPayment[];
  refundedAmount?: number;
  refunds?: OrderRefund[];
  status: OrderStatus;
  note?: string;
  deliveryRecipientName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  requestedDeliveryDate?: string;
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
  orderType?: OrderType;
  distributor?: string;
  seller?: string;
  customer?: string;
  items: CreateOrderItemRequest[];
  promotion?: string;
  note?: string;
  deliveryRecipientName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  requestedDeliveryDate?: string;
}

export interface UpdateOrderRequest {
  orderType?: OrderType;
  distributor?: string;
  seller?: string;
  customer?: string;
  items?: CreateOrderItemRequest[];
  promotion?: string | null;
  note?: string;
}

export interface RequestReturnOrderRequest {
  reason: string;
}

export interface RecordOrderPaymentRequest {
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export interface VnpayPaymentUrlResponse {
  paymentUrl: string;
  qrValue: string;
  txnRef: string;
  orderCode: string;
  amount: number;
  orderInfo: string;
  expiresAt: string;
}

export interface RecordOrderRefundRequest {
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export interface UpdateSupplyPricingRequest {
  items: {
    product: string;
    price: number;
  }[];
}
