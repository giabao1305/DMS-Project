"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  DollarOutlined,
  FileDoneOutlined,
  GiftOutlined,
  InboxOutlined,
  ProductOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Column, Line } from "@ant-design/plots";
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
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetAdminDashboardQuery } from "@/features/dashboard/dashboardService";
import type { Order, OrderStatus } from "@/features/orders/orderTypes";
import { useGetOrdersPageQuery } from "@/features/orders/orderService";
import {
  useGetOrdersReportQuery,
  useGetSalesReportQuery,
  useGetSellersReportQuery,
} from "@/features/reports/reportService";
import { useGetWarehousesQuery } from "@/features/warehouses/warehouseService";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const statusLabel: Record<OrderStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  delivered: "Đã giao kho",
  return_requested: "Chờ trả hàng",
  cancelled: "Đã hủy",
  returned: "Đã trả hàng",
};

const getOrderDistributorName = (distributor?: Order["distributor"]) =>
  typeof distributor === "object"
    ? distributor.companyName || distributor.fullName || "-"
    : distributor || "-";

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

function useAnimatedNumber(value: number, duration = 650) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      previousValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const from = previousValueRef.current;
    const difference = value - from;
    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const nextValue = from + difference * easeOutCubic(progress);

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return displayValue;
}

function AnimatedNumber({
  value,
  formatter = (currentValue) => currentValue.toLocaleString("vi-VN"),
  duration,
}: {
  value: number;
  formatter?: (value: number) => string;
  duration?: number;
}) {
  const animatedValue = useAnimatedNumber(value, duration);

  return <>{formatter(Math.round(animatedValue))}</>;
}

const lineChartAnimate = {
  enter: { type: "pathIn", duration: 520 },
  update: { duration: 260 },
} as const;

