"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  RollbackOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { getOrderAmounts } from "@/features/orders/orderAmounts";
import {
  exportOrderInvoiceExcel,
  exportOrderInvoicePdf,
} from "@/features/orders/orderInvoiceExport";
import {
  useGetOrderByIdQuery,
  useRequestReturnOrderMutation,
} from "@/features/orders/orderService";
import type { Order, OrderItem, OrderStatus } from "@/features/orders/orderTypes";
import { useGetPromotionByIdQuery } from "@/features/promotions/promotionService";

const { Text } = Typography;
const { TextArea } = Input;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
};

const statusMap: Record<
  OrderStatus,
  { color: string; text: string; icon: ReactNode }
> = {
  pending: {
    color: "gold",
    text: "Chờ duyệt",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    color: "green",
    text: "Đã duyệt",
    icon: <CheckCircleOutlined />,
  },
  delivered: {
    color: "blue",
    text: "Đã giao",
    icon: <ShoppingCartOutlined />,
  },
  return_requested: {
    color: "orange",
    text: "Chờ admin duyệt trả hàng",
    icon: <ClockCircleOutlined />,
  },
  cancelled: {
    color: "red",
    text: "Đã hủy",
    icon: <CloseCircleOutlined />,
  },
  returned: {
    color: "purple",
    text: "Đã trả hàng",
    icon: <CloseCircleOutlined />,
  },
};

const getCustomerName = (customer: Order["customer"]) => {
  if (typeof customer === "string") return /^[a-f\d]{24}$/i.test(customer) ? "-" : customer;
  return customer?.name || "-";
};

