"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Flex,
  Segmented,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetSellerDashboardQuery } from "@/features/dashboard/dashboardService";
import { useGetMyOrdersQuery } from "@/features/orders/orderService";
import type { Order } from "@/features/orders/orderTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;
const money = new Intl.NumberFormat("vi-VN");

const statusMap = {
  pending: { color: "gold", text: "Chờ duyệt", icon: <ClockCircleOutlined /> },
  approved: { color: "green", text: "Đã duyệt", icon: <CheckCircleOutlined /> },
  delivered: { color: "green", text: "Đã giao", icon: <ShoppingCartOutlined /> },
  return_requested: {
    color: "orange",
    text: "Chờ trả hàng",
    icon: <ClockCircleOutlined />,
  },
  cancelled: { color: "red", text: "Đã hủy", icon: <CloseCircleOutlined /> },
  returned: {
    color: "blue",
    text: "Đã trả hàng",
    icon: <CloseCircleOutlined />,
  },
};

type OrderTypeFilter = "market" | "supply";
type StatusFilter = "all" | keyof typeof statusMap;

const getName = (
  value: Order["seller"] | Order["customer"] | Order["distributor"],
) => {
  if (!value) return "-";
  if (typeof value === "string")
    return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

const isSupplyOrder = (order: Order) =>
  order.orderType === "manufacturer_to_distributor";

const getMoneyValue = (value?: number) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export default function DistributorOrdersPage() {
  const searchParams = useSearchParams();
  const createdType = searchParams.get("created");
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>("market");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const {
    data = [],
    isLoading,
    refetch,
  } = useGetMyOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: dashboard, refetch: refetchDashboard } =
    useGetSellerDashboardQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  useRealtimeRefetch(["new-notification", "order-updated"], () => {
    refetch();
    refetchDashboard();
  });

  const filteredOrders = useMemo(
    () =>
      data
        .filter((order) => {
          return typeFilter === "market"
            ? !isSupplyOrder(order)
            : isSupplyOrder(order);
        })
        .filter(
          (order) => statusFilter === "all" || order.status === statusFilter,
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [data, statusFilter, typeFilter],
  );

  const stats = useMemo(() => {
    const marketOrders = data.filter((item) => !isSupplyOrder(item));
    const inboundSupplyOrders = data.filter(isSupplyOrder);
    const deliveredRevenue = marketOrders
      .filter((item) => item.status === "delivered")
      .reduce((total, item) => total + getMoneyValue(item.finalAmount), 0);
    const totalRevenue = Math.max(
      deliveredRevenue,
      getMoneyValue(dashboard?.totalRevenue),
    );
    const deliveredProfit = marketOrders
      .filter((item) => item.status === "delivered")
      .reduce((total, item) => total + (item.grossProfit || 0), 0);
    return {
      total: data.length,
      market: marketOrders.length,
      inboundSupply: inboundSupplyOrders.length,
      pending: marketOrders.filter((item) => item.status === "pending").length,
      approved: marketOrders.filter((item) => item.status === "approved")
        .length,
      delivered: marketOrders.filter((item) => item.status === "delivered")
        .length,
      supplyPending: inboundSupplyOrders.filter(
        (item) => item.status === "pending",
      ).length,
      cancelled: data.filter((item) => item.status === "cancelled").length,
      returned: data.filter((item) => item.status === "returned").length,
      totalRevenue,
      deliveredRevenue,
      deliveredProfit,
    };
  }, [dashboard?.totalRevenue, data]);

  const deliveryRate = stats.market
    ? Math.round((stats.delivered / stats.market) * 100)
    : 0;
  const activeRate = stats.market
    ? Math.round(((stats.approved + stats.delivered) / stats.market) * 100)
    : 0;

  const latestOrder = useMemo(() => {
    if (!filteredOrders.length) return undefined;
    return filteredOrders[0];
  }, [filteredOrders]);

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
      title: "Luồng đơn",
      dataIndex: "orderType",
      width: 160,
      render: (_, record) => (
        <Tag color="blue">
          {isSupplyOrder(record) ? "Nestlé -> NPP" : "NPP -> Tiệm"}
        </Tag>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      width: 240,
      ellipsis: true,
      render: (value, record) => (
        <Text className="distributor-row-muted">
          {isSupplyOrder(record) ? getName(record.distributor) : getName(value)}
        </Text>
      ),
    },
    {
      title: "DSR",
      dataIndex: "seller",
      width: 190,
      ellipsis: true,
      render: (value, record) => (
        <Text className="distributor-row-muted">
          {isSupplyOrder(record) ? "Nestlé" : getName(value)}
        </Text>
      ),
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
          <Tag
            color={item.color}
            icon={item.icon}
            className="distributor-pill-tag"
          >
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Link href={`/distributor/orders/${record._id}`}>
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
      eyebrow="Đơn hàng"
      title="Đơn hàng"
      description="Theo dõi đơn bán ra tiệm của đội DSR, giá trị và trạng thái xử lý."
      extra={
        <Link href="/distributor/orders/create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="distributor-order-create-button"
          >
            Tạo đơn
          </Button>
        </Link>
      }
    >
      <DistributorCommandCenter
        eyebrow="Order pipeline"
        title="Theo dõi đơn hàng"
        description="Nắm nhanh số đơn, trạng thái xử lý, doanh thu và hiệu quả của đội DSR."
        meterValue={`${money.format(stats.totalRevenue)} đ`}
        meterLabel="Doanh thu đơn thị trường đã giao"
        stats={[
          { label: "Tổng đơn", value: stats.market },
          { label: "Chờ duyệt bán", value: stats.pending },
          { label: "Tỷ lệ đã giao", value: `${deliveryRate}%` },
        ]}
        progressLabel="Đơn đã duyệt hoặc giao"
        progressValue={`${stats.approved + stats.delivered}/${stats.market}`}
        progressPercent={activeRate}
        feature={
          latestOrder ? (
            <>
              <Text className="distributor-command-feature-label">
                Đơn gần nhất
              </Text>
              <Text ellipsis className="distributor-command-feature-title">
                {latestOrder.orderCode}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>
                  {isSupplyOrder(latestOrder)
                    ? "Đơn nhập kho"
                    : getName(latestOrder.customer)}
                </span>
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
          {
            label: "Chờ duyệt",
            value: stats.pending,
            icon: <ClockCircleOutlined />,
          },
          {
            label: "Đã duyệt",
            value: stats.approved,
            icon: <CheckCircleOutlined />,
          },
          {
            label: "Đã giao",
            value: stats.delivered,
            icon: <ShoppingCartOutlined />,
          },
          {
            label: "Đơn nhập kho",
            value: stats.inboundSupply,
            icon: <ShoppingCartOutlined />,
          },
          {
            label: "Nhập chờ duyệt",
            value: stats.supplyPending,
            icon: <ClockCircleOutlined />,
          },
          {
            label: "Doanh thu giao",
            value: `${money.format(stats.deliveredRevenue)} đ`,
            icon: <DollarOutlined />,
          },
          {
            label: "Lãi gộp giao",
            value: `${money.format(stats.deliveredProfit)} đ`,
            icon: <DollarOutlined />,
          },
        ]}
      />

      {createdType === "supply" && (
        <Alert
          showIcon
          type="success"
          style={{ marginBottom: 18 }}
          message="Đã gửi đơn hàng"
          description="Đơn vừa tạo đang ở trạng thái Chờ duyệt. Khi được duyệt và giao hàng, trạng thái sẽ chuyển sang Đã duyệt rồi Đã giao."
        />
      )}

      <DistributorTableCard
        title="Danh sách đơn"
        description="Lọc đơn theo loại và trạng thái, theo dõi người phụ trách, giá trị và tiến độ xử lý."
      >
        <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
          <Segmented<OrderTypeFilter>
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: "Đơn thị trường", value: "market" },
              { label: "Đơn nhập kho", value: "supply" },
            ]}
          />
          <Segmented<StatusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Chờ duyệt", value: "pending" },
              { label: "Đã duyệt", value: "approved" },
              { label: "Đã giao", value: "delivered" },
              { label: "Đã hủy", value: "cancelled" },
            ]}
          />
        </Flex>
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredOrders}
          scroll={{ x: 1120 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} đơn`,
          }}
          locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }}
        />
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-content
          .seller-page-header-extra
          .distributor-order-create-button.ant-btn-primary {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .seller-page-header-extra
          .distributor-order-create-button.ant-btn-primary:hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2) !important;
        }
      `}</style>
    </DistributorPageShell>
  );
}





