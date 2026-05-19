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

type QueryFilter = Record<string, any>;

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private emitCustomerRealtime(action: string, customer: Customer): void {
    this.notificationsService.emitRealtime('customer-updated', {
      action,
      customer,
    });
  }

  async create(
    createCustomerDto: CreateCustomerDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<Customer> {
    const isAdmin = currentUserRole === 'admin';

    const assignedSeller = createCustomerDto.assignedSeller || currentUserId;

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
      const search = new RegExp(query.search.trim(), 'i');
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
    query?: PaginationQueryDto,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const filter = this.buildCustomerListFilter(query, {
      assignedSeller: new Types.ObjectId(userId),
    });
    const customerQuery = this.customerModel.find(filter).sort(getSort(query));

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

  async findById(id: string): Promise<Customer> {
    const customer = await this.customerModel
      .findById(id)
      .populate('assignedSeller', 'fullName email phone companyName')
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const isSeller = currentUserRole === 'seller';

    if (isSeller && customer.assignedSeller.toString() !== currentUserId) {
      throw new ForbiddenException('You can only update your own customers');
    }

    Object.assign(customer, updateCustomerDto);

    const savedCustomer = await customer.save();

    this.emitCustomerRealtime('updated', savedCustomer);

    return savedCustomer;
  }
  async approve(id: string, adminId: string): Promise<Customer> {
    const customer = await this.customerModel
      .findByIdAndUpdate(
        id,
        {
          status: CustomerStatus.APPROVED,
          approvedBy: new Types.ObjectId(adminId),
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
    adminId: string,
    rejectReason: string,
  ): Promise<Customer> {
    if (!rejectReason) {
      throw new BadRequestException('Reject reason is required');
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(
        id,
        {
          status: CustomerStatus.REJECTED,
          approvedBy: new Types.ObjectId(adminId),
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
