"use client";

import {
  AimOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Column, Line, Pie } from "@ant-design/plots";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetAdminDashboardQuery } from "@/features/dashboard/dashboardService";
import type { Order, OrderStatus } from "@/features/orders/orderTypes";
import {
  useGetOrdersReportQuery,
  useGetSalesReportQuery,
  useGetSellersReportQuery,
} from "@/features/reports/reportService";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "orange" },
  approved: { label: "Đã xác nhận", color: "blue" },
  delivered: { label: "Đã giao", color: "green" },
  return_requested: { label: "Chờ duyệt trả", color: "gold" },
  cancelled: { label: "Đã hủy", color: "red" },
  returned: { label: "Đã trả hàng", color: "purple" },
};

const routeStatusMap = {
  planned: { label: "Đã lên lịch", color: "blue" },
  in_progress: { label: "Đang chạy", color: "green" },
  completed: { label: "Hoàn tất", color: "cyan" },
  cancelled: { label: "Đã hủy", color: "red" },
} as const;

const getPersonName = (person?: string | { fullName?: string }) =>
  typeof person === "object" ? person.fullName || "Chưa gán" : "Chưa gán";

const compactDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

const tone = {
  blue: {
    accent: "#2563EB",
    soft: "#EFF6FF",
    border: "#C7DDFE",
  },
  cyan: {
    accent: "#0EA5E9",
    soft: "#ECFEFF",
    border: "#BAE6FD",
  },
  emerald: {
    accent: "#10B981",
    soft: "#ECFDF5",
    border: "#B7E4CB",
  },
  amber: {
    accent: "#F59E0B",
    soft: "#FFFBEB",
    border: "#F6E3B3",
  },
  red: {
    accent: "#EF4444",
    soft: "#FEF2F2",
    border: "#F8D5D5",
  },
};

type ToneKey = keyof typeof tone;

type StatTileProps = {
  label: string;
  value: number;
  formatter?: (value: number) => string;
  caption: string;
  icon: ReactNode;
  toneKey: ToneKey;
  loading?: boolean;
};

type QueueItemProps = {
  label: string;
  description: string;
  count: number;
  href: string;
  icon: ReactNode;
  toneKey: ToneKey;
};

type PanelTitleProps = {
  title: string;
  description: string;
  extra?: ReactNode;
};

function PanelTitle({ title, description, extra }: PanelTitleProps) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap={14}
      wrap="wrap"
      className="admin-dash-panel-title"
    >
      <div>
        <Text className="admin-dash-panel-heading">{title}</Text>
        <Text className="admin-dash-panel-description">{description}</Text>
      </div>
      {extra}
    </Flex>
  );
}

function StatTile({
  label,
  value,
  formatter = (currentValue) => currentValue.toLocaleString("vi-VN"),
  caption,
  icon,
  toneKey,
  loading,
}: StatTileProps) {
  const color = tone[toneKey];

  return (
    <Card
      loading={loading}
      variant="borderless"
      className="admin-dash-stat-card"
      style={
        {
          "--stat-accent": color.accent,
          "--stat-soft": color.soft,
          "--stat-border": color.border,
        } as CSSProperties
      }
    >
      <Flex align="flex-start" justify="space-between" gap={14}>
        <div className="admin-dash-stat-copy">
          <Text className="admin-dash-stat-label">{label}</Text>
          <Statistic
            value={value}
            formatter={(currentValue) => formatter(Number(currentValue ?? 0))}
            valueStyle={{
              color: "#0F172A",
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: 0,
            }}
          />
        </div>

        <Flex align="center" justify="center" className="admin-dash-stat-icon">
          {icon}
        </Flex>
      </Flex>

      <Text className="admin-dash-stat-caption">{caption}</Text>
    </Card>
  );
}

