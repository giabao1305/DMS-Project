"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Flex, Spin, Typography } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";

const { Text } = Typography;

export function DistributorDetailLoading() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: 360 }}>
      <Spin size="large" />
    </Flex>
  );
}

export function DistributorDetailShell({
  title,
  description,
  backHref,
  children,
}: {
  title: string;
  description: string;
  backHref: string;
  children: ReactNode;
}) {
  return (
    <>
      <SellerBreadcrumb />
      <SellerPageHeader
        title={title}
        description={description}
        extra={
          <Link href={backHref}>
            <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
          </Link>
        }
      />

      <Flex vertical gap={20} className="distributor-detail-stack">
        {children}
      </Flex>

      <style jsx global>{`
        .distributor-detail-card {
          overflow: hidden;
          border: 1px solid #d7ebe7;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .distributor-detail-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid #d7ebe7;
          background: #f3fbf9;
        }

        .distributor-detail-card .ant-card-body {
          padding: 18px;
        }

        .distributor-detail-title {
          color: #0b2f2a !important;
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-detail-description,
        .distributor-detail-muted {
          color: #5d7471 !important;
          font-size: 13px;
          line-height: 1.55;
        }

        .distributor-detail-strong {
          color: #0b2f2a !important;
          font-weight: 800;
        }

        .distributor-detail-card .ant-descriptions-bordered .ant-descriptions-item-label {
          color: #5d7471;
          font-weight: 750;
          background: #f3fbf9;
        }

        .distributor-detail-card .ant-descriptions-bordered .ant-descriptions-item-content {
          color: #0b2f2a;
          font-weight: 600;
          background: #ffffff;
        }

        .distributor-detail-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #d7ebe7;
          border-radius: 14px;
        }

        .distributor-detail-table .ant-table-thead > tr > th {
          color: #0b2f2a !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          background: #f3fbf9 !important;
          border-bottom: 1px solid #d7ebe7 !important;
        }

        .distributor-detail-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .distributor-detail-table .ant-table-tbody > tr:hover > td {
          background: #f3fbf9 !important;
        }

        .distributor-detail-empty .ant-card-body {
          padding: 36px;
        }
      `}</style>
    </>
  );
}

export function DistributorDetailCard({
  title,
  description,
  extra,
  children,
}: {
  title: ReactNode;
  description?: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card
      variant="borderless"
      className="distributor-detail-card"
      title={
        <Flex vertical gap={2}>
          <Text strong className="distributor-detail-title">
            {title}
          </Text>
          {description && (
            <Text className="distributor-detail-description">{description}</Text>
          )}
        </Flex>
      }
      extra={extra}
    >
      {children}
    </Card>
  );
}

export function DistributorDetailEmpty({ description }: { description: string }) {
  return (
    <Card variant="borderless" className="distributor-detail-card distributor-detail-empty">
      <Empty description={description} />
    </Card>
  );
}
