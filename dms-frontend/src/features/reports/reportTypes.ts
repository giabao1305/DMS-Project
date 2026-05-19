import type { User } from "@/features/users/userTypes";

export interface SalesReportItem {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  totalRevenue: number;
  totalOrders: number;
}
export interface UpdateKpiRequest {
  month?: number;
  year?: number;
  targetRevenue?: number;
  targetOrders?: number;
  targetVisits?: number;
}
export interface CreateKpiRequest {
  seller: string;
  month: number;
  year: number;
  targetRevenue: number;
  targetOrders: number;
  targetVisits: number;
}

export interface OrdersReportItem {
  _id:
    | "pending"
    | "approved"
    | "delivered"
    | "return_requested"
    | "cancelled"
    | "returned";
  totalOrders: number;
  totalValue: number;
}

export interface VisitsReportItem {
  _id: string;
  totalVisits: number;
  seller: Pick<User, "_id" | "fullName" | "email" | "companyName">;
}

export interface SellersReportItem {
  _id: string;
  totalRevenue: number;
  totalOrders: number;
  seller: Pick<User, "_id" | "fullName" | "email" | "companyName">;
}

export interface Kpi {
  _id: string;
  seller: User;
  month: number;
  year: number;
  targetRevenue: number;
  actualRevenue: number;
  targetOrders: number;
  actualOrders: number;
  targetVisits: number;
  actualVisits: number;
  performanceRate: number;
  createdAt: string;
  updatedAt: string;
}
