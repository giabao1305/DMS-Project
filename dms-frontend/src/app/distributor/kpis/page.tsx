"use client";

import {
  AimOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Empty, Progress, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMyKpisQuery } from "@/features/reports/reportService";
import type { Kpi } from "@/features/reports/reportTypes";

const { Text } = Typography;
const money = new Intl.NumberFormat("vi-VN");

export default function DistributorKpisPage() {
  const { data = [], isLoading } = useGetMyKpisQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const stats = useMemo(() => {
    const averagePerformance = data.length
      ? Math.round(
          data.reduce((sum, kpi) => sum + (kpi.performanceRate || 0), 0) /
            data.length,
        )
      : 0;
    const actualRevenue = data.reduce((sum, kpi) => sum + kpi.actualRevenue, 0);
    const targetRevenue = data.reduce((sum, kpi) => sum + kpi.targetRevenue, 0);
    const actualOrders = data.reduce((sum, kpi) => sum + kpi.actualOrders, 0);
    const actualVisits = data.reduce((sum, kpi) => sum + kpi.actualVisits, 0);
    const achieved = data.filter((kpi) => kpi.performanceRate >= 100).length;

    return {
      total: data.length,
      averagePerformance,
      actualRevenue,
      targetRevenue,
      actualOrders,
      actualVisits,
      achieved,
    };
  }, [data]);

  const topKpi = useMemo(() => {
    if (!data.length) return undefined;
    return [...data].sort((a, b) => b.performanceRate - a.performanceRate)[0];
  }, [data]);

  const columns: ColumnsType<Kpi> = [
    {
      title: "DSR",
      dataIndex: "seller",
      ellipsis: true,
      render: (seller: Kpi["seller"]) => (
        <Text strong className="distributor-row-strong">
          {seller?.fullName || seller?.email || "-"}
        </Text>
      ),
    },
    { title: "Kỳ", width: 110, render: (_, record) => `${record.month}/${record.year}` },
    {
      title: "Doanh thu",
      width: 240,
      render: (_, record) => (
        <Text className="distributor-dashboard-money">
          {money.format(record.actualRevenue)} / {money.format(record.targetRevenue)} đ
        </Text>
      ),
    },
    {
      title: "Đơn hàng",
      width: 140,
      render: (_, record) => `${record.actualOrders} / ${record.targetOrders}`,
    },
    {
      title: "Ghé thăm",
      width: 140,
      render: (_, record) => `${record.actualVisits} / ${record.targetVisits}`,
    },
    {
      title: "Hiệu suất",
      dataIndex: "performanceRate",
      width: 210,
      render: (value: number) => (
        <Progress percent={Math.round(value || 0)} size="small" />
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="KPI"
      title="KPI đội DSR"
      description="Theo dõi mục tiêu, doanh thu, đơn hàng và lượt ghé để phát hiện DSR cần hỗ trợ."
    >
      <DistributorCommandCenter
        eyebrow="Performance center"
        title="Nắm hiệu suất đội DSR"
        description="Tổng hợp mức đạt mục tiêu, doanh thu, đơn hàng và lượt ghé theo từng DSR."
        meterValue={`${stats.averagePerformance}%`}
        meterLabel="Hiệu suất trung bình"
        stats={[
          { label: "KPI đang theo dõi", value: stats.total },
          { label: "Đạt mục tiêu", value: stats.achieved },
          { label: "Đơn hàng", value: stats.actualOrders },
        ]}
        progressLabel="Hiệu suất trung bình"
        progressValue={`${stats.averagePerformance}%`}
        progressPercent={stats.averagePerformance}
        feature={
          topKpi ? (
            <>
              <Text className="distributor-command-feature-label">DSR tốt nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {topKpi.seller?.fullName || topKpi.seller?.email || "-"}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{topKpi.month}/{topKpi.year}</span>
                <span>{Math.round(topKpi.performanceRate)}%</span>
                <span>{money.format(topKpi.actualRevenue)} đ</span>
              </div>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có KPI để theo dõi.
            </Text>
          )
        }
        statusItems={[
          { label: "Doanh thu", value: `${money.format(stats.actualRevenue)} đ`, icon: <DollarOutlined /> },
          { label: "Mục tiêu", value: `${money.format(stats.targetRevenue)} đ`, icon: <TrophyOutlined /> },
          { label: "Đơn hàng", value: stats.actualOrders, icon: <ShoppingCartOutlined /> },
          { label: "Ghé thăm", value: stats.actualVisits, icon: <AimOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Bảng KPI"
        description="Hiệu suất được tính theo dữ liệu thực tế so với mục tiêu từng kỳ."
      >
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 980 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} KPI`,
          }}
          locale={{ emptyText: <Empty description="Chưa có KPI" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}
