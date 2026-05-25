import type { UserRole } from "@/features/auth/authTypes";

export const salesPortalRoles: UserRole[] = [
  "seller",
];

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin công ty",
  distributor: "Nhà phân phối",
  seller: "DSR",
};

export function isSalesPortalRole(role?: string | null): role is UserRole {
  return (
    role === "distributor" ||
    role === "seller"
  );
}

export function isSalesRepRole(role?: string | null): role is UserRole {
  return role === "seller";
}

export function getRoleHomePath(role?: string | null) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "distributor") return "/distributor/dashboard";

  return "/seller/dashboard";
}

export function getRoleLabel(role?: string | null) {
  if (!role) return "-";

  return roleLabels[role as UserRole] ?? role;
}
