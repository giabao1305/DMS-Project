import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderStatus,
  OrderType,
} from '../orders/schemas/order.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { FinancialReportQueryDto } from './dto/financial-report-query.dto';
import { Kpi, KpiDocument } from './schemas/kpi.schema';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { SocketGateway } from '../socket/socket.gateway';

type MonthRange = {
  startDate: Date;
  endDate: Date;
};

type SalesReportRow = {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  totalRevenue: number;
  totalOrders: number;
};

type OrdersReportRow = {
  _id: OrderStatus;
  totalOrders: number;
  totalValue: number;
};

type ReportSeller = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  companyName?: string;
};

type VisitsReportRow = {
  _id: Types.ObjectId;
  totalVisits: number;
  seller: ReportSeller;
};

type SellersReportRow = {
  _id: Types.ObjectId;
  totalRevenue: number;
  totalOrders: number;
  seller: ReportSeller;
};

type ActualKpiData = {
  actualRevenue: number;
  actualOrders: number;
  actualVisits: number;
};

type ActualKpiAggregate = {
  actualRevenue: number;
  actualOrders: number;
};

type FinancialReportTotals = {
  deliveredOrders: number;
  grossSales: number;
  discountAmount: number;
  netRevenue: number;
  totalCost: number;
  grossProfit: number;
  collectedAmount: number;
  refundedAmount: number;
  netCollectedAmount: number;
  outstandingAmount: number;
};

type FinancialSellerRow = FinancialReportTotals & {
  seller: string;
  sellerName: string;
  sellerCode?: string;
  distributor?: string;
  distributorName?: string;
};

type FinancialProductRow = {
  product: string;
  productName: string;
  quantity: number;
  grossSales: number;
  totalCost: number;
  grossProfit: number;
};

type FinancialReport = {
  month: number;
  year: number;
  totals: FinancialReportTotals;
  sellers: FinancialSellerRow[];
  products: FinancialProductRow[];
};

const storeOrderMatch = {
  $or: [
    { orderType: OrderType.DISTRIBUTOR_TO_STORE },
    { orderType: { $exists: false }, customer: { $exists: true } },
  ],
};

