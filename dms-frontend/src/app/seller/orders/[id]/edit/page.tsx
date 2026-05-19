"use client";

import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import {
  useGetOrderByIdQuery,
  useUpdateOrderMutation,
} from "@/features/orders/orderService";
import type {
  CreateOrderItemRequest,
  Order,
  UpdateOrderRequest,
} from "@/features/orders/orderTypes";
import { useGetProductsQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import { useGetActivePromotionsQuery } from "@/features/promotions/promotionService";
import type { Promotion } from "@/features/promotions/promotionTypes";

const { Text } = Typography;

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  stock: number;
  quantity: number;
  subtotal: number;
};

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
};

const getCustomerId = (customer: Order["customer"]) => {
  if (typeof customer === "string") return customer;
  return customer._id;
};

const getProductId = (product: string | Product) => {
  if (typeof product === "string") return product;
  return product._id;
};

const getPromotionId = (promotion: Order["promotion"]) => {
  if (!promotion) return undefined;
  if (typeof promotion === "string") return promotion;
  return promotion._id;
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

const getPromotionLabel = (promotion: Promotion) => {
  const condition = promotion.minOrderValue
    ? ` - Đơn từ ${promotion.minOrderValue.toLocaleString("vi-VN")} đ`
    : "";

  if (promotion.type === "percent") {
    return `${promotion.name} - Giảm ${
      promotion.discountPercent || 0
    }%${condition}`;
  }

  if (promotion.type === "amount") {
    return `${promotion.name} - Giảm ${(
      promotion.discountAmount || 0
    ).toLocaleString("vi-VN")} đ${condition}`;
  }

  return `${promotion.name} - Tặng sản phẩm${condition}`;
};

export default function SellerEditOrderPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form] = Form.useForm<UpdateOrderRequest>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>();

  const { data: order, isLoading: isOrderLoading } = useGetOrderByIdQuery(id);
  const { data: customers = [] } = useGetMyCustomersQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: promotions = [] } = useGetActivePromotionsQuery();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();

  const approvedCustomers = useMemo(
    () => customers.filter((item) => item.status === "approved" && item.isActive),
    [customers],
  );

  const activeProducts = useMemo(
    () => products.filter((item) => item.isActive && item.stock > 0),
    [products],
  );

  useEffect(() => {
    if (!order) return;

    form.setFieldsValue({
      customer: getCustomerId(order.customer),
      promotion: getPromotionId(order.promotion),
      note: order.note,
    });

    setCartItems(
      order.items.map((item) => {
        const productId = getProductId(item.product);
        const product = products.find((p) => p._id === productId);

        return {
          productId,
          productName: item.productName,
          price: item.price,
          stock: product?.stock ?? item.quantity,
          quantity: item.quantity,
          subtotal: item.subtotal,
        };
      }),
    );
  }, [order, products, form]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/seller/orders");
  };

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    [cartItems],
  );

  const selectedPromotionId = Form.useWatch("promotion", form);
  const selectedPromotion = useMemo(() => {
    const orderPromotion = order?.promotion;
    const populatedPromotion =
      orderPromotion && typeof orderPromotion !== "string"
        ? (orderPromotion as Promotion)
        : undefined;

    return (
      promotions.find((promotion) => promotion._id === selectedPromotionId) ||
      populatedPromotion
    );
  }, [order, promotions, selectedPromotionId]);

  const discountAmount = useMemo(
    () => calculateDiscount(selectedPromotion, totalAmount),
    [selectedPromotion, totalAmount],
  );

  const finalAmount = totalAmount - discountAmount;

  const addProduct = () => {
    if (!selectedProductId) {
      message.warning("Vui lòng chọn sản phẩm");
      return;
    }

    const product = activeProducts.find((item) => item._id === selectedProductId);
    if (!product) {
      message.warning("Sản phẩm không tồn tại hoặc đã hết hàng");
      return;
    }

    if (cartItems.some((item) => item.productId === selectedProductId)) {
      message.warning("Sản phẩm đã tồn tại");
      return;
    }

    setCartItems((prev) => [
      ...prev,
      {
        productId: product._id,
        productName: product.name,
        price: product.price,
        stock: product.stock,
        quantity: 1,
        subtotal: product.price,
      },
    ]);

    setSelectedProductId(undefined);
  };

  const updateQuantity = (productId: string, quantity?: number | null) => {
    const safeQuantity = Number(quantity || 1);
    setCartItems((prev) =>
      prev.map((item) =>
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

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async (values: UpdateOrderRequest) => {
    if (!order) return;
    if (cartItems.length === 0) {
      message.error("Vui lòng chọn sản phẩm");
      return;
    }

    try {
      const items: CreateOrderItemRequest[] = cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      }));

      await updateOrder({
        id,
        body: {
          customer: values.customer,
          promotion: values.promotion ?? null,
          note: values.note,
          items,
        },
      }).unwrap();

      message.success("Cập nhật đơn hàng thành công");
      router.push(`/seller/orders/${id}`);
    } catch {
      message.error("Cập nhật đơn hàng thất bại");
    }
  };

  const columns: ColumnsType<CartItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      width: 280,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="seller-order-edit-product-icon">
            <ShopOutlined />
          </div>
          <Text strong className="seller-order-edit-table-strong">
            {value}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      width: 160,
      render: (value: number) => (
        <Text className="seller-order-edit-table-muted">
          {value.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      width: 120,
      align: "center",
      render: (value: number) => (
        <Tag color="cyan" className="seller-order-edit-count-tag">
          {value}
        </Tag>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 160,
      align: "center",
      render: (value: number, record) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={value}
          onChange={(newValue) => updateQuantity(record.productId, newValue)}
          className="seller-order-edit-quantity"
        />
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      width: 180,
      align: "right",
      render: (value: number) => (
        <Text strong className="seller-order-edit-money">
          {value.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.productId)}
          className="seller-order-edit-icon-button"
        />
      ),
    },
  ];

  if (isOrderLoading) {
    return (
      <>
        <Form form={form} component={false} />
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
          title="Sửa đơn hàng"
          description="Chỉ có thể sửa đơn hàng đang chờ duyệt."
          extra={<Button onClick={handleBack}>Quay lại</Button>}
        />

        <Card variant="borderless" className="seller-order-edit-empty-card">
          <Empty description="Không tìm thấy đơn hàng" />
        </Card>
        <Form form={form} component={false} />
      </>
    );
  }

  const isPending = order.status === "pending";

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Sửa đơn hàng"
        description="Chỉ có thể sửa đơn hàng đang chờ duyệt."
        extra={<Button onClick={handleBack}>Quay lại</Button>}
      />

      <Flex vertical gap={16}>
        {!isPending && (
          <Alert
            type="warning"
            showIcon
            message="Không thể sửa đơn hàng"
            description="Chỉ đơn hàng ở trạng thái chờ duyệt mới được chỉnh sửa."
            className="seller-order-edit-alert"
          />
        )}

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-order-edit-section-title">
                Cập nhật đơn hàng
              </Text>
              <Text className="seller-order-edit-section-description">
                Điều chỉnh khách hàng, khuyến mãi, sản phẩm và tổng thanh toán.
              </Text>
            </Flex>
          }
          className="seller-order-edit-section-card"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={!isPending}
          >
            <Row gutter={[18, 4]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Khách hàng"
                  name="customer"
                  rules={[
                    { required: true, message: "Vui lòng chọn khách hàng" },
                  ]}
                >
                  <Select
                    showSearch
                    size="large"
                    placeholder="Chọn khách hàng"
                    optionFilterProp="label"
                    options={approvedCustomers.map((customer) => ({
                      label: `${customer.name} - ${customer.phone}`,
                      value: customer._id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item label="Khuyến mãi" name="promotion">
                  <Select
                    allowClear
                    showSearch
                    size="large"
                    placeholder="Chọn khuyến mãi"
                    optionFilterProp="label"
                    options={promotions.map((promotion) => ({
                      label: getPromotionLabel(promotion),
                      value: promotion._id,
                      disabled: totalAmount < (promotion.minOrderValue || 0),
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Ghi chú" name="note">
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập ghi chú cho đơn hàng"
                    className="seller-order-edit-textarea"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="seller-order-edit-product-box">
              <Flex vertical gap={4}>
                <Text strong>Danh sách sản phẩm</Text>
                <Text>
                  Thêm hoặc chỉnh số lượng sản phẩm trước khi lưu thay đổi.
                </Text>
              </Flex>
            </div>

            <Flex gap={12} align="center" wrap="wrap">
              <Select
                showSearch
                size="large"
                placeholder="Chọn sản phẩm"
                value={selectedProductId}
                optionFilterProp="label"
                onChange={setSelectedProductId}
                disabled={!isPending}
                className="seller-order-edit-product-select"
                options={activeProducts.map((product) => ({
                  label: `${product.name} - ${product.price.toLocaleString(
                    "vi-VN",
                  )} đ`,
                  value: product._id,
                }))}
              />

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={addProduct}
                disabled={!isPending}
                className="seller-order-edit-add-button"
              >
                Thêm sản phẩm
              </Button>
            </Flex>

            <div className="seller-order-edit-table-wrap">
              <Table
                className="seller-order-edit-table"
                rowKey="productId"
                columns={columns}
                dataSource={cartItems}
                pagination={false}
                scroll={{ x: 1040 }}
                locale={{
                  emptyText: <Empty description="Chưa có sản phẩm trong đơn" />,
                }}
              />
            </div>

            <div className="seller-order-edit-total-panel">
              <Flex justify="space-between" align="center" wrap="wrap" gap={18}>
                <Flex vertical gap={6}>
                  <Text className="seller-order-edit-total-label">
                    Tổng tiền hàng
                  </Text>
                  <Text strong className="seller-order-edit-total-main">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </Text>
                  <Text className="seller-order-edit-discount">
                    Giảm giá: {discountAmount.toLocaleString("vi-VN")} đ
                  </Text>
                  <Text strong className="seller-order-edit-final">
                    Thanh toán: {finalAmount.toLocaleString("vi-VN")} đ
                  </Text>
                </Flex>

                <Flex gap={10} wrap="wrap">
                  <Button
                    onClick={handleBack}
                    className="seller-order-edit-secondary-button"
                  >
                    Hủy
                  </Button>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<ShoppingCartOutlined />}
                    loading={isUpdating}
                    disabled={!isPending}
                    className="seller-order-edit-primary-button"
                  >
                    Cập nhật đơn hàng
                  </Button>
                </Flex>
              </Flex>
            </div>
          </Form>
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-order-edit-empty-card,
        .seller-order-edit-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-order-edit-empty-card {
          margin-top: 16px;
        }

        .seller-order-edit-empty-card .ant-card-body {
          padding: 30px;
        }

        .seller-order-edit-alert.ant-alert {
          border: 1px solid #fde68a;
          border-radius: 14px;
          background: #fffbeb;
        }

        .seller-order-edit-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-order-edit-section-card .ant-card-body {
          padding: 22px;
        }

        .seller-order-edit-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-order-edit-section-description,
        .seller-order-edit-product-box span,
        .seller-order-edit-total-label,
        .seller-order-edit-table-muted {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-order-edit-textarea.ant-input {
          border-color: ${COLORS.border};
          border-radius: 12px;
          resize: vertical;
        }

        .seller-order-edit-product-box,
        .seller-order-edit-total-panel {
          margin: 8px 0 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-order-edit-product-box strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-order-edit-product-select {
          flex: 1;
          min-width: 280px;
        }

        .seller-order-edit-add-button.ant-btn,
        .seller-order-edit-primary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.2);
        }

        .seller-order-edit-add-button.ant-btn:hover,
        .seller-order-edit-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-order-edit-table-wrap {
          margin-top: 18px;
        }

        .seller-order-edit-product-icon {
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

        .seller-order-edit-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-order-edit-count-tag.ant-tag {
          min-width: 48px;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          text-align: center;
        }

        .seller-order-edit-quantity.ant-input-number {
          width: 110px;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-order-edit-icon-button.ant-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
        }

        .seller-order-edit-money {
          color: ${COLORS.primaryHover};
          font-weight: 850;
        }

        .seller-order-edit-total-panel {
          margin-top: 22px;
          margin-bottom: 0;
          background: ${COLORS.surface};
        }

        .seller-order-edit-total-main {
          color: ${COLORS.text};
          font-size: 22px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-order-edit-discount {
          color: ${COLORS.primary};
          font-size: 14px;
          font-weight: 750;
        }

        .seller-order-edit-final {
          color: ${COLORS.primaryHover};
          font-size: 18px;
          font-weight: 850;
        }

        .seller-order-edit-secondary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-order-edit-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-order-edit-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-order-edit-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-order-edit-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }
      `}</style>
    </>
  );
}
