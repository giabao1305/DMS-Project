export type UserRole = "admin" | "distributor" | "seller";

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  manager?: string | AuthUser;
  isActive: boolean;
  phone?: string;
  code?: string;
  companyName?: string;
  avatar?: string;
};

export type CustomerStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "pending"
  | "approved"
  | "delivered"
  | "return_requested"
  | "cancelled"
  | "returned";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentMethod = "cash" | "bank_transfer" | "online_qr" | "other";
export type VisitStatus = "checked_in" | "checked_out";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type RouteStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type RouteCustomerStatus = "pending" | "checked_in" | "visited" | "skipped";
export type NotificationType =
  | "order"
  | "leave"
  | "visit"
  | "route"
  | "inventory"
  | "promotion"
  | "system";

export type Customer = {
  _id: string;
  name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  ownerName?: string;
  customerType?: string;
  status: CustomerStatus;
  isActive: boolean;
  rejectReason?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  category?: string | { _id: string; name: string };
  price: number;
  unit: string;
  stock: number;
  minStock: number;
  image?: string;
  isActive: boolean;
};

export type Warehouse = {
  _id: string;
  name: string;
  code: string;
  type: "manufacturer" | "distributor";
  distributor?: string | AuthUser;
  isActive: boolean;
};

export type WarehouseStock = {
  _id: string;
  warehouse: string | Warehouse;
  product: string | Product;
  quantity: number;
  averageCost: number;
  sellingPrice?: number;
};

export type PromotionType = "percent" | "amount" | "product_gift";

export type Promotion = {
  _id: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  giftProduct?: string | Product;
  giftQuantity?: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  costPrice?: number;
  grossProfit?: number;
};

export type OrderPayment = {
  amount: number;
  method: PaymentMethod;
  note?: string;
  collectedBy: string | AuthUser;
  collectedAt: string;
};

export type OrderRefund = {
  amount: number;
  method: PaymentMethod;
  note?: string;
  refundedBy: string | AuthUser;
  refundedAt: string;
};

export type Order = {
  _id: string;
  orderCode: string;
  customer: string | Customer;
  seller: string | AuthUser;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  totalCost?: number;
  grossProfit?: number;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  balanceDue?: number;
  payments?: OrderPayment[];
  refundedAmount?: number;
  refunds?: OrderRefund[];
  promotion?: string | Promotion;
  status: OrderStatus;
  note?: string;
  deliveredAt?: string;
  returnReason?: string;
  returnRequestedAt?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RouteCustomer = {
  customer: string | Customer;
  orderIndex: number;
  note?: string;
  status?: RouteCustomerStatus;
};

export type RoutePlan = {
  _id: string;
  name: string;
  seller: string | AuthUser;
  substituteSeller?: string | AuthUser;
  substituteReason?: string;
  substituteAssignedBy?: string | AuthUser;
  substituteAssignedAt?: string;
  workDate: string;
  customers: RouteCustomer[];
  status: RouteStatus;
  createdAt: string;
  updatedAt: string;
};

export type Visit = {
  _id: string;
  seller: string | AuthUser;
  customer: string | Customer;
  route?: string | RoutePlan;
  checkInTime: string;
  checkOutTime?: string;
  checkInLatitude: number;
  checkInLongitude: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  note?: string;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
};

export type LeaveRequest = {
  _id: string;
  seller: string | AuthUser;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  _id: string;
  user: string | AuthUser;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
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
  todayRoutes: RoutePlan[];
  unreadNotifications: number;
};

export type Kpi = {
  _id: string;
  seller: string | AuthUser;
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
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
