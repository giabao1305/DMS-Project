"use client";

import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { hydrateAuth } from "@/features/auth/authSlice";
import type { UserRole } from "@/features/auth/authTypes";
import { getRoleLabel } from "@/features/auth/roleUtils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function AuthGuard({
  children,
  role,
  roles,
}: {
  children: React.ReactNode;
  role?: UserRole;
  roles?: UserRole[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { token, user, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) {
      dispatch(hydrateAuth());
    }
  }, [dispatch, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (!token || !user) {
      router.replace("/auth/login");
      return;
    }

    const allowedRoles = roles ?? (role ? [role] : undefined);

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const searchParams = new URLSearchParams({
        required: allowedRoles.map(getRoleLabel).join(", "),
        current: user.role,
      });

      router.replace(`/forbidden?${searchParams.toString()}`);
    }
  }, [hydrated, token, user, role, roles, router]);

  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!token || !user) return null;

  const allowedRoles = roles ?? (role ? [role] : undefined);

  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
