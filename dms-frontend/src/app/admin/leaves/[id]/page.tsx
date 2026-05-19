"use client";

import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Empty,
  Flex,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useApproveLeaveMutation,
  useGetLeaveByIdQuery,
  useRejectLeaveMutation,
} from "@/features/leaves/leaveService";
import type { LeaveStatus } from "@/features/leaves/leaveTypes";
import type { User } from "@/features/users/userTypes";

const { Text, Title } = Typography;

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const statusMap: Record<LeaveStatus, { label: string; color: string }> = {
  pending: { label: "Chờ duyệt", color: "orange" },
  approved: { label: "Đã duyệt", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
};

const toValidDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const isBetweenDays = (date: Date, start: Date, end: Date) => {
  const currentTime = normalizeDate(date).getTime();
  return (
    currentTime >= normalizeDate(start).getTime() &&
    currentTime <= normalizeDate(end).getTime()
  );
};

const formatDate = (value?: string) => {
  const date = toValidDate(value);
  return date ? date.toLocaleDateString("vi-VN") : "-";
};

const formatDateTime = (value?: string) => {
  const date = toValidDate(value);
  return date ? date.toLocaleString("vi-VN") : "-";
};

const getLeaveDays = (startDate?: string, endDate?: string) => {
  const start = toValidDate(startDate);
  const end = toValidDate(endDate);

  if (!start || !end) return 0;

  const diff = normalizeDate(end).getTime() - normalizeDate(start).getTime();
  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
};

const getCalendarDays = (focusDate: Date) => {
  const firstOfMonth = new Date(
    focusDate.getFullYear(),
    focusDate.getMonth(),
    1,
  );
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -mondayIndex);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

export default function AdminLeaveDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const { data: leave, isLoading } = useGetLeaveByIdQuery(id);
  const [approveLeave, { isLoading: approving }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejecting }] = useRejectLeaveMutation();

  const handleApprove = async () => {
    try {
      await approveLeave(id).unwrap();
      message.success("Duyệt đơn nghỉ phép thành công");
    } catch {
      message.error("Duyệt đơn nghỉ phép thất bại");
    }
  };

  const handleReject = async () => {
    const trimmedNote = adminNote.trim();

    if (!trimmedNote) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await rejectLeave({
        id,
        body: {
          adminNote: trimmedNote,
        },
      }).unwrap();

      message.success("Từ chối đơn nghỉ phép thành công");
      setRejectOpen(false);
      setAdminNote("");
    } catch {
      message.error("Từ chối đơn nghỉ phép thất bại");
    }
  };

  const handleCloseRejectModal = () => {
    setRejectOpen(false);
    setAdminNote("");
  };

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết đơn nghỉ phép"
          description="Thông tin đơn nghỉ phép và trạng thái xét duyệt."
          extra={
            <Button onClick={() => router.push("/admin/leaves")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-leave-detail-frame is-loading" />
      </>
    );
  }

  if (!leave) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết đơn nghỉ phép"
          description="Thông tin đơn nghỉ phép và trạng thái xét duyệt."
          extra={
            <Button onClick={() => router.push("/admin/leaves")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-leave-detail-frame">
          <Empty description="Không tìm thấy đơn nghỉ phép" />
        </div>
      </>
    );
  }

  const seller =
    typeof leave.seller === "string" ? null : (leave.seller as User);
  const approvedBy =
    typeof leave.approvedBy === "string"
      ? null
      : (leave.approvedBy as User | undefined);
  const sellerName =
    seller?.fullName || (typeof leave.seller === "string" ? leave.seller : "-");
  const sellerEmail = seller?.email || "-";
  const sellerPhone = seller?.phone || "-";
  const sellerCompany = seller?.companyName || "-";
  const currentStatus = statusMap[leave.status];
  const leaveDays = getLeaveDays(leave.startDate, leave.endDate);
  const startDate = toValidDate(leave.startDate);
  const endDate = toValidDate(leave.endDate);
  const calendarFocusDate = startDate || new Date();
  const calendarDays = getCalendarDays(calendarFocusDate);
  const calendarTitle = calendarFocusDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={`Đơn nghỉ phép của ${sellerName}`}
        description="Xem nhanh khoảng nghỉ trên lịch, thông tin nhân viên và kết quả xét duyệt."
        extra={
          <Space wrap>
            <Button onClick={() => router.push("/admin/leaves")}>
              Quay lại
            </Button>

            {leave.status === "pending" ? (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={approving}
                  onClick={handleApprove}
                >
                  Duyệt
                </Button>
                <Button
                  color="danger"
                  variant="solid"
                  icon={<CloseOutlined />}
                  onClick={() => setRejectOpen(true)}
                >
                  Từ chối
                </Button>
              </>
            ) : null}
          </Space>
        }
      />

      <section className="admin-leave-detail-shell">
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={9}>
            <section className="admin-leave-detail-frame admin-leave-summary-frame">
              <Flex vertical align="center" className="admin-leave-detail-summary">
                <Flex
                  align="center"
                  justify="center"
                  className="admin-leave-detail-summary-icon"
                >
                  <CalendarOutlined />
                </Flex>
                <Title level={4} className="admin-leave-detail-summary-title">
                  Lịch nghỉ phép
                </Title>
                <Text className="admin-leave-detail-summary-subtitle">
                  {sellerName}
                </Text>
                <Tag color={currentStatus?.color} className="admin-leave-detail-status">
                  {currentStatus?.label || leave.status}
                </Tag>
              </Flex>

              <div className="admin-leave-metric-list">
                <Flex justify="space-between" align="center">
                  <Text>Bắt đầu</Text>
                  <strong>{formatDate(leave.startDate)}</strong>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text>Kết thúc</Text>
                  <strong>{formatDate(leave.endDate)}</strong>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text>Ngày tạo</Text>
                  <strong>{formatDate(leave.createdAt)}</strong>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text>Tổng ngày</Text>
                  <strong className="is-final">{leaveDays} ngày</strong>
                </Flex>
              </div>
            </section>
          </Col>

          <Col xs={24} xl={15}>
            <section className="admin-leave-detail-frame">
              <div className="admin-leave-detail-head">
                <Flex justify="space-between" align="center" gap={14} wrap="wrap">
                  <div>
                    <Text className="admin-leave-detail-title">
                      Lịch nghỉ trong tháng
                    </Text>
                    <Text className="admin-leave-detail-desc">
                      Các ngày được tô màu là khoảng thời gian nhân viên xin nghỉ.
                    </Text>
                  </div>
                  <Tag color="blue" className="admin-leave-detail-status">
                    {calendarTitle}
                  </Tag>
                </Flex>
              </div>

              <div className="admin-leave-calendar">
                {weekDays.map((day) => (
                  <div className="admin-leave-calendar-weekday" key={day}>
                    {day}
                  </div>
                ))}

                {calendarDays.map((date) => {
                  const inCurrentMonth =
                    date.getMonth() === calendarFocusDate.getMonth();
                  const inLeaveRange =
                    startDate && endDate
                      ? isBetweenDays(date, startDate, endDate)
                      : false;
                  const isStart = startDate ? isSameDay(date, startDate) : false;
                  const isEnd = endDate ? isSameDay(date, endDate) : false;

                  return (
                    <div
                      key={date.toISOString()}
                      className={[
                        "admin-leave-calendar-day",
                        !inCurrentMonth ? "is-muted" : "",
                        inLeaveRange ? "is-range" : "",
                        isStart ? "is-start" : "",
                        isEnd ? "is-end" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span>{date.getDate()}</span>
                      {isStart ? <small>Bắt đầu</small> : null}
                      {isEnd ? <small>Kết thúc</small> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </Col>

          <Col xs={24} xl={14}>
            <section className="admin-leave-detail-frame">
              <div className="admin-leave-detail-head">
                <div>
                  <Text className="admin-leave-detail-title">
                    Thông tin đơn nghỉ
                  </Text>
                  <Text className="admin-leave-detail-desc">
                    Dữ liệu nhân viên, liên hệ và lý do gửi yêu cầu.
                  </Text>
                </div>
              </div>

              <div className="admin-leave-info-grid">
                <div className="admin-leave-info-row">
                  <Text>
                    <UserOutlined /> Nhân viên
                  </Text>
                  <strong>{sellerName}</strong>
                </div>
                <div className="admin-leave-info-row">
                  <Text>
                    <MailOutlined /> Email
                  </Text>
                  <strong>{sellerEmail}</strong>
                </div>
                <div className="admin-leave-info-row">
                  <Text>
                    <PhoneOutlined /> Số điện thoại
                  </Text>
                  <strong>{sellerPhone}</strong>
                </div>
                <div className="admin-leave-info-row">
                  <Text>
                    <ShopOutlined /> Công ty
                  </Text>
                  <strong>{sellerCompany}</strong>
                </div>
                <div className="admin-leave-info-row is-wide">
                  <Text>
                    <FileTextOutlined /> Lý do
                  </Text>
                  <strong>{leave.reason || "-"}</strong>
                </div>
              </div>
            </section>
          </Col>

          <Col xs={24} xl={10}>
            <section className="admin-leave-detail-frame">
              <div className="admin-leave-detail-head">
                <Flex justify="space-between" align="center" gap={14} wrap="wrap">
                  <div>
                    <Text className="admin-leave-detail-title">
                      Thông tin xét duyệt
                    </Text>
                    <Text className="admin-leave-detail-desc">
                      Kết quả xử lý và ghi chú phản hồi cho nhân viên.
                    </Text>
                  </div>
                  <Tag color={currentStatus?.color} className="admin-leave-detail-status">
                    {currentStatus?.label || leave.status}
                  </Tag>
                </Flex>
              </div>

              <div className="admin-leave-info-grid is-review">
                <div className="admin-leave-info-row">
                  <Text>Người duyệt</Text>
                  <strong>{approvedBy?.fullName || "-"}</strong>
                </div>
                <div className="admin-leave-info-row">
                  <Text>Thời gian duyệt</Text>
                  <strong>{formatDateTime(leave.approvedAt)}</strong>
                </div>
                <div className="admin-leave-info-row is-wide">
                  <Text>Ghi chú admin</Text>
                  <strong>{leave.adminNote || "-"}</strong>
                </div>
              </div>
            </section>
          </Col>
        </Row>
      </section>

      <Modal
        title="Từ chối đơn nghỉ phép"
        open={rejectOpen}
        onCancel={handleCloseRejectModal}
        onOk={handleReject}
        okText="Từ chối"
        cancelText="Hủy"
        confirmLoading={rejecting}
        okButtonProps={{
          danger: true,
        }}
      >
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối"
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
        />
      </Modal>

      <style jsx global>{`
        .admin-leave-detail-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-leave-detail-frame {
          min-height: 100%;
          padding: 18px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-leave-detail-frame.is-loading {
          min-height: 180px;
          background:
            linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: admin-leave-detail-loading 1.2s ease infinite;
        }

        @keyframes admin-leave-detail-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .admin-leave-detail-head {
          margin: -18px -18px 18px;
          padding: 18px;
          border-bottom: 1px solid #e7edf5;
          background: #fbfdff;
        }

        .admin-leave-detail-summary {
          text-align: center;
        }

        .admin-leave-detail-summary-icon {
          width: 78px;
          height: 78px;
          margin-bottom: 16px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 34px;
          background: #eff6ff;
        }

        .admin-leave-detail-summary-title.ant-typography {
          margin: 0 0 6px;
          color: #0f172a;
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: 0;
        }

        .admin-leave-detail-summary-subtitle {
          margin-bottom: 14px;
          color: #64748b !important;
          font-weight: 700;
          text-align: center;
        }

        .admin-leave-detail-status {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-leave-metric-list {
          margin-top: 22px;
          padding-top: 18px;
          display: grid;
          gap: 13px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-leave-metric-list .ant-typography,
        .admin-leave-info-row .ant-typography {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-leave-info-row .ant-typography {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .admin-leave-metric-list strong,
        .admin-leave-info-row strong {
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.4;
          word-break: break-word;
        }

        .admin-leave-metric-list strong.is-final {
          color: #2563eb;
          font-size: 18px;
        }

        .admin-leave-detail-title,
        .admin-leave-detail-desc {
          display: block;
        }

        .admin-leave-detail-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-leave-detail-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-leave-calendar {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
        }

        .admin-leave-calendar-weekday {
          min-height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .admin-leave-calendar-day {
          position: relative;
          min-height: 74px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          color: #0f172a;
          background: #ffffff;
        }

        .admin-leave-calendar-day span {
          font-size: 13px;
          font-weight: 900;
        }

        .admin-leave-calendar-day small {
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 900;
          line-height: 1.2;
        }

        .admin-leave-calendar-day.is-muted {
          color: #94a3b8;
          background: #f8fafc;
        }

        .admin-leave-calendar-day.is-range {
          border-color: #bfdbfe;
          color: #1d4ed8;
          background: #eff6ff;
          box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.06);
        }

        .admin-leave-calendar-day.is-start,
        .admin-leave-calendar-day.is-end {
          border-color: #2563eb;
          background: #dbeafe;
        }

        .admin-leave-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .admin-leave-info-grid.is-review {
          grid-template-columns: 1fr;
        }

        .admin-leave-info-row {
          min-width: 0;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(116px, 0.38fr) minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-leave-info-row.is-wide {
          grid-column: 1 / -1;
        }

        @media (max-width: 767px) {
          .admin-leave-calendar {
            gap: 5px;
          }

          .admin-leave-calendar-day {
            min-height: 58px;
            padding: 7px;
          }

          .admin-leave-calendar-day small {
            display: none;
          }

          .admin-leave-info-grid,
          .admin-leave-info-grid.is-review {
            grid-template-columns: 1fr;
          }

          .admin-leave-info-row,
          .admin-leave-info-row.is-wide {
            grid-template-columns: 1fr;
            align-items: start;
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
}
