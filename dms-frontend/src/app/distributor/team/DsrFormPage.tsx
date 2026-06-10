"use client";

import {
  ArrowLeftOutlined,
  BankOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
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

import {
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetMeQuery } from "@/features/auth/authService";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import {
  useCreateSellerMutation,
  useGetSellerUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";

const { Text } = Typography;

type DsrFormMode = "create" | "edit";

type DsrFormValues = {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  taxCode?: string;
  provinceCode?: number;
  wardName?: string;
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

const extractDistributorCodeParts = (code?: string) => {
  const match = code?.match(/^NPP-([A-Z]{2,4})-(\d{3,6})$/);

  if (!match) return undefined;

  return {
    region: match[1],
    sequence: match[2],
  };
};

const getManagerId = (user: User) => {
  if (!user.manager) return undefined;

  return typeof user.manager === "string" ? user.manager : user.manager._id;
};

const nextSequence = (users: User[], pattern: RegExp) => {
  const max = users.reduce((currentMax, user) => {
    const match = user.code?.match(pattern);
    const value = match ? Number(match[1]) : 0;

    return Number.isFinite(value) ? Math.max(currentMax, value) : currentMax;
  }, 0);

  return padCode(max + 1);
};

export default function DsrFormPage({ mode }: { mode: DsrFormMode }) {
  const isEdit = mode === "edit";
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<DsrFormValues>();
  const selectedProvinceCode = Form.useWatch("provinceCode", form);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const { data: user, isLoading } = useGetUserByIdQuery(id || "", {
    skip: !isEdit || !id,
  });
  const { data: currentDistributor, isLoading: loadingDistributor } =
    useGetMeQuery();
  const { data: sellers = [], isLoading: loadingSellers } =
    useGetSellerUsersQuery(undefined, {
      skip: isEdit,
    });
  const [createSeller, { isLoading: creating }] = useCreateSellerMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const distributorCompanyName =
    currentDistributor?.companyName || currentDistributor?.fullName || "";
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
  const generatedCode = useMemo(() => {
    if (isEdit) return user?.code || "";

    const distributorParts = extractDistributorCodeParts(currentDistributor?.code);
    if (!distributorParts || !currentDistributor?._id) return "";

    const scopedSellers = sellers.filter(
      (seller) =>
        seller.role === "seller" && getManagerId(seller) === currentDistributor._id,
    );
    const sequence = nextSequence(
      scopedSellers,
      new RegExp(
        `^DSR-${distributorParts.region}-NPP${distributorParts.sequence}-(\\d{3,6})$`,
      ),
    );

    return `DSR-${distributorParts.region}-NPP${distributorParts.sequence}-${sequence}`;
  }, [currentDistributor, isEdit, sellers, user]);

  const readonlyCompanyName = isEdit
    ? user?.companyName || distributorCompanyName
    : distributorCompanyName;

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
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      taxCode: user.taxCode,
      password: undefined,
    });
  }, [form, user]);

  const handleSubmit = async (values: DsrFormValues) => {
    if (!isEdit && !generatedCode) {
      message.warning("NPP chưa có mã hợp lệ để tự sinh mã DSR");
      return;
    }

    const address =
      [values.wardName, selectedProvince?.name].filter(Boolean).join(", ") ||
      user?.address ||
      undefined;
    const body = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || undefined,
      address,
      taxCode: values.taxCode?.trim() || undefined,
      password: values.password || undefined,
    };

    try {
      if (isEdit && id) {
        await updateUser({ id, body }).unwrap();
        message.success("Cập nhật DSR thành công");
      } else {
        await createSeller({
          ...body,
          code: generatedCode,
          companyName: readonlyCompanyName || undefined,
          password: values.password as string,
        }).unwrap();
        message.success("Thêm DSR thành công");
      }

      router.push("/distributor/team");
    } catch (error) {
      message.error(orderApiMessage(error, "Không thể lưu DSR"));
    }
  };

  return (
    <DistributorPageShell
      eyebrow="Đội bán hàng"
      title={isEdit ? "Sửa DSR" : "Thêm DSR"}
      description="Tạo hồ sơ DSR đầy đủ thông tin đăng nhập, liên hệ và dữ liệu xuất hóa đơn."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Quay lại
        </Button>
      }
    >
      <DistributorTableCard
        title={isEdit ? "Hồ sơ DSR" : "Hồ sơ DSR mới"}
        description="Mã DSR và công ty được đồng bộ theo nhà phân phối đang đăng nhập."
      >
        <section className="distributor-dsr-form-shell">
          <div
            className={`distributor-dsr-form-frame ${
              isLoading || loadingDistributor || (!isEdit && loadingSellers)
                ? "is-loading"
                : ""
            }`}
          >
            <Form<DsrFormValues>
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <section className="distributor-dsr-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-dsr-section-head"
                >
                  <div>
                    <Text className="distributor-dsr-section-title">
                      Thông tin tài khoản
                    </Text>
                    <Text className="distributor-dsr-section-desc">
                      Mã DSR tự sinh theo NPP, email và mật khẩu dùng để đăng nhập.
                    </Text>
                  </div>
                  <Tag color="blue" className="distributor-dsr-section-tag">
                    Bắt buộc
                  </Tag>
                </Flex>

                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Họ tên DSR"
                      name="fullName"
                      rules={[{ required: true, message: "Vui lòng nhập họ tên DSR" }]}
                    >
                      <Input
                        size="large"
                        prefix={<UserOutlined />}
                        placeholder="Nguyễn Văn A"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Mã DSR tự sinh">
                      <Input
                        size="large"
                        prefix={<IdcardOutlined />}
                        value={generatedCode}
                        disabled
                        placeholder="Tự sinh theo mã NPP"
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
                        placeholder="dsr@distributor.vn"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={isEdit ? "Mật khẩu mới" : "Mật khẩu"}
                      name="password"
                      rules={
                        isEdit
                          ? [{ min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }]
                          : [
                              { required: true, message: "Vui lòng nhập mật khẩu" },
                              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                            ]
                      }
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined />}
                        placeholder={
                          isEdit
                            ? "Bỏ trống nếu không đổi mật khẩu"
                            : "Tạo mật khẩu đăng nhập"
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className="distributor-dsr-form-section">
                <Flex
                  justify="space-between"
                  align="flex-start"
                  gap={14}
                  wrap="wrap"
                  className="distributor-dsr-section-head"
                >
                  <div>
                    <Text className="distributor-dsr-section-title">
                      Hồ sơ liên hệ
                    </Text>
                    <Text className="distributor-dsr-section-desc">
                      Công ty lấy theo NPP, địa chỉ dùng API tỉnh/phường như form admin.
                    </Text>
                  </div>
                </Flex>

                <Row gutter={[18, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Số điện thoại" name="phone">
                      <Input
                        size="large"
                        prefix={<PhoneOutlined />}
                        placeholder="0901 234 567"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Công ty theo NPP">
                      <Input
                        size="large"
                        prefix={<BankOutlined />}
                        value={readonlyCompanyName}
                        disabled
                        placeholder="Tự lấy theo nhà phân phối"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Mã số thuế" name="taxCode">
                      <Input
                        size="large"
                        prefix={<IdcardOutlined />}
                        placeholder="Nhập mã số thuế nếu có"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tỉnh/thành" name="provinceCode">
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
                        onChange={() => form.resetFields(["wardName"])}
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
                  {isEdit && user?.address ? (
                    <Col xs={24} md={12}>
                      <Form.Item label="Địa chỉ hiện tại">
                        <Input size="large" value={user.address} disabled />
                      </Form.Item>
                    </Col>
                  ) : null}
                </Row>
              </section>

              <Flex
                justify="space-between"
                align="center"
                gap={12}
                wrap="wrap"
                className="distributor-dsr-form-footer"
              >
                <Flex align="center" gap={10} className="distributor-dsr-form-note">
                  <UserOutlined />
                  <Text>{isEdit ? "Đang cập nhật hồ sơ" : "Tạo DSR mới"}</Text>
                </Flex>

                <Space wrap>
                  <Button
                    size="large"
                    onClick={() => router.push("/distributor/team")}
                    className="distributor-dsr-form-action"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={creating || updating}
                    className="distributor-dsr-form-action"
                  >
                    {isEdit ? "Cập nhật DSR" : "Thêm DSR"}
                  </Button>
                </Space>
              </Flex>
            </Form>
          </div>
        </section>
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-dsr-form-shell {
          margin-top: 18px;
        }

        .distributor-dsr-form-frame {
          min-height: 260px;
          padding: 20px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
        }

        .distributor-dsr-form-frame.is-loading {
          min-height: 180px;
          background: linear-gradient(90deg, #f8fffd 25%, #ecf8f5 37%, #f8fffd 63%);
          background-size: 400% 100%;
          animation: distributor-dsr-loading 1.2s ease infinite;
        }

        @keyframes distributor-dsr-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .distributor-dsr-form-section + .distributor-dsr-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-dsr-section-head {
          margin-bottom: 18px;
        }

        .distributor-dsr-section-title,
        .distributor-dsr-section-desc {
          display: block;
        }

        .distributor-dsr-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .distributor-dsr-section-desc {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .distributor-dsr-section-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .distributor-dsr-form-frame .ant-form-item-label > label {
          color: #24423d;
          font-weight: 800;
        }

        .distributor-dsr-form-frame .ant-input,
        .distributor-dsr-form-frame .ant-input-affix-wrapper,
        .distributor-dsr-form-frame .ant-select-selector {
          border-radius: 8px !important;
        }

        .distributor-dsr-form-frame .ant-input-affix-wrapper-focused,
        .distributor-dsr-form-frame .ant-input-affix-wrapper:focus,
        .distributor-dsr-form-frame .ant-select-focused .ant-select-selector {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12) !important;
        }

        .distributor-dsr-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-dsr-form-note {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
        }

        .distributor-dsr-form-note .anticon {
          color: #2563eb;
        }

        .distributor-dsr-form-note .ant-typography {
          color: #334155 !important;
          font-size: 12.5px;
          font-weight: 800;
        }

        .distributor-dsr-form-action {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        .distributor-content .distributor-dsr-form-action.ant-btn-primary,
        .distributor-content
          .distributor-dsr-form-action.ant-btn-primary:not(.ant-btn-dangerous) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content .distributor-dsr-form-action.ant-btn-primary:hover,
        .distributor-content
          .distributor-dsr-form-action.ant-btn-primary:not(.ant-btn-dangerous):hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2) !important;
        }

        @media (max-width: 767px) {
          .distributor-dsr-form-frame {
            padding: 14px;
          }

          .distributor-dsr-form-note,
          .distributor-dsr-form-action {
            width: 100%;
          }
        }
      `}</style>
    </DistributorPageShell>
  );
}
