"use client";

import { getRoleHomePath, getRoleLabel } from "@/features/auth/roleUtils";
import { Button, Result, Space, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const { Text } = Typography;

function ForbiddenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required") ?? "";
  const currentRole = searchParams.get("current") ?? "";
  const currentDashboard = getRoleHomePath(currentRole);
  const hasDashboard = currentDashboard !== "/forbidden";

  return (
    <main className="system-state-page">
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle={
          <Space direction="vertical" size={6}>
            <Text>
              Tài khoản hiện tại không được phép mở khu vực vừa yêu cầu.
            </Text>
            {requiredRole && currentRole ? (
              <Text type="secondary">
                Yêu cầu quyền {requiredRole}; tài khoản hiện tại là{" "}
                {getRoleLabel(currentRole)}.
              </Text>
            ) : null}
          </Space>
        }
        extra={
          <Space wrap>
            {hasDashboard ? (
              <Button type="primary" onClick={() => router.replace(currentDashboard)}>
                Về dashboard của tôi
              </Button>
            ) : null}
            <Button onClick={() => router.replace("/auth/login")}>
              Đăng nhập tài khoản khác
            </Button>
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

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<main className="system-state-page" />}>
      <ForbiddenContent />
    </Suspense>
  );
}
