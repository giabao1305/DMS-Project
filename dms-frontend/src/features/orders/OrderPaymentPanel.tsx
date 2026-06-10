"use client";

import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  QRCode,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { useAppSelector } from "@/store/hooks";
import type { User } from "@/features/users/userTypes";
import {
  useRecordOrderPaymentMutation,
  useRecordOrderRefundMutation,
  useCreateVnpayPaymentUrlMutation,
} from "./orderService";
import type {
  Order,
  OrderPayment,
  OrderRefund,
  PaymentMethod,
  RecordOrderPaymentRequest,
  RecordOrderRefundRequest,
} from "./orderTypes";

const { Text } = Typography;
const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const paymentLabels = {
  unpaid: { text: "Chưa thu", color: "red" },
  partial: { text: "Thu một phần", color: "gold" },
  paid: { text: "Đã thu đủ", color: "green" },
};

const methodLabels: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  online_qr: "Online QR / VNPay sandbox",
  other: "Khác",
};

function collectorName(value: OrderPayment["collectedBy"]) {
  return typeof value === "string"
    ? "-"
    : (value as User).fullName || (value as User).email;
}

function refunderName(value: OrderRefund["refundedBy"]) {
  return typeof value === "string"
    ? "-"
    : (value as User).fullName || (value as User).email;
}

