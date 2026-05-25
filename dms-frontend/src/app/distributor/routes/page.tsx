"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Empty, Flex, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMyRoutesQuery } from "@/features/routes/routeService";
import type { Route, RouteStatus } from "@/features/routes/routeTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

const statusMap: Record<RouteStatus, { label: string; color: string; icon: ReactNode }> = {
  planned: { label: "Kế hoạch", color: "default", icon: <CalendarOutlined /> },
  in_progress: { label: "Đang đi tuyến", color: "processing", icon: <ClockCircleOutlined /> },
  completed: { label: "Hoàn thành", color: "success", icon: <CheckCircleOutlined /> },
  cancelled: { label: "Đã hủy", color: "error", icon: <StopOutlined /> },
};

const getSeller = (seller: Route["seller"]) => {
  if (!seller) return "-";
  if (typeof seller === "string") return /^[a-f\d]{24}$/i.test(seller) ? "-" : seller;
  return seller.fullName || seller.email || "-";
};

export default function DistributorRoutesPage() {
  const { data = [], isLoading, refetch } = useGetMyRoutesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(["new-notification", "route-updated"], refetch);

  const stats = useMemo(() => {
    const totalCustomers = data.reduce((sum, route) => sum + route.customers.length, 0);
    return {
      total: data.length,
      planned: data.filter((item) => item.status === "planned").length,
      progress: data.filter((item) => item.status === "in_progress").length,
      completed: data.filter((item) => item.status === "completed").length,
      cancelled: data.filter((item) => item.status === "cancelled").length,
      totalCustomers,
    };
  }, [data]);

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;
  const activeRate = stats.total
    ? Math.round(((stats.progress + stats.completed) / stats.total) * 100)
    : 0;

  const nextRoute = useMemo(() => {
    if (!data.length) return undefined;
    return [...data].sort(
      (a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime(),
    )[0];
  }, [data]);

  const columns: ColumnsType<Route> = [
    {
      title: "Tên tuyến",
      dataIndex: "name",
      ellipsis: true,
      width: 260,
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
      width: 190,
      render: (value) => <Text className="distributor-row-muted">{getSeller(value)}</Text>,
    },
    {
      title: "Ngày làm việc",
      dataIndex: "workDate",
      width: 160,
      render: (value: string) => (
        <Text className="distributor-row-muted">
          {new Date(value).toLocaleDateString("vi-VN")}
        </Text>
      ),
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
      width: 180,
      render: (status: RouteStatus) => {
        const item = statusMap[status] ?? statusMap.planned;
        return (
          <Tag color={item.color} icon={item.icon} className="distributor-pill-tag">
            {item.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Tuyến bán hàng"
      title="Tuyến của đội DSR"
      description="Theo dõi lịch đi tuyến, trạng thái thực thi và độ phủ điểm bán của từng DSR."
    >
      <DistributorCommandCenter
        eyebrow="Route execution"
        title="Nắm nhanh toàn bộ tuyến đội"
        description="Theo dõi ngày làm việc, lượng điểm bán cần ghé và trạng thái thực hiện để chủ động điều phối."
        meterValue={`${activeRate}%`}
        meterLabel="Tuyến đã bắt đầu hoặc hoàn thành"
        stats={[
          { label: "Tổng tuyến", value: stats.total },
          { label: "Điểm bán cần ghé", value: stats.totalCustomers },
          { label: "Tỷ lệ hoàn thành", value: `${completionRate}%` },
        ]}
        progressLabel="Hoàn thành tuyến"
        progressValue={`${stats.completed}/${stats.total}`}
        progressPercent={completionRate}
        feature={
          nextRoute ? (
            <>
              <Text className="distributor-command-feature-label">Tuyến gần nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {nextRoute.name}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{getSeller(nextRoute.seller)}</span>
                <span>{new Date(nextRoute.workDate).toLocaleDateString("vi-VN")}</span>
                <span>{nextRoute.customers.length} điểm bán</span>
              </div>
              <Tag color={statusMap[nextRoute.status].color} className="distributor-pill-tag">
                {statusMap[nextRoute.status].label}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có tuyến được phân công.
            </Text>
          )
        }
        statusItems={[
          { label: "Kế hoạch", value: stats.planned, icon: <CalendarOutlined /> },
          { label: "Đang đi", value: stats.progress, icon: <ClockCircleOutlined /> },
          { label: "Hoàn thành", value: stats.completed, icon: <CheckCircleOutlined /> },
          { label: "Đã hủy", value: stats.cancelled, icon: <StopOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Danh sách tuyến bán hàng"
        description="Theo dõi ngày làm việc, lượng điểm bán và trạng thái từng tuyến."
      >
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 960 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} tuyến bán hàng`,
          }}
          locale={{ emptyText: <Empty description="Chưa có tuyến bán hàng" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}
