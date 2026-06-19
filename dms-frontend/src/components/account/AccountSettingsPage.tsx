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
import ImageUpload from "@/components/common/ImageUpload";
import { getRoleLabel } from "@/features/auth/roleUtils";
import type { UpdateUserRequest, User } from "@/features/users/userTypes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const { Text, Title } = Typography;

type AccountSettingsPageProps = {
  accent?: "admin" | "distributor" | "seller";
  showPasswordTab?: boolean;
};

type ProfileFormValues = {
  fullName: string;
  email: string;
  avatar?: string;
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
  showPasswordTab = true,
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
  const watchedAvatar = Form.useWatch("avatar", profileForm);
  const avatarUrl = watchedAvatar || profileUser?.avatar;
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const workspaceClass =
    accent === "distributor"
      ? "is-distributor"
      : accent === "seller"
        ? "is-seller"
        : "is-admin";
  const roleLabel = getRoleLabel(currentUser?.role);
  const statusLabel = currentUser?.isActive ? "Đang hoạt động" : "Tạm khóa";

  useEffect(() => {
    if (!currentUser) return;

    const extendedUser = currentUser as Partial<User>;

    profileForm.setFieldsValue({
      fullName: currentUser.fullName,
      email: currentUser.email,
      avatar: extendedUser.avatar,
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
        avatar: values.avatar,
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
          avatar: updatedUser.avatar,
          isActive: updatedUser.isActive,
        }),
      );

      message.success("Cập nhật hồ sơ thành công");
    } catch {
      message.error("Cập nhật hồ sơ thất bại");
    }
  };

  const handleUpdateAvatar = async (avatar: string) => {
    if (!authUser?._id) return;

    profileForm.setFieldValue("avatar", avatar);

    try {
      const updatedUser = await updateUser({
        id: authUser._id,
        body: { avatar },
      }).unwrap();

      dispatch(updateCurrentUser({ avatar: updatedUser.avatar }));
      message.success("Cập nhật avatar thành công");
    } catch {
      message.error("Cập nhật avatar thất bại");
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
    <section className={`account-settings-shell ${workspaceClass}`}>
      <Card className="account-settings-hero" variant="borderless">
        <div className="account-settings-hero-main">
          <div className="account-settings-identity">
            <Avatar
              size={82}
              src={avatarUrl?.trim() || undefined}
              className="account-settings-avatar"
            >
              {initial}
            </Avatar>

            <div className="account-settings-copy">
              <Text className="account-settings-eyebrow">
                {accent === "distributor"
                  ? "Khu vực nhà phân phối"
                  : accent === "seller"
                    ? "Khu vực bán hàng"
                    : "Khu vực quản trị"}
              </Text>
              <Title level={3}>{displayName}</Title>
              <Text className="account-settings-email">
                {currentUser?.email || "-"}
              </Text>

              <div className="account-settings-tags">
                <Tag color="blue">{roleLabel}</Tag>
                <Tag color={currentUser?.isActive ? "success" : "error"}>
                  {statusLabel}
                </Tag>
              </div>
            </div>
          </div>

          <div className="account-settings-status-card">
            <SafetyCertificateOutlined />
            <span>Bảo mật tài khoản</span>
            <strong>
              {currentUser?.isActive ? "Sẵn sàng" : "Cần kiểm tra"}
            </strong>
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
          tabBarStyle={!showPasswordTab ? { display: "none" } : undefined}
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
                    <div className="account-settings-avatar-field">
                      <Avatar
                        size={88}
                        src={avatarUrl?.trim() || undefined}
                        className="account-settings-avatar-preview"
                      >
                        {initial}
                      </Avatar>
                      <div className="account-settings-avatar-content">
                        <div>
                          <Text className="account-settings-avatar-title">
                            Avatar tài khoản
                          </Text>
                          <Text className="account-settings-avatar-hint">
                            Ảnh này hiển thị ở hồ sơ, header và khu vực tài
                            khoản nhà phân phối.
                          </Text>
                        </div>
                        <div className="account-settings-avatar-upload">
                          <ImageUpload
                            value={avatarUrl}
                            onChange={handleUpdateAvatar}
                            actionPath="/upload/avatar"
                            alt="Avatar tài khoản"
                            label="Đổi avatar"
                            size={88}
                            variant="button"
                          />
                        </div>
                      </div>
                      <Form.Item name="avatar" hidden>
                        <Input />
                      </Form.Item>
                    </div>

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
            ...(showPasswordTab
              ? [
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
                              Nên đổi mật khẩu định kỳ và tránh dùng lại mật
                              khẩu ở hệ thống khác.
                            </Text>
                          </div>
                          <div className="account-settings-security-chip">
                            <LockOutlined />
                            Đã bảo vệ
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
                                  {
                                    min: 6,
                                    message: "Mật khẩu tối thiểu 6 ký tự",
                                  },
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
                                        new Error(
                                          "Mật khẩu xác nhận không khớp",
                                        ),
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
                ]
              : []),
          ]}
        />
      </Card>

      <style jsx global>{`
        .account-settings-shell {
          --account-primary: #2563eb;
          --account-primary-hover: #1d4ed8;
          --account-primary-soft: #eff6ff;
          --account-border: #b8c6d8;
          --account-surface: #f8fafc;
          --account-text: #0f172a;
          --account-muted: #64748b;
          display: grid;
          gap: 16px;
        }

        .account-settings-shell.is-seller,
        .account-settings-shell.is-distributor {
          --account-primary: #2563eb;
          --account-primary-hover: #1d4ed8;
          --account-primary-soft: #eff6ff;
          --account-border: #b8c6d8;
          --account-surface: #f8fbff;
          --account-text: #0f172a;
          --account-muted: #64748b;
        }

        .account-settings-hero,
        .account-settings-summary-card,
        .account-settings-card {
          overflow: hidden;
          border: 1px solid var(--account-border) !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

        .account-settings-shell.is-seller .account-settings-hero,
        .account-settings-shell.is-seller .account-settings-summary-card,
        .account-settings-shell.is-seller .account-settings-card,
        .account-settings-shell.is-distributor .account-settings-hero,
        .account-settings-shell.is-distributor .account-settings-summary-card,
        .account-settings-shell.is-distributor .account-settings-card {
          box-shadow: none !important;
        }

        .account-settings-hero {
          background: #102b3a !important;
          border-color: rgba(125, 211, 252, 0.2) !important;
          box-shadow: none !important;
        }

        .account-settings-shell.is-seller .account-settings-hero,
        .account-settings-shell.is-distributor .account-settings-hero {
          background: #ffffff !important;
          border-color: var(--account-border) !important;
          box-shadow: none !important;
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
          background: #2563eb;
          font-size: 30px;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: none;
        }

        .account-settings-shell.is-seller .account-settings-avatar,
        .account-settings-shell.is-distributor .account-settings-avatar {
          background: var(--account-primary);
          box-shadow: none;
        }

        .account-settings-eyebrow {
          display: block;
          margin-bottom: 6px;
          color: #7dd3fc !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .account-settings-shell.is-seller .account-settings-eyebrow,
        .account-settings-shell.is-distributor .account-settings-eyebrow {
          color: var(--account-primary) !important;
        }

        .account-settings-hero h3.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 26px;
          font-weight: 900;
          line-height: 1.2;
        }

        .account-settings-shell.is-seller
          .account-settings-hero
          h3.ant-typography,
        .account-settings-shell.is-distributor
          .account-settings-hero
          h3.ant-typography {
          color: var(--account-text);
        }

        .account-settings-email {
          display: block;
          margin-top: 5px;
          color: #b8d8e6 !important;
          font-size: 13px;
          line-height: 1.45;
        }

        .account-settings-shell.is-seller .account-settings-email,
        .account-settings-shell.is-distributor .account-settings-email {
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

        .account-settings-shell.is-seller .account-settings-status-card,
        .account-settings-shell.is-distributor .account-settings-status-card {
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

        .account-settings-shell.is-seller .account-settings-status-card span,
        .account-settings-shell.is-distributor
          .account-settings-status-card
          span {
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

        .account-settings-shell.is-seller .account-settings-status-card strong,
        .account-settings-shell.is-distributor
          .account-settings-status-card
          strong {
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
          padding: 0;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .account-settings-panel-head {
          margin-bottom: 18px;
          padding: 0 !important;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
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
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
        }

        .account-settings-avatar-field {
          margin-bottom: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid var(--account-border);
          border-radius: 8px;
          background: #ffffff;
        }

        .account-settings-avatar-preview {
          flex-shrink: 0;
          border: 3px solid #ffffff;
          background: var(--account-primary);
          color: #ffffff;
          font-size: 30px;
          font-weight: 900;
          box-shadow: none;
        }

        .account-settings-avatar-content {
          min-width: 0;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .account-settings-avatar-title {
          display: block;
          color: var(--account-text) !important;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.35;
        }

        .account-settings-avatar-hint {
          display: block;
          max-width: 520px;
          margin-top: 4px;
          color: var(--account-muted) !important;
          font-size: 13px;
          line-height: 1.5;
        }

        .account-settings-avatar-upload {
          margin-bottom: 0 !important;
          flex-shrink: 0;
        }

        .account-settings-avatar-upload .ant-btn {
          height: 38px;
          border-color: var(--account-primary) !important;
          background: #ffffff !important;
          color: var(--account-primary) !important;
          font-weight: 850;
        }

        .account-settings-avatar-upload .ant-btn:hover {
          border-color: var(--account-primary-hover) !important;
          background: var(--account-primary-soft) !important;
          color: var(--account-primary-hover) !important;
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
          box-shadow: none !important;
        }

        .account-settings-shell.is-seller
          .account-settings-card
          .ant-btn-primary,
        .account-settings-shell.is-distributor
          .account-settings-card
          .ant-btn-primary {
          box-shadow: none !important;
        }

        .account-settings-card .ant-btn-primary:hover {
          background: var(--account-primary-hover) !important;
          border-color: var(--account-primary-hover) !important;
        }

        .account-settings-card
          .ant-tabs-tab.ant-tabs-tab-active
          .ant-tabs-tab-btn {
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
          transition: none !important;
        }

        .account-settings-card .ant-tabs-tab:hover,
        .account-settings-card .ant-tabs-tab:hover .ant-tabs-tab-btn,
        .account-settings-card .ant-tabs-tab-btn:hover,
        .account-settings-card .ant-tabs-tab-btn:focus,
        .account-settings-card .ant-tabs-tab-btn:active {
          color: inherit !important;
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

        .account-settings-card .ant-input-affix-wrapper .ant-input {
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
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

        .account-settings-shell.is-seller
          .account-settings-card
          .ant-input:focus,
        .account-settings-shell.is-distributor
          .account-settings-card
          .ant-input:focus,
        .account-settings-shell.is-seller
          .account-settings-card
          .ant-input-affix-wrapper-focused,
        .account-settings-shell.is-distributor
          .account-settings-card
          .ant-input-affix-wrapper-focused {
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }

        .account-settings-card .ant-input-affix-wrapper .ant-input:hover,
        .account-settings-card .ant-input-affix-wrapper .ant-input:focus {
          border: 0 !important;
          box-shadow: none !important;
        }

        .account-settings-actions {
          display: flex;
          justify-content: flex-end;
        }

        .account-settings-shell
          :where(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-panel,
            .account-settings-avatar-field,
            .account-settings-security-chip,
            .ant-card,
            .ant-card-body,
            .ant-avatar
          ),
        .account-settings-shell
          :where(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-panel,
            .account-settings-avatar-field,
            .account-settings-security-chip,
            .ant-card,
            .ant-card-body,
            .ant-avatar
          ):hover {
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

        .account-settings-shell
          :where(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-avatar-field
          ):hover {
          border-color: var(--account-border) !important;
        }

        .account-settings-hero:hover {
          border-color: rgba(125, 211, 252, 0.2) !important;
          background: #102b3a !important;
        }

        .account-settings-shell.is-seller .account-settings-hero:hover,
        .account-settings-shell.is-distributor .account-settings-hero:hover {
          border-color: var(--account-border) !important;
          background: #ffffff !important;
        }

        .admin-layout-root
          .account-settings-shell
          :is(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-panel,
            .account-settings-panel-head,
            .account-settings-avatar-field,
            .account-settings-security-chip,
            .ant-card,
            .ant-card-body,
            .ant-avatar
          ),
        .distributor-shell
          .account-settings-shell
          :is(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-panel,
            .account-settings-panel-head,
            .account-settings-avatar-field,
            .account-settings-security-chip,
            .ant-card,
            .ant-card-body,
            .ant-avatar
          ),
        .admin-layout-root
          .account-settings-shell
          :is(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-panel,
            .account-settings-panel-head,
            .account-settings-avatar-field,
            .account-settings-security-chip,
            .ant-card,
            .ant-card-body,
            .ant-avatar
          ):hover,
        .distributor-shell
          .account-settings-shell
          :is(
            .account-settings-hero,
            .account-settings-summary-card,
            .account-settings-card,
            .account-settings-status-card,
            .account-settings-panel,
            .account-settings-panel-head,
            .account-settings-avatar-field,
            .account-settings-security-chip,
            .ant-card,
            .ant-card-body,
            .ant-avatar
          ):hover {
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

        .admin-content-frame .account-settings-shell .account-settings-panel,
        .admin-content-frame
          .account-settings-shell
          .account-settings-panel:hover,
        .admin-content-frame
          .account-settings-shell
          .account-settings-panel-head,
        .admin-content-frame
          .account-settings-shell
          .account-settings-panel-head:hover,
        .distributor-content .account-settings-shell .account-settings-panel,
        .distributor-content
          .account-settings-shell
          .account-settings-panel:hover,
        .distributor-content
          .account-settings-shell
          .account-settings-panel-head,
        .distributor-content
          .account-settings-shell
          .account-settings-panel-head:hover {
          padding-inline: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card.ant-card,
        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card.ant-card:hover,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card.ant-card,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card.ant-card:hover {
          border-color: var(--account-border) !important;
          background: #ffffff !important;
          color: var(--account-text) !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card.ant-card::before,
        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card.ant-card::after,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card.ant-card::before,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card.ant-card::after {
          display: none !important;
          content: none !important;
        }

        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card
          span,
        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card
          strong,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card
          span,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card
          strong {
          color: var(--account-text) !important;
          opacity: 1 !important;
        }

        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card
          span,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card
          span {
          color: var(--account-muted) !important;
        }

        .admin-layout-root
          .account-settings-shell
          .account-settings-summary-card
          .anticon,
        .distributor-shell
          .account-settings-shell
          .account-settings-summary-card
          .anticon {
          color: var(--account-primary) !important;
          background: var(--account-primary-soft) !important;
          box-shadow: none !important;
        }

        .distributor-content
          .account-settings-shell
          .account-settings-card
          .ant-tabs-tab:hover,
        .distributor-content
          .account-settings-shell
          .account-settings-card
          .ant-tabs-tab:hover
          .ant-tabs-tab-btn,
        .distributor-content
          .account-settings-shell
          .account-settings-card
          .ant-tabs-tab-btn:hover,
        .admin-content-frame
          .account-settings-shell
          .account-settings-card
          .ant-tabs-tab:hover,
        .admin-content-frame
          .account-settings-shell
          .account-settings-card
          .ant-tabs-tab:hover
          .ant-tabs-tab-btn,
        .admin-content-frame
          .account-settings-shell
          .account-settings-card
          .ant-tabs-tab-btn:hover {
          color: inherit !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
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

          .account-settings-avatar-field {
            align-items: flex-start;
          }

          .account-settings-avatar-content {
            align-items: flex-start;
            flex-direction: column;
          }

          .account-settings-panel,
          .account-settings-card .ant-form {
            padding: 0;
          }
        }
      `}</style>
    </section>
  );
}
