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
import {
  Customer,
  CustomerDocument,
  CustomerStatus,
} from '../customers/schemas/customer.schema';
import { Route, RouteDocument } from '../routes/schemas/route.schema';
import { RoutesService } from '../routes/routes.service';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { Visit, VisitDocument, VisitStatus } from './schemas/visit.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<VisitDocument> & {
  createdAt?: DateRangeFilter;
};

type RelationId = Types.ObjectId | string | { _id: Types.ObjectId | string };

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Route.name)
    private readonly routeModel: Model<RouteDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly routesService: RoutesService,

    private readonly notificationsService: NotificationsService,
  ) {}

  private emitVisitRealtime(action: string, visit: Visit): void {
    this.notificationsService.emitRealtime('visit-updated', {
      action,
      visit,
    });

    this.notificationsService.emitRealtime('reports-updated', {
      source: 'visits',
      action,
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

  async checkIn(checkInDto: CheckInDto, sellerId: string): Promise<Visit> {
    const activeVisit = await this.visitModel.findOne({
      seller: new Types.ObjectId(sellerId),
      status: VisitStatus.CHECKED_IN,
    });

    if (activeVisit) {
      throw new BadRequestException(
        'You already have an active check-in. Please check-out first',
      );
    }

    const customer = await this.customerModel.findById(checkInDto.customer);

    if (!customer || !customer.isActive) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status !== CustomerStatus.APPROVED) {
      throw new BadRequestException('Customer has not been approved');
    }

    if (customer.assignedSeller.toString() !== sellerId) {
      throw new ForbiddenException('This customer is not assigned to you');
    }

    let checkInDistance: number | undefined;

    if (customer.latitude !== undefined && customer.longitude !== undefined) {
      checkInDistance = this.calculateDistance(
        checkInDto.checkInLatitude,
        checkInDto.checkInLongitude,
        customer.latitude,
        customer.longitude,
      );

      if (checkInDistance > 100) {
        throw new BadRequestException(
          `You are too far from customer location (${Math.round(
            checkInDistance,
          )}m)`,
        );
      }
    }

    if (checkInDto.route) {
      const route = await this.routeModel.findById(checkInDto.route);

      if (!route) {
        throw new NotFoundException('Route not found');
      }

      if (route.seller.toString() !== sellerId) {
        throw new ForbiddenException('This route is not assigned to you');
      }

      const existsInRoute = route.customers.some(
        (item) => item.customer.toString() === checkInDto.customer,
      );

      if (!existsInRoute) {
        throw new BadRequestException('Customer is not in this route');
      }
    }

    const visit = new this.visitModel({
      seller: new Types.ObjectId(sellerId),
      customer: new Types.ObjectId(checkInDto.customer),
      route: checkInDto.route
        ? new Types.ObjectId(checkInDto.route)
        : undefined,
      checkInTime: new Date(),
      checkInLatitude: checkInDto.checkInLatitude,
      checkInLongitude: checkInDto.checkInLongitude,
      checkInDistance,
      gpsAccuracy: checkInDto.gpsAccuracy,
      note: checkInDto.note,
      status: VisitStatus.CHECKED_IN,
    });

    const savedVisit = await visit.save();

    const admins = await this.visitModel.db
      .collection('users')
      .find({ role: 'admin' })
      .toArray();

    await Promise.all([
      ...admins.map((admin) =>
        this.notificationsService.create({
          user: admin._id.toString(),
          title: 'Check-in mới',
          message: 'Seller vừa check-in khách hàng',
          type: NotificationType.VISIT,
          relatedId: savedVisit._id.toString(),
        }),
      ),

      this.notificationsService.create({
        user: sellerId,
        title: 'Check-in thành công',
        message: 'Bạn đã check-in khách hàng thành công',
        type: NotificationType.VISIT,
        relatedId: savedVisit._id.toString(),
      }),
    ]);

    if (checkInDto.route) {
      await this.routesService.markCustomerCheckedIn(
        checkInDto.route,
        checkInDto.customer,
      );
    }

    this.emitVisitRealtime('checked-in', savedVisit);

    return savedVisit;
  }

  async checkOut(
    visitId: string,
    checkOutDto: CheckOutDto,
    sellerId: string,
  ): Promise<Visit> {
    const visit = await this.visitModel.findById(visitId);

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    if (visit.seller.toString() !== sellerId) {
      throw new ForbiddenException('You can only check-out your own visit');
    }

    if (visit.status !== VisitStatus.CHECKED_IN) {
      throw new BadRequestException('Visit already checked out');
    }

    visit.checkOutTime = new Date();

    if (checkOutDto.checkOutLatitude !== undefined) {
      visit.checkOutLatitude = checkOutDto.checkOutLatitude;
    }

    if (checkOutDto.checkOutLongitude !== undefined) {
      visit.checkOutLongitude = checkOutDto.checkOutLongitude;
    }

    if (checkOutDto.note) {
      visit.note = visit.note
        ? `${visit.note}\nCheck-out: ${checkOutDto.note}`
        : checkOutDto.note;
    }

    visit.status = VisitStatus.CHECKED_OUT;

    const savedVisit = await visit.save();

    const admins = await this.visitModel.db
      .collection('users')
      .find({ role: 'admin' })
      .toArray();

    await Promise.all([
      ...admins.map((admin) =>
        this.notificationsService.create({
          user: admin._id.toString(),
          title: 'Check-out hoàn tất',
          message: 'Seller vừa check-out khách hàng',
          type: NotificationType.VISIT,
          relatedId: savedVisit._id.toString(),
        }),
      ),

      this.notificationsService.create({
        user: sellerId,
        title: 'Check-out thành công',
        message: 'Bạn đã check-out khách hàng',
        type: NotificationType.VISIT,
        relatedId: savedVisit._id.toString(),
      }),
    ]);

    if (visit.route) {
      await this.routesService.markCustomerVisited(
        visit.route.toString(),
        visit.customer.toString(),
      );
    }

    this.emitVisitRealtime('checked-out', savedVisit);

    return savedVisit;
  }

  private async buildVisitListFilter(
    query?: PaginationQueryDto,
    baseFilter: QueryFilter = {},
  ): Promise<QueryFilter> {
    const filter: QueryFilter = {
      ...baseFilter,
    };

    if (query?.status) {
      filter.status = query.status as VisitStatus;
    }

    if (query?.search) {
      const search = new RegExp(query.search.trim(), 'i');
      const [sellers, customers] = await Promise.all([
        this.userModel
          .find({
            $or: [
              { fullName: search },
              { email: search },
              { companyName: search },
            ],
          })
          .select('_id')
          .exec(),
        this.customerModel
          .find({
            $or: [{ name: search }, { phone: search }, { address: search }],
          })
          .select('_id')
          .exec(),
      ]);

      filter.$or = [
        { note: search },
        { seller: { $in: sellers.map((seller) => seller._id) } },
        { customer: { $in: customers.map((customer) => customer._id) } },
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
  ): Promise<Visit[] | PaginatedResult<Visit>> {
    const filter = await this.buildVisitListFilter(query);
    const visitQuery = this.visitModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('customer', 'name phone address')
      .populate('route', 'name workDate status')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return visitQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      visitQuery.skip(skip).limit(limit).exec(),
      this.visitModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findMyVisits(
    sellerId: string,
    role: UserRole,
    query?: PaginationQueryDto,
  ): Promise<Visit[] | PaginatedResult<Visit>> {
    const seller =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(sellerId) }
        : new Types.ObjectId(sellerId);

    const filter = await this.buildVisitListFilter(query, {
      seller,
    });
    const visitQuery = this.visitModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('customer', 'name phone address')
      .populate('route', 'name workDate status')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return visitQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      visitQuery.skip(skip).limit(limit).exec(),
      this.visitModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findById(id: string, userId: string, role: UserRole): Promise<Visit> {
    const visit = await this.visitModel
      .findById(id)
      .populate('seller', 'fullName email phone companyName')
      .populate('customer', 'name phone address')
      .populate('route', 'name workDate status')
      .exec();

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    const visitSellerId = this.getRelationId(visit.seller);

    if (role === UserRole.SELLER && visitSellerId !== userId) {
      throw new ForbiddenException('You can only view your own visits');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const managedSellerIds = await this.getManagedSellerIds(userId);
      const canView = managedSellerIds.some(
        (sellerId) => sellerId.toString() === visitSellerId,
      );

      if (!canView) {
        throw new ForbiddenException(
          'You can only view visits recorded by your sellers',
        );
      }
    }

    return visit;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadius = 6371000;

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
