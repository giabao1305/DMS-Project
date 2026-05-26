import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type mongoose from 'mongoose';
import { Connection, Model, Types } from 'mongoose';

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
import { InventoryService } from '../inventory/inventory.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Promotion,
  PromotionDocument,
  PromotionType,
} from '../promotions/schemas/promotion.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {
  Visit,
  VisitDocument,
  VisitStatus,
} from '../visits/schemas/visit.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { RequestReturnDto } from './dto/request-return.dto';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { UpdateOrderDto } from './dto/update-order.dto';

type StockChange = {
  action: string;
  product: string;
  stock: number;
};

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<OrderDocument> & {
  createdAt?: DateRangeFilter;
};

type RelationId = Types.ObjectId | string | { _id: Types.ObjectId | string };

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateOrderCode(): string {
    const now = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${now}-${random}`;
  }

  private emitOrderRealtime(action: string, order: Order): void {
    this.notificationsService.emitRealtime('order-updated', {
      action,
      order,
    });

    this.notificationsService.emitRealtime('reports-updated', {
      source: 'orders',
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

  private async assertSellerCheckedInCustomer(
    sellerId: string,
    customerId: string,
  ): Promise<void> {
    const activeVisit = await this.visitModel
      .findOne({
        seller: new Types.ObjectId(sellerId),
        customer: new Types.ObjectId(customerId),
        status: VisitStatus.CHECKED_IN,
      })
      .select('_id')
      .exec();

    if (!activeVisit) {
      throw new ForbiddenException(
        'Seller must check in at this customer before creating an order',
      );
    }
  }

  async create(
    createOrderDto: CreateOrderDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order items are required');
    }

    let orderSellerId =
      currentUserRole === UserRole.ADMIN
        ? createOrderDto.seller
        : currentUserRole === UserRole.DISTRIBUTOR
          ? createOrderDto.seller
          : currentUserId;

    const customer = await this.customerModel.findById(createOrderDto.customer);

    if (!customer || !customer.isActive) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status !== CustomerStatus.APPROVED) {
      throw new BadRequestException('Customer has not been approved');
    }

    if (
      (currentUserRole === UserRole.ADMIN ||
        currentUserRole === UserRole.DISTRIBUTOR) &&
      !orderSellerId
    ) {
      orderSellerId = customer.assignedSeller.toString();
    }

    if (!orderSellerId) {
      throw new BadRequestException('Distributor must select a managed seller');
    }

    if (currentUserRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(currentUserId, orderSellerId);
    }

    if (customer.assignedSeller.toString() !== orderSellerId) {
      throw new ForbiddenException(
        'This customer is not assigned to selected seller',
      );
    }

    if (currentUserRole === UserRole.SELLER) {
      await this.assertSellerCheckedInCustomer(
        currentUserId,
        createOrderDto.customer,
      );
    }

    const items: {
      product: Types.ObjectId;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[] = [];

    let totalAmount = 0;

    for (const item of createOrderDto.items) {
      const product = await this.productModel.findById(item.product);

      if (!product || !product.isActive) {
        throw new NotFoundException(`Product not found: ${item.product}`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}`,
        );
      }

      const subtotal = product.price * item.quantity;

      items.push({
        product: new Types.ObjectId(item.product),
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });

      totalAmount += subtotal;
    }

    let discountAmount = 0;
    let promotionId: Types.ObjectId | undefined;

    if (createOrderDto.promotion) {
      const promotion = await this.promotionModel.findById(
        createOrderDto.promotion,
      );

      if (!promotion || !promotion.isActive) {
        throw new NotFoundException('Promotion not found');
      }

      const now = new Date();

      if (promotion.startDate > now || promotion.endDate < now) {
        throw new BadRequestException('Promotion is not active');
      }

      if (totalAmount < (promotion.minOrderValue || 0)) {
        throw new BadRequestException(
          'Order value does not meet promotion condition',
        );
      }

      if (promotion.type === PromotionType.PERCENT) {
        discountAmount = (totalAmount * (promotion.discountPercent || 0)) / 100;
      }

      if (promotion.type === PromotionType.AMOUNT) {
        discountAmount = promotion.discountAmount || 0;
      }

      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }

      promotionId = new Types.ObjectId(createOrderDto.promotion);
    }

    const finalAmount = totalAmount - discountAmount;

    const order = new this.orderModel({
      orderCode: this.generateOrderCode(),
      seller: new Types.ObjectId(orderSellerId),
      customer: new Types.ObjectId(createOrderDto.customer),
      items,
      promotion: promotionId,
      totalAmount,
      discountAmount,
      finalAmount,
      status: OrderStatus.PENDING,
      note: createOrderDto.note,
    });

    const savedOrder = await order.save();

    await this.notificationsService.createForAdmins({
      title: 'Đơn hàng mới',
      message: `Seller vừa tạo đơn hàng ${savedOrder.orderCode}`,
      type: NotificationType.ORDER,
      relatedId: savedOrder._id.toString(),
    });

    this.emitOrderRealtime('created', savedOrder);

    return savedOrder;
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      currentUserRole === UserRole.SELLER &&
      order.seller.toString() !== currentUserId
    ) {
      throw new ForbiddenException('You cannot update this order');
    }

    if (currentUserRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(currentUserId, order.seller.toString());
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
    }

    const targetSellerId =
      currentUserRole === UserRole.ADMIN && updateOrderDto.seller
        ? updateOrderDto.seller
        : currentUserRole === UserRole.DISTRIBUTOR && updateOrderDto.seller
          ? updateOrderDto.seller
          : order.seller.toString();

    if (currentUserRole === UserRole.SELLER && updateOrderDto.seller) {
      throw new ForbiddenException('Seller cannot reassign orders');
    }

    if (currentUserRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(currentUserId, targetSellerId);
    }

    const customerId = updateOrderDto.customer || order.customer.toString();
    const orderItems = updateOrderDto.items || order.items;

    const customer = await this.customerModel.findById(customerId);

    if (!customer || !customer.isActive) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status !== CustomerStatus.APPROVED) {
      throw new BadRequestException('Customer has not been approved');
    }

    if (customer.assignedSeller.toString() !== targetSellerId) {
      throw new ForbiddenException(
        'This customer is not assigned to selected seller',
      );
    }

    if (
      currentUserRole === UserRole.SELLER &&
      customerId !== order.customer.toString()
    ) {
      await this.assertSellerCheckedInCustomer(currentUserId, customerId);
    }

    const items: {
      product: Types.ObjectId;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[] = [];

    let totalAmount = 0;

    for (const item of orderItems) {
      const productId = item.product.toString();
      const quantity = Number(item.quantity);

      const product = await this.productModel.findById(productId);

      if (!product || !product.isActive) {
        throw new NotFoundException(`Product not found: ${productId}`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}`,
        );
      }

      const subtotal = product.price * quantity;

      items.push({
        product: new Types.ObjectId(productId),
        productName: product.name,
        quantity,
        price: product.price,
        subtotal,
      });

      totalAmount += subtotal;
    }

    let discountAmount = 0;
    let promotionId: Types.ObjectId | undefined;

    const promotionValue =
      updateOrderDto.promotion !== undefined
        ? updateOrderDto.promotion
        : order.promotion?.toString();

    if (promotionValue) {
      const promotion = await this.promotionModel.findById(promotionValue);

      if (!promotion || !promotion.isActive) {
        throw new NotFoundException('Promotion not found');
      }

      const now = new Date();

      if (promotion.startDate > now || promotion.endDate < now) {
        throw new BadRequestException('Promotion is not active');
      }

      if (totalAmount < (promotion.minOrderValue || 0)) {
        throw new BadRequestException(
          'Order value does not meet promotion condition',
        );
      }

      if (promotion.type === PromotionType.PERCENT) {
        discountAmount = (totalAmount * (promotion.discountPercent || 0)) / 100;
      }

      if (promotion.type === PromotionType.AMOUNT) {
        discountAmount = promotion.discountAmount || 0;
      }

      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }

      promotionId = new Types.ObjectId(promotionValue);
    }

    order.customer = new Types.ObjectId(customerId);
    order.seller = new Types.ObjectId(targetSellerId);
    order.items = items;
    order.promotion = promotionId;
    order.totalAmount = totalAmount;
    order.discountAmount = discountAmount;
    order.finalAmount = totalAmount - discountAmount;
    order.note = updateOrderDto.note ?? order.note;

    const savedOrder = await order.save();

    await this.notificationsService.createForAdmins({
      title: 'Đơn hàng mới',
      message: `Seller vừa tạo đơn hàng ${savedOrder.orderCode}`,
      type: NotificationType.ORDER,
      relatedId: savedOrder._id.toString(),
    });

    this.emitOrderRealtime('updated', savedOrder);

    return savedOrder;
  }

  private buildOrderListFilter(
    query?: PaginationQueryDto,
    baseFilter: QueryFilter = {},
  ): QueryFilter {
    const filter: QueryFilter = {
      ...baseFilter,
    };

    if (query?.status) {
      filter.status = query.status as OrderStatus;
    }

    if (query?.search) {
      const search = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ orderCode: search }, { note: search }];
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
  ): Promise<Order[] | PaginatedResult<Order>> {
    const filter = this.buildOrderListFilter(query);
    const orderQuery = this.orderModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('customer', 'name phone address')
      .populate('promotion', 'name type discountPercent discountAmount')
      .populate('returnRequestedBy', 'fullName email')
      .populate('returnApprovedBy', 'fullName email')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return orderQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      orderQuery.skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findMyOrders(
    sellerId: string,
    role: UserRole,
    query?: PaginationQueryDto,
  ): Promise<Order[] | PaginatedResult<Order>> {
    const seller =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(sellerId) }
        : new Types.ObjectId(sellerId);

    const filter = this.buildOrderListFilter(query, {
      seller,
    });
    const orderQuery = this.orderModel
      .find(filter)
      .populate('seller', 'fullName email phone companyName')
      .populate('customer', 'name phone address')
      .populate('promotion', 'name type discountPercent discountAmount')
      .populate('returnRequestedBy', 'fullName email')
      .populate('returnApprovedBy', 'fullName email')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return orderQuery.exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      orderQuery.skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }

  async findById(id: string, userId: string, role: UserRole): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('seller', 'fullName email phone companyName')
      .populate('customer', 'name phone address')
      .populate('promotion', 'name type discountPercent discountAmount')
      .populate('returnRequestedBy', 'fullName email')
      .populate('returnApprovedBy', 'fullName email')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const orderSellerId = this.getRelationId(order.seller);

    if (role === UserRole.SELLER && orderSellerId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const managedSellerIds = await this.getManagedSellerIds(userId);
      const canView = managedSellerIds.some(
        (sellerId) => sellerId.toString() === orderSellerId,
      );

      if (!canView) {
        throw new ForbiddenException(
          'You can only view orders created by your sellers',
        );
      }
    }

    return order;
  }

  async approve(id: string, adminId: string): Promise<Order> {
    const session = await this.connection.startSession();
    let savedOrder: OrderDocument | null = null;
    const stockChanges: StockChange[] = [];

    try {
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findById(id)
          .session(session)
          .exec();

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
          throw new BadRequestException('Only pending orders can be approved');
        }

        for (const item of order.items) {
          const transaction = await this.inventoryService.decreaseStockForOrder(
            item.product.toString(),
            item.quantity,
            adminId,
            {
              session,
              notify: false,
            },
          );

          stockChanges.push({
            action: 'order',
            product: item.product.toString(),
            stock: transaction.afterStock,
          });
        }

        order.status = OrderStatus.APPROVED;
        order.approvedBy = new Types.ObjectId(adminId);
        order.approvedAt = new Date();

        savedOrder = await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    if (!savedOrder) {
      throw new NotFoundException('Order not found');
    }

    const approvedOrder = savedOrder as OrderDocument;

    await this.notificationsService.create({
      user: approvedOrder.seller.toString(),
      title: 'Order approved',
      message: `Order ${approvedOrder.orderCode} has been approved`,
      type: NotificationType.ORDER,
      relatedId: approvedOrder._id.toString(),
    });

    for (const stockChange of stockChanges) {
      this.notificationsService.emitRealtime('stock-updated', stockChange);
      this.notificationsService.emitRealtime('product-updated', {
        action: 'stock-changed',
        product: stockChange.product,
        stock: stockChange.stock,
      });
    }

    this.emitOrderRealtime('approved', approvedOrder);

    return approvedOrder;
  }

  async deliver(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.APPROVED) {
      throw new BadRequestException('Only approved orders can be delivered');
    }

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();

    const savedOrder = await order.save();

    await this.notificationsService.create({
      user: order.seller.toString(),
      title: 'Đơn hàng đã giao',
      message: `Đơn hàng ${order.orderCode} đã được giao thành công`,
      type: NotificationType.ORDER,
      relatedId: order._id.toString(),
    });

    this.emitOrderRealtime('delivered', savedOrder);

    return savedOrder;
  }

  async returnOrder(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<Order> {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can approve return requests');
    }

    const session = await this.connection.startSession();
    let savedOrder: OrderDocument | null = null;
    const stockChanges: StockChange[] = [];

    try {
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findById(id)
          .session(session)
          .exec();

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.RETURN_REQUESTED) {
          throw new BadRequestException(
            'Only return-requested orders can be returned',
          );
        }

        for (const item of order.items) {
          const transaction =
            await this.inventoryService.increaseStockForOrderReturn(
              item.product.toString(),
              item.quantity,
              userId,
              {
                session,
                notify: false,
              },
            );

          stockChanges.push({
            action: 'return',
            product: item.product.toString(),
            stock: transaction.afterStock,
          });
        }

        order.status = OrderStatus.RETURNED;
        order.returnApprovedBy = new Types.ObjectId(userId);
        order.returnedAt = new Date();

        savedOrder = await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    if (!savedOrder) {
      throw new NotFoundException('Order not found');
    }

    const returnedOrder = savedOrder as OrderDocument;

    await this.notificationsService.create({
      user: returnedOrder.seller.toString(),
      title: 'Order returned',
      message: `Order ${returnedOrder.orderCode} return has been approved`,
      type: NotificationType.ORDER,
      relatedId: returnedOrder._id.toString(),
    });

    for (const stockChange of stockChanges) {
      this.notificationsService.emitRealtime('stock-updated', stockChange);
      this.notificationsService.emitRealtime('product-updated', {
        action: 'stock-changed',
        product: stockChange.product,
        stock: stockChange.stock,
      });
    }

    this.emitOrderRealtime('returned', returnedOrder);

    return returnedOrder;
  }

  async requestReturn(
    id: string,
    requestReturnDto: RequestReturnDto,
    sellerId: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.seller.toString() !== sellerId) {
      throw new ForbiddenException(
        'You can only request return for your own orders',
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can request return');
    }

    order.status = OrderStatus.RETURN_REQUESTED;
    order.returnReason = requestReturnDto.reason.trim();
    order.returnRequestedBy = new Types.ObjectId(sellerId);
    order.returnRequestedAt = new Date();

    const savedOrder = await order.save();

    await this.notificationsService.createForAdmins({
      title: 'Yêu cầu trả hàng',
      message: `Seller yêu cầu trả hàng đơn ${order.orderCode}`,
      type: NotificationType.ORDER,
      relatedId: order._id.toString(),
    });

    this.emitOrderRealtime('return-requested', savedOrder);

    return savedOrder;
  }

  async cancel(id: string, userId: string, role: UserRole): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.SELLER && order.seller.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, order.seller.toString());
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    order.status = OrderStatus.CANCELLED;

    const savedOrder = await order.save();

    await this.notificationsService.create({
      user: order.seller.toString(),
      title: 'Đơn hàng đã bị hủy',
      message: `Đơn hàng ${order.orderCode} đã bị hủy`,
      type: NotificationType.ORDER,
      relatedId: order._id.toString(),
    });

    this.emitOrderRealtime('cancelled', savedOrder);

    return savedOrder;
  }
}
