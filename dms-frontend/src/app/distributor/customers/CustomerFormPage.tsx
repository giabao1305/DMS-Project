"use client";

import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
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
import { useEffect, useMemo } from "react";

import {
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import {
  useCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/features/customers/customerService";
import type {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from "@/features/customers/customerTypes";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import { useGetSellerUsersQuery } from "@/features/users/userService";

const { Text } = Typography;

type CustomerFormMode = "create" | "edit";
type CustomerFormValues = CreateCustomerRequest & UpdateCustomerRequest;

const isMongoId = (value: string) => /^[a-f\d]{24}$/i.test(value);

const getRelationId = (value: Customer["assignedSeller"]) => {
  if (!value) return undefined;
  if (typeof value === "string") return isMongoId(value) ? value : undefined;
  return value._id;
};

export default function CustomerFormPage({ mode }: { mode: CustomerFormMode }) {
  const isEdit = mode === "edit";
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<CustomerFormValues>();

  const { data: customer, isLoading: loadingCustomer } = useGetCustomerByIdQuery(
    id || "",
    { skip: !isEdit || !id },
  );
  const { data: sellers = [], isLoading: loadingSellers } =
    useGetSellerUsersQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();

  const sellerOptions = useMemo(
    () =>
      sellers
        .filter((seller) => seller.isActive)
        .map((seller) => ({
          label: `${seller.fullName} - ${seller.email}`,
          value: seller._id,
        })),
    [sellers],
  );

  useEffect(() => {
    if (!customer) return;

    form.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      ownerName: customer.ownerName,
      customerType: customer.customerType,
      latitude: customer.latitude,
      longitude: customer.longitude,
      assignedSeller: getRelationId(customer.assignedSeller),
    });
  }, [customer, form]);

  const handleSubmit = async (values: CustomerFormValues) => {
    try {
      const body = {
        name: values.name,
        phone: values.phone,
        address: values.address,
        ownerName: values.ownerName || undefined,
        customerType: values.customerType || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
        assignedSeller: values.assignedSeller,
      };

      if (isEdit && id) {
        await updateCustomer({
          id,
          body: body as UpdateCustomerRequest,
        }).unwrap();
        message.success("Cập nhật khách hàng thành công");
      } else {
        await createCustomer(body as CreateCustomerRequest).unwrap();
        message.success("Thêm khách hàng thành công");
      }

      router.push("/distributor/customers");
    } catch (error) {
      message.error(orderApiMessage(error, "Không thể lưu khách hàng"));
    }
  };

  const isLoading = loadingCustomer || loadingSellers;

  if (isEdit && !loadingCustomer && !customer) {
    return (
      <DistributorPageShell
        eyebrow="Khách hàng"
        title="Sửa khách hàng"
        description="Cập nhật hồ sơ điểm bán, DSR phụ trách và thông tin định vị."
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Quay lại
          </Button>
        }
      >
        <DistributorTableCard
          title="Không tìm thấy khách hàng"
          description="Khách hàng có thể đã bị xóa hoặc không thuộc phạm vi quản lý."
        >
          <div className="distributor-customer-form-frame">
            <Empty description="Không tìm thấy khách hàng" />
          </div>
          <CustomerFormStyles />
        </DistributorTableCard>
      </DistributorPageShell>
    );
  }

  return (
    <DistributorPageShell
      eyebrow="Khách hàng"
      title={isEdit ? "Sửa khách hàng" : "Thêm khách hàng"}
      description="Cập nhật hồ sơ điểm bán, DSR phụ trách và thông tin định vị."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Quay lại
        </Button>
      }
    >
      <DistributorTableCard
        title={isEdit ? "Thông tin khách hàng" : "Hồ sơ khách hàng mới"}
        description="Điền thông tin điểm bán và gán đúng DSR phụ trách trong đội."
      >
        <section className="distributor-customer-form-shell">
          <div
            className={`distributor-customer-form-frame ${
              isLoading ? "is-loading" : ""
            }`}
          >
            <Form<CustomerFormValues>
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <section className="distributor-customer-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-customer-section-head"
                >
                  <div>
                    <Text className="distributor-customer-section-title">
                      Thông tin điểm bán
                    </Text>
                    <Text className="distributor-customer-section-desc">
                      Tên, liên hệ và phân loại khách hàng dùng cho tuyến bán hàng.
                    </Text>
                  </div>
                  <Tag color="blue" className="distributor-customer-section-tag">
                    Bắt buộc
                  </Tag>
                </Flex>

                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="DSR phụ trách"
                      name="assignedSeller"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn DSR phụ trách",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        size="large"
                        optionFilterProp="label"
                        placeholder="Chọn DSR trong đội"
                        options={sellerOptions}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Tên khách hàng"
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập tên khách hàng",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        prefix={<ShopOutlined />}
                        placeholder="Nhập tên điểm bán"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số điện thoại",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Chủ cửa hàng" name="ownerName">
                      <Input
                        size="large"
                        prefix={<UserOutlined />}
                        placeholder="Nhập tên chủ cửa hàng"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Loại khách hàng" name="customerType">
                      <Select
                        allowClear
                        size="large"
                        placeholder="Chọn loại khách hàng"
                        options={[
                          { label: "Tạp hóa", value: "Tạp hóa" },
                          { label: "Siêu thị mini", value: "Siêu thị mini" },
                          { label: "Đại lý", value: "Đại lý" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className="distributor-customer-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-customer-section-head"
                >
                  <div>
                    <Text className="distributor-customer-section-title">
                      Địa chỉ và định vị
                    </Text>
                    <Text className="distributor-customer-section-desc">
                      Địa chỉ và tọa độ giúp DSR check-in đúng vị trí điểm bán.
                    </Text>
                  </div>
                </Flex>

                <Row gutter={[18, 0]}>
                  <Col xs={24}>
                    <Form.Item
                      label="Địa chỉ"
                      name="address"
                      rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                    >
                      <Input
                        size="large"
                        prefix={<EnvironmentOutlined />}
                        placeholder="Nhập địa chỉ"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Vĩ độ" name="latitude">
                      <InputNumber
                        size="large"
                        controls={false}
                        style={{ width: "100%" }}
                        placeholder="Nhập vĩ độ"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Kinh độ" name="longitude">
                      <InputNumber
                        size="large"
                        controls={false}
                        style={{ width: "100%" }}
                        placeholder="Nhập kinh độ"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <Flex
                justify="space-between"
                align="center"
                gap={12}
                wrap="wrap"
                className="distributor-customer-form-footer"
              >
                <Flex align="center" gap={10} className="distributor-customer-form-note">
                  <TeamOutlined />
                  <Text>
                    {isEdit ? "Đang cập nhật điểm bán" : "Tạo khách hàng mới"}
                  </Text>
                </Flex>

                <Space wrap>
                  <Button
                    size="large"
                    onClick={() => router.push("/distributor/customers")}
                    className="distributor-customer-form-action"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={creating || updating}
                    className="distributor-customer-form-action"
                  >
                    {isEdit ? "Cập nhật khách hàng" : "Thêm khách hàng"}
                  </Button>
                </Space>
              </Flex>
            </Form>
          </div>
        </section>
      </DistributorTableCard>

      <CustomerFormStyles />
    </DistributorPageShell>
  );
}

function CustomerFormStyles() {
  return (
    <style jsx global>{`
      .distributor-customer-form-shell {
        margin-top: 18px;
      }

      .distributor-customer-form-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbeafe;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
      }

      .distributor-customer-form-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fbff 25%, #eef4ff 37%, #f8fbff 63%);
        background-size: 400% 100%;
        animation: distributor-customer-loading 1.2s ease infinite;
      }

      @keyframes distributor-customer-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .distributor-customer-form-section + .distributor-customer-form-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbeafe;
      }

      .distributor-customer-section-head {
        margin-bottom: 18px;
      }

      .distributor-customer-section-title,
      .distributor-customer-section-desc {
        display: block;
      }

      .distributor-customer-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .distributor-customer-section-desc {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .distributor-customer-section-tag {
        margin-inline-end: 0;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .distributor-customer-form-frame .ant-form-item-label > label {
        color: #334155;
        font-weight: 800;
      }

      .distributor-customer-form-frame .ant-input,
      .distributor-customer-form-frame .ant-input-affix-wrapper,
      .distributor-customer-form-frame .ant-select-selector,
      .distributor-customer-form-frame .ant-input-number {
        border-radius: 8px !important;
      }

      .distributor-customer-form-frame .ant-input-affix-wrapper-focused,
      .distributor-customer-form-frame .ant-input-affix-wrapper:focus,
      .distributor-customer-form-frame .ant-select-focused .ant-select-selector,
      .distributor-customer-form-frame .ant-input-number-focused {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12) !important;
      }

      .distributor-customer-form-footer {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid #dbeafe;
      }

      .distributor-customer-form-note {
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid #dbeafe;
        border-radius: 8px;
        background: #eff6ff;
      }

      .distributor-customer-form-note .anticon {
        color: #2563eb;
      }

      .distributor-customer-form-note .ant-typography {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 800;
      }

      .distributor-customer-form-action {
        height: 40px !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
      }

      .distributor-content .distributor-customer-form-action.ant-btn-primary,
      .distributor-content
        .distributor-customer-form-action.ant-btn-primary:not(.ant-btn-dangerous) {
        border-color: #2563eb !important;
        background: #2563eb !important;
        color: #ffffff !important;
        box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
      }

      .distributor-content .distributor-customer-form-action.ant-btn-primary:hover,
      .distributor-content
        .distributor-customer-form-action.ant-btn-primary:not(.ant-btn-dangerous):hover {
        border-color: #1d4ed8 !important;
        background: #1d4ed8 !important;
        color: #ffffff !important;
        box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2) !important;
      }

      @media (max-width: 767px) {
        .distributor-customer-form-frame {
          padding: 14px;
        }

        .distributor-customer-form-note,
        .distributor-customer-form-action {
          width: 100%;
        }
      }
    `}</style>
  );
}
