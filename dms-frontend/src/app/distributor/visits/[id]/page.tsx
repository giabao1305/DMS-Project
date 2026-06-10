"use client";

import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Col, Flex, Row, Tag, Timeline, Typography } from "antd";
import { useParams } from "next/navigation";

import {
  DistributorDetailCard,
  DistributorDetailEmpty,
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetVisitByIdQuery } from "@/features/visits/visitService";
import type { Visit, VisitStatus } from "@/features/visits/visitTypes";

const { Paragraph, Text } = Typography;

const statusMap: Record<VisitStatus, { color: string; text: string }> = {
  checked_in: { color: "processing", text: "Đang ghé thăm" },
  checked_out: { color: "success", text: "Hoàn thành" },
};

const getName = (value: Visit["seller"] | Visit["customer"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  if ("name" in value) return value.name || "-";
  return value.fullName || value.email || "-";
};

const getRoute = (route: Visit["route"]) => {
  if (!route) return "-";
  if (typeof route === "string") return /^[a-f\d]{24}$/i.test(route) ? "-" : route;
  return route.name || "-";
};

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const formatDistance = (value?: number) =>
  value !== undefined && value !== null ? `${Math.round(value)} m` : "-";

const formatAccuracy = (value?: number) =>
  value !== undefined && value !== null ? `${Math.round(value)} m` : "-";

const formatCoordinate = (latitude?: number, longitude?: number) =>
  latitude !== undefined &&
  latitude !== null &&
  longitude !== undefined &&
  longitude !== null
    ? `${latitude}, ${longitude}`
    : "-";

const formatDuration = (checkInTime?: string, checkOutTime?: string) => {
  if (!checkInTime || !checkOutTime) return "-";
  const diff = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "-";

  const minutes = Math.round(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes} phút`;
  if (!remainingMinutes) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
};

function MetricCard({
  icon,
  label,
  value,
  tone = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "blue" | "green" | "amber" | "cyan";
}) {
  return (
    <div className={`distributor-visit-metric is-${tone}`}>
      <span className="distributor-visit-metric-icon">{icon}</span>
      <span>
        <Text className="distributor-visit-metric-label">{label}</Text>
        <Text className="distributor-visit-metric-value">{value}</Text>
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="distributor-visit-field">
      <Text className="distributor-visit-field-label">{label}</Text>
      <Text className="distributor-visit-field-value">{children}</Text>
    </div>
  );
}

export default function DistributorVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: visit, isLoading } = useGetVisitByIdQuery(id);

  if (isLoading) return <DistributorDetailLoading />;

  return (
    <DistributorDetailShell
      title="Chi tiết ghé thăm"
      description="Theo dõi thời gian, vị trí GPS và kết quả lượt ghé khách hàng."
      backHref="/distributor/visits"
    >
      {!visit ? (
        <DistributorDetailEmpty description="Không tìm thấy lượt ghé thăm" />
      ) : (
        <>
          <DistributorDetailCard
            title={getName(visit.customer)}
            description={`Lượt ghé do ${getName(visit.seller)} thực hiện.`}
            extra={
              <Tag
                color={statusMap[visit.status].color}
                className="distributor-pill-tag"
              >
                {statusMap[visit.status].text}
              </Tag>
            }
          >
            <Row gutter={[14, 14]} className="distributor-visit-metrics">
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<ClockCircleOutlined />}
                  label="Trạng thái"
                  value={statusMap[visit.status].text}
                  tone={visit.status === "checked_out" ? "green" : "amber"}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<FieldTimeOutlined />}
                  label="Thời lượng"
                  value={formatDuration(visit.checkInTime, visit.checkOutTime)}
                  tone="blue"
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<EnvironmentOutlined />}
                  label="Khoảng cách check-in"
                  value={formatDistance(visit.checkInDistance)}
                  tone="cyan"
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard
                  icon={<AimOutlined />}
                  label="GPS accuracy"
                  value={formatAccuracy(visit.gpsAccuracy)}
                  tone="blue"
                />
              </Col>
            </Row>
          </DistributorDetailCard>

          <Row gutter={[14, 14]}>
            <Col xs={24} lg={16}>
              <DistributorDetailCard
                title="Thông tin lượt ghé"
                description="Thời gian, tuyến bán hàng và tọa độ hệ thống ghi nhận."
              >
                <div className="distributor-visit-field-grid">
                  <Field label="Khách hàng">{getName(visit.customer)}</Field>
                  <Field label="DSR">{getName(visit.seller)}</Field>
                  <Field label="Tuyến bán hàng">{getRoute(visit.route)}</Field>
                  <Field label="Trạng thái">
                    <Tag
                      color={statusMap[visit.status].color}
                      className="distributor-pill-tag"
                    >
                      {statusMap[visit.status].text}
                    </Tag>
                  </Field>
                  <Field label="Thời gian check-in">
                    {formatDateTime(visit.checkInTime)}
                  </Field>
                  <Field label="Thời gian check-out">
                    {formatDateTime(visit.checkOutTime)}
                  </Field>
                  <Field label="GPS check-in">
                    <Text code>
                      {formatCoordinate(
                        visit.checkInLatitude,
                        visit.checkInLongitude,
                      )}
                    </Text>
                  </Field>
                  <Field label="GPS check-out">
                    <Text code>
                      {formatCoordinate(
                        visit.checkOutLatitude,
                        visit.checkOutLongitude,
                      )}
                    </Text>
                  </Field>
                  <Field label="Khoảng cách check-out">
                    {formatDistance(visit.checkOutDistance)}
                  </Field>
                  <Field label="Ngày tạo">{formatDateTime(visit.createdAt)}</Field>
                </div>

                <div className="distributor-visit-note">
                  <Flex justify="space-between" align="center" gap={12}>
                    <Text className="distributor-visit-note-title">Ghi chú</Text>
                    <Tag
                      color={visit.note ? "blue" : "default"}
                      className="distributor-pill-tag"
                    >
                      {visit.note ? "Có ghi chú" : "Không có ghi chú"}
                    </Tag>
                  </Flex>
                  <Paragraph>{visit.note || "Không có ghi chú cho lượt ghé này."}</Paragraph>
                </div>
              </DistributorDetailCard>
            </Col>

            <Col xs={24} lg={8}>
              <DistributorDetailCard
                title="Dòng thời gian"
                description="Tiến trình check-in và check-out tại điểm bán."
              >
                <Timeline
                  items={[
                    {
                      color: "blue",
                      dot: <EnvironmentOutlined />,
                      children: (
                        <div className="distributor-visit-timeline-item">
                          <Text strong>Check-in</Text>
                          <span>{formatDateTime(visit.checkInTime)}</span>
                          <small>
                            {formatCoordinate(
                              visit.checkInLatitude,
                              visit.checkInLongitude,
                            )}
                          </small>
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
                        <div className="distributor-visit-timeline-item">
                          <Text strong>Check-out</Text>
                          <span>{formatDateTime(visit.checkOutTime)}</span>
                          <small>
                            {visit.status === "checked_out"
                              ? formatCoordinate(
                                  visit.checkOutLatitude,
                                  visit.checkOutLongitude,
                                )
                              : "Chưa check-out"}
                          </small>
                        </div>
                      ),
                    },
                  ]}
                />
              </DistributorDetailCard>

              <DistributorDetailCard
                title="Đối tượng liên quan"
                description="DSR, khách hàng và tuyến ghé thăm."
              >
                <div className="distributor-visit-person-line">
                  <span className="distributor-visit-person-icon">
                    <TeamOutlined />
                  </span>
                  <span>
                    <Text className="distributor-visit-person-label">DSR</Text>
                    <Text className="distributor-visit-person-value">
                      {getName(visit.seller)}
                    </Text>
                  </span>
                </div>
                <div className="distributor-visit-person-line">
                  <span className="distributor-visit-person-icon">
                    <ShopOutlined />
                  </span>
                  <span>
                    <Text className="distributor-visit-person-label">
                      Khách hàng
                    </Text>
                    <Text className="distributor-visit-person-value">
                      {getName(visit.customer)}
                    </Text>
                  </span>
                </div>
                <div className="distributor-visit-person-line">
                  <span className="distributor-visit-person-icon">
                    <EnvironmentOutlined />
                  </span>
                  <span>
                    <Text className="distributor-visit-person-label">
                      Tuyến bán hàng
                    </Text>
                    <Text className="distributor-visit-person-value">
                      {getRoute(visit.route)}
                    </Text>
                  </span>
                </div>
              </DistributorDetailCard>
            </Col>
          </Row>
        </>
      )}

      <style jsx global>{`
        .distributor-visit-metrics {
          margin-bottom: 0;
        }

        .distributor-visit-metric {
          display: flex;
          min-height: 92px;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #f8fbff;
        }

        .distributor-visit-metric-icon,
        .distributor-visit-person-icon {
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

        .distributor-visit-metric.is-green .distributor-visit-metric-icon {
          color: #16a34a;
          background: #dcfce7;
        }

        .distributor-visit-metric.is-amber .distributor-visit-metric-icon {
          color: #d97706;
          background: #fef3c7;
        }

        .distributor-visit-metric.is-cyan .distributor-visit-metric-icon {
          color: #0891b2;
          background: #cffafe;
        }

        .distributor-visit-metric-label,
        .distributor-visit-metric-value,
        .distributor-visit-field-label,
        .distributor-visit-field-value,
        .distributor-visit-person-label,
        .distributor-visit-person-value {
          display: block;
        }

        .distributor-visit-metric-label,
        .distributor-visit-field-label,
        .distributor-visit-person-label {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 750;
        }

        .distributor-visit-metric-value,
        .distributor-visit-field-value,
        .distributor-visit-person-value {
          color: #0f172a !important;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-visit-field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .distributor-visit-field {
          min-height: 72px;
          padding: 12px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
        }

        .distributor-visit-field-value code {
          white-space: normal;
          word-break: break-word;
        }

        .distributor-visit-note {
          margin-top: 14px;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
        }

        .distributor-visit-note-title {
          color: #0f172a !important;
          font-weight: 850;
        }

        .distributor-visit-note .ant-typography {
          margin-bottom: 0;
          color: #334155;
          font-weight: 600;
        }

        .distributor-visit-timeline-item {
          display: grid;
          gap: 2px;
        }

        .distributor-visit-timeline-item .ant-typography {
          color: #0f172a !important;
        }

        .distributor-visit-timeline-item span,
        .distributor-visit-timeline-item small {
          color: #64748b;
          font-weight: 650;
          word-break: break-word;
        }

        .distributor-visit-person-line {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
        }

        .distributor-visit-person-line + .distributor-visit-person-line {
          border-top: 1px solid #dbeafe;
        }

        @media (max-width: 767px) {
          .distributor-visit-field-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </DistributorDetailShell>
  );
}
