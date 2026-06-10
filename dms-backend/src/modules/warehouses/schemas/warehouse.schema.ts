import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WarehouseDocument = HydratedDocument<Warehouse>;

export enum WarehouseType {
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
}

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ enum: WarehouseType, required: true })
  type!: WarehouseType;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  distributor?: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

WarehouseSchema.index(
  { distributor: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: WarehouseType.DISTRIBUTOR,
      distributor: { $exists: true },
    },
  },
);
