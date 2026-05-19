"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ReloadOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Column, Line } from "@ant-design/plots";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useGetKpisQuery,
  useGetOrdersReportQuery,
  useGetSalesReportQuery,
  useGetSellersReportQuery,
  useGetVisitsReportQuery,
  useRefreshKpiMutation,
} from "@/features/reports/reportService";
import type {
  Kpi,
  OrdersReportItem,
  SellersReportItem,
  VisitsReportItem,
} from "@/features/reports/reportTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

const orderStatusMap: Record<OrdersReportItem["_id"], { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "orange" },
  approved: { label: "Đã xác nhận", color: "blue" },
  delivered: { label: "Đã giao", color: "green" },
  return_requested: { label: "Chờ duyệt trả hàng", color: "gold" },
  cancelled: { label: "Đã hủy", color: "red" },
  returned: { label: "Đã trả hàng", color: "purple" },
};

const statTone = {
  emerald: {
    accent: "#10b981",
    soft: "#ecfdf5",
    border: "#bbf7d0",
  },
  blue: {
    accent: "#2563eb",
    soft: "#eff6ff",
    border: "#bfdbfe",
  },
  amber: {
    accent: "#f59e0b",
    soft: "#fffbeb",
    border: "#fde68a",
  },
  cyan: {
    accent: "#0ea5e9",
    soft: "#ecfeff",
    border: "#bae6fd",
  },
};

type StatToneKey = keyof typeof statTone;

