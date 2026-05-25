"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
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

import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import { useGetMyOrdersQuery } from "@/features/orders/orderService";
import type { Order } from "@/features/orders/orderTypes";
import { useGetMyRoutesQuery } from "@/features/routes/routeService";
import type { Route } from "@/features/routes/routeTypes";
import { useGetSellerUsersQuery } from "@/features/users/userService";
import { useGetMyVisitsQuery } from "@/features/visits/visitService";
import type { Visit } from "@/features/visits/visitTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import { useAppSelector } from "@/store/hooks";

const { Text, Title } = Typography;

const currencyFormatter = new Intl.NumberFormat("vi-VN");

const orderStatusMap = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  delivered: { color: "cyan", text: "Đã giao" },
  return_requested: { color: "orange", text: "Chờ trả hàng" },
  cancelled: { color: "red", text: "Đã hủy" },
  returned: { color: "purple", text: "Đã trả hàng" },
};

const routeStatusMap = {
  planned: { color: "blue", text: "Kế hoạch" },
  in_progress: { color: "processing", text: "Đang đi" },
  completed: { color: "success", text: "Hoàn tất" },
  cancelled: { color: "error", text: "Đã hủy" },
};

const getName = (value: Order["seller"] | Order["customer"] | Visit["customer"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
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
    <Card loading={loading} className="distributor-dashboard-metric-card">
      <Flex vertical gap={14}>
        <Flex align="center" justify="space-between" gap={12}>
          <div className="distributor-dashboard-metric-icon">{icon}</div>
          {formattedValue ? (
            <Text strong className="distributor-dashboard-metric-value">
              {formattedValue}
            </Text>
          ) : (
            <Statistic
              value={value}
              valueStyle={{
                color: "#0b2f2a",
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            />
          )}
        </Flex>
        <Flex vertical gap={5}>
          <Text strong className="distributor-dashboard-metric-title">
            {title}
          </Text>
          <Text className="distributor-dashboard-metric-description">
            {description}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export default function DistributorDashboardPage() {
  const distributor = useAppSelector((state) => state.auth.user);

  const {
    data: team = [],
    isLoading: isTeamLoading,
    refetch: refetchTeam,
  } = useGetSellerUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const {
    data: customers = [],
    isLoading: isCustomersLoading,
    refetch: refetchCustomers,
  } = useGetMyCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useGetMyOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const {
    data: visits = [],
    isLoading: isVisitsLoading,
    refetch: refetchVisits,
  } = useGetMyVisitsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const {
    data: routes = [],
    isLoading: isRoutesLoading,
    refetch: refetchRoutes,
  } = useGetMyRoutesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(
    [
      "new-notification",
      "customer-updated",
      "order-updated",
      "route-updated",
      "visit-updated",
    ],
    () => {
      refetchTeam();
      refetchCustomers();
      refetchOrders();
      refetchVisits();
      refetchRoutes();
    },
  );

  const today = useMemo(() => new Date().toDateString(), []);

  const todayRoutes = useMemo(
    () => routes.filter((item) => new Date(item.workDate).toDateString() === today),
    [routes, today],
  );

  const todayOrders = useMemo(
    () => orders.filter((item) => new Date(item.createdAt).toDateString() === today),
    [orders, today],
  );

  const activeVisits = useMemo(
    () => visits.filter((item) => item.status === "checked_in"),
    [visits],
  );

  const stats = useMemo(() => {
    const todayRevenue = todayOrders.reduce(
      (total, item) => total + item.finalAmount,
      0,
    );
    const deliveredRevenue = orders
      .filter((item) => item.status === "delivered")
      .reduce((total, item) => total + item.finalAmount, 0);

    return {
      team: team.length,
      activeTeam: team.filter((item) => item.isActive).length,
      customers: customers.length,
      approvedCustomers: customers.filter((item) => item.status === "approved")
        .length,
      pendingCustomers: customers.filter((item) => item.status === "pending")
        .length,
      orders: orders.length,
      pendingOrders: orders.filter((item) => item.status === "pending").length,
      deliveredOrders: orders.filter((item) => item.status === "delivered").length,
      todayOrders: todayOrders.length,
      todayRevenue,
      deliveredRevenue,
      visits: visits.length,
      activeVisits: activeVisits.length,
      routes: routes.length,
      todayRoutes: todayRoutes.length,
    };
  }, [activeVisits.length, customers, orders, routes.length, team, todayOrders, todayRoutes.length, visits.length]);

  const routeCustomers = useMemo(
    () =>
      todayRoutes.flatMap((route) =>
        route.customers.map((item) => ({
          ...item,
          routeId: route._id,
          routeName: route.name,
          seller: route.seller,
        })),
      ),
    [todayRoutes],
  );

  const visitedRouteCustomers = routeCustomers.filter(
    (item) => item.status === "visited",
  ).length;
  const routeProgress = routeCustomers.length
    ? Math.round((visitedRouteCustomers / routeCustomers.length) * 100)
    : 0;
  const teamActiveRate = stats.team
    ? Math.round((stats.activeTeam / stats.team) * 100)
    : 0;

  const distributorName = distributor?.fullName || "Distributor";
  const distributorInitial = distributorName.trim().charAt(0).toUpperCase() || "D";

  const routeColumns: ColumnsType<Route> = [
    {
      title: "Tuyến",
      dataIndex: "name",
      ellipsis: true,
      width: 220,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="distributor-table-mark">
            <EnvironmentOutlined />
          </div>
          <Text strong ellipsis className="distributor-row-strong">
            {value}
          </Text>
        </Flex>
      ),
    },
    {
      title: "DSR",
      dataIndex: "seller",
      ellipsis: true,
      width: 180,
      render: (seller: Route["seller"]) => {
        if (!seller || typeof seller === "string") return "-";
        return seller.fullName || seller.email || "-";
      },
    },
    {
      title: "Điểm bán",
      dataIndex: "customers",
      align: "center",
      width: 120,
      render: (value: Route["customers"]) => (
        <Tag color="cyan" className="distributor-pill-tag">
          {value.length}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 140,
      render: (status: keyof typeof routeStatusMap) => {
        const item = routeStatusMap[status] ?? routeStatusMap.planned;
        return (
          <Tag color={item.color} className="distributor-pill-tag">
            {item.text}
          </Tag>
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
        <Text strong className="distributor-row-strong">
          {value}
        </Text>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      ellipsis: true,
      width: 190,
      render: (value) => (
        <Text className="distributor-row-muted">{getName(value)}</Text>
      ),
    },
    {
      title: "DSR",
      dataIndex: "seller",
      ellipsis: true,
      width: 170,
      render: (value) => (
        <Text className="distributor-row-muted">{getName(value)}</Text>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "finalAmount",
      align: "right",
      width: 150,
      render: (value: number) => (
        <Text strong className="distributor-dashboard-money">
          {currencyFormatter.format(value)} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 140,
      render: (status: keyof typeof orderStatusMap) => {
        const item = orderStatusMap[status] ?? orderStatusMap.pending;
        return (
          <Tag color={item.color} className="distributor-pill-tag">
            {item.text}
          </Tag>
        );
      },
    },
  ];

  return (
    <Flex vertical gap={22} className="distributor-page-stack distributor-dashboard-stack">
      <Card className="distributor-dashboard-hero-card" styles={{ body: { padding: 0 } }}>
        <Row gutter={0}>
          <Col xs={24} lg={9}>
            <div className="distributor-dashboard-profile-panel">
              <Flex vertical justify="space-between" gap={24} style={{ height: "100%" }}>
                <Flex align="center" gap={16}>
                  <Avatar size={64} className="distributor-dashboard-avatar">
                    {distributorInitial || <UserOutlined />}
                  </Avatar>
                  <Flex vertical gap={4} style={{ minWidth: 0 }}>
                    <Text className="distributor-dashboard-profile-eyebrow">
                      Hồ sơ nhà phân phối
                    </Text>
                    <Title level={3} ellipsis className="distributor-dashboard-profile-name">
                      {distributorName}
                    </Title>
                  </Flex>
                </Flex>

                <Flex vertical gap={10}>
                  <Flex align="center" gap={10}>
                    <MailOutlined className="distributor-dashboard-profile-icon" />
                    <Text ellipsis className="distributor-dashboard-profile-text">
                      {distributor?.email || "Chưa có email"}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={10}>
                    <PhoneOutlined className="distributor-dashboard-profile-icon" />
                    <Text className="distributor-dashboard-profile-text">
                      Quản lý đội DSR, tuyến bán hàng và hiệu suất điểm bán
                    </Text>
                  </Flex>
                </Flex>

                <Tag
                  color={distributor?.isActive ? "success" : "error"}
                  className="distributor-pill-tag"
                >
                  {distributor?.isActive ? "Đang hoạt động" : "Tạm khóa"}
                </Tag>
              </Flex>
            </div>
          </Col>

          <Col xs={24} lg={15}>
            <div className="distributor-dashboard-summary-panel">
              <Row gutter={[18, 18]}>
                <Col xs={24} md={8}>
                  <Flex vertical gap={6}>
                    <Text className="distributor-dashboard-summary-label">
                      Doanh thu hôm nay
                    </Text>
                    <Text strong className="distributor-dashboard-summary-value">
                      {currencyFormatter.format(stats.todayRevenue)} đ
                    </Text>
                    <Text className="distributor-dashboard-summary-description">
                      Từ {stats.todayOrders} đơn hàng phát sinh trong ngày.
                    </Text>
                  </Flex>
                </Col>
                <Col xs={24} md={8}>
                  <Flex vertical gap={6}>
                    <Text className="distributor-dashboard-summary-label">
                      Tiến độ tuyến hôm nay
                    </Text>
                    <Progress
                      percent={routeProgress}
                      strokeColor="#0d9488"
                      trailColor="#d9eee9"
                    />
                    <Text className="distributor-dashboard-summary-description">
                      Đã ghé {visitedRouteCustomers}/{routeCustomers.length} điểm bán.
                    </Text>
                  </Flex>
                </Col>
                <Col xs={24} md={8}>
                  <Flex vertical gap={6}>
                    <Text className="distributor-dashboard-summary-label">
                      Đội DSR hoạt động
                    </Text>
                    <Text strong className="distributor-dashboard-summary-value">
                      {stats.activeTeam}/{stats.team}
                    </Text>
                    <Text className="distributor-dashboard-summary-description">
                      {teamActiveRate}% nhân sự đang sẵn sàng nhận tuyến.
                    </Text>
                  </Flex>
                </Col>
              </Row>

              <Flex gap={10} wrap="wrap" style={{ marginTop: 24 }}>
                <Link href="/distributor/team">
                  <Button icon={<TeamOutlined />} className="distributor-dashboard-button">
                    Xem đội DSR
                  </Button>
                </Link>
                <Link href="/distributor/routes">
                  <Button icon={<EnvironmentOutlined />} className="distributor-dashboard-button">
                    Xem tuyến hôm nay
                  </Button>
                </Link>
                <Link href="/distributor/kpis">
                  <Button icon={<RiseOutlined />} className="distributor-dashboard-button">
                    KPI đội
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
            title="DSR trong đội"
            value={stats.team}
            icon={<TeamOutlined />}
            loading={isTeamLoading}
            description="Nhân sự được gán trực tiếp cho distributor."
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Khách chờ duyệt"
            value={stats.pendingCustomers}
            icon={<ClockCircleOutlined />}
            loading={isCustomersLoading}
            description="Điểm bán mới đang chờ admin xét duyệt."
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Đơn hôm nay"
            value={stats.todayOrders}
            icon={<ShoppingCartOutlined />}
            loading={isOrdersLoading}
            description="Đơn hàng đội DSR tạo trong ngày."
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Đang ghé thăm"
            value={stats.activeVisits}
            icon={<AimOutlined />}
            loading={isVisitsLoading}
            description="Phiên check-in đang còn hoạt động."
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Tổng điểm bán"
            value={stats.customers}
            icon={<CheckCircleOutlined />}
            loading={isCustomersLoading}
            description={`${stats.approvedCustomers} điểm bán đã được duyệt.`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Tổng đơn hàng"
            value={stats.orders}
            icon={<ShoppingCartOutlined />}
            loading={isOrdersLoading}
            description={`${stats.pendingOrders} đơn đang chờ xử lý.`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Doanh thu đã giao"
            value={stats.deliveredRevenue}
            formattedValue={`${currencyFormatter.format(stats.deliveredRevenue)} đ`}
            icon={<DollarOutlined />}
            loading={isOrdersLoading}
            description={`${stats.deliveredOrders} đơn đã giao thành công.`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardMetricCard
            title="Khách trong tuyến"
            value={routeCustomers.length}
            icon={<EnvironmentOutlined />}
            loading={isRoutesLoading}
            description={`Từ ${stats.todayRoutes} tuyến bán hàng hôm nay.`}
          />
        </Col>
      </Row>

      {activeVisits[0] && (
        <Card className="distributor-dashboard-active-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <Flex align="center" gap={16}>
              <div className="distributor-dashboard-active-icon">
                <EnvironmentOutlined />
              </div>
              <Flex vertical gap={5}>
                <Text className="distributor-dashboard-active-label">
                  DSR đang check-in
                </Text>
                <Title level={4} className="distributor-dashboard-active-title">
                  {getName(activeVisits[0].customer)}
                </Title>
                <Text className="distributor-dashboard-active-description">
                  {getName(activeVisits[0].seller)} check-in lúc{" "}
                  {new Date(activeVisits[0].checkInTime).toLocaleString("vi-VN")}
                </Text>
              </Flex>
            </Flex>
            <Tag color="processing" className="distributor-pill-tag">
              Đang ghé
            </Tag>
          </Flex>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={
              <Flex vertical gap={2}>
                <Text strong className="distributor-table-card-title">
                  Tuyến hôm nay
                </Text>
                <Text className="distributor-table-card-description">
                  Danh sách tuyến đội DSR cần thực thi trong ngày.
                </Text>
              </Flex>
            }
            extra={
              <Link href="/distributor/routes">
                <Button className="distributor-dashboard-button">Xem tất cả</Button>
              </Link>
            }
            className="distributor-panel-card distributor-table-card"
          >
            <Table
              rowKey="_id"
              loading={isRoutesLoading}
              columns={routeColumns}
              dataSource={todayRoutes}
              pagination={false}
              scroll={{ x: 720 }}
              locale={{ emptyText: <Empty description="Hôm nay chưa có tuyến" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title={
              <Flex vertical gap={2}>
                <Text strong className="distributor-table-card-title">
                  Đơn hàng hôm nay
                </Text>
                <Text className="distributor-table-card-description">
                  Các đơn mới phát sinh từ đội DSR.
                </Text>
              </Flex>
            }
            extra={
              <Link href="/distributor/orders">
                <Button className="distributor-dashboard-button">Xem tất cả</Button>
              </Link>
            }
            className="distributor-panel-card distributor-table-card"
          >
            <Table
              rowKey="_id"
              loading={isOrdersLoading}
              columns={orderColumns}
              dataSource={todayOrders}
              pagination={false}
              scroll={{ x: 800 }}
              locale={{ emptyText: <Empty description="Hôm nay chưa có đơn hàng" /> }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Flex vertical gap={2}>
            <Text strong className="distributor-table-card-title">
              Thao tác nhanh
            </Text>
            <Text className="distributor-table-card-description">
              Các khu vực distributor thường cần kiểm tra trong ngày.
            </Text>
          </Flex>
        }
        className="distributor-panel-card"
      >
        <Row gutter={[14, 14]}>
          {[
            { href: "/distributor/team", icon: <TeamOutlined />, text: "Đội DSR" },
            { href: "/distributor/customers", icon: <CheckCircleOutlined />, text: "Khách hàng đội" },
            { href: "/distributor/orders", icon: <ShoppingCartOutlined />, text: "Đơn hàng đội" },
            { href: "/distributor/visits", icon: <AimOutlined />, text: "Lịch sử ghé thăm" },
          ].map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.href}>
              <Link href={item.href}>
                <Button block icon={item.icon} className="distributor-dashboard-quick-button">
                  {item.text}
                </Button>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      <style jsx global>{`
        .distributor-dashboard-hero-card {
          overflow: hidden;
          border: 1px solid #d7ebe7;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .distributor-dashboard-profile-panel {
          height: 100%;
          min-height: 252px;
          padding: 24px;
          background: #07171f;
          color: #ffffff;
        }

        .distributor-dashboard-avatar {
          flex-shrink: 0;
          background: #ffffff;
          color: #0d9488;
          font-size: 27px;
          font-weight: 800;
        }

        .distributor-dashboard-profile-eyebrow,
        .distributor-dashboard-summary-label,
        .distributor-dashboard-active-label {
          font-size: 12px;
          font-weight: 800;
          line-height: 1.45;
          text-transform: uppercase;
        }

        .distributor-dashboard-profile-eyebrow {
          color: rgba(255, 255, 255, 0.72) !important;
        }

        .distributor-dashboard-profile-name.ant-typography {
          margin: 0;
          color: #ffffff;
          font-weight: 800;
          line-height: 1.25;
        }

        .distributor-dashboard-profile-icon {
          color: rgba(255, 255, 255, 0.74);
        }

        .distributor-dashboard-profile-text {
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 14px;
          line-height: 1.5;
        }

        .distributor-dashboard-summary-panel {
          padding: 24px;
        }

        .distributor-dashboard-summary-label {
          color: #5d7471 !important;
        }

        .distributor-dashboard-summary-value {
          color: #0b2f2a !important;
          font-size: 27px;
          font-weight: 800;
          line-height: 1.2;
        }

        .distributor-dashboard-summary-description,
        .distributor-dashboard-metric-description,
        .distributor-dashboard-active-description {
          color: #5d7471 !important;
          font-size: 13px;
          line-height: 1.5;
        }

        .distributor-dashboard-button.ant-btn {
          height: 38px;
          border-color: #d7ebe7;
          border-radius: 12px;
          color: #0b2f2a;
          font-weight: 700;
        }

        .distributor-dashboard-button.ant-btn:hover,
        .distributor-dashboard-quick-button.ant-btn:hover {
          border-color: #0d9488 !important;
          color: #0d9488 !important;
          background: #e7f8f5 !important;
        }

        .distributor-dashboard-metric-card {
          height: 100%;
          border: 1px solid #d7ebe7;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06);
        }

        .distributor-dashboard-metric-card .ant-card-body {
          padding: 18px;
        }

        .distributor-dashboard-metric-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: #e7f8f5;
          color: #0d9488;
          font-size: 22px;
        }

        .distributor-dashboard-metric-value {
          color: #0b2f2a !important;
          font-size: 22px;
          font-weight: 800;
          line-height: 1.15;
          text-align: right;
        }

        .distributor-dashboard-metric-title {
          color: #0b2f2a !important;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
        }

        .distributor-dashboard-money {
          color: #0f766e !important;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-dashboard-active-card {
          overflow: hidden;
          border: 1px solid #b7e7de;
          border-radius: 16px;
          background: #e8f7f3;
          box-shadow: 0 16px 34px rgba(13, 148, 136, 0.08);
        }

        .distributor-dashboard-active-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: #d7f3ee;
          color: #0d9488;
          font-size: 25px;
        }

        .distributor-dashboard-active-label {
          color: #0f766e !important;
        }

        .distributor-dashboard-active-title.ant-typography {
          margin: 0;
          color: #0b2f2a;
          font-weight: 800;
          line-height: 1.35;
        }

        .distributor-dashboard-quick-button.ant-btn {
          height: 52px;
          justify-content: flex-start;
          border-color: #d7ebe7;
          border-radius: 14px;
          color: #0b2f2a;
          font-weight: 800;
          padding-inline: 18px;
        }
      `}</style>
    </Flex>
  );
}
