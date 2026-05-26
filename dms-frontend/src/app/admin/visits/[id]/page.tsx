"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Button,
  Col,
  Empty,
  Flex,
  Row,
  Spin,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Customer } from "@/features/customers/customerTypes";
import { useGetVisitByIdQuery } from "@/features/visits/visitService";
import type { VisitStatus } from "@/features/visits/visitTypes";
import type { User } from "@/features/users/userTypes";

const { Text, Title, Paragraph } = Typography;

const statusMap: Record<VisitStatus, { label: string; color: string }> = {
  checked_in: { label: "Đã check-in", color: "orange" },
  checked_out: { label: "Đã check-out", color: "green" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
};

const formatCoordinate = (latitude?: number, longitude?: number) => {
  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null
  ) {
    return "-";
  }

  return `${latitude}, ${longitude}`;
};

const formatDistance = (value?: number) =>
  value === undefined || value === null ? "-" : `${Math.round(value)}m`;

const formatAccuracy = (value?: number) =>
  value === undefined || value === null ? "-" : `±${Math.round(value)}m`;

const formatDuration = (checkInTime?: string, checkOutTime?: string) => {
  if (!checkInTime) return "-";

  const start = new Date(checkInTime).getTime();
  const end = checkOutTime ? new Date(checkOutTime).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "-";

  const totalMinutes = Math.floor((end - start) / 60000);
  if (totalMinutes < 60) return `${totalMinutes} phút`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} giờ ${minutes} phút`;
};

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "blue" | "cyan" | "emerald" | "amber";
}) {
  return (
    <div className={`visit-detail-metric is-${tone}`}>
      <span className="visit-detail-metric-icon">{icon}</span>
      <Text className="visit-detail-metric-label">{label}</Text>
      <Text className="visit-detail-metric-value">{value}</Text>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="visit-detail-field">
      <Text className="visit-detail-field-label">{label}</Text>
      <div className="visit-detail-field-value">{children}</div>
    </div>
  );
}

function PersonLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Flex gap={12} align="center" className="visit-detail-person-line">
      <span className="visit-detail-person-icon">{icon}</span>
      <span>
        <Text className="visit-detail-person-label">{label}</Text>
        <Text className="visit-detail-person-value">{value}</Text>
      </span>
    </Flex>
  );
}

export default function AdminVisitDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const {
    data: visit,
    isError,
    isFetching,
    isLoading,
  } = useGetVisitByIdQuery(id ?? skipToken);

  const seller =
    visit && typeof visit.seller !== "string" ? (visit.seller as User) : null;
  const customer =
    visit && typeof visit.customer !== "string"
      ? (visit.customer as Customer)
      : null;

  const sellerName =
    seller?.fullName ||
    (visit && typeof visit.seller === "string" ? visit.seller : "-");
  const sellerEmail = seller?.email || "-";
  const customerName =
    customer?.name ||
    (visit && typeof visit.customer === "string" ? visit.customer : "-");
  const customerPhone = customer?.phone || "-";
  const customerAddress = customer?.address || "-";
  const status = visit ? statusMap[visit.status] : undefined;

  const metrics = useMemo(() => {
    if (!visit) return [];

    return [
      {
        label: "Trạng thái",
        value: statusMap[visit.status]?.label || visit.status,
        icon: <CheckCircleOutlined />,
        tone: visit.status === "checked_out" ? "emerald" : "amber",
      },
      {
        label: "Thời lượng",
        value: formatDuration(visit.checkInTime, visit.checkOutTime),
        icon: <ClockCircleOutlined />,
        tone: "blue",
      },
      {
        label: "Khoảng cách",
        value: formatDistance(visit.checkInDistance),
        icon: <AimOutlined />,
        tone: "cyan",
      },
      {
        label: "GPS",
        value: formatAccuracy(visit.gpsAccuracy),
        icon: <EnvironmentOutlined />,
        tone: "blue",
      },
    ] as const;
  }, [visit]);

  if (isLoading || (isFetching && !visit)) {
    return (
      <>
        <AdminBreadcrumb />
        <Flex align="center" justify="center" className="visit-detail-loading">
          <Spin size="large" />
        </Flex>
      </>
    );
  }

  if (!id || isError || !visit) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết lượt ghé thăm"
          description="Không thể tải dữ liệu chi tiết lượt ghé thăm."
          extra={<Button onClick={() => router.push("/admin/visits")}>Quay lại</Button>}
        />
        <div className="visit-detail-empty">
          <Empty description="Không tìm thấy lượt ghé thăm" />
        </div>
      </>
    );
  }

  const hasCheckOutLocation =
    visit.checkOutLatitude !== undefined &&
    visit.checkOutLatitude !== null &&
    visit.checkOutLongitude !== undefined &&
    visit.checkOutLongitude !== null;

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Chi tiết lượt ghé thăm"
        description="Kiểm tra hành trình, người thực hiện và tọa độ GPS của lượt ghé."
        extra={
          <Flex align="center" gap={10} wrap="wrap">
            <Tag color={status?.color} className="visit-detail-top-status">
              {status?.label || visit.status}
            </Tag>
            <Button onClick={() => router.push("/admin/visits")}>Quay lại</Button>
          </Flex>
        }
      />

      <main className="visit-detail-page">
        <section className="visit-detail-cover">
          <div className="visit-detail-cover-main">
            <Tag className="visit-detail-cover-tag">Chi tiết ghé thăm</Tag>
            <Title level={1} className="visit-detail-cover-title">
              {customerName}
            </Title>
            <Paragraph className="visit-detail-cover-description">
              Lượt ghé thăm được ghi nhận bởi {sellerName}. Dữ liệu bên dưới
              giúp đối soát thời gian, khoảng cách, tọa độ GPS và trạng thái
              hoàn tất.
            </Paragraph>
          </div>

          <div className="visit-detail-cover-meta">
            <UserOutlined />
            <span>Seller phụ trách</span>
            <strong>{sellerName}</strong>
          </div>
        </section>

        <section className="visit-detail-metrics">
          {metrics.map((item) => (
            <Metric key={item.label} {...item} />
          ))}
        </section>

        <Row gutter={[28, 28]} className="visit-detail-content-row">
          <Col xs={24} xl={15}>
            <section className="visit-detail-section">
              <div className="visit-detail-section-head">
                <Text className="visit-detail-section-title">
                  Thông tin lượt ghé thăm
                </Text>
                <Text className="visit-detail-section-desc">
                  Dữ liệu hành trình và vị trí hệ thống đã lưu
                </Text>
              </div>

              <div className="visit-detail-field-grid">
                <Field label="Trạng thái">
                  <Tag color={status?.color} className="visit-detail-pill">
                    {status?.label || visit.status}
                  </Tag>
                </Field>
                <Field label="Seller">{sellerName}</Field>
                <Field label="Check-in">{formatDateTime(visit.checkInTime)}</Field>
                <Field label="Check-out">{formatDateTime(visit.checkOutTime)}</Field>
                <Field label="Khoảng cách">
                  {formatDistance(visit.checkInDistance)}
                </Field>
                <Field label="GPS accuracy">{formatAccuracy(visit.gpsAccuracy)}</Field>
                <Field label="Tọa độ check-in">
                  <Text code>{formatCoordinate(visit.checkInLatitude, visit.checkInLongitude)}</Text>
                </Field>
                <Field label="Tọa độ check-out">
                  <Text code>
                    {formatCoordinate(visit.checkOutLatitude, visit.checkOutLongitude)}
                  </Text>
                </Field>
              </div>

              <div className="visit-detail-note">
                <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                  <Text className="visit-detail-note-title">Ghi chú</Text>
                  <Tag color={visit.note ? "blue" : "default"} className="visit-detail-pill">
                    {visit.note ? "Có ghi chú" : "Không có ghi chú"}
                  </Tag>
                </Flex>
                <Paragraph>{visit.note || "Không có ghi chú cho lượt ghé thăm này."}</Paragraph>
              </div>
            </section>

            <section className="visit-detail-section">
              <div className="visit-detail-section-head">
                <Text className="visit-detail-section-title">Dòng thời gian</Text>
                <Text className="visit-detail-section-desc">
                  Tiến trình check-in và check-out
                </Text>
              </div>

              <div className="visit-detail-timeline-wrap">
                <Timeline
                  items={[
                    {
                      color: "blue",
                      dot: <ClockCircleOutlined />,
                      children: (
                        <div className="visit-detail-timeline-item">
                          <Text>Check-in</Text>
                          <span>{formatDateTime(visit.checkInTime)}</span>
                          <small>Bắt đầu ghi nhận lượt ghé thăm tại điểm bán.</small>
                        </div>
                      ),
                    },
                    {
                      color: visit.status === "checked_out" ? "green" : "gray",
                      dot:
                        visit.status === "checked_out" ? (
                          <CheckCircleOutlined />
                        ) : (
                          <ClockCircleOutlined />
                        ),
                      children: (
                        <div className="visit-detail-timeline-item">
                          <Text>Check-out</Text>
                          <span>{formatDateTime(visit.checkOutTime)}</span>
                          <small>
                            {visit.status === "checked_out"
                              ? "Lượt ghé thăm đã được hoàn tất."
                              : "Chưa ghi nhận thời điểm check-out."}
                          </small>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </section>
          </Col>

          <Col xs={24} xl={9}>
            <aside className="visit-detail-side">
              <section className="visit-detail-section">
                <div className="visit-detail-section-head">
                  <Text className="visit-detail-section-title">Người thực hiện</Text>
                  <Text className="visit-detail-section-desc">Thông tin seller</Text>
                </div>
                <PersonLine icon={<UserOutlined />} label="Họ tên" value={sellerName} />
                <PersonLine icon={<MailOutlined />} label="Email" value={sellerEmail} />
              </section>

              <section className="visit-detail-section">
                <div className="visit-detail-section-head">
                  <Text className="visit-detail-section-title">Khách hàng</Text>
                  <Text className="visit-detail-section-desc">Thông tin điểm bán</Text>
                </div>
                <PersonLine icon={<ShopOutlined />} label="Tên khách hàng" value={customerName} />
                <PersonLine icon={<PhoneOutlined />} label="Số điện thoại" value={customerPhone} />
                <PersonLine icon={<EnvironmentOutlined />} label="Địa chỉ" value={customerAddress} />
              </section>

              <section className="visit-detail-section">
                <div className="visit-detail-section-head">
                  <Text className="visit-detail-section-title">Vị trí ghi nhận</Text>
                  <Text className="visit-detail-section-desc">Tọa độ hệ thống lưu lại</Text>
                </div>
                <div className="visit-detail-coordinate">
                  <span>Check-in</span>
                  <Text code>{formatCoordinate(visit.checkInLatitude, visit.checkInLongitude)}</Text>
                </div>
                <div className="visit-detail-coordinate">
                  <span>Check-out</span>
                  <Text code>
                    {formatCoordinate(visit.checkOutLatitude, visit.checkOutLongitude)}
                  </Text>
                </div>
                {!hasCheckOutLocation && (
                  <div className="visit-detail-warning">
                    Chưa có dữ liệu vị trí check-out.
                  </div>
                )}
              </section>
            </aside>
          </Col>
        </Row>
      </main>

      <style jsx global>{`
        .admin-content-frame:has(.visit-detail-page) {
          padding-top: 16px;
        }

        .admin-content-frame:has(.visit-detail-page) .admin-page-header-card {
          margin-bottom: 0 !important;
          border-color: #e2e8f0 !important;
          box-shadow: none !important;
        }

        .admin-content-frame:has(.visit-detail-page)
          .admin-page-header-card
          .ant-card-body {
          padding: 20px 24px !important;
        }

        .visit-detail-loading,
        .visit-detail-empty {
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 1px solid #e7edf5;
        }

        .visit-detail-top-status {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .visit-detail-page {
          margin: 0 -22px -22px;
          padding: 0 22px 28px;
        }

        .visit-detail-cover {
          margin: 18px -22px 0;
          padding: 28px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 28px;
          background:
            radial-gradient(circle at 90% 14%, rgba(14, 165, 233, 0.2), transparent 30%),
            linear-gradient(135deg, #071a24 0%, #102536 58%, #12364a 100%);
        }

        .visit-detail-cover-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .visit-detail-cover-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 36px;
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: 0;
        }

        .visit-detail-cover-description.ant-typography {
          max-width: 760px;
          margin: 12px 0 0;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .visit-detail-cover-meta {
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-left: 1px solid rgba(125, 211, 252, 0.2);
        }

        .visit-detail-cover-meta .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #2563eb;
        }

        .visit-detail-cover-meta span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .visit-detail-cover-meta strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.25;
        }

        .visit-detail-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-bottom: 1px solid #e7edf5;
          background: #ffffff;
        }

        .visit-detail-metric {
          min-height: 116px;
          padding: 18px 18px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid #e7edf5;
        }

        .visit-detail-metric:last-child {
          border-right: 0;
        }

        .visit-detail-metric-icon {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 18px;
          background: var(--metric-accent);
        }

        .visit-detail-metric.is-blue {
          --metric-accent: #2563eb;
        }

        .visit-detail-metric.is-cyan {
          --metric-accent: #0ea5e9;
        }

        .visit-detail-metric.is-emerald {
          --metric-accent: #10b981;
        }

        .visit-detail-metric.is-amber {
          --metric-accent: #f59e0b;
        }

        .visit-detail-metric-label {
          margin-top: 12px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
        }

        .visit-detail-metric-value {
          margin-top: 6px;
          color: #0f172a !important;
          font-size: 19px;
          font-weight: 900;
          line-height: 1.15;
        }

        .visit-detail-content-row {
          margin-top: 28px;
        }

        .visit-detail-section {
          padding-top: 18px;
          border-top: 1px solid #e7edf5;
        }

        .visit-detail-section + .visit-detail-section,
        .visit-detail-side .visit-detail-section + .visit-detail-section {
          margin-top: 28px;
        }

        .visit-detail-section-head {
          padding-bottom: 16px;
          border-bottom: 1px solid #e7edf5;
        }

        .visit-detail-section-title,
        .visit-detail-section-desc {
          display: block;
        }

        .visit-detail-section-title {
          color: #0f172a !important;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.25;
        }

        .visit-detail-section-desc {
          margin-top: 4px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .visit-detail-field-grid {
          padding-top: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 32px;
        }

        .visit-detail-field {
          min-height: 60px;
          padding-bottom: 14px;
          margin-bottom: 14px;
          border-bottom: 1px solid #edf2f7;
        }

        .visit-detail-field-label {
          display: block;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 800;
        }

        .visit-detail-field-value {
          margin-top: 6px;
          color: #0f172a;
          font-size: 13.5px;
          font-weight: 800;
          line-height: 1.45;
          word-break: break-word;
        }

        .visit-detail-field-value code,
        .visit-detail-coordinate code {
          white-space: normal;
          word-break: break-all;
        }

        .visit-detail-pill {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .visit-detail-note {
          padding-top: 18px;
          border-top: 1px solid #e7edf5;
        }

        .visit-detail-note-title {
          color: #0f172a !important;
          font-weight: 900;
        }

        .visit-detail-note .ant-typography {
          margin: 12px 0 0;
          color: #475569;
          line-height: 1.6;
        }

        .visit-detail-timeline-wrap {
          padding-top: 20px;
        }

        .visit-detail-timeline-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .visit-detail-timeline-item .ant-typography {
          color: #0f172a !important;
          font-weight: 900;
        }

        .visit-detail-timeline-item span,
        .visit-detail-timeline-item small {
          color: #64748b;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.45;
        }

        .visit-detail-person-line {
          padding: 16px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .visit-detail-person-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          background: #2563eb;
        }

        .visit-detail-person-line > span:last-child {
          min-width: 0;
        }

        .visit-detail-person-label,
        .visit-detail-person-value {
          display: block;
        }

        .visit-detail-person-label {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 800;
        }

        .visit-detail-person-value {
          margin-top: 3px;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 800;
          line-height: 1.4;
          word-break: break-word;
        }

        .visit-detail-coordinate {
          padding: 16px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .visit-detail-coordinate span {
          display: block;
          margin-bottom: 8px;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
        }

        .visit-detail-warning {
          margin-top: 14px;
          padding: 12px;
          border-left: 3px solid #f59e0b;
          color: #b45309;
          background: #fffbeb;
          font-size: 12.5px;
          font-weight: 800;
        }

        @media (max-width: 1199px) {
          .visit-detail-cover {
            grid-template-columns: 1fr;
          }

          .visit-detail-cover-meta {
            padding-left: 0;
            padding-top: 20px;
            border-left: 0;
            border-top: 1px solid rgba(125, 211, 252, 0.2);
          }

          .visit-detail-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .visit-detail-metric:nth-child(2) {
            border-right: 0;
          }

          .visit-detail-metric:nth-child(-n + 2) {
            border-bottom: 1px solid #e7edf5;
          }
        }

        @media (max-width: 767px) {
          .visit-detail-cover {
            margin: 16px -22px 0;
            padding: 22px;
          }

          .visit-detail-cover-title.ant-typography {
            font-size: 28px;
          }

          .visit-detail-metrics,
          .visit-detail-field-grid {
            grid-template-columns: 1fr;
          }

          .visit-detail-metric {
            border-right: 0;
            border-bottom: 1px solid #e7edf5;
          }

          .visit-detail-metric:last-child {
            border-bottom: 0;
          }
        }
      `}</style>
    </>
  );
}
