"use client";

import {
  BankOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useEffect } from "react";

import { useChangePasswordMutation } from "@/features/auth/authService";
import { updateCurrentUser } from "@/features/auth/authSlice";
import type { ChangePasswordRequest } from "@/features/auth/authTypes";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/features/users/userService";
import type { UpdateUserRequest, User } from "@/features/users/userTypes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const { Text, Title } = Typography;

type AccountSettingsPageProps = {
  accent?: "admin" | "seller";
};

type ProfileFormValues = {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  taxCode?: string;
};

type PasswordFormValues = ChangePasswordRequest & {
  confirmPassword: string;
};

export default function AccountSettingsPage({
  accent = "admin",
}: AccountSettingsPageProps) {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  const { data: user } = useGetUserByIdQuery(authUser?._id || "", {
    skip: !authUser?._id,
  });
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [changePassword, { isLoading: changingPassword }] =
    useChangePasswordMutation();

  const currentUser = user || authUser;
  const profileUser = currentUser as Partial<User> | null;
  const displayName = currentUser?.fullName || "Tài khoản";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const isSeller = accent === "seller";
  const roleLabel =
    currentUser?.role === "admin" ? "Quản trị viên" : "Nhân viên bán hàng";
  const statusLabel = currentUser?.isActive ? "Đang hoạt động" : "Tạm khóa";

  useEffect(() => {
    if (!currentUser) return;

    const extendedUser = currentUser as Partial<User>;

    profileForm.setFieldsValue({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: extendedUser.phone,
      address: extendedUser.address,
      companyName: extendedUser.companyName,
      taxCode: extendedUser.taxCode,
    });
  }, [currentUser, profileForm]);

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!authUser?._id) return;

    try {
      const body: UpdateUserRequest = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        companyName: values.companyName,
        taxCode: values.taxCode,
      };

      const updatedUser = await updateUser({
        id: authUser._id,
        body,
      }).unwrap();

      dispatch(
        updateCurrentUser({
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          isActive: updatedUser.isActive,
        }),
      );

      message.success("Cập nhật hồ sơ thành công");
    } catch {
      message.error("Cập nhật hồ sơ thất bại");
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();

      passwordForm.resetFields();
      message.success("Đổi mật khẩu thành công");
    } catch {
      message.error("Đổi mật khẩu thất bại");
    }
  };

  return (
    <section
      className={`account-settings-shell ${
        isSeller ? "is-seller" : "is-admin"
      }`}
    >
      <Card className="account-settings-hero" variant="borderless">
        <div className="account-settings-hero-main">
          <div className="account-settings-identity">
            <Avatar size={82} className="account-settings-avatar">
              {initial}
            </Avatar>

            <div className="account-settings-copy">
              <Text className="account-settings-eyebrow">
                {isSeller ? "Seller workspace" : "Admin console"}
              </Text>
              <Title level={3}>{displayName}</Title>
              <Text className="account-settings-email">
                {currentUser?.email || "-"}
              </Text>

              <div className="account-settings-tags">
                <Tag color={currentUser?.role === "admin" ? "blue" : "green"}>
                  {roleLabel}
                </Tag>
                <Tag color={currentUser?.isActive ? "success" : "error"}>
                  {statusLabel}
                </Tag>
              </div>
            </div>
          </div>

          <div className="account-settings-status-card">
            <SafetyCertificateOutlined />
            <span>Bảo mật tài khoản</span>
            <strong>{currentUser?.isActive ? "Sẵn sàng" : "Cần kiểm tra"}</strong>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="account-settings-summary">
        <Col xs={24} md={8}>
          <Card variant="borderless" className="account-settings-summary-card">
            <MailOutlined />
            <span>Email đăng nhập</span>
            <strong>{currentUser?.email || "-"}</strong>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="account-settings-summary-card">
            <PhoneOutlined />
            <span>Số điện thoại</span>
            <strong>{profileUser?.phone || "Chưa cập nhật"}</strong>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="account-settings-summary-card">
            <IdcardOutlined />
            <span>Vai trò</span>
            <strong>{roleLabel}</strong>
          </Card>
        </Col>
      </Row>

      <Card className="account-settings-card" variant="borderless">
        <Tabs
          items={[
            {
              key: "profile",
              label: "Hồ sơ cá nhân",
              forceRender: true,
              children: (
                <div className="account-settings-panel">
                  <div className="account-settings-panel-head">
                    <div>
                      <Title level={4}>Thông tin hiển thị</Title>
                      <Text>
                        Những thông tin này được dùng trong menu, phiếu đơn hàng
                        và lịch sử thao tác.
                      </Text>
                    </div>
                  </div>

                  <Form<ProfileFormValues>
                    form={profileForm}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handleUpdateProfile}
                  >
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Họ tên"
                          name="fullName"
                          rules={[
                            { required: true, message: "Vui lòng nhập họ tên" },
                          ]}
                        >
                          <Input prefix={<UserOutlined />} size="large" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[
                            { required: true, message: "Vui lòng nhập email" },
                            {
                              type: "email",
                              message: "Email chưa đúng định dạng",
                            },
                          ]}
                        >
                          <Input prefix={<MailOutlined />} size="large" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="Số điện thoại" name="phone">
                          <Input prefix={<PhoneOutlined />} size="large" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="Công ty" name="companyName">
                          <Input prefix={<BankOutlined />} size="large" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="Mã số thuế" name="taxCode">
                          <Input prefix={<IdcardOutlined />} size="large" />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item label="Địa chỉ" name="address">
                          <Input.TextArea
                            rows={3}
                            placeholder="Nhập địa chỉ liên hệ"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="account-settings-actions">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={updating}
                        icon={<SaveOutlined />}
                      >
                        Lưu hồ sơ
                      </Button>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: "password",
              label: "Đổi mật khẩu",
              forceRender: true,
              children: (
                <div className="account-settings-panel">
                  <div className="account-settings-panel-head">
                    <div>
                      <Title level={4}>Bảo mật đăng nhập</Title>
                      <Text>
                        Nên đổi mật khẩu định kỳ và tránh dùng lại mật khẩu ở hệ
                        thống khác.
                      </Text>
                    </div>
                    <div className="account-settings-security-chip">
                      <LockOutlined />
                      Protected
                    </div>
                  </div>

                  <Form<PasswordFormValues>
                    form={passwordForm}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handleChangePassword}
                  >
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Mật khẩu hiện tại"
                          name="currentPassword"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập mật khẩu hiện tại",
                            },
                          ]}
                        >
                          <Input.Password
                            prefix={<LockOutlined />}
                            size="large"
                            autoComplete="current-password"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Mật khẩu mới"
                          name="newPassword"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập mật khẩu mới",
                            },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                          ]}
                        >
                          <Input.Password
                            prefix={<LockOutlined />}
                            size="large"
                            autoComplete="new-password"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Xác nhận mật khẩu mới"
                          name="confirmPassword"
                          dependencies={["newPassword"]}
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng xác nhận mật khẩu",
                            },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (
                                  !value ||
                                  getFieldValue("newPassword") === value
                                ) {
                                  return Promise.resolve();
                                }

                                return Promise.reject(
                                  new Error("Mật khẩu xác nhận không khớp"),
                                );
                              },
                            }),
                          ]}
                        >
                          <Input.Password
                            prefix={<LockOutlined />}
                            size="large"
                            autoComplete="new-password"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="account-settings-actions">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={changingPassword}
                        icon={<LockOutlined />}
                      >
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <style jsx global>{`
        .account-settings-shell {
          --account-primary: #2563eb;
          --account-primary-hover: #1d4ed8;
          --account-primary-soft: #eff6ff;
          --account-border: #dbe4f0;
          --account-surface: #f8fafc;
          --account-text: #0f172a;
          --account-muted: #64748b;
          display: grid;
          gap: 16px;
        }

        .account-settings-shell.is-seller {
          --account-primary: #0d9488;
          --account-primary-hover: #0f766e;
          --account-primary-soft: #e7f8f5;
          --account-border: #d7ebe7;
          --account-surface: #f3fbf9;
          --account-text: #0b2f2a;
          --account-muted: #5d7471;
        }

        .account-settings-hero,
        .account-settings-summary-card,
        .account-settings-card {
          overflow: hidden;
          border: 1px solid var(--account-border) !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
        }

        .account-settings-shell.is-seller .account-settings-hero,
        .account-settings-shell.is-seller .account-settings-summary-card,
        .account-settings-shell.is-seller .account-settings-card {
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06) !important;
        }

        .account-settings-hero {
          background:
            radial-gradient(circle at 88% 16%, rgba(14, 165, 233, 0.22), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%) !important;
          border-color: rgba(125, 211, 252, 0.2) !important;
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18) !important;
        }

        .account-settings-shell.is-seller .account-settings-hero {
          background:
            linear-gradient(135deg, var(--account-primary-soft), #ffffff 62%)
              !important;
          border-color: var(--account-border) !important;
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06) !important;
        }

        .account-settings-hero .ant-card-body {
          padding: 24px;
        }

        .account-settings-hero-main {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .account-settings-identity {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .account-settings-copy {
          min-width: 0;
        }

        .account-settings-avatar {
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          font-size: 30px;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
        }

        .account-settings-shell.is-seller .account-settings-avatar {
          background: var(--account-primary);
          box-shadow: 0 14px 28px rgba(13, 148, 136, 0.22);
        }

        .account-settings-eyebrow {
          display: block;
          margin-bottom: 6px;
          color: #7dd3fc !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .account-settings-shell.is-seller .account-settings-eyebrow {
          color: var(--account-primary) !important;
        }

        .account-settings-hero h3.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 26px;
          font-weight: 900;
          line-height: 1.2;
        }

        .account-settings-shell.is-seller .account-settings-hero h3.ant-typography {
          color: var(--account-text);
        }

        .account-settings-email {
          display: block;
          margin-top: 5px;
          color: #b8d8e6 !important;
          font-size: 13px;
          line-height: 1.45;
        }

        .account-settings-shell.is-seller .account-settings-email {
          color: var(--account-muted) !important;
        }

        .account-settings-tags {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .account-settings-tags .ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 800;
        }

        .account-settings-status-card {
          width: 230px;
          max-width: 100%;
          min-height: 112px;
          padding: 16px;
          display: grid;
          gap: 8px;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .account-settings-shell.is-seller .account-settings-status-card {
          border-color: var(--account-border);
          background: rgba(255, 255, 255, 0.74);
        }

        .account-settings-status-card .anticon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 18px;
          background: var(--account-primary);
        }

        .account-settings-status-card span,
        .account-settings-summary-card span {
          color: var(--account-muted);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .account-settings-status-card span {
          color: #9ed7eb;
        }

        .account-settings-shell.is-seller .account-settings-status-card span {
          color: var(--account-muted);
        }

        .account-settings-status-card strong,
        .account-settings-summary-card strong {
          overflow: hidden;
          color: var(--account-text);
          font-size: 15px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .account-settings-status-card strong {
          color: #ffffff;
        }

        .account-settings-shell.is-seller .account-settings-status-card strong {
          color: var(--account-text);
        }

        .account-settings-summary-card .ant-card-body {
          min-height: 112px;
          padding: 16px;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 12px;
        }

        .account-settings-summary-card .anticon {
          grid-row: 1 / span 2;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: var(--account-primary);
          font-size: 19px;
          background: var(--account-primary-soft);
        }

        .account-settings-card .ant-card-body {
          padding: 20px;
        }

        .account-settings-card .ant-tabs-nav {
          margin-bottom: 18px;
        }

        .account-settings-panel {
          padding: 18px;
          border: 1px solid var(--account-border);
          border-radius: 8px;
          background: var(--account-surface);
        }

        .account-settings-panel-head {
          margin-bottom: 18px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .account-settings-panel-head h4.ant-typography {
          margin: 0;
          color: var(--account-text);
          font-size: 17px;
          font-weight: 900;
        }

        .account-settings-panel-head span.ant-typography {
          display: block;
          margin-top: 4px;
          color: var(--account-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .account-settings-security-chip {
          height: 34px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--account-border);
          border-radius: 999px;
          color: var(--account-primary);
          background: #ffffff;
          font-size: 12px;
          font-weight: 900;
        }

        .account-settings-card .ant-form {
          padding: 16px;
          border: 1px solid var(--account-border);
          border-radius: 8px;
          background: #ffffff;
        }

        .account-settings-card .ant-form-item-label > label {
          color: var(--account-text);
          font-weight: 800;
        }

        .account-settings-card .ant-btn {
          height: 42px;
          border-radius: 8px;
          font-weight: 800;
        }

        .account-settings-card .ant-btn-primary {
          background: var(--account-primary) !important;
          border-color: var(--account-primary) !important;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
        }

        .account-settings-shell.is-seller .account-settings-card .ant-btn-primary {
          box-shadow: 0 10px 22px rgba(13, 148, 136, 0.18);
        }

        .account-settings-card .ant-btn-primary:hover {
          background: var(--account-primary-hover) !important;
          border-color: var(--account-primary-hover) !important;
        }

        .account-settings-card
          .ant-tabs-tab.ant-tabs-tab-active
          .ant-tabs-tab-btn,
        .account-settings-card .ant-tabs-tab:hover,
        .account-settings-card .ant-tabs-tab:hover .ant-tabs-tab-btn,
        .account-settings-card .ant-tabs-tab-btn:hover,
        .account-settings-card .ant-tabs-tab-btn:focus,
        .account-settings-card .ant-tabs-tab-btn:active {
          color: var(--account-primary) !important;
        }

        .account-settings-card .ant-tabs-tab {
          color: var(--account-muted) !important;
        }

        .account-settings-card .ant-tabs-tab.ant-tabs-tab-active {
          color: var(--account-primary) !important;
        }

        .account-settings-card .ant-tabs-tab-btn {
          color: inherit !important;
          font-weight: 800;
          transition: color 160ms ease;
        }

        .account-settings-card .ant-tabs-ink-bar {
          background: var(--account-primary) !important;
        }

        .account-settings-card .ant-input,
        .account-settings-card .ant-input-affix-wrapper,
        .account-settings-card .ant-input-textarea-affix-wrapper {
          border-color: var(--account-border) !important;
          border-radius: 8px !important;
        }

        .account-settings-card .ant-input:hover,
        .account-settings-card .ant-input-affix-wrapper:hover {
          border-color: var(--account-primary) !important;
        }

        .account-settings-card .ant-input:focus,
        .account-settings-card .ant-input-affix-wrapper-focused {
          border-color: var(--account-primary) !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }

        .account-settings-shell.is-seller .account-settings-card .ant-input:focus,
        .account-settings-shell.is-seller
          .account-settings-card
          .ant-input-affix-wrapper-focused {
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12) !important;
        }

        .account-settings-actions {
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 767px) {
          .account-settings-hero .ant-card-body,
          .account-settings-card .ant-card-body {
            padding: 14px;
          }

          .account-settings-identity {
            align-items: flex-start;
          }

          .account-settings-avatar {
            width: 64px !important;
            height: 64px !important;
            font-size: 24px;
          }

          .account-settings-hero h3.ant-typography {
            font-size: 21px;
          }

          .account-settings-status-card,
          .account-settings-actions .ant-btn {
            width: 100%;
          }

          .account-settings-panel,
          .account-settings-card .ant-form {
            padding: 12px;
          }
        }
      `}</style>
    </section>
  );
}
