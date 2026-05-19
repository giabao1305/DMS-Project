"use client";

import {
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
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
  Space,
  Spin,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/features/customers/customerService";
import type { UpdateCustomerRequest } from "@/features/customers/customerTypes";

const { Text } = Typography;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
};

export default function SellerEditCustomerPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [form] = Form.useForm<UpdateCustomerRequest>();

  const { data: customer, isLoading } = useGetCustomerByIdQuery(id);
  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        ownerName: customer.ownerName,
        customerType: customer.customerType,
        latitude: customer.latitude,
        longitude: customer.longitude,
      });
    }
  }, [customer, form]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/seller/customers");
  };

  const handleSubmit = async (values: UpdateCustomerRequest) => {
    try {
      const body = Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      ) as UpdateCustomerRequest;

      await updateCustomer({ id, body }).unwrap();

      message.success("Cập nhật khách hàng thành công");
      router.push(`/seller/customers/${id}`);
    } catch {
      message.error("Cập nhật khách hàng thất bại");
    }
  };

  const coordinatePrefixStyle = {
    width: 52,
    height: 40,
    borderRadius: "12px 0 0 12px",
    borderColor: COLORS.border,
    background: COLORS.surface,
    color: COLORS.secondary,
    boxShadow: "none",
    cursor: "default",
  };

  if (isLoading) {
    return (
      <>
        <Form form={form} component={false} />
        <Flex align="center" justify="center" style={{ minHeight: 360 }}>
          <Spin size="large" />
        </Flex>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <SellerBreadcrumb />

        <SellerPageHeader
          title="Sửa khách hàng"
          description="Cập nhật thông tin khách hàng hoặc điểm bán."
          extra={<Button onClick={handleBack}>Quay lại</Button>}
        />

        <Card variant="borderless" className="seller-customer-edit-empty-card">
          <Empty description="Không tìm thấy khách hàng" />
        </Card>
        <Form form={form} component={false} />
      </>
    );
  }

  const isApproved = customer.status === "approved";

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Sửa khách hàng"
        description="Cập nhật thông tin khách hàng hoặc điểm bán."
        extra={<Button onClick={handleBack}>Quay lại</Button>}
      />

      <Flex vertical gap={16}>
        {isApproved && (
          <Alert
            showIcon
            type="info"
            message="Khách hàng đã được duyệt"
            description="Thông tin của khách hàng đã duyệt hiện không thể chỉnh sửa từ tài khoản seller."
            className="seller-customer-edit-alert"
          />
        )}

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-customer-edit-section-title">
                Cập nhật thông tin khách hàng
              </Text>
              <Text className="seller-customer-edit-section-description">
                Điều chỉnh dữ liệu điểm bán, thông tin liên hệ và tọa độ GPS.
              </Text>
            </Flex>
          }
          className="seller-customer-edit-section-card"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={isApproved}
            requiredMark
          >
            <Row gutter={[18, 4]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Tên khách hàng"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên khách hàng" },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={
                      <ShopOutlined className="seller-customer-edit-input-icon" />
                    }
                    placeholder="Nhập tên khách hàng hoặc điểm bán"
                    className="seller-customer-edit-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={
                      <PhoneOutlined className="seller-customer-edit-input-icon" />
                    }
                    placeholder="Nhập số điện thoại liên hệ"
                    className="seller-customer-edit-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Địa chỉ"
                  name="address"
                  rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập địa chỉ khách hàng hoặc điểm bán"
                    className="seller-customer-edit-textarea"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item label="Chủ cửa hàng" name="ownerName">
                  <Input
                    size="large"
                    prefix={
                      <UserOutlined className="seller-customer-edit-input-icon" />
                    }
                    placeholder="Nhập tên chủ cửa hàng"
                    className="seller-customer-edit-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
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
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="seller-customer-edit-coordinate-note">
              <Flex vertical gap={4}>
                <Text strong>Tọa độ vị trí</Text>
                <Text>
                  Cập nhật vĩ độ và kinh độ để xác định chính xác vị trí điểm
                  bán.
                </Text>
              </Flex>
            </div>

            <Row gutter={[18, 4]}>
              <Col xs={24} lg={12}>
                <Form.Item label="Vĩ độ" name="latitude">
                  <Space.Compact block>
                    <Button
                      disabled
                      icon={<EnvironmentOutlined />}
                      style={coordinatePrefixStyle}
                    />
                    <InputNumber
                      size="large"
                      placeholder="Ví dụ: 10.0452"
                      className="seller-customer-edit-coordinate-input"
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>

              <Col xs={24} lg={12}>
                <Form.Item label="Kinh độ" name="longitude">
                  <Space.Compact block>
                    <Button
                      disabled
                      icon={<EnvironmentOutlined />}
                      style={coordinatePrefixStyle}
                    />
                    <InputNumber
                      size="large"
                      placeholder="Ví dụ: 105.7469"
                      className="seller-customer-edit-coordinate-input"
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>

            <Flex gap={10} wrap="wrap" style={{ marginTop: 10 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                icon={<EditOutlined />}
                className="seller-customer-edit-primary-button"
              >
                Cập nhật khách hàng
              </Button>

              <Button
                onClick={handleBack}
                className="seller-customer-edit-secondary-button"
              >
                Hủy
              </Button>
            </Flex>
          </Form>
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-customer-edit-empty-card,
        .seller-customer-edit-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-customer-edit-empty-card {
          margin-top: 16px;
        }

        .seller-customer-edit-empty-card .ant-card-body {
          padding: 30px;
        }

        .seller-customer-edit-alert.ant-alert {
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-customer-edit-alert .ant-alert-message {
          color: ${COLORS.text};
          font-weight: 850;
        }

        .seller-customer-edit-alert .ant-alert-description {
          color: ${COLORS.secondary};
        }

        .seller-customer-edit-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-customer-edit-section-card .ant-card-body {
          padding: 22px;
        }

        .seller-customer-edit-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-customer-edit-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-customer-edit-input.ant-input-affix-wrapper,
        .seller-customer-edit-textarea.ant-input,
        .seller-customer-edit-coordinate-input.ant-input-number {
          width: 100%;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-customer-edit-input-icon {
          color: ${COLORS.secondary};
        }

        .seller-customer-edit-textarea.ant-input {
          resize: vertical;
        }

        .seller-customer-edit-coordinate-input.ant-input-number {
          border-radius: 0 12px 12px 0;
        }

        .seller-customer-edit-coordinate-note {
          margin: 8px 0 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-customer-edit-coordinate-note strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-customer-edit-coordinate-note span {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-customer-edit-primary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-customer-edit-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-customer-edit-secondary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }
      `}</style>
    </>
  );
}
