"use client";

import { Descriptions, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetOrderByIdQuery } from "@/features/orders/orderService";
import type { Order, OrderItem, OrderStatus } from "@/features/orders/orderTypes";

const { Text } = Typography;
const money = new Intl.NumberFormat("vi-VN");

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  delivered: { color: "cyan", text: "Đã giao" },
  return_requested: { color: "orange", text: "Chờ trả hàng" },
  cancelled: { color: "red", text: "Đã hủy" },
  returned: { color: "purple", text: "Đã trả hàng" },
};

const getName = (value: Order["seller"] | Order["customer"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

export default function DistributorOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrderByIdQuery(id);

  if (isLoading) return <DistributorDetailLoading />;

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      render: (value: string) => (
        <Text strong className="distributor-detail-strong">{value}</Text>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
      width: 120,
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      align: "right",
      width: 170,
      render: (value: number) => `${money.format(value)} đ`,
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      align: "right",
      width: 190,
      render: (value: number) => (
        <Text strong className="distributor-dashboard-money">
          {money.format(value)} đ
        </Text>
      ),
    },
  ];

  return (
    <DistributorDetailShell
      title="Chi tiết đơn hàng"
      description="Xem đơn hàng do đội DSR tạo, sản phẩm và giá trị thanh toán."
      backHref="/distributor/orders"
    >
      {!order ? (
        <DistributorDetailEmpty description="Không tìm thấy đơn hàng" />
      ) : (
        <>
          <DistributorDetailCard
            title={order.orderCode}
            description="Thông tin tổng quan và trạng thái xử lý đơn hàng."
            extra={
              <Tag color={statusMap[order.status].color} className="distributor-pill-tag">
                {statusMap[order.status].text}
              </Tag>
            }
          >
            <Descriptions bordered column={{ xs: 1, md: 2 }}>
              <Descriptions.Item label="Mã đơn">{order.orderCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusMap[order.status].text}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">{getName(order.customer)}</Descriptions.Item>
              <Descriptions.Item label="DSR tạo đơn">{getName(order.seller)}</Descriptions.Item>
              <Descriptions.Item label="Tạm tính">
                {money.format(order.totalAmount)} đ
              </Descriptions.Item>
              <Descriptions.Item label="Giảm giá">
                {money.format(order.discountAmount)} đ
              </Descriptions.Item>
              <Descriptions.Item label="Tổng thanh toán">
                <Text strong className="distributor-dashboard-money">
                  {money.format(order.finalAmount)} đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {order.note || "-"}
              </Descriptions.Item>
              {order.returnReason && (
                <Descriptions.Item label="Lý do trả hàng" span={2}>
                  {order.returnReason}
                </Descriptions.Item>
              )}
            </Descriptions>
          </DistributorDetailCard>

          <DistributorDetailCard
            title="Sản phẩm trong đơn"
            description="Danh sách sản phẩm và giá trị theo từng dòng hàng."
          >
            <Table
              className="distributor-detail-table"
              rowKey={(record) =>
                typeof record.product === "string" ? record.product : record.product._id
              }
              columns={columns}
              dataSource={order.items}
              pagination={false}
              scroll={{ x: 720 }}
            />
          </DistributorDetailCard>
        </>
      )}
    </DistributorDetailShell>
  );
}
