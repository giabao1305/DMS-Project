import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type mongoose from 'mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildSearchRegex,
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
import {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveStatus,
} from '../leaves/schemas/leave-request.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';
import { AssignSubstituteRouteDto } from './dto/assign-substitute-route.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteStatusDto } from './dto/update-route-status.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import {
  Route,
  RouteCustomerStatus,
  RouteDocument,
  RouteStatus,
} from './schemas/route.schema';

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<RouteDocument> & {
  workDate?: DateRangeFilter;
};

type RelationId = Types.ObjectId | string | { _id: Types.ObjectId | string };

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name)
    private readonly routeModel: Model<RouteDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private emitRouteRealtime(action: string, route: Route): void {
    this.notificationsService.emitRealtime('route-updated', {
      action,
      route,
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
        isActive: true,
        $or: [
          { manager: new Types.ObjectId(distributorId) },
          { manager: distributorId },
        ],
      })
      .select('_id')
      .exec();

    if (!seller) {
      throw new ForbiddenException('Seller is not managed by this distributor');
    }
  }

  private async assertActiveSeller(
    sellerId: string,
    notFoundMessage = 'Seller not found',
  ): Promise<UserDocument> {
    const seller = await this.userModel.findById(sellerId);

    if (!seller || !seller.isActive || seller.role !== UserRole.SELLER) {
      throw new NotFoundException(notFoundMessage);
    }

    return seller;
  }

  private async assertRouteAccess(
    routeId: string,
    userId: string,
    role: UserRole,
  ): Promise<RouteDocument> {
    const route = await this.routeModel.findById(routeId);

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, route.seller.toString());
    }

    return route;
  }

  async create(
    createRouteDto: CreateRouteDto,
    adminId: string,
    role: UserRole,
  ): Promise<Route> {
    await this.assertActiveSeller(createRouteDto.seller);

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(adminId, createRouteDto.seller);
    }

    if (!createRouteDto.customers || createRouteDto.customers.length === 0) {
      throw new BadRequestException('Route customers are required');
    }

    this.validateRouteCustomerPlan(createRouteDto.customers);

    await this.ensureSellerHasNoRouteOnDate(
      createRouteDto.seller,
      new Date(createRouteDto.workDate),
    );
    await this.assertSellerNotOnApprovedLeave(
      createRouteDto.seller,
      new Date(createRouteDto.workDate),
    );

    const routeCustomers: {
      customer: Types.ObjectId;
      orderIndex: number;
      note?: string;
      status: RouteCustomerStatus;
    }[] = [];

    for (const item of createRouteDto.customers) {
      const customer = await this.customerModel.findById(item.customer);

      if (!customer || !customer.isActive) {
        throw new NotFoundException(`Customer not found: ${item.customer}`);
      }

      if (customer.status !== CustomerStatus.APPROVED) {
        throw new BadRequestException(
          `Customer ${customer.name} has not been approved`,
        );
      }

      if (customer.assignedSeller.toString() !== createRouteDto.seller) {
        throw new BadRequestException(
          `Customer ${customer.name} is not assigned to this seller`,
        );
      }

      routeCustomers.push({
        customer: new Types.ObjectId(item.customer),
        orderIndex: item.orderIndex,
        note: item.note,
        status: RouteCustomerStatus.PENDING,
      });
    }

    const route = new this.routeModel({
      name: createRouteDto.name,
      seller: new Types.ObjectId(createRouteDto.seller),
      workDate: new Date(createRouteDto.workDate),
      customers: routeCustomers,
      status: RouteStatus.PLANNED,
      createdBy: new Types.ObjectId(adminId),
    });

    const savedRoute = await route.save();

    await this.notificationsService.create({
      user: createRouteDto.seller,
      title: 'Bạn có tuyến mới',
      message: `Tuyến "${createRouteDto.name}" đã được tạo cho ngày ${createRouteDto.workDate}`,
      type: NotificationType.ROUTE,
      relatedId: savedRoute._id.toString(),
    });

    this.emitRouteRealtime('created', savedRoute);

    return savedRoute;
  }

  private validateRouteCustomerPlan(
    customers: Array<{ customer: string; orderIndex: number }>,
  ): void {
    const customerIds = new Set<string>();
    const orderIndexes = new Set<number>();

    for (const item of customers) {
      if (customerIds.has(item.customer)) {
        throw new BadRequestException('Route contains duplicated customers');
      }

      if (orderIndexes.has(item.orderIndex)) {
        throw new BadRequestException(
          'Route contains duplicated order indexes',
        );
      }

      customerIds.add(item.customer);
      orderIndexes.add(item.orderIndex);
    }
  }

  private async ensureSellerHasNoRouteOnDate(
    sellerId: string,
    workDate: Date,
    ignoreRouteId?: string,
  ): Promise<void> {
    const start = new Date(workDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(workDate);
    end.setHours(23, 59, 59, 999);

    const existingRoute = await this.routeModel
      .findOne({
        $or: [
          { seller: new Types.ObjectId(sellerId) },
          { substituteSeller: new Types.ObjectId(sellerId) },
        ],
        status: { $ne: RouteStatus.CANCELLED },
        workDate: {
          $gte: start,
          $lte: end,
        },
        ...(ignoreRouteId ? { _id: { $ne: ignoreRouteId } } : {}),
      })
      .select('_id')
      .exec();

    if (existingRoute) {
      throw new BadRequestException(
        'Seller already has a route or substitute route on this work date',
      );
    }
  }

  private async assertSellerNotOnApprovedLeave(
    sellerId: string,
    workDate: Date,
  ): Promise<void> {
    const start = new Date(workDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(workDate);
    end.setHours(23, 59, 59, 999);

    const leave = await this.leaveRequestModel
      .findOne({
        seller: new Types.ObjectId(sellerId),
        status: LeaveStatus.APPROVED,
        startDate: { $lte: end },
        endDate: { $gte: start },
      })
      .select('_id')
      .exec();

    if (leave) {
      throw new BadRequestException(
        'Seller has approved leave on this work date',
      );
    }
  }

  private async buildRouteListFilter(
    query?: PaginationQueryDto,
    baseFilter: QueryFilter = {},
  ): Promise<QueryFilter> {
    const filter: QueryFilter = {
      ...baseFilter,
    };

    if (query?.status) {
      filter.status = query.status as RouteStatus;
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

      const searchFilter = [
        { name: search },
        { seller: { $in: sellers.map((seller) => seller._id) } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
        delete filter.$or;
      } else {
        filter.$or = searchFilter;
      }
    }

    const workDate: DateRangeFilter = {};

    if (query?.fromDate) {
      workDate.$gte = new Date(query.fromDate);
    }

    if (query?.toDate) {
      workDate.$lte = new Date(query.toDate);
    }

    if (Object.keys(workDate).length > 0) {
      filter.workDate = workDate;
    }

    return filter;
  }

  async findAll(
    query?: PaginationQueryDto,
  ): Promise<Route[] | PaginatedResult<Route>> {
    const filter = await this.buildRouteListFilter(query);
    const routeQuery = this.routeModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return routeQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      routeQuery.skip(skip).limit(limit).exec(),
      this.routeModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findMyRoutes(
    sellerId: string,
    role: UserRole,
    query?: PaginationQueryDto,
  ): Promise<Route[] | PaginatedResult<Route>> {
    const managedSellerIds =
      role === UserRole.DISTRIBUTOR
        ? await this.getManagedSellerIds(sellerId)
        : undefined;
    const sellerFilter =
      role === UserRole.DISTRIBUTOR
        ? { $in: managedSellerIds }
        : new Types.ObjectId(sellerId);

    const filter = await this.buildRouteListFilter(query, {
      $or: [{ seller: sellerFilter }, { substituteSeller: sellerFilter }],
    });
    const routeQuery = this.routeModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address latitude longitude')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return routeQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      routeQuery.skip(skip).limit(limit).exec(),
      this.routeModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findToday(sellerId: string, role: UserRole): Promise<Route[]> {
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const seller =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(sellerId) }
        : new Types.ObjectId(sellerId);

    return this.routeModel
      .find({
        $or: [{ seller }, { substituteSeller: seller }],
        workDate: {
          $gte: start,
          $lte: end,
        },
      })
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address latitude longitude')
      .sort({ workDate: 1 })
      .exec();
  }

  async findById(id: string, userId: string, role: UserRole): Promise<Route> {
    const route = await this.routeModel
      .findById(id)
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address latitude longitude')
      .exec();

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const routeSellerId = this.getRelationId(route.seller);
    const substituteSellerId = route.substituteSeller
      ? this.getRelationId(route.substituteSeller)
      : undefined;

    if (
      role === UserRole.SELLER &&
      routeSellerId !== userId &&
      substituteSellerId !== userId
    ) {
      throw new ForbiddenException('You can only view your own routes');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const managedSellerIds = await this.getManagedSellerIds(userId);
      const canView = managedSellerIds.some(
        (sellerId) =>
          sellerId.toString() === routeSellerId ||
          sellerId.toString() === substituteSellerId,
      );

      if (!canView) {
        throw new ForbiddenException(
          'You can only view routes assigned to your sellers',
        );
      }
    }

    return route;
  }

  async update(
    id: string,
    updateRouteDto: UpdateRouteDto,
    userId: string,
    role: UserRole,
  ): Promise<Route> {
    const existingRoute = await this.assertRouteAccess(id, userId, role);
    const updateData: UpdateQuery<RouteDocument> & {
      name?: string;
      seller?: Types.ObjectId;
      workDate?: Date;
      customers?: {
        customer: Types.ObjectId;
        orderIndex: number;
        note?: string;
        status: RouteCustomerStatus;
      }[];
    } = {};

    if (updateRouteDto.name) {
      updateData.name = updateRouteDto.name;
    }

    if (updateRouteDto.seller) {
      const currentSellerId = existingRoute.seller.toString();
      const isChangingSeller = updateRouteDto.seller !== currentSellerId;

      if (isChangingSeller) {
        const visitCount = await this.visitModel.countDocuments({
          route: existingRoute._id,
        });

        if (visitCount > 0) {
          throw new BadRequestException(
            'Route already has visits. Assign a substitute seller instead of changing route owner',
          );
        }
      }

      await this.assertActiveSeller(updateRouteDto.seller);

      if (role === UserRole.DISTRIBUTOR) {
        await this.assertManagedSeller(userId, updateRouteDto.seller);
      }

      updateData.seller = new Types.ObjectId(updateRouteDto.seller);

      if (isChangingSeller) {
        updateData.$unset = {
          ...updateData.$unset,
          substituteSeller: '',
          substituteReason: '',
          substituteAssignedBy: '',
          substituteAssignedAt: '',
        };
      }

      if (!updateRouteDto.customers) {
        for (const item of existingRoute.customers) {
          const customer = await this.customerModel.findById(item.customer);

          if (!customer || !customer.isActive) {
            throw new NotFoundException(
              `Customer not found: ${item.customer.toString()}`,
            );
          }

          if (customer.assignedSeller.toString() !== updateRouteDto.seller) {
            throw new BadRequestException(
              `Customer ${customer.name} is not assigned to this seller`,
            );
          }
        }
      }
    }

    if (updateRouteDto.workDate) {
      updateData.workDate = new Date(updateRouteDto.workDate);
    }

    if (updateRouteDto.seller || updateRouteDto.workDate) {
      const targetSellerId =
        updateRouteDto.seller ?? existingRoute.seller.toString();
      const targetWorkDate = updateRouteDto.workDate
        ? new Date(updateRouteDto.workDate)
        : existingRoute.workDate;

      await this.ensureSellerHasNoRouteOnDate(
        targetSellerId,
        targetWorkDate,
        id,
      );
      await this.assertSellerNotOnApprovedLeave(targetSellerId, targetWorkDate);
    }

    if (updateRouteDto.workDate && existingRoute.substituteSeller) {
      const targetWorkDate = new Date(updateRouteDto.workDate);

      await this.ensureSellerHasNoRouteOnDate(
        existingRoute.substituteSeller.toString(),
        targetWorkDate,
        id,
      );
      await this.assertSellerNotOnApprovedLeave(
        existingRoute.substituteSeller.toString(),
        targetWorkDate,
      );
    }

    if (updateRouteDto.customers) {
      this.validateRouteCustomerPlan(updateRouteDto.customers);

      const existingCustomerStatusById = new Map<string, RouteCustomerStatus>(
        existingRoute.customers.map((item) => [
          item.customer.toString(),
          item.status,
        ]),
      );

      let validSellerId = updateRouteDto.seller;

      if (!validSellerId) {
        updateData.seller = existingRoute.seller;
        validSellerId = existingRoute.seller.toString();
      }

      const routeCustomers: {
        customer: Types.ObjectId;
        orderIndex: number;
        note?: string;
        status: RouteCustomerStatus;
      }[] = [];

      for (const item of updateRouteDto.customers) {
        const customer = await this.customerModel.findById(item.customer);

        if (!customer || !customer.isActive) {
          throw new NotFoundException(`Customer not found: ${item.customer}`);
        }

        if (customer.status !== CustomerStatus.APPROVED) {
          throw new BadRequestException(
            `Customer ${customer.name} has not been approved`,
          );
        }

        if (customer.assignedSeller.toString() !== validSellerId) {
          throw new BadRequestException(
            `Customer ${customer.name} is not assigned to this seller`,
          );
        }

        routeCustomers.push({
          customer: new Types.ObjectId(item.customer),
          orderIndex: item.orderIndex,
          note: item.note,
          status:
            existingCustomerStatusById.get(item.customer) ??
            RouteCustomerStatus.PENDING,
        });
      }

      updateData.customers = routeCustomers;
    }

    const route = await this.routeModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address latitude longitude')
      .exec();

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    this.emitRouteRealtime('status-updated', route);

    return route;
  }

  async assignSubstitute(
    id: string,
    assignSubstituteRouteDto: AssignSubstituteRouteDto,
    userId: string,
    role: UserRole,
  ): Promise<Route> {
    const existingRoute = await this.assertRouteAccess(id, userId, role);
    const routeOwner = await this.assertActiveSeller(
      existingRoute.seller.toString(),
      'Route owner not found',
    );
    const substituteSeller = await this.assertActiveSeller(
      assignSubstituteRouteDto.substituteSeller,
      'Substitute seller not found',
    );

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(
        userId,
        assignSubstituteRouteDto.substituteSeller,
      );
    }

    if (substituteSeller._id.toString() === existingRoute.seller.toString()) {
      throw new BadRequestException(
        'Substitute seller must be different from route owner',
      );
    }

    const routeOwnerManager = routeOwner.manager?.toString();
    const substituteManager = substituteSeller.manager?.toString();

    if (!routeOwnerManager || routeOwnerManager !== substituteManager) {
      throw new BadRequestException(
        'Substitute seller must belong to the same distributor as route owner',
      );
    }

    await this.ensureSellerHasNoRouteOnDate(
      assignSubstituteRouteDto.substituteSeller,
      existingRoute.workDate,
      id,
    );
    await this.assertSellerNotOnApprovedLeave(
      assignSubstituteRouteDto.substituteSeller,
      existingRoute.workDate,
    );

    const route = await this.routeModel
      .findByIdAndUpdate(
        id,
        {
          substituteSeller: new Types.ObjectId(
            assignSubstituteRouteDto.substituteSeller,
          ),
          substituteReason: assignSubstituteRouteDto.reason,
          substituteAssignedBy: new Types.ObjectId(userId),
          substituteAssignedAt: new Date(),
        },
        { returnDocument: 'after' },
      )
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address latitude longitude')
      .exec();

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    await this.notificationsService.create({
      user: assignSubstituteRouteDto.substituteSeller,
      title: 'Bạn có tuyến đi thay',
      message: `Bạn được phân công đi thay tuyến "${route.name}"`,
      type: NotificationType.ROUTE,
      relatedId: route._id.toString(),
    });

    this.emitRouteRealtime('substitute-assigned', route);

    return route;
  }

  async clearSubstitute(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<Route> {
    const existingRoute = await this.assertRouteAccess(id, userId, role);

    if (existingRoute.substituteSeller) {
      const substituteVisitCount = await this.visitModel.countDocuments({
        route: existingRoute._id,
        seller: existingRoute.substituteSeller,
      });

      if (substituteVisitCount > 0) {
        throw new BadRequestException(
          'Route already has substitute visits and cannot clear substitute seller',
        );
      }
    }

    const route = await this.routeModel
      .findByIdAndUpdate(
        id,
        {
          $unset: {
            substituteSeller: '',
            substituteReason: '',
            substituteAssignedBy: '',
            substituteAssignedAt: '',
          },
        },
        { returnDocument: 'after' },
      )
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('customers.customer', 'name phone address latitude longitude')
      .exec();

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    this.emitRouteRealtime('status-updated', route);

    return route;
  }

  async updateStatus(
    id: string,
    updateRouteStatusDto: UpdateRouteStatusDto,
    userId: string,
    role: UserRole,
  ): Promise<Route> {
    await this.assertRouteAccess(id, userId, role);

    const route = await this.routeModel
      .findByIdAndUpdate(
        id,
        { status: updateRouteStatusDto.status },
        { returnDocument: 'after' },
      )
      .populate('seller', 'fullName email phone companyName')
      .populate('substituteSeller', 'fullName email phone companyName')
      .populate('substituteAssignedBy', 'fullName email')
      .populate('customers.customer', 'name phone address')
      .exec();

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    this.emitRouteRealtime('status-updated', route);

    return route;
  }

  async markCustomerCheckedIn(
    routeId: string,
    customerId: string,
  ): Promise<Route> {
    const route = await this.routeModel.findById(routeId);

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (
      route.status === RouteStatus.COMPLETED ||
      route.status === RouteStatus.CANCELLED
    ) {
      throw new BadRequestException('Route is not available for check-in');
    }

    const routeCustomer = route.customers.find(
      (item) => item.customer.toString() === customerId,
    );

    if (!routeCustomer) {
      throw new NotFoundException('Customer not found in route');
    }

    routeCustomer.status = RouteCustomerStatus.CHECKED_IN;
    route.status = RouteStatus.IN_PROGRESS;

    const savedRoute = await route.save();

    this.emitRouteRealtime('customer-checked-in', savedRoute);

    return savedRoute;
  }

  async markCustomerVisited(
    routeId: string,
    customerId: string,
  ): Promise<Route> {
    const route = await this.routeModel.findById(routeId);

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (route.status === RouteStatus.CANCELLED) {
      throw new BadRequestException('Route has been cancelled');
    }

    const routeCustomer = route.customers.find(
      (item) => item.customer.toString() === customerId,
    );

    if (!routeCustomer) {
      throw new NotFoundException('Customer not found in route');
    }

    routeCustomer.status = RouteCustomerStatus.VISITED;

    const hasUnfinished = route.customers.some(
      (item) =>
        item.status === RouteCustomerStatus.PENDING ||
        item.status === RouteCustomerStatus.CHECKED_IN,
    );

    route.status = hasUnfinished
      ? RouteStatus.IN_PROGRESS
      : RouteStatus.COMPLETED;

    const savedRoute = await route.save();

    this.emitRouteRealtime('customer-visited', savedRoute);

    return savedRoute;
  }

  async remove(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<{ message: string }> {
    await this.assertRouteAccess(id, userId, role);

    const visitCount = await this.visitModel.countDocuments({
      route: new Types.ObjectId(id),
    });

    if (visitCount > 0) {
      throw new BadRequestException(
        'Route already has visits. Cancel the route instead of deleting it',
      );
    }

    const route = await this.routeModel.findByIdAndDelete(id).exec();

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    this.notificationsService.emitRealtime('route-updated', {
      action: 'deleted',
      route: id,
    });

    return {
      message: 'Route deleted successfully',
    };
  }
}
