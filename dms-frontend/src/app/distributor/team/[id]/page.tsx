"use client";

import { Descriptions, Tag } from "antd";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetSellerUsersQuery } from "@/features/users/userService";

export default function DistributorTeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: team = [], isLoading } = useGetSellerUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const user = team.find((item) => item._id === id);

  if (isLoading) return <DistributorDetailLoading />;

  return (
    <DistributorDetailShell
      title="Chi tiết DSR"
      description="Xem hồ sơ liên hệ và trạng thái hoạt động của nhân sự trong đội."
      backHref="/distributor/team"
    >
      {!user ? (
        <DistributorDetailEmpty description="Không tìm thấy DSR" />
      ) : (
        <DistributorDetailCard
          title={user.fullName}
          description="Thông tin nhân sự được gán cho nhà phân phối."
          extra={
            <Tag color={user.isActive ? "green" : "red"} className="distributor-pill-tag">
              {user.isActive ? "Hoạt động" : "Tạm khóa"}
            </Tag>
          }
        >
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Họ tên">{user.fullName}</Descriptions.Item>
            <Descriptions.Item label="Mã DSR">{user.code || "-"}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{user.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Khu vực/Công ty">
              {user.companyName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {user.isActive ? "Đang hoạt động" : "Tạm khóa"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={2}>
              {user.address || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(user.createdAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật gần nhất">
              {new Date(user.updatedAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>
        </DistributorDetailCard>
      )}
    </DistributorDetailShell>
  );
}
