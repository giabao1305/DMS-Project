"use client";

import { Breadcrumb } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminMenuItems } from "@/config/adminMenu";

type AdminMenuItem = {
  key: string;
  label: string;
};

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  let currentMenu: AdminMenuItem | undefined;
  let actionLabel = "";

  for (const item of adminMenuItems) {
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

  const items: ItemType[] = [];

  if (currentMenu) {
    items.push({
      title: actionLabel ? (
        <Link href={currentMenu.key} className="admin-breadcrumb-link">
          {currentMenu.label}
        </Link>
      ) : (
        <span className="admin-breadcrumb-current">{currentMenu.label}</span>
      ),
    });
  }

  if (actionLabel) {
    items.push({
      title: <span className="admin-breadcrumb-current">{actionLabel}</span>,
    });
  }

  return (
    <div className="admin-breadcrumb-shell">
      <Breadcrumb
        items={items}
        separator={<span className="admin-breadcrumb-separator">/</span>}
        className="admin-breadcrumb"
      />
    </div>
  );
}
