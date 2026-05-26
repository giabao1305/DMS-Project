// src/config/adminMenu.tsx

import {
  AimOutlined,
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FileSearchOutlined,
  GiftOutlined,
  LineChartOutlined,
  ProductOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export type AdminSidebarRoute = {
  key: string;
  label: string;
  icon: ReactNode;
  title: string;
  description: string;
};

export type AdminRouteGroup = {
  label: string;
  keys: string[];
};

export const adminSidebarRoutes: AdminSidebarRoute[] = [
  {
    key: "/admin/dashboard",
    label: "Tổng quan",
    icon: <DashboardOutlined />,
    title: "Tổng quan hệ thống",
    description: "Theo dõi vận hành, hiệu suất và dữ liệu mới nhất.",
  },
  {
    key: "/admin/visits",
    label: "Ghé thăm",
    icon: <AimOutlined />,
    title: "Quản lý ghé thăm",
    description: "Theo dõi hoạt động ghé thăm khách hàng của đội ngũ.",
  },
  {
    key: "/admin/routes",
    label: "Kế hoạch tuyến",
    icon: <EnvironmentOutlined />,
    title: "Kế hoạch tuyến",
    description: "Quản lý tuyến bán hàng và lịch trình di chuyển.",
  },
  {
    key: "/admin/users",
    label: "Nhân viên",
    icon: <UserOutlined />,
    title: "Quản lý nhân viên",
    description: "Theo dõi tài khoản, vai trò và dữ liệu nhân sự.",
  },
  {
    key: "/admin/customers",
    label: "Khách hàng",
    icon: <TeamOutlined />,
    title: "Quản lý khách hàng",
    description: "Quản lý hồ sơ, xét duyệt và chăm sóc khách hàng.",
  },
  {
    key: "/admin/categories",
    label: "Danh mục",
    icon: <AppstoreOutlined />,
    title: "Danh mục sản phẩm",
    description: "Tổ chức dữ liệu sản phẩm theo nhóm rõ ràng.",
  },
  {
    key: "/admin/products",
    label: "Sản phẩm",
    icon: <ProductOutlined />,
    title: "Quản lý sản phẩm",
    description: "Quản lý thông tin, hình ảnh và trạng thái sản phẩm.",
  },
  {
    key: "/admin/orders",
    label: "Đơn hàng",
    icon: <ShoppingCartOutlined />,
    title: "Quản lý đơn hàng",
    description: "Theo dõi trạng thái xử lý và luồng đơn hàng.",
  },
  {
    key: "/admin/inventory",
    label: "Kho hàng",
    icon: <DatabaseOutlined />,
    title: "Quản lý kho hàng",
    description: "Giám sát tồn kho, nhập xuất và luân chuyển hàng hóa.",
  },
  {
    key: "/admin/inventory/alerts",
    label: "Cảnh báo kho",
    icon: <AlertOutlined />,
    title: "Cảnh báo tồn kho",
    description: "Theo dõi sản phẩm hết hàng hoặc dưới ngưỡng tồn tối thiểu.",
  },
  {
    key: "/admin/promotions",
    label: "Khuyến mãi",
    icon: <GiftOutlined />,
    title: "Chương trình khuyến mãi",
    description: "Thiết lập ưu đãi và chính sách hỗ trợ bán hàng.",
  },
  {
    key: "/admin/leaves",
    label: "Nghỉ phép",
    icon: <CalendarOutlined />,
    title: "Yêu cầu nghỉ phép",
    description: "Xét duyệt và quản lý lịch nghỉ của nhân viên.",
  },
  {
    key: "/admin/reports",
    label: "Báo cáo",
    icon: <BarChartOutlined />,
    title: "Báo cáo vận hành",
    description: "Phân tích hiệu quả bán hàng và hoạt động hệ thống.",
  },
  {
    key: "/admin/kpis",
    label: "KPI",
    icon: <LineChartOutlined />,
    title: "Quản lý KPI",
    description: "Thiết lập và theo dõi mục tiêu kinh doanh.",
  },
  {
    key: "/admin/notifications",
    label: "Thông báo",
    icon: <BellOutlined />,
    title: "Trung tâm thông báo",
    description: "Theo dõi cập nhật mới và cảnh báo quan trọng.",
  },
  {
    key: "/admin/audit-logs",
    label: "Nhật ký",
    icon: <FileSearchOutlined />,
    title: "Nhật ký hệ thống",
    description: "Theo dõi lịch sử thao tác và thay đổi dữ liệu quan trọng.",
  },
  {
    key: "/admin/profile",
    label: "Tài khoản",
    icon: <UserOutlined />,
    title: "Hồ sơ cá nhân",
    description: "Cập nhật thông tin tài khoản và bảo mật đăng nhập.",
  },
];

export const adminRouteGroups: AdminRouteGroup[] = [
  {
    label: "Tổng quan",
    keys: ["/admin/dashboard"],
  },
  {
    label: "Vận hành",
    keys: [
      "/admin/visits",
      "/admin/routes",
      "/admin/orders",
      "/admin/inventory",
      "/admin/inventory/alerts",
    ],
  },
  {
    label: "Dữ liệu",
    keys: [
      "/admin/users",
      "/admin/customers",
      "/admin/categories",
      "/admin/products",
      "/admin/promotions",
      "/admin/leaves",
    ],
  },
  {
    label: "Phân tích",
    keys: ["/admin/reports", "/admin/kpis"],
  },
  {
    label: "Hệ thống",
    keys: ["/admin/notifications", "/admin/audit-logs", "/admin/profile"],
  },
];

export const adminRouteByKey = new Map(
  adminSidebarRoutes.map((route) => [route.key, route]),
);

export const adminMenuItems = adminSidebarRoutes.map(
  ({ key, icon, label }) => ({
    key,
    icon,
    label,
  }),
);

export const adminNameMap: Record<string, string> = {
  dashboard: "Tổng quan",
  visits: "Ghé thăm",
  users: "Nhân viên",
  customers: "Khách hàng",
  categories: "Danh mục",
  products: "Sản phẩm",
  orders: "Đơn hàng",
  routes: "Kế hoạch tuyến",
  inventory: "Kho hàng",
  alerts: "Cảnh báo kho",
  promotions: "Khuyến mãi",
  leaves: "Nghỉ phép",
  reports: "Báo cáo",
  notifications: "Thông báo",
  "audit-logs": "Nhật ký",
  profile: "Tài khoản",
  kpis: "KPI",
  create: "Thêm mới",
  edit: "Chỉnh sửa",
};
