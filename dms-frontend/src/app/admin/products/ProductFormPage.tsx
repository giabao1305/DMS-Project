"use client";

import {
  DollarOutlined,
  InboxOutlined,
  NumberOutlined,
  SaveOutlined,
  ShoppingOutlined,
  TagsOutlined,
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
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import ImageUpload from "@/components/common/ImageUpload";
import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetCategoriesQuery } from "@/features/categories/categoryService";
import {
  useCreateProductMutation,
  useGetProductByIdQuery,
  useToggleProductStatusMutation,
  useUpdateProductMutation,
} from "@/features/products/productService";
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "@/features/products/productTypes";

const { Text } = Typography;

type ProductFormMode = "create" | "edit";
type ProductFormValues = CreateProductRequest & UpdateProductRequest;

export default function ProductFormPage({ mode }: { mode: ProductFormMode }) {
  const isEdit = mode === "edit";
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [form] = Form.useForm<ProductFormValues>();

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: product, isLoading: loadingProduct } = useGetProductByIdQuery(
    id || "",
    { skip: !isEdit || !id },
  );
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [toggleProductStatus, { isLoading: togglingStatus }] =
    useToggleProductStatusMutation();

  useEffect(() => {
    if (!product) return;

    form.setFieldsValue({
      code: product.code,
      name: product.name,
      category:
        typeof product.category === "string"
          ? product.category
          : product.category?._id,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description,
      image: product.image,
      isActive: product.isActive,
    });
  }, [form, product]);

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      const { isActive, ...productValues } = values;
      const body = Object.fromEntries(
        Object.entries(productValues).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      );

      if (isEdit && id) {
        await updateProduct({ id, body: body as UpdateProductRequest }).unwrap();

        if (typeof isActive === "boolean" && product?.isActive !== isActive) {
          await toggleProductStatus(id).unwrap();
        }

        message.success("Cập nhật sản phẩm thành công");
        router.push("/admin/products");
        return;
      }

      await createProduct(body as unknown as CreateProductRequest).unwrap();
      message.success("Thêm sản phẩm thành công");
      router.push("/admin/products");
    } catch {
      message.error(
        isEdit ? "Cập nhật sản phẩm thất bại" : "Thêm sản phẩm thất bại",
      );
    }
  };

  if (isEdit && loadingProduct) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa sản phẩm"
          description="Cập nhật thông tin sản phẩm."
          extra={
            <Button onClick={() => router.push("/admin/products")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-product-form-frame is-loading" />
        <ProductFormStyles />
      </>
    );
  }

  if (isEdit && !product) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa sản phẩm"
          description="Cập nhật thông tin sản phẩm."
          extra={
            <Button onClick={() => router.push("/admin/products")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-product-form-frame">
          <Empty description="Không tìm thấy sản phẩm" />
        </div>
        <ProductFormStyles />
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        description={
          isEdit
            ? "Cập nhật hình ảnh, danh mục, giá bán và ngưỡng tồn kho."
            : "Tạo sản phẩm mới cho hệ thống, thiết lập giá bán và tồn kho tối thiểu."
        }
        extra={
          <Button onClick={() => router.push("/admin/products")}>
            Quay lại
          </Button>
        }
      />

      <section className="admin-product-form-shell">
        <div className="admin-product-form-frame">
          <Form<ProductFormValues>
            form={form}
            layout="vertical"
            initialValues={{ unit: "thùng", minStock: 10, isActive: true }}
            onFinish={handleSubmit}
          >
            <section className="admin-product-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-product-form-section-head"
              >
                <div>
                  <Text className="admin-product-form-section-title">
                    Ảnh sản phẩm
                  </Text>
                  <Text className="admin-product-form-section-desc">
                    Tải ảnh đại diện để seller dễ nhận diện khi tạo đơn hàng.
                  </Text>
                </div>
              </Flex>

              <Form.Item label="Tải ảnh lên" name="image" style={{ marginBottom: 0 }}>
                <ImageUpload />
              </Form.Item>
            </section>

            <section className="admin-product-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-product-form-section-head"
              >
                <div>
                  <Text className="admin-product-form-section-title">
                    Thông tin cơ bản
                  </Text>
                  <Text className="admin-product-form-section-desc">
                    Mã sản phẩm, tên, danh mục và đơn vị bán.
                  </Text>
                </div>
                <Tag color="blue" className="admin-product-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mã sản phẩm"
                    name="code"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã sản phẩm" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<NumberOutlined />}
                      placeholder="Nhập mã sản phẩm"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tên sản phẩm"
                    name="name"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên sản phẩm" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<ShoppingOutlined />}
                      placeholder="Nhập tên sản phẩm"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Danh mục"
                    name="category"
                    rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                  >
                    <Select
                      size="large"
                      showSearch
                      placeholder="Chọn danh mục"
                      optionFilterProp="label"
                      options={categories.map((category) => ({
                        label: category.name,
                        value: category._id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Đơn vị"
                    name="unit"
                    rules={[{ required: true, message: "Vui lòng nhập đơn vị" }]}
                  >
                    <Input
                      size="large"
                      prefix={<TagsOutlined />}
                      placeholder="Ví dụ: thùng, hộp, chai"
                    />
                  </Form.Item>
                </Col>

                {isEdit ? (
                  <Col xs={24} md={12}>
                    <Form.Item label="Trạng thái" name="isActive">
                      <Select
                        size="large"
                        placeholder="Chọn trạng thái"
                        options={[
                          { label: "Hoạt động", value: true },
                          { label: "Khóa", value: false },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                ) : null}
              </Row>
            </section>

            <section className="admin-product-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-product-form-section-head"
              >
                <div>
                  <Text className="admin-product-form-section-title">
                    Giá bán và tồn kho
                  </Text>
                  <Text className="admin-product-form-section-desc">
                    Tồn kho tối thiểu dùng để cảnh báo khi số lượng xuống thấp.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giá bán"
                    name="price"
                    rules={[{ required: true, message: "Vui lòng nhập giá bán" }]}
                  >
                    <InputNumber
                      size="large"
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="Nhập giá bán"
                      controls={false}
                      prefix={<DollarOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tồn kho tối thiểu"
                    name="minStock"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tồn kho tối thiểu",
                      },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="Nhập tồn kho tối thiểu"
                      controls={false}
                      prefix={<InboxOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className="admin-product-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-product-form-section-head"
              >
                <div>
                  <Text className="admin-product-form-section-title">
                    Mô tả sản phẩm
                  </Text>
                  <Text className="admin-product-form-section-desc">
                    Ghi chú ngắn về quy cách, thông tin bán hàng hoặc ghi chú nội bộ.
                  </Text>
                </div>
              </Flex>

              <Form.Item label="Mô tả" name="description" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={4} placeholder="Nhập mô tả sản phẩm" />
              </Form.Item>
            </section>

            <Flex
              justify="space-between"
              align="center"
              gap={12}
              wrap="wrap"
              className="admin-product-form-footer"
            >
              <Flex align="center" gap={10} className="admin-product-form-note">
                <ShoppingOutlined />
                <Text>{isEdit ? "Đang cập nhật sản phẩm" : "Tạo sản phẩm mới"}</Text>
              </Flex>

              <Space wrap>
                <Button
                  size="large"
                  onClick={() => router.push("/admin/products")}
                  className="admin-product-form-action"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating || updating || togglingStatus}
                  icon={<SaveOutlined />}
                  className="admin-product-form-action"
                >
                  {isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </section>

      <ProductFormStyles />
    </>
  );
}

function ProductFormStyles() {
  return (
    <style jsx global>{`
      .admin-product-form-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-product-form-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-product-form-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-product-loading 1.2s ease infinite;
      }

      @keyframes admin-product-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-product-form-section + .admin-product-form-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-product-form-section-head {
        margin-bottom: 18px;
      }

      .admin-product-form-section-title,
      .admin-product-form-section-desc {
        display: block;
      }

      .admin-product-form-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-product-form-section-desc {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-product-form-section-tag {
        margin-inline-end: 0;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-product-form-footer {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-product-form-note {
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-product-form-note .anticon {
        color: #2563eb;
      }

      .admin-product-form-note .ant-typography {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 800;
      }

      .admin-product-form-action {
        height: 40px !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
      }

      @media (max-width: 767px) {
        .admin-product-form-frame {
          padding: 14px;
        }

        .admin-product-form-note,
        .admin-product-form-action {
          width: 100%;
        }
      }
    `}</style>
  );
}
