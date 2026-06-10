import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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
import {
  Customer,
  CustomerDocument,
  CustomerStatus,
} from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

type QueryFilter = Record<string, any>;

type RelationId = Types.ObjectId | string | { _id: Types.ObjectId | string };

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private emitCustomerRealtime(action: string, customer: Customer): void {
    this.notificationsService.emitRealtime('customer-updated', {
      action,
      customer,
    });
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

  private async assertActiveSeller(sellerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new NotFoundException('Seller not found');
    }

    const seller = await this.userModel
      .findOne({
        _id: new Types.ObjectId(sellerId),
        role: UserRole.SELLER,
        isActive: true,
      })
      .select('_id')
      .exec();

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
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

  async create(
    createCustomerDto: CreateCustomerDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Customer> {
    const isAdmin = currentUserRole === UserRole.ADMIN;
    const isDistributor = currentUserRole === UserRole.DISTRIBUTOR;

    const assignedSeller =
      isAdmin || isDistributor
        ? createCustomerDto.assignedSeller
        : currentUserId;

    if (!assignedSeller) {
      throw new BadRequestException('Customer must be assigned to a seller');
    }

    if (isAdmin) {
      await this.assertActiveSeller(assignedSeller);
    }

    if (isDistributor) {
      await this.assertManagedSeller(currentUserId, assignedSeller);
    }

    const createdCustomer = new this.customerModel({
      ...createCustomerDto,

      assignedSeller: new Types.ObjectId(assignedSeller),
      createdBy: new Types.ObjectId(currentUserId),

      status: isAdmin ? CustomerStatus.APPROVED : CustomerStatus.PENDING,

      approvedBy: isAdmin ? new Types.ObjectId(currentUserId) : undefined,

      approvedAt: isAdmin ? new Date() : undefined,

      rejectReason: undefined,
      isActive: true,
    });

    const savedCustomer = await createdCustomer.save();

    if (!isAdmin) {
      const admins = await this.customerModel.db
        .collection('users')
        .find({ role: 'admin' })
        .toArray();

      await Promise.all(
        admins.map((admin) =>
          this.notificationsService.create({
            user: admin._id.toString(),
            title: 'Khách hàng mới chờ duyệt',
            message: `Seller vừa tạo khách hàng ${savedCustomer.name}`,
            type: NotificationType.SYSTEM,
            relatedId: savedCustomer._id.toString(),
          }),
        ),
      );
    } else {
      await this.notificationsService.create({
        user: assignedSeller,
        title: 'Khách hàng mới được gán',
        message: `Admin vừa gán khách hàng ${savedCustomer.name} cho bạn`,
        type: NotificationType.SYSTEM,
        relatedId: savedCustomer._id.toString(),
      });
    }

    this.emitCustomerRealtime('created', savedCustomer);

    return savedCustomer;
  }

  private buildCustomerListFilter(
    query?: PaginationQueryDto,
    baseFilter: QueryFilter = {},
  ): QueryFilter {
    const filter: QueryFilter = {
      ...baseFilter,
      isActive: true,
    };

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.search) {
      const search = buildSearchRegex(query.search);
      filter.$or = [
        { name: search },
        { phone: search },
        { address: search },
        { ownerName: search },
        { customerType: search },
      ];
    }

    return filter;
  }

  async findAll(
    query?: PaginationQueryDto,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const filter = this.buildCustomerListFilter(query);

    if (query?.distributor && Types.ObjectId.isValid(query.distributor)) {
      filter.assignedSeller = {
        $in: await this.getManagedSellerIds(query.distributor),
      };
    }

    const customerQuery = this.customerModel
      .find(filter)
      .populate('assignedSeller', 'fullName email phone companyName')
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return customerQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      customerQuery.skip(skip).limit(limit).exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findPending(): Promise<Customer[]> {
    return this.customerModel
      .find({
        status: CustomerStatus.PENDING,
        isActive: true,
      })
      .populate('assignedSeller', 'fullName email phone companyName')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findMyCustomers(
    userId: string,
    role: UserRole,
    query?: PaginationQueryDto,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const assignedSeller =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(userId) }
        : new Types.ObjectId(userId);

    const filter = this.buildCustomerListFilter(query, {
      assignedSeller,
    });
    const customerQuery = this.customerModel
      .find(filter)
      .populate('assignedSeller', 'fullName email phone companyName')
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return customerQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      customerQuery.skip(skip).limit(limit).exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findById(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<Customer> {
    const customer = await this.customerModel
      .findById(id)
      .populate('assignedSeller', 'fullName email phone companyName')
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (
      role === UserRole.SELLER &&
      this.getRelationId(customer.assignedSeller) !== userId
    ) {
      throw new ForbiddenException('You can only view your own customers');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const managedSellerIds = await this.getManagedSellerIds(userId);
      const assignedSellerId = this.getRelationId(customer.assignedSeller);
      const canView = managedSellerIds.some(
        (sellerId) => sellerId.toString() === assignedSellerId,
      );

      if (!canView) {
        throw new ForbiddenException(
          'You can only view customers assigned to your sellers',
        );
      }
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const isSeller = currentUserRole === UserRole.SELLER;
    const isDistributor = currentUserRole === UserRole.DISTRIBUTOR;
    const previousAssignedSeller = customer.assignedSeller.toString();

    if (isSeller && customer.assignedSeller.toString() !== currentUserId) {
      throw new ForbiddenException('You can only update your own customers');
    }

    if (isSeller && updateCustomerDto.assignedSeller) {
      throw new ForbiddenException('Seller cannot reassign customers');
    }

    if (isDistributor) {
      await this.assertManagedSeller(
        currentUserId,
        customer.assignedSeller.toString(),
      );

      if (updateCustomerDto.assignedSeller) {
        await this.assertManagedSeller(
          currentUserId,
          updateCustomerDto.assignedSeller,
        );
      }
    }

    if (!isDistributor && updateCustomerDto.assignedSeller) {
      await this.assertActiveSeller(updateCustomerDto.assignedSeller);
    }

    Object.assign(customer, updateCustomerDto);

    const savedCustomer = await customer.save();

    const nextAssignedSeller = savedCustomer.assignedSeller.toString();

    if (
      updateCustomerDto.assignedSeller &&
      nextAssignedSeller !== previousAssignedSeller
    ) {
      await this.notificationsService.create({
        user: nextAssignedSeller,
        title: 'Khách hàng mới được gán',
        message: `Bạn vừa được gán phụ trách khách hàng ${savedCustomer.name}`,
        type: NotificationType.SYSTEM,
        relatedId: savedCustomer._id.toString(),
      });
    }

    this.emitCustomerRealtime('updated', savedCustomer);

    return savedCustomer;
  }
  async approve(
    id: string,
    reviewerId: string,
    reviewerRole: UserRole,
  ): Promise<Customer> {
    const existingCustomer = await this.customerModel.findById(id).exec();

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    if (reviewerRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(
        reviewerId,
        existingCustomer.assignedSeller.toString(),
      );
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(
        id,
        {
          status: CustomerStatus.APPROVED,
          approvedBy: new Types.ObjectId(reviewerId),
          approvedAt: new Date(),
          rejectReason: undefined,
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.notificationsService.create({
      user: customer.assignedSeller.toString(),
      title: 'Khách hàng đã được duyệt',
      message: `Khách hàng ${customer.name} đã được Admin duyệt`,
      type: NotificationType.SYSTEM,
      relatedId: customer._id.toString(),
    });

    this.emitCustomerRealtime('approved', customer);

    return customer;
  }

  async reject(
    id: string,
    reviewerId: string,
    reviewerRole: UserRole,
    rejectReason: string,
  ): Promise<Customer> {
    if (!rejectReason) {
      throw new BadRequestException('Reject reason is required');
    }

    const existingCustomer = await this.customerModel.findById(id).exec();

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    if (reviewerRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(
        reviewerId,
        existingCustomer.assignedSeller.toString(),
      );
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(
        id,
        {
          status: CustomerStatus.REJECTED,
          approvedBy: new Types.ObjectId(reviewerId),
          approvedAt: new Date(),
          rejectReason,
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.notificationsService.create({
      user: customer.assignedSeller.toString(),
      title: 'Khách hàng bị từ chối',
      message: `Khách hàng ${customer.name} bị từ chối: ${rejectReason}`,
      type: NotificationType.SYSTEM,
      relatedId: customer._id.toString(),
    });

    this.emitCustomerRealtime('rejected', customer);

    return customer;
  }

  async remove(id: string): Promise<{ message: string }> {
    const customer = await this.customerModel
      .findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    this.emitCustomerRealtime('deleted', customer);

    return {
      message: 'Customer deleted successfully',
    };
  }
}
