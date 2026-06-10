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
import { useParams, useRouter } from "next/navigation";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetUserByIdQuery, useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";

const { Text } = Typography;

const roleLabel: Record<string, string> = {
  admin: "Admin",
  distributor: "Nhà phân phối",
  seller: "DSR",
};

const roleTone: Record<string, string> = {
  admin: "blue",
  distributor: "blue",
  seller: "cyan",
};

const getManagerName = (manager: User["manager"], users: User[]) => {
  if (!manager) return "-";
  if (typeof manager !== "string") {
    return manager.companyName || manager.fullName || manager.email || "-";
  }

  const distributor = users.find((user) => user._id === manager);
  return distributor?.companyName || distributor?.fullName || distributor?.email || manager;
};

function DetailLine({
  icon,
  label,
  value,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="admin-user-detail-line">
      <span className="admin-user-detail-line-icon">{icon}</span>
      <span className="admin-user-detail-line-label">{label}</span>
      <span className={strong ? "admin-user-detail-line-value is-strong" : "admin-user-detail-line-value"}>
        {value || "-"}
      </span>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-user-detail-section">
      <div className="admin-user-detail-section-title">{title}</div>
      <div className="admin-user-detail-section-body">{children}</div>
    </section>
  );
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: user, isLoading } = useGetUserByIdQuery(id);
  const { data: users = [] } = useGetUsersQuery();

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết nhân viên"
          description="Xem thông tin tài khoản và trạng thái hoạt động của nhân viên."
        />
        <div className="admin-user-detail-frame is-loading" />
        <UserDetailStyles />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết nhân viên"
          description="Xem thông tin tài khoản và trạng thái hoạt động của nhân viên."
          extra={<Button onClick={() => router.push("/admin/users")}>Quay lại</Button>}
        />
        <div className="admin-user-detail-frame">
          <Empty description="Không tìm thấy nhân viên" />
        </div>
        <UserDetailStyles />
      </>
    );
  }

  const statusLabel = user.isActive ? "Hoạt động" : "Khóa";
  const displayRole = roleLabel[user.role] || user.role;
  return (
    <>
      <AdminBreadcrumb />
      <AdminPageHeader
        title="Chi tiết nhân viên"
        description="Thông tin định danh, liên hệ và phân quyền của nhân viên."
        extra={
          <Space>
            <Button onClick={() => router.push("/admin/users")}>Quay lại</Button>
            <Link href={`/admin/users/${user._id}/edit`}>
              <Button color="orange" variant="solid" icon={<EditOutlined />}>
                Sửa nhân viên
              </Button>
            </Link>
          </Space>
        }
      />

      <section className="admin-user-detail-shell">
        <div className="admin-user-detail-frame">
          <div className="admin-user-profile-head">
            <div className="admin-user-identity">
              <Avatar size={64} src={user.avatar} icon={<UserOutlined />} className="admin-user-avatar" />
              <div className="admin-user-profile-copy">
                <div className="admin-user-meta-row">
                  <span className="admin-user-eyebrow">{user.code || "Chưa có mã"}</span>
                  <Tag color={user.isActive ? "green" : "default"}>{statusLabel}</Tag>
                  <Tag color={roleTone[user.role] || "blue"}>{displayRole}</Tag>
                </div>
                <h1 className="admin-user-title">{user.fullName}</h1>
                <p className="admin-user-email">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="admin-user-detail-content">
            <DetailSection title="Tài khoản">
              <DetailLine icon={<IdcardOutlined />} label="Mã nhân sự" value={user.code} strong />
              <DetailLine icon={<TeamOutlined />} label="Vai trò" value={roleLabel[user.role] || user.role} />
              {user.role === "seller" ? (
                <DetailLine icon={<ShopOutlined />} label="NPP quản lý" value={getManagerName(user.manager, users)} />
              ) : null}
            </DetailSection>

            <DetailSection title="Liên hệ">
              <DetailLine icon={<MailOutlined />} label="Email" value={user.email} strong />
              <DetailLine icon={<PhoneOutlined />} label="Số điện thoại" value={user.phone} />
              <DetailLine icon={<EnvironmentOutlined />} label="Địa chỉ" value={user.address} />
            </DetailSection>

            <DetailSection title="Hồ sơ công ty">
              <DetailLine icon={<ShopOutlined />} label="Công ty" value={user.companyName} />
              <DetailLine icon={<IdcardOutlined />} label="Mã số thuế" value={user.taxCode} />
              {user.avatar ? (
                <DetailLine icon={<UserOutlined />} label="Avatar" value={<Text copyable>{user.avatar}</Text>} />
              ) : null}
            </DetailSection>
          </div>
        </div>
      </section>

      <UserDetailStyles />
    </>
  );
}

