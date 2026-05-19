"use client";

import {
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetCustomerByIdQuery } from "@/features/customers/customerService";

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

const statusMap = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  rejected: { color: "red", text: "Từ chối" },
};

export default function SellerCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: customer, isLoading } = useGetCustomerByIdQuery(id);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!customer) {
    return (
      <>
        <SellerBreadcrumb />

        <SellerPageHeader
          title="Chi tiết khách hàng"
          description="Xem thông tin chi tiết khách hàng, điểm bán và trạng thái duyệt."
          extra={
            <Link href="/seller/customers">
              <Button>Quay lại</Button>
            </Link>
          }
        />

        <Card className="seller-customer-detail-empty" variant="borderless">
          <Empty description="Không tìm thấy khách hàng" />
        </Card>
      </>
    );
  }

  const currentStatus = statusMap[
    customer.status as keyof typeof statusMap
  ] || {
    color: "default",
    text: customer.status || "-",
  };

  const canEdit = customer.status !== "approved";
  const gpsText =
    customer.latitude && customer.longitude
      ? `${customer.latitude}, ${customer.longitude}`
      : "-";

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Chi tiết khách hàng"
        description="Xem thông tin chi tiết khách hàng, điểm bán và trạng thái duyệt."
        extra={
          <Flex gap={10} wrap="wrap">
            <Link href="/seller/customers">
              <Button>Quay lại</Button>
            </Link>

            {canEdit && (
              <Link href={`/seller/customers/${customer._id}/edit`}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  className="seller-customer-detail-primary-button"
                >
                  Sửa khách hàng
                </Button>
              </Link>
            )}
          </Flex>
        }
      />

      <Card
        variant="borderless"
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-customer-detail-section-title">
              {customer.name}
            </Text>
            <Text className="seller-customer-detail-section-description">
              Thông tin điểm bán, liên hệ và trạng thái phê duyệt.
            </Text>
          </Flex>
        }
        className="seller-customer-detail-section-card"
      >
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
          styles={{
            label: {
              width: 190,
              color: COLORS.secondary,
              fontWeight: 750,
              background: COLORS.surface,
            },
            content: {
              color: COLORS.text,
              fontWeight: 600,
              background: "#FFFFFF",
            },
          }}
        >
          <Descriptions.Item label="Tên khách hàng">
            <Flex align="center" gap={8}>
              <ShopOutlined className="seller-customer-detail-inline-icon" />
              <Text className="seller-customer-detail-strong">
                {customer.name}
              </Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            <Flex align="center" gap={8}>
              <PhoneOutlined className="seller-customer-detail-inline-icon" />
              <Text>{customer.phone || "-"}</Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Địa chỉ" span="filled">
            <Flex align="flex-start" gap={8}>
              <EnvironmentOutlined className="seller-customer-detail-inline-icon" />
              <Text className="seller-customer-detail-address">
                {customer.address || "-"}
              </Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Chủ cửa hàng">
            <Flex align="center" gap={8}>
              <UserOutlined className="seller-customer-detail-inline-icon" />
              <Text>{customer.ownerName || "-"}</Text>
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Loại khách hàng">
            <Tag color="cyan" className="seller-customer-detail-tag">
              {customer.customerType || "Chưa phân loại"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái duyệt" span="filled">
            <Flex vertical gap={10}>
              <Tag color={currentStatus.color} className="seller-customer-detail-tag">
                {currentStatus.text}
              </Tag>

              {customer.status === "rejected" && customer.rejectReason && (
                <div className="seller-customer-detail-reject-box">
                  <Text>Lý do từ chối: {customer.rejectReason}</Text>
                </div>
              )}
            </Flex>
          </Descriptions.Item>

          <Descriptions.Item label="Tọa độ GPS">
            <Text>{gpsText}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo">
            <Text>
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleString("vi-VN")
                : "-"}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <style jsx global>{`
        .seller-customer-detail-empty,
        .seller-customer-detail-section-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-customer-detail-empty .ant-card-body {
          padding: 30px;
        }

        .seller-customer-detail-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-customer-detail-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-customer-detail-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-customer-detail-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-customer-detail-section-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-customer-detail-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-customer-detail-inline-icon {
          color: ${COLORS.primary};
        }

        .seller-customer-detail-strong {
          color: ${COLORS.text};
          font-weight: 800;
        }

        .seller-customer-detail-address {
          color: ${COLORS.text};
          line-height: 1.65;
        }

        .seller-customer-detail-tag.ant-tag {
          width: fit-content;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
        }

        .seller-customer-detail-reject-box {
          padding: 12px 14px;
          border: 1px solid #fecdd3;
          border-radius: 14px;
          background: #fff1f2;
          color: #be123c;
          font-size: 14px;
          font-weight: 650;
          line-height: 1.6;
        }
      `}</style>
    </>
  );
}