type ReportStatCardProps = {
  label: string;
  value: number;
  caption: string;
  formatter?: (value: number) => string;
  icon: ReactNode;
  toneKey: StatToneKey;
  loading?: boolean;
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

function ReportStatCard({
  label,
  value,
  caption,
  formatter = (currentValue) => currentValue.toLocaleString("vi-VN"),
  icon,
  toneKey,
  loading,
}: ReportStatCardProps) {
  const tone = statTone[toneKey];

  return (
    <Card
      loading={loading}
      variant="borderless"
      className="admin-reports-stat-card"
      style={
        {
          "--report-stat-accent": tone.accent,
          "--report-stat-soft": tone.soft,
          "--report-stat-border": tone.border,
        } as CSSProperties
      }
    >
      <Flex align="flex-start" justify="space-between" gap={14}>
        <div className="admin-reports-stat-copy">
          <Text className="admin-reports-stat-label">{label}</Text>
          <Statistic
            value={value}
            formatter={(currentValue) => formatter(Number(currentValue ?? 0))}
            valueStyle={{
              color: "#0f172a",
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: 0,
            }}
          />
        </div>

        <Flex align="center" justify="center" className="admin-reports-stat-icon">
          {icon}
        </Flex>
      </Flex>

      <Text className="admin-reports-stat-caption">{caption}</Text>
    </Card>
  );
}

export default function AdminReportsPage() {
  const { message } = App.useApp();
  const now = useMemo(() => new Date(), []);
  const params = useMemo(
    () => ({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }),
    [now],
  );

  const {
    data: sales = [],
    isLoading: loadingSales,
    refetch: refetchSales,
  } = useGetSalesReportQuery(params);
  const {
    data: orders = [],
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useGetOrdersReportQuery(params);
  const {
    data: visits = [],
    isLoading: loadingVisits,
    refetch: refetchVisits,
  } = useGetVisitsReportQuery(params);
  const {
    data: sellers = [],
    isLoading: loadingSellers,
    refetch: refetchSellers,
  } = useGetSellersReportQuery(params);
  const {
    data: kpis = [],
    isLoading: loadingKpis,
    refetch: refetchKpis,
  } = useGetKpisQuery();

  const [refreshKpi, { isLoading: refreshing }] = useRefreshKpiMutation();

  useRealtimeRefetch(
    ["reports-updated", "order-updated", "visit-updated", "kpi-updated"],
    () => {
      refetchSales();
      refetchOrders();
      refetchVisits();
      refetchSellers();
      refetchKpis();
    },
  );

  const reportOverview = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );
    const totalOrders = orders.reduce(
      (sum, item) => sum + item.totalOrders,
      0,
    );
    const totalVisits = visits.reduce(
      (sum, item) => sum + item.totalVisits,
      0,
    );
    const deliveredOrders =
      orders.find((item) => item._id === "delivered")?.totalOrders || 0;
    const completionRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    const salesChartData = [...sales]
      .sort((first, second) => first._id.day - second._id.day)
      .map((item) => ({
        date: `${item._id.day}/${item._id.month}`,
        revenue: item.totalRevenue,
        orders: item.totalOrders,
      }));

    const sellerRevenueChartData = sellers.slice(0, 8).map((item) => ({
      seller: item.seller?.fullName || "-",
      revenue: item.totalRevenue,
      orders: item.totalOrders,
    }));

    return {
      totalRevenue,
      totalOrders,
      totalVisits,
      deliveredOrders,
      completionRate,
      salesChartData,
      sellerRevenueChartData,
    };
  }, [orders, sales, sellers, visits]);

  const handleRefreshKpi = async (id: string) => {
    try {
      await refreshKpi(id).unwrap();
      message.success("Cập nhật KPI thành công");
    } catch {
      message.error("Cập nhật KPI thất bại");
    }
  };

  const statCards: ReportStatCardProps[] = [
    {
      label: "Doanh thu tháng",
      value: reportOverview.totalRevenue,
      formatter: money,
      caption: `${reportOverview.deliveredOrders.toLocaleString("vi-VN")} đơn đã giao`,
      icon: <DollarOutlined />,
      toneKey: "emerald",
      loading: loadingSales,
    },
    {
      label: "Tổng đơn hàng",
      value: reportOverview.totalOrders,
      caption: `${reportOverview.completionRate}% đơn đã hoàn tất`,
      icon: <ShoppingCartOutlined />,
      toneKey: "blue",
      loading: loadingOrders,
    },
    {
      label: "Lượt ghé thăm",
      value: reportOverview.totalVisits,
      caption: "Hoạt động thị trường trong tháng",
      icon: <TeamOutlined />,
      toneKey: "amber",
      loading: loadingVisits,
    },
    {
      label: "Đơn đã giao",
      value: reportOverview.deliveredOrders,
      caption: "Đơn hoàn thành trong kỳ báo cáo",
      icon: <CheckCircleOutlined />,
      toneKey: "cyan",
      loading: loadingOrders,
    },
  ];

  const orderColumns: ColumnsType<OrdersReportItem> = [
    {
      title: "Trạng thái",
      dataIndex: "_id",
      width: 190,
      render: (status: OrdersReportItem["_id"]) => (
        <Tag color={orderStatusMap[status]?.color} className="admin-reports-status-tag">
          {orderStatusMap[status]?.label}
        </Tag>
      ),
    },
    {
      title: "Số đơn",
      dataIndex: "totalOrders",
      width: 120,
      align: "center",
      render: (value: number) => (
        <Text className="admin-reports-strong">
          {value.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Tổng giá trị",
      dataIndex: "totalValue",
      width: 180,
      align: "right",
      render: (value: number) => (
        <Text className="admin-reports-money">{money(value)}</Text>
      ),
    },
  ];

  const visitColumns: ColumnsType<VisitsReportItem> = [
    {
      title: "Seller",
      width: 220,
      render: (_, record) => (
        <div className="admin-reports-cell-copy">
          <Text className="admin-reports-strong">
            {record.seller?.fullName || "-"}
          </Text>
          <Text className="admin-reports-muted">
            {record.seller?.companyName || "Seller"}
          </Text>
        </div>
      ),
    },
    {
      title: "Email",
      width: 240,
      ellipsis: true,
      render: (_, record) => record.seller?.email || "-",
    },
    {
      title: "Số lượt ghé",
      dataIndex: "totalVisits",
      width: 130,
      align: "center",
      render: (value: number) => (
        <Tag color="blue" className="admin-reports-number-tag">
          {value.toLocaleString("vi-VN")}
        </Tag>
      ),
    },
  ];

  const sellerColumns: ColumnsType<SellersReportItem> = [
    {
      title: "Seller",
      width: 250,
      render: (_, record) => (
        <div className="admin-reports-cell-copy">
          <Text className="admin-reports-strong">
            {record.seller?.fullName || "-"}
          </Text>
          <Text className="admin-reports-muted">
            {record.seller?.companyName || "Seller"}
          </Text>
        </div>
      ),
    },
    {
      title: "Email",
      width: 260,
      ellipsis: true,
      render: (_, record) => record.seller?.email || "-",
    },
    {
      title: "Đơn đã giao",
      dataIndex: "totalOrders",
      width: 150,
      align: "center",
      render: (value: number) => (
        <Tag color="blue" className="admin-reports-number-tag">
          {value.toLocaleString("vi-VN")}
        </Tag>
      ),
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      width: 180,
      align: "right",
      render: (value: number) => (
        <Text className="admin-reports-money">{money(value)}</Text>
      ),
    },
  ];

  const kpiColumns: ColumnsType<Kpi> = [
    {
      title: "Seller",
      width: 230,
      render: (_, record) => (
        <div className="admin-reports-cell-copy">
          <Text className="admin-reports-strong">
            {record.seller?.fullName || "-"}
          </Text>
          <Text className="admin-reports-muted">
            {record.seller?.email || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Tháng",
      width: 110,
      align: "center",
      render: (_, record) => `${record.month}/${record.year}`,
    },
    {
      title: "Doanh thu",
      width: 260,
      render: (_, record) =>
        `${money(record.actualRevenue)} / ${money(record.targetRevenue)}`,
    },
    {
      title: "Đơn hàng",
      width: 170,
      align: "center",
      render: (_, record) =>
        `${record.actualOrders.toLocaleString("vi-VN")} / ${record.targetOrders.toLocaleString("vi-VN")}`,
    },
    {
      title: "Ghé thăm",
      width: 170,
      align: "center",
      render: (_, record) =>
        `${record.actualVisits.toLocaleString("vi-VN")} / ${record.targetVisits.toLocaleString("vi-VN")}`,
    },
    {
      title: "Hiệu suất",
      dataIndex: "performanceRate",
      width: 140,
      align: "center",
      render: (value: number) => (
        <Tag
          color={value >= 100 ? "green" : value >= 70 ? "blue" : "orange"}
          className="admin-reports-number-tag"
        >
          {value}%
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={() => handleRefreshKpi(record._id)}
          className="admin-reports-action-button"
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Báo cáo tổng quan"
        description={`Thống kê doanh thu, đơn hàng, ghé thăm và KPI trong tháng ${params.month}/${params.year}.`}
      />

      <section className="admin-reports-shell">
        <div className="admin-reports-hero">
          <div>
            <Tag className="admin-reports-hero-tag">Reporting Center</Tag>
            <Title level={2} className="admin-reports-hero-title">
              Tổng quan tháng {params.month}/{params.year}
            </Title>
            <Text className="admin-reports-hero-desc">
              Theo dõi doanh thu, trạng thái đơn hàng, hiệu suất seller và KPI
              trong cùng một màn hình phân tích.
            </Text>
          </div>

          <div className="admin-reports-hero-panel">
            <RiseOutlined />
            <span>Tỷ lệ hoàn tất đơn</span>
            <strong>{reportOverview.completionRate}%</strong>
            <Text>
              {reportOverview.deliveredOrders.toLocaleString("vi-VN")} /{" "}
              {reportOverview.totalOrders.toLocaleString("vi-VN")} đơn đã giao
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {statCards.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.label}>
              <ReportStatCard {...item} />
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} className="admin-reports-row">
          <Col xs={24} xl={14}>
            <Card
              variant="borderless"
              className="admin-reports-panel"
              loading={loadingSales}
              title={
                <Flex align="center" justify="space-between" gap={14} wrap="wrap">
                  <div>
                    <Text className="admin-reports-panel-title">
                      Doanh thu theo ngày
                    </Text>
                    <Text className="admin-reports-panel-desc">
                      Biến động doanh thu trong tháng hiện tại
                    </Text>
                  </div>
                  <Tag color="green" className="admin-reports-result-tag">
                    {money(reportOverview.totalRevenue)}
                  </Tag>
                </Flex>
              }
            >
              {reportOverview.salesChartData.length === 0 ? (
                <Empty description="Chưa có dữ liệu doanh thu" />
              ) : (
                <Line
                  height={300}
                  data={reportOverview.salesChartData}
                  xField="date"
                  yField="revenue"
                  shapeField="smooth"
                  colorField={() => "#2563eb"}
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

          <Col xs={24} xl={10}>
            <Card
              variant="borderless"
              className="admin-reports-panel"
              loading={loadingSellers}
              title={
                <Flex align="center" justify="space-between" gap={14} wrap="wrap">
                  <div>
                    <Text className="admin-reports-panel-title">
                      Top seller doanh thu
                    </Text>
                    <Text className="admin-reports-panel-desc">
                      Xếp hạng seller theo doanh thu tháng
                    </Text>
                  </div>
                  <Tag color="blue" className="admin-reports-result-tag">
                    Top 8
                  </Tag>
                </Flex>
              }
            >
              {reportOverview.sellerRevenueChartData.length === 0 ? (
                <Empty description="Chưa có dữ liệu seller" />
              ) : (
                <Column
                  height={300}
                  data={reportOverview.sellerRevenueChartData}
                  xField="seller"
                  yField="revenue"
                  colorField={() => "#0ea5e9"}
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

        <Row gutter={[16, 16]} className="admin-reports-row">
          <Col xs={24} xl={12}>
            <Card
              variant="borderless"
              className="admin-reports-panel"
              title={
                <div>
                  <Text className="admin-reports-panel-title">
                    Trạng thái đơn hàng
                  </Text>
                  <Text className="admin-reports-panel-desc">
                    Tổng số đơn và giá trị theo từng trạng thái
                  </Text>
                </div>
              }
            >
              <Table<OrdersReportItem>
                rowKey="_id"
                loading={loadingOrders}
                dataSource={orders}
                columns={orderColumns}
                pagination={false}
                scroll={{ x: 540 }}
                className="admin-reports-table"
                locale={{
                  emptyText: <Empty description="Chưa có dữ liệu đơn hàng" />,
                }}
              />
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              variant="borderless"
              className="admin-reports-panel"
              title={
                <div>
                  <Text className="admin-reports-panel-title">
                    Ghé thăm theo seller
                  </Text>
                  <Text className="admin-reports-panel-desc">
                    Hoạt động chăm sóc thị trường của đội bán hàng
                  </Text>
                </div>
              }
            >
              <Table<VisitsReportItem>
                rowKey="_id"
                loading={loadingVisits}
                dataSource={visits}
                columns={visitColumns}
                pagination={false}
                scroll={{ x: 620 }}
                className="admin-reports-table"
                locale={{
                  emptyText: <Empty description="Chưa có dữ liệu ghé thăm" />,
                }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          variant="borderless"
          className="admin-reports-panel admin-reports-row"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-reports-panel-title">
                  Doanh thu theo seller
                </Text>
                <Text className="admin-reports-panel-desc">
                  Tổng hợp số đơn đã giao và doanh thu theo từng seller
                </Text>
              </div>
              <Tag color="cyan" className="admin-reports-result-tag">
                Seller revenue
              </Tag>
            </Flex>
          }
        >
          <Table<SellersReportItem>
            rowKey="_id"
            loading={loadingSellers}
            dataSource={sellers}
            columns={sellerColumns}
            scroll={{ x: 840 }}
            className="admin-reports-table"
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              pageSizeOptions: [8, 12, 20, 50],
              showTotal: (total) => `Tổng ${total} seller`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có dữ liệu doanh thu seller" />,
            }}
          />
        </Card>

        <Card
          variant="borderless"
          className="admin-reports-panel admin-reports-row"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-reports-panel-title">KPI seller</Text>
                <Text className="admin-reports-panel-desc">
                  Theo dõi mức hoàn thành doanh thu, đơn hàng và lượt ghé thăm.
                </Text>
              </div>
              <Flex align="center" justify="center" className="admin-reports-kpi-icon">
                <BarChartOutlined />
              </Flex>
            </Flex>
          }
        >
          <Table<Kpi>
            rowKey="_id"
            loading={loadingKpis || refreshing}
            dataSource={kpis}
            columns={kpiColumns}
            scroll={{ x: 1240 }}
            className="admin-reports-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} KPI`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có dữ liệu KPI" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-reports-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-reports-hero {
          min-height: 230px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 250px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.22), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-reports-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-reports-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-reports-hero-desc.ant-typography {
          display: block;
          max-width: 720px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-reports-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-reports-hero-panel .anticon {
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

        .admin-reports-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-reports-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-reports-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-reports-row {
          margin-top: 16px;
        }

        .admin-reports-stat-card,
        .admin-reports-panel {
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

        .admin-reports-stat-card:hover,
        .admin-reports-panel:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-reports-stat-card {
          position: relative;
        }

        .admin-reports-stat-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: var(--report-stat-accent);
        }

        .admin-reports-stat-card .ant-card-body {
          min-height: 154px;
          padding: 19px 20px 17px !important;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .admin-reports-stat-label,
        .admin-reports-stat-caption {
          display: block;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
          line-height: 1.45;
        }

        .admin-reports-stat-caption {
          margin-top: 10px;
          font-weight: 700;
        }

        .admin-reports-stat-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border: 1px solid var(--report-stat-border);
          border-radius: 8px;
          color: var(--report-stat-accent);
          font-size: 22px;
          background: var(--report-stat-soft);
        }

        .admin-reports-panel .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-reports-panel .ant-card-body {
          padding: 18px !important;
        }

        .admin-reports-panel-title,
        .admin-reports-panel-desc {
          display: block;
        }

        .admin-reports-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-reports-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-reports-result-tag,
        .admin-reports-status-tag,
        .admin-reports-number-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-reports-status-tag {
          min-width: 128px;
        }

        .admin-reports-number-tag {
          min-width: 70px;
        }

        .admin-reports-table .ant-table,
        .admin-reports-table .ant-table-container,
        .admin-reports-table .ant-table-content,
        .admin-reports-table .ant-table-body,
        .admin-reports-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-reports-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-reports-table .ant-table-thead > tr > th {
          height: 56px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-reports-table .ant-table-tbody > tr > td {
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-reports-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-reports-table .ant-table-cell-fix-right,
        .admin-reports-table .ant-table-cell-fix-right-first,
        .admin-reports-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-reports-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-reports-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
          background: #f8fbff !important;
        }

        .admin-reports-cell-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-reports-strong,
        .admin-reports-money {
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
        }

        .admin-reports-money {
          white-space: nowrap;
        }

        .admin-reports-muted {
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-reports-action-button {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700;
        }

        .admin-reports-kpi-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 20px;
          background: #eff6ff;
        }

        @media (max-width: 1199px) {
          .admin-reports-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .admin-reports-hero {
            padding: 20px;
          }

          .admin-reports-hero-title.ant-typography {
            font-size: 26px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-reports-stat-card,
          .admin-reports-panel {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
