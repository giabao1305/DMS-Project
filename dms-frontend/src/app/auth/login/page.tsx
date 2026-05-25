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
                  placeholder="admin@gmail.com"
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

      <style jsx global>{`
        .login-page {
          min-height: 100vh;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #f8fbff 0%, #f1f8f6 100%);
        }

        .login-shell {
          width: min(1120px, 100%);
          min-height: 660px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid #dcebea;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
          animation: login-shell-enter 720ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .login-product-panel {
          position: relative;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 26px;
          overflow: hidden;
          background: linear-gradient(
            145deg,
            #08343b 0%,
            #0b4a45 55%,
            #102033 100%
          );
          color: #ffffff;
          animation: login-slice-left 760ms cubic-bezier(0.22, 1, 0.36, 1)
            80ms both;
        }

        .login-topbar {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .login-brand,
        .login-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 850;
          text-decoration: none !important;
        }

        .login-brand {
          color: #ffffff;
          font-size: 18px;
        }

        .login-brand *,
        .login-brand a,
        .login-brand span {
          text-decoration: none !important;
          border-bottom: 0 !important;
        }

        .login-brand-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.12);
          color: #99f6e4;
          font-size: 18px;
        }

        .login-live-pill {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(236, 253, 245, 0.9);
          font-size: 12px;
        }

        .login-product-copy {
          position: relative;
          z-index: 1;
          max-width: 540px;
          margin-top: 10px;
        }

        .login-product-copy span.ant-typography {
          display: block;
          margin-bottom: 12px;
          color: #99f6e4;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .login-product-copy h1.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 40px;
          font-weight: 950;
          line-height: 1.08;
        }

        .login-preview-board {
          position: relative;
          z-index: 1;
          margin-top: auto;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.18);
          animation: login-preview-float 820ms cubic-bezier(0.22, 1, 0.36, 1)
            260ms both;
        }

        .login-preview-header,
        .login-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .login-preview-header {
          margin-bottom: 12px;
        }

        .login-preview-header span,
        .login-section-title span,
        .login-metric-card span,
        .login-pipeline-row span,
        .login-route-card span {
          color: rgba(236, 253, 245, 0.7);
          font-size: 12px;
          font-weight: 700;
        }

        .login-preview-header strong,
        .login-section-title strong,
        .login-route-card strong {
          display: block;
          color: #ffffff;
          font-size: 14px;
          font-weight: 850;
        }

        .login-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .login-metric-card {
          min-height: 82px;
          padding: 13px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.1);
          transition:
            transform 160ms ease,
            background 160ms ease;
        }

        .login-metric-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.14);
        }

        .login-metric-card strong {
          display: block;
          margin-top: 10px;
          color: #ffffff;
          font-size: 23px;
          font-weight: 900;
          line-height: 1;
        }

        .login-metric-card.is-blue strong {
          color: #bfdbfe;
        }

        .login-metric-card.is-green strong {
          color: #99f6e4;
        }

        .login-metric-card.is-amber strong {
          color: #fde68a;
        }

        .login-board-section {
          margin-top: 12px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(2, 6, 23, 0.14);
        }

        .login-pipeline-list {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .login-pipeline-row {
          display: grid;
          grid-template-columns: 116px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
        }

        .login-pipeline-row div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .login-pipeline-row strong {
          color: #ffffff;
          font-size: 12px;
          font-weight: 850;
        }

        .login-pipeline-track {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
        }

        .login-pipeline-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2dd4bf, #60a5fa);
          transform-origin: left;
          animation: login-track-grow 1.35s cubic-bezier(0.22, 1, 0.36, 1)
            520ms both;
        }

        .login-route-card {
          margin-top: 12px;
          padding: 13px;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          border-radius: 16px;
          background: rgba(20, 184, 166, 0.12);
        }

        .login-route-marker {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #ccfbf1;
          color: #0f766e;
          font-size: 17px;
          font-weight: 900;
        }

        .login-form-panel {
          padding: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #ffffff 0%, #f8fcfb 100%);
          animation: login-slice-right 760ms cubic-bezier(0.22, 1, 0.36, 1)
            160ms both;
        }

        .login-form-card {
          width: min(390px, 100%);
        }

        .login-form-heading {
          margin-bottom: 26px;
        }

        .login-auth-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #e7f8f5;
          color: #0d9488;
          font-size: 22px;
        }

        .login-form-heading span.ant-typography {
          display: block;
          margin-bottom: 6px;
          color: #0d9488;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .login-form-heading h2.ant-typography {
          margin: 0;
          color: #0b2f2a;
          font-size: 32px;
          font-weight: 950;
          line-height: 1.1;
        }

        .login-form .ant-form-item {
          margin-bottom: 16px;
        }

        .login-forgot-row {
          margin: -6px 0 14px;
          display: flex;
          justify-content: flex-end;
        }

        .login-forgot-row a {
          color: #0d9488;
          font-size: 13px;
          font-weight: 800;
        }

        .login-form .ant-form-item-label {
          padding-bottom: 7px;
        }

        .login-form .ant-form-item-label > label {
          color: #173f3a;
          font-size: 13px;
          font-weight: 800;
        }

        .login-form .ant-input-affix-wrapper {
          height: 48px;
          padding-inline: 14px;
          border-color: #d7ebe7;
          border-radius: 14px;
          background: #ffffff;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .login-form .ant-input-affix-wrapper:hover,
        .login-form .ant-input-affix-wrapper-focused {
          border-color: #0d9488 !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .login-form .ant-input-prefix {
          margin-inline-end: 10px;
          color: #0d9488;
          font-size: 16px;
        }

        .login-form .ant-input,
        .login-form .ant-input-password input {
          color: #0b2f2a;
          font-size: 14px;
          font-weight: 650;
        }

        .login-form .ant-input::placeholder,
        .login-form .ant-input-password input::placeholder {
          color: #8aa5a1;
          font-weight: 600;
        }

        .login-submit-button.ant-btn {
          height: 48px;
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #0d9488, #0f766e);
          font-weight: 850;
          box-shadow: 0 12px 24px rgba(13, 148, 136, 0.2);
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .login-submit-button.ant-btn:hover {
          background: linear-gradient(135deg, #0f766e, #115e59) !important;
          box-shadow: 0 16px 30px rgba(13, 148, 136, 0.26);
          transform: translateY(-1px);
        }

        .login-security-note {
          margin-top: 18px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 14px;
          background: #f3fbf9;
          color: #5d7471;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.45;
        }

        .login-security-note .anticon {
          color: #0d9488;
          font-size: 16px;
        }

        @keyframes login-shell-enter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes login-slice-left {
          from {
            opacity: 0;
            clip-path: inset(0 100% 0 0);
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            clip-path: inset(0 0 0 0);
            transform: translateX(0);
          }
        }

        @keyframes login-slice-right {
          from {
            opacity: 0;
            clip-path: inset(0 0 0 100%);
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            clip-path: inset(0 0 0 0);
            transform: translateX(0);
          }
        }

        @keyframes login-preview-float {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes login-track-grow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @media (max-width: 960px) {
          .login-page {
            padding: 18px;
            align-items: flex-start;
          }

          .login-shell {
            min-height: 0;
            grid-template-columns: 1fr;
          }

          .login-product-panel {
            padding: 28px;
          }

          .login-product-copy h1.ant-typography {
            font-size: 34px;
          }

          .login-form-panel {
            padding: 34px 28px;
          }
        }

        @media (max-width: 560px) {
          .login-page {
            padding: 0;
            background: #ffffff;
          }

          .login-shell {
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .login-product-panel {
            padding: 22px 20px;
            gap: 20px;
          }

          .login-live-pill,
          .login-preview-board {
            display: none;
          }

          .login-product-copy {
            margin-top: 0;
          }

          .login-product-copy h1.ant-typography {
            font-size: 28px;
          }

          .login-form-panel {
            padding: 28px 20px 34px;
          }

          .login-form-heading h2.ant-typography {
            font-size: 30px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-shell,
          .login-product-panel,
          .login-form-panel,
          .login-preview-board,
          .login-pipeline-track span {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            clip-path: none !important;
          }
        }
      `}</style>
    </div>
  );
}
