import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
import {
  Notification,
  NotificationDocument,
} from '../notifications/schemas/notification.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Route, RouteDocument } from '../routes/schemas/route.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';

type RevenueAggregate = {
  totalRevenue: number;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,

    @InjectModel(Route.name)
    private readonly routeModel: Model<RouteDocument>,

    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

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

  async getAdminDashboard() {
    const [
      totalSellers,
      totalCustomers,
      pendingCustomers,
      approvedCustomers,
      totalProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalVisits,
      pendingLeaves,
      activeProducts,
      activeSellers,
      approvedOrders,
      cancelledOrders,
      lowStockPreview,
      pendingLeavePreview,
      todayRoutePreview,
      recentOrders,
    ] = await Promise.all([
      this.userModel.countDocuments({
        role: UserRole.SELLER,
        isActive: true,
      }),

      this.customerModel.countDocuments({
        isActive: true,
      }),

      this.customerModel.countDocuments({
        status: CustomerStatus.PENDING,
        isActive: true,
      }),

      this.customerModel.countDocuments({
        status: CustomerStatus.APPROVED,
        isActive: true,
      }),

      this.productModel.countDocuments({
        isActive: true,
      }),

      this.productModel.countDocuments({
        isActive: true,
        $expr: {
          $lte: ['$stock', '$minStock'],
        },
      }),

      this.orderModel.countDocuments(),

      this.orderModel.countDocuments({
        status: OrderStatus.PENDING,
      }),

      this.orderModel.countDocuments({
        status: OrderStatus.DELIVERED,
      }),

      this.visitModel.countDocuments(),

      this.leaveRequestModel.countDocuments({
        status: LeaveStatus.PENDING,
      }),

      this.productModel.countDocuments({
        isActive: true,
        isDeleted: { $ne: true },
      }),

      this.userModel.countDocuments({
        role: UserRole.SELLER,
        isActive: true,
      }),

      this.orderModel.countDocuments({
        status: OrderStatus.APPROVED,
      }),

      this.orderModel.countDocuments({
        status: OrderStatus.CANCELLED,
      }),

      this.productModel
        .find({
          isActive: true,
          isDeleted: { $ne: true },
          $expr: {
            $lte: ['$stock', '$minStock'],
          },
        })
        .sort({ stock: 1 })
        .limit(5)
        .exec(),

      this.leaveRequestModel
        .find({
          status: LeaveStatus.PENDING,
        })
        .populate('seller', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),

      this.routeModel
        .find({
          workDate: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        })
        .populate('seller', 'fullName email')
        .sort({ workDate: 1 })
        .limit(5)
        .exec(),

      this.orderModel.find().sort({ createdAt: -1 }).limit(7).exec(),
    ]);

    const revenueResult = await this.orderModel.aggregate<RevenueAggregate>([
      {
        $match: {
          status: OrderStatus.DELIVERED,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: '$finalAmount',
          },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      totalSellers,
      totalCustomers,
      pendingCustomers,
      approvedCustomers,
      totalProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      totalVisits,
      pendingLeaves,
      activeProducts,
      activeSellers,
      approvedOrders,
      cancelledOrders,
      lowStockPreview,
      pendingLeavePreview,
      todayRoutePreview,
      recentOrders,
    };
  }

  async getSellerDashboard(sellerId: string, role: UserRole) {
    const sellerObjectId = new Types.ObjectId(sellerId);
    const sellerFilter =
      role === UserRole.DISTRIBUTOR
        ? { $in: await this.getManagedSellerIds(sellerId) }
        : sellerObjectId;

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalCustomers,
      approvedCustomers,
      pendingCustomers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalVisits,
      todayRoutes,
      unreadNotifications,
    ] = await Promise.all([
      this.customerModel.countDocuments({
        assignedSeller: sellerFilter,
        isActive: true,
      }),

      this.customerModel.countDocuments({
        assignedSeller: sellerFilter,
        status: CustomerStatus.APPROVED,
        isActive: true,
      }),

      this.customerModel.countDocuments({
        assignedSeller: sellerFilter,
        status: CustomerStatus.PENDING,
        isActive: true,
      }),

      this.orderModel.countDocuments({
        seller: sellerFilter,
      }),

      this.orderModel.countDocuments({
        seller: sellerFilter,
        status: OrderStatus.PENDING,
      }),

      this.orderModel.countDocuments({
        seller: sellerFilter,
        status: OrderStatus.DELIVERED,
      }),

      this.visitModel.countDocuments({
        seller: sellerFilter,
      }),

      this.routeModel
        .find({
          seller: sellerFilter,
          workDate: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        })
        .populate('seller', 'fullName email phone companyName')
        .populate('customers.customer', 'name phone address latitude longitude')
        .sort({ workDate: 1 })
        .exec(),

      this.notificationModel.countDocuments({
        user: sellerObjectId,
        isRead: false,
      }),
    ]);

    const revenueResult = await this.orderModel.aggregate<RevenueAggregate>([
      {
        $match: {
          seller: sellerFilter,
          status: OrderStatus.DELIVERED,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: '$finalAmount',
          },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      totalCustomers,
      approvedCustomers,
      pendingCustomers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      totalVisits,
      todayRoutes,
      unreadNotifications,
    };
  }
}
