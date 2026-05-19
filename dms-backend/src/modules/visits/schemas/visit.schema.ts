import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VisitDocument = HydratedDocument<Visit>;

export enum VisitStatus {
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
}

@Schema({ timestamps: true })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Route' })
  route?: Types.ObjectId;

  @Prop({ required: true })
  checkInTime!: Date;

  @Prop()
  checkOutTime?: Date;

  @Prop({ required: true })
  checkInLatitude!: number;

  @Prop({ required: true })
  checkInLongitude!: number;

  @Prop()
  checkInDistance?: number;

  @Prop()
  gpsAccuracy?: number;

  @Prop()
  checkOutLatitude?: number;

  @Prop()
  checkOutLongitude?: number;

  @Prop()
  checkOutDistance?: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ enum: VisitStatus, default: VisitStatus.CHECKED_IN })
  status!: VisitStatus;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);
