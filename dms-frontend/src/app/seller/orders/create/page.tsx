"use client";

import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App,
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
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import { useCreateOrderMutation } from "@/features/orders/orderService";
import type {
  CreateOrderItemRequest,
  CreateOrderRequest,
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

const findBestPromotion = (promotions: Promotion[], total: number) => {
  const eligiblePromotions = promotions.filter(
    (promotion) => total >= (promotion.minOrderValue || 0),
  );

  if (eligiblePromotions.length === 0) return undefined;

  return eligiblePromotions.reduce((bestPromotion, promotion) => {
    const bestDiscount = calculateDiscount(bestPromotion, total);
    const currentDiscount = calculateDiscount(promotion, total);

    return currentDiscount > bestDiscount ? promotion : bestPromotion;
  }, eligiblePromotions[0]);
};

export default function SellerCreateOrderPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateOrderRequest>();
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const { data: customers = [] } = useGetMyCustomersQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: promotions = [] } = useGetActivePromotionsQuery();
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const approvedCustomers = useMemo(
    () => customers.filter((item) => item.status === "approved" && item.isActive),
    [customers],
  );

  const activeProducts = useMemo(
    () => products.filter((item) => item.isActive && item.stock > 0),
    [products],
  );

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    [cartItems],
  );

  const selectedPromotion = useMemo(
    () => promotions.find((promotion) => promotion._id === selectedPromotionId),
    [promotions, selectedPromotionId],
  );

  const discountAmount = useMemo(
    () => calculateDiscount(selectedPromotion, totalAmount),
    [selectedPromotion, totalAmount],
  );

  const finalAmount = totalAmount - discountAmount;

  useEffect(() => {
    if (totalAmount <= 0) {
      setSelectedPromotionId(undefined);
      return;
    }

    const currentPromotion = promotions.find(
      (promotion) => promotion._id === selectedPromotionId,
    );

    if (
      currentPromotion &&
      totalAmount >= (currentPromotion.minOrderValue || 0)
    ) {
      return;
    }

    const bestPromotionId = findBestPromotion(promotions, totalAmount)?._id;

    if (bestPromotionId !== selectedPromotionId) {
      setSelectedPromotionId(bestPromotionId);
    }
  }, [promotions, selectedPromotionId, totalAmount]);

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

  const updateQuantity = (productId: string, quantity: number | null) => {
    const safeQuantity = quantity || 1;
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

  const handleSubmit = async (values: CreateOrderRequest) => {
    if (cartItems.length === 0) {
      message.error("Vui lòng chọn sản phẩm");
      return;
    }

    try {
      const items: CreateOrderItemRequest[] = cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      }));

      await createOrder({
        customer: values.customer,
        promotion: selectedPromotionId || undefined,
        note: values.note,
        items,
      }).unwrap();

      message.success("Tạo đơn hàng thành công");
      router.push("/seller/orders");
    } catch {
      message.error("Tạo đơn hàng thất bại");
    }
  };

  const columns: ColumnsType<CartItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      width: 280,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="seller-order-form-product-icon">
            <ShopOutlined />
          </div>
          <Text strong className="seller-order-form-table-strong">
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
        <Text className="seller-order-form-table-muted">
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
        <Tag color="cyan" className="seller-order-form-count-tag">
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
          className="seller-order-form-quantity"
        />
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      width: 180,
      align: "right",
      render: (value: number) => (
        <Text strong className="seller-order-form-money">
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
          className="seller-order-form-icon-button"
        />
      ),
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Tạo đơn hàng"
        description="Tạo đơn hàng mới cho khách hàng đã được duyệt."
        extra={<Button onClick={() => router.push("/seller/orders")}>Quay lại</Button>}
      />

      <Card
        variant="borderless"
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-order-form-section-title">
              Thông tin đơn hàng
            </Text>
            <Text className="seller-order-form-section-description">
              Chọn khách hàng, khuyến mãi và sản phẩm trước khi tạo đơn.
            </Text>
          </Flex>
        }
        className="seller-order-form-section-card"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[18, 4]}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="Khách hàng"
                name="customer"
                rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
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
              <Form.Item label="Khuyến mãi">
                <Select
                  allowClear
                  showSearch
                  size="large"
                  placeholder="Chọn khuyến mãi"
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

            <Col xs={24}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập ghi chú cho đơn hàng"
                  className="seller-order-form-textarea"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="seller-order-form-product-box">
            <Flex vertical gap={4}>
              <Text strong>Danh sách sản phẩm</Text>
              <Text>
                Chọn sản phẩm còn hàng và điều chỉnh số lượng trước khi tạo đơn.
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
              className="seller-order-form-product-select"
              options={activeProducts.map((product: Product) => ({
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
              className="seller-order-form-add-button"
            >
              Thêm sản phẩm
            </Button>
          </Flex>

          <div className="seller-order-form-table-wrap">
            <Table
              className="seller-order-form-table"
              rowKey="productId"
              columns={columns}
              dataSource={cartItems}
              pagination={false}
              scroll={{ x: 1040 }}
              locale={{
                emptyText: <Empty description="Chưa chọn sản phẩm nào" />,
              }}
            />
          </div>

          <div className="seller-order-form-total-panel">
            <Flex justify="space-between" align="center" wrap="wrap" gap={18}>
              <Flex vertical gap={6}>
                <Text className="seller-order-form-total-label">
                  Tổng tiền hàng
                </Text>
                <Text strong className="seller-order-form-total-main">
                  {totalAmount.toLocaleString("vi-VN")} đ
                </Text>
                <Text className="seller-order-form-discount">
                  Giảm giá: {discountAmount.toLocaleString("vi-VN")} đ
                </Text>
                <Text strong className="seller-order-form-final">
                  Thanh toán: {finalAmount.toLocaleString("vi-VN")} đ
                </Text>
              </Flex>

              <Flex gap={10} wrap="wrap">
                <Link href="/seller/orders">
                  <Button className="seller-order-form-secondary-button">
                    Hủy
                  </Button>
                </Link>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<ShoppingCartOutlined />}
                  loading={isLoading}
                  className="seller-order-form-primary-button"
                >
                  Tạo đơn hàng
                </Button>
              </Flex>
            </Flex>
          </div>
        </Form>
      </Card>

      <style jsx global>{`
        .seller-order-form-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-order-form-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-order-form-section-card .ant-card-body {
          padding: 22px;
        }

        .seller-order-form-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-order-form-section-description,
        .seller-order-form-product-box span,
        .seller-order-form-total-label,
        .seller-order-form-table-muted {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-order-form-textarea.ant-input {
          border-color: ${COLORS.border};
          border-radius: 12px;
          resize: vertical;
        }

        .seller-order-form-product-box,
        .seller-order-form-total-panel {
          margin: 8px 0 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-order-form-product-box strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-order-form-product-select {
          flex: 1;
          min-width: 280px;
        }

        .seller-order-form-add-button.ant-btn,
        .seller-order-form-primary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.2);
        }

        .seller-order-form-add-button.ant-btn:hover,
        .seller-order-form-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-order-form-table-wrap {
          margin-top: 18px;
        }

        .seller-order-form-product-icon {
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

        .seller-order-form-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-order-form-count-tag.ant-tag {
          min-width: 48px;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          text-align: center;
        }

        .seller-order-form-quantity.ant-input-number {
          width: 110px;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-order-form-icon-button.ant-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
        }

        .seller-order-form-money {
          color: ${COLORS.primaryHover};
          font-weight: 850;
        }

        .seller-order-form-total-panel {
          margin-top: 22px;
          margin-bottom: 0;
          background: ${COLORS.surface};
        }

        .seller-order-form-total-main {
          color: ${COLORS.text};
          font-size: 22px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-order-form-discount {
          color: ${COLORS.primary};
          font-size: 14px;
          font-weight: 750;
        }

        .seller-order-form-final {
          color: ${COLORS.primaryHover};
          font-size: 18px;
          font-weight: 850;
        }

        .seller-order-form-secondary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-order-form-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-order-form-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-order-form-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-order-form-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }
      `}</style>
    </>
  );
}
