"use client";

import {
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/features/users/userService";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
} from "@/features/users/userTypes";

const { Text } = Typography;

type UserFormMode = "create" | "edit";

type UserFormValues = {
  code?: string;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  manager?: string;
  companyName?: string;
  taxCode?: string;
  address?: string;
  isActive?: boolean;
};

export default function UserFormPage({ mode }: { mode: UserFormMode }) {
  const isEdit = mode === "edit";
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<UserFormValues>();
  const selectedRole = Form.useWatch("role", form);

  const { data: users = [] } = useGetUsersQuery();
  const { data: user, isLoading: loadingUser } = useGetUserByIdQuery(id || "", {
    skip: !isEdit || !id,
  });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const distributorUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          item.role === "distributor" &&
          item.isActive &&
          item._id !== id,
      ),
    [id, users],
  );
  const needsAsmManager = selectedRole === "seller";

  useEffect(() => {
    if (!user) return;

    form.setFieldsValue({
      code: user.code,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      manager:
        typeof user.manager === "string" ? user.manager : user.manager?._id,
      companyName: user.companyName,
      address: user.address,
      taxCode: user.taxCode,
      isActive: user.isActive,
    });
  }, [form, user]);

  const handleSubmit = async (values: UserFormValues) => {
    try {
      if (isEdit && id) {
        const body = Object.fromEntries(
          Object.entries(values).filter(
            ([, value]) => value !== undefined && value !== "",
          ),
        ) as UpdateUserRequest;

        await updateUser({ id, body }).unwrap();
        message.success("Cập nhật nhân viên thành công");
        router.push("/admin/users");
        return;
      }

      await createUser(values as CreateUserRequest).unwrap();
      message.success("Thêm nhân viên thành công");
      router.push("/admin/users");
    } catch (error: unknown) {
      const err = error as {
        data?: {
          message?: string | string[];
        };
      };

      message.error(
        Array.isArray(err?.data?.message)
          ? err.data.message[0]
          : err?.data?.message ||
              (isEdit ? "Cập nhật nhân viên thất bại" : "Thêm nhân viên thất bại"),
      );
    }
  };

  if (isEdit && loadingUser) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa nhân viên"
          description="Cập nhật thông tin tài khoản nhân viên."
          extra={
            <Button onClick={() => router.push("/admin/users")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-user-form-frame is-loading" />
        <UserFormStyles />
      </>
    );
  }

  if (isEdit && !user) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa nhân viên"
          description="Cập nhật thông tin tài khoản nhân viên."
          extra={
            <Button onClick={() => router.push("/admin/users")}>
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-user-form-frame">
          <Empty description="Không tìm thấy nhân viên" />
        </div>
        <UserFormStyles />
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={isEdit ? "Sửa nhân viên" : "Thêm nhân viên"}
        description={
          isEdit
            ? "Cập nhật hồ sơ, liên hệ và trạng thái hoạt động của nhân viên."
            : "Tạo tài khoản nhân viên bán hàng mới trong hệ thống."
        }
        extra={
          <Button onClick={() => router.push("/admin/users")}>Quay lại</Button>
        }
      />

      <section className="admin-user-form-shell">
        <div className="admin-user-form-frame">
          <Form<UserFormValues>
            form={form}
            layout="vertical"
            initialValues={{ role: "seller", isActive: true }}
            onFinish={handleSubmit}
          >
            <section className="admin-user-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-user-form-section-head"
              >
                <div>
                  <Text className="admin-user-form-section-title">
                    Thông tin tài khoản
                  </Text>
                  <Text className="admin-user-form-section-desc">
                    Nhập thông tin đăng nhập và vai trò sử dụng trong hệ thống.
                  </Text>
                </div>
                <Tag color="blue" className="admin-user-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mã nhân sự"
                    name="code"
                    normalize={(value?: string) => value?.toUpperCase()}
                    rules={[
                      {
                        required: selectedRole === "seller" || selectedRole === "distributor",
                        message: "Vui lòng nhập mã DSR/NPP",
                      },
                      {
                        validator: (_, value?: string) => {
                          if (!value) return Promise.resolve();

                          const pattern =
                            selectedRole === "distributor"
                              ? /^NPP-[A-Z]{2,4}-\d{3}$/
                              : selectedRole === "seller"
                                ? /^DSR-[A-Z]{2,4}-NPP\d{3}-\d{3}$/
                                : /^(NPP-[A-Z]{2,4}-\d{3}|DSR-[A-Z]{2,4}-NPP\d{3}-\d{3})$/;

                          return pattern.test(value)
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error(
                                  selectedRole === "distributor"
                                    ? "Mã NPP có dạng NPP-HCM-001"
                                    : "Mã DSR có dạng DSR-HCM-NPP001-001",
                                ),
                              );
                        },
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<IdcardOutlined />}
                      placeholder={
                        selectedRole === "distributor"
                          ? "Ví dụ: NPP-HCM-001"
                          : "Ví dụ: DSR-HCM-NPP001-001"
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Họ tên"
                    name="fullName"
                    rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ tên nhân viên"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email" },
                      { type: "email", message: "Email không hợp lệ" },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined />}
                      placeholder="Nhập email nhân viên"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={isEdit ? "Mật khẩu mới" : "Mật khẩu"}
                    name="password"
                    rules={
                      isEdit
                        ? []
                        : [{ required: true, message: "Vui lòng nhập mật khẩu" }]
                    }
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined />}
                      placeholder={
                        isEdit
                          ? "Bỏ trống nếu không đổi mật khẩu"
                          : "Nhập mật khẩu"
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Vai trò"
                    name="role"
                    rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn vai trò"
                      options={
                        isEdit
                          ? [
                              { label: "Admin", value: "admin" },
                              { label: "Nhà phân phối", value: "distributor" },
                              { label: "DSR", value: "seller" },
                            ]
                          : [
                              { label: "Nhà phân phối", value: "distributor" },
                              { label: "DSR", value: "seller" },
                            ]
                      }
                    />
                  </Form.Item>
                </Col>

                {needsAsmManager ? (
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Nhà phân phối quản lý"
                      name="manager"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn nhà phân phối quản lý DSR",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        size="large"
                        placeholder="Chọn nhà phân phối quản lý"
                        optionFilterProp="label"
                        options={distributorUsers.map((distributor) => ({
                          label: `${distributor.fullName} - ${distributor.email}`,
                          value: distributor._id,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                ) : null}

                {isEdit ? (
                  <Col xs={24} md={12}>
                    <Form.Item label="Trạng thái" name="isActive">
                      <Select
                        size="large"
                        placeholder="Chọn trạng thái"
                        options={[
                          { label: "Hoạt động", value: true },
                          { label: "Khóa", value: false },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                ) : null}
              </Row>
            </section>

            <section className="admin-user-form-section">
              <Flex
                justify="space-between"
                align="flex-start"
                gap={14}
                wrap="wrap"
                className="admin-user-form-section-head"
              >
                <div>
                  <Text className="admin-user-form-section-title">
                    Hồ sơ liên hệ
                  </Text>
                  <Text className="admin-user-form-section-desc">
                    Bổ sung số điện thoại, công ty, mã số thuế và địa chỉ.
                  </Text>
                </div>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Số điện thoại" name="phone">
                    <Input
                      size="large"
                      prefix={<PhoneOutlined />}
                      placeholder="Nhập số điện thoại"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Công ty" name="companyName">
                    <Input
                      size="large"
                      prefix={<ShopOutlined />}
                      placeholder="Nhập tên công ty"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Mã số thuế" name="taxCode">
                    <Input
                      size="large"
                      prefix={<IdcardOutlined />}
                      placeholder="Nhập mã số thuế"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Địa chỉ" name="address">
                    <Input size="large" placeholder="Nhập địa chỉ" />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <Flex
              justify="space-between"
              align="center"
              gap={12}
              wrap="wrap"
              className="admin-user-form-footer"
            >
              <Flex align="center" gap={10} className="admin-user-form-note">
                <UserOutlined />
                <Text>{isEdit ? "Đang cập nhật hồ sơ" : "Tạo nhân viên mới"}</Text>
              </Flex>

              <Space wrap>
                <Button
                  size="large"
                  onClick={() => router.push("/admin/users")}
                  className="admin-user-form-action"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating || updating}
                  icon={<SaveOutlined />}
                  className="admin-user-form-action"
                >
                  {isEdit ? "Cập nhật nhân viên" : "Thêm nhân viên"}
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </section>

      <UserFormStyles />
    </>
  );
}

function UserFormStyles() {
  return (
    <style jsx global>{`
      .admin-user-form-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-user-form-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-user-form-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-user-loading 1.2s ease infinite;
      }

      @keyframes admin-user-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-user-form-section + .admin-user-form-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-user-form-section-head {
        margin-bottom: 18px;
      }

      .admin-user-form-section-title,
      .admin-user-form-section-desc {
        display: block;
      }

      .admin-user-form-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-user-form-section-desc {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-user-form-section-tag {
        margin-inline-end: 0;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-user-form-footer {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-user-form-note {
        min-height: 40px;
        padding: 0 14px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-user-form-note .anticon {
        color: #2563eb;
      }

      .admin-user-form-note .ant-typography {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 800;
      }

      .admin-user-form-action {
        height: 40px !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
      }

      @media (max-width: 767px) {
        .admin-user-form-frame {
          padding: 14px;
        }

        .admin-user-form-note,
        .admin-user-form-action {
          width: 100%;
        }
      }
    `}</style>
  );
}