function UserDetailStyles() {
  return (
    <style jsx global>{`
      .admin-user-detail-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-user-detail-frame {
        min-height: 240px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
        overflow: hidden;
      }

      .admin-user-detail-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-user-detail-loading 1.2s ease infinite;
      }

      @keyframes admin-user-detail-loading {
        0% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
      }

      .admin-user-profile-head {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 20px 24px 22px;
        border-bottom: 1px solid #dbe4f0;
        background: #f8fbff;
      }

      .admin-user-identity {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1 1 auto;
        background: transparent !important;
        box-shadow: none !important;
      }

      .admin-user-avatar {
        background: #eaf2ff;
        color: #2563eb;
        box-shadow: inset 0 0 0 1px #c8ddff;
        flex: 0 0 auto;
      }

      .admin-user-profile-copy {
        min-width: 0;
        max-width: 760px;
        padding: 0;
        border: 0;
        background: transparent !important;
        box-shadow: none !important;
      }

      .admin-user-meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 7px;
      }

      .admin-user-eyebrow {
        display: inline-flex;
        color: #2563eb !important;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
      }

      .admin-user-meta-row .ant-tag {
        min-height: 26px;
        display: inline-flex;
        align-items: center;
        margin-inline-end: 0;
        border-radius: 999px;
        font-weight: 800;
      }

      .admin-user-title {
        margin: 0;
        padding: 0;
        color: #0f172a;
        font-size: 25px;
        font-weight: 900;
        line-height: 1.16;
        background: transparent !important;
        box-shadow: none !important;
      }

      .admin-user-email {
        display: block;
        margin: 4px 0 0;
        padding: 0;
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
        word-break: break-word;
        background: transparent !important;
        box-shadow: none !important;
      }

      .admin-user-detail-content {
        padding: 18px 24px 24px;
      }

      .admin-user-detail-section + .admin-user-detail-section {
        margin-top: 22px;
      }

      .admin-user-detail-section-title {
        margin-bottom: 10px;
        color: #0f172a;
        font-size: 14px;
        font-weight: 900;
      }

      .admin-user-detail-section-body {
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        overflow: hidden;
      }

      .admin-user-detail-line {
        display: grid;
        grid-template-columns: 42px 190px 1fr;
        align-items: center;
        min-height: 52px;
        background: #ffffff;
      }

      .admin-user-detail-line + .admin-user-detail-line {
        border-top: 1px solid #edf2f7;
      }

      .admin-user-detail-line-icon {
        width: 42px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2563eb;
        background: #f8fbff;
      }

      .admin-user-detail-line-label,
      .admin-user-detail-line-value {
        padding: 13px 16px;
      }

      .admin-user-detail-line-label {
        color: #64748b;
        font-size: 12.5px;
        font-weight: 800;
      }

      .admin-user-detail-line-value {
        color: #0f172a;
        font-size: 14px;
        font-weight: 700;
        word-break: break-word;
      }

      .admin-user-detail-line-value.is-strong {
        font-weight: 900;
      }

      @media (max-width: 767px) {
        .admin-user-profile-head {
          flex-direction: column;
          padding: 16px;
        }

        .admin-user-identity {
          align-items: flex-start;
        }

        .admin-user-detail-content {
          padding: 14px;
        }

        .admin-user-detail-line {
          grid-template-columns: 38px 1fr;
        }

        .admin-user-detail-line-label {
          padding-bottom: 2px;
        }

        .admin-user-detail-line-value {
          grid-column: 2;
          padding-top: 0;
        }
      }
    `}</style>
  );
}
