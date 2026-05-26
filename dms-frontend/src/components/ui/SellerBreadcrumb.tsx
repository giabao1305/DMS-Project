"use client";

import { Breadcrumb } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SalesMenuItem = {
  key: string;
  label: string;
};

const sellerMenuItems: SalesMenuItem[] = [
  { key: "/seller/dashboard", label: "Tổng quan" },
  { key: "/seller/customers", label: "Khách hàng" },
  { key: "/seller/orders", label: "Đơn hàng" },
  { key: "/seller/routes", label: "Tuyến bán hàng" },
  { key: "/seller/visits", label: "Ghé thăm" },
  { key: "/seller/kpis", label: "KPI cá nhân" },
  { key: "/seller/leaves", label: "Nghỉ phép" },
  { key: "/seller/notifications", label: "Thông báo" },
  { key: "/seller/profile", label: "Tài khoản" },
];

const distributorMenuItems: SalesMenuItem[] = [
  { key: "/distributor/dashboard", label: "Tổng quan" },
  { key: "/distributor/team", label: "Đội DSR" },
  { key: "/distributor/customers", label: "Khách hàng đội" },
  { key: "/distributor/orders", label: "Đơn hàng đội" },
  { key: "/distributor/routes", label: "Tuyến đội" },
  { key: "/distributor/visits", label: "Ghé thăm" },
  { key: "/distributor/kpis", label: "KPI đội" },
  { key: "/distributor/leaves", label: "Nghỉ phép" },
  { key: "/distributor/notifications", label: "Thông báo" },
  { key: "/distributor/profile", label: "Tài khoản" },
];

export default function SellerBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);
  const isDistributor = pathname.startsWith("/distributor");
  const menuItems = isDistributor ? distributorMenuItems : sellerMenuItems;
  const dashboardPath = isDistributor
    ? "/distributor/dashboard"
    : "/seller/dashboard";

  let currentMenu: SalesMenuItem | undefined;
  let actionLabel = "";

  for (const item of menuItems) {
    if (pathname.startsWith(item.key)) {
      currentMenu = item;
    }
  }

  if (paths.includes("create")) {
    actionLabel = "Thêm mới";
  } else if (paths.includes("edit")) {
    actionLabel = "Chỉnh sửa";
  } else if (paths.length > 2) {
    actionLabel = "Chi tiết";
  }

  const items: ItemType[] = [
    {
      title: (
        <Link href={dashboardPath} className="seller-breadcrumb-link">
          Tổng quan
        </Link>
      ),
    },
  ];

  if (currentMenu && currentMenu.key !== dashboardPath) {
    items.push({
      title: actionLabel ? (
        <Link href={currentMenu.key} className="seller-breadcrumb-link">
          {currentMenu.label}
        </Link>
      ) : (
        <span className="seller-breadcrumb-current">{currentMenu.label}</span>
      ),
    });
  }

  if (actionLabel) {
    items.push({
      title: (
        <span className="seller-breadcrumb-current seller-breadcrumb-action">
          {actionLabel}
        </span>
      ),
    });
  }

  return (
    <div className="seller-breadcrumb-shell">
      <Breadcrumb
        items={items}
        separator={<span className="seller-breadcrumb-separator">/</span>}
        className="seller-breadcrumb"
      />
    </div>
  );
}
