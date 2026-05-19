import type { User } from "@/features/users/userTypes";

export type NotificationType =
  | "order"
  | "leave"
  | "visit"
  | "route"
  | "inventory"
  | "promotion"
  | "system";

export interface Notification {
  _id: string;

  user: string | User;

  title: string;

  message: string;

  type: NotificationType;

  relatedId?: string;

  isRead: boolean;

  createdAt: string;

  updatedAt: string;
}
