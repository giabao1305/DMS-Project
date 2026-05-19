import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';
import { CreateKpiDto } from './dto/create-kpi.dto';
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

  private getMonthRange(month: number, year: number): MonthRange {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return {
      startDate,
      endDate,
    };
  }

  async getSalesReport(
    month?: number,
    year?: number,
  ): Promise<SalesReportRow[]> {
    const match: Record<string, unknown> = {
      status: OrderStatus.DELIVERED,
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
    const match: Record<string, unknown> = {};

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

  async createKpi(createKpiDto: CreateKpiDto): Promise<Kpi> {
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
  async updateKpi(id: string, updateKpiDto: UpdateKpiDto): Promise<Kpi> {
    const kpi = await this.kpiModel.findById(id);

    if (!kpi) {
      throw new NotFoundException('KPI not found');
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

  async refreshKpi(id: string): Promise<Kpi> {
    const kpi = await this.kpiModel.findById(id);

    if (!kpi) {
      throw new NotFoundException('KPI not found');
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
