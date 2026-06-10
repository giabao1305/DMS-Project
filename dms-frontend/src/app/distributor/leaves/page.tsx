"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Button, Empty, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMyLeavesQuery } from "@/features/leaves/leaveService";
import type { LeaveRequest, LeaveStatus } from "@/features/leaves/leaveTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

const statusMap: Record<LeaveStatus, { label: string; color: string; icon: ReactNode }> = {
  pending: { label: "Chờ duyệt", color: "gold", icon: <ClockCircleOutlined /> },
  approved: { label: "Đã duyệt", color: "blue", icon: <CheckCircleOutlined /> },
  rejected: { label: "Từ chối", color: "red", icon: <CloseCircleOutlined /> },
};

const getSeller = (seller: LeaveRequest["seller"]) => {
  if (!seller) return "-";
  if (typeof seller === "string") return /^[a-f\d]{24}$/i.test(seller) ? "-" : seller;
  return seller.fullName || seller.email || "-";
};

export default function DistributorLeavesPage() {
  const { data = [], isLoading, refetch } = useGetMyLeavesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(["new-notification", "leave-updated"], refetch);

  const stats = useMemo(
    () => ({
      total: data.length,
      pending: data.filter((item) => item.status === "pending").length,
      approved: data.filter((item) => item.status === "approved").length,
      rejected: data.filter((item) => item.status === "rejected").length,
    }),
    [data],
  );

  const approvedRate = stats.total
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;
  const latestLeave = data[0];

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: "DSR",
      dataIndex: "seller",
      ellipsis: true,
      width: 220,
      render: (seller) => (
        <Text strong className="distributor-row-strong">
          {getSeller(seller)}
        </Text>
      ),
    },
    {
      title: "Thời gian nghỉ",
      width: 230,
      render: (_, record) => (
        <Text className="distributor-row-muted">
          {new Date(record.startDate).toLocaleDateString("vi-VN")} -{" "}
          {new Date(record.endDate).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    { title: "Lý do", dataIndex: "reason", ellipsis: true },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 150,
      render: (status: LeaveStatus) => {
        const item = statusMap[status];
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
        <Link href={`/distributor/leaves/${record._id}`}>
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
      eyebrow="Nghỉ phép"
      title="Lịch nghỉ của đội DSR"
      description="Theo dõi yêu cầu nghỉ phép để chủ động phân bổ tuyến, khách hàng và mục tiêu ngày."
    >
      <DistributorCommandCenter
        eyebrow="Leave planning"
        title="Theo dõi lịch nghỉ của đội"
        description="Nắm nhanh số đơn chờ duyệt và lịch nghỉ đã xác nhận để điều phối nhân sự ngoài thị trường."
        meterValue={`${approvedRate}%`}
        meterLabel="Đơn nghỉ đã duyệt"
        stats={[
          { label: "Tổng đơn", value: stats.total },
          { label: "Chờ duyệt", value: stats.pending },
          { label: "Đã duyệt", value: stats.approved },
        ]}
        progressLabel="Tỷ lệ đơn đã duyệt"
        progressValue={`${stats.approved}/${stats.total}`}
        progressPercent={approvedRate}
        feature={
          latestLeave ? (
            <>
              <Text className="distributor-command-feature-label">Đơn gần nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {getSeller(latestLeave.seller)}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{new Date(latestLeave.startDate).toLocaleDateString("vi-VN")}</span>
                <span>{new Date(latestLeave.endDate).toLocaleDateString("vi-VN")}</span>
              </div>
              <Tag color={statusMap[latestLeave.status].color} className="distributor-pill-tag">
                {statusMap[latestLeave.status].label}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có đơn nghỉ phép.
            </Text>
          )
        }
        statusItems={[
          { label: "Tổng đơn", value: stats.total, icon: <CalendarOutlined /> },
          { label: "Chờ duyệt", value: stats.pending, icon: <ClockCircleOutlined /> },
          { label: "Đã duyệt", value: stats.approved, icon: <CheckCircleOutlined /> },
          { label: "Từ chối", value: stats.rejected, icon: <CloseCircleOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Danh sách đơn nghỉ"
        description="Distributor theo dõi và duyệt nghỉ phép của DSR trong đội."
      >
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} đơn nghỉ`,
          }}
          locale={{ emptyText: <Empty description="Chưa có đơn nghỉ phép" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}





