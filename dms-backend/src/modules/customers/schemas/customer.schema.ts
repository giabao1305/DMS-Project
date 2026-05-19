import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

export enum CustomerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop({ trim: true })
  ownerName?: string;

  @Prop({ trim: true })
  customerType?: string;

  // seller/NPP phụ trách khách hàng này
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedSeller!: Types.ObjectId;

  // seller tạo khách hàng
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  // trạng thái duyệt
  @Prop({
    enum: CustomerStatus,
    default: CustomerStatus.PENDING,
  })
  status!: CustomerStatus;

  // admin duyệt khách hàng
  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  // lý do từ chối
  @Prop({ trim: true })
  rejectReason?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
