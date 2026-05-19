"use client";

import { Breadcrumb, Card, Typography } from "antd";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  title: ReactNode;
};

type Props = {
  title: string;
  description?: string;
  extra?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
};

export default function SellerPageHeader({
  title,
  description,
  extra,
  breadcrumb,
}: Props) {
  return (
    <>
      {breadcrumb && (
        <Breadcrumb items={breadcrumb} style={{ marginBottom: 16 }} />
      )}

      <Card
        className="seller-page-header-card"
        style={{ marginBottom: 16 }}
        styles={{
          body: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          },
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>

          {description && (
            <Typography.Text type="secondary">{description}</Typography.Text>
          )}
        </div>

        <div className="seller-page-header-extra">{extra}</div>
      </Card>
    </>
  );
}
