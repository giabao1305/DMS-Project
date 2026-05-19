import type { Customer } from "@/features/customers/customerTypes";
import type { User } from "@/features/users/userTypes";

export type RouteStatus = "planned" | "in_progress" | "completed" | "cancelled";

export type RouteCustomerStatus =
  | "pending"
  | "checked_in"
  | "visited"
  | "skipped";
export interface RouteCustomer {
  customer: string | Customer;
  orderIndex: number;
  note?: string;
  status?: RouteCustomerStatus;
}

export interface Route {
  _id: string;
  name: string;
  seller: string | User;
  workDate: string;
  customers: RouteCustomer[];
  status: RouteStatus;
  createdBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteCustomerRequest {
  customer: string;
  orderIndex: number;
  note?: string;
}

export interface CreateRouteRequest {
  name: string;
  seller: string;
  workDate: string;
  customers: CreateRouteCustomerRequest[];
}

export interface UpdateRouteRequest {
  name?: string;
  seller?: string;
  workDate?: string;
  customers?: CreateRouteCustomerRequest[];
}

export interface UpdateRouteStatusRequest {
  status: RouteStatus;
}
