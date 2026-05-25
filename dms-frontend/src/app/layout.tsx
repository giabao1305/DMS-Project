import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";

import StoreProvider from "@/store/provider";
import AuthProvider from "@/components/AuthProvider";
import AntdClientProvider from "@/components/providers/AntdClientProvider";

import "./globals.css";

const criticalLoginStyles = `
.login-page{min-height:100vh;padding:24px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#f8fbff 0%,#f1f8f6 100%)}
.login-shell{width:min(1120px,100%);min-height:660px;display:grid;grid-template-columns:1.05fr .95fr;overflow:hidden;border-radius:22px;border:1px solid #dcebea;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.12)}
.login-product-panel{position:relative;padding:32px;display:flex;flex-direction:column;gap:26px;overflow:hidden;background:linear-gradient(145deg,#08343b 0%,#0b4a45 55%,#102033 100%);color:#fff}
.login-form-panel{padding:46px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff 0%,#f8fcfb 100%)}
.login-form-card{width:min(390px,100%)}
.login-topbar,.login-preview-header,.login-section-title{display:flex;align-items:center;justify-content:space-between;gap:12px}
.login-brand,.login-live-pill{display:inline-flex;align-items:center;gap:10px;font-weight:850;text-decoration:none!important}
.login-brand{color:#fff;font-size:18px}
.login-brand-icon,.login-auth-icon{display:flex;align-items:center;justify-content:center}
.login-brand-icon{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.12);color:#99f6e4;font-size:18px}
.login-product-copy{position:relative;z-index:1;max-width:540px;margin-top:10px}
.login-product-copy span.ant-typography,.login-form-heading span.ant-typography{display:block;margin-bottom:12px;color:#99f6e4;font-size:12px;font-weight:900;text-transform:uppercase}
.login-product-copy h1.ant-typography{margin:0;color:#fff;font-size:40px;font-weight:950;line-height:1.08}
.login-preview-board{position:relative;z-index:1;margin-top:auto;padding:16px;border-radius:18px;background:rgba(255,255,255,.1);box-shadow:0 18px 42px rgba(2,6,23,.18)}
.login-metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.login-metric-card,.login-board-section,.login-route-card{border-radius:16px;background:rgba(255,255,255,.1)}
.login-metric-card{min-height:82px;padding:13px}
.login-form-heading{margin-bottom:26px}
.login-auth-icon{width:48px;height:48px;margin-bottom:16px;border-radius:14px;background:#e7f8f5;color:#0d9488;font-size:22px}
.login-form-heading h2.ant-typography{margin:0;color:#0b2f2a;font-size:32px;font-weight:950;line-height:1.1}
.login-form .ant-form-item{margin-bottom:16px}
.login-form .ant-input-affix-wrapper{height:48px;padding-inline:14px;border-color:#d7ebe7;border-radius:14px;background:#fff}
.login-submit-button.ant-btn{height:48px;margin-top:6px;display:inline-flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:14px;background:linear-gradient(135deg,#0d9488,#0f766e);font-weight:850;box-shadow:0 12px 24px rgba(13,148,136,.2)}
.login-security-note{margin-top:18px;padding:12px 14px;display:flex;align-items:center;gap:10px;border-radius:14px;background:#f3fbf9;color:#5d7471;font-size:13px;font-weight:700;line-height:1.45}
@media (max-width:960px){.login-page{padding:18px;align-items:flex-start}.login-shell{min-height:0;grid-template-columns:1fr}.login-product-panel{padding:28px}.login-product-copy h1.ant-typography{font-size:34px}.login-form-panel{padding:34px 28px}}
@media (max-width:560px){.login-page{padding:0;background:#fff}.login-shell{border:0;border-radius:0;box-shadow:none}.login-product-panel{padding:22px 20px;gap:20px}.login-live-pill,.login-preview-board{display:none}.login-product-copy h1.ant-typography{font-size:28px}.login-form-panel{padding:28px 20px 34px}}
`;

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Distribution Management System",
  description: "Distribution Management System",
  applicationName: "DMS",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      {
        url: "/favicon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1677ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={roboto.variable}>
      <head>
        <style
          id="critical-login-styles"
          dangerouslySetInnerHTML={{ __html: criticalLoginStyles }}
        />
      </head>
      <body>
        <AntdClientProvider>
          <StoreProvider>
            <AuthProvider>{children}</AuthProvider>
          </StoreProvider>
        </AntdClientProvider>
      </body>
    </html>
  );
}
