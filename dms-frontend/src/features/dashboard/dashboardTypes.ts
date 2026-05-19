import type { LeaveRequest } from "@/features/leaves/leaveTypes";
import type { Order } from "@/features/orders/orderTypes";
import type { Product } from "@/features/products/productTypes";
import type { Route } from "@/features/routes/routeTypes";

export type AdminDashboard = {
  totalSellers: number;
  activeSellers: number;
  totalCustomers: number;
  pendingCustomers: number;
  approvedCustomers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalVisits: number;
  pendingLeaves: number;
  lowStockPreview: Product[];
  pendingLeavePreview: LeaveRequest[];
  todayRoutePreview: Route[];
  recentOrders: Order[];
};

export type SellerDashboard = {
  totalCustomers: number;
  approvedCustomers: number;
  pendingCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalVisits: number;
  todayRoutes: Route[];
  unreadNotifications: number;
};
