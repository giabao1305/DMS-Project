import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type mongoose from 'mongoose';
import { Model, Types } from 'mongoose';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  getPagination,
  getSort,
  PaginatedResult,
  shouldPaginate,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

import { SocketGateway } from '../socket/socket.gateway';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<NotificationDocument> & {
  createdAt?: DateRangeFilter;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      user: new Types.ObjectId(createNotificationDto.user),
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      type: createNotificationDto.type || NotificationType.SYSTEM,
      relatedId: createNotificationDto.relatedId
        ? new Types.ObjectId(createNotificationDto.relatedId)
        : undefined,
      isRead: false,
    });

    const savedNotification = await notification.save();

    this.socketGateway.emitToUser(
      createNotificationDto.user,
      'new-notification',
      savedNotification,
    );

    return savedNotification;
  }

  async createForAdmins(data: {
    title: string;
    message: string;
    type?: NotificationType;
    relatedId?: string;
  }): Promise<void> {
    const admins = await this.userModel
      .find({
        role: UserRole.ADMIN,
        isActive: true,
      })
      .exec();

    await Promise.all(
      admins.map((admin) =>
        this.create({
          user: admin._id.toString(),
          title: data.title,
          message: data.message,
          type: data.type || NotificationType.SYSTEM,
          relatedId: data.relatedId,
        }),
      ),
    );
  }

  emitRealtime(event: string, data: unknown): void {
    this.socketGateway.emitToAll(event, data);
  }

  emitRealtimeToUser(userId: string, event: string, data: unknown): void {
    this.socketGateway.emitToUser(userId, event, data);
  }

  emitRealtimeToRole(role: string, event: string, data: unknown): void {
    this.socketGateway.emitToRole(role, event, data);
  }

  private buildNotificationListFilter(
    userId: string,
    query?: PaginationQueryDto,
  ): QueryFilter {
    const filter: QueryFilter = {
      user: new Types.ObjectId(userId),
    };

    if (query?.type) {
      filter.type = query.type as NotificationType;
    }

    if (query?.isRead === 'true') {
      filter.isRead = true;
    }

    if (query?.isRead === 'false') {
      filter.isRead = false;
    }

    if (query?.status === 'read') {
      filter.isRead = true;
    }

    if (query?.status === 'unread') {
      filter.isRead = false;
    }

    if (query?.search) {
      const search = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: search }, { message: search }];
    }

    const createdAt: DateRangeFilter = {};

    if (query?.fromDate) {
      createdAt.$gte = new Date(query.fromDate);
    }

    if (query?.toDate) {
      createdAt.$lte = new Date(query.toDate);
    }

    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }

    return filter;
  }

  async findMyNotifications(
    userId: string,
    query?: PaginationQueryDto,
  ): Promise<Notification[] | PaginatedResult<Notification>> {
    const filter = this.buildNotificationListFilter(userId, query);
    const notificationQuery = this.notificationModel
      .find(filter)
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return notificationQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      notificationQuery.skip(skip).limit(limit).exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async countUnread(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationModel.countDocuments({
      user: new Types.ObjectId(userId),
      isRead: false,
    });

    return { unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          user: new Types.ObjectId(userId),
        },
        { isRead: true },
        { returnDocument: 'after' },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    await this.notificationModel.updateMany(
      {
        user: new Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true },
    );

    return {
      message: 'All notifications marked as read',
    };
  }
}
