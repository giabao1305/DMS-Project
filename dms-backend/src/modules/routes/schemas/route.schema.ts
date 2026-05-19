import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RouteDocument = HydratedDocument<Route>;

export enum RouteStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RouteCustomerStatus {
  PENDING = 'pending',
  CHECKED_IN = 'checked_in',
  VISITED = 'visited',
  SKIPPED = 'skipped',
}

@Schema({ _id: false })
export class RouteCustomer {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer!: Types.ObjectId;

  @Prop({ required: true })
  orderIndex!: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ enum: RouteCustomerStatus, default: RouteCustomerStatus.PENDING })
  status!: RouteCustomerStatus;
}

export const RouteCustomerSchema = SchemaFactory.createForClass(RouteCustomer);

@Schema({ timestamps: true })
export class Route {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller!: Types.ObjectId;

  @Prop({ required: true })
  workDate!: Date;

  @Prop({ type: [RouteCustomerSchema], default: [] })
  customers!: RouteCustomer[];

  @Prop({ enum: RouteStatus, default: RouteStatus.PLANNED })
  status!: RouteStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}

export const RouteSchema = SchemaFactory.createForClass(Route);
