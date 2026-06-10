"use client";

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
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
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import type { Customer } from "@/features/customers/customerTypes";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import { useCreateOrderMutation } from "@/features/orders/orderService";
import type {
  CreateOrderItemRequest,
  CreateOrderRequest,
} from "@/features/orders/orderTypes";
import { useGetActivePromotionsQuery } from "@/features/promotions/promotionService";
import type { Promotion } from "@/features/promotions/promotionTypes";
import { useGetSellerUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import { useGetSellerWarehouseStocksQuery } from "@/features/warehouses/warehouseService";
import type { WarehouseStock } from "@/features/warehouses/warehouseTypes";

const { Text, Title } = Typography;

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  stock: number;
  quantity: number;
  subtotal: number;
};

const money = new Intl.NumberFormat("vi-VN");

const getUserName = (user?: string | User) => {
  if (!user) return "-";
  if (typeof user === "string") return user;
  return user.fullName || user.companyName || user.email || "-";
};

const getRelationId = (value?: string | { _id: string }) => {
  if (!value) return undefined;
  return typeof value === "string" ? value : value._id;
};

const getPromotionLabel = (promotion: Promotion) => {
  const condition = promotion.minOrderValue
    ? ` - đơn từ ${money.format(promotion.minOrderValue)} đ`
    : "";

  if (promotion.type === "percent") {
    return `${promotion.name} - giảm ${promotion.discountPercent || 0}%${condition}`;
  }

  if (promotion.type === "amount") {
    return `${promotion.name} - giảm ${money.format(
      promotion.discountAmount || 0,
    )} đ${condition}`;
  }

  return `${promotion.name} - tặng sản phẩm${condition}`;
};

const calculateDiscount = (promotion: Promotion | undefined, total: number) => {
  if (!promotion || total < (promotion.minOrderValue || 0)) return 0;

  if (promotion.type === "percent") {
    return Math.min(total, (total * (promotion.discountPercent || 0)) / 100);
  }

  if (promotion.type === "amount") {
    return Math.min(total, promotion.discountAmount || 0);
  }

  return 0;
};

const getStockProduct = (stock: WarehouseStock) =>
  typeof stock.product === "string" ? undefined : stock.product;

