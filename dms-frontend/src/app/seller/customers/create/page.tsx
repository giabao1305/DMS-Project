"use client";

import {
  EnvironmentOutlined,
  PhoneOutlined,
  PlusOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useCreateCustomerMutation } from "@/features/customers/customerService";
import type { CreateCustomerRequest } from "@/features/customers/customerTypes";
import { useGetSellerUsersQuery } from "@/features/users/userService";
import { useAppSelector } from "@/store/hooks";

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

export default function SellerCreateCustomerPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<CreateCustomerRequest>();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isDistributor = currentUser?.role === "distributor";
  const [createCustomer, { isLoading }] = useCreateCustomerMutation();
  const { data: managedSellers = [], isFetching: loadingManagedSellers } =
    useGetSellerUsersQuery(undefined, {
      skip: !isDistributor,
    });

  const handleSubmit = async (values: CreateCustomerRequest) => {
    try {
      const body = Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      ) as CreateCustomerRequest;

      await createCustomer(body).unwrap();

      message.success("Thêm khách hàng thành công, vui lòng chờ admin duyệt");
      router.push("/seller/customers");
    } catch {
      message.error("Thêm khách hàng thất bại");
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

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Thêm khách hàng"
        description="Tạo khách hàng hoặc điểm bán mới và gửi admin duyệt."
        extra={
          <Button onClick={() => router.push("/seller/customers")}>
            Quay lại
          </Button>
        }
      />

      <Card
        variant="borderless"
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-customer-form-section-title">
              Thông tin khách hàng
            </Text>
            <Text className="seller-customer-form-section-description">
              Nhập thông tin điểm bán, liên hệ và tọa độ GPS nếu có.
            </Text>
          </Flex>
        }
        className="seller-customer-form-section-card"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark>
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
                    <ShopOutlined className="seller-customer-form-input-icon" />
                  }
                  placeholder="Nhập tên khách hàng hoặc điểm bán"
                  className="seller-customer-form-input"
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
                    <PhoneOutlined className="seller-customer-form-input-icon" />
                  }
                  placeholder="Nhập số điện thoại liên hệ"
                  className="seller-customer-form-input"
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
                  className="seller-customer-form-textarea"
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item label="Chủ cửa hàng" name="ownerName">
                <Input
                  size="large"
                  prefix={
                    <UserOutlined className="seller-customer-form-input-icon" />
                  }
                  placeholder="Nhập tên chủ cửa hàng"
                  className="seller-customer-form-input"
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

            {isDistributor ? (
              <Col xs={24} lg={12}>
                <Form.Item
                  label="DSR phụ trách"
                  name="assignedSeller"
                  rules={[
                    { required: true, message: "Vui lòng chọn DSR phụ trách" },
                  ]}
                >
                  <Select
                    showSearch
                    size="large"
                    loading={loadingManagedSellers}
                    placeholder="Chọn DSR trong đội"
                    optionFilterProp="label"
                    options={managedSellers.map((seller) => ({
                      label: `${seller.fullName} - ${seller.email}`,
                      value: seller._id,
                    }))}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            ) : null}
          </Row>

          <div className="seller-customer-form-coordinate-note">
            <Flex vertical gap={4}>
              <Text strong>Tọa độ vị trí</Text>
              <Text>
                Có thể nhập vĩ độ và kinh độ để lưu chính xác vị trí điểm bán.
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
                    className="seller-customer-form-coordinate-input"
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
                    className="seller-customer-form-coordinate-input"
                  />
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>

          <Flex gap={10} wrap="wrap" style={{ marginTop: 10 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<PlusOutlined />}
              className="seller-customer-form-primary-button"
            >
              Thêm khách hàng
            </Button>

            <Button
              onClick={() => router.push("/seller/customers")}
              className="seller-customer-form-secondary-button"
            >
              Hủy
            </Button>
          </Flex>
        </Form>
      </Card>

      <style jsx global>{`
        .seller-customer-form-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-customer-form-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-customer-form-section-card .ant-card-body {
          padding: 22px;
        }

        .seller-customer-form-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-customer-form-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-customer-form-input.ant-input-affix-wrapper,
        .seller-customer-form-textarea.ant-input,
        .seller-customer-form-coordinate-input.ant-input-number {
          width: 100%;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-customer-form-input-icon {
          color: ${COLORS.secondary};
        }

        .seller-customer-form-textarea.ant-input {
          resize: vertical;
        }

        .seller-customer-form-coordinate-input.ant-input-number {
          border-radius: 0 12px 12px 0;
        }

        .seller-customer-form-coordinate-note {
          margin: 8px 0 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-customer-form-coordinate-note strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-customer-form-coordinate-note span {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-customer-form-primary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-customer-form-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-customer-form-secondary-button.ant-btn {
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
