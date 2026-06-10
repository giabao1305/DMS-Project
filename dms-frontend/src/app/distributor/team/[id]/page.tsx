"use client";

import {
  EditOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Empty, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import {
  DistributorDetailLoading,
  DistributorDetailShell,
} from "@/components/distributor/DistributorDetailView";
import { useGetSellerUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";

const { Text } = Typography;

const getManagerName = (manager: User["manager"]) => {
  if (!manager) return "-";
  if (typeof manager === "string") return manager;

  return manager.companyName || manager.fullName || manager.email || "-";
};

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
    <div className="distributor-user-detail-line">
      <span className="distributor-user-detail-line-icon">{icon}</span>
      <span className="distributor-user-detail-line-label">{label}</span>
      <span
        className={
          strong
            ? "distributor-user-detail-line-value is-strong"
            : "distributor-user-detail-line-value"
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
    <section className="distributor-user-detail-section">
      <div className="distributor-user-detail-section-title">{title}</div>
      <div className="distributor-user-detail-section-body">{children}</div>
    </section>
  );
}

function DetailStyles() {
  return (
    <style jsx global>{`
      .distributor-user-detail-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .distributor-user-detail-frame {
        min-height: 240px;
        overflow: hidden;
        border: 1px solid #dbeafe;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
      }

      .distributor-user-detail-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fbff 25%, #eef4ff 37%, #f8fbff 63%);
        background-size: 400% 100%;
        animation: distributor-user-detail-loading 1.2s ease infinite;
      }

      @keyframes distributor-user-detail-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .distributor-user-profile-head {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 20px 24px 22px;
        border-bottom: 1px solid #dbeafe;
        background: #f8fbff;
      }

      .distributor-user-identity {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1 1 auto;
      }

      .distributor-user-avatar {
        flex: 0 0 auto;
        color: #2563eb;
        background: #eff6ff;
        box-shadow: inset 0 0 0 1px #bfdbfe;
      }

      .distributor-user-profile-copy {
        min-width: 0;
        max-width: 760px;
      }

      .distributor-user-meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 7px;
      }

      .distributor-user-eyebrow {
        display: inline-flex;
        color: #2563eb !important;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
      }

      .distributor-user-meta-row .ant-tag {
        min-height: 26px;
        display: inline-flex;
        align-items: center;
        margin-inline-end: 0;
        border-radius: 999px;
        font-weight: 800;
      }

      .distributor-user-title {
        margin: 0;
        padding: 0;
        color: #0f172a;
        font-size: 25px;
        font-weight: 900;
        line-height: 1.16;
      }

      .distributor-user-email {
        display: block;
        margin: 4px 0 0;
        padding: 0;
        color: #5f7974;
        font-size: 13px;
        font-weight: 700;
        word-break: break-word;
      }

      .distributor-user-detail-content {
        padding: 18px 24px 24px;
      }

      .distributor-user-detail-section + .distributor-user-detail-section {
        margin-top: 22px;
      }

      .distributor-user-detail-section-title {
        margin-bottom: 10px;
        color: #0f172a;
        font-size: 14px;
        font-weight: 900;
      }

      .distributor-user-detail-section-body {
        overflow: hidden;
        border: 1px solid #dbeafe;
        border-radius: 8px;
      }

      .distributor-user-detail-line {
        min-height: 52px;
        display: grid;
        grid-template-columns: 42px 190px 1fr;
        align-items: center;
        background: #ffffff;
      }

      .distributor-user-detail-line + .distributor-user-detail-line {
        border-top: 1px solid #eaf2ff;
      }

      .distributor-user-detail-line-icon {
        width: 42px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2563eb;
        background: #f8fbff;
      }

      .distributor-user-detail-line-label,
      .distributor-user-detail-line-value {
        padding: 13px 16px;
      }

      .distributor-user-detail-line-label {
        color: #5f7974;
        font-size: 12.5px;
        font-weight: 800;
      }

      .distributor-user-detail-line-value {
        color: #0f172a;
        font-size: 14px;
        font-weight: 700;
        word-break: break-word;
      }

      .distributor-user-detail-line-value.is-strong {
        font-weight: 900;
      }

      .distributor-user-detail-action.ant-btn-primary {
        border-color: #2563eb !important;
        background: #2563eb !important;
        box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16);
      }

      .distributor-user-detail-action.ant-btn-primary:hover {
        border-color: #1d4ed8 !important;
        background: #1d4ed8 !important;
      }

      @media (max-width: 767px) {
        .distributor-user-profile-head {
          flex-direction: column;
          padding: 16px;
        }

        .distributor-user-identity {
          align-items: flex-start;
        }

        .distributor-user-detail-content {
          padding: 14px;
        }

        .distributor-user-detail-line {
          grid-template-columns: 38px 1fr;
        }

        .distributor-user-detail-line-label {
          padding-bottom: 2px;
        }

        .distributor-user-detail-line-value {
          grid-column: 2;
          padding-top: 0;
        }
      }
    `}</style>
  );
}

export default function DistributorTeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: team = [], isLoading } = useGetSellerUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const user = team.find((item) => item._id === id);

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
      title="Chi tiết DSR"
      description="Thông tin định danh, liên hệ và trạng thái hoạt động của DSR."
      backHref="/distributor/team"
    >
      {!user ? (
        <section className="distributor-user-detail-shell">
          <div className="distributor-user-detail-frame">
            <Empty description="Không tìm thấy DSR" />
          </div>
          <DetailStyles />
        </section>
      ) : (
        <section className="distributor-user-detail-shell">
          <div className="distributor-user-detail-frame">
            <div className="distributor-user-profile-head">
              <div className="distributor-user-identity">
                <Avatar
                  size={64}
                  src={user.avatar}
                  icon={<UserOutlined />}
                  className="distributor-user-avatar"
                />
                <div className="distributor-user-profile-copy">
                  <div className="distributor-user-meta-row">
                    <span className="distributor-user-eyebrow">
                      {user.code || "Chưa có mã"}
                    </span>
                    <Tag color={user.isActive ? "green" : "default"}>
                      {user.isActive ? "Hoạt động" : "Khóa"}
                    </Tag>
                    <Tag color="blue">DSR</Tag>
                  </div>
                  <h1 className="distributor-user-title">{user.fullName}</h1>
                  <p className="distributor-user-email">{user.email}</p>
                </div>
              </div>
              <Space>
                <Link href={`/distributor/team/${user._id}/edit`}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    className="distributor-user-detail-action"
                  >
                    Sửa DSR
                  </Button>
                </Link>
              </Space>
            </div>

            <div className="distributor-user-detail-content">
              <DetailSection title="Tài khoản">
                <DetailLine
                  icon={<IdcardOutlined />}
                  label="Mã nhân sự"
                  value={user.code}
                  strong
                />
                <DetailLine icon={<TeamOutlined />} label="Vai trò" value="DSR" />
                <DetailLine
                  icon={<ShopOutlined />}
                  label="NPP quản lý"
                  value={getManagerName(user.manager)}
                />
              </DetailSection>

              <DetailSection title="Liên hệ">
                <DetailLine
                  icon={<MailOutlined />}
                  label="Email"
                  value={user.email}
                  strong
                />
                <DetailLine
                  icon={<PhoneOutlined />}
                  label="Số điện thoại"
                  value={user.phone}
                />
                <DetailLine
                  icon={<EnvironmentOutlined />}
                  label="Địa chỉ"
                  value={user.address}
                />
              </DetailSection>

              <DetailSection title="Hồ sơ công ty">
                <DetailLine
                  icon={<ShopOutlined />}
                  label="Công ty"
                  value={user.companyName}
                />
                <DetailLine
                  icon={<IdcardOutlined />}
                  label="Mã số thuế"
                  value={user.taxCode}
                />
                {user.avatar ? (
                  <DetailLine
                    icon={<UserOutlined />}
                    label="Avatar"
                    value={<Text copyable>{user.avatar}</Text>}
                  />
                ) : null}
              </DetailSection>
            </div>
          </div>

          <DetailStyles />
        </section>
      )}

      {user ? (
        <style jsx global>{`
          .distributor-detail-stack {
            position: relative;
          }
        `}</style>
      ) : null}
    </DistributorDetailShell>
  );
}
