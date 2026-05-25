import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  DISTRIBUTOR = 'distributor',
  SELLER = 'seller',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    sparse: true,
    trim: true,
    unique: true,
    uppercase: true,
  })
  code?: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop()
  avatar?: string;

  // seller = nhà phân phối
  @Prop({
    enum: UserRole,
    default: UserRole.SELLER,
  })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager?: Types.ObjectId;

  // tên công ty / nhà phân phối
  @Prop({ trim: true })
  companyName?: string;

  // địa chỉ công ty
  @Prop({ trim: true })
  address?: string;

  // mã số thuế
  @Prop({ trim: true })
  taxCode?: string;

  // admin tạo tài khoản này
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop()
  refreshTokenHash?: string;

  @Prop()
  refreshTokenExpires?: Date;

  @Prop({ default: 0 })
  failedLoginAttempts!: number;

  @Prop()
  lockUntil?: Date;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (
    _doc,
    ret: {
      password?: string;
      resetPasswordToken?: string;
      resetPasswordExpires?: Date;
      refreshTokenHash?: string;
      refreshTokenExpires?: Date;
      failedLoginAttempts?: number;
      lockUntil?: Date;
    },
  ) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.refreshTokenHash;
    delete ret.refreshTokenExpires;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    return ret;
  },
});
