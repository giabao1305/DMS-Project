"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TablePaginationConfig } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Customer } from "@/features/customers/customerTypes";
import { useGetVisitsPageQuery } from "@/features/visits/visitService";
import type { Visit, VisitStatus } from "@/features/visits/visitTypes";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type StatusFilter = "all" | VisitStatus;

const emptyVisits: Visit[] = [];
const statusMap: Record<VisitStatus, { label: string; color: string }> = {
  checked_in: { label: "Đã check-in", color: "orange" },
  checked_out: { label: "Đã check-out", color: "green" },
};

const formatDistance = (value?: number) =>
  value === undefined || value === null ? "-" : `${Math.round(value)}m`;

const formatAccuracy = (value?: number) =>
  value === undefined || value === null ? "-" : `±${Math.round(value)}m`;

const getSellerName = (seller: Visit["seller"]) =>
  typeof seller === "string" ? seller : (seller as User)?.fullName || "-";

const getCustomerName = (customer: Visit["customer"]) =>
  typeof customer === "string" ? customer : (customer as Customer)?.name || "-";

const splitDateTime = (value?: string) => {
  if (!value) return { date: "-", time: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };

  return {
    date: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export default function AdminVisitsPage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      search: keyword.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [keyword, limit, page, statusFilter],
  );

  const {
    data: visitsPage,
    isLoading,
    isFetching,
    refetch,
  } = useGetVisitsPageQuery(queryArgs);

  const visits = visitsPage?.data ?? emptyVisits;
  const meta = visitsPage?.meta;

  useRealtimeRefetch(["new-notification", "visit-updated"], refetch);

  const overview = useMemo(() => {
    const checkedIn = visits.filter(
      (visit) => visit.status === "checked_in",
    ).length;
    const checkedOut = visits.filter(
      (visit) => visit.status === "checked_out",
    ).length;
    const withDistance = visits.filter(
      (visit) =>
        visit.checkInDistance !== undefined && visit.checkInDistance !== null,
    );
    const averageDistance =
      withDistance.length > 0
        ? Math.round(
            withDistance.reduce(
              (sum, visit) => sum + Number(visit.checkInDistance || 0),
              0,
            ) / withDistance.length,
          )
        : 0;

    return {
      total: visits.length,
      checkedIn,
      checkedOut,
      averageDistance,
    };
  }, [visits]);

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setLimit(pagination.pageSize ?? 8);
  };

  const columns: ColumnsType<Visit> = useMemo(
    () => [
      {
        title: "Seller",
        dataIndex: "seller",
        width: 230,
        fixed: "left",
        render: (seller) => (
          <Flex align="center" gap={12} className="admin-visits-person">
            <Flex align="center" justify="center" className="admin-visits-avatar">
              <UserOutlined />
            </Flex>
            <div className="admin-visits-cell-copy">
              <Text className="admin-visits-strong">{getSellerName(seller)}</Text>
              <Text className="admin-visits-muted">Nhân viên phụ trách</Text>
            </div>
          </Flex>
        ),
      },
      {
        title: "Khách hàng",
        dataIndex: "customer",
        width: 240,
        render: (customer) => (
          <div className="admin-visits-cell-copy">
            <Text className="admin-visits-strong">
              {getCustomerName(customer)}
            </Text>
            <Text className="admin-visits-muted">ĐiỒm bán ghé thĒm</Text>
          </div>
        ),
      },
      {
        title: "Check-in",
        dataIndex: "checkInTime",
        width: 170,
        render: (value: string) => {
          const checkIn = splitDateTime(value);
          return (
            <div className="admin-visits-date">
              <Text>{checkIn.date}</Text>
              <span>{checkIn.time || "-"}</span>
            </div>
          );
        },
      },
      {
        title: "Khoảng cách",
        dataIndex: "checkInDistance",
        width: 150,
        align: "center",
        render: (value?: number) => {
          const safe = value !== undefined && value !== null && value <= 100;

          return (
            <Flex vertical align="center" gap={5}>
              <Tag
                color={safe ? "green" : "orange"}
                className="admin-visits-pill"
              >
                {formatDistance(value)}
              </Tag>
              <Text className="admin-visits-mini">
                {safe ? "Trong ngưỡng" : "Cần kiểm tra"}
              </Text>
            </Flex>
          );
        },
      },
      {
        title: "GPS",
        dataIndex: "gpsAccuracy",
        width: 130,
        align: "center",
        render: (value?: number) => (
          <div className="admin-visits-date admin-visits-center">
            <Text>{formatAccuracy(value)}</Text>
            <span>độ chính xác</span>
          </div>
        ),
      },
      {
        title: "Check-out",
        dataIndex: "checkOutTime",
        width: 170,
        render: (value?: string) => {
          const checkOut = splitDateTime(value);
          return (
            <div className="admin-visits-date">
              <Text>{checkOut.date}</Text>
              <span>{checkOut.time || "-"}</span>
            </div>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 160,
        align: "center",
        render: (status: VisitStatus) => (
          <Tag color={statusMap[status]?.color} className="admin-visits-status">
            {statusMap[status]?.label}
          </Tag>
        ),
      },
      {
        title: "Ghi chú",
        dataIndex: "note",
        width: 260,
        ellipsis: true,
        render: (value?: string) => (
          <Text className="admin-visits-note" type={value ? undefined : "secondary"}>
            {value || "-"}
          </Text>
        ),
      },
      {
        title: "Hành động",
        width: 150,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Link href={`/admin/visits/${record._id}`}>
            <Button type="primary" icon={<EyeOutlined />}>
              Chi tiết
            </Button>
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Lịch sử ghé thăm"
        description="Theo dõi check-in, check-out, vị trí GPS và chất lượng hoạt động tại từng điểm bán."
      />

      <section className="admin-visits-shell">
        <div className="admin-visits-hero">
          <div>
            <Tag className="admin-visits-hero-tag">Field Operation</Tag>
            <Title level={2} className="admin-visits-hero-title">
              Giám sát hoạt động ghé thăm
            </Title>
            <Text className="admin-visits-hero-desc">
              Nắm nhanh ai đang ở điểm bán, lượt nào đã hoàn tất và các check-in
              cần kiểm tra lại khoảng cách GPS.
            </Text>

            <div className="admin-visits-hero-metrics">
              <div>
                <EnvironmentOutlined />
                <span>Tổng lượt</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <ClockCircleOutlined />
                <span>Đang check-in</span>
                <strong>{overview.checkedIn.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CheckCircleOutlined />
                <span>Đã check-out</span>
                <strong>{overview.checkedOut.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <AimOutlined />
                <span>Khoảng cách TB</span>
                <strong>{overview.averageDistance.toLocaleString("vi-VN")}m</strong>
              </div>
            </div>
          </div>

          <div className="admin-visits-hero-metric">
            <FieldTimeOutlined />
            <span>Đang check-in</span>
            <strong>{overview.checkedIn.toLocaleString("vi-VN")}</strong>
          </div>
        </div>

        <Card variant="borderless" className="admin-visits-filter">
          <Flex align="center" justify="space-between" gap={16} wrap="wrap">
            <div>
              <Title level={5} className="admin-visits-filter-title">
                Bộ lọc danh sách
              </Title>
              <Text className="admin-visits-filter-desc">
                Tìm theo seller, khách hàng, ghi chú hoặc trạng thái.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-visits-filter-actions">
              <Input
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                placeholder="Tìm seller, khách hàng, ghi chú..."
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                className="admin-visits-search"
              />
              <Select<StatusFilter>
                size="large"
                value={statusFilter}
                onChange={handleStatusChange}
                className="admin-visits-select"
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  { value: "checked_in", label: "Đã check-in" },
                  { value: "checked_out", label: "Đã check-out" },
                ]}
              />
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-visits-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-visits-panel-title">
                  Danh sách ghé thăm
                </Text>
                <Text className="admin-visits-panel-desc">
                  Toàn bộ lịch sử check-in và check-out của seller
                </Text>
              </div>
              <Tag color="blue" className="admin-visits-result-tag">
                {(meta?.total ?? visits.length).toLocaleString("vi-VN")} kết quả
              </Tag>
            </Flex>
          }
        >
          <Table<Visit>
            rowKey="_id"
            loading={isLoading || isFetching}
            dataSource={visits}
            columns={columns}
            scroll={{ x: 1510 }}
            tableLayout="fixed"
            className="admin-visits-table"
            onChange={handleTableChange}
            pagination={{
              current: meta?.page ?? page,
              pageSize: meta?.limit ?? limit,
              total: meta?.total ?? visits.length,
              showSizeChanger: true,
              pageSizeOptions: [8, 12, 20, 50],
              showTotal: (total) => `Tổng ${total} lượt ghé thăm`,
            }}
            locale={{
              emptyText: (
                <Empty description="Không tìm thấy lịch sử ghé thăm phù hợp" />
              ),
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-visits-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-visits-hero {
          min-height: 230px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 230px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.24), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-visits-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-visits-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-visits-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-visits-hero-metrics {
          margin-top: 24px;
          max-width: 840px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-visits-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-visits-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-visits-hero-metrics .anticon {
          grid-row: 1 / span 2;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          background: rgba(14, 165, 233, 0.3);
        }

        .admin-visits-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-visits-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-visits-hero-metric {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-visits-hero-metric .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #f59e0b;
        }

        .admin-visits-hero-metric span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-visits-hero-metric strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-visits-filter,
        .admin-visits-table-card {
          height: 100%;
          overflow: hidden;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .admin-visits-filter:hover,
        .admin-visits-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-visits-filter {
          margin-top: 0;
          margin-bottom: 16px;
        }

        .admin-visits-filter .ant-card-body {
          padding: 20px;
        }

        .admin-visits-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-visits-filter-desc.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-visits-search {
          width: 390px !important;
          max-width: 100%;
        }

        .admin-visits-select {
          width: 210px !important;
        }

        .admin-visits-search,
        .admin-visits-select .ant-select-selector {
          border-radius: 8px !important;
        }

        .admin-visits-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-visits-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-visits-panel-title,
        .admin-visits-panel-desc {
          display: block;
        }

        .admin-visits-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-visits-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-visits-result-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .admin-visits-table .ant-table,
        .admin-visits-table .ant-table-container,
        .admin-visits-table .ant-table-content,
        .admin-visits-table .ant-table-body,
        .admin-visits-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-visits-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-visits-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-visits-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-visits-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-visits-table .ant-table-cell-fix-left,
        .admin-visits-table .ant-table-cell-fix-right,
        .admin-visits-table .ant-table-cell-fix-left-last,
        .admin-visits-table .ant-table-cell-fix-right-first {
          background: #ffffff !important;
          background-color: #ffffff !important;
        }

        .admin-visits-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .admin-visits-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-visits-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-visits-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first {
          background: #f8fafc !important;
        }

        .admin-visits-person,
        .admin-visits-cell-copy {
          min-width: 0;
        }

        .admin-visits-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-visits-strong {
          display: block;
          max-width: 180px;
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-visits-muted {
          display: block;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-visits-date {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-visits-date .ant-typography {
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 800;
        }

        .admin-visits-date span,
        .admin-visits-mini {
          color: #64748b !important;
          font-size: 11.5px;
          font-weight: 600;
        }

        .admin-visits-center {
          align-items: center;
        }

        .admin-visits-pill,
        .admin-visits-status {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-visits-pill {
          min-width: 82px;
        }

        .admin-visits-status {
          min-width: 122px;
        }

        .admin-visits-note {
          display: block;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-visits-table .ant-pagination {
          margin-top: 18px !important;
        }

        .admin-visits-table .ant-pagination-total-text {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-visits-hero {
            grid-template-columns: 1fr;
          }

          .admin-visits-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-visits-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-visits-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-visits-hero {
            padding: 20px;
          }

          .admin-visits-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-visits-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-visits-hero-metrics > div,
          .admin-visits-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-visits-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-visits-filter-actions,
          .admin-visits-search,
          .admin-visits-select {
            width: 100% !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-visits-filter,
          .admin-visits-table-card {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
