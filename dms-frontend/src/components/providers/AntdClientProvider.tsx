"use client";

import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider } from "antd";
import type { ReactNode } from "react";

export default function AntdClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563EB",
          colorInfo: "#2563EB",
          colorSuccess: "#16A34A",
          colorWarning: "#F59E0B",
          colorError: "#DC2626",
          colorText: "#111827",
          colorTextSecondary: "#6B7280",
          colorBorder: "#E5E7EB",
          colorBgLayout: "#F5F7FB",
          colorBgContainer: "#FFFFFF",
          borderRadius: 10,
          borderRadiusLG: 16,
          fontFamily:
            'var(--font-roboto), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Button: {
            borderRadius: 10,
            controlHeight: 40,
            primaryShadow: "0 8px 18px rgba(37, 99, 235, 0.18)",
          },
          Card: {
            borderRadiusLG: 16,
            headerFontSize: 16,
          },
          Table: {
            borderColor: "#E5E7EB",
            headerBg: "#F8FAFC",
            headerColor: "#374151",
            rowHoverBg: "#F8FBFF",
          },
          Tag: {
            borderRadiusSM: 999,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
