"use client";

import {
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

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { isSalesRepRole } from "@/features/auth/roleUtils";
import {
  useCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/features/customers/customerService";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/features/customers/customerTypes";
import { useGetUsersQuery } from "@/features/users/userService";

const { Text } = Typography;

type CustomerFormMode = "create" | "edit";
type CustomerFormValues = CreateCustomerRequest & UpdateCustomerRequest;

const getRelationId = (value: unknown) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    return (value as { _id: string })._id;
  }
  return undefined;
};

export default function CustomerFormPage({ mode }: { mode: CustomerFormMode }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { message } = App.useApp();
  const [form] = Form.useForm<CustomerFormValues>();

  const { data: users = [] } = useGetUsersQuery();
  const { data: customer, isLoading: loadingCustomer } =
    useGetCustomerByIdQuery(id || "", { skip: !isEdit || !id });
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();

  const sellers = useMemo(
    () => users.filter((user) => isSalesRepRole(user.role) && user.isActive),
    [users],
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
      isActive: customer.isActive,
    });
  }, [customer, form]);

  const handleSubmit = async (values: CustomerFormValues) => {
    try {
      const body: CreateCustomerRequest = {
        name: values.name,
        phone: values.phone,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        ownerName: values.ownerName || undefined,
        customerType: values.customerType || undefined,
        assignedSeller: values.assignedSeller,
      };

      if (isEdit && id) {
        await updateCustomer({
          id,
          body: body as UpdateCustomerRequest,
        }).unwrap();
        message.success("Cập nhật khách hàng thành công");
        router.push("/admin/customers");
        return;
      }

      await createCustomer(body).unwrap();
      message.success("Thêm khách hàng thành công");
      router.push("/admin/customers");
    } catch {
      message.error(
        isEdit ? "Cập nhật khách hàng thất bại" : "Thêm khách hàng thất bại",
      );
    }
  };

  if (isEdit && loadingCustomer) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa khách hàng"
          description="Cập nhật thông tin khách hàng hoặc điểm bán."
          extra={
            <Button onClick={() => router.push("/admin/customers")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-customer-form-frame is-loading" />
        <CustomerFormStyles />
      </>
    );
  }

  if (isEdit && !customer) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa khách hàng"
          description="Cập nhật thông tin khách hàng hoặc điểm bán."
          extra={
            <Button onClick={() => router.push("/admin/customers")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-customer-form-frame">
          <Empty description="Không tìm thấy khách hàng" />
        </div>
        <CustomerFormStyles />
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={isEdit ? "Sửa khách hàng" : "Thêm khách hàng"}
        description={
          isEdit
            ? "Cập nhật thông tin khách hàng, điểm bán và vị trí GPS."
            : "Tạo khách hàng hoặc điểm bán mới và gán seller phụ trách."
        }
        extra={
          <Button onClick={() => router.push("/admin/customers")}>
            Quay lại
          </Button>
        }
      />

      <section className="admin-customer-form-shell">
        <div className="admin-customer-form-frame">
          <Form<CustomerFormValues>
            form={form}
            layout="vertical"
            initialValues={{ isActive: true }}
            onFinish={handleSubmit}
          >
            <section className="admin-customer-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-customer-form-section-head"
              >
                <div>
                  <Text className="admin-customer-form-section-title">
                    Phân công phụ trách
                  </Text>
                  <Text className="admin-customer-form-section-desc">
                    Chọn seller sẽ theo dõi và chăm sóc điểm bán này.
                  </Text>
                </div>
                <Tag color="blue" className="admin-customer-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label="Nhân viên phụ trách"
                    name="assignedSeller"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn nhân viên phụ trách",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                      allowClear
                      placeholder="Chọn seller"
                      optionFilterProp="label"
                      options={sellers.map((seller) => ({
                        label: `${seller.fullName} - ${seller.email}`,
                        value: seller._id,
                      }))}
                    />
                  </Form.Item>
                </Col>

              </Row>
            </section>

            <section className="admin-customer-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-customer-form-section-head"
              >
                <div>
                  <Text className="admin-customer-form-section-title">
                    Thông tin điểm bán
                  </Text>
                  <Text className="admin-customer-form-section-desc">
                    Nhập thông tin nhận diện, liên hệ và địa chỉ của khách hàng.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[18, 0]}>
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
                      placeholder="Nhập tên khách hàng"
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
                      size="large"
                      allowClear
                      placeholder="Chọn loại khách hàng"
                      options={[
                        { label: "Tạp hóa", value: "Tạp hóa" },
                        { label: "Siêu thị mini", value: "Siêu thị mini" },
                        { label: "Đại lý", value: "Đại lý" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<EnvironmentOutlined />}
                      placeholder="Nhập địa chỉ điểm bán"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className="admin-customer-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-customer-form-section-head"
              >
                <div>
                  <Text className="admin-customer-form-section-title">
                    Vị trí GPS
                  </Text>
                  <Text className="admin-customer-form-section-desc">
                    Có thể để trống nếu chưa có tọa độ chính xác.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Vĩ độ" name="latitude">
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      placeholder="Nhập vĩ độ"
                      controls={false}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Kinh độ" name="longitude">
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      placeholder="Nhập kinh độ"
                      controls={false}
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
              className="admin-customer-form-footer"
            >
              <Flex align="center" gap={10} className="admin-customer-form-note">
                <TeamOutlined />
                <Text>{isEdit ? "Đang cập nhật điểm bán" : "Tạo điểm bán mới"}</Text>
              </Flex>

              <Space wrap>
                <Button
                  size="large"
                  onClick={() => router.push("/admin/customers")}
                  className="admin-customer-form-action"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating || updating}
                  icon={<SaveOutlined />}
                  className="admin-customer-form-action"
                >
                  {isEdit ? "Cập nhật khách hàng" : "Thêm khách hàng"}
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </section>

      <CustomerFormStyles />
    </>
  );
}

function CustomerFormStyles() {
  return (
    <style jsx global>{`
      .admin-customer-form-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-customer-form-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-customer-form-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-customer-loading 1.2s ease infinite;
      }

      @keyframes admin-customer-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-customer-form-section + .admin-customer-form-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-customer-form-section-head {
        margin-bottom: 18px;
      }

      .admin-customer-form-section-title,
      .admin-customer-form-section-desc {
        display: block;
      }

      .admin-customer-form-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-customer-form-section-desc {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-customer-form-section-tag {
        margin-inline-end: 0;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-customer-form-footer {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-customer-form-note {
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-customer-form-note .anticon {
        color: #2563eb;
      }

      .admin-customer-form-note .ant-typography {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 800;
      }

      .admin-customer-form-action {
        height: 40px !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
      }

      @media (max-width: 767px) {
        .admin-customer-form-frame {
          padding: 14px;
        }

        .admin-customer-form-note,
        .admin-customer-form-action {
          width: 100%;
        }
      }
    `}</style>
  );
}