const deliveredStoreOrderMatch = {
  ...storeOrderMatch,
  status: OrderStatus.DELIVERED,
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Kpi.name)
    private readonly kpiModel: Model<KpiDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  private emitKpiRealtime(action: string, kpi: Kpi): void {
    this.socketGateway.emitToAll('kpi-updated', {
      action,
      kpi,
    });

    this.socketGateway.emitToAll('reports-updated', {
      source: 'kpis',
      action,
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

  private getMonthRange(month: number, year: number): MonthRange {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return {
      startDate,
      endDate,
    };
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private emptyFinancialTotals(): FinancialReportTotals {
    return {
      deliveredOrders: 0,
      grossSales: 0,
      discountAmount: 0,
      netRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      collectedAmount: 0,
      refundedAmount: 0,
      netCollectedAmount: 0,
      outstandingAmount: 0,
    };
  }

  private addFinancialTotals(
    target: FinancialReportTotals,
    source: FinancialReportTotals,
  ): void {
    target.deliveredOrders += source.deliveredOrders;
    target.grossSales = this.roundMoney(target.grossSales + source.grossSales);
    target.discountAmount = this.roundMoney(
      target.discountAmount + source.discountAmount,
    );
    target.netRevenue = this.roundMoney(target.netRevenue + source.netRevenue);
    target.totalCost = this.roundMoney(target.totalCost + source.totalCost);
    target.grossProfit = this.roundMoney(
      target.grossProfit + source.grossProfit,
    );
    target.collectedAmount = this.roundMoney(
      target.collectedAmount + source.collectedAmount,
    );
    target.refundedAmount = this.roundMoney(
      target.refundedAmount + source.refundedAmount,
    );
    target.netCollectedAmount = this.roundMoney(
      target.netCollectedAmount + source.netCollectedAmount,
    );
    target.outstandingAmount = this.roundMoney(
      target.outstandingAmount + source.outstandingAmount,
    );
  }

  private async financialSellerIds(
    userId: string,
    role: UserRole,
    query: FinancialReportQueryDto,
  ): Promise<Types.ObjectId[]> {
    const filter: Record<string, unknown> = {
      role: UserRole.SELLER,
    };

    if (role === UserRole.DISTRIBUTOR) {
      filter.$or = [
        { manager: new Types.ObjectId(userId) },
        { manager: userId },
      ];
    }

    if (role === UserRole.ADMIN && query.distributor) {
      filter.$or = [
        { manager: new Types.ObjectId(query.distributor) },
        { manager: query.distributor },
      ];
    }

    if (query.seller) {
      filter._id = new Types.ObjectId(query.seller);
    }

    const sellers = await this.userModel.find(filter).select('_id').exec();
    return sellers.map((seller) => seller._id);
  }

  async getSalesReport(
    month?: number,
    year?: number,
  ): Promise<SalesReportRow[]> {
    const match: Record<string, unknown> = {
      status: OrderStatus.DELIVERED,
      orderType: { $ne: OrderType.MANUFACTURER_TO_DISTRIBUTOR },
    };

    if (month && year) {
      const { startDate, endDate } = this.getMonthRange(month, year);

      match.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const result = await this.orderModel.aggregate<SalesReportRow>([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
            day: {
              $dayOfMonth: '$createdAt',
            },
          },
          totalRevenue: {
            $sum: '$finalAmount',
          },
          totalOrders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
        },
      },
    ]);

    return result;
  }

  async getOrdersReport(
    month?: number,
    year?: number,
  ): Promise<OrdersReportRow[]> {
    const match: Record<string, unknown> = {
      orderType: { $ne: OrderType.MANUFACTURER_TO_DISTRIBUTOR },
    };

    if (month && year) {
      const { startDate, endDate } = this.getMonthRange(month, year);

      match.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    return this.orderModel.aggregate<OrdersReportRow>([
      {
        $match: match,
      },
      {
        $group: {
          _id: '$status',
          totalOrders: {
            $sum: 1,
          },
          totalValue: {
            $sum: '$finalAmount',
          },
        },
      },
    ]);
  }

  async getVisitsReport(
    month?: number,
    year?: number,
  ): Promise<VisitsReportRow[]> {
    const match: Record<string, unknown> = {};

    if (month && year) {
      const { startDate, endDate } = this.getMonthRange(month, year);

      match.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    return this.visitModel.aggregate<VisitsReportRow>([
      {
        $match: match,
      },
      {
        $group: {
          _id: '$seller',
          totalVisits: {
            $sum: 1,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller',
        },
      },
      {
        $unwind: '$seller',
      },
      {
        $project: {
          totalVisits: 1,
          seller: {
            _id: '$seller._id',
            fullName: '$seller.fullName',
            email: '$seller.email',
            companyName: '$seller.companyName',
          },
        },
      },
    ]);
  }

  async getSellersReport(
    month?: number,
    year?: number,
  ): Promise<SellersReportRow[]> {
    const match: Record<string, unknown> = {
      status: OrderStatus.DELIVERED,
      orderType: { $ne: OrderType.MANUFACTURER_TO_DISTRIBUTOR },
    };

    if (month && year) {
      const { startDate, endDate } = this.getMonthRange(month, year);

      match.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    return this.orderModel.aggregate<SellersReportRow>([
      {
        $match: match,
      },
      {
        $group: {
          _id: '$seller',
          totalRevenue: {
            $sum: '$finalAmount',
          },
          totalOrders: {
            $sum: 1,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller',
        },
      },
      {
        $unwind: '$seller',
      },
      {
        $project: {
          totalRevenue: 1,
          totalOrders: 1,
          seller: {
            _id: '$seller._id',
            fullName: '$seller.fullName',
            email: '$seller.email',
            companyName: '$seller.companyName',
          },
        },
      },
      {
        $sort: {
          totalRevenue: -1,
        },
      },
    ]);
  }

  async getFinancialReport(
    query: FinancialReportQueryDto,
    userId: string,
    role: UserRole,
  ): Promise<FinancialReport> {
    const { startDate, endDate } = this.getMonthRange(query.month, query.year);
    const sellerIds = await this.financialSellerIds(userId, role, query);
    const sellerMap = new Map<string, FinancialSellerRow>();
    const productMap = new Map<string, FinancialProductRow>();

    const sellers = await this.userModel
      .find({ _id: { $in: sellerIds } })
      .populate('manager', 'fullName companyName')
      .select('code fullName manager')
      .exec();

    for (const seller of sellers) {
      const distributor =
        seller.manager && typeof seller.manager !== 'string'
          ? (seller.manager as unknown as UserDocument)
          : undefined;
      sellerMap.set(seller._id.toString(), {
        seller: seller._id.toString(),
        sellerName: seller.fullName,
        sellerCode: seller.code,
        distributor: distributor?._id?.toString(),
        distributorName: distributor?.companyName || distributor?.fullName,
        ...this.emptyFinancialTotals(),
      });
    }

    const orders = await this.orderModel
      .find({
        $and: [
          storeOrderMatch,
          {
            $or: [
              { deliveredAt: { $gte: startDate, $lt: endDate } },
              {
                deliveredAt: { $exists: false },
                status: OrderStatus.DELIVERED,
                updatedAt: { $gte: startDate, $lt: endDate },
              },
              {
                deliveredAt: { $exists: false },
                updatedAt: { $exists: false },
                status: OrderStatus.DELIVERED,
                createdAt: { $gte: startDate, $lt: endDate },
              },
              { 'payments.collectedAt': { $gte: startDate, $lt: endDate } },
              { 'refunds.refundedAt': { $gte: startDate, $lt: endDate } },
            ],
          },
        ],
        seller: { $in: sellerIds },
      })
      .select(
        'seller items totalAmount discountAmount finalAmount totalCost grossProfit deliveredAt payments refunds status createdAt updatedAt',
      )
      .exec();

    for (const order of orders) {
      if (!order.seller) continue;
      const sellerLine = sellerMap.get(order.seller.toString());
      if (!sellerLine) continue;
      const orderDates = order as OrderDocument & {
        createdAt?: Date;
        updatedAt?: Date;
      };

      const deliveredAt = order.deliveredAt
        ? new Date(order.deliveredAt)
        : undefined;
      const fallbackDeliveredAt = orderDates.updatedAt ?? orderDates.createdAt;
      const deliveryReferenceDate =
        deliveredAt ??
        (order.status === OrderStatus.DELIVERED && fallbackDeliveredAt
          ? new Date(fallbackDeliveredAt)
          : undefined);
      const deliveredInPeriod =
        deliveryReferenceDate &&
        deliveryReferenceDate >= startDate &&
        deliveryReferenceDate < endDate;

      if (deliveredInPeriod) {
        sellerLine.deliveredOrders += 1;
        sellerLine.grossSales = this.roundMoney(
          sellerLine.grossSales + order.totalAmount,
        );
        sellerLine.discountAmount = this.roundMoney(
          sellerLine.discountAmount + order.discountAmount,
        );
        sellerLine.netRevenue = this.roundMoney(
          sellerLine.netRevenue + order.finalAmount,
        );
        sellerLine.totalCost = this.roundMoney(
          sellerLine.totalCost + (order.totalCost || 0),
        );
        sellerLine.grossProfit = this.roundMoney(
          sellerLine.grossProfit + (order.grossProfit || 0),
        );

        for (const item of order.items || []) {
          const productId = item.product.toString();
          const existing =
            productMap.get(productId) ||
            ({
              product: productId,
              productName: item.productName,
              quantity: 0,
              grossSales: 0,
              totalCost: 0,
              grossProfit: 0,
            } satisfies FinancialProductRow);
          existing.quantity += item.quantity || 0;
          existing.grossSales = this.roundMoney(
            existing.grossSales + (item.subtotal || 0),
          );
          const itemCost = (item.costPrice || 0) * (item.quantity || 0);
          existing.totalCost = this.roundMoney(existing.totalCost + itemCost);
          existing.grossProfit = this.roundMoney(
            existing.grossProfit +
              ((item.grossProfit ?? item.subtotal - itemCost) || 0),
          );
          productMap.set(productId, existing);
        }
      }

      const collectedAmount = (order.payments || [])
        .filter(
          (payment) =>
            payment.collectedAt >= startDate && payment.collectedAt < endDate,
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
      const refundedAmount = (order.refunds || [])
        .filter(
          (refund) =>
            refund.refundedAt >= startDate && refund.refundedAt < endDate,
        )
        .reduce((sum, refund) => sum + refund.amount, 0);
      const netCollectedAmount = collectedAmount - refundedAmount;

      sellerLine.collectedAmount = this.roundMoney(
        sellerLine.collectedAmount + collectedAmount,
      );
      sellerLine.refundedAmount = this.roundMoney(
        sellerLine.refundedAmount + refundedAmount,
      );
      sellerLine.netCollectedAmount = this.roundMoney(
        sellerLine.netCollectedAmount + netCollectedAmount,
      );
    }

    const outstandingOrders = await this.orderModel
      .find({
        ...deliveredStoreOrderMatch,
        seller: { $in: sellerIds },
        $or: [
          { deliveredAt: { $lt: endDate } },
          { deliveredAt: { $exists: false }, updatedAt: { $lt: endDate } },
          {
            deliveredAt: { $exists: false },
            updatedAt: { $exists: false },
            createdAt: { $lt: endDate },
          },
        ],
      })
      .select('seller finalAmount payments refunds')
      .exec();

    for (const order of outstandingOrders) {
      if (!order.seller) continue;
      const sellerLine = sellerMap.get(order.seller.toString());
      if (!sellerLine) continue;
      const paidUntilEnd = (order.payments || [])
        .filter((payment) => payment.collectedAt < endDate)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const refundedUntilEnd = (order.refunds || [])
        .filter((refund) => refund.refundedAt < endDate)
        .reduce((sum, refund) => sum + refund.amount, 0);

      sellerLine.outstandingAmount = this.roundMoney(
        sellerLine.outstandingAmount +
          Math.max(order.finalAmount - (paidUntilEnd - refundedUntilEnd), 0),
      );
    }

    const sellersReport = [...sellerMap.values()].sort(
      (a, b) => b.netRevenue - a.netRevenue,
    );
    const products = [...productMap.values()].sort(
      (a, b) => b.grossSales - a.grossSales,
    );
    const totals = this.emptyFinancialTotals();

    for (const seller of sellersReport) {
      this.addFinancialTotals(totals, seller);
    }

    return {
      month: query.month,
      year: query.year,
      totals,
      sellers: sellersReport,
      products,
    };
  }

  async createKpi(
    createKpiDto: CreateKpiDto,
    userId: string,
    role: UserRole,
  ): Promise<Kpi> {
    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, createKpiDto.seller);
    }

    const seller = await this.userModel.findById(createKpiDto.seller);

    if (!seller || seller.role !== UserRole.SELLER || !seller.isActive) {
      throw new NotFoundException('Seller not found');
    }

    const existingKpi = await this.kpiModel.findOne({
      seller: new Types.ObjectId(createKpiDto.seller),
      month: createKpiDto.month,
      year: createKpiDto.year,
    });

    if (existingKpi) {
      throw new BadRequestException('KPI already exists for this seller/month');
    }

    const actualData = await this.calculateActualKpi(
      createKpiDto.seller,
      createKpiDto.month,
      createKpiDto.year,
    );

    const performanceRate = this.calculatePerformanceRate({
      targetRevenue: createKpiDto.targetRevenue,
      actualRevenue: actualData.actualRevenue,
      targetOrders: createKpiDto.targetOrders,
      actualOrders: actualData.actualOrders,
      targetVisits: createKpiDto.targetVisits,
      actualVisits: actualData.actualVisits,
    });

    const kpi = new this.kpiModel({
      seller: new Types.ObjectId(createKpiDto.seller),
      month: createKpiDto.month,
      year: createKpiDto.year,
      targetRevenue: createKpiDto.targetRevenue,
      targetOrders: createKpiDto.targetOrders,
      targetVisits: createKpiDto.targetVisits,
      actualRevenue: actualData.actualRevenue,
      actualOrders: actualData.actualOrders,
      actualVisits: actualData.actualVisits,
      performanceRate,
    });

    const savedKpi = await kpi.save();

    this.emitKpiRealtime('created', savedKpi);

    return savedKpi;
  }
  async updateKpi(
    id: string,
    updateKpiDto: UpdateKpiDto,
    userId: string,
    role: UserRole,
  ): Promise<Kpi> {
    const kpi = await this.kpiModel.findById(id);

    if (!kpi) {
      throw new NotFoundException('KPI not found');
    }

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, kpi.seller.toString());
    }

    if (updateKpiDto.month !== undefined) {
      kpi.month = updateKpiDto.month;
    }

    if (updateKpiDto.year !== undefined) {
      kpi.year = updateKpiDto.year;
    }

    if (updateKpiDto.targetRevenue !== undefined) {
      kpi.targetRevenue = updateKpiDto.targetRevenue;
    }

    if (updateKpiDto.targetOrders !== undefined) {
      kpi.targetOrders = updateKpiDto.targetOrders;
    }

    if (updateKpiDto.targetVisits !== undefined) {
      kpi.targetVisits = updateKpiDto.targetVisits;
    }

    const actualData = await this.calculateActualKpi(
      kpi.seller.toString(),
      kpi.month,
      kpi.year,
    );

    kpi.actualRevenue = actualData.actualRevenue;
    kpi.actualOrders = actualData.actualOrders;
    kpi.actualVisits = actualData.actualVisits;

    kpi.performanceRate = this.calculatePerformanceRate({
      targetRevenue: kpi.targetRevenue,
      actualRevenue: kpi.actualRevenue,
      targetOrders: kpi.targetOrders,
      actualOrders: kpi.actualOrders,
      targetVisits: kpi.targetVisits,
      actualVisits: kpi.actualVisits,
    });

    const savedKpi = await kpi.save();

    this.emitKpiRealtime('updated', savedKpi);

    return savedKpi;
  }
  async findAllKpis(): Promise<Kpi[]> {
    return this.kpiModel
      .find()
      .populate('seller', 'fullName email phone companyName')
      .sort({ year: -1, month: -1 })
      .exec();
  }

  async findSellerKpis(sellerId: string): Promise<Kpi[]> {
    return this.kpiModel
      .find({
        seller: new Types.ObjectId(sellerId),
      })
      .populate('seller', 'fullName email phone companyName')
      .sort({ year: -1, month: -1 })
      .exec();
  }

  async findMyKpis(userId: string, role: UserRole): Promise<Kpi[]> {
    const seller =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(userId) }
        : new Types.ObjectId(userId);

    return this.kpiModel
      .find({
        seller,
      })
      .populate('seller', 'fullName email phone companyName')
      .sort({ year: -1, month: -1 })
      .exec();
  }

  async refreshKpi(id: string, userId: string, role: UserRole): Promise<Kpi> {
    const kpi = await this.kpiModel.findById(id);

    if (!kpi) {
      throw new NotFoundException('KPI not found');
    }

    if (role === UserRole.DISTRIBUTOR) {
      await this.assertManagedSeller(userId, kpi.seller.toString());
    }

    const actualData = await this.calculateActualKpi(
      kpi.seller.toString(),
      kpi.month,
      kpi.year,
    );

    kpi.actualRevenue = actualData.actualRevenue;
    kpi.actualOrders = actualData.actualOrders;
    kpi.actualVisits = actualData.actualVisits;

    kpi.performanceRate = this.calculatePerformanceRate({
      targetRevenue: kpi.targetRevenue,
      actualRevenue: actualData.actualRevenue,
      targetOrders: kpi.targetOrders,
      actualOrders: actualData.actualOrders,
      targetVisits: kpi.targetVisits,
      actualVisits: actualData.actualVisits,
    });

    const savedKpi = await kpi.save();

    this.emitKpiRealtime('refreshed', savedKpi);

    return savedKpi;
  }

  private async calculateActualKpi(
    sellerId: string,
    month: number,
    year: number,
  ): Promise<ActualKpiData> {
    const { startDate, endDate } = this.getMonthRange(month, year);
    const sellerObjectId = new Types.ObjectId(sellerId);

    const revenueResult = await this.orderModel.aggregate<ActualKpiAggregate>([
      {
        $match: {
          seller: sellerObjectId,
          status: OrderStatus.DELIVERED,
          orderType: { $ne: OrderType.MANUFACTURER_TO_DISTRIBUTOR },
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          actualRevenue: {
            $sum: '$finalAmount',
          },
          actualOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    const visits = await this.visitModel.countDocuments({
      seller: sellerObjectId,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    return {
      actualRevenue: revenueResult[0]?.actualRevenue || 0,
      actualOrders: revenueResult[0]?.actualOrders || 0,
      actualVisits: visits,
    };
  }

  private calculatePerformanceRate(data: {
    targetRevenue: number;
    actualRevenue: number;
    targetOrders: number;
    actualOrders: number;
    targetVisits: number;
    actualVisits: number;
  }): number {
    const revenueRate =
      data.targetRevenue > 0 ? data.actualRevenue / data.targetRevenue : 0;

    const orderRate =
      data.targetOrders > 0 ? data.actualOrders / data.targetOrders : 0;

    const visitRate =
      data.targetVisits > 0 ? data.actualVisits / data.targetVisits : 0;

    const averageRate = ((revenueRate + orderRate + visitRate) / 3) * 100;

    return Math.round(averageRate * 100) / 100;
  }
}