function QueueItem({
  label,
  description,
  count,
  href,
  icon,
  toneKey,
}: QueueItemProps) {
  const color = tone[toneKey];

  return (
    <Link
      href={href}
      className="admin-dash-queue-item"
      style={
        {
          "--queue-accent": color.accent,
          "--queue-soft": color.soft,
          "--queue-border": color.border,
        } as CSSProperties
      }
    >
      <Flex align="center" gap={12} className="admin-dash-queue-main">
        <Flex align="center" justify="center" className="admin-dash-queue-icon">
          {icon}
        </Flex>

        <div className="admin-dash-queue-copy">
          <Text className="admin-dash-queue-label">{label}</Text>
          <Text className="admin-dash-queue-description">{description}</Text>
        </div>
      </Flex>

      <Badge
        count={count}
        overflowCount={99}
        color={color.accent}
        className="admin-dash-queue-badge"
      />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const now = useMemo(() => new Date(), []);
  const reportParams = useMemo(
    () => ({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }),
    [now],
  );
  const {
    data: adminSummary,
    refetch: refetchDashboard,
  } = useGetAdminDashboardQuery();

  const {
    data: sales = [],
    isLoading: loadingSales,
    refetch: refetchSales,
  } = useGetSalesReportQuery(reportParams);
  const {
    data: orderReports = [],
    isLoading: loadingOrdersReport,
    refetch: refetchOrdersReport,
  } = useGetOrdersReportQuery(reportParams);
  const {
    data: sellersReport = [],
    isLoading: loadingSellersReport,
    refetch: refetchSellersReport,
  } = useGetSellersReportQuery(reportParams);

  useRealtimeRefetch(
    [
      "new-notification",
      "user-updated",
      "customer-updated",
      "product-updated",
      "stock-updated",
      "order-updated",
      "leave-updated",
      "route-updated",
      "reports-updated",
    ],
    () => {
      refetchDashboard();
      refetchSales();
      refetchOrdersReport();
      refetchSellersReport();
    },
  );

  const dashboard = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );
    const totalOrders = orderReports.reduce(
      (sum, item) => sum + item.totalOrders,
      0,
    );
    const deliveredOrders =
      orderReports.find((item) => item._id === "delivered")?.totalOrders || 0;
    const pendingOrders =
      orderReports.find((item) => item._id === "pending")?.totalOrders || 0;
    const approvedOrders =
      orderReports.find((item) => item._id === "approved")?.totalOrders || 0;
    const cancelledOrders =
      orderReports.find((item) => item._id === "cancelled")?.totalOrders || 0;

    const completionRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    const salesChartData = [...sales]
      .sort((first, second) => first._id.day - second._id.day)
      .map((item) => ({
        date: `${item._id.day}/${item._id.month}`,
        revenue: item.totalRevenue,
        orders: item.totalOrders,
      }));

    const orderStatusChartData = orderReports.map((item) => ({
      status: statusMap[item._id]?.label || item._id,
      total: item.totalOrders,
      value: item.totalValue,
    }));

    const sellerRevenueChartData = sellersReport.slice(0, 7).map((item) => ({
      seller: item.seller?.fullName || "-",
      revenue: item.totalRevenue,
      orders: item.totalOrders,
    }));

    return {
      totalRevenue,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      approvedOrders,
      cancelledOrders,
      sellersCount: adminSummary?.totalSellers ?? 0,
      activeSellersCount: adminSummary?.activeSellers ?? 0,
      customersCount: adminSummary?.totalCustomers ?? 0,
      productsCount: adminSummary?.totalProducts ?? 0,
      activeProductsCount: adminSummary?.activeProducts ?? 0,
      lowStockProductsCount: adminSummary?.lowStockProducts ?? 0,
      pendingLeavesCount: adminSummary?.pendingLeaves ?? 0,
      todayRoutesCount: adminSummary?.todayRoutePreview?.length ?? 0,
      lowStockPreview: adminSummary?.lowStockPreview ?? [],
      pendingLeavePreview: adminSummary?.pendingLeavePreview ?? [],
      todayRoutePreview: adminSummary?.todayRoutePreview ?? [],
      completionRate,
      salesChartData,
      orderStatusChartData,
      sellerRevenueChartData,
      recentOrders: adminSummary?.recentOrders ?? [],
    };
  }, [adminSummary, orderReports, sales, sellersReport]);

  const statTiles: StatTileProps[] = [
    {
      label: "Doanh thu tháng",
      value: dashboard.totalRevenue,
      formatter: money,
      caption: `${dashboard.deliveredOrders} đơn đã giao`,
      icon: <DollarOutlined />,
      toneKey: "emerald",
      loading: loadingSales,
    },
    {
      label: "Tổng đơn hàng",
      value: dashboard.totalOrders,
      caption: `${dashboard.pendingOrders} đơn đang chờ duyệt`,
      icon: <ShoppingCartOutlined />,
      toneKey: "blue",
      loading: loadingOrdersReport,
    },
    {
      label: "Khách hàng",
      value: dashboard.customersCount,
      caption: `${dashboard.sellersCount} seller phụ trách`,
      icon: <TeamOutlined />,
      toneKey: "cyan",
    },
    {
      label: "Cảnh báo kho",
      value: dashboard.lowStockProductsCount,
      caption: "Sản phẩm dưới tồn tối thiểu",
      icon: <WarningOutlined />,
      toneKey: dashboard.lowStockProductsCount > 0 ? "red" : "emerald",
    },
  ];

  const queueItems: QueueItemProps[] = [
    {
      label: "Đơn chờ duyệt",
      description: "Kiểm tra và xác nhận đơn hàng mới",
      count: dashboard.pendingOrders,
      href: "/admin/orders",
      icon: <FileDoneOutlined />,
      toneKey: "amber",
    },
    {
      label: "Đơn nghỉ phép",
      description: "Yêu cầu đang cần admin xử lý",
      count: dashboard.pendingLeavesCount,
      href: "/admin/leaves",
      icon: <ClockCircleOutlined />,
      toneKey: "blue",
    },
    {
      label: "Tồn kho thấp",
      description: "Ưu tiên bổ sung hàng trong kho",
      count: dashboard.lowStockProductsCount,
      href: "/admin/inventory",
      icon: <InboxOutlined />,
      toneKey: "red",
    },
    {
      label: "Tuyến hôm nay",
      description: "Lịch bán hàng đang triển khai",
      count: dashboard.todayRoutesCount,
      href: "/admin/routes",
      icon: <AimOutlined />,
      toneKey: "emerald",
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Dashboard điều hành"
        description="Một màn hình tập trung cho doanh thu, đơn hàng, tồn kho và hiệu suất đội bán hàng."
        extra={
          <Flex gap={10} wrap="wrap">
            <Link href="/admin/orders">
              <Button type="primary" icon={<FileDoneOutlined />}>
                Duyệt đơn
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button icon={<BarChartOutlined />}>Báo cáo</Button>
            </Link>
          </Flex>
        }
      />

      <section className="admin-dash-shell">
        <div className="admin-dash-hero">
          <div className="admin-dash-hero-copy">
            <Tag className="admin-dash-hero-tag">Live Operation</Tag>
            <Title level={2} className="admin-dash-hero-title">
              Tổng quan tháng {reportParams.month}/{reportParams.year}
            </Title>
            <Text className="admin-dash-hero-description">
              Theo dõi sức khỏe kinh doanh và các việc cần xử lý ngay trong hệ
              thống phân phối.
            </Text>

            <Row gutter={[12, 12]} className="admin-dash-hero-strip">
              <Col xs={24} sm={8}>
                <div className="admin-dash-hero-chip">
                  <Text>Doanh thu</Text>
                  <strong>{money(dashboard.totalRevenue)}</strong>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="admin-dash-hero-chip">
                  <Text>Đơn đã giao</Text>
                  <strong>{dashboard.deliveredOrders.toLocaleString("vi-VN")}</strong>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="admin-dash-hero-chip">
                  <Text>Tuyến hôm nay</Text>
                  <strong>{dashboard.todayRoutesCount.toLocaleString("vi-VN")}</strong>
                </div>
              </Col>
            </Row>
          </div>

          <div className="admin-dash-progress-card">
            <Text className="admin-dash-progress-label">Tỷ lệ hoàn tất đơn</Text>
            <Progress
              type="dashboard"
              percent={dashboard.completionRate}
              size={150}
              strokeColor="#10B981"
              trailColor="rgba(255, 255, 255, 0.14)"
              format={(percent) => (
                <span className="admin-dash-progress-percent">
                  {percent ?? 0}%
                </span>
              )}
            />
            <Text className="admin-dash-progress-note">
              {dashboard.deliveredOrders}/{dashboard.totalOrders} đơn đã hoàn tất
            </Text>
            <div className="admin-dash-progress-meta">
              <span>
                Chờ duyệt <strong>{dashboard.pendingOrders}</strong>
              </span>
              <span>
                Đã xác nhận <strong>{dashboard.approvedOrders}</strong>
              </span>
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {statTiles.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.label}>
              <StatTile {...item} />
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} className="admin-dash-row">
          <Col xs={24} lg={8}>
            <Card
              variant="borderless"
              className="admin-dash-panel admin-dash-ops-panel"
              title={
                <PanelTitle
                  title="Cảnh báo tồn kho"
                  description="Sản phẩm cần nhập hoặc điều chuyển sớm"
                  extra={
                    <Link href="/admin/inventory">
                      <Button size="small">Xem kho</Button>
                    </Link>
                  }
                />
              }
            >
              {dashboard.lowStockPreview.length === 0 ? (
                <Empty description="Kho đang ổn định" />
              ) : (
                <Space direction="vertical" size={10} className="admin-dash-list">
                  {dashboard.lowStockPreview.map((product) => (
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="admin-dash-management-row"
                      key={product._id}
                    >
                      <span className="admin-dash-row-icon admin-dash-row-icon-red">
                        <InboxOutlined />
                      </span>
                      <span className="admin-dash-row-main">
                        <strong>{product.name}</strong>
                        <small>
                          Tồn {product.stock.toLocaleString("vi-VN")} / tối thiểu{" "}
                          {product.minStock.toLocaleString("vi-VN")} {product.unit}
                        </small>
                      </span>
                      <Tag color="red">Thiếu</Tag>
                    </Link>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              variant="borderless"
              className="admin-dash-panel admin-dash-ops-panel"
              title={
                <PanelTitle
                  title="Nghỉ phép chờ duyệt"
                  description="Yêu cầu cần quyết định để không kẹt lịch tuyến"
                  extra={
                    <Link href="/admin/leaves">
                      <Button size="small">Duyệt phép</Button>
                    </Link>
                  }
                />
              }
            >
              {dashboard.pendingLeavePreview.length === 0 ? (
                <Empty description="Không có yêu cầu chờ duyệt" />
              ) : (
                <Space direction="vertical" size={10} className="admin-dash-list">
                  {dashboard.pendingLeavePreview.map((leave) => (
                    <Link
                      href={`/admin/leaves/${leave._id}`}
                      className="admin-dash-management-row"
                      key={leave._id}
                    >
                      <span className="admin-dash-row-icon admin-dash-row-icon-amber">
                        <ClockCircleOutlined />
                      </span>
                      <span className="admin-dash-row-main">
                        <strong>{getPersonName(leave.seller)}</strong>
                        <small>
                          {compactDate(leave.startDate)} - {compactDate(leave.endDate)}
                        </small>
                      </span>
                      <Tag color="orange">Chờ</Tag>
                    </Link>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              variant="borderless"
              className="admin-dash-panel admin-dash-ops-panel"
              title={
                <PanelTitle
                  title="Tuyến hôm nay"
                  description="Giám sát tuyến bán hàng đang triển khai"
                  extra={
                    <Link href="/admin/routes">
                      <Button size="small">Xem tuyến</Button>
                    </Link>
                  }
                />
              }
            >
              {dashboard.todayRoutePreview.length === 0 ? (
                <Empty description="Chưa có tuyến hôm nay" />
              ) : (
                <Space direction="vertical" size={10} className="admin-dash-list">
                  {dashboard.todayRoutePreview.map((route) => (
                    <Link
                      href={`/admin/routes/${route._id}`}
                      className="admin-dash-management-row"
                      key={route._id}
                    >
                      <span className="admin-dash-row-icon admin-dash-row-icon-blue">
                        <AimOutlined />
                      </span>
                      <span className="admin-dash-row-main">
                        <strong>{route.name}</strong>
                        <small>
                          {getPersonName(route.seller)} · {route.customers.length} điểm
                        </small>
                      </span>
                      <Tag color={routeStatusMap[route.status]?.color}>
                        {routeStatusMap[route.status]?.label}
                      </Tag>
                    </Link>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="admin-dash-row">
          <Col xs={24}>
            <div className="admin-dash-command-strip">
              <div>
                <span>Seller hoạt động</span>
                <strong>
                  {dashboard.activeSellersCount}/{dashboard.sellersCount}
                </strong>
              </div>
              <div>
                <span>Sản phẩm đang bán</span>
                <strong>
                  {dashboard.activeProductsCount}/{dashboard.productsCount}
                </strong>
              </div>
              <div>
                <span>Khách hàng quản lý</span>
                <strong>{dashboard.customersCount.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <span>Việc cần xử lý</span>
                <strong>
                  {(
                    dashboard.pendingOrders +
                    dashboard.pendingLeavesCount +
                    dashboard.lowStockProductsCount
                  ).toLocaleString("vi-VN")}
                </strong>
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="admin-dash-row">
          <Col xs={24} xl={16}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              loading={loadingSales}
              title={
                <PanelTitle
                  title="Doanh thu theo ngày"
                  description="Biến động doanh thu trong tháng hiện tại"
                  extra={<Tag color="green">{money(dashboard.totalRevenue)}</Tag>}
                />
              }
            >
              {dashboard.salesChartData.length === 0 ? (
                <Empty description="Chưa có dữ liệu doanh thu" />
              ) : (
                <Line
                  height={320}
                  data={dashboard.salesChartData}
                  xField="date"
                  yField="revenue"
                  shapeField="smooth"
                  colorField={() => "#2563EB"}
                  point={{ sizeField: 3 }}
                  axis={{
                    y: {
                      labelFormatter: (value: number) =>
                        value >= 1000000
                          ? `${Math.round(value / 1000000)}tr`
                          : value.toLocaleString("vi-VN"),
                    },
                  }}
                  tooltip={{
                    title: "date",
                    items: [
                      {
                        field: "revenue",
                        name: "Doanh thu",
                        valueFormatter: (value: number) => money(value),
                      },
                      { field: "orders", name: "Số đơn" },
                    ],
                  }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              title={
                <PanelTitle
                  title="Việc cần xử lý"
                  description="Các hàng đợi quan trọng trong ngày"
                  extra={<Tag color="orange">Action</Tag>}
                />
              }
            >
              <Space direction="vertical" size={12} className="admin-dash-queue">
                {queueItems.map((item) => (
                  <QueueItem key={item.label} {...item} />
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="admin-dash-row">
          <Col xs={24} xl={9}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              loading={loadingOrdersReport}
              title={
                <PanelTitle
                  title="Trạng thái đơn"
                  description="Tỷ trọng đơn hàng theo tiến độ"
                  extra={
                    <Tag color="blue">
                      {dashboard.totalOrders.toLocaleString("vi-VN")} đơn
                    </Tag>
                  }
                />
              }
            >
              {dashboard.orderStatusChartData.length === 0 ? (
                <Empty description="Chưa có dữ liệu đơn hàng" />
              ) : (
                <Pie
                  height={310}
                  data={dashboard.orderStatusChartData}
                  angleField="total"
                  colorField="status"
                  innerRadius={0.64}
                  legend={{ color: { position: "bottom" } }}
                  label={false}
                  tooltip={{
                    title: "status",
                    items: [
                      { field: "total", name: "Số đơn" },
                      {
                        field: "value",
                        name: "Giá trị",
                        valueFormatter: (value: number) => money(value),
                      },
                    ],
                  }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} xl={15}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              loading={loadingSellersReport}
              title={
                <PanelTitle
                  title="Top seller theo doanh thu"
                  description="Hiệu suất bán hàng nổi bật trong tháng"
                  extra={<Tag color="cyan">Top 7</Tag>}
                />
              }
            >
              {dashboard.sellerRevenueChartData.length === 0 ? (
                <Empty description="Chưa có dữ liệu seller" />
              ) : (
                <Column
                  height={310}
                  data={dashboard.sellerRevenueChartData}
                  xField="seller"
                  yField="revenue"
                  colorField={() => "#0EA5E9"}
                  axis={{
                    x: { labelAutoHide: true, labelAutoRotate: false },
                    y: {
                      labelFormatter: (value: number) =>
                        value >= 1000000
                          ? `${Math.round(value / 1000000)}tr`
                          : value.toLocaleString("vi-VN"),
                    },
                  }}
                  tooltip={{
                    title: "seller",
                    items: [
                      {
                        field: "revenue",
                        name: "Doanh thu",
                        valueFormatter: (value: number) => money(value),
                      },
                      { field: "orders", name: "Số đơn" },
                    ],
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="admin-dash-row">
          <Col xs={24} xl={15}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              title={
                <PanelTitle
                  title="Đơn hàng mới nhất"
                  description="Các đơn vừa phát sinh trong hệ thống"
                  extra={<Tag color="geekblue">7 đơn gần nhất</Tag>}
                />
              }
            >
              <Table<Order>
                rowKey="_id"
                size="middle"
                dataSource={dashboard.recentOrders}
                pagination={false}
                scroll={{ x: 620 }}
                className="admin-dash-table"
                locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }}
                columns={[
                  {
                    title: "Mã đơn",
                    dataIndex: "orderCode",
                    render: (value: string) => (
                      <Text className="admin-dash-table-strong">{value}</Text>
                    ),
                  },
                  {
                    title: "Giá trị",
                    dataIndex: "finalAmount",
                    align: "right",
                    render: (value: number) => (
                      <Text className="admin-dash-table-money">{money(value)}</Text>
                    ),
                  },
                  {
                    title: "Trạng thái",
                    dataIndex: "status",
                    align: "center",
                    render: (status: OrderStatus) => (
                      <Tag
                        color={statusMap[status]?.color}
                        className="admin-dash-status-tag"
                      >
                        {statusMap[status]?.label}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              title={
                <PanelTitle
                  title="Tóm tắt xử lý đơn"
                  description="Tình trạng vận hành hiện tại"
                  extra={<Tag color="green">Status</Tag>}
                />
              }
            >
              <div className="admin-dash-status-grid">
                <div>
                  <CheckCircleOutlined />
                  <span>Đã giao</span>
                  <strong>{dashboard.deliveredOrders}</strong>
                </div>
                <div>
                  <ShoppingCartOutlined />
                  <span>Đã xác nhận</span>
                  <strong>{dashboard.approvedOrders}</strong>
                </div>
                <div>
                  <ExclamationCircleOutlined />
                  <span>Chờ xác nhận</span>
                  <strong>{dashboard.pendingOrders}</strong>
                </div>
                <div>
                  <WarningOutlined />
                  <span>Đã hủy</span>
                  <strong>{dashboard.cancelledOrders}</strong>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      <style jsx global>{`
        .admin-dash-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-dash-hero {
          position: relative;
          min-height: 276px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            linear-gradient(90deg, rgba(16, 185, 129, 0.18), transparent 34%),
            radial-gradient(circle at 88% 18%, rgba(14, 165, 233, 0.3), transparent 27%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-dash-hero::after {
          content: "";
          position: absolute;
          inset: auto 24px 0 24px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.42), transparent);
        }

        .admin-dash-hero-copy {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .admin-dash-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-dash-hero-title.ant-typography {
          max-width: 720px;
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-dash-hero-description.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-dash-hero-strip {
          max-width: 780px;
          margin-top: 24px;
        }

        .admin-dash-hero-chip {
          height: 100%;
          min-height: 82px;
          padding: 14px 15px;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
        }

        .admin-dash-hero-chip .ant-typography {
          display: block;
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-dash-hero-chip strong {
          display: block;
          margin-top: 8px;
          overflow: hidden;
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-dash-progress-card {
          position: relative;
          z-index: 1;
          min-height: 224px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
            rgba(6, 32, 44, 0.72);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 18px 38px rgba(0, 0, 0, 0.16);
        }

        .admin-dash-progress-card .ant-progress-text {
          color: #ffffff !important;
        }

        .admin-dash-progress-percent {
          color: #ffffff;
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
        }

        .admin-dash-progress-label,
        .admin-dash-progress-note {
          color: #d8edf7 !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-dash-progress-note {
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-dash-progress-meta {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .admin-dash-progress-meta span {
          min-height: 48px;
          padding: 9px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.16);
          border-radius: 8px;
          color: #9ed7eb;
          font-size: 11.5px;
          font-weight: 700;
          line-height: 1.25;
          background: rgba(255, 255, 255, 0.06);
        }

        .admin-dash-progress-meta strong {
          margin-top: 4px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-dash-row {
          margin-top: 16px;
        }

        .admin-dash-stat-card,
        .admin-dash-panel {
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

        .admin-dash-stat-card:hover,
        .admin-dash-panel:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-dash-stat-card {
          position: relative;
        }

        .admin-dash-stat-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: var(--stat-accent);
        }

        .admin-dash-stat-card .ant-card-body {
          height: 100%;
          min-height: 154px;
          padding: 19px 20px 17px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .admin-dash-stat-copy {
          min-width: 0;
        }

        .admin-dash-stat-label {
          display: block;
          margin-bottom: 10px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
        }

        .admin-dash-stat-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border: 1px solid var(--stat-border);
          border-radius: 8px;
          color: var(--stat-accent);
          font-size: 22px;
          background: var(--stat-soft);
        }

        .admin-dash-stat-caption {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 700;
          line-height: 1.45;
        }

        .admin-dash-panel .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-dash-panel .ant-card-body {
          padding: 18px !important;
        }

        .admin-dash-ops-panel .ant-card-body {
          min-height: 304px;
        }

        .admin-dash-panel-title {
          width: 100%;
        }

        .admin-dash-panel-heading {
          display: block;
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.25;
        }

        .admin-dash-panel-description {
          display: block;
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.45;
        }

        .admin-dash-queue {
          width: 100%;
        }

        .admin-dash-queue-item {
          min-height: 72px;
          padding: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid var(--queue-border);
          border-radius: 8px;
          color: inherit;
          background: var(--queue-soft);
          transition:
            border-color 170ms ease,
            background 170ms ease,
            transform 170ms ease;
        }

        .admin-dash-queue-item:hover {
          border-color: var(--queue-accent);
          background: #ffffff;
          transform: translateX(2px);
        }

        .admin-dash-queue-main,
        .admin-dash-queue-copy {
          min-width: 0;
        }

        .admin-dash-queue-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 8px;
          color: #ffffff;
          font-size: 18px;
          background: var(--queue-accent);
        }

        .admin-dash-queue-label,
        .admin-dash-queue-description {
          display: block;
        }

        .admin-dash-queue-label {
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.35;
        }

        .admin-dash-queue-description {
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-dash-queue-badge {
          flex-shrink: 0;
        }

        .admin-dash-list {
          width: 100%;
        }

        .admin-dash-management-row {
          min-height: 64px;
          padding: 11px 12px;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr) auto;
          align-items: center;
          gap: 11px;
          border: 1px solid #e4ebf5;
          border-radius: 8px;
          color: inherit;
          background: #fbfdff;
          transition:
            border-color 170ms ease,
            background 170ms ease,
            transform 170ms ease,
            box-shadow 170ms ease;
        }

        .admin-dash-management-row:hover {
          border-color: #b9cce5;
          background: #ffffff;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.07);
          transform: translateY(-1px);
        }

        .admin-dash-row-icon {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 17px;
        }

        .admin-dash-row-icon-red {
          color: #dc2626;
          background: #fef2f2;
        }

        .admin-dash-row-icon-amber {
          color: #d97706;
          background: #fffbeb;
        }

        .admin-dash-row-icon-blue {
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-dash-row-main {
          min-width: 0;
        }

        .admin-dash-row-main strong,
        .admin-dash-row-main small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-dash-row-main strong {
          color: #0f172a;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.35;
        }

        .admin-dash-row-main small {
          margin-top: 2px;
          color: #64748b;
          font-size: 12px;
          font-weight: 650;
          line-height: 1.35;
        }

        .admin-dash-command-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1px;
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #dbe4f0;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055);
        }

        .admin-dash-command-strip > div {
          min-height: 92px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        }

        .admin-dash-command-strip span {
          color: #64748b;
          font-size: 12.5px;
          font-weight: 800;
          line-height: 1.3;
        }

        .admin-dash-command-strip strong {
          margin-top: 8px;
          color: #0f172a;
          font-size: 28px;
          font-weight: 950;
          line-height: 1;
        }

        .admin-dash-table .ant-table,
        .admin-dash-table .ant-table-container,
        .admin-dash-table .ant-table-content {
          background: #ffffff !important;
        }

        .admin-dash-table .ant-table-thead > tr > th {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-dash-table .ant-table-tbody > tr > td {
          padding-block: 14px !important;
          border-bottom-color: #edf2f7 !important;
        }

        .admin-dash-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-dash-table-strong {
          color: #2563eb !important;
          font-weight: 900;
        }

        .admin-dash-table-money {
          color: #0f172a !important;
          font-weight: 800;
        }

        .admin-dash-status-tag {
          min-width: 104px;
          margin-inline-end: 0;
          border-radius: 999px !important;
          text-align: center;
          font-weight: 800;
        }

        .admin-dash-status-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .admin-dash-status-grid > div {
          min-height: 112px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #fbfdff;
        }

        .admin-dash-status-grid .anticon {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-dash-status-grid span {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-dash-status-grid strong {
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
          line-height: 1;
        }

        @media (max-width: 1199px) {
          .admin-dash-hero {
            grid-template-columns: 1fr;
          }

          .admin-dash-progress-card {
            min-height: 210px;
          }
        }

        @media (max-width: 767px) {
          .admin-dash-hero {
            padding: 20px;
          }

          .admin-dash-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-dash-panel .ant-card-head {
            min-height: 88px;
          }

          .admin-dash-status-grid {
            grid-template-columns: 1fr;
          }

          .admin-dash-command-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 575px) {
          .admin-dash-command-strip {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-dash-stat-card,
          .admin-dash-panel,
          .admin-dash-queue-item,
          .admin-dash-management-row {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
