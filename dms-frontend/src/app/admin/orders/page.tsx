"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Customer } from "@/features/customers/customerTypes";
import { getOrderAmounts } from "@/features/orders/orderAmounts";
import { useGetOrdersPageQuery } from "@/features/orders/orderService";
import type { Order, OrderStatus } from "@/features/orders/orderTypes";
import type { User } from "@/features/users/userTypes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type OrderRealtimePayload = {
  order?: Order;
};

type OrderStatusFilter = "all" | OrderStatus;

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "orange" },
  approved: { label: "Đã xác nhận", color: "blue" },
  delivered: { label: "Đã giao", color: "green" },
  return_requested: { label: "Chờ duyệt trả hàng", color: "gold" },
  cancelled: { label: "Đã hủy", color: "red" },
  returned: { label: "Đã trả hàng", color: "purple" },
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("vi-VN");
};

const getCustomerName = (customer: Order["customer"]) =>
  typeof customer === "string" ? customer : (customer as Customer)?.name || "-";

const getSellerName = (seller: Order["seller"]) =>
  typeof seller === "string" ? seller : (seller as User)?.fullName || "-";

export default function AdminOrdersPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<OrderStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchKeyword = useDebouncedValue(keyword);

  const { data, isLoading, refetch } = useGetOrdersPageQuery({
    page,
    limit: pageSize,
    search: searchKeyword.trim() || undefined,
    status: status === "all" ? undefined : status,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const orders = useMemo(() => data?.data ?? [], [data?.data]);
  const totalOrders = data?.meta.total ?? 0;

  useRealtimeRefetch(["new-notification", "order-updated"], refetch);

  const highlightedOrderId = useRealtimeHighlight(
    ["order-updated"],
    (payload) => (payload as OrderRealtimePayload).order?._id,
  );

  const overview = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + getOrderAmounts(order).finalAmount,
      0,
    );
    const pending = orders.filter((order) => order.status === "pending").length;
    const delivered = orders.filter(
      (order) => order.status === "delivered",
    ).length;
    const active = orders.filter(
      (order) => order.status === "pending" || order.status === "approved",
    ).length;

    return {
      total: orders.length,
      totalRevenue,
      pending,
      delivered,
      active,
    };
  }, [orders]);

  const columns: ColumnsType<Order> = useMemo(
    () => [
      {
        title: "Mã đơn",
        dataIndex: "orderCode",
        width: 160,
        render: (value: string) => (
          <Text className="admin-orders-code">{value}</Text>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 180,
        align: "center",
        render: (orderStatus: OrderStatus) => (
          <Tag
            color={statusMap[orderStatus]?.color}
            className="admin-orders-status-tag"
          >
            {statusMap[orderStatus]?.label}
          </Tag>
        ),
      },
      {
        title: "Khách hàng",
        dataIndex: "customer",
        width: 240,
        ellipsis: true,
        render: (customer) => (
          <div className="admin-orders-cell-copy">
            <Text className="admin-orders-strong">
              {getCustomerName(customer)}
            </Text>
            <Text className="admin-orders-muted">Khách hàng đặt đơn</Text>
          </div>
        ),
      },
      {
        title: "Nhân viên",
        dataIndex: "seller",
        width: 210,
        ellipsis: true,
        render: (seller) => (
          <div className="admin-orders-cell-copy">
            <Text className="admin-orders-strong">{getSellerName(seller)}</Text>
            <Text className="admin-orders-muted">Seller phụ trách</Text>
          </div>
        ),
      },
      {
        title: "Tổng tiền",
        key: "finalAmount",
        width: 170,
        align: "right",
        render: (_, record) => (
          <Text className="admin-orders-money">
            {money(getOrderAmounts(record).finalAmount)}
          </Text>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        width: 150,
        render: (value: string) => (
          <Text className="admin-orders-date">{formatDate(value)}</Text>
        ),
      },
      {
        title: "Hành động",
        key: "actions",
        align: "center",
        width: 240,
        fixed: "right",
        render: (_, record) => (
          <Space size={8} className="admin-orders-actions">
            <Link href={`/admin/orders/${record._id}`}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                className="admin-orders-action-button"
              >
                Chi tiết
              </Button>
            </Link>

            {record.status === "pending" ? (
              <Link href={`/admin/orders/${record._id}/edit`}>
                <Button
                  color="orange"
                  variant="solid"
                  icon={<EditOutlined />}
                  className="admin-orders-action-button"
                >
                  Sửa
                </Button>
              </Link>
            ) : null}
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Quản lý đơn hàng"
        description="Theo dõi, tạo và xác nhận đơn hàng trong hệ thống phân phối."
        extra={
          <Link href="/admin/orders/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo đơn hàng
            </Button>
          </Link>
        }
      />

      <section className="admin-orders-shell">
        <div className="admin-orders-hero">
          <div>
            <Tag className="admin-orders-hero-tag">Vận hành đơn hàng</Tag>
            <Title level={2} className="admin-orders-hero-title">
              Điều phối đơn hàng
            </Title>
            <Text className="admin-orders-hero-desc">
              Theo dõi trạng thái xử lý, doanh thu và các đơn cần admin kiểm
              tra trong ngày.
            </Text>

            <div className="admin-orders-hero-metrics">
              <div>
                <ShoppingCartOutlined />
                <span>Tổng đơn</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <ClockCircleOutlined />
                <span>Chờ xác nhận</span>
                <strong>{overview.pending.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CheckCircleOutlined />
                <span>Đã giao</span>
                <strong>{overview.delivered.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <DollarOutlined />
                <span>Doanh thu</span>
                <strong>{money(overview.totalRevenue)}</strong>
              </div>
            </div>
          </div>

          <div className="admin-orders-hero-panel">
            <ShoppingCartOutlined />
            <span>Đơn đang xử lý</span>
            <strong>{overview.active.toLocaleString("vi-VN")}</strong>
            <Text>đơn chờ xác nhận hoặc giao hàng</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-orders-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-orders-filter-title">
                Bộ lọc đơn hàng
              </Title>
              <Text className="admin-orders-filter-description">
                Tìm theo mã đơn, khách hàng, seller hoặc lọc theo trạng thái.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-orders-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm mã đơn, khách hàng, seller"
                prefix={<SearchOutlined />}
                className="admin-orders-search-input"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
              />

              <Segmented<OrderStatusFilter>
                size="large"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                className="admin-orders-status-select"
                options={[
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Chờ xác nhận", value: "pending" },
                  { label: "Đã xác nhận", value: "approved" },
                  { label: "Đã giao", value: "delivered" },
                  { label: "Chờ duyệt trả hàng", value: "return_requested" },
                  { label: "Đã hủy", value: "cancelled" },
                  { label: "Đã trả hàng", value: "returned" },
                ]}
              />

            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-orders-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-orders-panel-title">
                  Danh sách đơn hàng
                </Text>
                <Text className="admin-orders-panel-desc">
                  Hiển thị {totalOrders.toLocaleString("vi-VN")} đơn
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<Order>
            rowKey="_id"
            loading={isLoading}
            dataSource={orders}
            columns={columns}
            scroll={{ x: 1310 }}
            className="admin-orders-table"
            rowClassName={(record) =>
              record._id === highlightedOrderId ? "realtime-highlight-row" : ""
            }
            pagination={{
              current: page,
              pageSize,
              total: totalOrders,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
            onChange={(pagination) => {
              setPage(pagination.current ?? 1);
              setPageSize(pagination.pageSize ?? 10);
            }}
            locale={{              emptyText: <Empty description="Không tìm thấy đơn hàng phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-orders-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-orders-hero {
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
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.22), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-orders-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-orders-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-orders-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-orders-hero-metrics {
          margin-top: 24px;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-orders-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-orders-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-orders-hero-metrics .anticon {
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

        .admin-orders-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-orders-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-orders-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-orders-hero-panel .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #10b981;
        }

        .admin-orders-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-orders-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-orders-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-orders-filter-card,
        .admin-orders-table-card {
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

        .admin-orders-filter-card:hover,
        .admin-orders-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-orders-filter-card {
          margin-bottom: 16px;
        }

        .admin-orders-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-orders-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-orders-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-orders-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-orders-status-select {
          width: 220px !important;
        }

        .admin-orders-search-input,
        .admin-orders-status-select .ant-select-selector,
        .admin-orders-reset-button {
          border-radius: 8px !important;
        }

        .admin-orders-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-orders-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-orders-panel-title,
        .admin-orders-panel-desc {
          display: block;
        }

        .admin-orders-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-orders-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-orders-result-tag,
        .admin-orders-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-orders-table .ant-table,
        .admin-orders-table .ant-table-container,
        .admin-orders-table .ant-table-content,
        .admin-orders-table .ant-table-body,
        .admin-orders-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-orders-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-orders-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-orders-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-orders-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-orders-table .ant-table-cell-fix-right,
        .admin-orders-table .ant-table-cell-fix-right-first,
        .admin-orders-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-orders-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-orders-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-orders-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-orders-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
        .admin-orders-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-orders-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-orders-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-orders-code,
        .admin-orders-strong,
        .admin-orders-date {
          display: block;
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-orders-code {
          color: #2563eb !important;
        }

        .admin-orders-cell-copy {
          min-width: 0;
        }

        .admin-orders-muted {
          display: block;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-orders-money {
          color: #0f172a !important;
          font-weight: 900;
        }

        .admin-orders-status-tag {
          min-width: 132px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-orders-actions {
          justify-content: center;
        }

        .admin-orders-action-button,
        .admin-orders-reset-button {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700;
        }

        .admin-orders-table .ant-pagination {
          margin-top: 18px !important;
        }

        .admin-orders-table .ant-pagination-total-text {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-orders-hero {
            grid-template-columns: 1fr;
          }

          .admin-orders-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-orders-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-orders-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-orders-hero {
            padding: 20px;
          }

          .admin-orders-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-orders-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-orders-hero-metrics > div,
          .admin-orders-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-orders-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-orders-filter-actions,
          .admin-orders-search-input,
          .admin-orders-status-select,
          .admin-orders-reset-button {
            width: 100% !important;
          }

          .admin-orders-table .ant-table-tbody > tr > td {
            height: 74px;
            padding-inline: 14px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-orders-filter-card,
          .admin-orders-table-card {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
