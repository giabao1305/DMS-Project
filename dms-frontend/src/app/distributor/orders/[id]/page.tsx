"use client";

import {
  CheckCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  RollbackOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";
import { useState } from "react";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import {
  useApproveOrderMutation,
  useDeliverOrderMutation,
  useGetOrderByIdQuery,
  useRequestReturnOrderMutation,
  useReturnOrderMutation,
} from "@/features/orders/orderService";
import OrderPaymentPanel from "@/features/orders/OrderPaymentPanel";
import { getOrderAmounts } from "@/features/orders/orderAmounts";
import {
  exportOrderInvoiceExcel,
  exportOrderInvoicePdf,
} from "@/features/orders/orderInvoiceExport";
import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/features/orders/orderTypes";

const { Text } = Typography;
const money = new Intl.NumberFormat("vi-VN");

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  delivered: { color: "green", text: "Đã giao" },
  return_requested: { color: "orange", text: "Chờ trả hàng" },
  cancelled: { color: "red", text: "Đã hủy" },
  returned: { color: "blue", text: "Đã trả hàng" },
};

const getName = (
  value: Order["seller"] | Order["customer"] | Order["distributor"],
) => {
  if (!value) return "-";
  if (typeof value === "string")
    return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

const getPhone = (value: Order["customer"] | Order["distributor"]) => {
  if (!value || typeof value === "string") return "-";
  return value.phone || "-";
};

const getAddress = (value: Order["customer"] | Order["distributor"]) => {
  if (!value || typeof value === "string") return "-";
  return value.address || "-";
};

export default function DistributorOrderDetailPage() {
  const { message } = App.useApp();
  const [returnForm] = Form.useForm<{ reason: string }>();
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrderByIdQuery(id);
  const [approveOrder, { isLoading: approving }] = useApproveOrderMutation();
  const [deliverOrder, { isLoading: delivering }] = useDeliverOrderMutation();
  const [requestReturnOrder, { isLoading: requestingReturn }] =
    useRequestReturnOrderMutation();
  const [returnOrder, { isLoading: returning }] = useReturnOrderMutation();
  const isSupplyOrder = order?.orderType === "manufacturer_to_distributor";
  const canRequestReturn = order?.status === "delivered" && !isSupplyOrder;
  const canApproveReturn =
    order?.status === "return_requested" && !isSupplyOrder;

  if (isLoading) return <DistributorDetailLoading />;

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      render: (value: string) => (
        <Text strong className="distributor-detail-strong">
          {value}
        </Text>
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

  const handleExportExcel = () => {
    if (!order) return;
    exportOrderInvoiceExcel({
      order,
      amounts: getOrderAmounts(order),
      issuedBy: "Nhà phân phối",
    });
    message.success(
      isSupplyOrder ? "Đã xuất phiếu đề xuất Excel" : "Đã xuất hóa đơn Excel",
    );
  };

  const handleExportPdf = () => {
    if (!order) return;
    try {
      exportOrderInvoicePdf({
        order,
        amounts: getOrderAmounts(order),
        issuedBy: "Nhà phân phối",
      });
    } catch {
      message.error("Trình duyệt đang chặn cửa sổ in PDF");
    }
  };

  const handleApprove = async () => {
    if (!order) return;
    try {
      await approveOrder(order._id).unwrap();
      message.success("Đã duyệt đơn hàng");
    } catch {
      message.error("Duyệt đơn hàng thất bại");
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    try {
      await deliverOrder(order._id).unwrap();
      message.success("Đã giao đơn hàng");
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      const raw = Array.isArray(detail) ? detail[0] : detail;

      if (raw?.includes("Only approved orders can be delivered")) {
        message.error("Chỉ đơn đã duyệt mới có thể giao hàng.");
        return;
      }

      if (raw?.includes("Distributor can only deliver their own store orders")) {
        message.error("NPP chỉ được giao đơn bán ra tiệm thuộc NPP mình.");
        return;
      }

      message.error(raw || "Giao đơn hàng thất bại");
    }
  };

  const handleOpenReturnModal = () => {
    returnForm.resetFields();
    setReturnModalOpen(true);
  };

  const handleRequestReturn = async () => {
    if (!order) return;
    try {
      const values = await returnForm.validateFields();
      await requestReturnOrder({
        id: order._id,
        body: { reason: values.reason.trim() },
      }).unwrap();
      setReturnModalOpen(false);
      message.success("Đã xác nhận trả hàng và hoàn tiền");
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      const raw = Array.isArray(detail) ? detail[0] : detail;

      if (raw) {
        message.error(raw);
      }
    }
  };

  const handleApproveReturn = async () => {
    if (!order) return;
    try {
      await returnOrder(order._id).unwrap();
      message.success("Đã xác nhận trả hàng và hoàn tiền");
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      const raw = Array.isArray(detail) ? detail[0] : detail;
      message.error(raw || "Xác nhận trả hàng thất bại");
    }
  };

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
              <Flex gap={8} wrap="wrap" align="center">
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                >
                  Xuất Excel
                </Button>
                <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
                  Xuất PDF
                </Button>
                {order.status === "pending" && !isSupplyOrder ? (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={approving}
                    onClick={handleApprove}
                    className="distributor-order-detail-action"
                  >
                    Duyệt đơn
                  </Button>
                ) : null}
                {order.status === "approved" && !isSupplyOrder ? (
                  <Button
                    type="primary"
                    icon={<TruckOutlined />}
                    loading={delivering}
                    onClick={handleDeliver}
                    className="distributor-order-detail-action"
                  >
                    Giao hàng
                  </Button>
                ) : null}
                {canRequestReturn ? (
                  <Button
                    type="primary"
                    icon={<RollbackOutlined />}
                    loading={requestingReturn}
                    onClick={handleOpenReturnModal}
                    className="distributor-order-return-action"
                  >
                    Trả hàng
                  </Button>
                ) : null}
                {canApproveReturn ? (
                  <Button
                    type="primary"
                    icon={<RollbackOutlined />}
                    loading={returning}
                    onClick={handleApproveReturn}
                    className="distributor-order-approve-return-action"
                  >
                    Duyệt trả hàng
                  </Button>
                ) : null}
                <Tag
                  color={statusMap[order.status].color}
                  className="distributor-pill-tag"
                >
                  {statusMap[order.status].text}
                </Tag>
              </Flex>
            }
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Mã đơn">
                {order.orderCode}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusMap[order.status].text}
              </Descriptions.Item>
              <Descriptions.Item label="Luồng đơn">
                {isSupplyOrder ? "Nestlé -> NPP" : "NPP -> Tiệm"}
              </Descriptions.Item>
              <Descriptions.Item
                label={isSupplyOrder ? "Nhà phân phối" : "Khách hàng"}
              >
                {isSupplyOrder
                  ? order.deliveryRecipientName || getName(order.distributor)
                  : getName(order.customer)}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {isSupplyOrder
                  ? order.deliveryPhone || getPhone(order.distributor)
                  : getPhone(order.customer)}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao">
                {isSupplyOrder
                  ? order.deliveryAddress || getAddress(order.distributor)
                  : getAddress(order.customer)}
              </Descriptions.Item>
              {isSupplyOrder && (
                <Descriptions.Item label="Ngày muốn nhận">
                  {order.requestedDeliveryDate
                    ? new Date(order.requestedDeliveryDate).toLocaleDateString(
                        "vi-VN",
                      )
                    : "-"}
                </Descriptions.Item>
              )}
              <Descriptions.Item
                label={isSupplyOrder ? "Nguồn cấp" : "DSR tạo đơn"}
              >
                {isSupplyOrder ? "Nestlé" : getName(order.seller)}
              </Descriptions.Item>
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
              {!isSupplyOrder && (
                <>
                  <Descriptions.Item label="Giá vốn">
                    {money.format(order.totalCost || 0)} đ
                  </Descriptions.Item>
                  <Descriptions.Item label="Lãi gộp">
                    <Text strong className="distributor-dashboard-money">
                      {money.format(order.grossProfit || 0)} đ
                    </Text>
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Ngày tạo">
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {order.note || "-"}
              </Descriptions.Item>
              {order.returnReason && (
                <Descriptions.Item label="Lý do trả hàng">
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
                typeof record.product === "string"
                  ? record.product
                  : record.product._id
              }
              columns={columns}
              dataSource={order.items}
              pagination={false}
              scroll={{ x: 720 }}
            />
          </DistributorDetailCard>

          <OrderPaymentPanel order={order} />

          <Modal
            title="Trả hàng"
            open={returnModalOpen}
            okText="Gửi yêu cầu"
            cancelText="Đóng"
            confirmLoading={requestingReturn}
            onOk={handleRequestReturn}
            onCancel={() => setReturnModalOpen(false)}
            destroyOnHidden
            width={860}
          >
            {order ? (
              <Flex vertical gap={16}>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  title="Thông tin khách hàng"
                >
                  <Descriptions.Item label="Khách hàng">
                    {getName(order.customer)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {getPhone(order.customer)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {getAddress(order.customer)}
                  </Descriptions.Item>
                </Descriptions>

                <Table
                  size="small"
                  title={() => "Sản phẩm trả hàng"}
                  rowKey={(record) =>
                    `${order._id}-return-${
                      typeof record.product === "string"
                        ? record.product
                        : record.product._id
                    }`
                  }
                  columns={columns}
                  dataSource={order.items}
                  pagination={false}
                  scroll={{ x: 720 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Giá trị đơn</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong className="distributor-dashboard-money">
                          {money.format(order.finalAmount)} đ
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </Flex>
            ) : null}
            <Form form={returnForm} layout="vertical">
              <Form.Item
                name="reason"
                label="Lý do trả hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập lý do trả hàng" },
                ]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  placeholder="Nhập lý do cần trả hàng"
                />
              </Form.Item>
            </Form>
          </Modal>

          <style jsx global>{`
            .distributor-content .distributor-order-detail-action.ant-btn-primary,
            .distributor-content
              .distributor-order-detail-action.ant-btn-primary:not(.ant-btn-dangerous) {
              border-color: #2563eb !important;
              background: #2563eb !important;
              color: #ffffff !important;
              box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
            }

            .distributor-content .distributor-order-detail-action.ant-btn-primary:hover,
            .distributor-content
              .distributor-order-detail-action.ant-btn-primary:not(.ant-btn-dangerous):hover {
              border-color: #1d4ed8 !important;
              background: #1d4ed8 !important;
              color: #ffffff !important;
            }

            .distributor-content .distributor-order-return-action.ant-btn-primary {
              border-color: #d97706 !important;
              background: #d97706 !important;
              color: #ffffff !important;
              box-shadow: 0 8px 18px rgba(217, 119, 6, 0.18) !important;
            }

            .distributor-content .distributor-order-return-action.ant-btn-primary:hover {
              border-color: #b45309 !important;
              background: #b45309 !important;
              color: #ffffff !important;
            }

            .distributor-content
              .distributor-order-approve-return-action.ant-btn-primary {
              border-color: #059669 !important;
              background: #059669 !important;
              color: #ffffff !important;
              box-shadow: 0 8px 18px rgba(5, 150, 105, 0.18) !important;
            }

            .distributor-content
              .distributor-order-approve-return-action.ant-btn-primary:hover {
              border-color: #047857 !important;
              background: #047857 !important;
              color: #ffffff !important;
            }
          `}</style>
        </>
      )}
    </DistributorDetailShell>
  );
}





