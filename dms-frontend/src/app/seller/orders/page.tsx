"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import {
  Button,
  Card,
  Empty,
  Flex,
  Progress,
  Row,
  Col,
  Table,
  Tag,
  Typography,
} from "antd";

import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyOrdersQuery } from "@/features/orders/orderService";
import type { Order } from "@/features/orders/orderTypes";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

type OrderRealtimePayload = {
  order?: Order;
};

const { Text } = Typography;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  softPrimary: "#E7F8F5",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
  dark: "#07171F",
  darkMuted: "#A9D8D1",
};

const statusMap = {
  pending: {
    color: "gold",
    text: "Chờ duyệt",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    color: "green",
    text: "Đã duyệt",
    icon: <CheckCircleOutlined />,
  },
  delivered: {
    color: "cyan",
    text: "Đã giao",
    icon: <ShoppingCartOutlined />,
  },
  return_requested: {
    color: "orange",
    text: "Chờ duyệt trả hàng",
    icon: <ClockCircleOutlined />,
  },
  cancelled: {
    color: "red",
    text: "Đã hủy",
    icon: <CloseCircleOutlined />,
  },
  returned: {
    color: "purple",
    text: "Đã trả hàng",
    icon: <CloseCircleOutlined />,
  },
};

const currencyFormatter = new Intl.NumberFormat("vi-VN");

const getCustomerName = (customer: Order["customer"]) => {
  if (typeof customer === "string") return /^[a-f\d]{24}$/i.test(customer) ? "-" : customer;
  return customer?.name || "-";
};

