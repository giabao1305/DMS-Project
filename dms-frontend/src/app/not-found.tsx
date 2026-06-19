"use client";

import { Button, Result, Space } from "antd";
import { useRouter } from "next/navigation";

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

function getStoredReturnPath() {
  if (typeof window === "undefined") return null;

  const currentPath = window.location.pathname;
  const currentValidPath = sessionStorage.getItem("dms:current-valid-path");
  const previousValidPath = sessionStorage.getItem("dms:previous-valid-path");

  if (currentValidPath && currentValidPath !== currentPath) {
    return currentValidPath;
  }

  if (previousValidPath && previousValidPath !== currentPath) {
    return previousValidPath;
  }

  return null;
}

export default function NotFoundPage() {
  const router = useRouter();

  const goHome = () => router.replace(getStoredHomePath());
  const goBack = () => {
    router.replace(getStoredReturnPath() ?? getStoredHomePath());
  };

  return (
    <main className="system-state-page">
      <Result
        status="404"
        title="Không tìm thấy trang"
        subTitle="Đường dẫn này không tồn tại hoặc đã được di chuyển."
        extra={
          <Space wrap>
            <Button type="primary" onClick={goHome}>
              Về trang chính
            </Button>
            <Button onClick={goBack}>Quay lại</Button>
          </Space>
        }
      />

      <style jsx global>{`
        .system-state-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f4f7fb;
        }

        .system-state-page .ant-result {
          width: min(720px, 100%);
          padding: 42px 28px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
        }

        .system-state-page .ant-result-title {
          color: #0f172a;
          font-weight: 800;
        }

        .system-state-page .ant-btn {
          border-radius: 8px;
          font-weight: 700;
        }
      `}</style>
    </main>
  );
}
