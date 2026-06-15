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
  Empty,
  Flex,
  Form,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
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
import {
  useGetWarehousesQuery,
  useGetWarehouseStocksQuery,
} from "@/features/warehouses/warehouseService";

const { Text, Title } = Typography;

const money = (value: number) => `${Math.round(value).toLocaleString("vi-VN")} đ`;

type ImportStockItem = {
  product: Product;
  quantity: number;
  averageCost: number;
  sellingPrice: number;
};

const parseMoneyInput = (value?: string) => Number(value?.replace(/[^\d]/g, "") || 0);

export default function DistributorWarehouseImportPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [prefillProductId, setPrefillProductId] = useState<string>();
  const [productId, setProductId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [averageCost, setAverageCost] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [items, setItems] = useState<ImportStockItem[]>([]);

  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: products = [], isLoading: loadingProducts } =
    useGetProductsQuery();
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  const warehouse = warehouses.find(
    (entry) => entry.type === "distributor" && entry.isActive,
  );
  const { data: stocks = [], isLoading: loadingStocks } =
    useGetWarehouseStocksQuery(warehouse?._id || "", {
      skip: !warehouse?._id,
    });

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products],
  );
  const stockByProductId = useMemo(
    () =>
      new Map(
        stocks.map((stock) => [
          typeof stock.product === "string" ? stock.product : stock.product._id,
          stock,
        ]),
      ),
    [stocks],
  );
  const isExistingStockImport = Boolean(prefillProductId);
  const selectableProducts = useMemo(
    () =>
      activeProducts.filter((product) =>
        isExistingStockImport
          ? stockByProductId.has(product._id)
          : !stockByProductId.has(product._id),
      ),
    [activeProducts, isExistingStockImport, stockByProductId],
  );
  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.averageCost * item.quantity, 0),
    [items],
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const resetDraft = () => {
    setProductId(undefined);
    setQuantity(1);
    setAverageCost(0);
    setSellingPrice(0);
  };

  const handleProductChange = (nextProductId?: string) => {
    setProductId(nextProductId);

    const product = selectableProducts.find(
      (entry) => entry._id === nextProductId,
    );
    if (!product) {
      setAverageCost(0);
      setSellingPrice(0);
      return;
    }

    const stock = stockByProductId.get(product._id);
    setAverageCost(stock?.averageCost ?? product.price);
    setSellingPrice(stock?.sellingPrice ?? product.price);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextProductId = params.get("productId") || undefined;
    setPrefillProductId(nextProductId);
  }, []);

  useEffect(() => {
    if (!prefillProductId || productId || items.length) return;
    if (!activeProducts.some((product) => product._id === prefillProductId)) {
      return;
    }
    if (!stockByProductId.has(prefillProductId)) return;

    handleProductChange(prefillProductId);
  }, [activeProducts, items.length, prefillProductId, productId, stockByProductId]);

  const addItem = () => {
    const product = selectableProducts.find((entry) => entry._id === productId);

    if (!product) {
      message.warning("Vui lòng chọn sản phẩm cần nhập");
      return;
    }

    if (quantity <= 0 || averageCost < 0 || sellingPrice < 0) {
      message.warning("Số lượng và giá nhập kho không hợp lệ");
      return;
    }

    setItems((previous) => {
      const current = previous.find((item) => item.product._id === product._id);
      if (!current) {
        return [...previous, { product, quantity, averageCost, sellingPrice }];
      }

      return previous.map((item) =>
        item.product._id === product._id
          ? {
              ...item,
              quantity: item.quantity + quantity,
              averageCost,
              sellingPrice,
            }
          : item,
      );
    });
    resetDraft();
  };

  const updateItem = (
    productIdToUpdate: string,
    patch: Partial<Omit<ImportStockItem, "product">>,
  ) => {
    setItems((previous) =>
      previous.map((item) =>
        item.product._id === productIdToUpdate ? { ...item, ...patch } : item,
      ),
    );
  };

  const removeItem = (productIdToRemove: string) => {
    setItems((previous) =>
      previous.filter((item) => item.product._id !== productIdToRemove),
    );
  };

  const submitImportStock = async () => {
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
        note: [
          "Yêu cầu nhập hàng từ kho NPP.",
          ...items.map(
            (item) =>
              `${item.product.code} - ${item.product.name}: SL ${
                item.quantity
              }, giá nhập đề xuất ${money(
                item.averageCost,
              )}, giá bán ra tiệm đề xuất ${money(item.sellingPrice)}`,
          ),
        ].join("\n"),
      }).unwrap();

      message.success("Đã gửi yêu cầu nhập hàng cho Admin duyệt");
      setItems([]);
      router.push("/distributor/orders?created=supply");
    } catch (error: unknown) {
      message.error(orderApiMessage(error, "Không thể gửi yêu cầu nhập hàng"));
    }
  };

  const columns: ColumnsType<ImportStockItem> = [
    {
      title: "Sản phẩm",
      width: 280,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.product.name}</Text>
          <Text type="secondary">
            {record.product.code} - {record.product.unit}
          </Text>
        </Space>
      ),
    },
    {
      title: "Số lượng",
      align: "right",
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) =>
            updateItem(record.product._id, { quantity: value || 1 })
          }
          style={{ width: 118 }}
        />
      ),
    },
    {
      title: "Giá nhập",
      align: "right",
      width: 170,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.averageCost}
          formatter={(input) =>
            `${input}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
          }
          parser={parseMoneyInput}
          onChange={(value) =>
            updateItem(record.product._id, { averageCost: value || 0 })
          }
          className="distributor-import-money-input"
        />
      ),
    },
    {
      title: "Giá bán ra tiệm",
      align: "right",
      width: 180,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.sellingPrice}
          formatter={(input) =>
            `${input}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
          }
          parser={parseMoneyInput}
          onChange={(value) =>
            updateItem(record.product._id, { sellingPrice: value || 0 })
          }
          className="distributor-import-money-input"
        />
      ),
    },
    {
      title: "Thành tiền nhập",
      align: "right",
      width: 170,
      render: (_, record) => money(record.averageCost * record.quantity),
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
      description="Tạo yêu cầu nhập hàng gửi Admin duyệt. Kho chỉ được cộng khi Admin giao hàng."
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/distributor/warehouse")}
        >
          Quay lại kho
        </Button>
      }
    >
      <DistributorCommandCenter
        eyebrow="Yêu cầu nhập hàng"
        title={isExistingStockImport ? "Nhập thêm hàng" : "Nhập sản phẩm mới"}
        description={
          isExistingStockImport
            ? "Bổ sung số lượng cho sản phẩm đang có trong kho NPP và gửi Admin duyệt trước khi cộng kho."
            : "Chọn sản phẩm chưa có trong kho NPP, nhập số lượng, giá đề xuất và gửi Admin duyệt trước khi cộng kho."
        }
        meterValue={money(total)}
        meterLabel="Tổng giá trị nhập"
        stats={[
          { label: "Sản phẩm khả dụng", value: selectableProducts.length },
          { label: "Dòng đã chọn", value: items.length },
          { label: "Tổng số lượng", value: totalQuantity },
        ]}
        progressLabel="Hoàn thiện yêu cầu"
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
              {warehouse ? "Có thể gửi yêu cầu" : "Cần kích hoạt kho"}
            </Tag>
          </>
        }
      />

      <DistributorTableCard
        title="Thông tin yêu cầu nhập hàng"
        description={
          isExistingStockImport
            ? "Sản phẩm đang có trong kho sẽ được chọn sẵn khi bấm từ danh sách tồn. Admin duyệt và giao hàng thì tồn kho mới được cộng."
            : "Chỉ chọn sản phẩm chưa có trong kho NPP. Yêu cầu gửi đi sẽ chờ Admin duyệt và giao hàng."
        }
      >
        <section className="distributor-import-form-shell">
          <div className="distributor-import-form-frame">
            {!warehouse && (
              <Alert
                showIcon
                type="warning"
                className="distributor-import-alert"
                message="Chưa có kho NPP đang hoạt động"
                description="Vui lòng liên hệ Admin tạo hoặc kích hoạt lại kho trước khi gửi yêu cầu nhập hàng."
              />
            )}

            {warehouse && (
              <Alert
                showIcon
                type="info"
                className="distributor-import-alert"
                message={`${warehouse.name} - ${warehouse.code}`}
                description="Yêu cầu gửi đi sẽ chờ Admin duyệt. Khi Admin giao hàng, tồn kho NPP mới được cộng."
              />
            )}

            <Form layout="vertical" onFinish={submitImportStock}>
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
                      Sản phẩm nhập kho
                    </Text>
                    <Text className="distributor-import-section-desc">
                      {isExistingStockImport
                        ? "Chọn sản phẩm đang có, nhập số lượng cần bổ sung và giá đề xuất gửi Admin."
                        : "Chọn sản phẩm mới với kho NPP, nhập số lượng cần nhập và giá đề xuất gửi Admin."}
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
                    loading={loadingProducts || loadingStocks}
                    value={productId}
                    optionFilterProp="label"
                    placeholder={
                      isExistingStockImport
                        ? "Chọn sản phẩm đang có trong kho NPP"
                        : "Chọn sản phẩm chưa có trong kho NPP"
                    }
                    onChange={handleProductChange}
                    style={{ minWidth: 320, flex: "1 1 360px" }}
                    options={selectableProducts.map((product) => {
                      const stock = stockByProductId.get(product._id);
                      return {
                        value: product._id,
                        label: `${product.code} - ${product.name} - giá tham khảo ${money(
                          product.price,
                        )}${
                          isExistingStockImport && stock
                            ? ` - tồn NPP ${stock.quantity}`
                            : ""
                        }`,
                      };
                    })}
                    notFoundContent={
                      isExistingStockImport
                        ? "Không có sản phẩm đang tồn trong kho NPP"
                        : "Không còn sản phẩm mới để nhập"
                    }
                  />
                  <InputNumber
                    min={1}
                    size="large"
                    disabled={!warehouse}
                    value={quantity}
                    placeholder="SL"
                    className="distributor-import-quantity-input"
                    onChange={(value) => setQuantity(value || 1)}
                  />
                  <InputNumber
                    min={0}
                    size="large"
                    disabled={!warehouse}
                    value={averageCost}
                    placeholder="Giá nhập"
                    formatter={(input) =>
                      `${input}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                    }
                    parser={parseMoneyInput}
                    className="distributor-import-money-input"
                    onChange={(value) => setAverageCost(value || 0)}
                  />
                  <InputNumber
                    min={0}
                    size="large"
                    disabled={!warehouse}
                    value={sellingPrice}
                    placeholder="Giá bán"
                    formatter={(input) =>
                      `${input}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                    }
                    parser={parseMoneyInput}
                    className="distributor-import-money-input"
                    onChange={(value) => setSellingPrice(value || 0)}
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

                <Table<ImportStockItem>
                  rowKey={(record) => record.product._id}
                  dataSource={items}
                  columns={columns}
                  pagination={false}
                  scroll={{ x: 1030 }}
                  className="distributor-import-table"
                  locale={{
                    emptyText: <Empty description="Chưa có sản phẩm nhập kho" />,
                  }}
                />
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
                    <Text>
                      Tổng số lượng: {totalQuantity.toLocaleString("vi-VN")}
                    </Text>
                    <Title level={4} style={{ margin: 0 }}>
                      Tổng giá trị nhập: {money(total)}
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
                    Gửi Admin duyệt
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
          width: 110px !important;
        }

        .distributor-import-money-input {
          width: 150px !important;
        }

        .distributor-import-money-input .ant-input-number-input {
          text-align: right !important;
          font-weight: 700 !important;
        }

        .distributor-import-form-frame .ant-form-item-label > label {
          color: #334155;
          font-weight: 800;
        }

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
          .distributor-import-money-input,
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
