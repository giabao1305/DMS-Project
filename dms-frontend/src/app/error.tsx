"use client";

import { Button, Result, Space, Typography } from "antd";
import { useEffect } from "react";

const { Text } = Typography;

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="system-state-page">
      <Result
        status="500"
        title="Hệ thống đang gặp lỗi"
        subTitle={
          <Space direction="vertical" size={6}>
            <Text>Vui lòng thử tải lại trang hoặc quay lại sau ít phút.</Text>
            {error.digest ? (
              <Text type="secondary">Mã lỗi: {error.digest}</Text>
            ) : null}
          </Space>
        }
        extra={
          <Space wrap>
            <Button type="primary" onClick={reset}>
              Thử lại
            </Button>
            <Button onClick={() => window.location.assign("/")}>
              Về trang chính
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
