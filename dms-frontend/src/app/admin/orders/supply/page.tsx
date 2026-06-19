"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  SendOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import {
  useApproveOrderMutation,
  useDeliverOrderMutation,
  useGetOrdersPageQuery,
} from "@/features/orders/orderService";
import type { Order, OrderStatus } from "@/features/orders/orderTypes";
import { useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type StatusFilter = "all" | OrderStatus;

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Chờ duyệt", color: "orange" },
  approved: { label: "Đã duyệt", color: "blue" },
  delivered: { label: "Đã giao kho", color: "green" },
  return_requested: { label: "Chờ trả hàng", color: "gold" },
  cancelled: { label: "Đã hủy", color: "red" },
  returned: { label: "Đã trả hàng", color: "blue" },
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const getDistributorName = (distributor?: Order["distributor"]) => {
  if (!distributor) return "-";
  if (typeof distributor === "string") return distributor;
  return distributor.companyName || distributor.fullName || distributor.email;
};

const getUserPhone = (user?: string | User) =>
  !user || typeof user === "string" ? "-" : user.phone || "-";

export default function AdminSupplyOrdersPage() {
  const { message } = App.useApp();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [distributor, setDistributor] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: users = [] } = useGetUsersQuery();
  const distributors = useMemo(
    () => users.filter((user) => user.role === "distributor" && user.isActive),
    [users],
  );

  const {
    data: pageData,
    isLoading,
    refetch,
  } = useGetOrdersPageQuery({
    page,
    limit: pageSize,
    type: "manufacturer_to_distributor",
    distributor,
    status: status === "all" ? undefined : status,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const { data: overviewData } = useGetOrdersPageQuery({
    page: 1,
    limit: 100,
    type: "manufacturer_to_distributor",
    distributor,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [approveOrder, { isLoading: approving }] = useApproveOrderMutation();
  const [deliverOrder, { isLoading: delivering }] = useDeliverOrderMutation();

  useRealtimeRefetch(["new-notification", "order-updated"], refetch);

  const supplyOrders = useMemo(() => pageData?.data ?? [], [pageData?.data]);
  const totalSupplyOrders = pageData?.meta.total ?? 0;

  const overview = useMemo(() => {
    const allSupplyOrders = overviewData?.data ?? [];

    return {
      total: overviewData?.meta.total ?? allSupplyOrders.length,
      pending: allSupplyOrders.filter((order) => order.status === "pending")
        .length,
      approved: allSupplyOrders.filter((order) => order.status === "approved")
        .length,
      delivered: allSupplyOrders.filter((order) => order.status === "delivered")
        .length,
      value: allSupplyOrders.reduce((sum, order) => sum + order.finalAmount, 0),
    };
  }, [overviewData?.data, overviewData?.meta.total]);

  const handleApprove = async (order: Order) => {
    try {
      await approveOrder(order._id).unwrap();
      message.success("Đã duyệt đơn nhập kho");
    } catch (error: unknown) {
      message.error(orderApiMessage(error, "Không thể duyệt đơn nhập kho"));
    }
  };

  const handleDeliver = async (order: Order) => {
    try {
      await deliverOrder(order._id).unwrap();
      message.success("Đã xác nhận giao hàng về kho NPP");
    } catch (error: unknown) {
      message.error(orderApiMessage(error, "Không thể xác nhận giao kho"));
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Xử lý",
      key: "workflow",
      width: 190,
      fixed: "left",
      align: "center",
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <Popconfirm
              title="Duyệt đơn nhập kho?"
              description="Kho chính sẽ bị trừ hàng khi duyệt đơn này."
              okText="Duyệt"
              cancelText="Hủy"
              onConfirm={() => handleApprove(record)}
            >
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                loading={approving}
                className="admin-supply-primary-action"
              >
                Duyệt ngay
              </Button>
            </Popconfirm>
          );
        }

        if (record.status === "approved") {
          return (
            <Popconfirm
              title="Xác nhận đã giao về kho NPP?"
              description="Tồn kho NPP sẽ được cộng sau thao tác này."
              okText="Đã giao"
              cancelText="Hủy"
              onConfirm={() => handleDeliver(record)}
            >
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                loading={delivering}
                className="admin-supply-deliver-action"
              >
                Xác nhận giao
              </Button>
            </Popconfirm>
          );
        }

        if (record.status === "delivered") {
          return (
            <Tag icon={<ShopOutlined />} color="green">
              Đã giao kho
            </Tag>
          );
        }

        return <Tag color={statusMap[record.status]?.color}>{statusMap[record.status]?.label}</Tag>;
      },
    },
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      width: 180,
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">{formatDate(record.createdAt)}</Text>
        </Space>
      ),
    },
    {
      title: "Nhà phân phối",
      dataIndex: "distributor",
      width: 240,
      render: (value: Order["distributor"], record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{getDistributorName(value)}</Text>
          <Text type="secondary">
            {record.deliveryPhone || getUserPhone(value)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Giao về",
      width: 260,
      ellipsis: true,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            {record.deliveryRecipientName ||
              getDistributorName(record.distributor)}
          </Text>
          <Text type="secondary">{record.deliveryAddress || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Số dòng",
      width: 110,
      align: "center",
      render: (_, record) => record.items.length.toLocaleString("vi-VN"),
    },
    {
      title: "Giá trị",
      dataIndex: "finalAmount",
      width: 160,
      align: "right",
      render: (value: number) => <Text strong>{money(value)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      align: "center",
      render: (value: OrderStatus) => (
        <Tag color={statusMap[value]?.color}>{statusMap[value]?.label}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center",
      fixed: "right",
      className: "admin-supply-actions-cell",
      render: (_, record) => (
        <Space size={12} className="admin-supply-actions">
          <Link href={`/admin/orders/${record._id}`}>
            <Button
              icon={<EyeOutlined />}
              className="admin-supply-detail-action"
            >
              Chi tiết
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />
      <AdminPageHeader
        title="Duyệt đơn giao kho NPP"
        description="Tách riêng yêu cầu nhập hàng của nhà phân phối để Admin duyệt, giao hàng và cộng tồn kho NPP."
        extra={
          <Link href="/admin/orders/supply/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo đơn cấp hàng
            </Button>
          </Link>
        }
      />

      <Flex vertical gap={16}>
        <Card>
          <Flex align="center" justify="space-between" gap={16} wrap="wrap">
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Luồng cấp hàng kho NPP
              </Title>
              <Text type="secondary">
                Duyệt đơn sẽ trừ kho chính; xác nhận giao sẽ cộng tồn kho nhà
                phân phối.
              </Text>
            </div>
            <Flex gap={12} wrap="wrap">
              <Tag icon={<ClockCircleOutlined />} color="orange">
                Chờ duyệt: {overview.pending}
              </Tag>
              <Tag icon={<CheckCircleOutlined />} color="blue">
                Đã duyệt: {overview.approved}
              </Tag>
              <Tag icon={<ShopOutlined />} color="green">
                Đã giao: {overview.delivered}
              </Tag>
              <Tag color="geekblue">Tổng: {overview.total}</Tag>
              <Tag color="cyan">Giá trị: {money(overview.value)}</Tag>
            </Flex>
          </Flex>
        </Card>

        <Card
          title="Danh sách đơn nhập kho"
          extra={
            <Flex gap={12} wrap="wrap">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Lọc nhà phân phối"
                style={{ width: 240 }}
                value={distributor}
                onChange={(value) => {
                  setDistributor(value);
                  setPage(1);
                }}
                options={distributors.map((item) => ({
                  value: item._id,
                  label: `${item.code ? `${item.code} - ` : ""}${
                    item.companyName || item.fullName
                  }`,
                }))}
              />
              <Segmented<StatusFilter>
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Chờ duyệt", value: "pending" },
                  { label: "Đã duyệt", value: "approved" },
                  { label: "Đã giao", value: "delivered" },
                  { label: "Đã hủy", value: "cancelled" },
                ]}
              />
            </Flex>
          }
        >
          <Table<Order>
            rowKey="_id"
            loading={isLoading}
            columns={columns}
            dataSource={supplyOrders}
            scroll={{ x: 1460 }}
            pagination={{
              current: page,
              pageSize,
              total: totalSupplyOrders,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} đơn nhập kho`,
            }}
            onChange={(pagination) => {
              setPage(pagination.current ?? 1);
              setPageSize(pagination.pageSize ?? 10);
            }}
            locale={{
              emptyText: <Empty description="Chưa có đơn nhập kho NPP" />,
            }}
          />
        </Card>
      </Flex>

      <style jsx global>{`
        .admin-supply-primary-action.ant-btn-primary,
        .admin-supply-deliver-action.ant-btn-primary {
          min-width: 142px !important;
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 800 !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18) !important;
        }

        .admin-supply-primary-action.ant-btn-primary {
          border-color: #f59e0b !important;
          background: #f59e0b !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(245, 158, 11, 0.22) !important;
        }

        .admin-supply-primary-action.ant-btn-primary:hover {
          border-color: #d97706 !important;
          background: #d97706 !important;
          color: #ffffff !important;
        }

        .admin-supply-detail-action.ant-btn {
          min-width: 118px !important;
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18) !important;
        }

        .admin-supply-detail-action.ant-btn:hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }

        .admin-supply-actions-cell {
          min-width: 160px !important;
        }

        .admin-supply-actions-cell .admin-supply-actions {
          width: 100%;
          display: inline-flex !important;
          flex-wrap: nowrap !important;
          justify-content: center !important;
        }

        .admin-supply-deliver-action.ant-btn-primary {
          border-color: #16a34a !important;
          background: #16a34a !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.18) !important;
        }

        .admin-supply-deliver-action.ant-btn-primary:hover {
          border-color: #15803d !important;
          background: #15803d !important;
          color: #ffffff !important;
        }
      `}</style>
    </>
  );
}
