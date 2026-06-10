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
  buildSearchRegex,
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
import {
  Route,
  RouteDocument,
  RouteStatus,
} from '../routes/schemas/route.schema';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<LeaveRequestDocument> & {
  createdAt?: DateRangeFilter;
};

type RelationId = Types.ObjectId | string | { _id: Types.ObjectId | string };

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Route.name)
    private readonly routeModel: Model<RouteDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private emitLeaveRealtime(action: string, leave: LeaveRequest): void {
    this.notificationsService.emitRealtime('leave-updated', {
      action,
      leave,
    });
  }

  private getRelationId(value: RelationId): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toHexString();
    }

    if ('_id' in value) {
      return value._id.toString();
    }

    return value;
  }

  private async getManagedSellerIds(
    distributorId: string,
  ): Promise<Types.ObjectId[]> {
    const sellers = await this.userModel
      .find({
        role: UserRole.SELLER,
        $or: [
          { manager: new Types.ObjectId(distributorId) },
          { manager: distributorId },
        ],
      })
      .select('_id')
      .exec();

    return sellers.map((seller) => seller._id);
  }

  private async assertManagedSeller(
    distributorId: string,
    sellerId: string,
  ): Promise<void> {
    const seller = await this.userModel
      .findOne({
        _id: new Types.ObjectId(sellerId),
        role: UserRole.SELLER,
        $or: [
          { manager: new Types.ObjectId(distributorId) },
          { manager: distributorId },
        ],
        isActive: true,
      })
      .select('_id')
      .exec();

    if (!seller) {
      throw new ForbiddenException('Seller is not managed by this distributor');
    }
  }

  private async assertNoUncoveredRoutesDuringLeave(
    sellerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const leaveStart = new Date(startDate);
    leaveStart.setHours(0, 0, 0, 0);

    const leaveEnd = new Date(endDate);
    leaveEnd.setHours(23, 59, 59, 999);

    const route = await this.routeModel
      .findOne({
        $or: [
          {
            seller: new Types.ObjectId(sellerId),
            substituteSeller: { $exists: false },
          },
          {
            substituteSeller: new Types.ObjectId(sellerId),
          },
        ],
        status: { $in: [RouteStatus.PLANNED, RouteStatus.IN_PROGRESS] },
        workDate: {
          $gte: leaveStart,
          $lte: leaveEnd,
        },
      })
      .select('_id name workDate')
      .exec();

    if (route) {
      throw new BadRequestException(
        'Seller has routes in this leave period. Assign substitute sellers before approving leave',
      );
    }
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

    const existingLeave = await this.leaveRequestModel
      .findOne({
        seller: new Types.ObjectId(sellerId),
        status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      })
      .select('_id')
      .exec();

    if (existingLeave) {
      throw new BadRequestException(
        'Leave request overlaps with an existing leave request',
      );
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

    if (
      query?.distributor &&
      Types.ObjectId.isValid(query.distributor) &&
      !filter.seller
    ) {
      filter.seller = {
        $in: await this.getManagedSellerIds(query.distributor),
      };
    }

    if (query?.search) {
      const search = buildSearchRegex(query.search);
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
    role: UserRole,
    query?: PaginationQueryDto,
  ): Promise<LeaveRequest[] | PaginatedResult<LeaveRequest>> {
    const seller =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(sellerId) }
        : new Types.ObjectId(sellerId);

    const filter = await this.buildLeaveListFilter(query, {
      seller,
    });
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

    const leaveSellerId = this.getRelationId(leaveRequest.seller);

    if (role === UserRole.SELLER && leaveSellerId !== userId) {
      throw new ForbiddenException('You can only view your own leave requests');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const managedSellerIds = await this.getManagedSellerIds(userId);
      const canView = managedSellerIds.some(
        (sellerId) => sellerId.toString() === leaveSellerId,
      );

      if (!canView) {
        throw new ForbiddenException(
          'You can only view leave requests from your sellers',
        );
      }
    }

    return leaveRequest;
  }

  async approve(
    id: string,
    reviewerId: string,
    reviewerRole: UserRole,
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

    if (reviewerRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(
        reviewerId,
        leaveRequest.seller.toString(),
      );
    }

    await this.assertNoUncoveredRoutesDuringLeave(
      leaveRequest.seller.toString(),
      leaveRequest.startDate,
      leaveRequest.endDate,
    );

    leaveRequest.status = LeaveStatus.APPROVED;
    leaveRequest.approvedBy = new Types.ObjectId(reviewerId);
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
    reviewerId: string,
    reviewerRole: UserRole,
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

    if (reviewerRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(
        reviewerId,
        leaveRequest.seller.toString(),
      );
    }

    leaveRequest.status = LeaveStatus.REJECTED;
    leaveRequest.approvedBy = new Types.ObjectId(reviewerId);
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