export default function OrderPaymentPanel({ order }: { order: Order }) {
  const { message } = App.useApp();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [form] = Form.useForm<RecordOrderPaymentRequest>();
  const [refundForm] = Form.useForm<RecordOrderRefundRequest>();
  const [vnpayPaymentUrl, setVnpayPaymentUrl] = useState("");
  const [vnpayTxnRef, setVnpayTxnRef] = useState("");
  const [recordPayment, { isLoading }] = useRecordOrderPaymentMutation();
  const [createVnpayPaymentUrl, { isLoading: creatingVnpayUrl }] =
    useCreateVnpayPaymentUrlMutation();
  const [recordRefund, { isLoading: refunding }] =
    useRecordOrderRefundMutation();
  const selectedPaymentMethod = Form.useWatch("method", form);
  const selectedPaymentAmount = Form.useWatch("amount", form);

  const paidAmount = order.paidAmount || 0;
  const refundedAmount = order.refundedAmount || 0;
  const netCollected = Math.max(paidAmount - refundedAmount, 0);
  const balanceDue =
    order.balanceDue ?? Math.max(order.finalAmount - netCollected, 0);
  const paymentStatus = paymentLabels[order.paymentStatus || "unpaid"];
  const canCollect = order.status === "delivered" && balanceDue > 0;
  const canRefund =
    currentUser?.role !== "seller" &&
    (order.status === "delivered" || order.status === "return_requested") &&
    netCollected > 0;

  useEffect(() => {
    form.setFieldsValue({ amount: balanceDue, method: "cash" });
    refundForm.setFieldsValue({ amount: netCollected, method: "cash" });
  }, [balanceDue, form, netCollected, refundForm]);

  useEffect(() => {
    if (selectedPaymentMethod === "online_qr") {
      form.setFieldValue("note", order.orderCode);
      return;
    }
    setVnpayPaymentUrl("");
    setVnpayTxnRef("");
  }, [form, order.orderCode, selectedPaymentMethod]);

  if (order.orderType === "manufacturer_to_distributor") {
    return (
      <>
        <Form form={form} component={false} />
        <Form form={refundForm} component={false} />
      </>
    );
  }

  const submit = async (values: RecordOrderPaymentRequest) => {
    try {
      await recordPayment({
        id: order._id,
        body:
          values.method === "online_qr"
            ? { ...values, note: values.note || order.orderCode }
            : values,
      }).unwrap();
      form.resetFields();
      message.success("Đã ghi nhận thu tiền");
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      message.error(
        Array.isArray(detail)
          ? detail[0]
          : detail || "Không thể ghi nhận thu tiền",
      );
    }
  };

  const submitRefund = async (values: RecordOrderRefundRequest) => {
    try {
      await recordRefund({ id: order._id, body: values }).unwrap();
      refundForm.resetFields();
      message.success("Đã ghi nhận hoàn tiền");
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      message.error(
        Array.isArray(detail)
          ? detail[0]
          : detail || "Không thể ghi nhận hoàn tiền",
      );
    }
  };

  const createVnpayQr = async () => {
    try {
      const response = await createVnpayPaymentUrl(order._id).unwrap();
      setVnpayPaymentUrl(response.paymentUrl);
      setVnpayTxnRef(response.txnRef);
      form.setFieldsValue({
        amount: response.amount,
        method: "online_qr",
        note: response.orderCode,
      });
      message.success("Đã tạo QR VNPay sandbox");
    } catch (error: unknown) {
      const payload = error as { data?: { message?: string | string[] } };
      const detail = payload.data?.message;
      message.error(
        Array.isArray(detail)
          ? detail[0]
          : detail ||
              "Không thể tạo QR VNPay. Kiểm tra cấu hình sandbox trên backend.",
      );
    }
  };

  const columns: ColumnsType<OrderPayment> = [
    {
      title: "Thời gian",
      dataIndex: "collectedAt",
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "Người thu",
      dataIndex: "collectedBy",
      render: (value) => collectorName(value),
    },
    {
      title: "Hình thức",
      dataIndex: "method",
      render: (value: PaymentMethod) => methodLabels[value],
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      render: (value: number) => money(value),
    },
  ];

  const refundColumns: ColumnsType<OrderRefund> = [
    {
      title: "Thời gian",
      dataIndex: "refundedAt",
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "Người hoàn",
      dataIndex: "refundedBy",
      render: (value) => refunderName(value),
    },
    {
      title: "Hình thức",
      dataIndex: "method",
      render: (value: PaymentMethod) => methodLabels[value],
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      render: (value: number) => money(value),
    },
  ];

  return (
    <Card
      title="Thu tiền và công nợ"
      extra={<Tag color={paymentStatus.color}>{paymentStatus.text}</Tag>}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={12} md={6}>
          <Text type="secondary">Đã thu</Text>
          <div>
            <Text strong>{money(paidAmount)}</Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <Text type="secondary">Đã hoàn</Text>
          <div>
            <Text strong>{money(refundedAmount)}</Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <Text type="secondary">Thực giữ</Text>
          <div>
            <Text strong>{money(netCollected)}</Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <Text type="secondary">Còn nợ</Text>
          <div>
            <Text strong>{money(balanceDue)}</Text>
          </div>
        </Col>
      </Row>

      {canCollect ? (
        <Form
          form={form}
          layout="inline"
          onFinish={submit}
          initialValues={{ amount: balanceDue, method: "cash" }}
          style={{ marginBottom: 18 }}
        >
          <Form.Item
            name="amount"
            rules={[{ required: true, message: "Nhập số tiền" }]}
          >
            <Space.Compact>
              <InputNumber min={1} max={balanceDue} />
              <Button disabled>đ</Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="method" rules={[{ required: true }]}>
            <Select
              style={{ width: 150 }}
              options={Object.entries(methodLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item name="note">
            <Input
              placeholder="Ghi chú thu tiền"
              readOnly={selectedPaymentMethod === "online_qr"}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Ghi nhận thu
          </Button>
        </Form>
      ) : (
        <Form form={form} component={false} />
      )}

      {canCollect && selectedPaymentMethod === "online_qr" ? (
        <Card
          size="small"
          title="QR thanh toán online"
          style={{ marginBottom: 18 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <QRCode
                value={vnpayPaymentUrl || order.orderCode}
                size={168}
                bordered
                status={vnpayPaymentUrl ? "active" : "loading"}
              />
            </Col>
            <Col xs={24} md={16}>
              <Space direction="vertical" size={8}>
                <Text type="secondary">VNPay sandbox / QR chuyển khoản</Text>
                <Text>
                  Số tiền:{" "}
                  <Text strong>
                    {money(Number(selectedPaymentAmount) || balanceDue)}
                  </Text>
                </Text>
                <Text>
                  Nội dung chuyển khoản:{" "}
                  <Text strong copyable>
                    {order.orderCode}
                  </Text>
                </Text>
                {vnpayTxnRef ? (
                  <Text type="secondary">Mã giao dịch: {vnpayTxnRef}</Text>
                ) : null}
                <Text type="secondary">
                  QR này mở cổng VNPay sandbox. Khi VNPay trả kết quả thành
                  công, backend sẽ tự ghi nhận thanh toán nếu callback/IPN truy
                  cập được backend.
                </Text>
                <Space wrap>
                  <Button
                    type="primary"
                    loading={creatingVnpayUrl}
                    onClick={createVnpayQr}
                  >
                    Tạo QR VNPay sandbox
                  </Button>
                  <Button
                    disabled={!vnpayPaymentUrl}
                    onClick={() => {
                      window.open(vnpayPaymentUrl, "_blank", "noopener");
                    }}
                  >
                    Mở trang thanh toán
                  </Button>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>
      ) : null}

      {canRefund ? (
        <Form
          form={refundForm}
          layout="inline"
          onFinish={submitRefund}
          initialValues={{ amount: netCollected, method: "cash" }}
          style={{ marginBottom: 18 }}
        >
          <Form.Item
            name="amount"
            rules={[{ required: true, message: "Nhập số tiền hoàn" }]}
          >
            <Space.Compact>
              <InputNumber min={1} max={netCollected} />
              <Button disabled>đ</Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="method" rules={[{ required: true }]}>
            <Select
              style={{ width: 150 }}
              options={Object.entries(methodLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item name="note">
            <Input placeholder="Ghi chú hoàn tiền" />
          </Form.Item>
          <Button htmlType="submit" loading={refunding}>
            Ghi hoàn tiền
          </Button>
        </Form>
      ) : (
        <Form form={refundForm} component={false} />
      )}

      <Table<OrderPayment>
        rowKey={(record) => `${record.collectedAt}-${record.amount}`}
        columns={columns}
        dataSource={order.payments || []}
        pagination={false}
        locale={{ emptyText: "Chưa có lần thu tiền nào" }}
      />
      <Table<OrderRefund>
        rowKey={(record) => `${record.refundedAt}-${record.amount}`}
        columns={refundColumns}
        dataSource={order.refunds || []}
        pagination={false}
        locale={{ emptyText: "Chưa có lần hoàn tiền nào" }}
        style={{ marginTop: 14 }}
      />
      {netCollected > 0 && (
        <Space style={{ marginTop: 12 }}>
          <Text type="secondary">
            Đơn còn giữ tiền khách cần hoàn hết trước khi trả hàng.
          </Text>
        </Space>
      )}
    </Card>
  );
}
