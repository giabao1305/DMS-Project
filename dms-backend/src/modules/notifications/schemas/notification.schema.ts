import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  ORDER = 'order',
  PROMOTION = 'promotion',
  LEAVE = 'leave',
  SYSTEM = 'system',
  ROUTE = 'route',
  VISIT = 'visit',
  INVENTORY = 'inventory',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ enum: NotificationType, default: NotificationType.SYSTEM })
  type!: NotificationType;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ type: Types.ObjectId })
  relatedId?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
