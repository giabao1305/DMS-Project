"use client";

import {
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App, Button, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLoginMutation } from "@/features/auth/authService";
import { setCredentials } from "@/features/auth/authSlice";
import type { LoginRequest } from "@/features/auth/authTypes";
import { getRoleHomePath } from "@/features/auth/roleUtils";
import { resetSocket } from "@/lib/socket";
import { useAppDispatch } from "@/store/hooks";
import { resetApiState } from "@/store/resetApiState";

const { Title, Text } = Typography;

const metrics = [
  { label: "Đơn hôm nay", value: "128", tone: "blue" },
  { label: "Doanh thu", value: "84.2M", tone: "green" },
  { label: "Tồn kho thấp", value: "12", tone: "amber" },
];

const pipeline = [
  { label: "Chờ xác nhận", value: "24", width: 42 },
  { label: "Đã giao", value: "76", width: 74 },
  { label: "Trả hàng", value: "05", width: 22 },
];

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (values: LoginRequest) => {
    try {
      const response = await login(values).unwrap();

      resetApiState(dispatch);
      resetSocket();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      );

      message.success("Đăng nhập thành công");

      router.push(getRoleHomePath(response.user.role));
    } catch {
      message.error("Email hoặc mật khẩu không đúng");
    }
  };

  return (
    <div className="login-page">
      <main className="login-shell">
        <section className="login-product-panel" aria-label="DMS preview">
          <div className="login-topbar">
            <div className="login-brand">
              <span className="login-brand-icon">
                <ShopOutlined />
              </span>
              <span>DMS</span>
            </div>
            <span className="login-live-pill">
              <CheckCircleOutlined />
              Live operations
            </span>
          </div>

          <div className="login-product-copy">
            <Text>Distribution Management System</Text>
            <Title level={1}>
              Kiểm soát bán hàng, tồn kho và tuyến thị trường
            </Title>
          </div>

          <div className="login-preview-board">
            <div className="login-preview-header">
              <div>
                <span>Dashboard</span>
                <strong>Hiệu suất hôm nay</strong>
              </div>
              <BarChartOutlined />
            </div>

            <div className="login-metric-grid">
              {metrics.map((item) => (
                <div
                  className={`login-metric-card is-${item.tone}`}
                  key={item.label}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="login-board-section">
              <div className="login-section-title">
                <span>Luồng đơn hàng</span>
                <strong>105 đơn</strong>
              </div>
              <div className="login-pipeline-list">
                {pipeline.map((item) => (
                  <div className="login-pipeline-row" key={item.label}>
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="login-pipeline-track">
                      <span style={{ width: `${item.width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="login-route-card">
              <div className="login-route-marker">7</div>
              <div>
                <strong>Tuyến bán hàng đang chạy</strong>
                <span>12 seller hoạt động, 48 điểm ghé thăm</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-panel" aria-label="Đăng nhập">
          <div className="login-form-card">
            <div className="login-form-heading">
              <span className="login-auth-icon">
                <SafetyCertificateOutlined />
              </span>
              <Text>Secure access</Text>
              <Title level={2}>Đăng nhập</Title>
            </div>

            <Form
              layout="vertical"
              className="login-form"
              requiredMark={false}
              onFinish={handleSubmit}
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
                  prefix={<UserOutlined />}
                  placeholder="Nhập email tài khoản"
                  size="large"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div className="login-forgot-row">
                <Link href="/auth/forgot-password">Quên mật khẩu?</Link>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isLoading}
                className="login-submit-button"
              >
                <span>Tiếp tục</span>
                <ArrowRightOutlined />
              </Button>
            </Form>

            <div className="login-security-note">
              <CheckCircleOutlined />
              <span>
                Tài khoản được phân quyền theo vai trò admin, nhà phân phối và DSR.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
