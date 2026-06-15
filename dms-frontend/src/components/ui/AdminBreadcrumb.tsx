"use client";

import { Breadcrumb } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminMenuItems, adminNameMap } from "@/config/adminMenu";

type AdminMenuItem = {
  key: string;
  label: string;
};

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);
  const section = paths[1];

  let currentMenu: AdminMenuItem | undefined = [...adminMenuItems]
    .sort((first, second) => second.key.length - first.key.length)
    .find(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
    );
  let actionLabel = "";

  if (!currentMenu && section) {
    currentMenu = {
      key: `/admin/${section}`,
      label: adminNameMap[section] || section,
    };
  }

  if (paths.includes("create")) {
    actionLabel = adminNameMap.create;
  } else if (paths.includes("edit")) {
    actionLabel = adminNameMap.edit;
  } else if (currentMenu && pathname !== currentMenu.key && paths.length > 2) {
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
