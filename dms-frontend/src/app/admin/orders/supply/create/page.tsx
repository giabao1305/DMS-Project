"use client";

import { PlusOutlined, SendOutlined } from "@ant-design/icons";
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
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import { useCreateOrderMutation } from "@/features/orders/orderService";
import { useGetProductsQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import { useGetWarehousesQuery } from "@/features/warehouses/warehouseService";
import type { Warehouse } from "@/features/warehouses/warehouseTypes";
import type { User } from "@/features/users/userTypes";

const { Text } = Typography;
const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

type FormValues = {
  warehouse: string;
  note?: string;
};

type SupplyItem = {
  product: Product;
  quantity: number;
};

function getDistributor(warehouse: Warehouse): User | undefined {
  return typeof warehouse.distributor === "string"
    ? undefined
    : warehouse.distributor;
}

function getDistributorId(warehouse: Warehouse) {
  return typeof warehouse.distributor === "string"
    ? warehouse.distributor
    : warehouse.distributor?._id;
}


export default function CreateSupplyOrderPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [productId, setProductId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<SupplyItem[]>([]);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: products = [] } = useGetProductsQuery();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const distributorWarehouses = warehouses.filter(
    (warehouse) => warehouse.type === "distributor" && warehouse.isActive,
  );
  const activeProducts = products.filter((product) => product.isActive);
  const totalAmount = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  );

  const addItem = () => {
    const product = activeProducts.find((entry) => entry._id === productId);

    if (!product) {
      message.warning("Vui lòng chọn sản phẩm");
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

  const submit = async (values: FormValues) => {
    const warehouse = distributorWarehouses.find(
      (entry) => entry._id === values.warehouse,
    );
    const distributorId = warehouse && getDistributorId(warehouse);

    if (!warehouse || !distributorId) {
      message.error("Kho đã chọn chưa gắn với nhà phân phối");
      return;
    }

    if (!items.length) {
      message.warning("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    try {
      await createOrder({
        orderType: "manufacturer_to_distributor",
        distributor: distributorId,
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        note: values.note,
      }).unwrap();
      message.success("Đã tạo đơn cấp hàng cho NPP");
      router.push("/admin/orders");
    } catch (error: unknown) {
      message.error(orderApiMessage(error, "Không thể tạo đơn cấp hàng"));
    }
  };

  return (
    <>
      <AdminBreadcrumb />
      <AdminPageHeader
        title="Cấp hàng cho nhà phân phối"
        description="Đơn dùng giá sản phẩm hiện tại làm giá Nestlé bán NPP; sau khi giao, hàng nhập vào kho NPP."
        extra={
          <Button onClick={() => router.push("/admin/orders")}>Quay lại</Button>
        }
      />

      <Form<FormValues> form={form} layout="vertical" onFinish={submit}>
        <Flex vertical gap={18}>
          <Card title="Nhà phân phối nhận hàng">
            <Row gutter={[18, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Kho NPP đích"
                  name="warehouse"
                  rules={[{ required: true, message: "Vui lòng chọn kho NPP" }]}
                >
                  <Select
                    size="large"
                    showSearch
                    optionFilterProp="label"
                    options={distributorWarehouses.map((warehouse) => {
                      const distributor = getDistributor(warehouse);
                      return {
                        value: warehouse._id,
                        label: `${warehouse.name} - ${
                          distributor?.companyName ||
                          distributor?.fullName ||
                          warehouse.code
                        }`,
                      };
                    })}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Ghi chú" name="note">
                  <Input placeholder="Ghi chú giao hàng hoặc công nợ" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title="Sản phẩm cấp cho NPP"
            extra={<Tag color="blue">Giá cấp NPP = giá sản phẩm hiện tại</Tag>}
          >
            <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 18 }}>
              <Col xs={24} md={14}>
                <Select
                  size="large"
                  showSearch
                  allowClear
                  value={productId}
                  optionFilterProp="label"
                  style={{ width: "100%" }}
                  placeholder="Chọn sản phẩm"
                  onChange={setProductId}
                  options={activeProducts.map((product) => ({
                    value: product._id,
                    label: `${product.name} - ${money(product.price)} - tồn tổng ${product.stock}`,
                  }))}
                />
              </Col>
              <Col xs={12} md={4}>
                <InputNumber
                  min={1}
                  value={quantity}
                  style={{ width: "100%" }}
                  onChange={(value) => setQuantity(value || 1)}
                />
              </Col>
              <Col xs={12} md={6}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addItem}
                >
                  Thêm
                </Button>
              </Col>
            </Row>

            <Table<SupplyItem>
              rowKey={(record) => record.product._id}
              pagination={false}
              dataSource={items}
              locale={{ emptyText: <Empty description="Chưa có sản phẩm" /> }}
              columns={[
                {
                  title: "Sản phẩm",
                  render: (_, record) => record.product.name,
                },
                {
                  title: "Giá cấp NPP",
                  align: "right",
                  render: (_, record) => money(record.product.price),
                },
                {
                  title: "Số lượng",
                  align: "right",
                  render: (_, record) =>
                    record.quantity.toLocaleString("vi-VN"),
                },
                {
                  title: "Thành tiền",
                  align: "right",
                  render: (_, record) =>
                    money(record.product.price * record.quantity),
                },
                {
                  title: "",
                  render: (_, record) => (
                    <Button
                      danger
                      type="link"
                      onClick={() =>
                        setItems((previous) =>
                          previous.filter(
                            (item) => item.product._id !== record.product._id,
                          ),
                        )
                      }
                    >
                      Xóa
                    </Button>
                  ),
                },
              ]}
            />
          </Card>

          <Card>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
              <div>
                <Text type="secondary">Tổng giá trị cấp hàng</Text>
                <div style={{ fontSize: 26, fontWeight: 700 }}>
                  {money(totalAmount)}
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                htmlType="submit"
                loading={isLoading}
              >
                Tạo đơn cấp hàng
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Form>
    </>
  );
}
