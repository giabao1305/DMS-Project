import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  actor?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  action!: string;

  @Prop({ required: true, trim: true })
  module!: string;

  @Prop({ trim: true })
  targetId?: string;

  @Prop({ trim: true })
  targetLabel?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
