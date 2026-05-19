"use client";

import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  RollbackOutlined,
  ShopOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Divider,
  Empty,
  Flex,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Customer } from "@/features/customers/customerTypes";
import {
  useApproveOrderMutation,
  useCancelOrderMutation,
  useDeliverOrderMutation,
  useGetOrderByIdQuery,
  useReturnOrderMutation,
} from "@/features/orders/orderService";
import type { OrderItem, OrderStatus } from "@/features/orders/orderTypes";
import type { User } from "@/features/users/userTypes";

const { Text, Title } = Typography;

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "orange" },
  approved: { label: "Đã xác nhận", color: "blue" },
  delivered: { label: "Đã giao", color: "green" },
  return_requested: { label: "Chờ duyệt trả hàng", color: "orange" },
  cancelled: { label: "Đã hủy", color: "red" },
  returned: { label: "Đã trả hàng", color: "purple" },
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

export default function AdminOrderDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, isLoading } = useGetOrderByIdQuery(id);
  const [approveOrder, { isLoading: approving }] = useApproveOrderMutation();
  const [deliverOrder, { isLoading: delivering }] = useDeliverOrderMutation();
  const [returnOrder, { isLoading: returning }] = useReturnOrderMutation();
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();

  const handleApprove = async () => {
    try {
      await approveOrder(id).unwrap();
      message.success("Xác nhận đơn hàng thành công");
    } catch {
      message.error("Xác nhận đơn hàng thất bại");
    }
  };

  const handleDeliver = async () => {
    try {
      await deliverOrder(id).unwrap();
      message.success("Giao đơn hàng thành công");
    } catch {
      message.error("Giao đơn hàng thất bại");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder(id).unwrap();
      message.success("Hủy đơn hàng thành công");
    } catch {
      message.error("Hủy đơn hàng thất bại");
    }
  };

  const handleReturn = async () => {
    try {
      await returnOrder(id).unwrap();
      message.success("Trả hàng thành công, tồn kho đã được cập nhật");
    } catch {
      message.error("Trả hàng thất bại");
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết đơn hàng"
          description="Chi tiết đơn hàng và trạng thái xử lý."
          extra={
            <Button onClick={() => router.push("/admin/orders")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-order-detail-frame is-loading" />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết đơn hàng"
          description="Chi tiết đơn hàng và trạng thái xử lý."
          extra={
            <Button onClick={() => router.push("/admin/orders")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-order-detail-frame">
          <Empty description="Không tìm thấy đơn hàng" />
        </div>
      </>
    );
  }

  const customer =
    typeof order.customer === "string" ? null : (order.customer as Customer);
  const seller =
    typeof order.seller === "string" ? null : (order.seller as User);
  const customerName =
    customer?.name ||
    (typeof order.customer === "string" ? order.customer : "-");
  const customerPhone = customer?.phone || "-";
  const customerAddress = customer?.address || "-";
  const sellerName =
    seller?.fullName || (typeof order.seller === "string" ? order.seller : "-");
  const currentStatus = statusMap[order.status];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={`Đơn hàng ${order.orderCode}`}
        description="Chi tiết đơn hàng, khách hàng, sản phẩm và trạng thái xử lý."
        extra={
          <Space wrap>
            <Button onClick={() => router.push("/admin/orders")}>
              Quay lại
            </Button>

            {order.status === "pending" ? (
              <>
                <Button
                  color="orange"
                  variant="solid"
                  icon={<EditOutlined />}
                  onClick={() => router.push(`/admin/orders/${id}/edit`)}
                >
                  Sửa đơn
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={approving}
                  onClick={handleApprove}
                >
                  Xác nhận
                </Button>
                <Button
                  color="danger"
                  variant="solid"
                  icon={<CloseOutlined />}
                  loading={cancelling}
                  onClick={handleCancel}
                >
                  Hủy đơn
                </Button>
              </>
            ) : null}

            {order.status === "approved" ? (
              <Button
                type="primary"
                icon={<TruckOutlined />}
                loading={delivering}
                onClick={handleDeliver}
              >
                Giao hàng
              </Button>
            ) : null}

            {order.status === "return_requested" ? (
              <Button
                color="purple"
                variant="solid"
                icon={<RollbackOutlined />}
                loading={returning}
                onClick={handleReturn}
              >
                Trả hàng
              </Button>
            ) : null}
          </Space>
        }
      />

      <section className="admin-order-detail-shell">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <section className="admin-order-detail-frame">
              <Flex vertical align="center" className="admin-order-detail-summary">
                <Flex
                  align="center"
                  justify="center"
                  className="admin-order-detail-summary-icon"
                >
                  <ShopOutlined />
                </Flex>
                <Title level={4} className="admin-order-detail-summary-title">
                  {order.orderCode}
                </Title>
                <Text className="admin-order-detail-summary-subtitle">
                  {customerName}
                </Text>
                <Tag color={currentStatus?.color} className="admin-order-detail-status">
                  {currentStatus?.label || order.status}
                </Tag>
              </Flex>

              <div className="admin-order-money-list">
                <Flex justify="space-between" align="center">
                  <Text>Tổng tiền</Text>
                  <strong>{money(order.totalAmount)}</strong>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text>Giảm giá</Text>
                  <strong>{money(order.discountAmount)}</strong>
                </Flex>
                <Divider className="admin-order-detail-divider" />
                <Flex justify="space-between" align="center">
                  <Text>Thanh toán</Text>
                  <strong className="is-final">{money(order.finalAmount)}</strong>
                </Flex>
              </div>
            </section>
          </Col>

          <Col xs={24} lg={16}>
            <section className="admin-order-detail-frame">
              <div className="admin-order-detail-head">
                <div>
                  <Text className="admin-order-detail-title">
                    Thông tin đơn hàng
                  </Text>
                  <Text className="admin-order-detail-desc">
                    Dữ liệu xử lý, khách hàng và người bán phụ trách.
                  </Text>
                </div>
              </div>

              <div className="admin-order-info-grid">
                <div className="admin-order-info-row">
                  <Text>Mã đơn</Text>
                  <strong>{order.orderCode}</strong>
                </div>
                <div className="admin-order-info-row">
                  <Text>Trạng thái</Text>
                  <Tag color={currentStatus?.color} className="admin-order-detail-status">
                    {currentStatus?.label || order.status}
                  </Tag>
                </div>
                <div className="admin-order-info-row">
                  <Text>Khách hàng</Text>
                  <strong>{customerName}</strong>
                </div>
                <div className="admin-order-info-row">
                  <Text>Số điện thoại</Text>
                  <strong>{customerPhone}</strong>
                </div>
                <div className="admin-order-info-row">
                  <Text>Nhân viên</Text>
                  <strong>{sellerName}</strong>
                </div>
                <div className="admin-order-info-row">
                  <Text>Ngày tạo</Text>
                  <strong>{formatDateTime(order.createdAt)}</strong>
                </div>
                <div className="admin-order-info-row is-wide">
                  <Text>Địa chỉ</Text>
                  <strong>{customerAddress}</strong>
                </div>
                <div className="admin-order-info-row is-wide">
                  <Text>Ghi chú</Text>
                  <strong>{order.note || "-"}</strong>
                </div>
              </div>
            </section>
          </Col>

          <Col span={24}>
            <section className="admin-order-detail-frame">
              <div className="admin-order-detail-head">
                <Flex justify="space-between" align="center" gap={14} wrap="wrap">
                  <div>
                    <Text className="admin-order-detail-title">
                      Danh sách sản phẩm
                    </Text>
                    <Text className="admin-order-detail-desc">
                      Sản phẩm, số lượng và thành tiền trong đơn.
                    </Text>
                  </div>
                  <Tag color="blue" className="admin-order-detail-status">
                    {order.items.length} sản phẩm
                  </Tag>
                </Flex>
              </div>

              <Table<OrderItem>
                rowKey={(record) =>
                  typeof record.product === "string"
                    ? record.product
                    : record.product._id
                }
                pagination={false}
                dataSource={order.items}
                scroll={{ x: 760 }}
                className="admin-order-detail-table"
                columns={[
                  {
                    title: "Sản phẩm",
                    dataIndex: "productName",
                    width: 260,
                    render: (value: string) => <Text strong>{value}</Text>,
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "price",
                    width: 160,
                    align: "right",
                    render: (value: number) => money(value),
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    width: 120,
                    align: "center",
                    render: (value: number) => value.toLocaleString("vi-VN"),
                  },
                  {
                    title: "Thành tiền",
                    dataIndex: "subtotal",
                    width: 180,
                    align: "right",
                    render: (value: number) => (
                      <Text strong>{money(value)}</Text>
                    ),
                  },
                ]}
              />
            </section>
          </Col>
        </Row>
      </section>

      <style jsx global>{`
        .admin-order-detail-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-order-detail-frame {
          min-height: 100%;
          padding: 18px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-order-detail-frame.is-loading {
          min-height: 180px;
          background:
            linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: admin-order-detail-loading 1.2s ease infinite;
        }

        @keyframes admin-order-detail-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .admin-order-detail-head {
          margin: -18px -18px 18px;
          padding: 18px;
          border-bottom: 1px solid #e7edf5;
          background: #fbfdff;
        }

        .admin-order-detail-summary {
          text-align: center;
        }

        .admin-order-detail-summary-icon {
          width: 78px;
          height: 78px;
          margin-bottom: 16px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 34px;
          background: #eff6ff;
        }

        .admin-order-detail-summary-title.ant-typography {
          margin: 0 0 6px;
          color: #0f172a;
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: 0;
        }

        .admin-order-detail-summary-subtitle {
          margin-bottom: 14px;
          color: #64748b !important;
          font-weight: 700;
        }

        .admin-order-detail-status {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-order-money-list {
          margin-top: 22px;
          padding-top: 18px;
          display: grid;
          gap: 13px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-order-money-list .ant-typography,
        .admin-order-info-row .ant-typography {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-order-money-list strong,
        .admin-order-info-row strong {
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.4;
          word-break: break-word;
        }

        .admin-order-money-list strong.is-final {
          color: #059669;
          font-size: 18px;
        }

        .admin-order-detail-divider {
          margin: 2px 0 !important;
        }

        .admin-order-detail-title,
        .admin-order-detail-desc {
          display: block;
        }

        .admin-order-detail-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-order-detail-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-order-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .admin-order-info-row {
          min-width: 0;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(96px, 0.36fr) minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-order-info-row.is-wide {
          grid-column: 1 / -1;
        }

        .admin-order-detail-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-order-detail-table .ant-table-thead > tr > th {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
        }

        .admin-order-detail-table .ant-table-tbody > tr > td {
          padding-block: 14px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
        }

        @media (max-width: 767px) {
          .admin-order-info-grid {
            grid-template-columns: 1fr;
          }

          .admin-order-info-row,
          .admin-order-info-row.is-wide {
            grid-template-columns: 1fr;
            align-items: start;
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
}
