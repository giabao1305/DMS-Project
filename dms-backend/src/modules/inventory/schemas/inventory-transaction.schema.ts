import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryTransactionDocument =
  HydratedDocument<InventoryTransaction>;

export enum InventoryTransactionType {
  IMPORT = 'import',
  EXPORT = 'export',
  ORDER = 'order',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
}

@Schema({ timestamps: true })
export class InventoryTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ enum: InventoryTransactionType, required: true })
  type!: InventoryTransactionType;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  beforeStock!: number;

  @Prop({ required: true })
  afterStock!: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}

export const InventoryTransactionSchema =
  SchemaFactory.createForClass(InventoryTransaction);
