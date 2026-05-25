"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { Empty, Flex, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMyOrdersQuery } from "@/features/orders/orderService";
import type { Order } from "@/features/orders/orderTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;
const money = new Intl.NumberFormat("vi-VN");

const statusMap = {
  pending: { color: "gold", text: "Chờ duyệt", icon: <ClockCircleOutlined /> },
  approved: { color: "green", text: "Đã duyệt", icon: <CheckCircleOutlined /> },
  delivered: { color: "cyan", text: "Đã giao", icon: <ShoppingCartOutlined /> },
  return_requested: { color: "orange", text: "Chờ trả hàng", icon: <ClockCircleOutlined /> },
  cancelled: { color: "red", text: "Đã hủy", icon: <CloseCircleOutlined /> },
  returned: { color: "purple", text: "Đã trả hàng", icon: <CloseCircleOutlined /> },
};

const getName = (value: Order["seller"] | Order["customer"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

export default function DistributorOrdersPage() {
  const { data = [], isLoading, refetch } = useGetMyOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(["new-notification", "order-updated"], refetch);

  const stats = useMemo(() => {
    const totalRevenue = data.reduce((total, item) => total + item.finalAmount, 0);
    const deliveredRevenue = data
      .filter((item) => item.status === "delivered")
      .reduce((total, item) => total + item.finalAmount, 0);

    return {
      total: data.length,
      pending: data.filter((item) => item.status === "pending").length,
      approved: data.filter((item) => item.status === "approved").length,
      delivered: data.filter((item) => item.status === "delivered").length,
      cancelled: data.filter((item) => item.status === "cancelled").length,
      returned: data.filter((item) => item.status === "returned").length,
      totalRevenue,
      deliveredRevenue,
    };
  }, [data]);

  const deliveryRate = stats.total
    ? Math.round((stats.delivered / stats.total) * 100)
    : 0;
  const activeRate = stats.total
    ? Math.round(((stats.approved + stats.delivered) / stats.total) * 100)
    : 0;

  const latestOrder = useMemo(() => {
    if (!data.length) return undefined;
    return [...data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [data]);

  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      width: 190,
      ellipsis: true,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="distributor-table-mark">
            <ShoppingCartOutlined />
          </div>
          <Text strong ellipsis className="distributor-row-strong">
            {value}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      width: 240,
      ellipsis: true,
      render: (value) => <Text className="distributor-row-muted">{getName(value)}</Text>,
    },
    {
      title: "DSR",
      dataIndex: "seller",
      width: 190,
      ellipsis: true,
      render: (value) => <Text className="distributor-row-muted">{getName(value)}</Text>,
    },
    {
      title: "Giá trị",
      dataIndex: "finalAmount",
      width: 170,
      align: "right",
      render: (value: number) => (
        <Text strong className="distributor-dashboard-money">
          {money.format(value)} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 170,
      align: "center",
      render: (status: keyof typeof statusMap) => {
        const item = statusMap[status] ?? statusMap.pending;
        return (
          <Tag color={item.color} icon={item.icon} className="distributor-pill-tag">
            {item.text}
          </Tag>
        );
      },
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Đơn hàng"
      title="Đơn hàng đội DSR"
      description="Giám sát đơn hàng được tạo bởi các DSR cấp dưới, trạng thái duyệt và doanh thu đã giao."
    >
      <DistributorCommandCenter
        eyebrow="Order pipeline"
        title="Theo dõi đơn hàng của đội"
        description="Nắm nhanh doanh thu, số đơn chờ duyệt và tiến độ giao hàng để hỗ trợ DSR đúng lúc."
        meterValue={`${money.format(stats.totalRevenue)} đ`}
        meterLabel="Tổng giá trị đơn hàng"
        stats={[
          { label: "Tổng đơn", value: stats.total },
          { label: "Chờ duyệt", value: stats.pending },
          { label: "Tỷ lệ đã giao", value: `${deliveryRate}%` },
        ]}
        progressLabel="Đơn đã duyệt hoặc giao"
        progressValue={`${stats.approved + stats.delivered}/${stats.total}`}
        progressPercent={activeRate}
        feature={
          latestOrder ? (
            <>
              <Text className="distributor-command-feature-label">Đơn gần nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {latestOrder.orderCode}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{getName(latestOrder.customer)}</span>
                <span>{money.format(latestOrder.finalAmount)} đ</span>
              </div>
              <Tag
                color={statusMap[latestOrder.status]?.color ?? "default"}
                className="distributor-pill-tag"
              >
                {statusMap[latestOrder.status]?.text ?? "Chờ duyệt"}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có đơn hàng nào.
            </Text>
          )
        }
        statusItems={[
          { label: "Chờ duyệt", value: stats.pending, icon: <ClockCircleOutlined /> },
          { label: "Đã duyệt", value: stats.approved, icon: <CheckCircleOutlined /> },
          { label: "Đã giao", value: stats.delivered, icon: <ShoppingCartOutlined /> },
          { label: "Doanh thu giao", value: `${money.format(stats.deliveredRevenue)} đ`, icon: <DollarOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Danh sách đơn hàng"
        description="Theo dõi khách hàng, DSR phụ trách, giá trị và trạng thái xử lý."
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
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
          locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}