export default function DistributorCreateOrderPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateOrderRequest>();
  const [selectedSellerId, setSelectedSellerId] = useState<string>();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const { data: users = [], isLoading: loadingUsers } =
    useGetSellerUsersQuery();
  const { data: customers = [], isLoading: loadingCustomers } =
    useGetMyCustomersQuery();
  const { data: promotions = [] } = useGetActivePromotionsQuery();
  const { data: warehouseStocks = [], isLoading: loadingStocks } =
    useGetSellerWarehouseStocksQuery(selectedSellerId || "", {
      skip: !selectedSellerId,
    });
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  const sellers = useMemo(
    () => users.filter((user) => user.role === "seller" && user.isActive),
    [users],
  );

  const sellerCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const assignedSellerId = getRelationId(customer.assignedSeller);
        return (
          customer.status === "approved" &&
          customer.isActive &&
          assignedSellerId === selectedSellerId
        );
      }),
    [customers, selectedSellerId],
  );

  const activeProducts = useMemo(
    () =>
      warehouseStocks.flatMap((stock) => {
        const product = getStockProduct(stock);
        if (!product || !product.isActive || stock.quantity <= 0) return [];

        return [
          {
            id: product._id,
            name: product.name,
            price: stock.sellingPrice ?? stock.averageCost,
            stock: stock.quantity,
          },
        ];
      }),
    [warehouseStocks],
  );

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const selectedPromotion = promotions.find(
    (promotion) => promotion._id === selectedPromotionId,
  );
  const discountAmount = calculateDiscount(selectedPromotion, totalAmount);
  const finalAmount = Math.max(totalAmount - discountAmount, 0);
  const completedSteps =
    Number(Boolean(selectedSellerId)) +
    Number(Boolean(selectedCustomerId)) +
    Number(cartItems.length > 0);

  const handleSellerChange = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setSelectedCustomerId(undefined);
    setSelectedProductId(undefined);
    setSelectedPromotionId(undefined);
    setCartItems([]);
    form.resetFields(["customer"]);
  };

  const addProduct = () => {
    const product = activeProducts.find((item) => item.id === selectedProductId);

    if (!product) {
      message.warning("Vui lòng chọn sản phẩm còn tồn");
      return;
    }

    if (cartItems.some((item) => item.productId === product.id)) {
      message.warning("Sản phẩm đã có trong đơn");
      return;
    }

    setCartItems((previous) => [
      ...previous,
      {
        productId: product.id,
        productName: product.name,
        price: product.price,
        stock: product.stock,
        quantity: 1,
        subtotal: product.price,
      },
    ]);
    setSelectedProductId(undefined);
  };

  const updateQuantity = (productId: string, quantity: number | null) => {
    const safeQuantity = quantity || 1;
    setCartItems((previous) =>
      previous.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: safeQuantity,
              subtotal: item.price * safeQuantity,
            }
          : item,
      ),
    );
  };

  const removeProduct = (productId: string) => {
    setCartItems((previous) =>
      previous.filter((item) => item.productId !== productId),
    );
  };

  const handleSubmit = async (values: CreateOrderRequest) => {
    if (!selectedSellerId || !selectedCustomerId) {
      message.error("Vui lòng chọn DSR và khách hàng");
      return;
    }

    if (cartItems.length === 0) {
      message.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    try {
      const items: CreateOrderItemRequest[] = cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      }));

      await createOrder({
        orderType: "distributor_to_store",
        seller: selectedSellerId,
        customer: selectedCustomerId,
        promotion: selectedPromotionId || undefined,
        note: values.note,
        items,
      }).unwrap();

      message.success("Tạo đơn thành công");
      router.push("/distributor/orders?created=market");
    } catch (error) {
      message.error(orderApiMessage(error, "Không thể tạo đơn hàng"));
    }
  };

  const columns: ColumnsType<CartItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">Tồn DSR: {money.format(record.stock)}</Text>
        </Space>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      width: 150,
      render: (value: number) => `${money.format(value)} đ`,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 150,
      render: (value: number, record) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={value}
          onChange={(nextValue) => updateQuantity(record.productId, nextValue)}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      width: 160,
      render: (value: number) => <Text strong>{money.format(value)} đ</Text>,
    },
    {
      title: "",
      width: 72,
      align: "center",
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          className="distributor-row-action distributor-row-action-delete"
          onClick={() => removeProduct(record.productId)}
        />
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Đơn hàng"
      title="Tạo đơn"
      description="Tạo đơn bán hàng cho đúng DSR phụ trách, khách hàng đã duyệt và sản phẩm còn tồn trong kho DSR."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Quay lại
        </Button>
      }
    >
      <DistributorCommandCenter
        eyebrow="Đơn bán hàng"
        title="Tạo đơn cho DSR"
        description="Chọn DSR, khách hàng và sản phẩm để tạo đơn nhanh khi cần xử lý từ web NPP."
        meterValue={`${money.format(finalAmount)} đ`}
        meterLabel="Tổng thanh toán dự kiến"
        stats={[
          { label: "DSR khả dụng", value: sellers.length },
          { label: "Khách theo DSR", value: sellerCustomers.length },
          { label: "Sản phẩm đã chọn", value: cartItems.length },
        ]}
        progressLabel="Hoàn thiện đơn"
        progressValue={`${completedSteps}/3`}
        progressPercent={(completedSteps / 3) * 100}
        feature={
          <>
            <Text className="distributor-command-feature-label">
              Quy trình NPP
            </Text>
            <Text className="distributor-command-feature-title">
              Gán đúng DSR
            </Text>
            <div className="distributor-command-feature-meta">
              <span>Khách đã duyệt</span>
              <span>Kho DSR</span>
            </div>
            <Tag color="blue" className="distributor-pill-tag">
              Đơn bán hàng
            </Tag>
          </>
        }
      />

      <DistributorTableCard
        title="Thông tin đơn hàng"
        description="Chọn DSR, khách hàng, sản phẩm và kiểm tra tổng thanh toán trước khi tạo đơn."
      >
        <section className="distributor-order-form-shell">
          <div className="distributor-order-form-frame">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <section className="distributor-order-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-order-section-head"
                >
                  <div>
                    <Text className="distributor-order-section-title">
                      Người bán và khách hàng
                    </Text>
                    <Text className="distributor-order-section-desc">
                      Chọn DSR trước, sau đó chọn khách hàng đã được duyệt
                      thuộc DSR đó.
                    </Text>
                  </div>
                  <Tag color="blue" className="distributor-order-section-tag">
                    Bắt buộc
                  </Tag>
                </Flex>

                <Row gutter={[18, 0]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="DSR phụ trách"
                      name="seller"
                      rules={[{ required: true, message: "Vui lòng chọn DSR" }]}
                    >
                      <Select
                        showSearch
                        size="large"
                        loading={loadingUsers}
                        placeholder="Chọn DSR"
                        optionFilterProp="label"
                        onChange={handleSellerChange}
                        options={sellers.map((seller) => ({
                          label: getUserName(seller),
                          value: seller._id,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Khách hàng"
                      name="customer"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn khách hàng",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        size="large"
                        loading={loadingCustomers}
                        disabled={!selectedSellerId}
                        placeholder="Chọn khách đã gán cho DSR"
                        optionFilterProp="label"
                        onChange={setSelectedCustomerId}
                        options={sellerCustomers.map((customer: Customer) => ({
                          label: `${customer.name} - ${customer.phone}`,
                          value: customer._id,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Khuyến mãi">
                      <Select
                        allowClear
                        showSearch
                        size="large"
                        placeholder="Tự chọn nếu áp dụng"
                        optionFilterProp="label"
                        value={selectedPromotionId}
                        onChange={setSelectedPromotionId}
                        options={promotions.map((promotion) => ({
                          label: getPromotionLabel(promotion),
                          value: promotion._id,
                          disabled: totalAmount < (promotion.minOrderValue || 0),
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Ghi chú" name="note">
                  <Input.TextArea
                    rows={3}
                    placeholder="Ví dụ: NPP tạo đơn từ web theo yêu cầu xử lý"
                  />
                </Form.Item>
              </section>

              <section className="distributor-order-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-order-section-head"
                >
                  <div>
                    <Text className="distributor-order-section-title">
                      Sản phẩm trong đơn
                    </Text>
                    <Text className="distributor-order-section-desc">
                      Thêm sản phẩm từ kho DSR và điều chỉnh số lượng theo tồn
                      hiện có.
                    </Text>
                  </div>
                  <Tag
                    color={selectedSellerId ? "blue" : "default"}
                    className="distributor-order-section-tag"
                  >
                    {selectedSellerId
                      ? `${activeProducts.length} sản phẩm còn tồn`
                      : "Chưa chọn DSR"}
                  </Tag>
                </Flex>

                <Flex
                  gap={12}
                  wrap="wrap"
                  align="center"
                  className="distributor-order-add-row"
                >
                  <Select
                    showSearch
                    size="large"
                    loading={loadingStocks}
                    disabled={!selectedSellerId}
                    placeholder="Chọn sản phẩm trong kho DSR"
                    optionFilterProp="label"
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    style={{ minWidth: 320, flex: "1 1 360px" }}
                    options={activeProducts.map((product) => ({
                      label: `${product.name} - ${money.format(
                        product.price,
                      )} đ - tồn ${money.format(product.stock)}`,
                      value: product.id,
                    }))}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    disabled={!selectedProductId}
                    onClick={addProduct}
                    className="distributor-order-form-action distributor-order-primary-action"
                  >
                    Thêm
                  </Button>
                </Flex>

                <Table
                  rowKey="productId"
                  columns={columns}
                  dataSource={cartItems}
                  pagination={false}
                  scroll={{ x: 760 }}
                  className="distributor-order-form-table"
                  locale={{ emptyText: <Empty description="Chưa có sản phẩm" /> }}
                />
              </section>

              <Flex
                justify="space-between"
                align="end"
                wrap="wrap"
                gap={16}
                className="distributor-order-form-footer"
              >
                <Flex
                  align="center"
                  gap={10}
                  className="distributor-order-form-note"
                >
                  <TeamOutlined />
                  <Space direction="vertical" size={0}>
                    <Text>Tạm tính: {money.format(totalAmount)} đ</Text>
                    <Text>Giảm giá: {money.format(discountAmount)} đ</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      Tổng thanh toán: {money.format(finalAmount)} đ
                    </Title>
                  </Space>
                </Flex>

                <Space wrap className="distributor-order-form-actions">
                  <Button
                    size="large"
                    onClick={() => router.push("/distributor/orders")}
                    className="distributor-order-form-action"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={creating}
                    disabled={cartItems.length === 0}
                    className="distributor-order-form-action distributor-order-primary-action"
                  >
                    Tạo đơn
                  </Button>
                </Space>
              </Flex>
            </Form>
          </div>
        </section>
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-order-form-shell {
          margin-top: 18px;
        }

        .distributor-order-form-frame {
          min-height: 260px;
          padding: 20px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
        }

        .distributor-order-form-section + .distributor-order-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-order-section-head {
          margin-bottom: 18px;
        }

        .distributor-order-section-title,
        .distributor-order-section-desc {
          display: block;
        }

        .distributor-order-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .distributor-order-section-desc {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .distributor-order-section-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .distributor-order-add-row {
          margin-bottom: 18px;
        }

        .distributor-order-form-frame .ant-form-item-label > label {
          color: #334155;
          font-weight: 800;
        }

        .distributor-order-form-frame .ant-input,
        .distributor-order-form-frame .ant-input-affix-wrapper,
        .distributor-order-form-frame .ant-select-selector,
        .distributor-order-form-frame .ant-input-number {
          border-radius: 8px !important;
        }

        .distributor-order-form-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 8px;
        }

        .distributor-order-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-order-form-note {
          min-height: 48px;
          padding: 10px 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
        }

        .distributor-order-form-note .anticon {
          color: #2563eb;
        }

        .distributor-order-form-action {
          min-height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        .distributor-content
          .distributor-order-form-frame
          .distributor-order-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .distributor-order-form-frame
          .distributor-order-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):hover,
        .distributor-content
          .distributor-order-form-frame
          .distributor-order-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):focus {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }

        .distributor-content
          .distributor-order-form-frame
          .distributor-order-primary-action.ant-btn.ant-btn-primary[disabled],
        .distributor-content
          .distributor-order-form-frame
          .distributor-order-primary-action.ant-btn.ant-btn-primary.ant-btn-disabled {
          border-color: #bfdbfe !important;
          background: #dbeafe !important;
          color: #64748b !important;
          box-shadow: none !important;
        }

        @media (max-width: 767px) {
          .distributor-order-form-frame {
            padding: 14px;
          }

          .distributor-order-form-note,
          .distributor-order-form-actions,
          .distributor-order-form-actions .ant-space-item,
          .distributor-order-form-action {
            width: 100%;
          }
        }
      `}</style>
    </DistributorPageShell>
  );
}
