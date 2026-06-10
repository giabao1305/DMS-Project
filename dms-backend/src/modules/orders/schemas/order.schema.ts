import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DELIVERED = 'delivered',
  RETURN_REQUESTED = 'return_requested',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum OrderType {
  MANUFACTURER_TO_DISTRIBUTOR = 'manufacturer_to_distributor',
  DISTRIBUTOR_TO_STORE = 'distributor_to_store',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE_QR = 'online_qr',
  OTHER = 'other',
}

@Schema({ _id: false })
export class OrderPayment {
  @Prop({ required: true, min: 1 })
  amount!: number;

  @Prop({ enum: PaymentMethod, required: true })
  method!: PaymentMethod;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  collectedBy!: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  collectedAt!: Date;
}

export const OrderPaymentSchema = SchemaFactory.createForClass(OrderPayment);

@Schema({ _id: false })
export class OrderRefund {
  @Prop({ required: true, min: 1 })
  amount!: number;

  @Prop({ enum: PaymentMethod, required: true })
  method!: PaymentMethod;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  refundedBy!: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  refundedAt!: Date;
}

export const OrderRefundSchema = SchemaFactory.createForClass(OrderRefund);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ required: true })
  productName!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ min: 0 })
  sellingPrice?: number;

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ min: 0 })
  costPrice?: number;

  @Prop()
  grossProfit?: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderCode!: string;

  @Prop({
    enum: OrderType,
    required: true,
    default: OrderType.DISTRIBUTOR_TO_STORE,
  })
  orderType!: OrderType;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  distributor?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  warehouse?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  seller?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customer?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  promotion?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  discountAmount!: number;

  @Prop({ required: true, min: 0 })
  finalAmount!: number;

  @Prop({ min: 0, default: 0 })
  totalCost!: number;

  @Prop({ default: 0 })
  grossProfit!: number;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus!: PaymentStatus;

  @Prop({ required: true, min: 0, default: 0 })
  paidAmount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  balanceDue!: number;

  @Prop({ type: [OrderPaymentSchema], default: [] })
  payments!: OrderPayment[];

  @Prop({ required: true, min: 0, default: 0 })
  refundedAmount!: number;

  @Prop({ type: [OrderRefundSchema], default: [] })
  refunds!: OrderRefund[];

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Prop({ trim: true })
  note?: string;

  @Prop({ trim: true })
  deliveryRecipientName?: string;

  @Prop({ trim: true })
  deliveryPhone?: string;

  @Prop({ trim: true })
  deliveryAddress?: string;

  @Prop()
  requestedDeliveryDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ trim: true })
  returnReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  returnRequestedBy?: Types.ObjectId;

  @Prop()
  returnRequestedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  returnApprovedBy?: Types.ObjectId;

  @Prop()
  returnedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
