import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WarehouseStockDocument = HydratedDocument<WarehouseStock>;

@Schema({ timestamps: true })
export class WarehouseStock {
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouse!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0 })
  quantity!: number;

  @Prop({ required: true, min: 0, default: 0 })
  averageCost!: number;

  @Prop({ required: true, min: 0, default: 0 })
  sellingPrice!: number;
}

export const WarehouseStockSchema =
  SchemaFactory.createForClass(WarehouseStock);

WarehouseStockSchema.index({ warehouse: 1, product: 1 }, { unique: true });
