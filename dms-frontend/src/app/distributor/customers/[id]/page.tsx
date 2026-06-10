"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  IdcardOutlined,
  PhoneOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Empty,
  Flex,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import {
  useApproveCustomerMutation,
  useGetCustomerByIdQuery,
  useRejectCustomerMutation,
} from "@/features/customers/customerService";
import type { Customer } from "@/features/customers/customerTypes";

const { Text } = Typography;

const statusMap = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  rejected: { color: "red", text: "Từ chối" },
};

const getUserName = (value?: Customer["assignedSeller"]) => {
  if (!value) return "-";
  if (typeof value === "string") return /^[a-f\d]{24}$/i.test(value) ? "-" : value;
  return value.fullName || value.email || "-";
};

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

function DetailLine({
  icon,
  label,
  value,
  strong,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="distributor-customer-detail-line">
      <span className="distributor-customer-detail-line-icon">{icon}</span>
      <span className="distributor-customer-detail-line-label">{label}</span>
      <span
        className={
          strong
            ? "distributor-customer-detail-line-value is-strong"
            : "distributor-customer-detail-line-value"
        }
      >
        {value || "-"}
      </span>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="distributor-customer-detail-section">
      <div className="distributor-customer-detail-section-title">{title}</div>
      <div className="distributor-customer-detail-section-body">{children}</div>
    </section>
  );
}

function DetailStyles() {
  return (
    <style jsx global>{`
      .distributor-customer-detail-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .distributor-customer-detail-frame {
        min-height: 240px;
        overflow: hidden;
        border: 1px solid #dbeafe;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
      }

      .distributor-customer-profile-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 20px 24px 22px;
        border-bottom: 1px solid #dbeafe;
        background: #f8fbff;
      }

      .distributor-customer-identity {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1 1 auto;
      }

      .distributor-customer-avatar {
        flex: 0 0 auto;
        color: #2563eb;
        background: #eff6ff;
        box-shadow: inset 0 0 0 1px #bfdbfe;
      }

      .distributor-customer-profile-copy {
        min-width: 0;
        max-width: 760px;
      }

      .distributor-customer-meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 7px;
      }

      .distributor-customer-eyebrow {
        display: inline-flex;
        color: #2563eb !important;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
      }

      .distributor-customer-meta-row .ant-tag {
        min-height: 26px;
        display: inline-flex;
        align-items: center;
        margin-inline-end: 0;
        border-radius: 999px;
        font-weight: 800;
      }

      .distributor-customer-title {
        margin: 0;
        padding: 0;
        color: #0f172a;
        font-size: 25px;
        font-weight: 900;
        line-height: 1.16;
      }

      .distributor-customer-subtitle {
        display: block;
        margin: 4px 0 0;
        padding: 0;
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
        word-break: break-word;
      }

      .distributor-customer-detail-content {
        padding: 18px 24px 24px;
      }

      .distributor-customer-detail-section + .distributor-customer-detail-section,
      .distributor-customer-reject-form {
        margin-top: 22px;
      }

      .distributor-customer-detail-section-title {
        margin-bottom: 10px;
        color: #0f172a;
        font-size: 14px;
        font-weight: 900;
      }

      .distributor-customer-detail-section-body {
        overflow: hidden;
        border: 1px solid #dbeafe;
        border-radius: 8px;
      }

      .distributor-customer-detail-line {
        min-height: 52px;
        display: grid;
        grid-template-columns: 42px 190px 1fr;
        align-items: center;
        background: #ffffff;
      }

      .distributor-customer-detail-line + .distributor-customer-detail-line {
        border-top: 1px solid #eaf2ff;
      }

      .distributor-customer-detail-line-icon {
        width: 42px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2563eb;
        background: #f8fbff;
      }

      .distributor-customer-detail-line-label,
      .distributor-customer-detail-line-value {
        padding: 13px 16px;
      }

      .distributor-customer-detail-line-label {
        color: #64748b;
        font-size: 12.5px;
        font-weight: 800;
      }

      .distributor-customer-detail-line-value {
        color: #0f172a;
        font-size: 14px;
        font-weight: 700;
        word-break: break-word;
      }

      .distributor-customer-detail-line-value.is-strong {
        font-weight: 900;
      }

      .distributor-customer-detail-action.ant-btn,
      .distributor-content .distributor-customer-detail-action.ant-btn-primary {
        border-color: #2563eb !important;
        background: #2563eb !important;
        color: #ffffff !important;
        box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
      }

      .distributor-customer-detail-action.ant-btn:hover,
      .distributor-content .distributor-customer-detail-action.ant-btn-primary:hover {
        border-color: #1d4ed8 !important;
        background: #1d4ed8 !important;
        color: #ffffff !important;
      }

      .distributor-customer-reject-form {
        padding: 14px;
        border: 1px solid #fecaca;
        border-radius: 8px;
        background: #fff1f2;
      }

      @media (max-width: 767px) {
        .distributor-customer-profile-head {
          flex-direction: column;
          align-items: stretch;
          padding: 16px;
        }

        .distributor-customer-identity {
          align-items: flex-start;
        }

        .distributor-customer-detail-content {
          padding: 14px;
        }

        .distributor-customer-detail-line {
          grid-template-columns: 38px 1fr;
        }

        .distributor-customer-detail-line-label {
          padding-bottom: 2px;
        }

        .distributor-customer-detail-line-value {
          grid-column: 2;
          padding-top: 0;
        }
      }
    `}</style>
  );
}