const columnChartAnimate = {
  enter: { type: "growInY", duration: 520 },
  update: { duration: 260 },
} as const;

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
          <strong className="admin-dash-stat-number">
              <AnimatedNumber
                value={value}
                formatter={formatter}
              duration={700}
            />
          </strong>
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
    data: supplyOrdersData,
    isLoading: loadingSupplyOrders,
    refetch: refetchSupplyOrders,
  } = useGetOrdersPageQuery({
    page: 1,
    limit: 5,
    type: "manufacturer_to_distributor",
    status: "pending",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const {
    data: warehouses = [],
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery();

  const {
    data: sales = [],
    isLoading: loadingSales,
    refetch: refetchSales,
  } = useGetSalesReportQuery(reportParams);
  const {
    data: orderReports = [],
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
      refetchSupplyOrders();
      refetchWarehouses();
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

    const salesChartData = [...sales]
      .sort((first, second) => first._id.day - second._id.day)
      .map((item) => ({
        date: `${item._id.day}/${item._id.month}`,
        revenue: item.totalRevenue,
        orders: item.totalOrders,
      }));

    const sellerRevenueChartData = sellersReport.slice(0, 7).map((item) => ({
      seller: item.seller?.companyName || item.seller?.fullName || "-",
      revenue: item.totalRevenue,
      orders: item.totalOrders,
    }));
    const managersCount = adminSummary?.totalManagers ?? 0;
    const activeManagersCount = adminSummary?.activeManagers ?? 0;
    const sellersCount = adminSummary?.totalSellers ?? 0;
    const activeSellersCount = adminSummary?.activeSellers ?? 0;
    const totalStaffCount = sellersCount + managersCount;
    const activeStaffCount = activeSellersCount + activeManagersCount;

    return {
      totalRevenue,
      totalOrders,
      deliveredOrders,
      sellersCount,
      activeSellersCount,
      managersCount,
      activeManagersCount,
      totalStaffCount,
      activeStaffCount,
      customersCount: adminSummary?.totalCustomers ?? 0,
      productsCount: adminSummary?.totalProducts ?? 0,
      activeProductsCount: adminSummary?.activeProducts ?? 0,
      lowStockProductsCount: adminSummary?.lowStockProducts ?? 0,
      pendingSupplyOrdersCount: supplyOrdersData?.meta.total ?? 0,
      distributorWarehousesCount: warehouses.filter(
        (warehouse) => warehouse.type === "distributor",
      ).length,
      lowStockPreview: adminSummary?.lowStockPreview ?? [],
      pendingSupplyOrders: supplyOrdersData?.data ?? [],
      salesChartData,
      sellerRevenueChartData,
    };
  }, [adminSummary, orderReports, sales, sellersReport, supplyOrdersData, warehouses]);

  const statTiles: StatTileProps[] = [
    {
      label: "Doanh thu tháng",
      value: dashboard.totalRevenue,
      formatter: money,
      caption: `${dashboard.deliveredOrders} đơn giao NPP đã hoàn tất`,
      icon: <DollarOutlined />,
      toneKey: "emerald",
      loading: loadingSales,
    },
    {
      label: "Duyệt nhập kho",
      value: dashboard.pendingSupplyOrdersCount,
      caption: "Đơn NPP chờ quản trị xử lý",
      icon: <DatabaseOutlined />,
      toneKey: "blue",
      loading: loadingSupplyOrders,
    },
    {
      label: "Sản phẩm",
      value: dashboard.activeProductsCount,
      caption: `${dashboard.productsCount} sản phẩm trong hệ thống`,
      icon: <ProductOutlined />,
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
      label: "Duyệt nhập kho",
      description: "Xác nhận yêu cầu nhập hàng từ NPP",
      count: dashboard.pendingSupplyOrdersCount,
      href: "/admin/orders/supply",
      icon: <FileDoneOutlined />,
      toneKey: "amber",
    },
    {
      label: "Kho NPP",
      description: "Theo dõi tồn và giá bán từng nhà phân phối",
      count: dashboard.distributorWarehousesCount,
      href: "/admin/warehouses",
      icon: <DatabaseOutlined />,
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
      label: "Báo cáo",
      description: "Xem phân tích doanh thu và hiệu suất",
      count: dashboard.totalOrders,
      href: "/admin/reports",
      icon: <BarChartOutlined />,
      toneKey: "emerald",
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Tổng quan điều hành"
        description="Theo dõi nhanh các khu vực đang hiện trên menu: nhập kho, tồn kho, dữ liệu hệ thống và báo cáo."
        extra={
          <Flex gap={10} wrap="wrap">
            <Link href="/admin/orders/supply">
              <Button type="primary" icon={<DatabaseOutlined />}>
                Duyệt nhập kho
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button icon={<InboxOutlined />}>Kho hàng</Button>
            </Link>
          </Flex>
        }
      />

      <section className="admin-dash-shell">
        <div className="admin-dash-hero">
          <div className="admin-dash-hero-copy">
            <Tag className="admin-dash-hero-tag">Vận hành trực tiếp</Tag>
            <Title level={2} className="admin-dash-hero-title">
              Tổng quan tháng {reportParams.month}/{reportParams.year}
            </Title>
            <Text className="admin-dash-hero-description">
              Tập trung vào những phân hệ quản trị đang dùng thường xuyên: cấp hàng
              cho NPP, tồn kho, sản phẩm, nhân sự và báo cáo vận hành.
            </Text>

            <Row gutter={[12, 12]} className="admin-dash-hero-strip">
              <Col xs={24} sm={8}>
                <div className="admin-dash-hero-chip">
                  <Text>Doanh thu</Text>
                  <strong>
                    <AnimatedNumber
                      value={dashboard.totalRevenue}
                      formatter={money}
                      duration={720}
                    />
                  </strong>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="admin-dash-hero-chip">
                  <Text>Đơn nhập chờ duyệt</Text>
                  <strong>
                    <AnimatedNumber value={dashboard.pendingSupplyOrdersCount} />
                  </strong>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="admin-dash-hero-chip">
                  <Text>Cảnh báo kho</Text>
                  <strong>
                    <AnimatedNumber value={dashboard.lowStockProductsCount} />
                  </strong>
                </div>
              </Col>
            </Row>
          </div>

          <div className="admin-dash-progress-card">
            <Text className="admin-dash-progress-label">Sản phẩm đang bán</Text>
            <Progress
              type="dashboard"
              percent={
                dashboard.productsCount > 0
                  ? Math.round(
                      (dashboard.activeProductsCount / dashboard.productsCount) *
                        100,
                    )
                  : 0
              }
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
              <AnimatedNumber value={dashboard.activeProductsCount} />/
              <AnimatedNumber value={dashboard.productsCount} /> sản phẩm hoạt động
            </Text>
            <div className="admin-dash-progress-meta">
              <span>
                Nhân viên{" "}
                <strong>
                  <AnimatedNumber value={dashboard.totalStaffCount} />
                </strong>
              </span>
              <span>
                Kho NPP{" "}
                <strong>
                  <AnimatedNumber value={dashboard.distributorWarehousesCount} />
                </strong>
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
              className="admin-dash-stock-alert-panel"
              data-no-hover="true"
              title={
                <PanelTitle
                  title="Cảnh báo tồn kho"
                  description="Sản phẩm cần nhập hoặc điều chuyển sớm"
                  extra={
                    <Link href="/admin/inventory">
                      <Button
                        size="small"
                        className="admin-dash-stock-alert-action"
                      >
                        Xem kho
                      </Button>
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
                  title="Đơn nhập kho chờ duyệt"
                  description="Yêu cầu cấp hàng từ nhà phân phối"
                  extra={
                    <Link href="/admin/orders/supply">
                      <Button size="small">Duyệt nhập</Button>
                    </Link>
                  }
                />
              }
            >
              {dashboard.pendingSupplyOrders.length === 0 ? (
                <Empty description="Không có đơn nhập kho chờ duyệt" />
              ) : (
                <Space direction="vertical" size={10} className="admin-dash-list">
                  {dashboard.pendingSupplyOrders.map((order) => (
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="admin-dash-management-row"
                      key={order._id}
                    >
                      <span className="admin-dash-row-icon admin-dash-row-icon-amber">
                        <DatabaseOutlined />
                      </span>
                      <span className="admin-dash-row-main">
                        <strong>{order.orderCode}</strong>
                        <small>
                          {getOrderDistributorName(order.distributor)} ·{" "}
                          {money(order.finalAmount)}
                        </small>
                      </span>
                      <Tag color="orange">{statusLabel[order.status]}</Tag>
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
                  title="Quản trị dữ liệu"
                  description="Lối tắt đến các phân hệ đang hiện trên menu"
                  extra={<Tag color="blue">Menu</Tag>}
                />
              }
            >
              <Space direction="vertical" size={10} className="admin-dash-list">
                <Link href="/admin/users" className="admin-dash-management-row">
                  <span className="admin-dash-row-icon admin-dash-row-icon-blue">
                    <TeamOutlined />
                  </span>
                  <span className="admin-dash-row-main">
                    <strong>Nhân viên</strong>
                    <small>
                      {dashboard.activeManagersCount} quản lí ·{" "}
                      {dashboard.activeSellersCount} nhân viên bán hàng đang hoạt động
                    </small>
                  </span>
                  <Tag color="blue">Người dùng</Tag>
                </Link>
                <Link href="/admin/categories" className="admin-dash-management-row">
                  <span className="admin-dash-row-icon admin-dash-row-icon-blue">
                    <AppstoreOutlined />
                  </span>
                  <span className="admin-dash-row-main">
                    <strong>Danh mục</strong>
                    <small>Tổ chức nhóm sản phẩm</small>
                  </span>
                  <Tag color="cyan">Dữ liệu</Tag>
                </Link>
                <Link href="/admin/promotions" className="admin-dash-management-row">
                  <span className="admin-dash-row-icon admin-dash-row-icon-amber">
                    <GiftOutlined />
                  </span>
                  <span className="admin-dash-row-main">
                    <strong>Khuyến mãi</strong>
                    <small>Chính sách hỗ trợ bán hàng</small>
                  </span>
                  <Tag color="orange">Bán hàng</Tag>
                </Link>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="admin-dash-row">
          <Col xs={24}>
            <div className="admin-dash-command-strip">
              <div>
                <span>Nhân viên hoạt động</span>
                <strong>
                  <AnimatedNumber value={dashboard.activeStaffCount} />/
                  <AnimatedNumber value={dashboard.totalStaffCount} />
                </strong>
              </div>
              <div>
                <span>Sản phẩm đang bán</span>
                <strong>
                  <AnimatedNumber value={dashboard.activeProductsCount} />/
                  <AnimatedNumber value={dashboard.productsCount} />
                </strong>
              </div>
              <div>
                <span>Khách hàng quản lý</span>
                <strong>
                  <AnimatedNumber value={dashboard.customersCount} />
                </strong>
              </div>
              <div>
                <span>Việc cần xử lý</span>
                <strong>
                  <AnimatedNumber
                    value={
                      dashboard.pendingSupplyOrdersCount +
                      dashboard.lowStockProductsCount
                    }
                  />
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
                  title="Doanh thu giao NPP theo ngày"
                  description="Doanh thu từ đơn giao hàng cho NPP trong tháng"
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
                  animate={lineChartAnimate}
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
                  extra={<Tag color="orange">Cần xử lý</Tag>}
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
          <Col xs={24} xl={16}>
            <Card
              variant="borderless"
              className="admin-dash-panel"
              loading={loadingSellersReport}
              title={
                <PanelTitle
                  title="Top NPP theo doanh thu"
                  description="Nhà phân phối nhận hàng có doanh thu cao trong tháng"
                  extra={<Tag color="cyan">7 cao nhất</Tag>}
                />
              }
            >
              {dashboard.sellerRevenueChartData.length === 0 ? (
                <Empty description="Chưa có dữ liệu nhà phân phối" />
              ) : (
                <Column
                  height={310}
                  data={dashboard.sellerRevenueChartData}
                  xField="seller"
                  yField="revenue"
                  colorField={() => "#0EA5E9"}
                  animate={columnChartAnimate}
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
                    title: "Nhà phân phối",
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
                  title="Tóm tắt phân hệ"
                  description="Những khu vực chính đang mở trên menu"
                  extra={<Tag color="green">Quản trị</Tag>}
                />
              }
            >
              <div className="admin-dash-status-grid">
                <div>
                  <DatabaseOutlined />
                  <span>Đơn nhập chờ</span>
                  <strong>
                    <AnimatedNumber value={dashboard.pendingSupplyOrdersCount} />
                  </strong>
                </div>
                <div>
                  <InboxOutlined />
                  <span>Cảnh báo kho</span>
                  <strong>
                    <AnimatedNumber value={dashboard.lowStockProductsCount} />
                  </strong>
                </div>
                <div>
                  <ProductOutlined />
                  <span>Sản phẩm</span>
                  <strong>
                    <AnimatedNumber value={dashboard.productsCount} />
                  </strong>
                </div>
                <div>
                  <TeamOutlined />
                  <span>Nhân viên</span>
                  <strong>
                    <AnimatedNumber value={dashboard.totalStaffCount} />
                  </strong>
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
          animation: admin-dash-fade-up 260ms ease-out both;
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
          animation: admin-dash-fade-up 240ms ease-out both;
        }

        .admin-dash-hero-strip .ant-col:nth-child(1) .admin-dash-hero-chip {
          animation-delay: 60ms;
        }

        .admin-dash-hero-strip .ant-col:nth-child(2) .admin-dash-hero-chip {
          animation-delay: 90ms;
        }

        .admin-dash-hero-strip .ant-col:nth-child(3) .admin-dash-hero-chip {
          animation-delay: 120ms;
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
          animation: admin-dash-fade-up 260ms ease-out 80ms both;
        }

        .admin-dash-progress-card:hover {
          border-color: rgba(125, 211, 252, 0.18) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 18px 38px rgba(0, 0, 0, 0.16) !important;
          transform: none !important;
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
          animation: admin-dash-fade-up 240ms ease-out both;
        }

        .admin-dash-shell > .ant-row:nth-of-type(1) .ant-col:nth-child(1) .admin-dash-stat-card {
          animation-delay: 50ms;
        }

        .admin-dash-shell > .ant-row:nth-of-type(1) .ant-col:nth-child(2) .admin-dash-stat-card {
          animation-delay: 70ms;
        }

        .admin-dash-shell > .ant-row:nth-of-type(1) .ant-col:nth-child(3) .admin-dash-stat-card {
          animation-delay: 90ms;
        }

        .admin-dash-shell > .ant-row:nth-of-type(1) .ant-col:nth-child(4) .admin-dash-stat-card {
          animation-delay: 110ms;
        }

        .admin-dash-row .ant-col:nth-child(1) .admin-dash-panel {
          animation-delay: 40ms;
        }

        .admin-dash-row .ant-col:nth-child(2) .admin-dash-panel {
          animation-delay: 70ms;
        }

        .admin-dash-row .ant-col:nth-child(3) .admin-dash-panel {
          animation-delay: 100ms;
        }

        .admin-dash-stat-card:hover,
        .admin-dash-panel:hover {
          border-color: #dbe4f0 !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transform: none !important;
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

        .admin-dash-stat-number {
          display: block;
          color: #0f172a;
          font-size: 28px;
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: 0;
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

        .admin-dash-stock-alert-panel.ant-card {
          height: 100%;
          overflow: hidden;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transform: none !important;
          transition: none !important;
          animation: admin-dash-fade-up 240ms ease-out 40ms both;
          pointer-events: none !important;
        }

        .admin-dash-stock-alert-panel.ant-card:hover,
        .admin-dash-stock-alert-panel.ant-card:focus,
        .admin-dash-stock-alert-panel.ant-card:focus-within,
        .admin-dash-stock-alert-panel.ant-card[data-no-hover="true"]:hover {
          border-color: #dbe4f0 !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transform: none !important;
          transition: none !important;
        }

        .admin-dash-stock-alert-panel .ant-card-head,
        .admin-dash-stock-alert-panel:hover .ant-card-head,
        .admin-dash-stock-alert-panel[data-no-hover="true"] .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff !important;
          transition: none !important;
          pointer-events: auto !important;
        }

        .admin-dash-stock-alert-panel .ant-card-body,
        .admin-dash-stock-alert-panel:hover .ant-card-body,
        .admin-dash-stock-alert-panel[data-no-hover="true"] .ant-card-body {
          min-height: 304px;
          padding: 18px !important;
          background: #ffffff !important;
          transition: none !important;
        }

        .admin-dash-stock-alert-panel .ant-empty,
        .admin-dash-stock-alert-panel .ant-empty * {
          pointer-events: none !important;
          transform: none !important;
          transition: none !important;
        }

        .admin-dash-stock-alert-panel .admin-dash-stock-alert-action.ant-btn {
          pointer-events: auto !important;
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
          animation: admin-dash-fade-up 240ms ease-out 60ms both;
        }

        .admin-dash-command-strip > div {
          min-height: 92px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          animation: none;
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
          animation: admin-dash-fade-up 220ms ease-out both;
        }

        .admin-dash-status-grid > div:nth-child(1) {
          animation-delay: 40ms;
        }

        .admin-dash-status-grid > div:nth-child(2) {
          animation-delay: 60ms;
        }

        .admin-dash-status-grid > div:nth-child(3) {
          animation-delay: 80ms;
        }

        .admin-dash-status-grid > div:nth-child(4) {
          animation-delay: 100ms;
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

        @keyframes admin-dash-fade-up {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
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
          .admin-dash-hero,
          .admin-dash-hero-chip,
          .admin-dash-progress-card,
          .admin-dash-stat-card,
          .admin-dash-panel,
          .admin-dash-command-strip,
          .admin-dash-command-strip > div,
          .admin-dash-table .ant-table-tbody > tr > td,
          .admin-dash-status-grid > div,
          .admin-dash-queue-item,
          .admin-dash-management-row {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            clip-path: none !important;
          }
        }
      `}</style>
    </>
  );
}