export default function SellerOrdersPage() {
  const { data: orders = [], isLoading, refetch } = useGetMyOrdersQuery();

  useRealtimeRefetch(["new-notification", "order-updated"], refetch);

  const highlightedOrderId = useRealtimeHighlight(
    ["order-updated"],
    (payload) => (payload as OrderRealtimePayload).order?._id,
  );

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (total, item) => total + item.finalAmount,
      0,
    );

    return {
      total: orders.length,
      pending: orders.filter((item) => item.status === "pending").length,
      approved: orders.filter((item) => item.status === "approved").length,
      delivered: orders.filter((item) => item.status === "delivered").length,
      cancelled: orders.filter((item) => item.status === "cancelled").length,
      returned: orders.filter((item) => item.status === "returned").length,
      totalRevenue,
    };
  }, [orders]);

  const deliveryRate = stats.total
    ? Math.round((stats.delivered / stats.total) * 100)
    : 0;

  const activeRate = stats.total
    ? Math.round(((stats.approved + stats.delivered) / stats.total) * 100)
    : 0;

  const latestOrder = useMemo(() => {
    if (!orders.length) return undefined;

    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [orders]);

  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      width: 190,
      ellipsis: true,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="seller-orders-order-mark">
            <ShoppingCartOutlined />
          </div>

          <Text strong ellipsis className="seller-orders-table-strong">
            {value}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      width: 260,
      ellipsis: true,
      render: (customer: Order["customer"]) => (
        <Text className="seller-orders-table-muted">
          {getCustomerName(customer)}
        </Text>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      width: 180,
      align: "right",
      render: (value: number) => (
        <Text strong className="seller-orders-money">
          {currencyFormatter.format(value)} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 170,
      align: "center",
      render: (status: keyof typeof statusMap) => {
        const item = statusMap[status] ?? statusMap.pending;

        return (
          <Tag color={item.color} icon={item.icon} className="seller-orders-status-tag">
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 150,
      align: "center",
      render: (value: string) => (
        <Text className="seller-orders-table-muted">
          {new Date(value).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Hành động",
      width: 224,
      align: "center",
      render: (_, record) => (
        <Flex gap={8} justify="center">
          <Link href={`/seller/orders/${record._id}`}>
            <Button icon={<EyeOutlined />} className="seller-orders-action">
              Chi tiết
            </Button>
          </Link>

          {record.status === "pending" && (
            <Link href={`/seller/orders/${record._id}/edit`}>
              <Button icon={<EditOutlined />} className="seller-orders-action">
                Sửa
              </Button>
            </Link>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Đơn hàng của tôi"
        description="Quản lý đơn hàng đã tạo, theo dõi trạng thái duyệt và tiến độ giao hàng."
        extra={
          <Link href="/seller/orders/create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="seller-orders-primary-button"
            >
              Tạo đơn hàng
            </Button>
          </Link>
        }
      />

      <Flex className="seller-orders-stack" vertical gap={20}>
        <Card
          variant="borderless"
          className="seller-orders-command-card"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <Row gutter={0}>
            <Col xs={24} lg={9}>
              <div className="seller-orders-command-dark">
                <Text className="seller-orders-command-eyebrow">
                  Order pipeline
                </Text>
                <div className="seller-orders-command-title">
                  Theo dõi đơn hàng đang xử lý
                </div>
                <Text className="seller-orders-command-description">
                  Nắm nhanh doanh thu, trạng thái duyệt và tiến độ giao hàng
                  của các đơn đã tạo.
                </Text>

                <div className="seller-orders-dark-meter">
                  <span>{currencyFormatter.format(stats.totalRevenue)} đ</span>
                  <label>Tổng giá trị đơn hàng</label>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={15}>
              <div className="seller-orders-command-summary">
                <div className="seller-orders-command-content">
                  <div>
                    <Flex gap={14} wrap="wrap">
                      <div className="seller-orders-command-stat">
                        <span>{stats.total}</span>
                        <label>Tổng đơn</label>
                      </div>
                      <div className="seller-orders-command-stat">
                        <span>{stats.pending}</span>
                        <label>Chờ duyệt</label>
                      </div>
                      <div className="seller-orders-command-stat">
                        <span>{deliveryRate}%</span>
                        <label>Tỷ lệ đã giao</label>
                      </div>
                    </Flex>

                    <div className="seller-orders-progress-block">
                      <Flex justify="space-between" align="center" gap={12}>
                        <Text className="seller-orders-progress-label">
                          Đơn đã duyệt hoặc giao
                        </Text>
                        <Text className="seller-orders-progress-value">
                          {stats.approved + stats.delivered}/{stats.total}
                        </Text>
                      </Flex>
                      <Progress
                        percent={activeRate}
                        strokeColor={COLORS.primary}
                        trailColor="#D9EEE9"
                        showInfo={false}
                      />
                    </div>
                  </div>

                  <div className="seller-orders-latest-card">
                    <Text className="seller-orders-latest-label">
                      Đơn gần nhất
                    </Text>

                    {latestOrder ? (
                      <>
                        <Text ellipsis className="seller-orders-latest-title">
                          {latestOrder.orderCode}
                        </Text>

                        <div className="seller-orders-latest-meta">
                          <span>{getCustomerName(latestOrder.customer)}</span>
                          <span>
                            {currencyFormatter.format(latestOrder.finalAmount)} đ
                          </span>
                        </div>

                        <Flex justify="space-between" align="center" gap={10}>
                          <Tag
                            color={
                              statusMap[
                                latestOrder.status as keyof typeof statusMap
                              ]?.color ?? "default"
                            }
                            className="seller-orders-latest-tag"
                          >
                            {statusMap[
                              latestOrder.status as keyof typeof statusMap
                            ]?.text ?? "Chờ duyệt"}
                          </Tag>

                          <Link href={`/seller/orders/${latestOrder._id}`}>
                            <Button
                              type="primary"
                              size="small"
                              className="seller-orders-latest-button"
                            >
                              Mở đơn
                            </Button>
                          </Link>
                        </Flex>
                      </>
                    ) : (
                      <Text className="seller-orders-latest-empty">
                        Chưa có đơn hàng nào.
                      </Text>
                    )}
                  </div>
                </div>

                <div className="seller-orders-status-grid">
                  <div>
                    <ClockCircleOutlined />
                    <span>Chờ duyệt</span>
                    <strong>{stats.pending}</strong>
                  </div>
                  <div>
                    <CheckCircleOutlined />
                    <span>Đã duyệt</span>
                    <strong>{stats.approved}</strong>
                  </div>
                  <div>
                    <ShoppingCartOutlined />
                    <span>Đã giao</span>
                    <strong>{stats.delivered}</strong>
                  </div>
                  <div>
                    <CloseCircleOutlined />
                    <span>Đã hủy</span>
                    <strong>{stats.cancelled}</strong>
                  </div>
                  <div>
                    <CloseCircleOutlined />
                    <span>Trả hàng</span>
                    <strong>{stats.returned}</strong>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-orders-section-title">
                Danh sách đơn hàng
              </Text>

              <Text className="seller-orders-section-description">
                Theo dõi tổng tiền, trạng thái và thao tác nhanh với từng đơn.
              </Text>
            </Flex>
          }
          className="seller-orders-section-card"
        >
          <Table
            className="seller-orders-table"
            rowKey="_id"
            loading={isLoading}
            columns={columns}
            dataSource={orders}
            rowClassName={(record) =>
              record._id === highlightedOrderId ? "realtime-highlight-row" : ""
            }
            scroll={{ x: 1180 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có đơn hàng nào" />,
            }}
          />
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-content > .ant-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06);
        }

        .seller-content > .ant-card .ant-card-body {
          padding: 20px 22px;
        }

        .seller-orders-stack {
          position: relative;
        }

        .seller-orders-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 208px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-orders-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-orders-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-orders-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-orders-command-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .seller-orders-command-dark {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-orders-command-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-orders-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .seller-orders-command-description {
          display: block;
          max-width: 420px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-orders-dark-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .seller-orders-dark-meter span {
          display: block;
          color: #ffffff;
          font-size: 22px;
          font-weight: 850;
          line-height: 1.15;
        }

        .seller-orders-dark-meter label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-orders-command-summary {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
        }

        .seller-orders-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .seller-orders-command-stat {
          min-width: 128px;
          flex: 1 1 128px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-orders-command-stat span {
          display: block;
          color: ${COLORS.text};
          font-size: 25px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-orders-command-stat label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-orders-progress-block {
          margin-top: 18px;
          padding: 14px 15px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-orders-progress-label {
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-orders-progress-value {
          color: ${COLORS.secondary};
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-orders-latest-card {
          min-height: 152px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-orders-latest-label {
          color: ${COLORS.primaryHover};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-orders-latest-title {
          display: block;
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.25;
        }

        .seller-orders-latest-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .seller-orders-latest-meta span {
          padding: 5px 9px;
          border: 1px solid #cbe9e3;
          border-radius: 999px;
          background: #ffffff;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
        }

        .seller-orders-latest-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
        }

        .seller-orders-latest-button.ant-btn {
          border-color: ${COLORS.primary};
          border-radius: 9px;
          background: ${COLORS.primary};
          font-weight: 750;
        }

        .seller-orders-latest-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-orders-latest-empty {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-orders-status-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-orders-status-grid > div {
          min-height: 76px;
          padding: 12px;
          display: grid;
          gap: 4px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-orders-status-grid .anticon {
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-orders-status-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .seller-orders-status-grid strong {
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-orders-section-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-orders-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
        }

        .seller-orders-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-orders-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-orders-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-orders-order-mark {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border-radius: 12px;
          background: ${COLORS.softPrimary};
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-orders-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-orders-table-muted {
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-orders-money {
          color: ${COLORS.primaryHover};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-orders-status-tag.ant-tag {
          min-width: 104px;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
          text-align: center;
        }

        .seller-orders-action.ant-btn {
          height: 34px;
          border-color: ${COLORS.border};
          border-radius: 10px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-orders-action.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-orders-table .ant-table {
          background: #ffffff !important;
        }

        .seller-orders-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-orders-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-orders-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-orders-table .ant-table-tbody > tr:hover > td {
          background: ${COLORS.surface} !important;
        }

        .seller-orders-table .ant-table-tbody > tr.realtime-highlight-row > td {
          background: #e7f8f5 !important;
          animation: sellerOrderHighlight 1.8s ease;
        }

        @keyframes sellerOrderHighlight {
          0% {
            background: #b7e7de;
          }
          100% {
            background: #e7f8f5;
          }
        }

        @media (max-width: 900px) {
          .seller-orders-command-content {
            grid-template-columns: 1fr;
          }

          .seller-orders-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}