export default function DistributorCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useGetCustomerByIdQuery(id);
  const { message } = App.useApp();
  const [approveCustomer, { isLoading: approving }] = useApproveCustomerMutation();
  const [rejectCustomer, { isLoading: rejecting }] = useRejectCustomerMutation();
  const [rejectFormOpen, setRejectFormOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    try {
      await approveCustomer(id).unwrap();
      message.success("Đã duyệt khách hàng");
    } catch {
      message.error("Không thể duyệt khách hàng");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning("Nhập lý do từ chối");
      return;
    }

    try {
      await rejectCustomer({ id, rejectReason: rejectReason.trim() }).unwrap();
      message.success("Đã từ chối khách hàng");
      setRejectFormOpen(false);
      setRejectReason("");
    } catch {
      message.error("Không thể từ chối khách hàng");
    }
  };

  if (isLoading) {
    return (
      <>
        <DistributorDetailLoading />
        <DetailStyles />
      </>
    );
  }

  return (
    <DistributorDetailShell
      title="Chi tiết khách hàng"
      description="Thông tin định danh, liên hệ và trạng thái duyệt của điểm bán."
      backHref="/distributor/customers"
    >
      {!customer ? (
        <section className="distributor-customer-detail-shell">
          <div className="distributor-customer-detail-frame">
            <Empty description="Không tìm thấy khách hàng" />
          </div>
          <DetailStyles />
        </section>
      ) : (
        <section className="distributor-customer-detail-shell">
          <div className="distributor-customer-detail-frame">
            <div className="distributor-customer-profile-head">
              <div className="distributor-customer-identity">
                <Avatar
                  size={64}
                  icon={<ShopOutlined />}
                  className="distributor-customer-avatar"
                />
                <div className="distributor-customer-profile-copy">
                  <div className="distributor-customer-meta-row">
                    <span className="distributor-customer-eyebrow">
                      {customer.customerType || "Điểm bán"}
                    </span>
                    <Tag color={statusMap[customer.status].color}>
                      {statusMap[customer.status].text}
                    </Tag>
                    {customer.isActive ? (
                      <Tag color="green">Hoạt động</Tag>
                    ) : (
                      <Tag color="default">Ngưng hoạt động</Tag>
                    )}
                  </div>
                  <h1 className="distributor-customer-title">{customer.name}</h1>
                  <p className="distributor-customer-subtitle">
                    {customer.phone || "Chưa có số điện thoại"}
                  </p>
                </div>
              </div>

              <Space wrap>
                {customer.status === "pending" ? (
                  <>
                    <Button
                      type="primary"
                      loading={approving}
                      onClick={handleApprove}
                      className="distributor-customer-detail-action"
                    >
                      Duyệt
                    </Button>
                    <Button danger onClick={() => setRejectFormOpen(true)}>
                      Từ chối
                    </Button>
                  </>
                ) : null}
                <Link href={`/distributor/customers/${customer._id}/edit`}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    className="distributor-customer-detail-action"
                  >
                    Sửa khách hàng
                  </Button>
                </Link>
              </Space>
            </div>

            <div className="distributor-customer-detail-content">
              <DetailSection title="Thông tin điểm bán">
                <DetailLine
                  icon={<ShopOutlined />}
                  label="Tên khách hàng"
                  value={customer.name}
                  strong
                />
                <DetailLine
                  icon={<PhoneOutlined />}
                  label="Số điện thoại"
                  value={customer.phone}
                />
                <DetailLine
                  icon={<UserOutlined />}
                  label="Chủ cửa hàng"
                  value={customer.ownerName}
                />
                <DetailLine
                  icon={<IdcardOutlined />}
                  label="Loại khách hàng"
                  value={customer.customerType}
                />
              </DetailSection>

              <DetailSection title="Phân công và trạng thái">
                <DetailLine
                  icon={<TeamOutlined />}
                  label="DSR phụ trách"
                  value={getUserName(customer.assignedSeller)}
                  strong
                />
                <DetailLine
                  icon={<CheckCircleOutlined />}
                  label="Trạng thái duyệt"
                  value={statusMap[customer.status].text}
                />
                <DetailLine
                  icon={<FieldTimeOutlined />}
                  label="Ngày tạo"
                  value={formatDateTime(customer.createdAt)}
                />
                <DetailLine
                  icon={<FieldTimeOutlined />}
                  label="Ngày duyệt"
                  value={formatDateTime(customer.approvedAt)}
                />
              </DetailSection>

              <DetailSection title="Địa chỉ và định vị">
                <DetailLine
                  icon={<EnvironmentOutlined />}
                  label="Địa chỉ"
                  value={customer.address}
                  strong
                />
                <DetailLine
                  icon={<EnvironmentOutlined />}
                  label="Tọa độ GPS"
                  value={
                    customer.latitude !== undefined &&
                    customer.longitude !== undefined
                      ? `${customer.latitude}, ${customer.longitude}`
                      : "-"
                  }
                />
                {customer.rejectReason ? (
                  <DetailLine
                    icon={<CloseCircleOutlined />}
                    label="Lý do từ chối"
                    value={customer.rejectReason}
                  />
                ) : null}
              </DetailSection>

              {rejectFormOpen ? (
                <div className="distributor-customer-reject-form">
                  <Flex vertical gap={10}>
                    <Text strong>Từ chối khách hàng</Text>
                    <Input.TextArea
                      rows={4}
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Nhập lý do từ chối"
                    />
                    <Flex justify="flex-end" gap={10}>
                      <Button onClick={() => setRejectFormOpen(false)}>Hủy</Button>
                      <Button danger loading={rejecting} onClick={handleReject}>
                        Từ chối
                      </Button>
                    </Flex>
                  </Flex>
                </div>
              ) : null}
            </div>
          </div>

          <DetailStyles />
        </section>
      )}
    </DistributorDetailShell>
  );
}