export default function SellerOrderDetailPage() {
  const { message } = App.useApp();
  const [returnForm] = Form.useForm<{ reason: string }>();
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: order, isLoading } = useGetOrderByIdQuery(id);
  const promotionId =
    order && typeof order.promotion === "string" ? order.promotion : "";
  const { data: resolvedPromotion } = useGetPromotionByIdQuery(promotionId, {
    skip: !promotionId,
  });
  const [requestReturnOrder, { isLoading: requestingReturn }] =
    useRequestReturnOrderMutation();

  const handleReturnRequest = async () => {
    try {
      const values = await returnForm.validateFields();
      await requestReturnOrder({
        id,
        body: { reason: values.reason.trim() },
      }).unwrap();
      setIsReturnModalOpen(false);
      returnForm.resetFields();
      message.success("Đã gửi yêu cầu trả hàng, vui lòng chờ admin duyệt");
    } catch (error: unknown) {
      if (typeof error === "object" && error && "errorFields" in error) {
        return;
      }
      message.error("Gửi yêu cầu trả hàng thất bại");
    }
  };

  if (isLoading) {
    return (
      <>
        <Form form={returnForm} component={false} />
        <Flex align="center" justify="center" style={{ minHeight: 360 }}>
          <Spin size="large" />
        </Flex>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <SellerBreadcrumb />

        <SellerPageHeader
          title="Chi tiết đơn hàng"
          description="Xem thông tin đơn hàng, sản phẩm và tổng thanh toán."
          extra={
            <Link href="/seller/orders">
              <Button>Quay lại</Button>
            </Link>
          }
        />

        <Card variant="borderless" className="seller-order-detail-empty-card">
          <Empty description="Không tìm thấy đơn hàng" />
        </Card>
        <Form form={returnForm} component={false} />
      </>
    );
  }

  const currentStatus = statusMap[order.status] ?? statusMap.pending;
  const amounts = getOrderAmounts(order, resolvedPromotion);
  const customerName = getCustomerName(order.customer);
  const invoiceExportOptions = {
    order,
    amounts,
    customerName,
    issuedBy: "Seller",
  };

  const handleExportExcel = () => {
    exportOrderInvoiceExcel(invoiceExportOptions);
    message.success("Đã xuất hóa đơn Excel");
  };

  const handleExportPdf = () => {
    try {
      exportOrderInvoicePdf(invoiceExportOptions);
    } catch {
      message.error("Trình duyệt đang chặn cửa sổ in PDF");
    }
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      width: 300,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="seller-order-detail-product-icon">
            <ShopOutlined />
          </div>
          <Text strong className="seller-order-detail-table-strong">
            {value}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      align: "center",
      render: (value: number) => (
        <Tag color="cyan" className="seller-order-detail-count-tag">
          {value}
        </Tag>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      width: 180,
      align: "right",
      render: (value: number) => (
        <Text className="seller-order-detail-table-muted">
          {value.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      width: 200,
      align: "right",
      render: (value: number) => (
        <Text strong className="seller-order-detail-money">
          {value.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Chi tiết đơn hàng"
        description="Xem thông tin đơn hàng, sản phẩm và tổng thanh toán."
        extra={
          <Flex gap={10} wrap="wrap">
            <Link href="/seller/orders">
              <Button>Quay lại</Button>
            </Link>
            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
              Xuất Excel
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
              Xuất PDF
            </Button>

            {order.status === "pending" && (
              <Link href={`/seller/orders/${order._id}/edit`}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  className="seller-order-detail-primary-button"
                >
                  Sửa đơn hàng
                </Button>
              </Link>
            )}

            {order.status === "delivered" && (
              <Button
                type="primary"
                icon={<RollbackOutlined />}
                loading={requestingReturn}
                onClick={() => setIsReturnModalOpen(true)}
                className="seller-order-detail-primary-button"
              >
                Trả hàng
              </Button>
            )}
          </Flex>
        }
      />

      <Flex vertical gap={20}>
        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-order-detail-section-title">
                {order.orderCode}
              </Text>
              <Text className="seller-order-detail-section-description">
                Mã đơn, khách hàng, trạng thái và các mốc thời gian xử lý.
              </Text>
            </Flex>
          }
          extra={
            <Tag
              color={currentStatus.color}
              icon={currentStatus.icon}
              className="seller-order-detail-status-tag"
            >
              {currentStatus.text}
            </Tag>
          }
          className="seller-order-detail-section-card"
        >
          <div className="seller-order-detail-summary-grid">
            <div>
              <span>Tổng tiền hàng</span>
              <strong>{amounts.totalAmount.toLocaleString("vi-VN")} đ</strong>
            </div>
            <div>
              <span>Giảm giá</span>
              <strong>{amounts.discountAmount.toLocaleString("vi-VN")} đ</strong>
            </div>
            <div>
              <span>Thanh toán</span>
              <strong>{amounts.finalAmount.toLocaleString("vi-VN")} đ</strong>
            </div>
          </div>

          <Descriptions
            bordered
            column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
            styles={{
              label: {
                width: 180,
                color: COLORS.secondary,
                fontWeight: 750,
                background: COLORS.surface,
              },
              content: {
                color: COLORS.text,
                fontWeight: 650,
                background: "#FFFFFF",
              },
            }}
          >
            <Descriptions.Item label="Mã đơn hàng">
              <Text strong>{order.orderCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {customerName}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={currentStatus.color}
                icon={currentStatus.icon}
                className="seller-order-detail-status-tag"
              >
                {currentStatus.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khuyến mãi">
              {amounts.promotion?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày duyệt">
              {order.approvedAt
                ? new Date(order.approvedAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày giao">
              {order.deliveredAt
                ? new Date(order.deliveredAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày trả hàng">
              {order.returnedAt
                ? new Date(order.returnedAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span="filled">
              <Text
                className={
                  order.note
                    ? "seller-order-detail-note"
                    : "seller-order-detail-empty-text"
                }
              >
                {order.note || "-"}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-order-detail-section-title">
                Sản phẩm trong đơn
              </Text>
              <Text className="seller-order-detail-section-description">
                Danh sách mặt hàng, số lượng và giá trị từng dòng.
              </Text>
            </Flex>
          }
          className="seller-order-detail-section-card"
        >
          <Table
            className="seller-order-detail-table"
            rowKey={(record) =>
              typeof record.product === "string"
                ? record.product
                : record.product._id
            }
            columns={columns}
            dataSource={order.items}
            pagination={false}
            scroll={{ x: 860 }}
            locale={{
              emptyText: <Empty description="Đơn hàng chưa có sản phẩm" />,
            }}
          />
        </Card>
      </Flex>

      <Modal
        title="Xác nhận yêu cầu trả hàng"
        open={isReturnModalOpen}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        confirmLoading={requestingReturn}
        className="seller-return-modal"
        onOk={handleReturnRequest}
        onCancel={() => {
          setIsReturnModalOpen(false);
          returnForm.resetFields();
        }}
        forceRender
      >
        <div className="seller-return-modal-summary">
          <div>
            <span>Mã đơn</span>
            <strong>{order.orderCode}</strong>
          </div>
          <div>
            <span>Khách hàng</span>
            <strong>{customerName}</strong>
          </div>
          <div>
            <span>Thanh toán</span>
            <strong>{amounts.finalAmount.toLocaleString("vi-VN")} đ</strong>
          </div>
        </div>

        <Table<OrderItem>
          size="small"
          pagination={false}
          rowKey={(record) =>
            typeof record.product === "string"
              ? record.product
              : record.product._id
          }
          className="seller-return-modal-table"
          dataSource={order.items}
          columns={[
            {
              title: "Sản phẩm",
              dataIndex: "productName",
              render: (value: string) => <Text strong>{value}</Text>,
            },
            {
              title: "SL",
              dataIndex: "quantity",
              width: 72,
              align: "center",
            },
            {
              title: "Thành tiền",
              dataIndex: "subtotal",
              width: 132,
              align: "right",
              render: (value: number) => `${value.toLocaleString("vi-VN")} đ`,
            },
          ]}
        />

        <Form form={returnForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Lý do trả hàng"
            name="reason"
            rules={[
              { required: true, message: "Vui lòng nhập lý do trả hàng" },
              { max: 500, message: "Lý do không vượt quá 500 ký tự" },
            ]}
          >
            <TextArea
              rows={4}
              showCount
              maxLength={500}
              placeholder="Nhập tình trạng hàng, lý do khách trả hoặc ghi chú cần admin xác nhận"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .seller-order-detail-empty-card,
        .seller-order-detail-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-order-detail-empty-card {
          margin-top: 16px;
        }

        .seller-order-detail-empty-card .ant-card-body {
          padding: 30px;
        }

        .seller-order-detail-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-order-detail-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-order-detail-section-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-order-detail-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-order-detail-summary-grid {
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-order-detail-summary-grid > div {
          padding: 14px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-order-detail-summary-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-order-detail-summary-grid strong {
          display: block;
          margin-top: 4px;
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
          line-height: 1.15;
        }

        .seller-order-detail-status-tag.ant-tag,
        .seller-order-detail-count-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
          text-align: center;
        }

        .seller-order-detail-count-tag.ant-tag {
          min-width: 44px;
        }

        .seller-order-detail-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-order-detail-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-order-detail-product-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border-radius: 12px;
          background: ${COLORS.surface};
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-order-detail-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-order-detail-table-muted {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-order-detail-money {
          color: ${COLORS.primaryHover};
          font-weight: 850;
        }

        .seller-order-detail-note {
          color: ${COLORS.text};
          line-height: 1.65;
        }

        .seller-order-detail-empty-text {
          color: #9caeaa;
          line-height: 1.65;
        }

        .seller-order-detail-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-order-detail-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-order-detail-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-order-detail-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }

        .seller-return-modal .ant-modal-content {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 24px 60px rgba(11, 47, 42, 0.16);
        }

        .seller-return-modal .ant-modal-header {
          margin: 0;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-return-modal .ant-modal-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-return-modal .ant-modal-body {
          padding: 20px 22px 10px;
        }

        .seller-return-modal .ant-modal-footer {
          margin-top: 0;
          padding: 12px 22px 20px;
        }

        .seller-return-modal .ant-form-item-label > label {
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 800;
        }

        .seller-return-modal-summary {
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-return-modal-summary > div {
          min-width: 0;
          padding: 12px;
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
          background: ${COLORS.surface};
        }

        .seller-return-modal-summary span {
          display: block;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
        }

        .seller-return-modal-summary strong {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .seller-return-modal-table {
          margin-bottom: 16px;
        }

        .seller-return-modal-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
        }

        .seller-return-modal-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 12px !important;
          font-weight: 850 !important;
        }

        .seller-return-modal-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom-color: #ecf6f3 !important;
        }

        .seller-return-modal .ant-input {
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          line-height: 1.6;
        }

        .seller-return-modal .ant-input:hover,
        .seller-return-modal .ant-input:focus {
          border-color: ${COLORS.primary};
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
        }

        .seller-return-modal .ant-input-data-count {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 650;
        }

        .seller-return-modal .ant-btn {
          height: 38px;
          border-radius: 10px;
          font-weight: 800;
        }

        .seller-return-modal .ant-btn-default {
          border-color: ${COLORS.border};
          background: #ffffff;
          color: ${COLORS.text};
        }

        .seller-return-modal .ant-btn-default:hover {
          border-color: ${COLORS.primary} !important;
          background: ${COLORS.surface} !important;
          color: ${COLORS.primaryHover} !important;
        }

        .seller-return-modal .ant-btn-primary {
          border-color: ${COLORS.primary};
          background: ${COLORS.primary};
          box-shadow: 0 12px 24px rgba(13, 148, 136, 0.18);
        }

        .seller-return-modal .ant-btn-primary:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        @media (max-width: 900px) {
          .seller-order-detail-summary-grid {
            grid-template-columns: 1fr;
          }

          .seller-return-modal-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
