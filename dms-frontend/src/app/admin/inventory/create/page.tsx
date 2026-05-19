"use client";

import {
  InboxOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useAdjustStockMutation,
  useExportStockMutation,
  useImportStockMutation,
} from "@/features/inventory/inventoryService";
import type { CreateInventoryRequest } from "@/features/inventory/inventoryTypes";
import { useGetProductsQuery } from "@/features/products/productService";

const { Text } = Typography;

const transactionGuides = [
  {
    type: "import",
    title: "Nhập kho",
    description: "Tăng số lượng tồn kho của sản phẩm.",
    icon: <PlusCircleOutlined />,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#B7E4CB",
  },
  {
    type: "export",
    title: "Xuất kho",
    description: "Giảm số lượng tồn kho hiện có.",
    icon: <MinusCircleOutlined />,
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    type: "adjustment",
    title: "Điều chỉnh",
    description: "Đặt tồn kho về một giá trị mới.",
    icon: <RetweetOutlined />,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
];

export default function CreateInventoryPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<CreateInventoryRequest>();

  const { data: products = [] } = useGetProductsQuery();
  const [importStock, { isLoading: isImporting }] = useImportStockMutation();
  const [exportStock, { isLoading: isExporting }] = useExportStockMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();

  const isLoading = isImporting || isExporting || isAdjusting;

  const handleSubmit = async (values: CreateInventoryRequest) => {
    try {
      if (values.type === "import") {
        await importStock({
          product: values.product,
          quantity: values.quantity,
          note: values.note,
        }).unwrap();
      }

      if (values.type === "export") {
        await exportStock({
          product: values.product,
          quantity: values.quantity,
          note: values.note,
        }).unwrap();
      }

      if (values.type === "adjustment") {
        await adjustStock({
          product: values.product,
          newStock: values.quantity,
          note: values.note,
        }).unwrap();
      }

      message.success("Tạo giao dịch kho thành công");
      router.push("/admin/inventory");
    } catch (error: unknown) {

      const err = error as {
        data?: {
          message?: string | string[];
        };
      };

      message.error(
        Array.isArray(err?.data?.message)
          ? err.data.message[0]
          : err?.data?.message || "Tạo giao dịch kho thất bại",
      );
    }
  };

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Tạo giao dịch kho"
        description="Nhập kho, xuất kho hoặc điều chỉnh số lượng tồn kho."
        extra={
          <Button
            onClick={() => router.push("/admin/inventory")}
            className="admin-inventory-form-action"
          >
            Quay lại
          </Button>
        }
      />

      <section className="admin-inventory-form-shell">
        <div className="admin-inventory-form-frame">
          <Form<CreateInventoryRequest>
            form={form}
            layout="vertical"
            initialValues={{
              type: "import",
              quantity: 1,
            }}
            onFinish={handleSubmit}
          >
            <section className="admin-inventory-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-inventory-form-section-head"
              >
                <div>
                  <Text className="admin-inventory-form-section-title">
                    Nội dung giao dịch
                  </Text>
                  <Text className="admin-inventory-form-section-desc">
                    Chọn sản phẩm, loại giao dịch và số lượng cần cập nhật.
                  </Text>
                </div>
                <Tag color="blue" className="admin-inventory-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Sản phẩm"
                    name="product"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn sản phẩm",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                      allowClear
                      placeholder="Chọn sản phẩm"
                      optionFilterProp="label"
                      options={products.map((product) => ({
                        label: `${product.name} - tồn: ${product.stock}`,
                        value: product._id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Loại giao dịch"
                    name="type"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn loại giao dịch",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn loại giao dịch"
                      options={[
                        { label: "Nhập kho", value: "import" },
                        { label: "Xuất kho", value: "export" },
                        { label: "Điều chỉnh", value: "adjustment" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item shouldUpdate noStyle>
                    {({ getFieldValue }) => {
                      const type = getFieldValue("type");

                      return (
                        <Form.Item
                          label={
                            type === "adjustment" ? "Tồn kho mới" : "Số lượng"
                          }
                          name="quantity"
                          rules={[
                            {
                              required: true,
                              message:
                                type === "adjustment"
                                  ? "Vui lòng nhập tồn kho mới"
                                  : "Vui lòng nhập số lượng",
                            },
                          ]}
                        >
                          <InputNumber
                            size="large"
                            min={type === "adjustment" ? 0 : 1}
                            style={{ width: "100%" }}
                            controls={false}
                            placeholder={
                              type === "adjustment"
                                ? "Nhập mức tồn kho mới"
                                : "Nhập số lượng"
                            }
                          />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className="admin-inventory-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-inventory-form-section-head"
              >
                <div>
                  <Text className="admin-inventory-form-section-title">
                    Ý nghĩa giao dịch
                  </Text>
                  <Text className="admin-inventory-form-section-desc">
                    Dùng đúng loại giao dịch để hệ thống cập nhật tồn kho chính xác.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[12, 12]}>
                {transactionGuides.map((item) => (
                  <Col xs={24} md={8} key={item.type}>
                    <Flex
                      gap={12}
                      align="flex-start"
                      className="admin-inventory-guide"
                      style={{
                        "--guide-color": item.color,
                        "--guide-bg": item.bg,
                        "--guide-border": item.border,
                      } as React.CSSProperties}
                    >
                      <Flex
                        align="center"
                        justify="center"
                        className="admin-inventory-guide-icon"
                      >
                        {item.icon}
                      </Flex>
                      <div>
                        <Text className="admin-inventory-guide-title">
                          {item.title}
                        </Text>
                        <Text className="admin-inventory-guide-desc">
                          {item.description}
                        </Text>
                      </div>
                    </Flex>
                  </Col>
                ))}
              </Row>
            </section>

            <section className="admin-inventory-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-inventory-form-section-head"
              >
                <div>
                  <Text className="admin-inventory-form-section-title">
                    Ghi chú
                  </Text>
                  <Text className="admin-inventory-form-section-desc">
                    Lưu lại lý do nhập, xuất hoặc điều chỉnh kho.
                  </Text>
                </div>
              </Flex>

              <Form.Item label="Ghi chú giao dịch" name="note">
                <Input.TextArea
                  rows={4}
                  placeholder="Nhập ghi chú cho giao dịch kho"
                />
              </Form.Item>
            </section>

            <Flex
              justify="flex-end"
              gap={12}
              wrap="wrap"
              className="admin-inventory-form-footer"
            >
              <Button
                size="large"
                onClick={() => router.push("/admin/inventory")}
                className="admin-inventory-form-action"
              >
                Hủy
              </Button>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isLoading}
                icon={<InboxOutlined />}
                className="admin-inventory-form-action"
              >
                Tạo giao dịch
              </Button>
            </Flex>
          </Form>
        </div>
      </section>

      <style jsx global>{`
        .admin-inventory-form-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-inventory-form-frame {
          min-height: 260px;
          padding: 20px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-inventory-form-section + .admin-inventory-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-inventory-form-section-head {
          margin-bottom: 18px;
        }

        .admin-inventory-form-section-title,
        .admin-inventory-form-section-desc,
        .admin-inventory-guide-title,
        .admin-inventory-guide-desc {
          display: block;
        }

        .admin-inventory-form-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-inventory-form-section-desc,
        .admin-inventory-guide-desc {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.45;
        }

        .admin-inventory-form-section-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .admin-inventory-guide {
          height: 100%;
          padding: 14px;
          border: 1px solid var(--guide-border);
          border-radius: 8px;
          background: var(--guide-bg);
        }

        .admin-inventory-guide-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border: 1px solid var(--guide-border);
          border-radius: 8px;
          color: var(--guide-color);
          font-size: 18px;
          background: #ffffff;
        }

        .admin-inventory-guide-title {
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
        }

        .admin-inventory-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-inventory-form-action {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 767px) {
          .admin-inventory-form-frame {
            padding: 14px;
          }
        }
      `}</style>
    </>
  );
}
