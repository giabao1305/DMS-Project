"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PhoneOutlined,
  ShopOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Progress,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetRouteByIdQuery } from "@/features/routes/routeService";
import type {
  RouteCustomer,
  RouteCustomerStatus,
  RouteStatus,
} from "@/features/routes/routeTypes";
import { useAppSelector } from "@/store/hooks";

const { Text } = Typography;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
};

const routeStatusMap: Record<
  RouteStatus,
  { color: string; text: string; icon: React.ReactNode }
> = {
  planned: {
    color: "default",
    text: "Kế hoạch",
    icon: <CalendarOutlined />,
  },
  in_progress: {
    color: "processing",
    text: "Đang đi tuyến",
    icon: <ClockCircleOutlined />,
  },
  completed: {
    color: "success",
    text: "Hoàn thành",
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    color: "error",
    text: "Đã hủy",
    icon: <StopOutlined />,
  },
};

const customerStatusMap: Record<
  RouteCustomerStatus,
  { color: string; text: string }
> = {
  pending: {
    color: "gold",
    text: "Chưa ghé",
  },
  checked_in: {
    color: "processing",
    text: "Đang ghé",
  },
  visited: {
    color: "green",
    text: "Đã ghé",
  },
  skipped: {
    color: "red",
    text: "Bỏ qua",
  },
};

const getCustomerName = (customer: RouteCustomer["customer"]) => {
  if (typeof customer === "string") return /^[a-f\d]{24}$/i.test(customer) ? "-" : customer;
  return customer.name;
};

const getCustomerPhone = (customer: RouteCustomer["customer"]) => {
  if (typeof customer === "string") return "-";
  return customer.phone || "-";
};

const getCustomerAddress = (customer: RouteCustomer["customer"]) => {
  if (typeof customer === "string") return "-";
  return customer.address || "-";
};

const getCustomerId = (customer: RouteCustomer["customer"]) => {
  if (typeof customer === "string") return customer;
  return customer._id;
};

