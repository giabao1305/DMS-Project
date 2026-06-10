"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Flex,
  Input,
  Row,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import {
  useApproveLeaveMutation,
  useGetLeaveByIdQuery,
  useRejectLeaveMutation,
} from "@/features/leaves/leaveService";
import type { LeaveRequest, LeaveStatus } from "@/features/leaves/leaveTypes";

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<LeaveStatus, { color: string; text: string; icon: ReactNode }> = {
  pending: { color: "gold", text: "Chờ duyệt", icon: <ClockCircleOutlined /> },
  approved: { color: "success", text: "Đã duyệt", icon: <CheckCircleOutlined /> },
  rejected: { color: "error", text: "Từ chối", icon: <CloseCircleOutlined /> },
};

const getUser = (user: LeaveRequest["seller"] | LeaveRequest["approvedBy"]) => {
  if (!user) return "-";
  if (typeof user === "string") return /^[a-f\d]{24}$/i.test(user) ? "-" : user;
  return user.fullName || user.email || "-";
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const getDays = (leave: LeaveRequest) =>
  Math.max(
    1,
    Math.round(
      (new Date(leave.endDate).getTime() -
        new Date(leave.startDate).getTime()) /
        86400000,
    ) + 1,
  );

function MetricCard({
  icon,
  label,
  value,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <div className={`distributor-leave-metric is-${tone}`}>
      <span className="distributor-leave-metric-icon">{icon}</span>
      <span>
        <Text className="distributor-leave-metric-label">{label}</Text>
        <Text className="distributor-leave-metric-value">{value}</Text>
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="distributor-leave-field">
      <Text className="distributor-leave-field-label">{label}</Text>
      <Text className="distributor-leave-field-value">{children}</Text>
    </div>
  );
}

export default function DistributorLeaveDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { message } = App.useApp();
  const { data: leave, isLoading } = useGetLeaveByIdQuery(id);
  const [approveLeave, { isLoading: approving }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejecting }] = useRejectLeaveMutation();
  const [rejectFormOpen, setRejectFormOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const handleApprove = async () => {
    try {
      await approveLeave(id).unwrap();
      message.success("Đã duyệt đơn nghỉ phép");
    } catch {
      message.error("Không thể duyệt đơn nghỉ phép");
    }
  };

  const handleReject = async () => {
    if (!adminNote.trim()) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await rejectLeave({ id, body: { adminNote: adminNote.trim() } }).unwrap();
      message.success("Đã từ chối đơn nghỉ phép");
      setRejectFormOpen(false);
      setAdminNote("");
    } catch {
      message.error("Không thể từ chối đơn nghỉ phép");
    }
  };

  if (isLoading) return <DistributorDetailLoading />;

  return (
    <DistributorDetailShell
      title="Chi tiết nghỉ phép"
      description="Xem lịch nghỉ, lý do và trạng thái phê duyệt của DSR."
      backHref="/distributor/leaves"
    >
      {!leave ? (
        <DistributorDetailEmpty description="Không tìm thấy đơn nghỉ phép" />
      ) : (
        <>
          <DistributorDetailCard
            title={`Đơn nghỉ phép của ${getUser(leave.seller)}`}
            description={`${getDays(leave)} ngày nghỉ đã đăng ký.`}
            extra={
              <Flex gap={10} wrap="wrap" align="center">
                <Tag
                  color={statusMap[leave.status].color}
                  icon={statusMap[leave.status].icon}
                  className="distributor-pill-tag"
                >
                  {statusMap[leave.status].text}
                </Tag>
                {leave.status === "pending" && (
                  <>
                    <Button
                      type="primary"
                      loading={approving}
                      onClick={handleApprove}
                      className="distributor-leave-primary-action"
                    >
                      Duyệt
                    </Button>
                    <Button
                      danger
                      loading={rejecting}
                      onClick={() => setRejectFormOpen(true)}
                    >
                      Từ chối
                    </Button>
                  </>
                )}
              </Flex>
            }
          >
            <Row gutter={[14, 14]} className="distributor-leave-metrics">
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={statusMap[leave.status].icon}
                  label="Trạng thái"
                  value={statusMap[leave.status].text}
                  tone={
                    leave.status === "approved"
                      ? "green"
                      : leave.status === "rejected"
                        ? "red"
                        : "amber"
                  }
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<FieldTimeOutlined />}
                  label="Số ngày nghỉ"
                  value={`${getDays(leave)} ngày`}
                  tone="blue"
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<CalendarOutlined />}
                  label="Ngày bắt đầu"
                  value={formatDate(leave.startDate)}
                  tone="blue"
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<CalendarOutlined />}
                  label="Ngày kết thúc"
                  value={formatDate(leave.endDate)}
                  tone="blue"
                />
              </Col>
            </Row>
          </DistributorDetailCard>

          <Row gutter={[14, 14]}>
            <Col xs={24} lg={16}>
              <DistributorDetailCard
                title="Thông tin đơn nghỉ"
                description="Khoảng thời gian nghỉ, người duyệt và nội dung phản hồi."
              >
                <div className="distributor-leave-field-grid">
                  <Field label="DSR">{getUser(leave.seller)}</Field>
                  <Field label="Trạng thái">
                    <Tag
                      color={statusMap[leave.status].color}
                      icon={statusMap[leave.status].icon}
                      className="distributor-pill-tag"
                    >
                      {statusMap[leave.status].text}
                    </Tag>
                  </Field>
                  <Field label="Ngày bắt đầu">{formatDate(leave.startDate)}</Field>
                  <Field label="Ngày kết thúc">{formatDate(leave.endDate)}</Field>
                  <Field label="Số ngày nghỉ">{getDays(leave)} ngày</Field>
                  <Field label="Người duyệt">{getUser(leave.approvedBy)}</Field>
                  <Field label="Ngày tạo">{formatDateTime(leave.createdAt)}</Field>
                  <Field label="Ngày duyệt">{formatDateTime(leave.approvedAt)}</Field>
                </div>

                <div className="distributor-leave-note">
                  <Flex justify="space-between" align="center" gap={12}>
                    <Text className="distributor-leave-note-title">Lý do nghỉ</Text>
                    <Tag color="blue" className="distributor-pill-tag">
                      DSR gửi
                    </Tag>
                  </Flex>
                  <Paragraph>{leave.reason || "-"}</Paragraph>
                </div>

                <div className="distributor-leave-note">
                  <Flex justify="space-between" align="center" gap={12}>
                    <Text className="distributor-leave-note-title">
                      Phản hồi duyệt
                    </Text>
                    <Tag
                      color={leave.adminNote ? "blue" : "default"}
                      className="distributor-pill-tag"
                    >
                      {leave.adminNote ? "Có phản hồi" : "Chưa có"}
                    </Tag>
                  </Flex>
                  <Paragraph>{leave.adminNote || "-"}</Paragraph>
                </div>

                {rejectFormOpen && (
                  <div className="distributor-leave-reject-panel">
                    <Flex vertical gap={10}>
                      <Text className="distributor-leave-note-title">
                        Từ chối đơn nghỉ phép
                      </Text>
                      <TextArea
                        rows={3}
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value)}
                        placeholder="Nhập lý do từ chối để DSR nắm rõ"
                      />
                      <Flex justify="end" gap={10} wrap="wrap">
                        <Button onClick={() => setRejectFormOpen(false)}>
                          Hủy
                        </Button>
                        <Button
                          danger
                          type="primary"
                          loading={rejecting}
                          onClick={handleReject}
                        >
                          Xác nhận từ chối
                        </Button>
                      </Flex>
                    </Flex>
                  </div>
                )}
              </DistributorDetailCard>
            </Col>

            <Col xs={24} lg={8}>
              <DistributorDetailCard
                title="Dòng thời gian"
                description="Các mốc gửi, duyệt hoặc từ chối đơn nghỉ."
              >
                <Timeline
                  items={[
                    {
                      color: "blue",
                      dot: <CalendarOutlined />,
                      children: (
                        <div className="distributor-leave-timeline-item">
                          <Text strong>Gửi đơn nghỉ phép</Text>
                          <span>{formatDateTime(leave.createdAt)}</span>
                          <small>{getUser(leave.seller)}</small>
                        </div>
                      ),
                    },
                    {
                      color:
                        leave.status === "approved"
                          ? "green"
                          : leave.status === "rejected"
                            ? "red"
                            : "gray",
                      dot:
                        leave.status === "approved" ? (
                          <CheckCircleOutlined />
                        ) : leave.status === "rejected" ? (
                          <CloseCircleOutlined />
                        ) : (
                          <ClockCircleOutlined />
                        ),
                      children: (
                        <div className="distributor-leave-timeline-item">
                          <Text strong>{statusMap[leave.status].text}</Text>
                          <span>{formatDateTime(leave.approvedAt)}</span>
                          <small>{getUser(leave.approvedBy)}</small>
                        </div>
                      ),
                    },
                  ]}
                />
              </DistributorDetailCard>

              <DistributorDetailCard
                title="DSR liên quan"
                description="Nhân sự xin nghỉ trong đội."
              >
                <div className="distributor-leave-person-line">
                  <span className="distributor-leave-person-icon">
                    <TeamOutlined />
                  </span>
                  <span>
                    <Text className="distributor-leave-person-label">DSR</Text>
                    <Text className="distributor-leave-person-value">
                      {getUser(leave.seller)}
                    </Text>
                  </span>
                </div>
                <div className="distributor-leave-person-line">
                  <span className="distributor-leave-person-icon">
                    <CheckCircleOutlined />
                  </span>
                  <span>
                    <Text className="distributor-leave-person-label">
                      Người duyệt
                    </Text>
                    <Text className="distributor-leave-person-value">
                      {getUser(leave.approvedBy)}
                    </Text>
                  </span>
                </div>
              </DistributorDetailCard>
            </Col>
          </Row>
        </>
      )}

      <style jsx global>{`
        .distributor-leave-metric {
          display: flex;
          min-height: 92px;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #f8fbff;
        }

        .distributor-leave-metric-icon,
        .distributor-leave-person-icon {
          display: inline-flex;
          width: 38px;
          height: 38px;
          min-width: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #2563eb;
          background: #dbeafe;
        }

        .distributor-leave-metric.is-green .distributor-leave-metric-icon {
          color: #16a34a;
          background: #dcfce7;
        }

        .distributor-leave-metric.is-amber .distributor-leave-metric-icon {
          color: #d97706;
          background: #fef3c7;
        }

        .distributor-leave-metric.is-red .distributor-leave-metric-icon {
          color: #dc2626;
          background: #fee2e2;
        }

        .distributor-leave-metric-label,
        .distributor-leave-metric-value,
        .distributor-leave-field-label,
        .distributor-leave-field-value,
        .distributor-leave-person-label,
        .distributor-leave-person-value {
          display: block;
        }

        .distributor-leave-metric-label,
        .distributor-leave-field-label,
        .distributor-leave-person-label {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 750;
        }

        .distributor-leave-metric-value,
        .distributor-leave-field-value,
        .distributor-leave-person-value {
          color: #0f172a !important;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-leave-field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .distributor-leave-field,
        .distributor-leave-note,
        .distributor-leave-reject-panel {
          padding: 12px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
        }

        .distributor-leave-field {
          min-height: 72px;
        }

        .distributor-leave-note,
        .distributor-leave-reject-panel {
          margin-top: 14px;
          background: #eff6ff;
        }

        .distributor-leave-note-title {
          color: #0f172a !important;
          font-weight: 850;
        }

        .distributor-leave-note .ant-typography {
          margin-bottom: 0;
          color: #334155;
          font-weight: 600;
        }

        .distributor-leave-reject-panel .ant-input {
          border-radius: 8px !important;
        }

        .distributor-leave-timeline-item {
          display: grid;
          gap: 2px;
        }

        .distributor-leave-timeline-item .ant-typography {
          color: #0f172a !important;
        }

        .distributor-leave-timeline-item span,
        .distributor-leave-timeline-item small {
          color: #64748b;
          font-weight: 650;
          word-break: break-word;
        }

        .distributor-leave-person-line {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
        }

        .distributor-leave-person-line + .distributor-leave-person-line {
          border-top: 1px solid #dbeafe;
        }

        .distributor-content
          .distributor-leave-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .distributor-leave-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }

        @media (max-width: 767px) {
          .distributor-leave-field-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </DistributorDetailShell>
  );
}
