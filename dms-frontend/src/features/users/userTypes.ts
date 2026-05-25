import type { UserRole } from "@/features/auth/authTypes";

export type { UserRole };

export interface User {
  _id: string;
  code?: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  manager?: string | User;
  companyName?: string;
  address?: string;
  taxCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  code?: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  manager?: string;
  companyName?: string;
  address?: string;
  taxCode?: string;
}

export interface UpdateUserRequest {
  code?: string;
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  manager?: string;
  companyName?: string;
  address?: string;
  taxCode?: string;
  isActive?: boolean;
}
