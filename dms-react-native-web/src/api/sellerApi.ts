import { API_URLS, PAGE_SIZE } from "../config/env";
import type {
  Customer,
  AuthUser,
  LeaveRequest,
  Notification,
  Order,
  PaginatedResponse,
  Product,
  Promotion,
  RoutePlan,
  RouteStatus,
  SellerDashboard,
  Visit,
  Kpi,
} from "../types/domain";
import { request } from "./http";
import { getStoredSession } from "./authStore";
import { toVietnameseError } from "../utils/errorMessage";

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreateCustomerPayload = {
  name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  ownerName?: string;
  customerType?: string;
};

export type UpdateCustomerPayload = Partial<CreateCustomerPayload> & {
  isActive?: boolean;
};

export type CreateOrderPayload = {
  customer: string;
  items: Array<{ product: string; quantity: number }>;
  promotion?: string;
  note?: string;
};

export type UpdateOrderPayload = Partial<CreateOrderPayload>;

export type CreateVisitPayload = {
  customer: string;
  route?: string;
  checkInLatitude: number;
  checkInLongitude: number;
  gpsAccuracy?: number;
  note?: string;
};

export type CheckOutPayload = {
  checkOutLatitude: number;
  checkOutLongitude: number;
  note?: string;
};

export type CreateLeavePayload = {
  startDate: string;
  endDate: string;
  reason: string;
};

export type UploadImagePayload = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export const sellerApi = {
  login: (payload: LoginPayload) =>
    request("/auth/login", {
      method: "POST",
      auth: false,
      body: payload,
    }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request("/auth/change-password", { method: "PATCH", body: payload }),
  updateProfile: (payload: { fullName?: string; phone?: string; companyName?: string; avatar?: string }) =>
    request<AuthUser>("/auth/profile", { method: "PATCH", body: payload }),
  uploadImage: (payload: UploadImagePayload) => uploadImage(payload),

  dashboard: () => request<SellerDashboard>("/dashboard/seller"),

  customers: () => requestList<Customer>("/customers/my-customers"),
  customer: (id: string) => request<Customer>(`/customers/${id}`),
  createCustomer: (payload: CreateCustomerPayload) =>
    request<Customer>("/customers", { method: "POST", body: payload }),
  updateCustomer: (id: string, payload: UpdateCustomerPayload) =>
    request<Customer>(`/customers/${id}`, { method: "PATCH", body: payload }),
  deleteCustomer: (id: string) =>
    request<void>(`/customers/${id}`, { method: "DELETE" }),

  products: () => requestList<Product>("/products"),
  activePromotions: () => requestList<Promotion>("/promotions/active"),

  routes: () => requestList<RoutePlan>("/routes/my-routes"),
  route: (id: string) => request<RoutePlan>(`/routes/${id}`),
  todayRoutes: () => requestList<RoutePlan>("/routes/today"),
  updateRouteStatus: (id: string, status: RouteStatus) =>
    request<RoutePlan>(`/routes/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  orders: () => requestList<Order>("/orders/my-orders"),
  order: (id: string) => request<Order>(`/orders/${id}`),
  createOrder: (payload: CreateOrderPayload) =>
    request<Order>("/orders", { method: "POST", body: payload }),
  updateOrder: (id: string, payload: UpdateOrderPayload) =>
    request<Order>(`/orders/${id}`, { method: "PATCH", body: payload }),
  cancelOrder: (id: string) => request<Order>(`/orders/${id}/cancel`, { method: "PATCH" }),
  requestReturnOrder: (id: string, reason: string) =>
    request<Order>(`/orders/${id}/return-request`, {
      method: "PATCH",
      body: { reason },
    }),

  visits: () => requestList<Visit>("/visits/my-visits"),
  visit: (id: string) => request<Visit>(`/visits/${id}`),
  checkIn: (payload: CreateVisitPayload) =>
    request<Visit>("/visits/check-in", { method: "POST", body: payload }),
  checkOut: (id: string, payload: CheckOutPayload) =>
    request<Visit>(`/visits/${id}/check-out`, {
      method: "PATCH",
      body: payload,
    }),

  leaves: () => requestList<LeaveRequest>("/leaves/my-leaves"),
  leave: (id: string) => request<LeaveRequest>(`/leaves/${id}`),
  createLeave: (payload: CreateLeavePayload) =>
    request<LeaveRequest>("/leaves", { method: "POST", body: payload }),

  notifications: () => requestList<Notification>("/notifications"),
  unreadCount: () => request<{ unreadCount: number }>("/notifications/unread-count"),
  markAsRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () => request<void>("/notifications/read-all", { method: "PATCH" }),

  kpis: () => request<Kpi[]>("/reports/kpis/my-kpi"),
};

async function requestList<T>(path: string) {
  const payload = await request<T[] | PaginatedResponse<T>>(`${path}?limit=${PAGE_SIZE}`);
  if (Array.isArray(payload)) return payload;
  return payload.data || [];
}

async function uploadImage({ uri, fileName, mimeType }: UploadImagePayload) {
  const session = getStoredSession();
  const formData = new FormData();

  formData.append("file", {
    uri,
    name: fileName || `avatar-${Date.now()}.jpg`,
    type: mimeType || "image/jpeg",
  } as unknown as Blob);

  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}/upload/avatar`, {
        method: "POST",
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message;
        throw new Error(toVietnameseError(message || `Upload failed (${response.status})`));
      }

      return payload as { imageUrl: string; publicId: string };
    } catch (err) {
      if (baseUrl === API_URLS.at(-1)) {
        throw new Error(toVietnameseError(err instanceof Error ? err.message : "Không upload được ảnh"));
      }
    }
  }

  throw new Error("Không upload được ảnh");
}
