"use client";

import { Breadcrumb, Card, Flex, Typography } from "antd";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  title: ReactNode;
};

type Props = {
  title: string;
  description?: string;
  extra?: ReactNode;
  eyebrow?: string;
  breadcrumb?: BreadcrumbItem[];
};

export default function AdminPageHeader({
  title,
  description,
  extra,
  eyebrow = "Admin Console",
  breadcrumb,
}: Props) {
  return (
    <>
      {breadcrumb && (
        <Breadcrumb items={breadcrumb} style={{ marginBottom: 16 }} />
      )}

      <Card
        className="admin-page-header-card"
        variant="borderless"
        style={{ marginBottom: 16 }}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={16}
          wrap="wrap"
          className="admin-page-header-inner"
        >
          <div className="admin-page-header-copy">
            <Typography.Text className="admin-page-header-eyebrow">
              {eyebrow}
            </Typography.Text>

            <Typography.Title level={3} className="admin-page-header-title">
              {title}
            </Typography.Title>

            {description && (
              <Typography.Text className="admin-page-header-description">
                {description}
              </Typography.Text>
            )}
          </div>

          {extra && <div className="admin-page-header-extra">{extra}</div>}
        </Flex>
      </Card>

      <style jsx global>{`
        .admin-page-header-card.ant-card {
          border: 1px solid var(--admin-border, #dbe4f0) !important;
          border-radius: var(--admin-radius, 8px) !important;
          background:
            linear-gradient(180deg, rgba(248, 250, 252, 0.88), #ffffff),
            #ffffff !important;
          box-shadow: var(--admin-shadow-sm, 0 8px 20px rgba(17, 24, 39, 0.05)) !important;
        }

        .admin-page-header-card .ant-card-body {
          padding: 18px 20px !important;
        }

        .admin-page-header-copy {
          min-width: 240px;
          flex: 1;
        }

        .admin-page-header-eyebrow.ant-typography {
          display: block;
          margin-bottom: 5px;
          color: var(--admin-primary, #2563eb) !important;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .admin-page-header-title.ant-typography {
          margin: 0 !important;
          color: var(--admin-text-main, #0f172a) !important;
          font-size: 22px !important;
          font-weight: 900 !important;
          line-height: 1.25 !important;
          letter-spacing: 0;
        }

        .admin-page-header-description.ant-typography {
          display: block;
          max-width: 820px;
          margin-top: 6px;
          color: var(--admin-text-secondary, #64748b) !important;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.55;
        }

        .admin-page-header-extra {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        @media (max-width: 575px) {
          .admin-page-header-card .ant-card-body {
            padding: 15px !important;
          }

          .admin-page-header-inner {
            align-items: flex-start !important;
          }

          .admin-page-header-copy,
          .admin-page-header-extra {
            width: 100%;
          }

          .admin-page-header-extra {
            justify-content: flex-start;
          }

          .admin-page-header-title.ant-typography {
            font-size: 19px !important;
          }
        }
      `}</style>
    </>
  );
}
