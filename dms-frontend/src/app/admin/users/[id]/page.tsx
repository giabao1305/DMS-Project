"use client";

import {
  EditOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Col, Empty, Flex, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetUserByIdQuery, useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";

const { Text, Title } = Typography;

const getManagerName = (manager: User["manager"], users: User[]) => {
  if (!manager) return "-";
  if (typeof manager !== "string") {
    return manager.fullName || manager.email || "-";
  }

  const distributor = users.find((user) => user._id === manager);
  return distributor?.fullName || distributor?.email || manager;
};

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
          extra={
            <Button onClick={() => router.push("/admin/users")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-user-detail-frame">
          <Empty description="Không tìm thấy nhân viên" />
        </div>
        <UserDetailStyles />
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Chi tiết nhân viên"
        description="Xem thông tin tài khoản, liên hệ và hồ sơ công ty của nhân viên."
        extra={
          <Space>
            <Button onClick={() => router.push("/admin/users")}>
              Quay lại
            </Button>
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
          <section className="admin-user-detail-section">
            <Flex
              align="center"
              justify="space-between"
              gap={18}
              wrap="wrap"
              className="admin-user-profile-head"
            >
              <Flex align="center" gap={16} className="admin-user-profile-main">
                <Avatar
                  size={72}
                  src={user.avatar}
                  icon={<UserOutlined />}
                  className="admin-user-avatar"
                />
                <div>
                  <Title level={3} className="admin-user-title">
                    {user.fullName}
                  </Title>
                  <Text className="admin-user-subtitle">{user.email}</Text>
                </div>
              </Flex>

              <Space wrap>
                <Tag
                  color={user.isActive ? "green" : "default"}
                  className="admin-user-detail-tag"
                >
                  {user.isActive ? "Hoạt động" : "Khóa"}
                </Tag>
                <Tag color="blue" className="admin-user-detail-tag">
                  {user.role.toUpperCase()}
                </Tag>
              </Space>
            </Flex>
          </section>

          <section className="admin-user-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-user-section-head"
            >
              <div>
                <Text className="admin-user-section-title">
                  Thông tin tài khoản
                </Text>
                <Text className="admin-user-section-desc">
                  Dữ liệu định danh và trạng thái sử dụng trong hệ thống.
                </Text>
              </div>
            </Flex>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} xl={8}>
                <InfoItem icon={<IdcardOutlined />} label="Mã nhân sự" value={user.code || "-"} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem icon={<UserOutlined />} label="Họ tên" value={user.fullName} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem icon={<MailOutlined />} label="Email" value={user.email} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem
                  icon={<PhoneOutlined />}
                  label="Số điện thoại"
                  value={user.phone || "-"}
                />
              </Col>
              {user.role === "seller" ? (
                <Col xs={24} md={12} xl={8}>
                  <InfoItem
                    icon={<ShopOutlined />}
                    label="Nhà phân phối quản lý"
                    value={getManagerName(user.manager, users)}
                  />
                </Col>
              ) : null}
            </Row>
          </section>

          <section className="admin-user-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-user-section-head"
            >
              <div>
                <Text className="admin-user-section-title">Thông tin hồ sơ</Text>
                <Text className="admin-user-section-desc">
                  Công ty, mã số thuế và địa chỉ liên hệ của nhân viên.
                </Text>
              </div>
            </Flex>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<ShopOutlined />}
                  label="Công ty"
                  value={user.companyName || "-"}
                />
              </Col>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<IdcardOutlined />}
                  label="Mã số thuế"
                  value={user.taxCode || "-"}
                />
              </Col>
              <Col xs={24}>
                <InfoItem
                  icon={<EnvironmentOutlined />}
                  label="Địa chỉ"
                  value={user.address || "-"}
                />
              </Col>
            </Row>
          </section>

          <section className="admin-user-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-user-section-head"
            >
              <div>
                <Text className="admin-user-section-title">Ảnh đại diện</Text>
                <Text className="admin-user-section-desc">
                  Đường dẫn avatar đang lưu trên hồ sơ tài khoản.
                </Text>
              </div>
            </Flex>

            {user.avatar ? (
              <Text copyable className="admin-user-avatar-url">
                {user.avatar}
              </Text>
            ) : (
              <Text type="secondary">Chưa có avatar.</Text>
            )}
          </section>
        </div>
      </section>

      <UserDetailStyles />
    </>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Flex gap={12} align="flex-start" className="admin-user-info-item">
      <Flex align="center" justify="center" className="admin-user-info-icon">
        {icon}
      </Flex>
      <div className="admin-user-info-copy">
        <Text className="admin-user-info-label">{label}</Text>
        <Text className="admin-user-info-value">{value}</Text>
      </div>
    </Flex>
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
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-user-detail-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-user-detail-loading 1.2s ease infinite;
      }

      @keyframes admin-user-detail-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-user-detail-section + .admin-user-detail-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-user-profile-head {
        min-height: 92px;
      }

      .admin-user-profile-main {
        min-width: 0;
      }

      .admin-user-avatar {
        background: #eff6ff;
        color: #2563eb;
      }

      .admin-user-title.ant-typography {
        margin: 0;
        color: #0f172a;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 0;
      }

      .admin-user-subtitle.ant-typography {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
        word-break: break-word;
      }

      .admin-user-detail-tag {
        min-width: 96px;
        height: 31px;
        margin-inline-end: 0;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-user-section-head {
        margin-bottom: 18px;
      }

      .admin-user-section-title,
      .admin-user-section-desc,
      .admin-user-info-label,
      .admin-user-info-value {
        display: block;
      }

      .admin-user-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-user-section-desc,
      .admin-user-info-label {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-user-info-item {
        min-height: 82px;
        padding: 16px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-user-info-icon {
        width: 40px;
        height: 40px;
        min-width: 40px;
        border: 1px solid #c7ddfe;
        border-radius: 8px;
        color: #2563eb;
        background: #eff6ff;
      }

      .admin-user-info-copy {
        min-width: 0;
      }

      .admin-user-info-value {
        margin-top: 4px;
        color: #0f172a !important;
        font-size: 14px;
        font-weight: 900;
        word-break: break-word;
      }

      .admin-user-avatar-url {
        display: block;
        padding: 14px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
        word-break: break-all;
      }

      @media (max-width: 767px) {
        .admin-user-detail-frame {
          padding: 14px;
        }

        .admin-user-title.ant-typography {
          font-size: 21px;
        }
      }
    `}</style>
  );
}
