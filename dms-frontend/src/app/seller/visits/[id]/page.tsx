"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import {
  useCheckOutMutation,
  useGetVisitByIdQuery,
} from "@/features/visits/visitService";
import type {
  CheckOutRequest,
  Visit,
  VisitStatus,
} from "@/features/visits/visitTypes";

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

const statusMap: Record<
  VisitStatus,
  { color: string; text: string; icon: ReactNode }
> = {
  checked_in: {
    color: "processing",
    text: "Đang ghé thăm",
    icon: <ClockCircleOutlined />,
  },
  checked_out: {
    color: "success",
    text: "Hoàn thành",
    icon: <CheckCircleOutlined />,
  },
};

const getCustomerName = (customer: Visit["customer"]) => {
  if (typeof customer === "string") return customer;
  return customer?.name || "-";
};

const getRouteName = (route: Visit["route"]) => {
  if (!route) return "-";
  if (typeof route === "string") return route;
  return route?.name || "-";
};

export default function SellerVisitDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [open, setOpen] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [form] = Form.useForm<CheckOutRequest>();

  const checkOutLatitude = Form.useWatch("checkOutLatitude", form);
  const checkOutLongitude = Form.useWatch("checkOutLongitude", form);
  const hasCheckOutLocation =
    checkOutLatitude !== undefined &&
    checkOutLatitude !== null &&
    checkOutLongitude !== undefined &&
    checkOutLongitude !== null;

  const { data: visit, isLoading } = useGetVisitByIdQuery(id);
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error("Trình duyệt không hỗ trợ lấy vị trí GPS");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          checkOutLatitude: position.coords.latitude,
          checkOutLongitude: position.coords.longitude,
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

  const handleCheckOut = async (values: CheckOutRequest) => {
    if (
      values.checkOutLatitude === undefined ||
      values.checkOutLatitude === null ||
      values.checkOutLongitude === undefined ||
      values.checkOutLongitude === null
    ) {
      message.warning("Vui lòng lấy tọa độ GPS trước khi check-out");
      return;
    }

    try {
      await checkOut({ id, body: values }).unwrap();

      message.success("Check-out thành công");
      setOpen(false);
      router.push("/seller/visits");
    } catch {
      message.error("Check-out thất bại");
    }
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

  if (!visit) {
    return (
      <>
        <SellerBreadcrumb />

        <SellerPageHeader
          title="Chi tiết ghé thăm"
          description="Xem thông tin check-in, check-out và tình trạng xử lý lượt ghé."
          extra={
            <Button onClick={() => router.push("/seller/visits")}>
              Quay lại
            </Button>
          }
        />

        <Card variant="borderless" className="seller-visit-detail-empty-card">
          <Empty description="Không tìm thấy lượt ghé thăm" />
        </Card>
        <Form form={form} component={false} />
      </>
    );
  }

  const currentStatus = statusMap[visit.status] ?? statusMap.checked_in;
  const checkInLocation = `${visit.checkInLatitude}, ${visit.checkInLongitude}`;
  const checkOutLocation =
    visit.checkOutLatitude !== undefined &&
    visit.checkOutLatitude !== null &&
    visit.checkOutLongitude !== undefined &&
    visit.checkOutLongitude !== null
      ? `${visit.checkOutLatitude}, ${visit.checkOutLongitude}`
      : "-";

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Chi tiết ghé thăm"
        description="Xem thông tin check-in, check-out và tình trạng xử lý lượt ghé."
        extra={
          <Flex gap={10} wrap="wrap">
            <Button onClick={() => router.push("/seller/visits")}>
              Quay lại
            </Button>

            {visit.status === "checked_in" && (
              <Button
                type="primary"
                icon={<LogoutOutlined />}
                onClick={() => setOpen(true)}
                className="seller-visit-detail-primary-button"
              >
                Check-out
              </Button>
            )}
          </Flex>
        }
      />

      <Card
        variant="borderless"
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-visit-detail-section-title">
              {getCustomerName(visit.customer)}
            </Text>
            <Text className="seller-visit-detail-section-description">
              Lượt ghé thuộc tuyến {getRouteName(visit.route)} và được ghi nhận
              lúc {new Date(visit.checkInTime).toLocaleString("vi-VN")}.
            </Text>
          </Flex>
        }
        extra={
          <Tag
            color={currentStatus.color}
            icon={currentStatus.icon}
            className="seller-visit-detail-status-tag"
          >
            {currentStatus.text}
          </Tag>
        }
        className="seller-visit-detail-section-card"
      >
        <div className="seller-visit-detail-summary-grid">
          <div>
            <ShopOutlined />
            <span>Khách hàng</span>
            <strong>{getCustomerName(visit.customer)}</strong>
          </div>
          <div>
            <UserOutlined />
            <span>Tuyến</span>
            <strong>{getRouteName(visit.route)}</strong>
          </div>
          <div>
            <EnvironmentOutlined />
            <span>GPS check-in</span>
            <strong>{checkInLocation}</strong>
          </div>
        </div>

        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
          styles={{
            label: {
              width: 210,
              color: COLORS.secondary,
              fontWeight: 750,
              background: COLORS.surface,
            },
            content: {
              color: COLORS.text,
              fontWeight: 650,
              background: "#FFFFFF",
            },
          }}
        >
          <Descriptions.Item label="Khách hàng">
            <Flex align="center" gap={8}>
              <ShopOutlined className="seller-visit-detail-inline-icon" />
              <Text>{getCustomerName(visit.customer)}</Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Tuyến">
            <Flex align="center" gap={8}>
              <UserOutlined className="seller-visit-detail-inline-icon" />
              <Text>{getRouteName(visit.route)}</Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            <Tag
              color={currentStatus.color}
              icon={currentStatus.icon}
              className="seller-visit-detail-status-tag"
            >
              {currentStatus.text}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian check-in">
            {new Date(visit.checkInTime).toLocaleString("vi-VN")}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian check-out">
            {visit.checkOutTime
              ? new Date(visit.checkOutTime).toLocaleString("vi-VN")
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Khoảng cách check-in">
            {visit.checkInDistance !== undefined
              ? `${Math.round(visit.checkInDistance)} m`
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Tọa độ check-in" span="filled">
            <Flex align="center" gap={8}>
              <EnvironmentOutlined className="seller-visit-detail-inline-icon" />
              <Text>{checkInLocation}</Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Độ chính xác GPS">
            {visit.gpsAccuracy !== undefined
              ? `${Math.round(visit.gpsAccuracy)} m`
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Khoảng cách check-out">
            {visit.checkOutDistance !== undefined
              ? `${Math.round(visit.checkOutDistance)} m`
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Tọa độ check-out" span="filled">
            <Text>{checkOutLocation}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú" span="filled">
            <Text
              className={
                visit.note
                  ? "seller-visit-detail-note"
                  : "seller-visit-detail-empty-text"
              }
            >
              {visit.note || "-"}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-visit-detail-modal-title">
              Check-out khách hàng
            </Text>
            <Text className="seller-visit-detail-modal-description">
              Lấy vị trí GPS hiện tại trước khi xác nhận hoàn thành lượt ghé.
            </Text>
          </Flex>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        forceRender
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleCheckOut}>
          <div className="seller-visit-detail-location-box">
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <Flex vertical gap={4}>
                <Text strong>Xác định vị trí check-out</Text>
                <Text>Vị trí này được dùng để hoàn tất lượt ghé.</Text>
              </Flex>

              <Button
                icon={<EnvironmentOutlined />}
                onClick={getCurrentLocation}
                loading={gettingLocation}
                className="seller-visit-detail-secondary-button"
              >
                Lấy vị trí
              </Button>
            </Flex>
          </div>

          <Form.Item
            label="Vĩ độ check-out"
            name="checkOutLatitude"
            rules={[
              {
                required: true,
                message: "Vui lòng lấy vĩ độ check-out",
              },
            ]}
          >
            <InputNumber
              size="large"
              disabled
              className="seller-visit-detail-input-number"
            />
          </Form.Item>

          <Form.Item
            label="Kinh độ check-out"
            name="checkOutLongitude"
            rules={[
              {
                required: true,
                message: "Vui lòng lấy kinh độ check-out",
              },
            ]}
          >
            <InputNumber
              size="large"
              disabled
              className="seller-visit-detail-input-number"
            />
          </Form.Item>

          <Form.Item label="Ghi chú check-out" name="note">
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú sau khi hoàn thành lượt ghé"
              className="seller-visit-detail-textarea"
            />
          </Form.Item>

          <Flex gap={10} wrap="wrap">
            <Button
              type="primary"
              htmlType="submit"
              loading={isCheckingOut}
              disabled={!hasCheckOutLocation}
              className="seller-visit-detail-primary-button"
            >
              Xác nhận check-out
            </Button>

            <Button
              onClick={() => setOpen(false)}
              className="seller-visit-detail-secondary-button"
            >
              Hủy
            </Button>
          </Flex>
        </Form>
      </Modal>

      <style jsx global>{`
        .seller-visit-detail-empty-card,
        .seller-visit-detail-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-visit-detail-empty-card {
          margin-top: 16px;
        }

        .seller-visit-detail-empty-card .ant-card-body {
          padding: 30px;
        }

        .seller-visit-detail-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-visit-detail-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-visit-detail-section-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-visit-detail-section-description,
        .seller-visit-detail-modal-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-visit-detail-summary-grid {
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-visit-detail-summary-grid > div {
          padding: 14px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-visit-detail-summary-grid .anticon,
        .seller-visit-detail-inline-icon {
          color: ${COLORS.primary};
        }

        .seller-visit-detail-summary-grid span {
          display: block;
          margin-top: 6px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
        }

        .seller-visit-detail-summary-grid strong {
          display: block;
          margin-top: 4px;
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-visit-detail-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
        }

        .seller-visit-detail-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-visit-detail-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-visit-detail-secondary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-visit-detail-note {
          color: ${COLORS.text};
          line-height: 1.65;
        }

        .seller-visit-detail-empty-text {
          color: #9caeaa;
          line-height: 1.65;
        }

        .seller-visit-detail-modal-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-visit-detail-location-box {
          margin-bottom: 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-visit-detail-location-box strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-visit-detail-location-box span {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-visit-detail-input-number.ant-input-number {
          width: 100%;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-visit-detail-textarea.ant-input {
          border-color: ${COLORS.border};
          border-radius: 12px;
          resize: vertical;
        }

        @media (max-width: 900px) {
          .seller-visit-detail-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
