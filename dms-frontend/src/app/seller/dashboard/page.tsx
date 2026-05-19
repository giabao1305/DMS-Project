"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import { useGetMyOrdersQuery } from "@/features/orders/orderService";
import type { Order } from "@/features/orders/orderTypes";
import { useGetTodayRouteQuery } from "@/features/routes/routeService";
import type { Route, RouteCustomer } from "@/features/routes/routeTypes";
import { useGetMyVisitsQuery } from "@/features/visits/visitService";
import type { Visit } from "@/features/visits/visitTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import { useAppSelector } from "@/store/hooks";

const { Text, Title } = Typography;

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
  darkPanel: "#0D2430",
  darkMuted: "#A9D8D1",
};

const currencyFormatter = new Intl.NumberFormat("vi-VN");

const getCustomerName = (
  customer: RouteCustomer["customer"] | Visit["customer"] | Order["customer"],
) => {
  if (typeof customer === "string") return customer;
  return customer?.name || "-";
};

const orderStatusMap = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  delivered: { color: "cyan", text: "Đã giao" },
  return_requested: { color: "orange", text: "Chờ duyệt trả hàng" },
  cancelled: { color: "red", text: "Đã hủy" },
  returned: { color: "purple", text: "Đã trả hàng" },
};

const routeCustomerStatusMap = {
  pending: { color: "default", text: "Chưa ghé" },
  checked_in: { color: "cyan", text: "Đang ghé" },
  visited: { color: "green", text: "Đã ghé" },
  skipped: { color: "red", text: "Bỏ qua" },
};

type DashboardMetricCardProps = {
  title: string;
  value: number;
  formattedValue?: React.ReactNode;
  icon: React.ReactNode;
  loading?: boolean;
  description: string;
};

