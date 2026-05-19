"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyKpisQuery } from "@/features/reports/reportService";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

type KpiItem = {
  key: string;
  name: string;
  target: number;
  actual: number;
  unit: "money" | "count";
  suffix: string;
};

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

const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const getPercent = (actual: number, target: number) => {
  if (!target) return 0;
  return Math.min(Math.round((actual / target) * 100), 100);
};

const getPerformanceLabel = (performanceRate: number) => {
  if (performanceRate >= 100) {
    return {
      text: "Xuất sắc",
      color: "green",
      description: "Bạn đã hoàn thành vượt hoặc đạt đầy đủ chỉ tiêu KPI.",
    };
  }

  if (performanceRate >= 70) {
    return {
      text: "Tốt",
      color: "blue",
      description: "Tiến độ KPI đang khả quan, tiếp tục duy trì nhịp bán hàng.",
    };
  }

  return {
    text: "Cần cố gắng",
    color: "gold",
    description: "KPI vẫn còn khoảng cách, nên ưu tiên doanh thu và lượt ghé.",
  };
};

export default function SellerKpisPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: kpis = [], isLoading, refetch } = useGetMyKpisQuery();

  useRealtimeRefetch(["kpi-updated", "reports-updated"], refetch);

  const currentKpi = useMemo(() => {
    return kpis.find((item) => item.month === month && item.year === year);
  }, [kpis, month, year]);

  const kpiItems: KpiItem[] = currentKpi
    ? [
        {
          key: "revenue",
          name: "Doanh thu",
          target: currentKpi.targetRevenue,
          actual: currentKpi.actualRevenue,
          unit: "money",
          suffix: "đ",
        },
        {
          key: "orders",
          name: "Đơn hàng",
          target: currentKpi.targetOrders,
          actual: currentKpi.actualOrders,
          unit: "count",
          suffix: "đơn",
        },
        {
          key: "visits",
          name: "Ghé thăm",
          target: currentKpi.targetVisits,
          actual: currentKpi.actualVisits,
          unit: "count",
          suffix: "lượt",
        },
      ]
    : [];

  const performanceRate = currentKpi?.performanceRate ?? 0;
  const performancePercent = Math.min(Math.round(performanceRate), 100);
  const performance = getPerformanceLabel(performanceRate);
  const revenuePercent = currentKpi
    ? getPercent(currentKpi.actualRevenue, currentKpi.targetRevenue)
    : 0;
  const orderPercent = currentKpi
    ? getPercent(currentKpi.actualOrders, currentKpi.targetOrders)
    : 0;
  const visitPercent = currentKpi
    ? getPercent(currentKpi.actualVisits, currentKpi.targetVisits)
    : 0;

  const columns: ColumnsType<KpiItem> = [
    {
      title: "KPI",
      dataIndex: "name",
      width: 180,
      render: (value: string) => (
        <Text strong className="seller-kpi-table-strong">
          {value}
        </Text>
      ),
    },
    {
      title: "Mục tiêu",
      dataIndex: "target",
      align: "right",
      width: 180,
      render: (value: number, record) => (
        <Text className="seller-kpi-table-muted">
          {record.unit === "money"
            ? formatMoney(value)
            : `${value.toLocaleString("vi-VN")} ${record.suffix}`}
        </Text>
      ),
    },
    {
      title: "Thực đạt",
      dataIndex: "actual",
      align: "right",
      width: 180,
      render: (value: number, record) => (
        <Text strong className="seller-kpi-table-money">
          {record.unit === "money"
            ? formatMoney(value)
            : `${value.toLocaleString("vi-VN")} ${record.suffix}`}
        </Text>
      ),
    },
    {
      title: "Tiến độ",
      align: "center",
      width: 320,
      render: (_, record) => {
        const percent = getPercent(record.actual, record.target);
        const isCompleted = percent >= 100;
        const isGood = percent >= 70;

        return (
          <Flex vertical gap={8}>
            <Progress
              percent={percent}
              strokeColor={COLORS.primary}
              trailColor="#D9EEE9"
              status={isCompleted ? "success" : "active"}
            />
            <Flex justify="center">
              <Tag
                color={isCompleted ? "green" : isGood ? "blue" : "gold"}
                className="seller-kpi-status-tag"
              >
                {isCompleted ? "Hoàn thành" : "Đang thực hiện"}
              </Tag>
            </Flex>
          </Flex>
        );
      },
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="KPI cá nhân"
        description="Theo dõi KPI doanh thu, đơn hàng và lượt ghé thăm theo chỉ tiêu admin giao."
        extra={
          <Flex gap={10} wrap="wrap">
            <Select
              size="large"
              value={month}
              className="seller-kpi-filter"
              onChange={setMonth}
              options={Array.from({ length: 12 }, (_, index) => ({
                label: `Tháng ${index + 1}`,
                value: index + 1,
              }))}
            />
            <Select
              size="large"
              value={year}
              className="seller-kpi-filter-year"
              onChange={setYear}
              options={[year - 1, year, year + 1].map((item) => ({
                label: String(item),
                value: item,
              }))}
            />
          </Flex>
        }
      />

      {!currentKpi && !isLoading ? (
        <Card variant="borderless" className="seller-kpi-empty-card">
          <Empty description="Admin chưa thiết lập KPI cho tháng này" />
        </Card>
      ) : (
        <Flex className="seller-kpi-stack" vertical gap={20}>
          <Card
            variant="borderless"
            className="seller-kpi-command-card"
            styles={{ body: { padding: 0 } }}
          >
            <Row gutter={0}>
              <Col xs={24} lg={9}>
                <div className="seller-kpi-command-dark">
                  <Text className="seller-kpi-command-eyebrow">
                    KPI performance
                  </Text>
                  <div className="seller-kpi-command-title">
                    Nắm nhanh chỉ tiêu tháng
                  </div>
                  <Text className="seller-kpi-command-description">
                    Theo dõi doanh thu, đơn hàng và lượt ghé để điều chỉnh nhịp
                    bán hàng trong kỳ KPI đang chọn.
                  </Text>
                  <div className="seller-kpi-dark-meter">
                    <span>{performancePercent}%</span>
                    <label>{performance.text}</label>
                  </div>
                </div>
              </Col>

              <Col xs={24} lg={15}>
                <div className="seller-kpi-command-summary">
                  <div className="seller-kpi-command-content">
                    <div>
                      <Flex gap={14} wrap="wrap">
                        <div className="seller-kpi-command-stat">
                          <span>
                            {formatMoney(currentKpi?.actualRevenue || 0)}
                          </span>
                          <label>Doanh thu</label>
                        </div>
                        <div className="seller-kpi-command-stat">
                          <span>{currentKpi?.actualOrders || 0}</span>
                          <label>Đơn hàng</label>
                        </div>
                        <div className="seller-kpi-command-stat">
                          <span>{currentKpi?.actualVisits || 0}</span>
                          <label>Ghé thăm</label>
                        </div>
                      </Flex>

                      <div className="seller-kpi-progress-block">
                        <Flex justify="space-between" align="center" gap={12}>
                          <Text className="seller-kpi-progress-label">
                            Hoàn thành tổng
                          </Text>
                          <Text className="seller-kpi-progress-value">
                            {performancePercent}%
                          </Text>
                        </Flex>
                        <Progress
                          percent={performancePercent}
                          strokeColor={COLORS.primary}
                          trailColor="#D9EEE9"
                          showInfo={false}
                        />
                      </div>
                    </div>

                    <div className="seller-kpi-review-card">
                      <Text className="seller-kpi-review-label">
                        Đánh giá nhanh
                      </Text>
                      <Text className="seller-kpi-review-title">
                        {performance.text}
                      </Text>
                      <Text className="seller-kpi-review-description">
                        {performance.description}
                      </Text>
                      <Tag
                        icon={<ClockCircleOutlined />}
                        color={performance.color}
                        className="seller-kpi-status-tag"
                      >
                        KPI tháng {month}/{year}
                      </Tag>
                    </div>
                  </div>

                  <div className="seller-kpi-status-grid">
                    <div>
                      <ShoppingCartOutlined />
                      <span>Doanh thu</span>
                      <strong>{revenuePercent}%</strong>
                    </div>
                    <div>
                      <CheckCircleOutlined />
                      <span>Đơn hàng</span>
                      <strong>{orderPercent}%</strong>
                    </div>
                    <div>
                      <AimOutlined />
                      <span>Ghé thăm</span>
                      <strong>{visitPercent}%</strong>
                    </div>
                    <div>
                      <RiseOutlined />
                      <span>Tổng hợp</span>
                      <strong>{performancePercent}%</strong>
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
                <Text strong className="seller-kpi-section-title">
                  Chi tiết KPI tháng
                </Text>
                <Text className="seller-kpi-section-description">
                  So sánh mục tiêu và kết quả thực đạt theo từng nhóm chỉ tiêu.
                </Text>
              </Flex>
            }
            className="seller-kpi-section-card"
          >
            <Table
              className="seller-kpi-table"
              rowKey="key"
              loading={isLoading}
              columns={columns}
              dataSource={kpiItems}
              pagination={false}
              scroll={{ x: 900 }}
              locale={{
                emptyText: <Empty description="Chưa có dữ liệu KPI" />,
              }}
            />
          </Card>
        </Flex>
      )}

      <style jsx global>{`
        .seller-kpi-filter {
          width: 132px;
        }

        .seller-kpi-filter-year {
          width: 124px;
        }

        .seller-kpi-empty-card,
        .seller-kpi-command-card,
        .seller-kpi-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-kpi-empty-card .ant-card-body {
          padding: 34px;
        }

        .seller-kpi-stack {
          position: relative;
        }

        .seller-kpi-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 208px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-kpi-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-kpi-command-dark {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-kpi-command-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .seller-kpi-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
        }

        .seller-kpi-command-description {
          display: block;
          max-width: 430px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-kpi-dark-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .seller-kpi-dark-meter span {
          display: block;
          color: #ffffff;
          font-size: 28px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-kpi-dark-meter label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 750;
        }

        .seller-kpi-command-summary {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .seller-kpi-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .seller-kpi-command-stat {
          min-width: 128px;
          flex: 1 1 128px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-kpi-command-stat span {
          display: block;
          color: ${COLORS.text};
          font-size: 22px;
          font-weight: 850;
          line-height: 1.15;
        }

        .seller-kpi-command-stat label,
        .seller-kpi-progress-label,
        .seller-kpi-progress-value,
        .seller-kpi-review-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.45;
        }

        .seller-kpi-progress-block,
        .seller-kpi-review-card,
        .seller-kpi-status-grid > div {
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-kpi-progress-block {
          margin-top: 18px;
          padding: 14px 15px;
          background: #ffffff;
        }

        .seller-kpi-review-card {
          min-height: 152px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .seller-kpi-review-label {
          color: ${COLORS.primaryHover};
          font-size: 12px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .seller-kpi-review-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
        }

        .seller-kpi-status-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-kpi-status-grid > div {
          min-height: 76px;
          padding: 12px;
          display: grid;
          gap: 4px;
        }

        .seller-kpi-status-grid .anticon {
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-kpi-status-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
        }

        .seller-kpi-status-grid strong {
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
        }

        .seller-kpi-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-kpi-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-kpi-section-title,
        .seller-kpi-table-strong {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-kpi-section-description,
        .seller-kpi-table-muted {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-kpi-table-money {
          color: ${COLORS.primaryHover};
          font-size: 14px;
          font-weight: 850;
        }

        .seller-kpi-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
        }

        .seller-kpi-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-kpi-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-kpi-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-kpi-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }

        @media (max-width: 900px) {
          .seller-kpi-command-content,
          .seller-kpi-status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
