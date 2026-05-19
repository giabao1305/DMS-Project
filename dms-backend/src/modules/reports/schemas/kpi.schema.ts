import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type KpiDocument = HydratedDocument<Kpi>;

@Schema({ timestamps: true })
export class Kpi {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 12 })
  month!: number;

  @Prop({ required: true })
  year!: number;

  @Prop({ required: true, min: 0, default: 0 })
  targetRevenue!: number;

  @Prop({ required: true, min: 0, default: 0 })
  actualRevenue!: number;

  @Prop({ required: true, min: 0, default: 0 })
  targetOrders!: number;

  @Prop({ required: true, min: 0, default: 0 })
  actualOrders!: number;

  @Prop({ required: true, min: 0, default: 0 })
  targetVisits!: number;

  @Prop({ required: true, min: 0, default: 0 })
  actualVisits!: number;

  @Prop({ required: true, min: 0, default: 0 })
  performanceRate!: number;
}

export const KpiSchema = SchemaFactory.createForClass(Kpi);
