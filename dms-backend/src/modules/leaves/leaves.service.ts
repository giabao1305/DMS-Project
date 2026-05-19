import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { UserRole } from '../users/schemas/user.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveStatus,
} from './schemas/leave-request.schema';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<LeaveRequestDocument> & {
  createdAt?: DateRangeFilter;
};

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private emitLeaveRealtime(action: string, leave: LeaveRequest): void {
    this.notificationsService.emitRealtime('leave-updated', {
      action,
      leave,
    });
  }

  async create(
    createLeaveRequestDto: CreateLeaveRequestDto,
    sellerId: string,
  ): Promise<LeaveRequest> {
    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const leaveRequest = new this.leaveRequestModel({
      seller: new Types.ObjectId(sellerId),
      startDate,
      endDate,
      reason: createLeaveRequestDto.reason,
      status: LeaveStatus.PENDING,
    });

    const savedLeave = await leaveRequest.save();

    const admins = await this.leaveRequestModel.db
      .collection('users')
      .find({ role: 'admin' })
      .toArray();

    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.create({
          user: admin._id.toString(),
          title: 'Đơn nghỉ phép mới',
          message: 'Seller vừa gửi đơn xin nghỉ phép',
          type: NotificationType.LEAVE,
          relatedId: savedLeave._id.toString(),
        }),
      ),
    );

    this.emitLeaveRealtime('created', savedLeave);

    return savedLeave;
  }

  private async buildLeaveListFilter(
    query?: PaginationQueryDto,
    baseFilter: QueryFilter = {},
  ): Promise<QueryFilter> {
    const filter: QueryFilter = {
      ...baseFilter,
    };

    if (query?.status) {
      filter.status = query.status as LeaveStatus;
    }

    if (query?.search) {
      const search = new RegExp(query.search.trim(), 'i');
      const sellers = await this.userModel
        .find({
          $or: [
            { fullName: search },
            { email: search },
            { companyName: search },
          ],
        })
        .select('_id')
        .exec();

      filter.$or = [
        { reason: search },
        {
          seller: {
            $in: sellers.map((seller) => seller._id),
          },
        },
      ];
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

  async findAll(
    query?: PaginationQueryDto,
  ): Promise<LeaveRequest[] | PaginatedResult<LeaveRequest>> {
    const filter = await this.buildLeaveListFilter(query);
    const leaveQuery = this.leaveRequestModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('approvedBy', 'fullName email')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return leaveQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      leaveQuery.skip(skip).limit(limit).exec(),
      this.leaveRequestModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findMyLeaves(
    sellerId: string,
    query?: PaginationQueryDto,
  ): Promise<LeaveRequest[] | PaginatedResult<LeaveRequest>> {
    const filter = await this.buildLeaveListFilter(query, {
      seller: new Types.ObjectId(sellerId),
    });
    const leaveQuery = this.leaveRequestModel
      .find(filter)
      .populate('approvedBy', 'fullName email')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return leaveQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      leaveQuery.skip(skip).limit(limit).exec(),
      this.leaveRequestModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findById(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel
      .findById(id)
      .populate('seller', 'fullName email phone companyName')
      .populate('approvedBy', 'fullName email')
      .exec();

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (
      role === UserRole.SELLER &&
      leaveRequest.seller._id.toString() !== userId
    ) {
      throw new ForbiddenException('You can only view your own leave requests');
    }

    return leaveRequest;
  }

  async approve(id: string, adminId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findById(id);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Only pending leave requests can be reviewed',
      );
    }

    leaveRequest.status = LeaveStatus.APPROVED;
    leaveRequest.approvedBy = new Types.ObjectId(adminId);
    leaveRequest.approvedAt = new Date();
    leaveRequest.adminNote = 'Approved';

    const savedLeave = await leaveRequest.save();

    await this.notificationsService.create({
      user: leaveRequest.seller.toString(),
      title: 'Đơn nghỉ phép đã được duyệt',
      message: 'Đơn xin nghỉ phép của bạn đã được Admin duyệt',
      type: NotificationType.LEAVE,
      relatedId: leaveRequest._id.toString(),
    });

    this.emitLeaveRealtime('approved', savedLeave);

    return savedLeave;
  }

  async reject(
    id: string,
    adminId: string,
    adminNote: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findById(id);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Only pending leave requests can be reviewed',
      );
    }

    leaveRequest.status = LeaveStatus.REJECTED;
    leaveRequest.approvedBy = new Types.ObjectId(adminId);
    leaveRequest.approvedAt = new Date();
    leaveRequest.adminNote = adminNote;

    const savedLeave = await leaveRequest.save();

    await this.notificationsService.create({
      user: leaveRequest.seller.toString(),
      title: 'Đơn nghỉ phép bị từ chối',
      message: `Đơn xin nghỉ phép của bạn bị từ chối: ${adminNote}`,
      type: NotificationType.LEAVE,
      relatedId: leaveRequest._id.toString(),
    });

    this.emitLeaveRealtime('rejected', savedLeave);

    return savedLeave;
  }
}
