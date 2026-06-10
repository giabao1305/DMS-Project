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
import { useEffect, useMemo, useState } from "react";

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
  provinceCode?: number;
  wardName?: string;
  isActive?: boolean;
};

type Ward = {
  name: string;
  code: number;
  codename: string;
  province_code: number;
};

type Province = {
  name: string;
  code: number;
  codename: string;
  wards?: Ward[];
};

const PROVINCES_API_URL = "https://provinces.open-api.vn/api/v2/";

const padCode = (value: number) => value.toString().padStart(6, "0");

const provinceRegionCode = (province?: Province) => {
  if (!province) return "";

  const words = province.codename
    .split("_")
    .filter((word) => !["tinh", "thanh", "pho"].includes(word));

  return words
    .map((word) => word[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 4);
};

const extractDistributorCodeParts = (code?: string) => {
  const match = code?.match(/^NPP-([A-Z]{2,4})-(\d{3,6})$/);

  if (!match) return undefined;

  return {
    region: match[1],
    sequence: match[2],
  };
};

const nextSequence = (
  users: Array<{ code?: string; role: UserRole; manager?: string | { _id: string } }>,
  pattern: RegExp,
) => {
  const max = users.reduce((currentMax, user) => {
    const match = user.code?.match(pattern);
    const value = match ? Number(match[1]) : 0;

    return Number.isFinite(value) ? Math.max(currentMax, value) : currentMax;
  }, 0);

  return padCode(max + 1);
};

export default function UserFormPage({ mode }: { mode: UserFormMode }) {
  const isEdit = mode === "edit";
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<UserFormValues>();
  const selectedRole = Form.useWatch("role", form);
  const selectedManagerId = Form.useWatch("manager", form);
  const selectedCompanyName = Form.useWatch("companyName", form);
  const selectedProvinceCode = Form.useWatch("provinceCode", form);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

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
  const selectedDistributor = useMemo(
    () =>
      users.find(
        (distributor) =>
          distributor.role === "distributor" &&
          distributor._id === selectedManagerId,
      ),
    [selectedManagerId, users],
  );
  const distributorCompanyName = selectedDistributor?.companyName || "";
  const selectedProvince = useMemo(
    () => provinces.find((province) => province.code === selectedProvinceCode),
    [provinces, selectedProvinceCode],
  );

  const provinceOptions = useMemo(
    () =>
      provinces.map((province) => ({
        label: province.name,
        value: province.code,
      })),
    [provinces],
  );
  const wardOptions = useMemo(
    () =>
      wards.map((ward) => ({
        label: ward.name,
        value: ward.name,
      })),
    [wards],
  );
  const visibleDistributorUsers = useMemo(() => {
    const region = provinceRegionCode(selectedProvince);

    if (!region) return distributorUsers;

    return distributorUsers.filter((distributor) => {
      const parts = extractDistributorCodeParts(distributor.code);

      return parts?.region === region;
    });
  }, [distributorUsers, selectedProvince]);

  useEffect(() => {
    let ignore = false;

    async function loadProvinces() {
      setLoadingProvinces(true);

      try {
        const response = await fetch(PROVINCES_API_URL);
        const data = (await response.json()) as Province[];

        if (!ignore) {
          setProvinces(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) {
          setProvinces([]);
        }
      } finally {
        if (!ignore) {
          setLoadingProvinces(false);
        }
      }
    }

    loadProvinces();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([]);
      return;
    }

    let ignore = false;

    async function loadWards() {
      setLoadingWards(true);

      try {
        const response = await fetch(
          `${PROVINCES_API_URL}p/${selectedProvinceCode}?depth=2`,
        );
        const data = (await response.json()) as Province;

        if (!ignore) {
          setWards(Array.isArray(data.wards) ? data.wards : []);
        }
      } catch {
        if (!ignore) {
          setWards([]);
        }
      } finally {
        if (!ignore) {
          setLoadingWards(false);
        }
      }
    }

    loadWards();

    return () => {
      ignore = true;
    };
  }, [selectedProvinceCode]);

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

  const generatedCode = useMemo(() => {
    if (isEdit) return user?.code || "";

    if (selectedRole === "distributor") {
      const region = provinceRegionCode(selectedProvince);
      if (!region) return "";

      const sequence = nextSequence(
        users,
        new RegExp(`^NPP-${region}-(\\d{3,6})$`),
      );

      return `NPP-${region}-${sequence}`;
    }

    if (selectedRole === "seller") {
      const distributorParts = extractDistributorCodeParts(
        selectedDistributor?.code,
      );
      if (!distributorParts || !selectedDistributor?._id) return "";

      const sellerUsers = users.filter((entry) => {
        const managerId =
          typeof entry.manager === "string"
            ? entry.manager
            : entry.manager?._id;

        return entry.role === "seller" && managerId === selectedDistributor._id;
      });
      const sequence = nextSequence(
        sellerUsers,
        new RegExp(
          `^DSR-${distributorParts.region}-NPP${distributorParts.sequence}-(\\d{3,6})$`,
        ),
      );

      return `DSR-${distributorParts.region}-NPP${distributorParts.sequence}-${sequence}`;
    }

    return "";
  }, [isEdit, selectedDistributor, selectedProvince, selectedRole, user, users]);

  const resolveCompanyName = (values: UserFormValues) => {
    if (values.role !== "seller") return values.companyName || undefined;

    const managerCompanyName =
      users.find(
        (distributor) =>
          distributor.role === "distributor" &&
          distributor._id === values.manager,
      )?.companyName || "";

    return managerCompanyName || values.companyName || undefined;
  };

  const handleSubmit = async (values: UserFormValues) => {
    try {
      const address =
        [values.wardName, selectedProvince?.name].filter(Boolean).join(", ") ||
        user?.address ||
        undefined;

      if (isEdit && id) {
        const { provinceCode, wardName, ...editableValues } = values;
        void provinceCode;
        void wardName;

        const bodyValues = {
          ...editableValues,
          code: generatedCode || values.code,
          address,
          companyName: resolveCompanyName(values),
        };
        const body = Object.fromEntries(
          Object.entries(bodyValues).filter(
            ([, value]) => value !== undefined && value !== "",
          ),
        ) as UpdateUserRequest;

        await updateUser({ id, body }).unwrap();
        message.success("Cập nhật nhân viên thành công");
        router.push("/admin/users");
        return;
      }

      const createValues: CreateUserRequest = {
        code: generatedCode || values.code || undefined,
        fullName: values.fullName,
        email: values.email,
        password: values.password as string,
        phone: values.phone || undefined,
        role: values.role,
        manager: values.role === "seller" ? values.manager : undefined,
        companyName: resolveCompanyName(values),
        address,
        taxCode: values.taxCode || undefined,
      };

      await createUser(createValues).unwrap();
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
                    Chọn vai trò và tỉnh/thành trước để hệ thống tự sinh mã nhân sự.
                  </Text>
                </div>
                <Tag color="blue" className="admin-user-form-section-tag">
                  Bắt buộc
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Vai trò"
                    name="role"
                    rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn vai trò"
                      onChange={() => {
                        form.resetFields(["manager", "wardName"]);
                      }}
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

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tỉnh/thành"
                    name="provinceCode"
                    rules={[
                      {
                        required:
                          selectedRole === "distributor" ||
                          selectedRole === "seller",
                        message: "Vui lòng chọn tỉnh/thành",
                      },
                    ]}
                  >
                    <Select
                      allowClear
                      showSearch
                      size="large"
                      loading={loadingProvinces}
                      virtual={false}
                      popupMatchSelectWidth={false}
                      listHeight={256}
                      optionFilterProp="label"
                      placeholder="Chọn tỉnh/thành"
                      options={provinceOptions}
                      onChange={() => {
                        form.resetFields(["manager", "wardName"]);
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Xã/phường" name="wardName">
                    <Select
                      allowClear
                      showSearch
                      size="large"
                      disabled={!selectedProvinceCode}
                      loading={loadingWards}
                      virtual={false}
                      popupMatchSelectWidth={false}
                      listHeight={256}
                      optionFilterProp="label"
                      placeholder="Chọn xã/phường"
                      options={wardOptions}
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
                        virtual={false}
                        popupMatchSelectWidth={false}
                        listHeight={256}
                        options={visibleDistributorUsers.map((distributor) => ({
                          label: `${distributor.code ? `${distributor.code} - ` : ""}${
                            distributor.companyName || distributor.fullName
                          }`,
                          value: distributor._id,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                ) : null}

                <Col xs={24} md={12}>
                  <Form.Item label="Mã nhân sự">
                    <Input
                      readOnly
                      size="large"
                      prefix={<IdcardOutlined />}
                      value={generatedCode}
                      placeholder={
                        selectedRole === "distributor"
                          ? "Chọn tỉnh/thành để sinh mã NPP"
                          : "Chọn NPP quản lý để sinh mã DSR"
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
                    Bổ sung số điện thoại, công ty và mã số thuế.
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
                  {needsAsmManager ? (
                    <Form.Item label="Công ty">
                      <Input
                        size="large"
                        prefix={<ShopOutlined />}
                        readOnly
                        value={distributorCompanyName || selectedCompanyName || ""}
                        placeholder="Chọn nhà phân phối để hiển thị công ty"
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item label="Công ty" name="companyName">
                      <Input
                        size="large"
                        prefix={<ShopOutlined />}
                        placeholder="Nhập tên công ty"
                      />
                    </Form.Item>
                  )}
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

