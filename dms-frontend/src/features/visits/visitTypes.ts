import type { Customer } from "@/features/customers/customerTypes";
import type { Route } from "@/features/routes/routeTypes";
import type { User } from "@/features/users/userTypes";

export type VisitStatus = "checked_in" | "checked_out";

export interface Visit {
  _id: string;
  seller: string | User;
  customer: string | Customer;
  route?: string | Route;

  checkInTime: string;
  checkOutTime?: string;

  checkInLatitude: number;
  checkInLongitude: number;
  checkInDistance?: number;
  gpsAccuracy?: number;

  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutDistance?: number;

  note?: string;
  status: VisitStatus;

  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  customer: string;
  route?: string;
  checkInLatitude: number;
  checkInLongitude: number;
  gpsAccuracy?: number;
  note?: string;
}

export interface CheckOutRequest {
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  note?: string;
}
