"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Progress,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useGetKpisQuery,
  useRefreshKpiMutation,
} from "@/features/reports/reportService";
import type { Kpi } from "@/features/reports/reportTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const getPerformanceColor = (value: number) => {
  if (value >= 100) return "green";
  if (value >= 70) return "blue";
  return "orange";
};

export default function AdminKpisPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");

  const { data: kpis = [], isLoading, refetch } = useGetKpisQuery();
  const [refreshKpi, { isLoading: refreshing }] = useRefreshKpiMutation();

  useRealtimeRefetch(["kpi-updated", "reports-updated"], refetch);

  const overview = useMemo(() => {
    const achieved = kpis.filter((kpi) => kpi.performanceRate >= 100).length;
    const averagePerformance =
      kpis.length > 0
        ? Math.round(
            kpis.reduce((sum, kpi) => sum + kpi.performanceRate, 0) /
              kpis.length,
          )
        : 0;
    const totalTargetRevenue = kpis.reduce(
      (sum, kpi) => sum + kpi.targetRevenue,
      0,
    );
    const totalActualRevenue = kpis.reduce(
      (sum, kpi) => sum + kpi.actualRevenue,
      0,
    );

    return {
      total: kpis.length,
      achieved,
      averagePerformance,
      totalTargetRevenue,
      totalActualRevenue,
    };
  }, [kpis]);

  const filteredKpis = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return kpis.filter((kpi) => {
      const sellerName = kpi.seller?.fullName?.toLowerCase() || "";
      const sellerEmail = kpi.seller?.email?.toLowerCase() || "";

      return (
        normalizedKeyword.length === 0 ||
        sellerName.includes(normalizedKeyword) ||
        sellerEmail.includes(normalizedKeyword)
      );
    });
  }, [kpis, keyword]);

  const handleRefresh = async (id: string) => {
    try {
      await refreshKpi(id).unwrap();
      message.success("Cập nhật KPI thành công");
    } catch {
      message.error("Cập nhật KPI thất bại");
    }
  };

  const handleResetFilter = () => {
    setKeyword("");
  };

  const hasFilter = keyword.trim().length > 0;

  const columns: ColumnsType<Kpi> = [
    {
      title: "Seller",
      width: 240,
      ellipsis: true,
      render: (_, record) => (
        <div className="admin-kpis-cell-copy">
          <Text className="admin-kpis-strong">
            {record.seller?.fullName || "-"}
          </Text>
          <Text className="admin-kpis-muted">{record.seller?.email || "-"}</Text>
        </div>
      ),
    },
    {
      title: "Kỳ KPI",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Tag color="blue" className="admin-kpis-period-tag">
          {record.month}/{record.year}
        </Tag>
      ),
    },
    {
      title: "Doanh thu",
      width: 280,
      render: (_, record) => (
        <div className="admin-kpis-cell-copy">
          <Text className="admin-kpis-money">{money(record.actualRevenue)}</Text>
          <Text className="admin-kpis-muted">
            Mục tiêu {money(record.targetRevenue)}
          </Text>
        </div>
      ),
    },
    {
      title: "Đơn hàng",
      width: 170,
      align: "center",
      render: (_, record) => (
        <Text className="admin-kpis-strong">
          {record.actualOrders.toLocaleString("vi-VN")} /{" "}
          {record.targetOrders.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Ghé thăm",
      width: 170,
      align: "center",
      render: (_, record) => (
        <Text className="admin-kpis-strong">
          {record.actualVisits.toLocaleString("vi-VN")} /{" "}
          {record.targetVisits.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Hiệu suất",
      dataIndex: "performanceRate",
      width: 190,
      align: "center",
      render: (value: number) => (
        <div className="admin-kpis-performance">
          <Progress
            percent={value}
            size="small"
            strokeColor={
              value >= 100 ? "#10b981" : value >= 70 ? "#2563eb" : "#f59e0b"
            }
            trailColor="#e5e7eb"
            showInfo={false}
          />
          <Tag color={getPerformanceColor(value)} className="admin-kpis-status-tag">
            {value}%
          </Tag>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 240,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Flex justify="center" gap={8} wrap="wrap">
          <Link href={`/admin/kpis/${record._id}/edit`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              className="admin-kpis-action-button"
            >
              Sửa
            </Button>
          </Link>

          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={() => handleRefresh(record._id)}
            className="admin-kpis-action-button"
          >
            Cập nhật
          </Button>
        </Flex>
      ),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Quản lý KPI"
        description="Thiết lập và theo dõi KPI doanh thu, đơn hàng, lượt ghé thăm của seller."
        extra={
          <Link href="/admin/kpis/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo KPI
            </Button>
          </Link>
        }
      />

      <section className="admin-kpis-shell">
        <div className="admin-kpis-hero">
          <div>
            <Tag className="admin-kpis-hero-tag">KPI Control</Tag>
            <Title level={2} className="admin-kpis-hero-title">
              Hiệu suất đội bán hàng
            </Title>
            <Text className="admin-kpis-hero-desc">
              Theo dõi mục tiêu, kết quả thực tế và các seller cần hỗ trợ để đạt
              KPI theo từng kỳ.
            </Text>

            <div className="admin-kpis-hero-metrics">
              <div>
                <TeamOutlined />
                <span>KPI đang theo dõi</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <RiseOutlined />
                <span>Hiệu suất trung bình</span>
                <strong>{overview.averagePerformance}%</strong>
              </div>
              <div>
                <CheckCircleOutlined />
                <span>Đạt mục tiêu</span>
                <strong>{overview.achieved.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-kpis-hero-panel">
            <BarChartOutlined />
            <span>Doanh thu thực tế</span>
            <strong>{money(overview.totalActualRevenue)}</strong>
            <Text>Mục tiêu {money(overview.totalTargetRevenue)}</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-kpis-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-kpis-filter-title">
                Bộ lọc KPI
              </Title>
              <Text className="admin-kpis-filter-description">
                Tìm theo tên hoặc email seller để rà soát nhanh KPI cần xử lý.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-kpis-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm tên hoặc email seller"
                prefix={<SearchOutlined />}
                className="admin-kpis-search-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

              {hasFilter ? (
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilter}
                  className="admin-kpis-reset-button"
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-kpis-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-kpis-panel-title">Danh sách KPI</Text>
                <Text className="admin-kpis-panel-desc">
                  Hiển thị {filteredKpis.length.toLocaleString("vi-VN")} KPI
                </Text>
              </div>
              <Tag color="blue" className="admin-kpis-result-tag">
                Realtime KPI monitoring
              </Tag>
            </Flex>
          }
        >
          <Table<Kpi>
            rowKey="_id"
            loading={isLoading || refreshing}
            dataSource={filteredKpis}
            columns={columns}
            scroll={{ x: 1410 }}
            className="admin-kpis-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} KPI`,
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy KPI phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-kpis-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-kpis-hero {
          min-height: 230px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            radial-gradient(circle at 86% 18%, rgba(14, 165, 233, 0.26), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-kpis-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-kpis-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-kpis-hero-desc.ant-typography {
          display: block;
          max-width: 720px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-kpis-hero-metrics {
          margin-top: 24px;
          max-width: 800px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-kpis-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-kpis-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-kpis-hero-metrics .anticon {
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

        .admin-kpis-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-kpis-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-kpis-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-kpis-hero-panel .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #2563eb;
        }

        .admin-kpis-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-kpis-hero-panel strong {
          margin-top: 8px;
          overflow: hidden;
          color: #ffffff;
          font-size: 26px;
          font-weight: 900;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-kpis-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-kpis-stat-card,
        .admin-kpis-filter-card,
        .admin-kpis-table-card {
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

        .admin-kpis-stat-card:hover,
        .admin-kpis-filter-card:hover,
        .admin-kpis-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-kpis-stat-card {
          position: relative;
        }

        .admin-kpis-stat-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: var(--kpi-stat-accent);
        }

        .admin-kpis-stat-card .ant-card-body {
          min-height: 154px;
          padding: 19px 20px 17px !important;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .admin-kpis-stat-label,
        .admin-kpis-stat-caption {
          display: block;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
          line-height: 1.45;
        }

        .admin-kpis-stat-caption {
          margin-top: 10px;
          font-weight: 700;
        }

        .admin-kpis-stat-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border: 1px solid var(--kpi-stat-border);
          border-radius: 8px;
          color: var(--kpi-stat-accent);
          font-size: 22px;
          background: var(--kpi-stat-soft);
        }

        .admin-kpis-filter-card {
          margin-top: 16px;
          margin-bottom: 16px;
        }

        .admin-kpis-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-kpis-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-kpis-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-kpis-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-kpis-search-input,
        .admin-kpis-reset-button {
          border-radius: 8px !important;
        }

        .admin-kpis-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-kpis-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-kpis-panel-title,
        .admin-kpis-panel-desc {
          display: block;
        }

        .admin-kpis-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-kpis-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-kpis-result-tag,
        .admin-kpis-period-tag,
        .admin-kpis-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-kpis-status-tag {
          min-width: 68px;
        }

        .admin-kpis-table .ant-table,
        .admin-kpis-table .ant-table-container,
        .admin-kpis-table .ant-table-content,
        .admin-kpis-table .ant-table-body,
        .admin-kpis-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-kpis-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-kpis-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-kpis-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-kpis-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-kpis-table .ant-table-cell-fix-right,
        .admin-kpis-table .ant-table-cell-fix-right-first,
        .admin-kpis-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-kpis-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-kpis-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
          background: #f8fbff !important;
        }

        .admin-kpis-cell-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-kpis-strong,
        .admin-kpis-money {
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
        }

        .admin-kpis-money {
          white-space: nowrap;
        }

        .admin-kpis-muted {
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-kpis-performance {
          min-width: 130px;
          display: grid;
          grid-template-columns: minmax(70px, 1fr) auto;
          align-items: center;
          gap: 8px;
        }

        .admin-kpis-action-button,
        .admin-kpis-reset-button {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-kpis-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .admin-kpis-hero {
            padding: 20px;
          }

          .admin-kpis-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-kpis-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-kpis-hero-metrics > div {
            border-right: 0;
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-kpis-hero-metrics > div:last-child {
            border-bottom: 0;
          }

          .admin-kpis-filter-actions,
          .admin-kpis-search-input,
          .admin-kpis-reset-button {
            width: 100% !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-kpis-stat-card,
          .admin-kpis-filter-card,
          .admin-kpis-table-card {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
