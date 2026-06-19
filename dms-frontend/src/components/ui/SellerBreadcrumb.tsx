"use client";

import { Breadcrumb } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SalesMenuItem = {
  key: string;
  label: string;
};

const distributorMenuItems: SalesMenuItem[] = [
  { key: "/distributor/dashboard", label: "Tổng quan bán hàng" },
  { key: "/distributor/team", label: "Nhân viên bán hàng" },
  { key: "/distributor/customers", label: "Điểm bán phụ trách" },
  { key: "/distributor/orders", label: "Đơn" },
  { key: "/distributor/warehouse", label: "Kho của tôi" },
  { key: "/distributor/routes", label: "Tuyến bán hàng" },
  { key: "/distributor/visits", label: "Ghé thăm" },
  { key: "/distributor/leaves", label: "Nghỉ phép" },
  { key: "/distributor/kpis", label: "KPI nhân viên" },
  { key: "/distributor/notifications", label: "Thông báo" },
  { key: "/distributor/profile", label: "Tài khoản" },
];

export default function SellerBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  const currentMenu = [...distributorMenuItems]
    .sort((first, second) => second.key.length - first.key.length)
    .find(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
    );
  let actionLabel = "";

  if (paths.includes("create")) {
    actionLabel = "Thêm mới";
  } else if (paths.includes("edit")) {
    actionLabel = "Chỉnh sửa";
  } else if (paths.includes("import")) {
    actionLabel = "Nhập hàng";
  } else if (currentMenu && pathname !== currentMenu.key && paths.length > 2) {
    actionLabel = "Chi tiết";
  }

  const items: ItemType[] = [];

  if (currentMenu) {
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
