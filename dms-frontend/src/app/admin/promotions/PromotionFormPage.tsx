"use client";

import {
  CalendarOutlined,
  GiftOutlined,
  PercentageOutlined,
  SaveOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
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
  Switch,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetProductsQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import {
  useCreatePromotionMutation,
  useGetPromotionByIdQuery,
  useUpdatePromotionMutation,
} from "@/features/promotions/promotionService";
import type {
  CreatePromotionRequest,
  PromotionType,
  UpdatePromotionRequest,
} from "@/features/promotions/promotionTypes";

const { Text } = Typography;

type PromotionFormMode = "create" | "edit";
type PromotionFormValues = Omit<
  CreatePromotionRequest & UpdatePromotionRequest,
  "startDate" | "endDate"
> & {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
};

export default function PromotionFormPage({ mode }: { mode: PromotionFormMode }) {
  const isEdit = mode === "edit";
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [form] = Form.useForm<PromotionFormValues>();

  const { data: products = [] } = useGetProductsQuery();
  const { data: promotion, isLoading: loadingPromotion } =
    useGetPromotionByIdQuery(id || "", { skip: !isEdit || !id });
  const [createPromotion, { isLoading: creating }] =
    useCreatePromotionMutation();
  const [updatePromotion, { isLoading: updating }] =
    useUpdatePromotionMutation();

  const type = Form.useWatch("type", form) as PromotionType | undefined;

  const moneyFormatter = (value?: string | number) => {
    if (value === undefined || value === null || value === "") return "";
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  };

  const moneyParser = (value?: string) =>
    value ? Number(value.replace(/\./g, "").replace("đ", "")) : 0;

  const percentParser = (value?: string) =>
    value ? Number(value.replace("%", "")) : 0;

  useEffect(() => {
    if (!promotion) return;

    const giftProductId =
      typeof promotion.giftProduct === "string"
        ? promotion.giftProduct
        : (promotion.giftProduct as Product | undefined)?._id;

    form.setFieldsValue({
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      discountPercent: promotion.discountPercent,
      discountAmount: promotion.discountAmount,
      giftProduct: giftProductId,
      giftQuantity: promotion.giftQuantity,
      minOrderValue: promotion.minOrderValue,
      isActive: promotion.isActive,
      dateRange: [dayjs(promotion.startDate), dayjs(promotion.endDate)],
    });
  }, [form, promotion]);

  const handleSubmit = async (values: PromotionFormValues) => {
    try {
      const baseBody: CreatePromotionRequest = {
        name: values.name,
        description: values.description,
        type: values.type,
        discountPercent:
          values.type === "percent" ? values.discountPercent : undefined,
        discountAmount:
          values.type === "amount" ? values.discountAmount : undefined,
        giftProduct:
          values.type === "product_gift" ? values.giftProduct : undefined,
        giftQuantity:
          values.type === "product_gift" ? values.giftQuantity : undefined,
        minOrderValue: values.minOrderValue,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      };

      if (isEdit && id) {
        const body: UpdatePromotionRequest = {
          ...baseBody,
          isActive: values.isActive,
        };
        await updatePromotion({ id, body }).unwrap();
        message.success("Cập nhật khuyến mãi thành công");
        router.push("/admin/promotions");
        return;
      }

      await createPromotion(baseBody).unwrap();
      message.success("Thêm khuyến mãi thành công");
      router.push("/admin/promotions");
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
              (isEdit ? "Cập nhật khuyến mãi thất bại" : "Thêm khuyến mãi thất bại"),
      );
    }
  };

  if (isEdit && loadingPromotion) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa khuyến mãi"
          description="Cập nhật chương trình khuyến mãi."
          extra={
            <Button onClick={() => router.push("/admin/promotions")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-promotion-form-frame is-loading" />
        <PromotionFormStyles />
      </>
    );
  }

  if (isEdit && !promotion) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa khuyến mãi"
          description="Cập nhật chương trình khuyến mãi."
          extra={
            <Button onClick={() => router.push("/admin/promotions")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-promotion-form-frame">
          <Empty description="Không tìm thấy khuyến mãi" />
        </div>
        <PromotionFormStyles />
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={isEdit ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
        description={
          isEdit
            ? "Cập nhật chương trình giảm giá, quà tặng và điều kiện áp dụng."
            : "Tạo chương trình giảm giá hoặc tặng sản phẩm."
        }
        extra={
          <Button onClick={() => router.push("/admin/promotions")}>
            Quay lại
          </Button>
        }
      />

      <section className="admin-promotion-form-shell">
        <div className="admin-promotion-form-frame">
          <Form<PromotionFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              type: "percent",
              minOrderValue: 0,
              isActive: true,
              dateRange: [dayjs(), dayjs().add(7, "day")],
            }}
            onFinish={handleSubmit}
          >
            <section className="admin-promotion-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-promotion-form-section-head"
              >
                <div>
                  <Text className="admin-promotion-form-section-title">
                    Thông tin chương trình
                  </Text>
                  <Text className="admin-promotion-form-section-desc">
                    Thiết lập tên, mô tả và loại ưu đãi sẽ áp dụng.
                  </Text>
                </div>
                <Tag color="blue" className="admin-promotion-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tên khuyến mãi"
                    name="name"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên khuyến mãi" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Nhập tên chương trình khuyến mãi"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Loại khuyến mãi"
                    name="type"
                    rules={[
                      { required: true, message: "Vui lòng chọn loại khuyến mãi" },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn loại khuyến mãi"
                      options={[
                        { label: "Giảm theo phần trăm", value: "percent" },
                        { label: "Giảm số tiền", value: "amount" },
                        { label: "Tặng sản phẩm", value: "product_gift" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="Mô tả" name="description">
                    <Input.TextArea
                      rows={4}
                      placeholder="Nhập mô tả chương trình khuyến mãi"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className="admin-promotion-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-promotion-form-section-head"
              >
                <div>
                  <Text className="admin-promotion-form-section-title">
                    Giá trị ưu đãi
                  </Text>
                  <Text className="admin-promotion-form-section-desc">
                    Loại khuyến mãi đang chọn sẽ quyết định nhóm trường cần nhập.
                  </Text>
                </div>
              </Flex>

              {type === "percent" ? (
                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Phần trăm giảm"
                      name="discountPercent"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập phần trăm giảm",
                        },
                      ]}
                    >
                      <InputNumber<number>
                        size="large"
                        min={0}
                        max={100}
                        style={{ width: "100%" }}
                        formatter={(value) => `${value || ""}%`}
                        parser={percentParser}
                        controls={false}
                        placeholder="Nhập % giảm"
                        prefix={<PercentageOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}

              {type === "amount" ? (
                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số tiền giảm"
                      name="discountAmount"
                      rules={[
                        { required: true, message: "Vui lòng nhập số tiền giảm" },
                      ]}
                    >
                      <InputNumber<number>
                        size="large"
                        min={0}
                        style={{ width: "100%" }}
                        formatter={moneyFormatter}
                        parser={moneyParser}
                        controls={false}
                        placeholder="Nhập số tiền giảm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}

              {type === "product_gift" ? (
                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Sản phẩm tặng"
                      name="giftProduct"
                      rules={[
                        { required: true, message: "Vui lòng chọn sản phẩm tặng" },
                      ]}
                    >
                      <Select
                        size="large"
                        showSearch
                        allowClear
                        placeholder="Chọn sản phẩm tặng"
                        optionFilterProp="label"
                        options={products.map((product) => ({
                          label: product.name,
                          value: product._id,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số lượng tặng"
                      name="giftQuantity"
                      rules={[
                        { required: true, message: "Vui lòng nhập số lượng tặng" },
                      ]}
                    >
                      <InputNumber<number>
                        size="large"
                        min={1}
                        style={{ width: "100%" }}
                        controls={false}
                        placeholder="Nhập số lượng tặng"
                        prefix={<GiftOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}
            </section>

            <section className="admin-promotion-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-promotion-form-section-head"
              >
                <div>
                  <Text className="admin-promotion-form-section-title">
                    Điều kiện áp dụng
                  </Text>
                  <Text className="admin-promotion-form-section-desc">
                    Cấu hình giá trị đơn tối thiểu và thời gian hiệu lực.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Giá trị đơn tối thiểu" name="minOrderValue">
                    <InputNumber<number>
                      size="large"
                      min={0}
                      style={{ width: "100%" }}
                      formatter={moneyFormatter}
                      parser={moneyParser}
                      controls={false}
                      placeholder="Nhập giá trị đơn tối thiểu"
                      prefix={<TagsOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Thời gian áp dụng"
                    name="dateRange"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn thời gian áp dụng",
                      },
                    ]}
                  >
                    <DatePicker.RangePicker
                      size="large"
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      suffixIcon={<CalendarOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            {isEdit ? (
              <section className="admin-promotion-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="admin-promotion-form-section-head"
                >
                  <div>
                    <Text className="admin-promotion-form-section-title">
                      Trạng thái chương trình
                    </Text>
                    <Text className="admin-promotion-form-section-desc">
                      Bật hoặc khóa chương trình khuyến mãi hiện tại.
                    </Text>
                  </div>
                </Flex>

                <Form.Item
                  label="Trạng thái"
                  name="isActive"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Switch checkedChildren="Đang dùng" unCheckedChildren="Khóa" />
                </Form.Item>
              </section>
            ) : null}

            <Flex
              justify="space-between"
              align="center"
              gap={12}
              wrap="wrap"
              className="admin-promotion-form-footer"
            >
              <Flex align="center" gap={10} className="admin-promotion-form-note">
                <PercentageOutlined />
                <Text>
                  {isEdit ? "Đang cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}
                </Text>
              </Flex>

              <Space wrap>
                <Button
                  size="large"
                  onClick={() => router.push("/admin/promotions")}
                  className="admin-promotion-form-action"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating || updating}
                  icon={<SaveOutlined />}
                  className="admin-promotion-form-action"
                >
                  {isEdit ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </section>

      <PromotionFormStyles />
    </>
  );
}

function PromotionFormStyles() {
  return (
    <style jsx global>{`
      .admin-promotion-form-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-promotion-form-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-promotion-form-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-promotion-loading 1.2s ease infinite;
      }

      @keyframes admin-promotion-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-promotion-form-section + .admin-promotion-form-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-promotion-form-section-head {
        margin-bottom: 18px;
      }

      .admin-promotion-form-section-title,
      .admin-promotion-form-section-desc {
        display: block;
      }

      .admin-promotion-form-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-promotion-form-section-desc {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-promotion-form-section-tag {
        margin-inline-end: 0;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-promotion-form-footer {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-promotion-form-note {
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-promotion-form-note .anticon {
        color: #2563eb;
      }

      .admin-promotion-form-note .ant-typography {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 800;
      }

      .admin-promotion-form-action {
        height: 40px !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
      }

      @media (max-width: 767px) {
        .admin-promotion-form-frame {
          padding: 14px;
        }

        .admin-promotion-form-note,
        .admin-promotion-form-action {
          width: 100%;
        }
      }
    `}</style>
  );
}
