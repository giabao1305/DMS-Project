import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

export enum PromotionType {
  PERCENT = 'percent',
  AMOUNT = 'amount',
  PRODUCT_GIFT = 'product_gift',
}

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: PromotionType, required: true })
  type!: PromotionType;

  @Prop({ min: 0, max: 100 })
  discountPercent?: number;

  @Prop({ min: 0 })
  discountAmount?: number;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  giftProduct?: Types.ObjectId;

  @Prop({ min: 0 })
  giftQuantity?: number;

  @Prop({ min: 0, default: 0 })
  minOrderValue?: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
