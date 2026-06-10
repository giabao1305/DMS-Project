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

      <Flex vertical gap={14} className="distributor-detail-stack">
        {children}
      </Flex>

      <style jsx global>{`
        .distributor-detail-card {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 16px 34px rgba(37, 99, 235, 0.06);
        }

        .distributor-detail-card .ant-card-head {
          min-height: 56px;
          padding: 12px 16px;
          border-bottom: 1px solid #dbeafe;
          background: #f8fbff;
        }

        .distributor-detail-card .ant-card-body {
          padding: 14px;
        }

        .distributor-detail-title {
          color: #0f172a !important;
          font-size: 15px;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-detail-description,
        .distributor-detail-muted {
          color: #475569 !important;
          font-size: 12px;
          line-height: 1.45;
        }

        .distributor-detail-strong {
          color: #0f172a !important;
          font-weight: 800;
        }

        .distributor-detail-card .ant-descriptions-bordered .ant-descriptions-item-label {
          color: #475569;
          font-weight: 750;
          background: #f8fbff;
        }

        .distributor-detail-card .ant-descriptions-bordered .ant-descriptions-item-content {
          color: #0f172a;
          font-weight: 600;
          background: #ffffff;
        }

        .distributor-detail-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 14px;
        }

        .distributor-detail-table .ant-table-thead > tr > th {
          color: #0f172a !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          background: #f8fbff !important;
          border-bottom: 1px solid #dbeafe !important;
        }

        .distributor-detail-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #eaf2ff !important;
        }

        .distributor-detail-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .distributor-detail-empty .ant-card-body {
          padding: 24px;
        }

        .distributor-detail-empty .ant-empty-description,
        .distributor-detail-stack .ant-empty-description {
          color: #64748b !important;
          font-size: 14px;
          font-weight: 600;
        }

        .distributor-detail-empty .ant-empty-img-default-ellipse,
        .distributor-detail-stack .ant-empty-img-default-ellipse {
          fill: #eff6ff !important;
          fill-opacity: 1 !important;
        }

        .distributor-detail-empty .ant-empty-img-default-path-1,
        .distributor-detail-empty .ant-empty-img-default-path-2,
        .distributor-detail-empty .ant-empty-img-default-path-3,
        .distributor-detail-empty .ant-empty-img-default-path-4,
        .distributor-detail-empty .ant-empty-img-default-path-5,
        .distributor-detail-stack .ant-empty-img-default-path-1,
        .distributor-detail-stack .ant-empty-img-default-path-2,
        .distributor-detail-stack .ant-empty-img-default-path-3,
        .distributor-detail-stack .ant-empty-img-default-path-4,
        .distributor-detail-stack .ant-empty-img-default-path-5 {
          fill: #bfdbfe !important;
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
      <Empty className="distributor-detail-empty-state" description={description} />
    </Card>
  );
}





