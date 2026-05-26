"use client";

import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
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
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { isSalesRepRole } from "@/features/auth/roleUtils";
import { useGetCustomersQuery } from "@/features/customers/customerService";
import type { Customer } from "@/features/customers/customerTypes";
import {
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useUpdateOrderMutation,
} from "@/features/orders/orderService";
import type {
  CreateOrderRequest,
  OrderItem,
  UpdateOrderRequest,
} from "@/features/orders/orderTypes";
import { useGetProductsQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import { useGetActivePromotionsQuery } from "@/features/promotions/promotionService";
import type { Promotion } from "@/features/promotions/promotionTypes";
import { useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";

const { Text } = Typography;

type OrderFormMode = "create" | "edit";

type OrderFormValues = {
  seller: string;
  customer: string;
  promotion?: string;
  note?: string;
};

type SelectedItem = {
  product: Product;
  quantity: number;
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

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
    ? ` - Đơn từ ${money(promotion.minOrderValue)}`
    : "";

  if (promotion.type === "percent") {
    return `${promotion.name} - Giảm ${promotion.discountPercent || 0}%${condition}`;
  }

  if (promotion.type === "amount") {
    return `${promotion.name} - Giảm ${money(promotion.discountAmount || 0)}${condition}`;
  }

  return `${promotion.name} - Tặng sản phẩm${condition}`;
};

const getPromotionId = (promotion: string | Promotion | undefined) => {
  if (!promotion) return undefined;
  return typeof promotion === "string" ? promotion : promotion._id;
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

const getOrderRelationId = (value: string | { _id: string }) =>
  typeof value === "string" ? value : value._id;

export default function OrderFormPage({ mode }: { mode: OrderFormMode }) {
  const isEdit = mode === "edit";
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<OrderFormValues>();

  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<SelectedItem[]>([]);

  const { data: order, isLoading: loadingOrder } = useGetOrderByIdQuery(
    id || "",
    { skip: !isEdit || !id },
  );
  const { data: users = [] } = useGetUsersQuery();
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: promotions = [] } = useGetActivePromotionsQuery();
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateOrderMutation();

  const selectedSellerId = Form.useWatch("seller", form);
  const selectedPromotionId = Form.useWatch("promotion", form);

  const sellers = useMemo(
    () => users.filter((user) => isSalesRepRole(user.role) && user.isActive),
    [users],
  );

  const filteredCustomers = useMemo(() => {
    if (!selectedSellerId) return [];

    return customers.filter((customer) => {
      if (!customer.isActive || customer.status !== "approved") return false;

      const assignedSellerId =
        typeof customer.assignedSeller === "string"
          ? customer.assignedSeller
          : customer.assignedSeller?._id;

      return assignedSellerId === selectedSellerId;
    });
  }, [customers, selectedSellerId]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products],
  );

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [items],
  );

  const selectedPromotion = useMemo(() => {
    const orderPromotion =
      order?.promotion && typeof order.promotion !== "string"
        ? (order.promotion as Promotion)
        : undefined;

    return (
      promotions.find((promotion) => promotion._id === selectedPromotionId) ||
      orderPromotion
    );
  }, [order, promotions, selectedPromotionId]);

  const discountAmount = useMemo(
    () => calculateDiscount(selectedPromotion, totalAmount),
    [selectedPromotion, totalAmount],
  );
  const finalAmount = totalAmount - discountAmount;

  useEffect(() => {
    if (isEdit || totalAmount <= 0) return;

    const currentPromotion = promotions.find(
      (promotion) => promotion._id === selectedPromotionId,
    );

    if (
      currentPromotion &&
      totalAmount >= (currentPromotion.minOrderValue || 0)
    ) {
      return;
    }

    form.setFieldValue(
      "promotion",
      findBestPromotion(promotions, totalAmount)?._id,
    );
  }, [form, isEdit, promotions, selectedPromotionId, totalAmount]);

  useEffect(() => {
    if (!isEdit || !order || products.length === 0) return;

    form.setFieldsValue({
      seller: getOrderRelationId(order.seller as string | User),
      customer: getOrderRelationId(order.customer as string | Customer),
      promotion: getPromotionId(order.promotion),
      note: order.note,
    });

    const mappedItems = order.items
      .map((item: OrderItem) => {
        const productId =
          typeof item.product === "string" ? item.product : item.product._id;
        const product = products.find((entry) => entry._id === productId);

        if (!product) return null;

        return {
          product,
          quantity: item.quantity,
        };
      })
      .filter(Boolean) as SelectedItem[];

    setItems(mappedItems);
  }, [form, isEdit, order, products]);

  const handleAddItem = () => {
    if (!selectedProductId) {
      message.warning("Vui lòng chọn sản phẩm");
      return;
    }

    if (quantity < 1) {
      message.warning("Số lượng phải lớn hơn 0");
      return;
    }

    const product = products.find((item) => item._id === selectedProductId);

    if (!product) {
      message.warning("Sản phẩm không tồn tại");
      return;
    }

    setItems((previous) => {
      const existedItem = previous.find(
        (item) => item.product._id === product._id,
      );

      if (!existedItem) {
        return [...previous, { product, quantity }];
      }

      return previous.map((item) =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });

    setSelectedProductId(undefined);
    setQuantity(1);
  };

  const handleChangeQuantity = (productId: string, value: number | null) => {
    setItems((previous) =>
      previous.map((item) =>
        item.product._id === productId
          ? { ...item, quantity: value || 1 }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((previous) =>
      previous.filter((item) => item.product._id !== productId),
    );
  };

  const handleSubmit = async (values: OrderFormValues) => {
    try {
      if (items.length === 0) {
        message.warning("Vui lòng thêm ít nhất 1 sản phẩm");
        return;
      }

      const body: CreateOrderRequest | UpdateOrderRequest = {
        seller: values.seller,
        customer: values.customer,
        items: items.map((item) => ({
          product: item.product._id,
          quantity: Number(item.quantity),
        })),
        promotion: values.promotion || undefined,
        note: values.note || undefined,
      };

      if (isEdit && id) {
        await updateOrder({
          id,
          body: {
            ...body,
            promotion: values.promotion ?? null,
          },
        }).unwrap();
        message.success("Cập nhật đơn hàng thành công");
        router.push(`/admin/orders/${id}`);
        return;
      }

      await createOrder(body as CreateOrderRequest).unwrap();
      message.success("Tạo đơn hàng thành công");
      router.push("/admin/orders");
    } catch (error: unknown) {

      const err = error as {
        data?: {
          message?: string | string[];
        };
      };

      message.error(
        Array.isArray(err?.data?.message)
          ? err.data.message[0]
          : err?.data?.message ||
              (isEdit ? "Cập nhật đơn hàng thất bại" : "Tạo đơn hàng thất bại"),
      );
    }
  };

  if (isEdit && loadingOrder) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa đơn hàng"
          description="Chỉnh sửa đơn hàng khi chưa xác nhận."
          extra={
            <Button onClick={() => router.push("/admin/orders")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-order-form-frame is-loading" />
      </>
    );
  }

  if (isEdit && !order) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa đơn hàng"
          description="Chỉnh sửa đơn hàng khi chưa xác nhận."
          extra={
            <Button onClick={() => router.push("/admin/orders")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-order-form-frame">
          <Empty description="Không tìm thấy đơn hàng" />
        </div>
      </>
    );
  }

  if (isEdit && order?.status !== "pending") {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Không thể sửa đơn hàng"
          description="Chỉ đơn hàng chờ xác nhận mới được chỉnh sửa."
          extra={
            <Button onClick={() => router.push("/admin/orders")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-order-form-frame">
          <Text type="secondary">
            Đơn hàng hiện tại không còn ở trạng thái chờ xác nhận.
          </Text>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={isEdit ? `Sửa đơn hàng ${order?.orderCode}` : "Tạo đơn hàng"}
        description={
          isEdit
            ? "Điều chỉnh seller, khách hàng, sản phẩm và ghi chú của đơn hàng."
            : "Admin tạo đơn hàng cho seller và khách hàng."
        }
        extra={
          <Button onClick={() => router.push("/admin/orders")}>Quay lại</Button>
        }
      />

      <section className="admin-order-form-shell">
        <div className="admin-order-form-frame">
          <Form<OrderFormValues>
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <section className="admin-order-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-order-form-section-head"
              >
                <div>
                  <Text className="admin-order-form-section-title">
                    Người bán và khách hàng
                  </Text>
                  <Text className="admin-order-form-section-desc">
                    Chọn seller trước để lọc danh sách khách hàng phụ trách.
                  </Text>
                </div>
                <Tag color="blue" className="admin-order-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Nhân viên bán hàng"
                    name="seller"
                    rules={[
                      { required: true, message: "Vui lòng chọn nhân viên" },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                      allowClear
                      placeholder="Chọn seller"
                      optionFilterProp="label"
                      onChange={() => form.setFieldValue("customer", undefined)}
                      options={sellers.map((seller) => ({
                        label: `${seller.fullName} - ${seller.email}`,
                        value: seller._id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Khách hàng"
                    name="customer"
                    rules={[
                      { required: true, message: "Vui lòng chọn khách hàng" },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                      allowClear
                      disabled={!selectedSellerId}
                      placeholder={
                        selectedSellerId
                          ? "Chọn khách hàng"
                          : "Vui lòng chọn seller trước"
                      }
                      optionFilterProp="label"
                      options={filteredCustomers.map((customer) => ({
                        label: `${customer.name} - ${customer.phone}`,
                        value: customer._id,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className="admin-order-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-order-form-section-head"
              >
                <div>
                  <Text className="admin-order-form-section-title">
                    Sản phẩm trong đơn
                  </Text>
                  <Text className="admin-order-form-section-desc">
                    Thêm sản phẩm, số lượng và kiểm tra tổng thanh toán.
                  </Text>
                </div>
                <Tag color="cyan" className="admin-order-form-section-tag">
                  {items.length} sản phẩm
                </Tag>
              </Flex>

              <Row gutter={[12, 12]} align="middle" className="admin-order-add-row">
                <Col xs={24} md={14}>
                  <Select
                    size="large"
                    showSearch
                    allowClear
                    placeholder="Chọn sản phẩm"
                    style={{ width: "100%" }}
                    value={selectedProductId}
                    optionFilterProp="label"
                    onChange={setSelectedProductId}
                    options={activeProducts.map((product) => ({
                      label: `${product.name} - ${money(product.price)}`,
                      value: product._id,
                    }))}
                  />
                </Col>

                <Col xs={24} sm={12} md={4}>
                  <InputNumber
                    size="large"
                    min={1}
                    value={quantity}
                    style={{ width: "100%" }}
                    onChange={(value) => setQuantity(value || 1)}
                  />
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    className="admin-order-add-button"
                    onClick={handleAddItem}
                  >
                    Thêm sản phẩm
                  </Button>
                </Col>
              </Row>

              <Table<SelectedItem>
                rowKey={(record) => record.product._id}
                pagination={false}
                dataSource={items}
                scroll={{ x: 860 }}
                className="admin-order-form-table"
                locale={{ emptyText: <Empty description="Chưa có sản phẩm" /> }}
                columns={[
                  {
                    title: "Sản phẩm",
                    width: 260,
                    render: (_, record) => (
                      <Flex align="center" gap={12}>
                        <Flex
                          align="center"
                          justify="center"
                          className="admin-order-product-icon"
                        >
                          <ShopOutlined />
                        </Flex>
                        <div className="admin-order-product-copy">
                          <Text className="admin-order-product-name">
                            {record.product.name}
                          </Text>
                          <Text className="admin-order-muted">Sản phẩm</Text>
                        </div>
                      </Flex>
                    ),
                  },
                  {
                    title: "Đơn giá",
                    width: 150,
                    align: "right",
                    render: (_, record) => money(record.product.price),
                  },
                  {
                    title: "Số lượng",
                    width: 150,
                    align: "center",
                    render: (_, record) =>
                      isEdit ? (
                        <InputNumber
                          min={1}
                          value={record.quantity}
                          style={{ width: 96 }}
                          onChange={(value) =>
                            handleChangeQuantity(record.product._id, value)
                          }
                        />
                      ) : (
                        record.quantity.toLocaleString("vi-VN")
                      ),
                  },
                  {
                    title: "Thành tiền",
                    width: 160,
                    align: "right",
                    render: (_, record) => (
                      <Text strong>
                        {money(record.product.price * record.quantity)}
                      </Text>
                    ),
                  },
                  {
                    title: "Hành động",
                    width: 128,
                    align: "center",
                    render: (_, record) => (
                      <Button
                        color="danger"
                        variant="solid"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveItem(record.product._id)}
                        className="admin-order-form-action"
                      >
                        Xóa
                      </Button>
                    ),
                  },
                ]}
              />

              <Flex justify="flex-end" className="admin-order-total-wrap">
                <div className="admin-order-total-box">
                  <Flex justify="space-between" align="center">
                    <Text>Tổng tiền</Text>
                    <strong>{money(totalAmount)}</strong>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text>Giảm giá</Text>
                    <strong>{money(discountAmount)}</strong>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text>Thanh toán</Text>
                    <strong className="is-final">{money(finalAmount)}</strong>
                  </Flex>
                </div>
              </Flex>
            </section>

            <section className="admin-order-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-order-form-section-head"
              >
                <div>
                  <Text className="admin-order-form-section-title">
                    Khuyến mãi và ghi chú
                  </Text>
                  <Text className="admin-order-form-section-desc">
                    Chọn ưu đãi hợp lệ và lưu ghi chú cho đơn hàng.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} lg={12}>
                  <Form.Item label="Chọn khuyến mãi" name="promotion">
                    <Select
                      size="large"
                      allowClear
                      showSearch
                      placeholder="Chọn khuyến mãi áp dụng"
                      optionFilterProp="label"
                      options={promotions.map((promotion) => ({
                        label: getPromotionLabel(promotion),
                        value: promotion._id,
                        disabled: totalAmount < (promotion.minOrderValue || 0),
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="Ghi chú" name="note">
                    <Input.TextArea
                      rows={4}
                      placeholder="Nhập ghi chú cho đơn hàng"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <Flex justify="space-between" gap={12} wrap="wrap" className="admin-order-form-footer">
              <Flex align="center" gap={10} className="admin-order-form-total">
                <TeamOutlined />
                <Text>{items.length} sản phẩm</Text>
                <strong>{money(finalAmount)}</strong>
              </Flex>

              <Space wrap>
                <Button
                  size="large"
                  onClick={() => router.push("/admin/orders")}
                  className="admin-order-form-action"
                >
                  Hủy
                </Button>

                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating || updating}
                  icon={<ShoppingCartOutlined />}
                  className="admin-order-form-action"
                >
                  {isEdit ? "Cập nhật đơn hàng" : "Tạo đơn hàng"}
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </section>

      <style jsx global>{`
        .admin-order-form-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-order-form-frame {
          min-height: 260px;
          padding: 20px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-order-form-frame.is-loading {
          min-height: 180px;
          background:
            linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: admin-order-loading 1.2s ease infinite;
        }

        @keyframes admin-order-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .admin-order-form-section + .admin-order-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-order-form-section-head {
          margin-bottom: 18px;
        }

        .admin-order-form-section-title,
        .admin-order-form-section-desc,
        .admin-order-product-name,
        .admin-order-muted {
          display: block;
        }

        .admin-order-form-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-order-form-section-desc,
        .admin-order-muted {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-order-form-section-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .admin-order-add-row {
          margin-bottom: 18px;
        }

        .admin-order-add-button {
          width: 100%;
        }

        .admin-order-form-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-order-form-table .ant-table-thead > tr > th {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
        }

        .admin-order-form-table .ant-table-tbody > tr > td {
          padding-block: 14px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
        }

        .admin-order-product-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-order-product-copy {
          min-width: 0;
        }

        .admin-order-product-name {
          max-width: 190px;
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-order-total-wrap {
          margin-top: 18px;
        }

        .admin-order-total-box {
          width: 340px;
          max-width: 100%;
          padding: 14px;
          display: grid;
          gap: 9px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .admin-order-total-box .ant-typography {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
        }

        .admin-order-total-box strong {
          color: #0f172a;
          font-weight: 900;
        }

        .admin-order-total-box strong.is-final {
          color: #059669;
          font-size: 18px;
        }

        .admin-order-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-order-form-total {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .admin-order-form-total .anticon {
          color: #2563eb;
        }

        .admin-order-form-total .ant-typography {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
        }

        .admin-order-form-total strong {
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-order-form-action {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 767px) {
          .admin-order-form-frame {
            padding: 14px;
          }

          .admin-order-form-total,
          .admin-order-form-total strong {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
