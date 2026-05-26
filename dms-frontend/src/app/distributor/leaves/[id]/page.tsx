"use client";

import { Descriptions, Tag } from "antd";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetLeaveByIdQuery } from "@/features/leaves/leaveService";
import type { LeaveRequest, LeaveStatus } from "@/features/leaves/leaveTypes";

const statusMap: Record<LeaveStatus, { color: string; text: string }> = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  rejected: { color: "red", text: "Từ chối" },
};

const getUser = (user: LeaveRequest["seller"] | LeaveRequest["approvedBy"]) => {
  if (!user) return "-";
  if (typeof user === "string") return /^[a-f\d]{24}$/i.test(user) ? "-" : user;
  return user.fullName || user.email || "-";
};

const getDays = (leave: LeaveRequest) =>
  Math.max(
    1,
    Math.ceil(
      (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
        86400000,
    ) + 1,
  );

export default function DistributorLeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: leave, isLoading } = useGetLeaveByIdQuery(id);

  if (isLoading) return <DistributorDetailLoading />;

  return (
    <DistributorDetailShell
      title="Chi tiết nghỉ phép"
      description="Xem lịch nghỉ, lý do và trạng thái phê duyệt của DSR."
      backHref="/distributor/leaves"
    >
      {!leave ? (
        <DistributorDetailEmpty description="Không tìm thấy đơn nghỉ phép" />
      ) : (
        <DistributorDetailCard
          title={getUser(leave.seller)}
          description={`${getDays(leave)} ngày nghỉ đã đăng ký.`}
          extra={
            <Tag color={statusMap[leave.status].color} className="distributor-pill-tag">
              {statusMap[leave.status].text}
            </Tag>
          }
        >
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="DSR">{getUser(leave.seller)}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {statusMap[leave.status].text}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {new Date(leave.startDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">
              {new Date(leave.endDate).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Số ngày nghỉ">{getDays(leave)}</Descriptions.Item>
            <Descriptions.Item label="Người duyệt">
              {getUser(leave.approvedBy)}
            </Descriptions.Item>
            <Descriptions.Item label="Lý do nghỉ" span={2}>
              {leave.reason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Phản hồi admin" span={2}>
              {leave.adminNote || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(leave.createdAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày duyệt">
              {leave.approvedAt
                ? new Date(leave.approvedAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        </DistributorDetailCard>
      )}
    </DistributorDetailShell>
  );
}
