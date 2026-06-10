"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Button, Empty, Flex, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMyVisitsQuery } from "@/features/visits/visitService";
import type { Visit, VisitStatus } from "@/features/visits/visitTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

const statusMap: Record<VisitStatus, { label: string; color: string; icon: ReactNode }> = {
  checked_in: { label: "Đang ghé thăm", color: "processing", icon: <ClockCircleOutlined /> },
  checked_out: { label: "Hoàn thành", color: "success", icon: <CheckCircleOutlined /> },
};

const getName = (value: Visit["seller"] | Visit["customer"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

export default function DistributorVisitsPage() {
  const { data = [], isLoading, refetch } = useGetMyVisitsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(["new-notification", "visit-updated"], refetch);

  const stats = useMemo(
    () => ({
      total: data.length,
      active: data.filter((item) => item.status === "checked_in").length,
      completed: data.filter((item) => item.status === "checked_out").length,
    }),
    [data],
  );

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const latestVisit = useMemo(() => {
    if (!data.length) return undefined;
    return [...data].sort(
      (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime(),
    )[0];
  }, [data]);

  const columns: ColumnsType<Visit> = [
    {
      title: "Khách hàng",
      dataIndex: "customer",
      ellipsis: true,
      width: 260,
      render: (value: Visit["customer"]) => (
        <Flex align="center" gap={12}>
          <div className="distributor-table-mark">
            <ShopOutlined />
          </div>
          <Text strong ellipsis className="distributor-row-strong">
            {getName(value)}
          </Text>
        </Flex>
      ),
    },
    {
      title: "DSR",
      dataIndex: "seller",
      ellipsis: true,
      width: 180,
      render: (value) => <Text className="distributor-row-muted">{getName(value)}</Text>,
    },
    {
      title: "Check-in",
      dataIndex: "checkInTime",
      width: 190,
      render: (value: string) => (
        <Text className="distributor-row-muted">
          {new Date(value).toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Khoảng cách",
      dataIndex: "checkInDistance",
      align: "center",
      width: 140,
      render: (value?: number) => (
        <Tag color={value !== undefined ? "blue" : "default"} className="distributor-pill-tag">
          {value !== undefined ? `${Math.round(value)} m` : "-"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 180,
      render: (status: VisitStatus) => {
        const item = statusMap[status] ?? statusMap.checked_in;
        return (
          <Tag color={item.color} icon={item.icon} className="distributor-pill-tag">
            {item.label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Link href={`/distributor/visits/${record._id}`}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            className="distributor-row-action distributor-row-action-view"
          >
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Ghé thăm"
      title="Lượt ghé của đội DSR"
      description="Theo dõi check-in, check-out và khoảng cách GPS để nắm chất lượng thực thi tại điểm bán."
    >
      <DistributorCommandCenter
        eyebrow="Visit tracking"
        title="Theo dõi lượt ghé thực địa"
        description="Kiểm soát check-in, check-out, khoảng cách GPS và trạng thái từng lượt ghé khách hàng."
        meterValue={`${completionRate}%`}
        meterLabel="Lượt ghé đã hoàn thành"
        stats={[
          { label: "Tổng lượt ghé", value: stats.total },
          { label: "Đang check-in", value: stats.active },
          { label: "Tỷ lệ hoàn thành", value: `${completionRate}%` },
        ]}
        progressLabel="Hoàn thành lượt ghé"
        progressValue={`${stats.completed}/${stats.total}`}
        progressPercent={completionRate}
        feature={
          latestVisit ? (
            <>
              <Text className="distributor-command-feature-label">Lượt ghé gần nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {getName(latestVisit.customer)}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{getName(latestVisit.seller)}</span>
                <span>{new Date(latestVisit.checkInTime).toLocaleString("vi-VN")}</span>
                <span>
                  {latestVisit.checkInDistance !== undefined
                    ? `${Math.round(latestVisit.checkInDistance)} m`
                    : "Chưa có khoảng cách"}
                </span>
              </div>
              <Tag color={statusMap[latestVisit.status].color} className="distributor-pill-tag">
                {statusMap[latestVisit.status].label}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có lượt ghé nào.
            </Text>
          )
        }
        statusItems={[
          { label: "Tổng lượt", value: stats.total, icon: <EnvironmentOutlined /> },
          { label: "Đang check-in", value: stats.active, icon: <ClockCircleOutlined /> },
          { label: "Hoàn thành", value: stats.completed, icon: <CheckCircleOutlined /> },
          { label: "Theo dõi GPS", value: data.filter((item) => item.checkInDistance !== undefined).length, icon: <AimOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Danh sách lịch sử ghé thăm"
        description="Xem thời gian, khoảng cách và trạng thái từng lượt ghé khách."
      >
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1120 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} lượt ghé thăm`,
          }}
          locale={{ emptyText: <Empty description="Chưa có lượt ghé thăm nào" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}





