import type { User } from "@/features/users/userTypes";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  _id: string;
  seller: string | User;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  adminNote?: string;
  approvedBy?: string | User;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface RejectLeaveRequest {
  adminNote: string;
}
