"use client";

import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getRoleHomePath } from "@/features/auth/roleUtils";

function getStoredHomePath() {
  if (typeof window === "undefined") return "/auth/login";

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) return "/auth/login";

  try {
    const parsedUser = JSON.parse(user) as { role?: string | null };
    return getRoleHomePath(parsedUser.role);
  } catch {
    return "/auth/login";
  }
}

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredHomePath());
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f7fb",
      }}
    >
      <Spin size="large" />
    </main>
  );
}
