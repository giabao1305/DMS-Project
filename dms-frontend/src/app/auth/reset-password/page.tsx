"use client";

import { LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { App, Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useResetPasswordMutation } from "@/features/auth/authService";

const { Text, Title } = Typography;

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const token = searchParams.get("token") || "";

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      message.error("Liên kết đặt lại mật khẩu không hợp lệ");
      return;
    }

    try {
      await resetPassword({
        token,
        password: values.password,
      }).unwrap();
      message.success("Đặt lại mật khẩu thành công");
      router.push("/auth/login");
    } catch {
      message.error("Không thể đặt lại mật khẩu");
    }
  };

  return (
    <main className="auth-simple-page">
      <Card className="auth-simple-card" variant="borderless">
        <div className="auth-simple-icon">
          <SafetyCertificateOutlined />
        </div>

        <Title level={2}>Đặt lại mật khẩu</Title>
        <Text>Tạo mật khẩu mới cho tài khoản của bạn.</Text>

        <Form<ResetPasswordFormValues>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          className="auth-simple-form"
        >
          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Đặt lại mật khẩu
          </Button>
        </Form>

        <Link href="/auth/login" className="auth-simple-back">
          Quay lại đăng nhập
        </Link>
      </Card>

      <style jsx global>{`
        .auth-simple-page {
          min-height: 100vh;
          padding: 24px;
          display: grid;
          place-items: center;
          background: #f3fbf9;
        }

        .auth-simple-card {
          width: min(440px, 100%);
          border: 1px solid #d7ebe7 !important;
          border-radius: 16px !important;
          box-shadow: 0 18px 46px rgba(11, 47, 42, 0.09);
        }

        .auth-simple-card .ant-card-body {
          padding: 30px;
        }

        .auth-simple-icon {
          width: 52px;
          height: 52px;
          margin-bottom: 18px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #0d9488;
          font-size: 24px;
          background: #e7f8f5;
        }

        .auth-simple-card h2.ant-typography {
          margin: 0 0 8px;
          color: #0b2f2a;
          font-weight: 900;
        }

        .auth-simple-card span.ant-typography {
          color: #5d7471;
          line-height: 1.55;
        }

        .auth-simple-form {
          margin-top: 24px;
        }

        .auth-simple-form .ant-btn {
          height: 44px;
          border-radius: 10px;
          font-weight: 800;
          background: #0d9488;
          border-color: #0d9488;
        }

        .auth-simple-back {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0d9488;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
