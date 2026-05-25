"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Row,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetLeaveByIdQuery } from "@/features/leaves/leaveService";
import type { LeaveRequest, LeaveStatus } from "@/features/leaves/leaveTypes";

const { Text } = Typography;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  softPrimary: "#E7F8F5",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
  dark: "#07171F",
  darkMuted: "#A9D8D1",
};

const statusMap: Record<
  LeaveStatus,
  { color: string; text: string; icon: ReactNode; description: string }
> = {
  pending: {
    color: "gold",
    text: "Chờ duyệt",
    icon: <ClockCircleOutlined />,
    description: "Admin đang xem xét yêu cầu nghỉ phép của bạn.",
  },
  approved: {
    color: "green",
    text: "Đã duyệt",
    icon: <CheckCircleOutlined />,
    description: "Yêu cầu nghỉ phép đã được chấp thuận.",
  },
  rejected: {
    color: "red",
    text: "Từ chối",
    icon: <CloseCircleOutlined />,
    description: "Yêu cầu chưa được chấp thuận, hãy xem phản hồi admin.",
  },
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const getLeaveDays = (leave: Pick<LeaveRequest, "startDate" | "endDate">) => {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
};

const getUserName = (user: LeaveRequest["approvedBy"]) => {
  if (!user) return "-";
  if (typeof user === "string") return /^[a-f\d]{24}$/i.test(user) ? "-" : user;
  return user.fullName || user.email || "-";
};

export default function SellerLeaveDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data: leave, isLoading } = useGetLeaveByIdQuery(id);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!leave) {
    return (
      <>
        <SellerBreadcrumb />

        <SellerPageHeader
          title="Chi tiết đơn nghỉ phép"
          description="Xem trạng thái và phản hồi từ admin."
          extra={
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/seller/leaves")}
              className="seller-leave-detail-back-button"
            >
              Quay lại
            </Button>
          }
        />

        <Card variant="borderless" className="seller-leave-detail-empty-card">
          <Empty description="Không tìm thấy đơn nghỉ phép" />
        </Card>
      </>
    );
  }

  const currentStatus = statusMap[leave.status] ?? statusMap.pending;
  const startText = formatDate(leave.startDate);
  const endText = formatDate(leave.endDate);

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Chi tiết đơn nghỉ phép"
        description="Xem trạng thái, thời gian nghỉ và phản hồi từ admin."
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/seller/leaves")}
            className="seller-leave-detail-back-button"
          >
            Quay lại
          </Button>
        }
      />

      <Row gutter={[18, 18]} align="stretch" className="seller-leave-detail-shell">
        <Col xs={24} lg={8}>
          <Card
            variant="borderless"
            className="seller-leave-detail-status-card"
            styles={{ body: { padding: 0 } }}
          >
            <div className="seller-leave-detail-status-dark">
              <Text className="seller-leave-detail-status-eyebrow">
                Leave status
              </Text>
              <div className="seller-leave-detail-status-title">
                {currentStatus.text}
              </div>
              <Text className="seller-leave-detail-status-description">
                {currentStatus.description}
              </Text>

              <Tag
                color={currentStatus.color}
                icon={currentStatus.icon}
                className="seller-leave-detail-hero-tag"
              >
                {currentStatus.text}
              </Tag>

              <div className="seller-leave-detail-status-meter">
                <span>{getLeaveDays(leave)}</span>
                <label>Số ngày nghỉ đã đăng ký</label>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            title={
              <Flex vertical gap={2}>
                <Text strong className="seller-leave-detail-section-title">
                  Đơn nghỉ phép của bạn
                </Text>
                <Text className="seller-leave-detail-section-description">
                  Từ {startText} đến {endText}.
                </Text>
              </Flex>
            }
            extra={
              <Tag
                color={currentStatus.color}
                icon={currentStatus.icon}
                className="seller-leave-detail-status-tag"
              >
                {currentStatus.text}
              </Tag>
            }
            className="seller-leave-detail-section-card"
          >
            <div className="seller-leave-detail-summary-grid">
              <div>
                <CalendarOutlined />
                <span>Ngày bắt đầu</span>
                <strong>{startText}</strong>
              </div>
              <div>
                <CalendarOutlined />
                <span>Ngày kết thúc</span>
                <strong>{endText}</strong>
              </div>
              <div>
                <UserOutlined />
                <span>Người duyệt</span>
                <strong>{getUserName(leave.approvedBy)}</strong>
              </div>
            </div>

            <div className="seller-leave-detail-note-box">
              <Flex align="flex-start" gap={12}>
                <FileTextOutlined />
                <Flex vertical gap={4}>
                  <Text strong>Lý do nghỉ</Text>
                  <Text>{leave.reason || "-"}</Text>
                </Flex>
              </Flex>
            </div>

            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
              className="seller-leave-detail-descriptions"
              styles={{
                label: {
                  width: 190,
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
              <Descriptions.Item label="Thời gian nghỉ" span="filled">
                <Flex align="center" gap={8}>
                  <CalendarOutlined className="seller-leave-detail-inline-icon" />
                  <Text>
                    {startText} - {endText}
                  </Text>
                </Flex>
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={currentStatus.color}
                  icon={currentStatus.icon}
                  className="seller-leave-detail-status-tag"
                >
                  {currentStatus.text}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Người duyệt">
                <Flex align="center" gap={8}>
                  <UserOutlined className="seller-leave-detail-inline-icon" />
                  <Text>{getUserName(leave.approvedBy)}</Text>
                </Flex>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày duyệt">
                {formatDateTime(leave.approvedAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo">
                {formatDateTime(leave.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Phản hồi admin" span="filled">
                <Text
                  className={
                    leave.adminNote
                      ? "seller-leave-detail-note"
                      : "seller-leave-detail-empty-text"
                  }
                >
                  {leave.adminNote || "Chưa có phản hồi"}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .seller-leave-detail-shell {
          position: relative;
        }

        .seller-leave-detail-shell::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 190px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-leave-detail-shell > .ant-col {
          position: relative;
          z-index: 1;
        }

        .seller-leave-detail-empty-card,
        .seller-leave-detail-section-card,
        .seller-leave-detail-status-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-leave-detail-empty-card {
          margin-top: 16px;
        }

        .seller-leave-detail-empty-card .ant-card-body {
          padding: 30px;
        }

        .seller-leave-detail-status-card {
          height: 100%;
        }

        .seller-leave-detail-status-dark {
          min-height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-leave-detail-status-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-leave-detail-status-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 28px;
          font-weight: 850;
          line-height: 1.15;
          letter-spacing: 0;
        }

        .seller-leave-detail-status-description {
          display: block;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-leave-detail-hero-tag.ant-tag {
          width: fit-content;
          margin-top: 18px;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 800;
          line-height: 28px;
          padding-inline: 12px;
        }

        .seller-leave-detail-status-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .seller-leave-detail-status-meter span {
          display: block;
          color: #ffffff;
          font-size: 32px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-leave-detail-status-meter label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-leave-detail-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-leave-detail-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-leave-detail-section-title {
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-leave-detail-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-leave-detail-summary-grid {
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-leave-detail-summary-grid > div {
          min-height: 96px;
          padding: 14px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-leave-detail-summary-grid .anticon,
        .seller-leave-detail-inline-icon,
        .seller-leave-detail-note-box .anticon {
          color: ${COLORS.primary};
        }

        .seller-leave-detail-summary-grid span {
          display: block;
          margin-top: 6px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
        }

        .seller-leave-detail-summary-grid strong {
          display: block;
          margin-top: 4px;
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-leave-detail-note-box {
          margin-bottom: 14px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: #ffffff;
        }

        .seller-leave-detail-note-box strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-leave-detail-note-box span {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.65;
        }

        .seller-leave-detail-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
        }

        .seller-leave-detail-note {
          color: ${COLORS.text};
          line-height: 1.65;
        }

        .seller-leave-detail-empty-text {
          color: #9caeaa;
          line-height: 1.65;
        }

        .seller-leave-detail-back-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-leave-detail-back-button.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        @media (max-width: 991px) {
          .seller-leave-detail-status-dark {
            min-height: 260px;
          }
        }

        @media (max-width: 900px) {
          .seller-leave-detail-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
