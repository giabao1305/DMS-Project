"use client";

import {
  ArrowLeftOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { App, Button, Card, Form, Input, Typography } from "antd";
import Link from "next/link";

import { useForgotPasswordMutation } from "@/features/auth/authService";
import type { ForgotPasswordRequest } from "@/features/auth/authTypes";

const { Text, Title } = Typography;

export default function ForgotPasswordPage() {
  const { message } = App.useApp();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (values: ForgotPasswordRequest) => {
    try {
      await forgotPassword(values).unwrap();
      message.success("Đã gửi hướng dẫn đặt lại mật khẩu");
    } catch {
      message.error("Không thể gửi yêu cầu đặt lại mật khẩu");
    }
  };

  return (
    <main className="auth-simple-page">
      <Card className="auth-simple-card" variant="borderless">
        <div className="auth-simple-icon">
          <SafetyCertificateOutlined />
        </div>

        <Title level={2}>Quên mật khẩu</Title>
        <Text>
          Nhập email tài khoản, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.
        </Text>

        <Form<ForgotPasswordRequest>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          className="auth-simple-form"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email chưa đúng định dạng" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="name@company.com"
              autoComplete="email"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Gửi hướng dẫn
          </Button>
        </Form>

        <Link href="/auth/login" className="auth-simple-back">
          <ArrowLeftOutlined />
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
