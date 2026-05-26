"use client";

import { Descriptions, Flex, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetRouteByIdQuery } from "@/features/routes/routeService";
import type { Route, RouteCustomer, RouteCustomerStatus, RouteStatus } from "@/features/routes/routeTypes";

const { Text } = Typography;

const routeStatusMap: Record<RouteStatus, { color: string; text: string }> = {
  planned: { color: "default", text: "Kế hoạch" },
  in_progress: { color: "processing", text: "Đang đi tuyến" },
  completed: { color: "success", text: "Hoàn thành" },
  cancelled: { color: "error", text: "Đã hủy" },
};

const customerStatusMap: Record<RouteCustomerStatus, { color: string; text: string }> = {
  pending: { color: "default", text: "Chưa ghé" },
  checked_in: { color: "processing", text: "Đang ghé" },
  visited: { color: "green", text: "Đã ghé" },
  skipped: { color: "red", text: "Bỏ qua" },
};

const getSeller = (seller: Route["seller"]) => {
  if (typeof seller === "string") return /^[a-f\d]{24}$/i.test(seller) ? "-" : seller;
  return seller.fullName || seller.email || "-";
};

const getCustomer = (customer: RouteCustomer["customer"]) => {
  if (typeof customer === "string") return { name: "-", phone: "-", address: "-" };
  return {
    name: customer.name || "-",
    phone: customer.phone || "-",
    address: customer.address || "-",
  };
};

export default function DistributorRouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: route, isLoading } = useGetRouteByIdQuery(id);

  if (isLoading) return <DistributorDetailLoading />;

  const columns: ColumnsType<RouteCustomer> = [
    {
      title: "STT",
      dataIndex: "orderIndex",
      width: 80,
      align: "center",
      render: (value: number) => value + 1,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      width: 240,
      render: (customer: RouteCustomer["customer"]) => (
        <Flex vertical gap={2}>
          <Text strong className="distributor-detail-strong">{getCustomer(customer).name}</Text>
          <Text className="distributor-detail-muted">{getCustomer(customer).phone}</Text>
        </Flex>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "customer",
      ellipsis: true,
      render: (customer: RouteCustomer["customer"]) => getCustomer(customer).address,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 150,
      render: (value: RouteCustomerStatus = "pending") => (
        <Tag color={customerStatusMap[value].color} className="distributor-pill-tag">
          {customerStatusMap[value].text}
        </Tag>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      ellipsis: true,
      width: 210,
      render: (value?: string) => value || "-",
    },
  ];

  return (
    <DistributorDetailShell
      title="Chi tiết tuyến bán hàng"
      description="Xem DSR phụ trách, lịch làm việc và tiến độ từng điểm bán."
      backHref="/distributor/routes"
    >
      {!route ? (
        <DistributorDetailEmpty description="Không tìm thấy tuyến bán hàng" />
      ) : (
        <>
          <DistributorDetailCard
            title={route.name}
            description="Thông tin lịch trình và trạng thái thực thi của tuyến."
            extra={
              <Tag color={routeStatusMap[route.status].color} className="distributor-pill-tag">
                {routeStatusMap[route.status].text}
              </Tag>
            }
          >
            <Descriptions bordered column={{ xs: 1, md: 2 }}>
              <Descriptions.Item label="Tên tuyến">{route.name}</Descriptions.Item>
              <Descriptions.Item label="DSR phụ trách">{getSeller(route.seller)}</Descriptions.Item>
              <Descriptions.Item label="Ngày làm việc">
                {new Date(route.workDate).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {routeStatusMap[route.status].text}
              </Descriptions.Item>
              <Descriptions.Item label="Số điểm bán">{route.customers.length}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(route.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
            </Descriptions>
          </DistributorDetailCard>

          <DistributorDetailCard
            title="Điểm bán trong tuyến"
            description="Thứ tự ghé và trạng thái thực hiện tại từng điểm bán."
          >
            <Table
              className="distributor-detail-table"
              rowKey={(_, index) => String(index)}
              columns={columns}
              dataSource={[...route.customers].sort((a, b) => a.orderIndex - b.orderIndex)}
              pagination={false}
              scroll={{ x: 940 }}
            />
          </DistributorDetailCard>
        </>
      )}
    </DistributorDetailShell>
  );
}
