"use client";

import { Descriptions, Tag } from "antd";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetCustomerByIdQuery } from "@/features/customers/customerService";

const statusMap = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  rejected: { color: "red", text: "Từ chối" },
};

const getUserName = (value?: string | { fullName?: string; email?: string }) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  return value.fullName || value.email || "-";
};

export default function DistributorCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useGetCustomerByIdQuery(id);

  if (isLoading) return <DistributorDetailLoading />;

  return (
    <DistributorDetailShell
      title="Chi tiết khách hàng"
      description="Xem hồ sơ điểm bán, DSR phụ trách và trạng thái duyệt."
      backHref="/distributor/customers"
    >
      {!customer ? (
        <DistributorDetailEmpty description="Không tìm thấy khách hàng" />
      ) : (
        <DistributorDetailCard
          title={customer.name}
          description="Thông tin điểm bán thuộc phạm vi quản lý của đội DSR."
          extra={
            <Tag color={statusMap[customer.status].color} className="distributor-pill-tag">
              {statusMap[customer.status].text}
            </Tag>
          }
        >
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Tên khách hàng">{customer.name}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{customer.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Chủ cửa hàng">
              {customer.ownerName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Loại khách hàng">
              {customer.customerType || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="DSR phụ trách">
              {getUserName(customer.assignedSeller)}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {statusMap[customer.status].text}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={2}>
              {customer.address || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tọa độ GPS">
              {customer.latitude !== undefined && customer.longitude !== undefined
                ? `${customer.latitude}, ${customer.longitude}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
            {customer.rejectReason && (
              <Descriptions.Item label="Lý do từ chối" span={2}>
                {customer.rejectReason}
              </Descriptions.Item>
            )}
          </Descriptions>
        </DistributorDetailCard>
      )}
    </DistributorDetailShell>
  );
}
