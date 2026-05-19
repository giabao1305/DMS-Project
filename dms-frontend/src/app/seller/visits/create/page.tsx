"use client";

import {
  EnvironmentOutlined,
  SaveOutlined,
  ShopOutlined,
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
  Typography,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import { useCheckInMutation } from "@/features/visits/visitService";
import type { CheckInRequest } from "@/features/visits/visitTypes";

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

export default function SellerCreateVisitPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const customerId = searchParams.get("customer") || undefined;
  const routeId = searchParams.get("route") || undefined;

  const [form] = Form.useForm<CheckInRequest>();
  const [gettingLocation, setGettingLocation] = useState(false);

  const checkInLatitude = Form.useWatch("checkInLatitude", form);
  const checkInLongitude = Form.useWatch("checkInLongitude", form);
  const hasLocation =
    checkInLatitude !== undefined &&
    checkInLatitude !== null &&
    checkInLongitude !== undefined &&
    checkInLongitude !== null;

  const { data: customers = [] } = useGetMyCustomersQuery();
  const [checkIn, { isLoading }] = useCheckInMutation();

  const approvedCustomers = useMemo(() => {
    return customers.filter(
      (item) => item.status === "approved" && item.isActive,
    );
  }, [customers]);

  useEffect(() => {
    form.setFieldsValue({
      customer: customerId,
      route: routeId,
    });
  }, [customerId, routeId, form]);

  const goBack = () => {
    if (routeId) {
      router.push(`/seller/routes/${routeId}`);
      return;
    }

    router.push("/seller/visits");
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error("Trình duyệt không hỗ trợ lấy vị trí GPS");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          checkInLatitude: position.coords.latitude,
          checkInLongitude: position.coords.longitude,
          gpsAccuracy: position.coords.accuracy,
        });

        message.success("Đã lấy vị trí hiện tại");
        setGettingLocation(false);
      },
      () => {
        message.error("Không lấy được vị trí hiện tại");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleSubmit = async (values: CheckInRequest) => {
    try {
      await checkIn({
        ...values,
        route: routeId,
      }).unwrap();

      message.success("Check-in thành công");
      goBack();
    } catch {
      message.error("Check-in thất bại. Kiểm tra vị trí GPS hoặc khách hàng.");
    }
  };

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Check-in khách hàng"
        description="Tạo lượt ghé thăm khách hàng bằng vị trí GPS hiện tại."
        extra={<Button onClick={goBack}>Quay lại</Button>}
      />

      <Card
        variant="borderless"
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-visit-create-section-title">
              Thông tin check-in
            </Text>
            <Text className="seller-visit-create-section-description">
              Chọn khách hàng và lấy tọa độ GPS trước khi lưu lượt ghé.
            </Text>
          </Flex>
        }
        className="seller-visit-create-section-card"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[18, 4]}>
            <Col xs={24}>
              <Form.Item
                label="Khách hàng"
                name="customer"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn khách hàng",
                  },
                ]}
              >
                <Select
                  showSearch
                  size="large"
                  placeholder="Chọn khách hàng đã duyệt"
                  optionFilterProp="label"
                  disabled={Boolean(customerId)}
                  options={approvedCustomers.map((customer) => ({
                    label: `${customer.name} - ${customer.phone}`,
                    value: customer._id,
                  }))}
                  suffixIcon={<ShopOutlined />}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="route" hidden>
            <Input />
          </Form.Item>

          <div className="seller-visit-create-location-box">
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <Flex vertical gap={4}>
                <Text strong>Xác định vị trí hiện tại</Text>
                <Text>
                  Hệ thống dùng GPS để ghi nhận vị trí và khoảng cách check-in.
                </Text>
              </Flex>

              <Button
                icon={<EnvironmentOutlined />}
                onClick={getCurrentLocation}
                loading={gettingLocation}
                className="seller-visit-create-secondary-button"
              >
                Lấy vị trí hiện tại
              </Button>
            </Flex>
          </div>

          <Row gutter={[18, 4]}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="Vĩ độ check-in"
                name="checkInLatitude"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng lấy vị trí GPS",
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  placeholder="Tự động điền sau khi lấy GPS"
                  className="seller-visit-create-input-number"
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                label="Kinh độ check-in"
                name="checkInLongitude"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng lấy vị trí GPS",
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  placeholder="Tự động điền sau khi lấy GPS"
                  className="seller-visit-create-input-number"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Độ chính xác GPS" name="gpsAccuracy">
                <InputNumber
                  size="large"
                  disabled
                  placeholder="Độ chính xác được đo từ trình duyệt"
                  className="seller-visit-create-input-number"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập ghi chú khi ghé thăm"
                  className="seller-visit-create-textarea"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="seller-visit-create-location-status">
            <EnvironmentOutlined />
            <span>
              {hasLocation
                ? "Đã có tọa độ GPS, có thể lưu check-in."
                : "Chưa có tọa độ GPS, vui lòng lấy vị trí hiện tại."}
            </span>
          </div>

          <Flex gap={10} wrap="wrap" style={{ marginTop: 10 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<SaveOutlined />}
              className="seller-visit-create-primary-button"
            >
              Check-in
            </Button>

            <Button onClick={goBack} className="seller-visit-create-secondary-button">
              Hủy
            </Button>
          </Flex>
        </Form>
      </Card>

      <style jsx global>{`
        .seller-visit-create-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-visit-create-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-visit-create-section-card .ant-card-body {
          padding: 22px;
        }

        .seller-visit-create-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-visit-create-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-visit-create-location-box,
        .seller-visit-create-location-status {
          margin: 8px 0 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-visit-create-location-box strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-visit-create-location-box span {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-visit-create-input-number.ant-input-number,
        .seller-visit-create-textarea.ant-input {
          width: 100%;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-visit-create-textarea.ant-input {
          resize: vertical;
        }

        .seller-visit-create-location-status {
          margin-top: 2px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${COLORS.secondary};
          font-size: 13px;
          font-weight: 750;
          line-height: 1.45;
        }

        .seller-visit-create-location-status .anticon {
          color: ${COLORS.primary};
        }

        .seller-visit-create-primary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-visit-create-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-visit-create-secondary-button.ant-btn {
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
