"use client";

import { Descriptions, Tag } from "antd";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetVisitByIdQuery } from "@/features/visits/visitService";
import type { Visit } from "@/features/visits/visitTypes";

const statusMap = {
  checked_in: { color: "processing", text: "Đang ghé thăm" },
  checked_out: { color: "success", text: "Hoàn thành" },
};

const getName = (value: Visit["seller"] | Visit["customer"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

const getRoute = (route: Visit["route"]) => {
  if (!route) return "-";
  if (typeof route === "string") return /^[a-f\d]{24}$/i.test(route) ? "-" : route;
  return route.name || "-";
};

export default function DistributorVisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: visit, isLoading } = useGetVisitByIdQuery(id);

  if (isLoading) return <DistributorDetailLoading />;

  return (
    <DistributorDetailShell
      title="Chi tiết ghé thăm"
      description="Xem hoạt động check-in, check-out và thông tin GPS của DSR."
      backHref="/distributor/visits"
    >
      {!visit ? (
        <DistributorDetailEmpty description="Không tìm thấy lượt ghé thăm" />
      ) : (
        <DistributorDetailCard
          title={getName(visit.customer)}
          description={`Lượt ghé do ${getName(visit.seller)} thực hiện.`}
          extra={
            <Tag color={statusMap[visit.status].color} className="distributor-pill-tag">
              {statusMap[visit.status].text}
            </Tag>
          }
        >
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Khách hàng">{getName(visit.customer)}</Descriptions.Item>
            <Descriptions.Item label="DSR">{getName(visit.seller)}</Descriptions.Item>
            <Descriptions.Item label="Tuyến bán hàng">{getRoute(visit.route)}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {statusMap[visit.status].text}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian check-in">
              {new Date(visit.checkInTime).toLocaleString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian check-out">
              {visit.checkOutTime
                ? new Date(visit.checkOutTime).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="GPS check-in">
              {visit.checkInLatitude}, {visit.checkInLongitude}
            </Descriptions.Item>
            <Descriptions.Item label="Khoảng cách check-in">
              {visit.checkInDistance !== undefined
                ? `${Math.round(visit.checkInDistance)} m`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="GPS check-out">
              {visit.checkOutLatitude !== undefined && visit.checkOutLongitude !== undefined
                ? `${visit.checkOutLatitude}, ${visit.checkOutLongitude}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Khoảng cách check-out">
              {visit.checkOutDistance !== undefined
                ? `${Math.round(visit.checkOutDistance)} m`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {visit.note || "-"}
            </Descriptions.Item>
          </Descriptions>
        </DistributorDetailCard>
      )}
    </DistributorDetailShell>
  );
}
