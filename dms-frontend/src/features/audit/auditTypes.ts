import type { User } from "@/features/users/userTypes";

export interface AuditLog {
  _id: string;
  actor?: string | User;
  action: string;
  module: string;
  targetId?: string;
  targetLabel?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
