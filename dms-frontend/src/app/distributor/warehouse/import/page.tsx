"use client";

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  InboxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import { useCreateOrderMutation } from "@/features/orders/orderService";
import { useGetProductsQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import type { User } from "@/features/users/userTypes";
import { useGetWarehousesQuery } from "@/features/warehouses/warehouseService";

const { Text, Title } = Typography;
const { TextArea } = Input;

const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

type ImportOrderForm = {
  deliveryRecipientName: string;
  deliveryPhone?: string;
  deliveryAddress: string;
  requestedDeliveryDate?: Dayjs;
  note?: string;
};

type ImportItem = {
  product: Product;
  quantity: number;
};

function getDistributor(value?: string | User) {
  return !value || typeof value === "string" ? undefined : value;
}

export default function DistributorWarehouseImportPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<ImportOrderForm>();
  const [productId, setProductId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<ImportItem[]>([]);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: products = [], isLoading: loadingProducts } =
    useGetProductsQuery();
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  const warehouse = warehouses.find(
    (entry) => entry.type === "distributor" && entry.isActive,
  );
  const distributor = getDistributor(warehouse?.distributor);
  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products],
  );
  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!warehouse) return;

    form.setFieldsValue({
      deliveryRecipientName:
        distributor?.companyName || distributor?.fullName || warehouse.name,
      deliveryPhone: distributor?.phone,
      deliveryAddress: distributor?.address,
    });
  }, [distributor, form, warehouse]);

  const addItem = () => {
    const product = activeProducts.find((entry) => entry._id === productId);

    if (!product) {
      message.warning("Vui lòng chọn sản phẩm cần nhập");
      return;
    }

    setItems((previous) => {
      const current = previous.find((item) => item.product._id === product._id);
      if (!current) return [...previous, { product, quantity }];

      return previous.map((item) =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });
    setProductId(undefined);
    setQuantity(1);
  };

  const updateItemQuantity = (productIdToUpdate: string, value: number | null) => {
    const safeQuantity = value || 1;
    setItems((previous) =>
      previous.map((item) =>
        item.product._id === productIdToUpdate
          ? { ...item, quantity: safeQuantity }
          : item,
      ),
    );
  };

  const removeItem = (productIdToRemove: string) => {
    setItems((previous) =>
      previous.filter((item) => item.product._id !== productIdToRemove),
    );
  };

  const submitImportOrder = async (values: ImportOrderForm) => {
    if (!warehouse) {
      message.error("Kho NPP chưa được Admin tạo hoặc đang tạm ngưng");
      return;
    }

    if (!items.length) {
      message.warning("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    try {
      await createOrder({
        orderType: "manufacturer_to_distributor",
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        deliveryRecipientName: values.deliveryRecipientName,
        deliveryPhone: values.deliveryPhone,
        deliveryAddress: values.deliveryAddress,
        requestedDeliveryDate: values.requestedDeliveryDate?.toISOString(),
        note: values.note,
      }).unwrap();

      message.success("Đã gửi đơn nhập hàng cho Admin");
      setItems([]);
      form.resetFields();
      router.push("/distributor/orders?created=supply");
    } catch (error: unknown) {
      message.error(orderApiMessage(error, "Không thể gửi đơn nhập hàng"));
    }
  };

  const columns: ColumnsType<ImportItem> = [
    {
      title: "Sản phẩm",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.product.name}</Text>
          <Text type="secondary">{record.product.code}</Text>
        </Space>
      ),
    },
    {
      title: "Giá cấp",
      align: "right",
      width: 150,
      render: (_, record) => money(record.product.price),
    },
    {
      title: "Số lượng",
      align: "right",
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateItemQuantity(record.product._id, value)}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: "Thành tiền",
      align: "right",
      width: 170,
      render: (_, record) => money(record.product.price * record.quantity),
    },
    {
      title: "",
      align: "center",
      width: 72,
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          className="distributor-row-action distributor-row-action-delete"
          onClick={() => removeItem(record.product._id)}
        />
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Kho NPP"
      title="Nhập hàng"
      description="Lập đơn nhập hàng gửi Admin duyệt và giao về kho NPP."
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/distributor/warehouse")}
        >
          Về kho
        </Button>
      }
    >
      <DistributorCommandCenter
        eyebrow="Đơn nhập kho"
        title="Tạo đơn nhập hàng"
        description="Chọn sản phẩm từ kho chính, kiểm tra tổng giá trị rồi gửi Admin duyệt."
        meterValue={money(total)}
        meterLabel="Tổng giá trị dự kiến"
        stats={[
          { label: "Sản phẩm khả dụng", value: activeProducts.length },
          { label: "Dòng đã chọn", value: items.length },
          { label: "Tổng số lượng", value: totalQuantity },
        ]}
        progressLabel="Hoàn thiện đơn"
        progressValue={`${Number(Boolean(warehouse)) + Number(items.length > 0)}/2`}
        progressPercent={
          ((Number(Boolean(warehouse)) + Number(items.length > 0)) / 2) * 100
        }
        feature={
          <>
            <Text className="distributor-command-feature-label">
              Kho nhận hàng
            </Text>
            <Text className="distributor-command-feature-title">
              {warehouse ? warehouse.name : "Chưa có kho"}
            </Text>
            <div className="distributor-command-feature-meta">
              <span>{warehouse?.code || "Chờ Admin"}</span>
              <span>{warehouse ? "Đang hoạt động" : "Chưa hoạt động"}</span>
            </div>
            <Tag
              color={warehouse ? "green" : "orange"}
              className="distributor-pill-tag"
            >
              {warehouse ? "Có thể gửi đơn" : "Cần kích hoạt kho"}
            </Tag>
          </>
        }
      />

      <DistributorTableCard
        title="Thông tin đơn nhập hàng"
        description="Thông tin nhận hàng, sản phẩm cần nhập và ghi chú gửi Admin."
      >
        <section className="distributor-import-form-shell">
          <div className="distributor-import-form-frame">
            {!warehouse && (
              <Alert
                showIcon
                type="warning"
                className="distributor-import-alert"
                message="Chưa có kho NPP đang hoạt động"
                description="Vui lòng liên hệ Admin tạo hoặc kích hoạt lại kho trước khi lập đơn nhập hàng."
              />
            )}

            {warehouse && (
              <Alert
                showIcon
                type="info"
                className="distributor-import-alert"
                message={`${warehouse.name} - ${warehouse.code}`}
                description="Đơn gửi đi sẽ chờ Admin duyệt. Khi Admin giao hàng, tồn kho NPP mới được cộng."
              />
            )}

            <Form<ImportOrderForm>
              form={form}
              layout="vertical"
              onFinish={submitImportOrder}
            >
              <section className="distributor-import-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-import-section-head"
                >
                  <div>
                    <Text className="distributor-import-section-title">
                      Thông tin nhận hàng
                    </Text>
                    <Text className="distributor-import-section-desc">
                      Thông tin này được gửi kèm đơn để Admin giao hàng về đúng
                      kho NPP.
                    </Text>
                  </div>
                  <Tag color="blue" className="distributor-import-section-tag">
                    Bắt buộc
                  </Tag>
                </Flex>

                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Người nhận / đơn vị nhận"
                      name="deliveryRecipientName"
                      rules={[
                        { required: true, message: "Vui lòng nhập người nhận" },
                      ]}
                    >
                      <Input
                        size="large"
                        disabled={!warehouse}
                        placeholder="Tên NPP hoặc người nhận"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số điện thoại nhận hàng"
                      name="deliveryPhone"
                    >
                      <Input
                        size="large"
                        disabled={!warehouse}
                        placeholder="Số điện thoại liên hệ"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item
                      label="Địa chỉ giao hàng"
                      name="deliveryAddress"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập địa chỉ giao hàng",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        disabled={!warehouse}
                        placeholder="Địa chỉ kho NPP"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Ngày mong muốn nhận"
                      name="requestedDeliveryDate"
                    >
                      <DatePicker
                        size="large"
                        disabled={!warehouse}
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className="distributor-import-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-import-section-head"
                >
                  <div>
                    <Text className="distributor-import-section-title">
                      Sản phẩm nhập hàng
                    </Text>
                    <Text className="distributor-import-section-desc">
                      Chọn sản phẩm từ kho chính và nhập số lượng cần bổ sung.
                    </Text>
                  </div>
                  <Tag color="blue" className="distributor-import-section-tag">
                    {items.length} dòng
                  </Tag>
                </Flex>

                <Flex
                  gap={12}
                  wrap="wrap"
                  align="center"
                  className="distributor-import-add-row"
                >
                  <Select
                    showSearch
                    allowClear
                    size="large"
                    disabled={!warehouse}
                    loading={loadingProducts}
                    value={productId}
                    optionFilterProp="label"
                    placeholder="Chọn sản phẩm từ kho chính"
                    onChange={setProductId}
                    style={{ minWidth: 320, flex: "1 1 360px" }}
                    options={activeProducts.map((product) => ({
                      value: product._id,
                      label: `${product.code} - ${product.name} - ${money(
                        product.price,
                      )} - kho chính ${product.stock}`,
                    }))}
                  />
                  <InputNumber
                    min={1}
                    size="large"
                    disabled={!warehouse}
                    value={quantity}
                    className="distributor-import-quantity-input"
                    onChange={(value) => setQuantity(value || 1)}
                  />
                  <Button
                    type="primary"
                    size="large"
                    disabled={!warehouse || !productId}
                    icon={<PlusOutlined />}
                    onClick={addItem}
                    className="distributor-import-form-action distributor-import-primary-action"
                  >
                    Thêm
                  </Button>
                </Flex>

                <Table<ImportItem>
                  rowKey={(record) => record.product._id}
                  dataSource={items}
                  columns={columns}
                  pagination={false}
                  scroll={{ x: 780 }}
                  className="distributor-import-table"
                  locale={{
                    emptyText: (
                      <Empty description="Chưa có sản phẩm trong đơn" />
                    ),
                  }}
                />
              </section>

              <section className="distributor-import-form-section">
                <Form.Item label="Ghi chú cho Admin" name="note">
                  <TextArea
                    rows={3}
                    disabled={!warehouse}
                    placeholder="Ví dụ: cần giao trong tuần này, ưu tiên sản phẩm sắp hết..."
                  />
                </Form.Item>
              </section>

              <Flex
                justify="space-between"
                align="end"
                wrap="wrap"
                gap={16}
                className="distributor-import-form-footer"
              >
                <Flex
                  align="center"
                  gap={10}
                  className="distributor-import-total"
                >
                  <InboxOutlined />
                  <Space direction="vertical" size={0}>
                    <Text>Tổng số lượng: {totalQuantity.toLocaleString("vi-VN")}</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      Tổng giá trị: {money(total)}
                    </Title>
                  </Space>
                </Flex>

                <Space wrap className="distributor-import-form-actions">
                  <Button
                    size="large"
                    onClick={() => router.push("/distributor/warehouse")}
                    className="distributor-import-form-action"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={creating}
                    disabled={!warehouse || !items.length}
                    className="distributor-import-form-action distributor-import-primary-action"
                  >
                    Gửi đơn nhập hàng
                  </Button>
                </Space>
              </Flex>
            </Form>
          </div>
        </section>
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-import-form-shell {
          margin-top: 18px;
        }

        .distributor-import-form-frame {
          min-height: 260px;
          padding: 20px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
        }

        .distributor-import-alert {
          margin-bottom: 18px;
          border-radius: 8px !important;
        }

        .distributor-import-form-section + .distributor-import-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-import-section-head {
          margin-bottom: 18px;
        }

        .distributor-import-section-title,
        .distributor-import-section-desc {
          display: block;
        }

        .distributor-import-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .distributor-import-section-desc {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .distributor-import-section-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .distributor-import-add-row {
          margin-bottom: 18px;
        }

        .distributor-import-quantity-input {
          width: 140px !important;
        }

        .distributor-import-form-frame .ant-form-item-label > label {
          color: #334155;
          font-weight: 800;
        }

        .distributor-import-form-frame .ant-input,
        .distributor-import-form-frame .ant-input-affix-wrapper,
        .distributor-import-form-frame .ant-select-selector,
        .distributor-import-form-frame .ant-input-number {
          border-radius: 8px !important;
        }

        .distributor-import-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 8px;
        }

        .distributor-import-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-import-total {
          min-height: 48px;
          padding: 10px 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
        }

        .distributor-import-total .anticon {
          color: #2563eb;
        }

        .distributor-import-form-action {
          min-height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        .distributor-content
          .distributor-import-form-frame
          .distributor-import-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .distributor-import-form-frame
          .distributor-import-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):hover,
        .distributor-content
          .distributor-import-form-frame
          .distributor-import-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):focus {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }

        .distributor-content
          .distributor-import-form-frame
          .distributor-import-primary-action.ant-btn.ant-btn-primary[disabled],
        .distributor-content
          .distributor-import-form-frame
          .distributor-import-primary-action.ant-btn.ant-btn-primary.ant-btn-disabled {
          border-color: #bfdbfe !important;
          background: #dbeafe !important;
          color: #64748b !important;
          box-shadow: none !important;
        }

        @media (max-width: 767px) {
          .distributor-import-form-frame {
            padding: 14px;
          }

          .distributor-import-quantity-input,
          .distributor-import-total,
          .distributor-import-form-actions,
          .distributor-import-form-actions .ant-space-item,
          .distributor-import-form-action {
            width: 100% !important;
          }
        }
      `}</style>
    </DistributorPageShell>
  );
}
