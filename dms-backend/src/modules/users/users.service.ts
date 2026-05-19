import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  private emitUserRealtime(action: string, user: User): void {
    this.socketGateway.emitToAll('user-updated', {
      action,
      user,
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const email = createUserDto.email.toLowerCase();

    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      email,
      password: hashedPassword,
      role: createUserDto.role || UserRole.SELLER,
    });

    const savedUser = await createdUser.save();

    this.emitUserRealtime('created', savedUser);

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel.find({ role }).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await this.userModel
      .findByIdAndUpdate(id, {
        password: hashedPassword,
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpires: '',
          refreshTokenHash: '',
          refreshTokenExpires: '',
        },
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async setResetPasswordToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const user = await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase(), isActive: true },
        {
          resetPasswordToken: token,
          resetPasswordExpires: expiresAt,
        },
      )
      .exec();

    return Boolean(user);
  }

  async findByValidResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      })
      .exec();
  }

  async setRefreshToken(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        refreshTokenHash,
        refreshTokenExpires: expiresAt,
      })
      .exec();
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $unset: {
          refreshTokenHash: '',
          refreshTokenExpires: '',
        },
      })
      .exec();
  }

  async recordFailedLogin(
    user: UserDocument,
    maxFailedAttempts: number,
    lockMinutes: number,
  ): Promise<UserDocument> {
    const now = new Date();
    const previousAttempts =
      user.lockUntil && user.lockUntil <= now ? 0 : user.failedLoginAttempts;
    const failedLoginAttempts = (previousAttempts ?? 0) + 1;
    const shouldLock = failedLoginAttempts >= maxFailedAttempts;
    const lockUntil = shouldLock
      ? new Date(now.getTime() + lockMinutes * 60 * 1000)
      : undefined;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        user._id,
        {
          failedLoginAttempts,
          ...(lockUntil ? { lockUntil } : { $unset: { lockUntil: '' } }),
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async markLoginSuccess(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        $unset: {
          lockUntil: '',
        },
      })
      .exec();
  }

  async findByRefreshTokenSubject(
    userId: string,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.userModel
      .findOne({
        _id: userId,
        isActive: true,
        refreshTokenHash: { $exists: true },
        refreshTokenExpires: { $gt: new Date() },
      })
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: Partial<UpdateUserDto> & { password?: string } = {
      ...updateUserDto,
    };

    if (updateUserDto.email) {
      const email = updateUserDto.email.toLowerCase();

      const existingUser = await this.userModel.findOne({
        email,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      updateData.email = email;
    }

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    this.emitUserRealtime('updated', updatedUser);

    return updatedUser;
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findById(id);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { isActive: !user.isActive },
        { returnDocument: 'after' },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    this.emitUserRealtime('status-toggled', updatedUser);

    return updatedUser;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findByIdAndDelete(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.emitUserRealtime('deleted', user);

    return {
      message: 'User deleted successfully',
    };
  }
}
