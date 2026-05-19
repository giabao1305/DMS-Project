import type { UserRole } from "@/features/auth/authTypes";

export const salesPortalRoles: UserRole[] = [
  "distributor",
  "dsr",
  "seller",
];

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin công ty",
  distributor: "Nhà phân phối",
  dsr: "DSR",
  seller: "DSR",
};

export function isSalesPortalRole(role?: string | null): role is UserRole {
  return (
    role === "distributor" ||
    role === "dsr" ||
    role === "seller"
  );
}

export function isSalesRepRole(role?: string | null): role is UserRole {
  return role === "dsr" || role === "seller";
}

export function getRoleHomePath(role?: string | null) {
  return role === "admin" ? "/admin/dashboard" : "/seller/dashboard";
}

export function getRoleLabel(role?: string | null) {
  if (!role) return "-";

  return roleLabels[role as UserRole] ?? role;
}
