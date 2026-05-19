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

  @Prop({ required: true, min: 0 })
  subtotal!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderCode!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer!: Types.ObjectId;

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

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Prop({ trim: true })
  note?: string;

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
