import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { createHmac } from 'crypto';
import type mongoose from 'mongoose';
import { Connection, Model, Types } from 'mongoose';

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
import {
  Route,
  RouteDocument,
  RouteStatus,
} from '../routes/schemas/route.schema';
import { WarehousesService } from '../warehouses/warehouses.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RequestReturnDto } from './dto/request-return.dto';
import { RecordOrderPaymentDto } from './dto/record-order-payment.dto';
import { RecordOrderRefundDto } from './dto/record-order-refund.dto';
import { UpdateSupplyPricingDto } from './dto/update-supply-pricing.dto';
import {
  Order,
  OrderDocument,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from './schemas/order.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { UpdateOrderDto } from './dto/update-order.dto';

type StockChange = {
  action: string;
  product: string;
  stock: number;
  warehouse?: string;
};

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<OrderDocument> & {
  createdAt?: DateRangeFilter;
};

type RelationId = Types.ObjectId | string | { _id: Types.ObjectId | string };

type VnpayQuery = Record<string, string | string[] | undefined>;

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

    @InjectModel(Route.name)
    private readonly routeModel: Model<RouteDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
    private readonly warehousesService: WarehousesService,
    private readonly configService: ConfigService,
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

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private recalculatePaymentSummary(order: OrderDocument): void {
    const paidAmount = order.paidAmount || 0;
    const refundedAmount = order.refundedAmount || 0;
    const netCollected = Math.max(paidAmount - refundedAmount, 0);

    order.balanceDue =
      order.status === OrderStatus.RETURNED
        ? 0
        : this.roundMoney(Math.max(order.finalAmount - netCollected, 0));
    order.paymentStatus =
      netCollected <= 0
        ? PaymentStatus.UNPAID
        : order.balanceDue === 0
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIAL;
  }

  private netCollectedAmount(order: Order): number {
    return Math.max((order.paidAmount || 0) - (order.refundedAmount || 0), 0);
  }

  private getRelationId(value?: RelationId): string {
    if (!value) {
      return '';
    }

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

  private getOrderParticipantUserIds(order: Order): string[] {
    const recipients = new Set<string>();

    if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      const distributorId = this.getRelationId(order.distributor);
      if (distributorId) recipients.add(distributorId);
      return [...recipients];
    }

    const sellerId = this.getRelationId(order.seller);
    const creatorId = this.getRelationId(order.createdBy);

    if (sellerId) recipients.add(sellerId);
    if (creatorId) recipients.add(creatorId);

    return [...recipients];
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

  private async findSubstituteRouteOwnerForOrder(
    sellerId: string,
    customerId: string,
  ): Promise<string | undefined> {
    const activeVisit = await this.visitModel
      .findOne({
        seller: new Types.ObjectId(sellerId),
        customer: new Types.ObjectId(customerId),
        status: VisitStatus.CHECKED_IN,
        route: { $exists: true },
      })
      .select('route')
      .sort({ checkInTime: -1 })
      .exec();

    if (!activeVisit?.route) {
      return undefined;
    }

    const route = await this.routeModel
      .findOne({
        _id: activeVisit.route,
        substituteSeller: new Types.ObjectId(sellerId),
        status: { $ne: RouteStatus.CANCELLED },
        'customers.customer': new Types.ObjectId(customerId),
      })
      .select('seller')
      .exec();

    return route?.seller.toString();
  }

  private async buildStoreOrderItems(
    sellerId: string,
    orderItems: { product: string | Types.ObjectId; quantity: number }[],
  ): Promise<{
    warehouse: Awaited<ReturnType<WarehousesService['findSellerWarehouse']>>;
    items: Order['items'];
    totalAmount: number;
    totalCost: number;
  }> {
    const warehouse =
      await this.warehousesService.findSellerWarehouse(sellerId);
    const items: Order['items'] = [];
    let totalAmount = 0;
    let totalCost = 0;

    for (const item of orderItems) {
      const productId = item.product.toString();
      const quantity = Number(item.quantity);
      const product = await this.productModel.findById(productId).exec();

      if (!product || !product.isActive) {
        throw new NotFoundException(`Product not found: ${productId}`);
      }

      const stock = await this.warehousesService.findProductStock(
        warehouse._id.toString(),
        productId,
      );

      if (stock.quantity < quantity) {
        throw new BadRequestException(
          `Not enough distributor stock for product ${product.name}`,
        );
      }

      const price = stock.sellingPrice ?? stock.averageCost;
      const subtotal = price * quantity;
      const itemCost = stock.averageCost * quantity;

      items.push({
        product: new Types.ObjectId(productId),
        productName: product.name,
        quantity,
        price,
        subtotal,
        costPrice: stock.averageCost,
        grossProfit: subtotal - itemCost,
      });

      totalAmount += subtotal;
      totalCost += itemCost;
    }

    return { warehouse, items, totalAmount, totalCost };
  }

  async create(
    createOrderDto: CreateOrderDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order items are required');
    }

    if (createOrderDto.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      return this.createManufacturerToDistributorOrder(
        createOrderDto,
        currentUserId,
        currentUserRole,
      );
    }

    if (!createOrderDto.customer) {
      throw new BadRequestException('Customer is required for store orders');
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
      currentUserRole === UserRole.SELLER &&
      customer.assignedSeller.toString() !== currentUserId
    ) {
      const substituteRouteOwner = await this.findSubstituteRouteOwnerForOrder(
        currentUserId,
        createOrderDto.customer,
      );

      if (substituteRouteOwner) {
        orderSellerId = substituteRouteOwner;
      }
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

    const { warehouse, items, totalAmount, totalCost } =
      await this.buildStoreOrderItems(orderSellerId, createOrderDto.items);

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
      orderType: OrderType.DISTRIBUTOR_TO_STORE,
      distributor: warehouse.distributor,
      warehouse: warehouse._id,
      seller: new Types.ObjectId(orderSellerId),
      customer: new Types.ObjectId(createOrderDto.customer),
      createdBy: new Types.ObjectId(currentUserId),
      items,
      promotion: promotionId,
      totalAmount,
      discountAmount,
      finalAmount,
      totalCost,
      grossProfit: finalAmount - totalCost,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: 0,
      balanceDue: finalAmount,
      payments: [],
      refundedAmount: 0,
      refunds: [],
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

  private async createManufacturerToDistributorOrder(
    createOrderDto: CreateOrderDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<Order> {
    if (
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.DISTRIBUTOR
    ) {
      throw new ForbiddenException(
        'Only admins or distributors can create manufacturer supply orders',
      );
    }

    const distributorId =
      currentUserRole === UserRole.DISTRIBUTOR
        ? currentUserId
        : createOrderDto.distributor;

    if (!distributorId) {
      throw new BadRequestException(
        'Distributor is required for supply orders',
      );
    }

    if (
      createOrderDto.customer ||
      createOrderDto.seller ||
      createOrderDto.promotion
    ) {
      throw new BadRequestException(
        'Supply orders cannot contain seller, customer or promotion',
      );
    }

    const distributor = await this.userModel
      .findOne({
        _id: new Types.ObjectId(distributorId),
        role: UserRole.DISTRIBUTOR,
        isActive: true,
      })
      .exec();

    if (!distributor) {
      throw new NotFoundException('Distributor not found');
    }

    const warehouse = await this.warehousesService.findDistributorWarehouse(
      distributor._id.toString(),
    );
    const items: Order['items'] = [];
    let totalAmount = 0;

    for (const item of createOrderDto.items) {
      const product = await this.productModel.findById(item.product).exec();

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
        costPrice: product.price,
        grossProfit: 0,
      });
      totalAmount += subtotal;
    }

    const order = new this.orderModel({
      orderCode: this.generateOrderCode(),
      orderType: OrderType.MANUFACTURER_TO_DISTRIBUTOR,
      distributor: distributor._id,
      warehouse: warehouse._id,
      createdBy: new Types.ObjectId(currentUserId),
      items,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      totalCost: totalAmount,
      grossProfit: 0,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: 0,
      balanceDue: 0,
      payments: [],
      refundedAmount: 0,
      refunds: [],
      status: OrderStatus.PENDING,
      note: createOrderDto.note,
      deliveryRecipientName: createOrderDto.deliveryRecipientName,
      deliveryPhone: createOrderDto.deliveryPhone,
      deliveryAddress: createOrderDto.deliveryAddress,
      requestedDeliveryDate: createOrderDto.requestedDeliveryDate
        ? new Date(createOrderDto.requestedDeliveryDate)
        : undefined,
    });

    const savedOrder = await order.save();

    if (currentUserRole === UserRole.DISTRIBUTOR) {
      await this.notificationsService.createForAdmins({
        title: 'Yêu cầu nhập kho mới',
        message: `Nhà phân phối vừa tạo yêu cầu nhập kho ${savedOrder.orderCode}`,
        type: NotificationType.ORDER,
        relatedId: savedOrder._id.toString(),
      });
    } else {
      await this.notificationsService.create({
        user: distributor._id.toString(),
        title: 'Đơn cấp hàng mới',
        message: `Nestlé vừa tạo đơn cấp hàng ${savedOrder.orderCode}`,
        type: NotificationType.ORDER,
        relatedId: savedOrder._id.toString(),
      });
    }

    this.emitOrderRealtime('created', savedOrder);

    return savedOrder;
  }

  async updateSupplyPricing(
    id: string,
    updateSupplyPricingDto: UpdateSupplyPricingDto,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderType !== OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      throw new BadRequestException(
        'Pricing can only be updated for supply orders',
      );
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Supply pricing can only be updated before delivery',
      );
    }

    const pricingByProduct = new Map(
      updateSupplyPricingDto.items.map((item) => [item.product, item]),
    );

    let totalAmount = 0;

    order.items = order.items.map((item) => {
      const productId = item.product.toString();
      const pricing = pricingByProduct.get(productId);

      if (!pricing) {
        throw new BadRequestException(
          `Missing pricing for product ${item.productName}`,
        );
      }

      const subtotal = pricing.price * item.quantity;
      totalAmount += subtotal;

      return {
        ...item,
        price: pricing.price,
        subtotal,
        costPrice: pricing.price,
        grossProfit: 0,
      };
    });

    order.totalAmount = totalAmount;
    order.discountAmount = 0;
    order.finalAmount = totalAmount;
    order.totalCost = totalAmount;
    order.grossProfit = 0;

    const savedOrder = await order.save();

    this.emitOrderRealtime('supply-pricing-updated', savedOrder);

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

    if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      throw new BadRequestException(
        'Supply order editing is not available; cancel and create a new order',
      );
    }

    if (!order.seller || !order.customer) {
      throw new BadRequestException(
        'Store order is missing seller or customer',
      );
    }

    const existingSellerId = order.seller.toString();
    const existingCustomerId = order.customer.toString();
    const existingCreatorId = order.createdBy?.toString();

    if (
      currentUserRole === UserRole.SELLER &&
      existingSellerId !== currentUserId &&
      existingCreatorId !== currentUserId
    ) {
      throw new ForbiddenException('You cannot update this order');
    }

    if (currentUserRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(currentUserId, existingSellerId);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
    }

    const targetSellerId =
      currentUserRole === UserRole.ADMIN && updateOrderDto.seller
        ? updateOrderDto.seller
        : currentUserRole === UserRole.DISTRIBUTOR && updateOrderDto.seller
          ? updateOrderDto.seller
          : existingSellerId;

    if (currentUserRole === UserRole.SELLER && updateOrderDto.seller) {
      throw new ForbiddenException('Seller cannot reassign orders');
    }

    if (currentUserRole === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(currentUserId, targetSellerId);
    }

    const customerId = updateOrderDto.customer || existingCustomerId;
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
      customerId !== existingCustomerId
    ) {
      await this.assertSellerCheckedInCustomer(currentUserId, customerId);
    }

    const { warehouse, items, totalAmount, totalCost } =
      await this.buildStoreOrderItems(targetSellerId, orderItems);

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
    order.distributor = warehouse.distributor;
    order.warehouse = warehouse._id;
    order.items = items;
    order.promotion = promotionId;
    order.totalAmount = totalAmount;
    order.discountAmount = discountAmount;
    order.finalAmount = totalAmount - discountAmount;
    order.totalCost = totalCost;
    order.grossProfit = order.finalAmount - totalCost;
    order.paymentStatus = PaymentStatus.UNPAID;
    order.paidAmount = 0;
    order.balanceDue = order.finalAmount;
    order.payments = [];
    order.refundedAmount = 0;
    order.refunds = [];
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

    if (query?.type === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      filter.orderType = query.type;
    }

    if (query?.type === OrderType.DISTRIBUTOR_TO_STORE) {
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        {
          $or: [
            { orderType: OrderType.DISTRIBUTOR_TO_STORE },
            {
              orderType: { $exists: false },
              customer: { $exists: true },
            },
          ],
        },
      ];
    }

    if (query?.distributor && Types.ObjectId.isValid(query.distributor)) {
      filter.distributor = new Types.ObjectId(query.distributor);
    }

    if (query?.search) {
      const search = buildSearchRegex(query.search);
      const searchFilter = [
        { orderCode: search },
        { note: search },
        { 'items.productName': search },
      ];

      if (filter.$or) {
        filter.$and = [
          ...(Array.isArray(filter.$and) ? filter.$and : []),
          { $or: filter.$or },
          { $or: searchFilter },
        ];
        delete filter.$or;
      } else {
        filter.$or = searchFilter;
      }
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
      .populate('distributor', 'code fullName email phone companyName address')
      .populate('warehouse', 'name code type')
      .populate('seller', 'fullName email phone companyName manager')
      .populate('createdBy', 'fullName email phone companyName manager')
      .populate('customer', 'name phone address')
      .populate('promotion', 'name type discountPercent discountAmount')
      .populate('returnRequestedBy', 'fullName email')
      .populate('returnApprovedBy', 'fullName email')
      .populate('payments.collectedBy', 'fullName email')
      .populate('refunds.refundedBy', 'fullName email')
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
    const scopeFilter =
      role === UserRole.DISTRIBUTOR
        ? {
            $or: [
              { seller: { $in: await this.getManagedSellerIds(sellerId) } },
              { createdBy: { $in: await this.getManagedSellerIds(sellerId) } },
              {
                distributor: new Types.ObjectId(sellerId),
                orderType: OrderType.DISTRIBUTOR_TO_STORE,
              },
              {
                distributor: new Types.ObjectId(sellerId),
                orderType: { $exists: false },
                customer: { $exists: true },
              },
              {
                orderType: OrderType.MANUFACTURER_TO_DISTRIBUTOR,
                distributor: new Types.ObjectId(sellerId),
              },
            ],
          }
        : {
            $or: [
              { seller: new Types.ObjectId(sellerId) },
              { createdBy: new Types.ObjectId(sellerId) },
            ],
          };

    const filter = this.buildOrderListFilter(query, scopeFilter);
    const orderQuery = this.orderModel
      .find(filter)
      .populate('distributor', 'code fullName email phone companyName address')
      .populate('warehouse', 'name code type')
      .populate('seller', 'fullName email phone companyName manager')
      .populate('createdBy', 'fullName email phone companyName manager')
      .populate('customer', 'name phone address')
      .populate('promotion', 'name type discountPercent discountAmount')
      .populate('returnRequestedBy', 'fullName email')
      .populate('returnApprovedBy', 'fullName email')
      .populate('payments.collectedBy', 'fullName email')
      .populate('refunds.refundedBy', 'fullName email')
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
      .populate('distributor', 'code fullName email phone companyName address')
      .populate('warehouse', 'name code type')
      .populate('seller', 'fullName email phone companyName manager')
      .populate('createdBy', 'fullName email phone companyName manager')
      .populate('customer', 'name phone address')
      .populate('promotion', 'name type discountPercent discountAmount')
      .populate('returnRequestedBy', 'fullName email')
      .populate('returnApprovedBy', 'fullName email')
      .populate('payments.collectedBy', 'fullName email')
      .populate('refunds.refundedBy', 'fullName email')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const orderSellerId = this.getRelationId(order.seller);
    const orderCreatorId = this.getRelationId(order.createdBy);

    if (
      role === UserRole.SELLER &&
      orderSellerId !== userId &&
      orderCreatorId !== userId
    ) {
      throw new ForbiddenException('You can only view your own orders');
    }

    if (role === UserRole.DISTRIBUTOR) {
      const isDistributorStoreOrder =
        this.getRelationId(order.distributor) === userId &&
        (order.orderType === OrderType.DISTRIBUTOR_TO_STORE ||
          (!order.orderType && Boolean(order.customer)));
      const isInboundSupplyOrder =
        order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR &&
        this.getRelationId(order.distributor) === userId;
      const managedSellerIds = await this.getManagedSellerIds(userId);
      const canView = managedSellerIds.some(
        (sellerId) =>
          sellerId.toString() === orderSellerId ||
          sellerId.toString() === orderCreatorId,
      );

      if (!canView && !isDistributorStoreOrder && !isInboundSupplyOrder) {
        throw new ForbiddenException(
          'You can only view orders created by your sellers or distributor',
        );
      }
    }

    return order;
  }

  async approve(
    id: string,
    approverId: string,
    approverRole: UserRole,
  ): Promise<Order> {
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

        const isStoreOrder =
          order.orderType === OrderType.DISTRIBUTOR_TO_STORE ||
          (!order.orderType && Boolean(order.customer));

        if (isStoreOrder && !order.warehouse) {
          if (!order.seller) {
            throw new BadRequestException('Store order is missing seller');
          }

          const warehouse = await this.warehousesService.findSellerWarehouse(
            order.seller.toString(),
          );
          order.warehouse = warehouse._id;
          order.distributor = warehouse.distributor;
        }

        if (approverRole === UserRole.DISTRIBUTOR) {
          const belongsToDistributor =
            this.getRelationId(order.distributor) === approverId;

          if (!isStoreOrder || !belongsToDistributor) {
            throw new ForbiddenException(
              'Distributor can only approve their own store orders',
            );
          }
        }

        for (const item of order.items) {
          if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
            const transaction =
              await this.inventoryService.decreaseStockForOrder(
                item.product.toString(),
                item.quantity,
                approverId,
                {
                  session,
                  notify: false,
                },
              );

            stockChanges.push({
              action: 'supply-order',
              product: item.product.toString(),
              stock: transaction.afterStock,
            });
            continue;
          }

          if (!order.warehouse) {
            throw new BadRequestException(
              'Store order does not have a distributor warehouse',
            );
          }

          const warehouseStock =
            await this.warehousesService.decreaseStoreOrderStock(
              order.warehouse.toString(),
              item.product.toString(),
              item.quantity,
              session,
            );

          stockChanges.push({
            action: 'store-order',
            product: item.product.toString(),
            stock: warehouseStock,
            warehouse: order.warehouse.toString(),
          });
        }

        order.status = OrderStatus.APPROVED;
        order.approvedBy = new Types.ObjectId(approverId);
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

    for (const recipientId of this.getOrderParticipantUserIds(approvedOrder)) {
      await this.notificationsService.create({
        user: recipientId,
        title: 'Order approved',
        message: `Order ${approvedOrder.orderCode} has been approved`,
        type: NotificationType.ORDER,
        relatedId: approvedOrder._id.toString(),
      });
    }

    for (const stockChange of stockChanges) {
      if (stockChange.warehouse) {
        this.notificationsService.emitRealtime(
          'warehouse-stock-updated',
          stockChange,
        );
        continue;
      }

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

  async deliver(
    id: string,
    delivererId: string,
    delivererRole: UserRole,
  ): Promise<Order> {
    const session = await this.connection.startSession();
    let savedOrder: OrderDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findById(id)
          .session(session)
          .exec();

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.APPROVED) {
          throw new BadRequestException(
            'Only approved orders can be delivered',
          );
        }

        const isStoreOrder =
          order.orderType === OrderType.DISTRIBUTOR_TO_STORE ||
          (!order.orderType && Boolean(order.customer));

        if (delivererRole === UserRole.DISTRIBUTOR) {
          const belongsToDistributor =
            this.getRelationId(order.distributor) === delivererId;

          if (!isStoreOrder || !belongsToDistributor) {
            throw new ForbiddenException(
              'Distributor can only deliver their own store orders',
            );
          }
        }

        if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
          if (!order.warehouse) {
            throw new BadRequestException(
              'Supply order does not have a destination warehouse',
            );
          }

          await this.warehousesService.receiveSupplyOrder(
            order.warehouse.toString(),
            order.items,
            session,
          );
        }

        order.status = OrderStatus.DELIVERED;
        order.deliveredAt = new Date();

        savedOrder = await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    if (!savedOrder) {
      throw new NotFoundException('Order not found');
    }

    const deliveredOrder = savedOrder as OrderDocument;
    for (const recipientId of this.getOrderParticipantUserIds(deliveredOrder)) {
      await this.notificationsService.create({
        user: recipientId,
        title: 'Đơn hàng đã giao',
        message: `Đơn hàng ${deliveredOrder.orderCode} đã được giao thành công`,
        type: NotificationType.ORDER,
        relatedId: deliveredOrder._id.toString(),
      });
    }

    this.emitOrderRealtime('delivered', deliveredOrder);

    return deliveredOrder;
  }

  async createVnpayPaymentUrl(
    id: string,
    userId: string,
    role: UserRole,
    ipAddress = '127.0.0.1',
  ) {
    const order = await this.findById(id, userId, role);

    if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      throw new BadRequestException(
        'VNPay payment is only available for store orders',
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'VNPay payment can only be created after delivery',
      );
    }

    const balanceDue =
      order.balanceDue ??
      Math.max(order.finalAmount - this.netCollectedAmount(order), 0);

    if (balanceDue <= 0) {
      throw new BadRequestException('Order has no outstanding balance');
    }

    const config = this.getVnpayConfig();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const txnRef = `${id}_${Date.now()}`;
    const orderInfo = `Thanh toan don hang ${order.orderCode}`;

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: String(Math.round(balanceDue * 100)),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: this.formatVnpayDate(now),
      vnp_ExpireDate: this.formatVnpayDate(expiresAt),
    };

    const paymentUrl = this.buildSignedVnpayUrl(config.paymentUrl, params);

    return {
      paymentUrl,
      qrValue: paymentUrl,
      txnRef,
      orderCode: order.orderCode,
      amount: balanceDue,
      orderInfo,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async handleVnpayCallback(query: VnpayQuery) {
    const params = this.normalizeVnpayQuery(query);
    const secureHash = params.vnp_SecureHash;

    if (!secureHash || !this.verifyVnpaySignature(params, secureHash)) {
      return { success: false, code: '97', message: 'Invalid checksum' };
    }

    const txnRef = params.vnp_TxnRef;
    const responseCode = params.vnp_ResponseCode;
    const transactionStatus = params.vnp_TransactionStatus;

    if (!txnRef) {
      return {
        success: false,
        code: '01',
        message: 'Missing transaction reference',
      };
    }

    if (responseCode !== '00' || transactionStatus !== '00') {
      return {
        success: false,
        code: '02',
        message: 'Payment was not successful',
        txnRef,
      };
    }

    const orderId = txnRef.split('_')[0];
    const amount = Number(params.vnp_Amount || 0) / 100;

    await this.recordVnpayPayment(orderId, amount, txnRef);

    return {
      success: true,
      code: '00',
      message: 'Payment confirmed',
      txnRef,
      orderId,
    };
  }

  private async recordVnpayPayment(
    orderId: string,
    amount: number,
    txnRef: string,
  ) {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.payments = order.payments || [];
    const existingPayment = order.payments.find(
      (payment) => payment.note === `VNPAY:${txnRef}`,
    );

    if (existingPayment) return order;

    const sellerId = order.seller?.toString() || order.createdBy?.toString();

    if (!sellerId) {
      throw new BadRequestException('Order is missing payment collector');
    }

    const balanceDue = Math.max(
      order.finalAmount - this.netCollectedAmount(order),
      0,
    );

    if (amount <= 0 || amount > balanceDue) {
      throw new BadRequestException('Invalid VNPay payment amount');
    }

    order.payments.push({
      amount,
      method: PaymentMethod.ONLINE_QR,
      note: `VNPAY:${txnRef}`,
      collectedBy: new Types.ObjectId(sellerId),
      collectedAt: new Date(),
    });
    order.paidAmount = this.roundMoney((order.paidAmount || 0) + amount);
    this.recalculatePaymentSummary(order);

    const savedOrder = await order.save();
    this.emitOrderRealtime('payment-recorded', savedOrder);

    return savedOrder;
  }

  private getVnpayConfig() {
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');

    if (!tmnCode || !hashSecret) {
      throw new BadRequestException(
        'Missing VNPAY_TMN_CODE or VNPAY_HASH_SECRET',
      );
    }

    const backendPublicUrl =
      this.configService.get<string>('BACKEND_PUBLIC_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || '5000'}`;

    return {
      tmnCode,
      hashSecret,
      paymentUrl:
        this.configService.get<string>('VNPAY_PAYMENT_URL') ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl:
        this.configService.get<string>('VNPAY_RETURN_URL') ||
        `${backendPublicUrl}/orders/vnpay/return`,
    };
  }

  private buildSignedVnpayUrl(baseUrl: string, params: Record<string, string>) {
    const secureHash = this.signVnpayParams(params);
    const query = new URLSearchParams(this.sortObject(params));
    query.append('vnp_SecureHash', secureHash);
    return `${baseUrl}?${query.toString()}`;
  }

  private verifyVnpaySignature(
    params: Record<string, string>,
    secureHash: string,
  ) {
    const unsignedParams = { ...params };
    delete unsignedParams.vnp_SecureHash;
    delete unsignedParams.vnp_SecureHashType;
    return this.signVnpayParams(unsignedParams) === secureHash;
  }

  private signVnpayParams(params: Record<string, string>) {
    const { hashSecret } = this.getVnpayConfig();
    const query = new URLSearchParams(this.sortObject(params)).toString();
    return createHmac('sha512', hashSecret).update(query).digest('hex');
  }

  private sortObject(params: Record<string, string>) {
    return Object.keys(params)
      .sort()
      .reduce<Record<string, string>>((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
  }

  private normalizeVnpayQuery(query: VnpayQuery) {
    return Object.entries(query).reduce<Record<string, string>>(
      (result, [key, value]) => {
        if (Array.isArray(value)) {
          result[key] = value[0] || '';
        } else if (typeof value === 'string') {
          result[key] = value;
        }
        return result;
      },
      {},
    );
  }

  private formatVnpayDate(date: Date) {
    const offsetDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return offsetDate
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
  }

  async recordPayment(
    id: string,
    dto: RecordOrderPaymentDto,
    userId: string,
    role: UserRole,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      throw new BadRequestException(
        'Payments in this flow are only recorded for store orders',
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Payment can only be recorded after delivery',
      );
    }

    if (!order.seller) {
      throw new BadRequestException('Store order is missing seller');
    }

    if (
      role === UserRole.SELLER &&
      order.seller.toString() !== userId &&
      order.createdBy?.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You can only collect payment for your own orders',
      );
    }

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, order.seller.toString());
    }

    const paidAmount = order.paidAmount || 0;
    const balanceDue = Math.max(
      order.finalAmount - this.netCollectedAmount(order),
      0,
    );

    if (dto.amount > balanceDue) {
      throw new BadRequestException('Payment exceeds outstanding balance');
    }

    order.payments = order.payments || [];
    order.payments.push({
      amount: dto.amount,
      method: dto.method,
      note: dto.note?.trim() || undefined,
      collectedBy: new Types.ObjectId(userId),
      collectedAt: new Date(),
    });
    order.paidAmount = this.roundMoney(paidAmount + dto.amount);
    this.recalculatePaymentSummary(order);

    const savedOrder = await order.save();

    if (order.distributor && order.distributor.toString() !== userId) {
      await this.notificationsService.create({
        user: order.distributor.toString(),
        title: 'Đã thu tiền đơn hàng',
        message: `Đơn ${order.orderCode} vừa thu ${dto.amount.toLocaleString('vi-VN')}đ`,
        type: NotificationType.ORDER,
        relatedId: order._id.toString(),
      });
    }

    this.emitOrderRealtime('payment-recorded', savedOrder);

    return savedOrder;
  }

  async recordRefund(
    id: string,
    dto: RecordOrderRefundDto,
    userId: string,
    role: UserRole,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderType === OrderType.MANUFACTURER_TO_DISTRIBUTOR) {
      throw new BadRequestException(
        'Refunds in this flow are only recorded for store orders',
      );
    }

    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.RETURN_REQUESTED
    ) {
      throw new BadRequestException(
        'Refund can only be recorded after delivery or during return review',
      );
    }

    if (!order.seller) {
      throw new BadRequestException('Store order is missing seller');
    }

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, order.seller.toString());
    }

    const refundableAmount = this.netCollectedAmount(order);

    if (dto.amount > refundableAmount) {
      throw new BadRequestException('Refund exceeds collected balance');
    }

    order.refunds = order.refunds || [];
    order.refunds.push({
      amount: dto.amount,
      method: dto.method,
      note: dto.note?.trim() || undefined,
      refundedBy: new Types.ObjectId(userId),
      refundedAt: new Date(),
    });
    order.refundedAmount = this.roundMoney(
      (order.refundedAmount || 0) + dto.amount,
    );
    this.recalculatePaymentSummary(order);

    const savedOrder = await order.save();

    if (order.seller && order.seller.toString() !== userId) {
      await this.notificationsService.create({
        user: order.seller.toString(),
        title: 'Đã hoàn tiền đơn hàng',
        message: `Đơn ${order.orderCode} vừa hoàn ${dto.amount.toLocaleString('vi-VN')}đ`,
        type: NotificationType.ORDER,
        relatedId: order._id.toString(),
      });
    }

    this.emitOrderRealtime('refund-recorded', savedOrder);

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

        if (this.netCollectedAmount(order) > 0) {
          throw new BadRequestException(
            'Collected money must be fully refunded before returning stock',
          );
        }

        for (const item of order.items) {
          if (order.orderType === OrderType.DISTRIBUTOR_TO_STORE) {
            if (!order.warehouse) {
              throw new BadRequestException(
                'Store order does not have a distributor warehouse',
              );
            }

            const warehouseStock =
              await this.warehousesService.increaseStoreOrderStock(
                order.warehouse.toString(),
                item.product.toString(),
                item.quantity,
                session,
              );

            stockChanges.push({
              action: 'store-return',
              product: item.product.toString(),
              stock: warehouseStock,
              warehouse: order.warehouse.toString(),
            });
            continue;
          }

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
            action: 'supply-return',
            product: item.product.toString(),
            stock: transaction.afterStock,
          });
        }

        order.status = OrderStatus.RETURNED;
        this.recalculatePaymentSummary(order);
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

    for (const recipientId of this.getOrderParticipantUserIds(returnedOrder)) {
      await this.notificationsService.create({
        user: recipientId,
        title: 'Order returned',
        message: `Order ${returnedOrder.orderCode} return has been approved`,
        type: NotificationType.ORDER,
        relatedId: returnedOrder._id.toString(),
      });
    }

    for (const stockChange of stockChanges) {
      if (stockChange.warehouse) {
        this.notificationsService.emitRealtime(
          'warehouse-stock-updated',
          stockChange,
        );
        continue;
      }

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

    if (
      !order.seller ||
      (order.seller.toString() !== sellerId &&
        order.createdBy?.toString() !== sellerId)
    ) {
      throw new ForbiddenException(
        'You can only request return for your own orders',
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can request return');
    }

    if (this.netCollectedAmount(order) > 0) {
      throw new BadRequestException(
        'Collected money must be fully refunded before requesting return',
      );
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

    if (
      role === UserRole.SELLER &&
      (!order.seller ||
        (order.seller.toString() !== userId &&
          order.createdBy?.toString() !== userId))
    ) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (role === UserRole.DISTRIBUTOR) {
      if (
        order.orderType !== OrderType.MANUFACTURER_TO_DISTRIBUTOR ||
        order.distributor?.toString() !== userId
      ) {
        if (!order.seller) {
          throw new ForbiddenException('You cannot cancel this order');
        }

        await this.assertManagedSeller(userId, order.seller.toString());
      }
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    order.status = OrderStatus.CANCELLED;

    const savedOrder = await order.save();

    for (const recipientId of this.getOrderParticipantUserIds(order)) {
      await this.notificationsService.create({
        user: recipientId,
        title: 'Đơn hàng đã bị hủy',
        message: `Đơn hàng ${order.orderCode} đã bị hủy`,
        type: NotificationType.ORDER,
        relatedId: order._id.toString(),
      });
    }

    this.emitOrderRealtime('cancelled', savedOrder);

    return savedOrder;
  }
}
