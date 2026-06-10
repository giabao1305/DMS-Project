"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  InputNumber,
  Modal,
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
  useUpdateSupplyPricingMutation,
} from "@/features/orders/orderService";
import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/features/orders/orderTypes";
import type { Product } from "@/features/products/productTypes";
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

const getProductId = (item: OrderItem) =>
  typeof item.product === "string"
    ? item.product
    : (item.product as Product)._id;

type PricingRow = {
  product: string;
  productName: string;
  quantity: number;
  price: number;
};

export default function AdminSupplyOrdersPage() {
  const { message } = App.useApp();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [distributor, setDistributor] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pricingOrder, setPricingOrder] = useState<Order>();
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);

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
  const [updateSupplyPricing, { isLoading: savingPricing }] =
    useUpdateSupplyPricingMutation();

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

  const openPricingModal = (order: Order) => {
    setPricingOrder(order);
    setPricingRows(
      order.items.map((item) => ({
        product: getProductId(item),
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
    );
  };

  const updatePricingRow = (product: string, value: number | null) => {
    setPricingRows((current) =>
      current.map((row) =>
        row.product === product ? { ...row, price: value ?? 0 } : row,
      ),
    );
  };

  const savePricing = async () => {
    if (!pricingOrder) return;

    if (pricingRows.some((row) => row.price < 0)) {
      message.warning("Giá vốn NPP không được nhỏ hơn 0");
      return;
    }

    try {
      await updateSupplyPricing({
        id: pricingOrder._id,
        body: {
          items: pricingRows.map((row) => ({
            product: row.product,
            price: row.price,
          })),
        },
      }).unwrap();
      message.success("Đã cập nhật giá vốn NPP");
      setPricingOrder(undefined);
      setPricingRows([]);
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      message.error(
        Array.isArray(detail)
          ? detail[0]
          : detail || "Không thể cập nhật giá cho đơn nhập kho",
      );
    }
  };

  const columns: ColumnsType<Order> = [
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
      title: "Giá vốn NPP",
      width: 150,
      render: (_, record) => {
        const firstItem = record.items[0];
        if (!firstItem) return "-";

        return <Text type="secondary">{money(firstItem.price)}</Text>;
      },
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
      width: 260,
      align: "right",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Link href={`/admin/orders/${record._id}`}>
            <Button icon={<EyeOutlined />}>Chi tiết</Button>
          </Link>
          {(record.status === "pending" || record.status === "approved") && (
            <Button
              icon={<SettingOutlined />}
              onClick={() => openPricingModal(record)}
            >
              Giá vốn
            </Button>
          )}
          {record.status === "pending" && (
            <Popconfirm
              title="Duyệt đơn nhập kho?"
              description="Kho chính sẽ bị trừ hàng khi duyệt đơn này."
              okText="Duyệt"
              cancelText="Hủy"
              onConfirm={() => handleApprove(record)}
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approving}
              >
                Duyệt
              </Button>
            </Popconfirm>
          )}
          {record.status === "approved" && (
            <Popconfirm
              title="Xác nhận đã giao về kho NPP?"
              description="Tồn kho NPP sẽ được cộng sau thao tác này."
              okText="Đã giao"
              cancelText="Hủy"
              onConfirm={() => handleDeliver(record)}
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={delivering}
              >
                Đã giao
              </Button>
            </Popconfirm>
          )}
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
            scroll={{ x: 1360 }}
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

      <Modal
        title={`Cài giá vốn nhập kho ${pricingOrder?.orderCode || ""}`}
        open={Boolean(pricingOrder)}
        onCancel={() => {
          setPricingOrder(undefined);
          setPricingRows([]);
        }}
        onOk={savePricing}
        okText="Lưu giá vốn"
        cancelText="Đóng"
        confirmLoading={savingPricing}
        width={860}
      >
        <Table<PricingRow>
          rowKey="product"
          pagination={false}
          dataSource={pricingRows}
          scroll={{ x: 760 }}
          columns={[
            {
              title: "Sản phẩm",
              dataIndex: "productName",
              width: 260,
              render: (value: string, row) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{value}</Text>
                  <Text type="secondary">
                    SL: {row.quantity.toLocaleString("vi-VN")}
                  </Text>
                </Space>
              ),
            },
            {
              title: "Giá vốn NPP",
              dataIndex: "price",
              width: 220,
              render: (value: number, row) => (
                <InputNumber
                  min={0}
                  value={value}
                  style={{ width: "100%" }}
                  formatter={(input) =>
                    `${input}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(input) =>
                    Number((input || "").replace(/[^\d]/g, ""))
                  }
                  onChange={(nextValue) =>
                    updatePricingRow(row.product, nextValue)
                  }
                />
              ),
            },
            {
              title: "Thành tiền vốn",
              width: 160,
              align: "right",
              render: (_, row) => money(row.price * row.quantity),
            },
          ]}
        />
      </Modal>
    </>
  );
}