function DashboardMetricCard({
  title,
  value,
  formattedValue,
  icon,
  loading,
  description,
}: DashboardMetricCardProps) {
  return (
    <Card
      variant="borderless"
      loading={loading}
      className="seller-dashboard-metric-card"
      styles={{
        body: {
          padding: 18,
        },
      }}
    >
      <Flex vertical gap={14}>
        <Flex align="center" justify="space-between" gap={12}>
          <div className="seller-dashboard-metric-icon">{icon}</div>

          {formattedValue ? (
            <Text strong className="seller-dashboard-metric-value">
              {formattedValue}
            </Text>
          ) : (
            <Statistic
              value={value}
              valueStyle={{
                color: COLORS.text,
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            />
          )}
        </Flex>

        <Flex vertical gap={5}>
          <Text strong className="seller-dashboard-metric-title">
            {title}
          </Text>
          <Text className="seller-dashboard-metric-description">
            {description}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export default function SellerDashboardPage() {
  const seller = useAppSelector((state) => state.auth.user);

  const {
    data: customers = [],
    isLoading: isCustomersLoading,
    refetch: refetchCustomers,
  } = useGetMyCustomersQuery();

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useGetMyOrdersQuery();

  const {
    data: visits = [],
    isLoading: isVisitsLoading,
    refetch: refetchVisits,
  } = useGetMyVisitsQuery();

  const {
    data: todayRoutesData,
    isLoading: isRoutesLoading,
    refetch: refetchTodayRoutes,
  } = useGetTodayRouteQuery();

  useRealtimeRefetch(
    [
      "new-notification",
      "customer-updated",
      "order-updated",
      "route-updated",
      "visit-updated",
    ],
    () => {
      refetchCustomers();
      refetchOrders();
      refetchVisits();
      refetchTodayRoutes();
    },
  );

  const todayRoutes: Route[] = useMemo(() => {
    if (Array.isArray(todayRoutesData)) return todayRoutesData;
    if (todayRoutesData) return [todayRoutesData];
    return [];
  }, [todayRoutesData]);

  const today = useMemo(() => new Date().toDateString(), []);

  const todayOrders = useMemo(
    () =>
      orders.filter(
        (item) => new Date(item.createdAt).toDateString() === today,
      ),
    [orders, today],
  );

  const activeVisit = useMemo(
    () => visits.find((item) => item.status === "checked_in"),
    [visits],
  );

  const stats = useMemo(() => {
    const todayRevenue = todayOrders.reduce(
      (total, item) => total + item.finalAmount,
      0,
    );
    const totalRevenue = orders.reduce(
      (total, item) => total + item.finalAmount,
      0,
    );

    return {
      customers: customers.length,
      approvedCustomers: customers.filter((item) => item.status === "approved")
        .length,
      pendingCustomers: customers.filter((item) => item.status === "pending")
        .length,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      totalVisits: visits.length,
      activeVisits: visits.filter((item) => item.status === "checked_in")
        .length,
    };
  }, [customers, orders, todayOrders, visits]);

  const routeCustomers = useMemo(
    () =>
      todayRoutes.flatMap((route) =>
        route.customers.map((item) => ({
          ...item,
          routeId: route._id,
          routeName: route.name,
        })),
      ),
    [todayRoutes],
  );

  const visitedRouteCustomers = useMemo(
    () => routeCustomers.filter((item) => item.status === "visited").length,
    [routeCustomers],
  );

  const routeProgress = routeCustomers.length
    ? Math.round((visitedRouteCustomers / routeCustomers.length) * 100)
    : 0;

  const sellerName = seller?.fullName || "Seller";
  const sellerInitial = sellerName.trim().charAt(0).toUpperCase() || "S";

  const routeColumns: ColumnsType<
    RouteCustomer & {
      routeId: string;
      routeName: string;
    }
  > = [
    {
      title: "Khách hàng",
      dataIndex: "customer",
      ellipsis: true,
      width: 220,
      render: (customer) => (
        <Text strong className="seller-dashboard-table-strong">
          {getCustomerName(customer)}
        </Text>
      ),
    },
    {
      title: "Tuyến",
      dataIndex: "routeName",
      ellipsis: true,
      width: 190,
      render: (value: string) => (
        <Text className="seller-dashboard-table-muted">{value || "-"}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 140,
      render: (status: keyof typeof routeCustomerStatusMap = "pending") => {
        const item =
          routeCustomerStatusMap[status] ?? routeCustomerStatusMap.pending;

        return (
          <Tag color={item.color} className="seller-dashboard-status-tag">
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      align: "center",
      width: 140,
      render: (_, record) => {
        const customer =
          typeof record.customer === "string"
            ? record.customer
            : record.customer._id;

        return (
          <Link
            href={`/seller/visits/create?customer=${customer}&route=${record.routeId}`}
          >
            <Button
              type="primary"
              size="small"
              disabled={record.status === "visited"}
              className="seller-dashboard-small-action"
            >
              Check-in
            </Button>
          </Link>
        );
      },
    },
  ];

  const orderColumns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      ellipsis: true,
      width: 150,
      render: (value: string) => (
        <Text strong className="seller-dashboard-table-strong">
          {value}
        </Text>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      ellipsis: true,
      width: 200,
      render: (customer) => (
        <Text className="seller-dashboard-table-muted">
          {getCustomerName(customer)}
        </Text>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      align: "right",
      width: 150,
      render: (value: number) => (
        <Text strong className="seller-dashboard-money">
          {currencyFormatter.format(value)} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 130,
      render: (status: keyof typeof orderStatusMap) => {
        const item = orderStatusMap[status] ?? {
          color: "default",
          text: "Không rõ",
        };

        return (
          <Tag color={item.color} className="seller-dashboard-status-tag">
            {item.text}
          </Tag>
        );
      },
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Dashboard Seller"
        description="Tổng quan nhanh hoạt động bán hàng, đơn hàng và tuyến ghé thăm hôm nay."
        extra={
          <Flex gap={10} wrap="wrap">
            <Link href="/seller/orders/create">
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                className="seller-dashboard-primary-button"
              >
                Tạo đơn
              </Button>
            </Link>

            <Link href="/seller/visits/create">
              <Button icon={<AimOutlined />} className="seller-dashboard-button">
                Check-in
              </Button>
            </Link>
          </Flex>
        }
      />

      <Flex className="seller-dashboard-stack" vertical gap={22}>
        <Card
          variant="borderless"
          className="seller-dashboard-hero-card"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <Row gutter={0}>
            <Col xs={24} lg={9}>
              <div className="seller-dashboard-profile-panel">
                <Flex
                  vertical
                  justify="space-between"
                  gap={24}
                  style={{ height: "100%" }}
                >
                  <Flex align="center" gap={16}>
                    <Avatar
                      size={64}
                      icon={!sellerInitial ? <UserOutlined /> : undefined}
                      className="seller-dashboard-profile-avatar"
                    >
                      {sellerInitial}
                    </Avatar>

                    <Flex vertical gap={4} style={{ minWidth: 0 }}>
                      <Text className="seller-dashboard-profile-eyebrow">
                        Hồ sơ seller
                      </Text>
                      <Title
                        level={3}
                        ellipsis
                        className="seller-dashboard-profile-name"
                      >
                        {sellerName}
                      </Title>
                    </Flex>
                  </Flex>

                  <Flex vertical gap={10}>
                    <Flex align="center" gap={10}>
                      <MailOutlined className="seller-dashboard-profile-icon" />
                      <Text ellipsis className="seller-dashboard-profile-text">
                        {seller?.email || "Chưa có email"}
                      </Text>
                    </Flex>

                    <Flex align="center" gap={10}>
                      <PhoneOutlined className="seller-dashboard-profile-icon" />
                      <Text className="seller-dashboard-profile-text">
                        Thông tin liên hệ cập nhật trong hồ sơ tài khoản
                      </Text>
                    </Flex>
                  </Flex>

                  <Tag
                    color={seller?.isActive ? "success" : "error"}
                    className="seller-dashboard-profile-tag"
                  >
                    {seller?.isActive ? "Đang hoạt động" : "Tạm khóa"}
                  </Tag>
                </Flex>
              </div>
            </Col>

            <Col xs={24} lg={15}>
              <div className="seller-dashboard-summary-panel">
                <Row gutter={[18, 18]}>
                  <Col xs={24} md={8}>
                    <Flex vertical gap={6}>
                      <Text className="seller-dashboard-summary-label">
                        Doanh thu hôm nay
                      </Text>
                      <Text strong className="seller-dashboard-summary-value">
                        {currencyFormatter.format(stats.todayRevenue)} đ
                      </Text>
                      <Text className="seller-dashboard-summary-description">
                        Từ {stats.todayOrders} đơn hàng phát sinh trong ngày.
                      </Text>
                    </Flex>
                  </Col>

                  <Col xs={24} md={8}>
                    <Flex vertical gap={6}>
                      <Text className="seller-dashboard-summary-label">
                        Tiến độ tuyến
                      </Text>
                      <Progress
                        percent={routeProgress}
                        strokeColor={COLORS.primary}
                        trailColor="#D9EEE9"
                      />
                      <Text className="seller-dashboard-summary-description">
                        Đã ghé {visitedRouteCustomers}/{routeCustomers.length}{" "}
                        khách hàng.
                      </Text>
                    </Flex>
                  </Col>

                  <Col xs={24} md={8}>
                    <Flex vertical gap={6}>
                      <Text className="seller-dashboard-summary-label">
                        Khách hàng hiệu lực
                      </Text>
                      <Text strong className="seller-dashboard-summary-value">
                        {stats.approvedCustomers}/{stats.customers}
                      </Text>
                      <Text className="seller-dashboard-summary-description">
                        {stats.pendingCustomers} khách hàng đang chờ duyệt.
                      </Text>
                    </Flex>
                  </Col>
                </Row>

                <Flex gap={10} wrap="wrap" style={{ marginTop: 24 }}>
                  <Link href="/seller/customers/create">
                    <Button
                      icon={<PlusOutlined />}
                      className="seller-dashboard-button"
                    >
                      Thêm khách hàng
                    </Button>
                  </Link>
                  <Link href="/seller/routes">
                    <Button
                      icon={<EnvironmentOutlined />}
                      className="seller-dashboard-button"
                    >
                      Xem tuyến hôm nay
                    </Button>
                  </Link>
                  <Link href="/seller/kpis">
                    <Button
                      icon={<RiseOutlined />}
                      className="seller-dashboard-button"
                    >
                      KPI cá nhân
                    </Button>
                  </Link>
                </Flex>
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Khách hàng của tôi"
              value={stats.customers}
              icon={<TeamOutlined />}
              loading={isCustomersLoading}
              description="Tổng khách hàng đang được bạn phụ trách."
            />
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Khách chờ duyệt"
              value={stats.pendingCustomers}
              icon={<ClockCircleOutlined />}
              loading={isCustomersLoading}
              description="Khách hàng mới cần được xét duyệt."
            />
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Đơn hôm nay"
              value={stats.todayOrders}
              icon={<ShoppingCartOutlined />}
              loading={isOrdersLoading}
              description="Số đơn hàng đã tạo trong ngày hiện tại."
            />
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Đang ghé thăm"
              value={stats.activeVisits}
              icon={<EnvironmentOutlined />}
              loading={isVisitsLoading}
              description="Phiên check-in đang còn hoạt động."
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Tổng đơn hàng"
              value={stats.totalOrders}
              icon={<ShoppingCartOutlined />}
              loading={isOrdersLoading}
              description="Tổng số đơn hàng bạn đã tạo trong hệ thống."
            />
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Tổng doanh thu"
              value={stats.totalRevenue}
              formattedValue={`${currencyFormatter.format(stats.totalRevenue)} đ`}
              icon={<RiseOutlined />}
              loading={isOrdersLoading}
              description="Tổng giá trị đơn hàng theo dữ liệu hiện có."
            />
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Tổng lượt ghé thăm"
              value={stats.totalVisits}
              icon={<AimOutlined />}
              loading={isVisitsLoading}
              description="Tất cả phiên check-in/check-out đã được ghi nhận."
            />
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <DashboardMetricCard
              title="Khách trong tuyến"
              value={routeCustomers.length}
              icon={<EnvironmentOutlined />}
              loading={isRoutesLoading}
              description={`Tổng khách cần xử lý trong ${todayRoutes.length} tuyến hôm nay.`}
            />
          </Col>
        </Row>

        {activeVisit && (
          <Card
            variant="borderless"
            className="seller-dashboard-active-visit"
            styles={{
              body: {
                padding: 22,
              },
            }}
          >
            <Flex justify="space-between" align="center" gap={18} wrap="wrap">
              <Flex align="center" gap={16}>
                <div className="seller-dashboard-active-icon">
                  <EnvironmentOutlined />
                </div>

                <Flex vertical gap={5}>
                  <Text className="seller-dashboard-active-label">
                    Bạn đang check-in
                  </Text>

                  <Title level={4} className="seller-dashboard-active-title">
                    {getCustomerName(activeVisit.customer)}
                  </Title>

                  <Text className="seller-dashboard-active-description">
                    Check-in lúc{" "}
                    {new Date(activeVisit.checkInTime).toLocaleString("vi-VN")}
                  </Text>
                </Flex>
              </Flex>

              <Link href={`/seller/visits/${activeVisit._id}`}>
                <Button type="primary" className="seller-dashboard-primary-button">
                  Xem chi tiết
                </Button>
              </Link>
            </Flex>
          </Card>
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card
              variant="borderless"
              title={
                <Flex vertical gap={2}>
                  <Text strong className="seller-dashboard-section-title">
                    Tuyến hôm nay
                  </Text>
                  <Text className="seller-dashboard-section-description">
                    Danh sách khách hàng cần ghé thăm theo tuyến.
                  </Text>
                </Flex>
              }
              extra={
                <Link href="/seller/routes">
                  <Button className="seller-dashboard-button">
                    Xem tất cả
                  </Button>
                </Link>
              }
              className="seller-dashboard-section-card"
            >
              <Table
                className="seller-dashboard-table"
                rowKey={(record) => {
                  const customer =
                    typeof record.customer === "string"
                      ? record.customer
                      : record.customer._id;

                  return `${record.routeId}-${customer}`;
                }}
                loading={isRoutesLoading}
                columns={routeColumns}
                dataSource={routeCustomers}
                pagination={false}
                scroll={{ x: 760 }}
                locale={{
                  emptyText: <Empty description="Hôm nay chưa có tuyến" />,
                }}
              />
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card
              variant="borderless"
              title={
                <Flex vertical gap={2}>
                  <Text strong className="seller-dashboard-section-title">
                    Đơn hàng hôm nay
                  </Text>
                  <Text className="seller-dashboard-section-description">
                    Các đơn mới phát sinh trong ngày.
                  </Text>
                </Flex>
              }
              extra={
                <Link href="/seller/orders">
                  <Button className="seller-dashboard-button">
                    Xem tất cả
                  </Button>
                </Link>
              }
              className="seller-dashboard-section-card"
            >
              <Table
                className="seller-dashboard-table"
                rowKey="_id"
                loading={isOrdersLoading}
                columns={orderColumns}
                dataSource={todayOrders}
                pagination={false}
                scroll={{ x: 630 }}
                locale={{
                  emptyText: <Empty description="Hôm nay chưa có đơn hàng" />,
                }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-dashboard-section-title">
                Thao tác nhanh
              </Text>
              <Text className="seller-dashboard-section-description">
                Truy cập nhanh những luồng công việc thường dùng.
              </Text>
            </Flex>
          }
          className="seller-dashboard-section-card"
        >
          <Row gutter={[14, 14]}>
            <Col xs={24} sm={12} lg={6}>
              <Link href="/seller/customers/create">
                <Button
                  block
                  icon={<PlusOutlined />}
                  className="seller-dashboard-quick-button"
                >
                  Thêm khách hàng
                </Button>
              </Link>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Link href="/seller/customers">
                <Button
                  block
                  icon={<TeamOutlined />}
                  className="seller-dashboard-quick-button"
                >
                  Khách hàng của tôi
                </Button>
              </Link>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Link href="/seller/routes">
                <Button
                  block
                  icon={<EnvironmentOutlined />}
                  className="seller-dashboard-quick-button"
                >
                  Tuyến bán hàng
                </Button>
              </Link>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Link href="/seller/visits">
                <Button
                  block
                  icon={<CheckCircleOutlined />}
                  className="seller-dashboard-quick-button"
                >
                  Lịch sử ghé thăm
                </Button>
              </Link>
            </Col>
          </Row>
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

        .seller-dashboard-stack {
          position: relative;
        }

        .seller-dashboard-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 170px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-dashboard-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-dashboard-primary-button.ant-btn {
          height: 42px;
          border-radius: 12px;
          border-color: ${COLORS.primary};
          background: ${COLORS.primary};
          font-weight: 700;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-dashboard-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-dashboard-button.ant-btn {
          height: 38px;
          border-radius: 12px;
          border-color: ${COLORS.border};
          color: ${COLORS.text};
          font-weight: 700;
        }

        .seller-dashboard-button.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-dashboard-hero-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .seller-dashboard-profile-panel {
          height: 100%;
          min-height: 252px;
          padding: 24px;
          background: ${COLORS.dark};
          color: #ffffff;
        }

        .seller-dashboard-profile-avatar {
          flex-shrink: 0;
          background: #ffffff;
          color: ${COLORS.primary};
          font-size: 27px;
          font-weight: 800;
        }

        .seller-dashboard-profile-eyebrow {
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.45;
          text-transform: uppercase;
        }

        .seller-dashboard-profile-name.ant-typography {
          margin: 0;
          color: #ffffff;
          font-weight: 800;
          line-height: 1.25;
        }

        .seller-dashboard-profile-icon {
          color: rgba(255, 255, 255, 0.74);
        }

        .seller-dashboard-profile-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-dashboard-profile-tag.ant-tag {
          width: fit-content;
          border-radius: 999px;
          font-weight: 700;
          line-height: 26px;
          margin-inline-end: 0;
          padding-inline: 12px;
        }

        .seller-dashboard-summary-panel {
          padding: 24px;
        }

        .seller-dashboard-summary-label {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 800;
          line-height: 1.45;
          text-transform: uppercase;
        }

        .seller-dashboard-summary-value {
          color: ${COLORS.text};
          font-size: 27px;
          font-weight: 800;
          line-height: 1.2;
        }

        .seller-dashboard-summary-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.45;
        }

        .seller-dashboard-metric-card {
          height: 100%;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06);
        }

        .seller-dashboard-metric-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: ${COLORS.softPrimary};
          color: ${COLORS.primary};
          font-size: 22px;
        }

        .seller-dashboard-metric-value {
          color: ${COLORS.text};
          font-size: 22px;
          font-weight: 800;
          line-height: 1.15;
          text-align: right;
        }

        .seller-dashboard-metric-title {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
        }

        .seller-dashboard-metric-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-dashboard-active-visit {
          overflow: hidden;
          border: 1px solid #b7e7de;
          border-radius: 16px;
          background: #e8f7f3;
          box-shadow: 0 16px 34px rgba(13, 148, 136, 0.08);
        }

        .seller-dashboard-active-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: #d7f3ee;
          color: ${COLORS.primary};
          font-size: 25px;
        }

        .seller-dashboard-active-label {
          color: ${COLORS.primaryHover};
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
          text-transform: uppercase;
        }

        .seller-dashboard-active-title.ant-typography {
          margin: 0;
          color: ${COLORS.text};
          font-weight: 800;
          line-height: 1.35;
        }

        .seller-dashboard-active-description {
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.55;
        }

        .seller-dashboard-section-card {
          height: 100%;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-dashboard-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
        }

        .seller-dashboard-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-dashboard-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 800;
          line-height: 1.45;
        }

        .seller-dashboard-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-dashboard-status-tag.ant-tag {
          min-width: 86px;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 700;
          line-height: 24px;
          text-align: center;
        }

        .seller-dashboard-small-action.ant-btn {
          height: 32px;
          border-radius: 10px;
          background: ${COLORS.primary};
          border-color: ${COLORS.primary};
          font-weight: 700;
          box-shadow: 0 10px 22px rgba(13, 148, 136, 0.18);
        }

        .seller-dashboard-table-strong {
          color: ${COLORS.text};
          font-weight: 800;
          line-height: 1.45;
        }

        .seller-dashboard-table-muted {
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-dashboard-money {
          color: ${COLORS.primaryHover};
          font-weight: 800;
          line-height: 1.45;
        }

        .seller-dashboard-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-dashboard-table .ant-table {
          background: #ffffff;
        }

        .seller-dashboard-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-dashboard-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-dashboard-table .ant-table-tbody > tr:hover > td {
          background: ${COLORS.surface} !important;
        }

        .seller-dashboard-table .ant-table-cell {
          transition: background 160ms ease;
        }

        .seller-dashboard-quick-button.ant-btn {
          height: 52px;
          justify-content: flex-start;
          border-color: ${COLORS.border};
          border-radius: 14px;
          color: ${COLORS.text};
          font-weight: 800;
          padding-inline: 18px;
        }

        .seller-dashboard-quick-button.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
          background: ${COLORS.softPrimary} !important;
        }
      `}</style>
    </>
  );
}