export default function SellerRouteDetailPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isDistributor = currentUser?.role === "distributor";
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: route, isLoading } = useGetRouteByIdQuery(id);

  const sortedCustomers = useMemo(() => {
    if (!route) return [];
    return [...route.customers].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [route]);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!route) {
    return (
      <>
        <SellerBreadcrumb />

        <SellerPageHeader
          title="Chi tiết tuyến bán hàng"
          description="Xem thông tin tuyến, tiến độ ghé khách và thao tác check-in theo lịch trình."
          extra={
            <Link href="/seller/routes">
              <Button>Quay lại</Button>
            </Link>
          }
        />

        <Card
          variant="borderless"
          className="seller-route-detail-empty-card"
        >
          <Empty description="Không tìm thấy tuyến bán hàng" />
        </Card>
      </>
    );
  }

  const routeStatus =
    routeStatusMap[route.status as RouteStatus] ?? routeStatusMap.planned;

  const stats = sortedCustomers.reduce(
    (total, item) => {
      const status = item.status ?? "pending";
      total[status] += 1;
      return total;
    },
    {
      pending: 0,
      checked_in: 0,
      visited: 0,
      skipped: 0,
    } as Record<RouteCustomerStatus, number>,
  );

  const completedCount = stats.visited + stats.skipped;
  const completionRate = sortedCustomers.length
    ? Math.round((completedCount / sortedCustomers.length) * 100)
    : 0;

  const nextCustomer =
    sortedCustomers.find(
      (item) => item.status !== "visited" && item.status !== "skipped",
    ) ?? sortedCustomers[0];

  const columns: ColumnsType<RouteCustomer> = [
    {
      title: "STT",
      dataIndex: "orderIndex",
      width: 82,
      align: "center",
      render: (value: number) => (
        <Tag color="cyan" className="seller-route-detail-index-tag">
          {value + 1}
        </Tag>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      width: 280,
      render: (customer: RouteCustomer["customer"]) => (
        <Flex align="center" gap={12}>
          <div className="seller-route-detail-customer-icon">
            <ShopOutlined />
          </div>
          <Flex vertical gap={3} style={{ minWidth: 0 }}>
            <Text strong ellipsis className="seller-route-detail-table-strong">
              {getCustomerName(customer)}
            </Text>
            <Text className="seller-route-detail-table-muted">
              <PhoneOutlined /> {getCustomerPhone(customer)}
            </Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "customer",
      ellipsis: true,
      width: 320,
      render: (customer: RouteCustomer["customer"]) => (
        <Text className="seller-route-detail-address">
          {getCustomerAddress(customer)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 150,
      render: (status: RouteCustomerStatus = "pending") => {
        const item = customerStatusMap[status] || customerStatusMap.pending;

        return (
          <Tag color={item.color} className="seller-route-detail-status-tag">
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      ellipsis: true,
      width: 220,
      render: (value?: string) => (
        <Text
          className={
            value
              ? "seller-route-detail-table-muted"
              : "seller-route-detail-table-empty"
          }
        >
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "Hành động",
      align: "center",
      width: 260,
      render: (_, record) => {
        const customerId = getCustomerId(record.customer);
        const canCheckIn =
          !isDistributor &&
          record.status !== "visited" &&
          record.status !== "checked_in" &&
          route.status !== "cancelled" &&
          route.status !== "completed";

        return (
          <Space size={8} wrap>
            <Link href={`/seller/customers/${customerId}`}>
              <Button
                icon={<EyeOutlined />}
                className="seller-route-detail-secondary-action"
              >
                Khách hàng
              </Button>
            </Link>

            {canCheckIn && (
              <Link
                href={`/seller/visits/create?customer=${customerId}&route=${route._id}`}
              >
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  className="seller-route-detail-primary-action"
                >
                  Check-in
                </Button>
              </Link>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Chi tiết tuyến bán hàng"
        description="Xem thông tin tuyến, tiến độ ghé khách và thao tác check-in theo lịch trình."
        extra={
          <Link href="/seller/routes">
            <Button>Quay lại</Button>
          </Link>
        }
      />

      <Flex vertical gap={20}>
        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-route-detail-section-title">
                {route.name}
              </Text>
              <Text className="seller-route-detail-section-description">
                Tóm tắt ngày làm việc, trạng thái và tiến độ xử lý khách hàng.
              </Text>
            </Flex>
          }
          extra={
            <Tag
              color={routeStatus.color}
              icon={routeStatus.icon}
              className="seller-route-detail-status-tag"
            >
              {routeStatus.text}
            </Tag>
          }
          className="seller-route-detail-section-card"
        >
          <div className="seller-route-detail-progress-panel">
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={10}>
                <Flex vertical gap={3}>
                  <Text className="seller-route-detail-progress-label">
                    Tiến độ tuyến
                  </Text>
                  <Text className="seller-route-detail-progress-value">
                    {completedCount}/{sortedCustomers.length} khách đã xử lý
                  </Text>
                </Flex>
              </Col>

              <Col xs={24} md={8}>
                <Progress
                  percent={completionRate}
                  strokeColor={COLORS.primary}
                  trailColor="#D9EEE9"
                />
              </Col>

              <Col xs={24} md={6}>
                <Flex vertical gap={3}>
                  <Text className="seller-route-detail-progress-label">
                    Khách kế tiếp
                  </Text>
                  <Text ellipsis className="seller-route-detail-progress-value">
                    {nextCustomer
                      ? getCustomerName(nextCustomer.customer)
                      : "Chưa có khách trong tuyến"}
                  </Text>
                </Flex>
              </Col>
            </Row>
          </div>

          <div className="seller-route-detail-mini-grid">
            <div>
              <span>Chưa ghé</span>
              <strong>{stats.pending}</strong>
            </div>
            <div>
              <span>Đang ghé</span>
              <strong>{stats.checked_in}</strong>
            </div>
            <div>
              <span>Đã ghé</span>
              <strong>{stats.visited}</strong>
            </div>
            <div>
              <span>Bỏ qua</span>
              <strong>{stats.skipped}</strong>
            </div>
          </div>

          <Descriptions
            bordered
            column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
            styles={{
              label: {
                width: 180,
                color: COLORS.secondary,
                fontWeight: 750,
                background: COLORS.surface,
              },
              content: {
                color: COLORS.text,
                fontWeight: 650,
                background: "#FFFFFF",
              },
            }}
          >
            <Descriptions.Item label="Tên tuyến">{route.name}</Descriptions.Item>
            <Descriptions.Item label="Ngày làm việc">
              {new Date(route.workDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={routeStatus.color}
                icon={routeStatus.icon}
                className="seller-route-detail-status-tag"
              >
                {routeStatus.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số khách hàng">
              {sortedCustomers.length}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo" span="filled">
              {new Date(route.createdAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-route-detail-section-title">
                Danh sách khách hàng trong tuyến
              </Text>
              <Text className="seller-route-detail-section-description">
                Kiểm tra thứ tự ghé thăm, trạng thái và thao tác nhanh với từng
                khách hàng.
              </Text>
            </Flex>
          }
          className="seller-route-detail-section-card"
        >
          <Table
            className="seller-route-detail-table"
            rowKey={(record) => getCustomerId(record.customer)}
            columns={columns}
            dataSource={sortedCustomers}
            pagination={false}
            scroll={{ x: 1280 }}
            locale={{
              emptyText: <Empty description="Tuyến chưa có khách hàng" />,
            }}
          />
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-route-detail-empty-card,
        .seller-route-detail-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-route-detail-empty-card {
          margin-top: 16px;
        }

        .seller-route-detail-empty-card .ant-card-body {
          padding: 30px;
        }

        .seller-route-detail-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-route-detail-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-route-detail-section-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-route-detail-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-route-detail-progress-panel {
          margin-bottom: 12px;
          padding: 15px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-route-detail-progress-label,
        .seller-route-detail-mini-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-route-detail-progress-value {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-route-detail-mini-grid {
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-route-detail-mini-grid > div {
          padding: 12px 14px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-route-detail-mini-grid strong {
          display: block;
          margin-top: 4px;
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-route-detail-index-tag.ant-tag,
        .seller-route-detail-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
          text-align: center;
        }

        .seller-route-detail-index-tag.ant-tag {
          min-width: 38px;
        }

        .seller-route-detail-status-tag.ant-tag {
          min-width: 96px;
        }

        .seller-route-detail-customer-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border-radius: 12px;
          background: ${COLORS.surface};
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-route-detail-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-route-detail-table-muted,
        .seller-route-detail-address {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-route-detail-table-muted .anticon {
          margin-right: 4px;
        }

        .seller-route-detail-table-empty {
          color: #9caeaa;
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-route-detail-secondary-action.ant-btn,
        .seller-route-detail-primary-action.ant-btn {
          height: 36px;
          border-radius: 10px;
          font-weight: 750;
        }

        .seller-route-detail-secondary-action.ant-btn {
          border-color: ${COLORS.border};
          color: ${COLORS.text};
        }

        .seller-route-detail-secondary-action.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-route-detail-primary-action.ant-btn {
          border-color: ${COLORS.primary};
          background: ${COLORS.primary};
          box-shadow: 0 10px 22px rgba(13, 148, 136, 0.18);
        }

        .seller-route-detail-primary-action.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-route-detail-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-route-detail-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-route-detail-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-route-detail-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }

        @media (max-width: 900px) {
          .seller-route-detail-mini-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .seller-route-detail-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
