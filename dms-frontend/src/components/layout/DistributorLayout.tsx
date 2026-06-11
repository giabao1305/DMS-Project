"use client";

import {
  AimOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Layout,
  Menu,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useLogoutSessionMutation } from "@/features/auth/authService";
import { logout } from "@/features/auth/authSlice";
import { useGetUnreadCountQuery } from "@/features/notifications/notificationService";
import { useSocketStatus } from "@/hooks/useSocketStatus";
import { resetSocket } from "@/lib/socket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetApiState } from "@/store/resetApiState";

const { Header, Sider, Content } = Layout;

const distributorRoutes = [
  "/distributor/dashboard",
  "/distributor/team",
  "/distributor/customers",
  "/distributor/orders",
  "/distributor/warehouse",
  "/distributor/routes",
  "/distributor/visits",
  "/distributor/leaves",
  "/distributor/kpis",
  "/distributor/notifications",
  "/distributor/profile",
];

const distributorRouteTitles: Record<string, string> = {
  "/distributor/dashboard": "Tổng quan đội",
  "/distributor/team": "Đội DSR",
  "/distributor/customers": "Khách hàng đội",
  "/distributor/orders": "Đơn",
  "/distributor/warehouse": "Kho của tôi",
  "/distributor/routes": "Tuyến đội",
  "/distributor/visits": "Ghé thăm",
  "/distributor/leaves": "Nghỉ phép",
  "/distributor/kpis": "KPI đội",
  "/distributor/notifications": "Thông báo",
  "/distributor/profile": "Tài khoản",
};

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSocketConnected = useSocketStatus();
  const [logoutSession] = useLogoutSessionMutation();
  const [collapsed, setCollapsed] = useState(false);
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "/distributor/dashboard",
        icon: <DashboardOutlined />,
        label: "Tổng quan đội",
      },
      {
        key: "/distributor/team",
        icon: <TeamOutlined />,
        label: "Đội DSR",
      },
      {
        key: "/distributor/customers",
        icon: <TeamOutlined />,
        label: "Khách hàng đội",
      },
      {
        key: "/distributor/orders",
        icon: <ShoppingCartOutlined />,
        label: "Đơn",
      },
      {
        key: "/distributor/warehouse",
        icon: <ShopOutlined />,
        label: "Kho của tôi",
      },
      {
        key: "/distributor/routes",
        icon: <EnvironmentOutlined />,
        label: "Tuyến đội",
      },
      {
        key: "/distributor/visits",
        icon: <AimOutlined />,
        label: "Ghé thăm",
      },
      {
        key: "/distributor/leaves",
        icon: <CalendarOutlined />,
        label: "Nghỉ phép",
      },
      {
        key: "/distributor/kpis",
        icon: <LineChartOutlined />,
        label: "KPI đội",
      },
      {
        key: "/distributor/notifications",
        icon: <BellOutlined />,
        label: "Thông báo",
      },
      {
        key: "/distributor/profile",
        icon: <UserOutlined />,
        label: "Tài khoản",
      },
    ],
    [],
  );

  const selectedKey =
    [...distributorRoutes]
      .sort((a, b) => b.length - a.length)
      .find(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ) ?? "/distributor/dashboard";
  const selectedTitle = distributorRouteTitles[selectedKey] ?? "Bảng điều hành";

  const handleLogout = async () => {
    try {
      await logoutSession().unwrap();
    } catch {
      // Local logout still clears the session when the server token is gone.
    }

    resetApiState(dispatch);
    resetSocket();
    dispatch(logout());
    router.replace("/auth/login");
  };

  return (
    <Layout className="distributor-shell">
      <Sider
        width={284}
        collapsedWidth={88}
        collapsed={collapsed}
        trigger={null}
        className="distributor-sider"
      >
        <div className="distributor-sidebar-inner">
          <div
            className={`distributor-brand ${
              collapsed ? "distributor-brand-collapsed" : ""
            }`}
          >
            <div className="distributor-brand-mark">
              <ShopOutlined />
            </div>

            {!collapsed && (
              <div className="distributor-brand-copy">
                <div className="distributor-brand-title">Bảng điều phối NPP</div>
                <div className="distributor-brand-subtitle">
                  Điều phối kho, đội DSR và điểm bán
                </div>
              </div>
            )}

            <Tooltip title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}>
              <button
                type="button"
                className="distributor-collapse-button"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </Tooltip>
          </div>

          {!collapsed && (
            <div className="distributor-team-card">
              <TeamOutlined />
              <div>
                <span>Khu vực làm việc</span>
                <strong>
                  {currentUser?.fullName || currentUser?.email || "Nhà phân phối"}
                </strong>
              </div>
            </div>
          )}

          <div className="distributor-menu-scroll">
            <Menu
              mode="inline"
              theme="dark"
              inlineCollapsed={collapsed}
              selectedKeys={[selectedKey]}
              items={menuItems}
              className="distributor-menu"
              onClick={(item) => router.push(item.key)}
            />
          </div>
        </div>
      </Sider>

      <Layout className="distributor-main">
        <Header className="distributor-header">
          <div className="distributor-header-copy">
            <Typography.Text className="distributor-header-eyebrow">
              Vận hành nhà phân phối
            </Typography.Text>
            <Typography.Title level={4} className="distributor-header-title">
              {selectedTitle}
            </Typography.Title>
          </div>

          <div className="distributor-header-actions">
            <div className="distributor-ops-chip">
              <ShopOutlined />
              <span>Kho NPP</span>
            </div>
            <div className="distributor-ops-chip distributor-ops-chip-accent">
              <TeamOutlined />
              <span>Đội DSR</span>
            </div>
            <Tag
              color={isSocketConnected ? "success" : "error"}
              className="distributor-realtime-tag"
            >
              {isSocketConnected ? "Đang kết nối" : "Mất kết nối"}
            </Tag>
            <Button
              className="distributor-notification-button"
              icon={
                <Badge dot={unreadCount > 0} offset={[2, 0]}>
                  <BellOutlined />
                </Badge>
              }
              onClick={() => router.push("/distributor/notifications")}
            />
            <div className="distributor-user-chip">
              <Avatar icon={<UserOutlined />} />
              <span>{currentUser?.fullName || "Nhà phân phối"}</span>
            </div>
            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="distributor-logout-button"
            >
              Đăng xuất
            </Button>
          </div>
        </Header>

        <Content className="distributor-content">
          <div key={pathname} className="distributor-content-frame">
            {children}
          </div>
        </Content>
      </Layout>

      <style jsx global>{`
        .distributor-shell {
          min-height: 100vh;
          background: #eff6ff;
        }

        .distributor-sider {
          background: #0f1f3d !important;
          border-right: 1px solid rgba(59, 130, 246, 0.18);
          box-shadow: 14px 0 34px rgba(7, 23, 31, 0.2);
        }

        .distributor-sidebar-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0f1f3d;
        }

        .distributor-brand {
          min-height: 92px;
          margin: 0 0 12px;
          padding: 18px 14px;
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr) 36px;
          gap: 12px;
          align-items: center;
          border: 0;
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 0;
          background: #102a56;
          box-shadow: none;
        }

        .distributor-brand-collapsed {
          min-height: 126px;
          margin-inline: 0;
          padding: 16px 8px;
          grid-template-columns: 1fr;
          justify-items: center;
          row-gap: 12px;
        }

        .distributor-brand-mark {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 0;
          background: #3b82f6;
          color: #ffffff;
          font-size: 21px;
        }

        .distributor-brand-title {
          color: #ffffff;
          font-size: 17px;
          font-weight: 800;
        }

        .distributor-brand-subtitle {
          color: #bfdbfe;
          font-size: 12.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .distributor-collapse-button {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(59, 130, 246, 0.24);
          border-radius: 0;
          background: #173a6a;
          color: #eff6ff;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition:
            background 170ms ease,
            border-color 170ms ease,
            color 170ms ease,
            transform 170ms ease;
        }

        .distributor-collapse-button:hover {
          color: #ffffff;
          border-color: #3b82f6;
          background: #1e40af;
          transform: none;
        }

        .distributor-team-card {
          margin: 0 14px 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 0;
          background: #122b52;
          color: #eff6ff;
        }

        .distributor-team-card span,
        .distributor-team-card strong {
          display: block;
          line-height: 1.3;
        }

        .distributor-team-card span {
          color: #93c5fd;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .distributor-menu-scroll {
          flex: 1;
          min-height: 0;
          padding: 4px 12px 16px;
          overflow-y: auto;
        }

        .distributor-sider.ant-layout-sider-collapsed .distributor-menu-scroll {
          padding-inline: 10px;
        }

        .distributor-menu.ant-menu {
          background: transparent;
          border-inline-end: none;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item {
          margin-block: 5px;
          margin-inline: 0;
          padding-inline: 15px !important;
          height: 44px;
          border-radius: 12px;
          color: #bfdbfe;
          font-weight: 700;
          transition:
            background 180ms ease,
            color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item::after {
          display: none;
        }

        .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover {
          color: #ffffff !important;
          background: #173a6a !important;
          transform: none;
          box-shadow: inset 3px 0 0 #3b82f6;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item-selected {
          background: #2563eb !important;
          box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.72);
        }

        .distributor-menu.ant-menu-inline-collapsed.ant-menu-dark
          .ant-menu-item {
          width: 48px;
          height: 44px;
          margin-inline: auto;
          padding-inline: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .distributor-menu.ant-menu-inline-collapsed.ant-menu-dark
          .ant-menu-item
          .ant-menu-item-icon {
          width: 100%;
          min-width: 0;
          height: 100%;
          margin-inline-end: 0 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
        }

        .distributor-menu.ant-menu-inline-collapsed.ant-menu-dark
          .ant-menu-title-content {
          display: none;
          margin: 0 !important;
        }

        .distributor-main {
          background: #eff6ff;
        }

        .distributor-header {
          height: 62px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #ffffff;
          border-bottom: 1px solid #dbeafe;
        }

        .distributor-header-eyebrow {
          display: block;
          color: #2563eb;
          font-size: 11.5px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .distributor-header-title.ant-typography {
          margin: 2px 0 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 850;
        }

        .distributor-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .distributor-user-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 800;
        }

        .distributor-content {
          height: calc(100vh - 86px);
          margin: 10px 12px 12px;
          padding: 16px;
          overflow-y: auto;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          background: #f8fbff;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }

        .distributor-content-frame {
          min-width: 0;
          animation: none;
        }

        .distributor-content .ant-progress-bg {
          background: #2563eb !important;
        }

        .distributor-content .ant-progress-inner {
          background: #dbeafe !important;
        }

        .distributor-content .ant-empty {
          margin: 24px 0;
        }

        .distributor-content .ant-empty-description {
          color: #64748b !important;
          font-size: 14px;
          font-weight: 600;
        }

        .distributor-content .ant-empty-image {
          opacity: 1;
          pointer-events: none;
          transform: none !important;
        }

        .distributor-content .ant-empty-image svg,
        .distributor-content .ant-empty-image * {
          pointer-events: none;
          transform: none !important;
        }

        .distributor-content .ant-empty-img-default-ellipse {
          fill: #eff6ff !important;
          fill-opacity: 1 !important;
        }

        .distributor-content .ant-empty-img-default-path-1,
        .distributor-content .ant-empty-img-default-path-2,
        .distributor-content .ant-empty-img-default-path-3,
        .distributor-content .ant-empty-img-default-path-4,
        .distributor-content .ant-empty-img-default-path-5 {
          fill: #bfdbfe !important;
        }

        .distributor-content
          :is(
            .ant-card,
            .ant-table-wrapper,
            [class*="-card"],
            [class*="-panel"],
            [class*="-table"],
            [class*="-hero"]
          ) {
          backface-visibility: hidden;
        }

        .distributor-content
          :is(
            .ant-card,
            .ant-table-wrapper,
            [class*="-card"],
            [class*="-panel"],
            [class*="-table"]
          ) {
          contain: layout paint;
        }

        .distributor-content
          :is(.ant-card, [class*="-card"], [class*="-panel"]) {
          transition: none !important;
          transform: none !important;
        }

        .distributor-content [class*="-hero"] {
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.045) !important;
          contain: paint;
        }

        .distributor-content .ant-table-tbody > tr > td {
          transition: background-color 140ms ease;
        }

        .distributor-content .ant-table-tbody > tr:hover > td,
        .distributor-content .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #f8fbff !important;
        }

        .distributor-content .ant-table-tbody > tr.ant-table-placeholder > td,
        .distributor-content .ant-table-tbody > tr.ant-table-placeholder:hover > td,
        .distributor-content .ant-table-placeholder:hover > td {
          background: #ffffff !important;
        }

        .distributor-content .ant-table-placeholder .ant-empty,
        .distributor-content .ant-table-placeholder .ant-empty-image,
        .distributor-content .ant-table-placeholder .ant-empty-image svg {
          pointer-events: none;
          transform: none !important;
        }

        .distributor-content .seller-breadcrumb-shell,
        .distributor-content .seller-page-header-card {
          border-color: #dbeafe !important;
          background: #ffffff !important;
          box-shadow: 0 14px 30px rgba(29, 78, 216, 0.06) !important;
        }

        .distributor-content .seller-page-header-card .ant-typography,
        .distributor-content .seller-breadcrumb-current {
          color: #0f172a !important;
        }

        .distributor-content .seller-page-header-card .ant-typography-secondary,
        .distributor-content .seller-breadcrumb-link,
        .distributor-content .seller-breadcrumb-home {
          color: #64748b !important;
        }

        .distributor-content .seller-breadcrumb-link:hover,
        .distributor-content .seller-breadcrumb-home:hover,
        .distributor-content .seller-breadcrumb-action,
        .distributor-content .seller-breadcrumb-home .anticon {
          color: #2563eb !important;
        }

        .distributor-content .seller-breadcrumb-separator {
          color: #bfdbfe !important;
        }

        .distributor-content
          .seller-page-header-extra
          .ant-btn:not(.ant-btn-primary):not(.ant-btn-danger) {
          border-color: #dbeafe !important;
          background: #eff6ff !important;
          color: #0f172a !important;
        }

        .distributor-content
          .seller-page-header-extra
          .ant-btn:not(.ant-btn-primary):not(.ant-btn-danger):hover {
          border-color: #2563eb !important;
          background: #eff6ff !important;
          color: #2563eb !important;
        }

        .distributor-content .account-settings-shell {
          --account-primary: #2563eb;
          --account-primary-hover: #1d4ed8;
          --account-primary-soft: #eff6ff;
          --account-border: #dbeafe;
          --account-surface: #f8fbff;
          --account-text: #0f172a;
          --account-muted: #64748b;
        }

        .distributor-content .account-settings-panel {
          border-color: #dbeafe !important;
          background: #f8fbff !important;
        }

        .distributor-content .account-settings-card .ant-tabs-tab:hover,
        .distributor-content .account-settings-card .ant-tabs-tab:hover .ant-tabs-tab-btn,
        .distributor-content
          .account-settings-card
          .ant-tabs-tab.ant-tabs-tab-active
          .ant-tabs-tab-btn {
          color: #2563eb !important;
        }

        .distributor-content .account-settings-card .ant-tabs-ink-bar {
          background: #2563eb !important;
        }

        .distributor-content .account-settings-card .ant-input:hover,
        .distributor-content .account-settings-card .ant-input:focus,
        .distributor-content .account-settings-card .ant-input-affix-wrapper:hover,
        .distributor-content
          .account-settings-card
          .ant-input-affix-wrapper-focused,
        .distributor-content
          .account-settings-card
          .ant-input-textarea-affix-wrapper:hover,
        .distributor-content
          .account-settings-card
          .ant-input-textarea-affix-wrapper-focused {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }

        .distributor-content .account-settings-card .ant-btn-primary {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
        }

        .distributor-content .account-settings-card .ant-btn-primary:hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }

        .distributor-content .ant-card-head {
          min-height: 50px;
          padding-inline: 16px;
        }

        .distributor-content .ant-card-head-title {
          padding-block: 10px;
          font-size: 14px;
          font-weight: 800;
        }

        .distributor-content .ant-card-extra {
          padding-block: 8px;
        }

        .distributor-content .ant-card-body {
          padding: 14px;
        }

        @keyframes distributor-page-enter {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .distributor-page-stack {
          position: relative;
          min-width: 0;
        }

        .distributor-page-stack > * {
          position: relative;
          z-index: 1;
        }

        .distributor-stat-card.ant-card {
          min-height: 94px;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.05);
        }

        .distributor-stat-card .ant-card-body {
          padding: 12px;
        }

        .distributor-stat-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 19px;
        }

        .distributor-stat-card .ant-statistic-title {
          margin-bottom: 2px;
          color: #475569;
          font-size: 12.5px;
          font-weight: 850;
        }

        .distributor-stat-card .ant-statistic-content {
          color: #0f172a;
          font-size: 20px;
          font-weight: 900;
        }

        .distributor-stat-description {
          display: block;
          margin-top: 10px;
          color: #6b827f;
          font-size: 12px;
          font-weight: 650;
        }

        .distributor-metric-card,
        .distributor-panel-card {
          border: 1px solid #dbeafe;
          border-radius: 16px;
          box-shadow: 0 16px 34px rgba(37, 99, 235, 0.06);
        }

        .distributor-metric-card.ant-card,
        .distributor-panel-card.ant-card {
          background: #ffffff;
        }

        .distributor-metric-card .ant-statistic-title {
          color: #475569;
          font-weight: 800;
        }

        .distributor-metric-card .ant-statistic-content {
          color: #0f172a;
          font-weight: 900;
        }

        .distributor-panel-card .ant-card-head {
          min-height: 50px;
          padding: 0 16px;
          border-bottom: 1px solid #dbeafe;
          background: #f8fbff;
        }

        .distributor-panel-card .ant-card-head-title {
          color: #0f172a;
          font-weight: 850;
        }

        .distributor-table-card .ant-card-head {
          min-height: 50px;
          padding-inline: 16px;
        }

        .distributor-table-card .ant-card-body {
          padding: 14px;
        }

        .distributor-table-card-title {
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
        }

        .distributor-table-card-description {
          display: block;
          margin-bottom: 12px;
          color: #475569;
          font-size: 12px;
          line-height: 1.5;
        }

        .distributor-panel-card .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 14px;
        }

        .distributor-panel-card .ant-table-thead > tr > th {
          background: #f8fbff !important;
          color: #0f172a !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid #dbeafe !important;
        }

        .distributor-panel-card .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #eaf2ff !important;
        }

        .distributor-panel-card .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .distributor-insight-card .anticon {
          color: #2563eb;
          font-size: 20px;
        }

        .distributor-insight-card h2.ant-typography {
          color: #0f172a;
          font-weight: 900;
          letter-spacing: 0;
        }

        .distributor-table-card .ant-list-item {
          padding-inline: 18px;
          transition: background 160ms ease;
        }

        .distributor-table-card .ant-list-item:hover {
          background: #f8fbff;
        }

        .distributor-notification-read {
          opacity: 0.72;
          background: #ffffff;
        }

        .distributor-command-card {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(37, 99, 235, 0.07);
        }

        .distributor-command-dark {
          min-height: 196px;
          height: 100%;
          padding: 18px;
          display: flex;
          flex-direction: column;
          background: #0f1f3d;
        }

        .distributor-command-eyebrow {
          color: #bfdbfe !important;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .distributor-command-title {
          margin-top: 7px;
          color: #ffffff;
          font-size: 20px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .distributor-command-description {
          display: block;
          max-width: 440px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78) !important;
          font-size: 13px;
          line-height: 1.6;
        }

        .distributor-command-meter {
          margin-top: auto;
          padding: 10px 12px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 14px;
          background: #102a56;
        }

        .distributor-command-meter span {
          display: block;
          color: #ffffff;
          font-size: 20px;
          font-weight: 850;
          line-height: 1.15;
        }

        .distributor-command-meter label {
          display: block;
          margin-top: 5px;
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .distributor-command-summary {
          min-height: 196px;
          height: 100%;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
          background: #ffffff;
        }

        .distributor-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .distributor-command-stat {
          min-width: 118px;
          flex: 1 1 118px;
          padding: 10px 12px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: #f8fbff;
        }

        .distributor-command-stat span {
          display: block;
          color: #0f172a;
          font-size: 20px;
          font-weight: 850;
          line-height: 1.1;
        }

        .distributor-command-stat label {
          display: block;
          margin-top: 5px;
          color: #475569;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .distributor-command-progress {
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: #ffffff;
        }

        .distributor-command-progress-label {
          color: #0f172a !important;
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .distributor-command-progress-value {
          color: #475569 !important;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .distributor-command-feature {
          min-height: 124px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: #f8fbff;
        }

        .distributor-command-feature-label {
          color: #1d4ed8 !important;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .distributor-command-feature-title {
          display: block;
          color: #0f172a !important;
          font-size: 15px;
          font-weight: 850;
          line-height: 1.25;
        }

        .distributor-command-feature-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .distributor-command-feature-meta span {
          padding: 5px 9px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
        }

        .distributor-command-feature-empty {
          color: #475569 !important;
          font-size: 13px;
          line-height: 1.5;
        }

        .distributor-command-status-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .distributor-command-status-grid > div {
          min-height: 62px;
          padding: 9px;
          display: grid;
          gap: 4px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: #f8fbff;
        }

        .distributor-command-status-grid .anticon {
          color: #2563eb;
          font-size: 17px;
        }

        .distributor-command-status-grid span {
          color: #475569;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .distributor-command-status-grid strong {
          color: #0f172a;
          font-size: 17px;
          font-weight: 850;
          line-height: 1.1;
        }

        .distributor-table-mark {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 17px;
        }

        .distributor-row-strong {
          color: #0f172a !important;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-row-muted {
          color: #475569 !important;
          font-size: 14px;
          line-height: 1.5;
        }

        .distributor-pill-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
          text-align: center;
        }

        .distributor-row-action.ant-btn {
          height: 34px;
          border-color: var(--row-action-color, #2563eb);
          border-radius: 10px;
          background: var(--row-action-color, #2563eb);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 8px 18px var(--row-action-shadow, rgba(37, 99, 235, 0.16));
        }

        .distributor-row-action.ant-btn:hover {
          border-color: var(--row-action-hover, #1d4ed8) !important;
          color: #ffffff !important;
          background: var(--row-action-hover, #1d4ed8) !important;
        }

        .distributor-profile-card {
          padding: 0;
        }

        .distributor-shell {
          background: #f8fbff;
        }

        .distributor-sider {
          background: #f8fbff !important;
          border-right: 1px solid #dbeafe;
          box-shadow: 16px 0 36px rgba(15, 23, 42, 0.08);
        }

        .distributor-sidebar-inner {
          background: #ffffff;
        }

        .distributor-brand {
          border: 1px solid #d9e5ef;
          border-radius: 20px;
          background: #1d4ed8;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.16);
        }

        .distributor-brand::after {
          content: "";
          width: 64px;
          height: 2px;
          position: absolute;
          left: 74px;
          bottom: 14px;
          border-radius: 999px;
          background: #93c5fd;
        }

        .distributor-brand {
          position: relative;
          overflow: hidden;
        }

        .distributor-brand-mark {
          border-radius: 16px;
          background: #93c5fd;
          color: #0b1f44;
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.28);
        }

        .distributor-brand-subtitle {
          color: rgba(226, 232, 240, 0.86);
        }

        .distributor-collapse-button {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(15, 23, 42, 0.24);
          color: #ffffff;
        }

        .distributor-collapse-button:hover {
          border-color: #93c5fd;
          background: rgba(15, 23, 42, 0.42);
        }

        .distributor-team-card {
          min-height: 70px;
          border: 1px solid #dbeafe;
          border-radius: 18px;
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
        }

        .distributor-team-card > .anticon {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
        }

        .distributor-team-card span {
          color: #1d4ed8;
        }

        .distributor-team-card strong {
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .distributor-menu.ant-menu {
          color: #334155;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item {
          color: #334155;
          font-weight: 750;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item .ant-menu-item-icon {
          color: #64748b;
        }

        .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover {
          color: #0f172a !important;
          background: #eff6ff !important;
          box-shadow: inset 4px 0 0 #1d4ed8;
        }

        .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover
          .ant-menu-item-icon {
          color: #1d4ed8 !important;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item-selected {
          color: #ffffff !important;
          background: #1d4ed8 !important;
          box-shadow:
            inset 4px 0 0 #93c5fd,
            0 12px 24px rgba(29, 78, 216, 0.18);
        }

        .distributor-menu.ant-menu-dark
          .ant-menu-item-selected
          .ant-menu-item-icon {
          color: #ffffff !important;
        }

        .distributor-main {
          background: transparent;
        }

        .distributor-header {
          height: 64px;
          margin: 10px 12px 0;
          padding: 0 14px 0 16px;
          border: 1px solid #dbeafe;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
          backdrop-filter: blur(10px);
        }

        .distributor-header-eyebrow {
          color: #1d4ed8;
          letter-spacing: 0.03em;
        }

        .distributor-header-title.ant-typography {
          color: #0f172a;
          font-size: 17px;
        }

        .distributor-ops-chip {
          min-height: 36px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          background: #f8fafc;
          color: #334155;
          font-size: 12.5px;
          font-weight: 850;
          white-space: nowrap;
        }

        .distributor-ops-chip .anticon {
          color: #2563eb;
        }

        .distributor-ops-chip-accent {
          background: #eff6ff;
          border-color: #dbeafe;
          color: #2563eb;
        }

        .distributor-ops-chip-accent .anticon {
          color: #2563eb;
        }

        .distributor-user-chip {
          min-height: 38px;
          padding: 0 10px 0 4px;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          background: #ffffff;
        }

        .distributor-user-chip .ant-avatar {
          background: #1d4ed8;
        }

        .distributor-content {
          height: calc(100vh - 92px);
          margin: 10px 12px 12px;
          padding: 16px;
          border-color: #dbeafe;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .distributor-breadcrumb-shell {
          margin-bottom: 12px;
        }

        .distributor-breadcrumb .ant-breadcrumb-link,
        .distributor-breadcrumb-separator {
          color: #64748b;
          font-size: 12.5px;
          font-weight: 750;
        }

        .distributor-breadcrumb-link {
          color: #1d4ed8;
          font-weight: 850;
        }

        .distributor-breadcrumb-current {
          color: #0f172a;
          font-weight: 850;
        }

        .distributor-page-header {
          min-height: 92px;
          margin-bottom: 14px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
        }

        .distributor-page-header::before {
          content: "";
          width: 8px;
          align-self: stretch;
          flex: 0 0 8px;
          border-radius: 999px;
          background: #1d4ed8;
        }

        .distributor-page-header-copy {
          min-width: 0;
          flex: 1;
        }

        .distributor-page-header-eyebrow {
          color: #1d4ed8 !important;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .distributor-page-header-title.ant-typography {
          margin: 3px 0 4px;
          color: #0f172a;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.16;
        }

        .distributor-page-header-description {
          display: block;
          max-width: 760px;
          color: #475569 !important;
          font-size: 13px;
          line-height: 1.45;
        }

        .distributor-page-header-extra {
          flex: 0 0 auto;
        }

        @media (max-width: 900px) {
          .distributor-header {
            height: auto;
            min-height: 72px;
            padding: 14px 18px;
            align-items: flex-start;
            flex-direction: column;
          }

          .distributor-header-actions {
            flex-wrap: wrap;
          }

          .distributor-content {
            height: calc(100vh - 172px);
            margin: 12px;
            padding: 16px;
            border-radius: 14px;
          }

          .distributor-ops-chip {
            display: none;
          }

          .distributor-page-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 14px;
          }

          .distributor-page-header-title.ant-typography {
            font-size: 20px;
          }

          .distributor-command-content {
            grid-template-columns: 1fr;
          }

          .distributor-command-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .distributor-shell {
          background: #f8fbff;
        }

        .distributor-sider {
          background: #f8fafc !important;
          border-right-color: #dbeafe;
          box-shadow: 16px 0 36px rgba(37, 99, 235, 0.08);
        }

        .distributor-sidebar-inner {
          background: #ffffff;
        }

        .distributor-brand {
          border-color: rgba(255, 255, 255, 0.14);
          background: #1d4ed8;
          box-shadow: 0 18px 34px rgba(37, 99, 235, 0.16);
        }

        .distributor-brand::after {
          background: #93c5fd;
        }

        .distributor-brand-mark {
          background: #dbeafe;
          color: #0f172a;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
        }

        .distributor-brand-subtitle {
          color: #e6edf6;
        }

        .distributor-collapse-button {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(36, 49, 66, 0.28);
        }

        .distributor-collapse-button:hover {
          border-color: #dbeafe;
          background: rgba(37, 99, 235, 0.28);
        }

        .distributor-team-card,
        .distributor-header,
        .distributor-page-header,
        .distributor-stat-card.ant-card,
        .distributor-metric-card,
        .distributor-panel-card,
        .distributor-command-card,
        .distributor-command-feature,
        .distributor-command-status-grid > div,
        .distributor-command-stat,
          .distributor-command-progress,
          .distributor-user-chip,
          .distributor-ops-chip {
          border-color: #dbeafe;
        }

        .distributor-team-card,
        .distributor-header,
        .distributor-page-header,
        .distributor-stat-card.ant-card,
        .distributor-metric-card.ant-card,
        .distributor-panel-card.ant-card,
        .distributor-command-summary,
        .distributor-user-chip {
          background: #ffffff;
        }

        .distributor-team-card > .anticon,
        .distributor-stat-icon,
        .distributor-table-mark,
        .distributor-dashboard-metric-icon {
          background: #eff6ff !important;
          color: #2563eb !important;
        }

        .distributor-team-card span,
        .distributor-header-eyebrow,
        .distributor-page-header-eyebrow,
        .distributor-breadcrumb-link,
        .distributor-command-feature-label,
        .distributor-command-status-grid .anticon,
        .distributor-insight-card .anticon {
          color: #2563eb !important;
        }

        .distributor-team-card strong,
        .distributor-header-title.ant-typography,
        .distributor-page-header-title.ant-typography,
        .distributor-breadcrumb-current,
        .distributor-row-strong,
        .distributor-table-card-title,
        .distributor-command-stat span,
        .distributor-command-progress-label,
        .distributor-command-feature-title,
        .distributor-command-status-grid strong,
        .distributor-stat-card .ant-statistic-content,
        .distributor-metric-card .ant-statistic-content,
        .distributor-dashboard-metric-value,
        .distributor-dashboard-metric-title,
        .distributor-dashboard-summary-value,
        .distributor-dashboard-profile-name.ant-typography,
        .distributor-dashboard-money {
          color: #0f172a !important;
        }

        .distributor-row-muted,
        .distributor-table-card-description,
        .distributor-page-header-description,
        .distributor-breadcrumb .ant-breadcrumb-link,
        .distributor-breadcrumb-separator,
        .distributor-command-stat label,
        .distributor-command-progress-value,
        .distributor-command-status-grid span,
        .distributor-dashboard-metric-description,
        .distributor-dashboard-summary-description,
        .distributor-dashboard-profile-text {
          color: #667085 !important;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item {
          color: #465364;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item .ant-menu-item-icon {
          color: #7a8798;
        }

        .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover {
          color: #0f172a !important;
          background: #eff6ff !important;
          box-shadow: inset 4px 0 0 #2563eb;
        }

        .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover
          .ant-menu-item-icon {
          color: #2563eb !important;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item-selected {
          background: #2563eb !important;
          box-shadow:
            inset 4px 0 0 #93c5fd,
            0 12px 24px rgba(37, 99, 235, 0.16);
        }

        .distributor-main {
          background: transparent;
        }

        .distributor-content {
          border-color: #dbeafe;
          background: rgba(255, 255, 255, 0.84);
        }

        .distributor-page-header {
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.07);
        }

        .distributor-page-header::before {
          background: #2563eb;
        }

        .distributor-command-dark {
          background: #1d4ed8;
        }

        .distributor-command-meter {
          border-color: rgba(215, 235, 231, 0.24);
          background: rgba(37, 99, 235, 0.2);
        }

        .distributor-command-eyebrow,
        .distributor-command-meter label {
          color: #dbeafe !important;
        }

        .distributor-command-stat,
        .distributor-command-progress,
        .distributor-command-feature,
          .distributor-command-status-grid > div,
          .distributor-panel-card .ant-card-head,
          .distributor-panel-card .ant-table-thead > tr > th {
          background: #f8fbff !important;
        }

        .distributor-panel-card .ant-card-head,
        .distributor-panel-card .ant-table-container,
        .distributor-panel-card .ant-table-thead > tr > th {
          border-color: #dbeafe !important;
        }

        .distributor-panel-card .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom-color: #eff6ff !important;
        }

        .distributor-panel-card .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .distributor-ops-chip {
          background: #f8fbff;
          color: #0f172a;
        }

        .distributor-ops-chip .anticon {
          color: #2563eb;
        }

        .distributor-ops-chip-accent {
          background: #eff6ff;
          border-color: #dbeafe;
          color: #2563eb;
        }

        .distributor-user-chip .ant-avatar {
          background: #2563eb;
        }

        .distributor-row-action.ant-btn {
          border-color: var(--row-action-color, #2563eb);
          color: #ffffff;
          background: var(--row-action-color, #2563eb);
        }

        .distributor-row-action.ant-btn:hover {
          border-color: var(--row-action-hover, #1d4ed8) !important;
          color: #ffffff !important;
          background: var(--row-action-hover, #1d4ed8) !important;
        }

        .distributor-content .ant-tag-blue {
          border-color: #dbeafe !important;
          background: #eff6ff !important;
          color: #2563eb !important;
        }

        .distributor-content :is(.ant-tag-success, .ant-tag-processing) {
          border-color: #dbeafe !important;
          background: #f8fbff !important;
          color: #2563eb !important;
        }

        .distributor-header-actions {
          gap: 8px;
          flex-wrap: nowrap;
          min-width: 0;
          flex: 0 1 auto;
        }

        .distributor-header-copy {
          min-width: 180px;
          flex: 1 1 auto;
          overflow: hidden;
        }

        .distributor-ops-chip {
          min-height: 0;
          height: 38px;
          padding: 0 12px;
          gap: 7px;
          border-radius: 13px;
          font-size: 13px;
          font-weight: 800;
          line-height: 1;
          flex: 0 0 auto;
        }

        .distributor-ops-chip .anticon {
          font-size: 15px;
        }

        .distributor-header-actions > .ant-tag {
          height: 32px;
          margin-inline-end: 0;
          padding-inline: 11px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
        }

        .distributor-header-actions
          > .distributor-realtime-tag.ant-tag-blue {
          border-color: #bfdbfe !important;
          background: #eff6ff !important;
          color: #1d4ed8 !important;
        }

        .distributor-notification-button.ant-btn {
          width: 38px;
          height: 38px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          flex: 0 0 38px;
          border-color: #dbeafe;
          background: #eff6ff;
          color: #2563eb;
          font-weight: 800;
          transform: none !important;
        }

        .distributor-notification-button.ant-btn:hover {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          transform: none !important;
        }

        .distributor-notification-button.ant-btn *,
        .distributor-notification-button.ant-btn:hover * {
          transform: none !important;
        }

        .distributor-user-chip {
          min-height: 0;
          height: 38px;
          padding: 0 12px 0 5px;
          gap: 8px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1;
          max-width: 210px;
          flex: 1 1 160px;
          min-width: 0;
        }

        .distributor-user-chip .ant-avatar {
          width: 28px;
          height: 28px;
          min-width: 28px;
          line-height: 28px;
          font-size: 15px;
        }

        .distributor-user-chip span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .distributor-logout-button.ant-btn {
          width: auto;
          height: 38px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 13px;
          flex: 0 0 auto;
          font-weight: 700;
          white-space: nowrap;
          border-color: #dc2626;
          background: #dc2626;
          color: #ffffff;
        }

        .distributor-logout-button.ant-btn:hover {
          border-color: #b91c1c !important;
          background: #b91c1c !important;
          color: #ffffff !important;
        }

        .distributor-content .ant-btn-primary:not(.ant-btn-dangerous),
        .distributor-content
          .seller-page-header-extra
          .ant-btn-primary:not(.ant-btn-dangerous),
        .distributor-routes-create-button.ant-btn {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          font-weight: 650;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18) !important;
        }

        .distributor-content .ant-btn-primary:not(.ant-btn-dangerous):hover,
        .distributor-content
          .seller-page-header-extra
          .ant-btn-primary:not(.ant-btn-dangerous):hover,
        .distributor-routes-create-button.ant-btn:hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24) !important;
          transform: none !important;
        }

        .distributor-content .ant-btn-default:not(.distributor-row-action):not(
            .distributor-dashboard-button
          ):not(.distributor-dashboard-quick-button):not(
            .distributor-notification-button
          ):not(.distributor-logout-button) {
          border-color: #dbeafe;
          background: #ffffff;
          color: #334155;
          font-weight: 650;
        }

        .distributor-content .ant-btn-default:not(.distributor-row-action):not(
            .distributor-dashboard-button
          ):not(.distributor-dashboard-quick-button):not(
            .distributor-notification-button
          ):not(.distributor-logout-button):hover {
          border-color: #60a5fa !important;
          background: #eff6ff !important;
          color: #1d4ed8 !important;
        }

        .distributor-stat-card.ant-card,
        .distributor-dashboard-metric-card {
          position: relative;
          overflow: hidden;
        }

        .distributor-stat-card.ant-card::before,
        .distributor-dashboard-metric-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 5px;
          background: var(--distributor-card-accent, #2563eb);
        }

        .distributor-stat-card-tone-1,
        .distributor-dashboard-stack
          > .ant-row:nth-of-type(1)
          > .ant-col:nth-child(6n + 1)
          .distributor-dashboard-metric-card {
          --distributor-card-accent: #2563eb;
          --distributor-card-soft: #eff6ff;
          --distributor-card-border: #bfdbfe;
          --distributor-card-shadow: rgba(37, 99, 235, 0.12);
        }

        .distributor-stat-card-tone-2,
        .distributor-dashboard-stack
          > .ant-row:nth-of-type(1)
          > .ant-col:nth-child(6n + 2)
          .distributor-dashboard-metric-card {
          --distributor-card-accent: #d97706;
          --distributor-card-soft: #fff7ed;
          --distributor-card-border: #fed7aa;
          --distributor-card-shadow: rgba(217, 119, 6, 0.16);
        }

        .distributor-stat-card-tone-3,
        .distributor-dashboard-stack
          > .ant-row:nth-of-type(1)
          > .ant-col:nth-child(6n + 3)
          .distributor-dashboard-metric-card {
          --distributor-card-accent: #059669;
          --distributor-card-soft: #ecfdf5;
          --distributor-card-border: #a7f3d0;
          --distributor-card-shadow: rgba(5, 150, 105, 0.16);
        }

        .distributor-stat-card-tone-4,
        .distributor-dashboard-stack
          > .ant-row:nth-of-type(1)
          > .ant-col:nth-child(6n + 4)
          .distributor-dashboard-metric-card {
          --distributor-card-accent: #e11d48;
          --distributor-card-soft: #fff1f2;
          --distributor-card-border: #fecdd3;
          --distributor-card-shadow: rgba(225, 29, 72, 0.12);
        }

        .distributor-stat-card-tone-5,
        .distributor-dashboard-stack
          > .ant-row:nth-of-type(1)
          > .ant-col:nth-child(6n + 5)
          .distributor-dashboard-metric-card {
          --distributor-card-accent: #7c3aed;
          --distributor-card-soft: #f5f3ff;
          --distributor-card-border: #ddd6fe;
          --distributor-card-shadow: rgba(124, 58, 237, 0.16);
        }

        .distributor-stat-card-tone-6,
        .distributor-dashboard-stack
          > .ant-row:nth-of-type(1)
          > .ant-col:nth-child(6n + 6)
          .distributor-dashboard-metric-card {
          --distributor-card-accent: #0891b2;
          --distributor-card-soft: #ecfeff;
          --distributor-card-border: #a5f3fc;
          --distributor-card-shadow: rgba(8, 145, 178, 0.16);
        }

        .distributor-stat-card.ant-card,
        .distributor-dashboard-metric-card {
          border-color: var(--distributor-card-border, #dbeafe) !important;
          background: var(--distributor-card-soft, #ffffff) !important;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.64),
            0 16px 34px var(--distributor-card-shadow, rgba(37, 99, 235, 0.12)) !important;
        }

        .distributor-dashboard-metric-blue {
          --distributor-card-accent: #2563eb;
          --distributor-card-soft: #eff6ff;
          --distributor-card-border: #bfdbfe;
          --distributor-card-shadow: rgba(37, 99, 235, 0.16);
          --dashboard-metric-accent: #2563eb;
          --dashboard-metric-icon-bg: #dbeafe;
        }

        .distributor-dashboard-metric-amber {
          --distributor-card-accent: #d97706;
          --distributor-card-soft: #fff7ed;
          --distributor-card-border: #fed7aa;
          --distributor-card-shadow: rgba(217, 119, 6, 0.16);
          --dashboard-metric-accent: #d97706;
          --dashboard-metric-icon-bg: #ffedd5;
        }

        .distributor-dashboard-metric-green {
          --distributor-card-accent: #059669;
          --distributor-card-soft: #ecfdf5;
          --distributor-card-border: #a7f3d0;
          --distributor-card-shadow: rgba(5, 150, 105, 0.16);
          --dashboard-metric-accent: #059669;
          --dashboard-metric-icon-bg: #d1fae5;
        }

        .distributor-dashboard-metric-rose {
          --distributor-card-accent: #e11d48;
          --distributor-card-soft: #fff1f2;
          --distributor-card-border: #fecdd3;
          --distributor-card-shadow: rgba(225, 29, 72, 0.16);
          --dashboard-metric-accent: #e11d48;
          --dashboard-metric-icon-bg: #ffe4e6;
        }

        .distributor-dashboard-metric-violet {
          --distributor-card-accent: #7c3aed;
          --distributor-card-soft: #f5f3ff;
          --distributor-card-border: #ddd6fe;
          --distributor-card-shadow: rgba(124, 58, 237, 0.16);
          --dashboard-metric-accent: #7c3aed;
          --dashboard-metric-icon-bg: #ede9fe;
        }

        .distributor-dashboard-metric-cyan {
          --distributor-card-accent: #0891b2;
          --distributor-card-soft: #ecfeff;
          --distributor-card-border: #a5f3fc;
          --distributor-card-shadow: rgba(8, 145, 178, 0.16);
          --dashboard-metric-accent: #0891b2;
          --dashboard-metric-icon-bg: #cffafe;
        }

        .distributor-dashboard-metric-emerald {
          --distributor-card-accent: #16a34a;
          --distributor-card-soft: #f0fdf4;
          --distributor-card-border: #bbf7d0;
          --distributor-card-shadow: rgba(22, 163, 74, 0.16);
          --dashboard-metric-accent: #16a34a;
          --dashboard-metric-icon-bg: #dcfce7;
        }

        .distributor-dashboard-metric-yellow {
          --distributor-card-accent: #ca8a04;
          --distributor-card-soft: #fefce8;
          --distributor-card-border: #fde68a;
          --distributor-card-shadow: rgba(202, 138, 4, 0.16);
          --dashboard-metric-accent: #ca8a04;
          --dashboard-metric-icon-bg: #fef3c7;
        }

        .distributor-dashboard-profile-panel {
          background:
            radial-gradient(circle at 8% 18%, rgba(96, 165, 250, 0.22), transparent 28%),
            linear-gradient(135deg, #111827 0%, #172554 100%) !important;
        }

        .distributor-dashboard-profile-panel .ant-typography,
        .distributor-dashboard-profile-panel .ant-typography *,
        .distributor-dashboard-profile-panel .distributor-dashboard-profile-name,
        .distributor-dashboard-profile-panel .distributor-dashboard-profile-text {
          color: #ffffff !important;
          opacity: 1 !important;
        }

        .distributor-dashboard-profile-panel .distributor-dashboard-profile-eyebrow,
        .distributor-dashboard-profile-panel .distributor-dashboard-profile-icon {
          color: rgba(255, 255, 255, 0.78) !important;
        }

        .distributor-dashboard-profile-panel .distributor-dashboard-avatar {
          background: #ffffff !important;
          color: #2563eb !important;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.28) !important;
        }

        .distributor-dashboard-profile-panel .distributor-dashboard-status-tag.ant-tag-success {
          min-height: 32px;
          border-color: #86efac !important;
          background: #dcfce7 !important;
          color: #15803d !important;
          font-weight: 850 !important;
        }

        .distributor-dashboard-profile-panel .distributor-dashboard-status-tag.ant-tag-error {
          min-height: 32px;
          border-color: #fecaca !important;
          background: #fee2e2 !important;
          color: #b91c1c !important;
          font-weight: 850 !important;
        }

        .distributor-dashboard-profile-panel .distributor-dashboard-status-tag.ant-tag {
          width: auto !important;
          min-width: 132px !important;
          align-self: flex-start !important;
          border-radius: 999px !important;
          text-align: center !important;
        }

        .distributor-stat-icon,
        .distributor-dashboard-metric-icon {
          background: #ffffff !important;
          color: var(--distributor-card-accent, #2563eb) !important;
          box-shadow: 0 8px 18px var(--distributor-card-shadow, rgba(37, 99, 235, 0.08));
        }

        .distributor-stat-card .ant-statistic-content,
        .distributor-dashboard-metric-value {
          color: var(--distributor-card-accent, #0f172a) !important;
        }

        .distributor-dashboard-summary-panel {
          border: 1px solid #dbeafe;
          border-radius: 18px;
          padding: 18px;
          background: #ffffff;
        }

        .distributor-dashboard-summary-panel .ant-col:nth-child(2) {
          border-inline: 0;
        }

        .distributor-modal-root .ant-modal-mask {
          background: rgba(15, 23, 42, 0.42) !important;
          backdrop-filter: blur(5px);
        }

        .distributor-modal.ant-modal .ant-modal-content {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 18px;
          padding: 0;
          background: #ffffff;
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.22);
        }

        .distributor-modal.ant-modal .ant-modal-header {
          margin: 0;
          padding: 20px 22px 16px;
          border-bottom: 1px solid #eaf2ff;
          background: #f8fbff;
        }

        .distributor-modal.ant-modal .ant-modal-title {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
          line-height: 1.25;
        }

        .distributor-modal.ant-modal .ant-modal-body {
          padding: 20px 22px 8px;
        }

        .distributor-modal.ant-modal .ant-modal-footer {
          margin-top: 0;
          padding: 14px 22px 20px;
          border-top: 1px solid #f1f5f9;
          background: #f8fbff;
        }

        .distributor-modal.ant-modal .ant-modal-close {
          top: 14px;
          color: #64748b;
        }

        .distributor-modal.ant-modal .ant-input,
        .distributor-modal.ant-modal .ant-input-affix-wrapper,
        .distributor-modal.ant-modal .ant-select-selector,
        .distributor-modal.ant-modal .ant-input-number,
        .distributor-modal.ant-modal .ant-picker {
          border-color: #dbeafe !important;
          border-radius: 12px !important;
          background: #ffffff !important;
        }

        .distributor-modal.ant-modal .ant-input:hover,
        .distributor-modal.ant-modal .ant-input:focus,
        .distributor-modal.ant-modal .ant-input-affix-wrapper:hover,
        .distributor-modal.ant-modal .ant-input-affix-wrapper-focused,
        .distributor-modal.ant-modal .ant-select-focused .ant-select-selector,
        .distributor-modal.ant-modal .ant-input-number-focused,
        .distributor-modal.ant-modal .ant-picker-focused {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }

        .distributor-modal.ant-modal .ant-btn-primary:not(.ant-btn-dangerous) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          font-weight: 650;
        }

        .distributor-row-action-view.ant-btn,
        .distributor-row-action.ant-btn:has(.anticon-eye) {
          --row-action-color: #2563eb;
          --row-action-hover: #1d4ed8;
          --row-action-shadow: rgba(37, 99, 235, 0.16);
        }

        .distributor-row-action-edit.ant-btn,
        .distributor-row-action.ant-btn:has(.anticon-edit) {
          --row-action-color: #d97706;
          --row-action-hover: #b45309;
          --row-action-shadow: rgba(217, 119, 6, 0.16);
        }

        .distributor-row-action-restore.ant-btn,
        .distributor-row-action.ant-btn:has(.anticon-unlock) {
          --row-action-color: #0891b2;
          --row-action-hover: #0e7490;
          --row-action-shadow: rgba(8, 145, 178, 0.16);
        }

        .distributor-row-action-delete.ant-btn,
        .distributor-row-action.ant-btn-dangerous,
        .distributor-row-action.ant-btn:has(.anticon-delete),
        .distributor-content .ant-btn-dangerous:not(.ant-btn-primary) {
          --row-action-color: #dc2626;
          --row-action-hover: #b91c1c;
          --row-action-shadow: rgba(220, 38, 38, 0.16);
          border-color: #dc2626 !important;
          background: #dc2626 !important;
          color: #ffffff !important;
        }

        .distributor-row-action-delete.ant-btn:hover,
        .distributor-row-action.ant-btn-dangerous:hover,
        .distributor-row-action.ant-btn:has(.anticon-delete):hover,
        .distributor-content .ant-btn-dangerous:not(.ant-btn-primary):hover {
          border-color: #b91c1c !important;
          background: #b91c1c !important;
          color: #ffffff !important;
        }

        .distributor-modal.ant-modal .ant-btn-dangerous {
          border-color: #dc2626 !important;
          background: #dc2626 !important;
          color: #ffffff !important;
          font-weight: 650;
        }

        .distributor-modal.ant-modal .ant-btn-dangerous:hover {
          border-color: #b91c1c !important;
          background: #b91c1c !important;
          color: #ffffff !important;
        }

        .distributor-form-card.ant-card,
        .distributor-dsr-form-card.ant-card {
          border: 1px solid #d7ebe7;
          border-radius: 14px;
          background: #ffffff;
        }

        .distributor-form-card .ant-card-body,
        .distributor-dsr-form-card .ant-card-body {
          padding: 18px;
        }

        .distributor-form-card .ant-form-item-label > label,
        .distributor-dsr-form-card .ant-form-item-label > label,
        .distributor-inline-action-form .ant-typography {
          color: #0f172a;
          font-weight: 700;
        }

        .distributor-form-card .ant-input,
        .distributor-form-card .ant-input-affix-wrapper,
        .distributor-form-card .ant-select-selector,
        .distributor-form-card .ant-input-number,
        .distributor-form-card .ant-picker,
        .distributor-dsr-form-card .ant-input,
        .distributor-dsr-form-card .ant-input-affix-wrapper,
        .distributor-dsr-form-card .ant-select-selector,
        .distributor-dsr-form-card .ant-input-number,
        .distributor-dsr-form-card .ant-picker,
        .distributor-inline-action-form .ant-input,
        .distributor-inline-action-form .ant-input-affix-wrapper {
          border-color: #d7ebe7 !important;
          border-radius: 12px !important;
          background: #ffffff !important;
        }

        .distributor-form-card .ant-input:hover,
        .distributor-form-card .ant-input:focus,
        .distributor-form-card .ant-input-affix-wrapper:hover,
        .distributor-form-card .ant-input-affix-wrapper-focused,
        .distributor-form-card .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
        .distributor-form-card .ant-select-focused .ant-select-selector,
        .distributor-form-card .ant-input-number:hover,
        .distributor-form-card .ant-input-number-focused,
        .distributor-form-card .ant-picker:hover,
        .distributor-form-card .ant-picker-focused,
        .distributor-dsr-form-card .ant-input:hover,
        .distributor-dsr-form-card .ant-input:focus,
        .distributor-dsr-form-card .ant-input-affix-wrapper:hover,
        .distributor-dsr-form-card .ant-input-affix-wrapper-focused,
        .distributor-dsr-form-card .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
        .distributor-dsr-form-card .ant-select-focused .ant-select-selector,
        .distributor-dsr-form-card .ant-input-number:hover,
        .distributor-dsr-form-card .ant-input-number-focused,
        .distributor-dsr-form-card .ant-picker:hover,
        .distributor-dsr-form-card .ant-picker-focused,
        .distributor-inline-action-form .ant-input:hover,
        .distributor-inline-action-form .ant-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }

        .distributor-form-actions {
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid #d7ebe7;
        }

        .distributor-inline-action-form {
          margin-top: 16px;
          padding: 16px;
          border: 1px solid #fecdd3;
          border-radius: 14px;
          background: #fff1f2;
        }

        .distributor-shell .distributor-sider {
          background: #ffffff !important;
          border-right: 1px solid #dbeafe !important;
          box-shadow: 8px 0 22px rgba(15, 23, 42, 0.06) !important;
        }

        .distributor-shell .distributor-sidebar-inner {
          background: #ffffff !important;
        }

        .distributor-shell .distributor-brand {
          min-height: 106px !important;
          margin: 0 !important;
          padding: 18px 16px !important;
          border: 0 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 0 !important;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 58%, #0f766e 100%) !important;
          box-shadow: none !important;
        }

        .distributor-shell .distributor-brand::after {
          display: none !important;
        }

        .distributor-shell .distributor-brand-mark {
          border-radius: 14px !important;
        }

        .distributor-shell .distributor-collapse-button {
          border-radius: 10px !important;
        }

        .distributor-shell .distributor-brand-mark {
          background: rgba(255, 255, 255, 0.94) !important;
          color: #1d4ed8 !important;
          box-shadow: none !important;
        }

        .distributor-shell .distributor-collapse-button {
          border-color: rgba(255, 255, 255, 0.32) !important;
          background: rgba(15, 23, 42, 0.16) !important;
          color: #ffffff !important;
        }

        .distributor-shell .distributor-brand-title,
        .distributor-shell .distributor-brand-subtitle {
          color: #ffffff !important;
        }

        .distributor-shell .distributor-brand-subtitle {
          opacity: 0.88;
        }

        .distributor-shell .distributor-team-card {
          margin: 16px 16px 12px !important;
          border-color: #dbeafe !important;
          border-radius: 16px !important;
          background: #f8fbff !important;
          color: #0f172a !important;
          box-shadow: none !important;
        }

        .distributor-shell .distributor-team-card > .anticon {
          color: #2563eb !important;
          background: #eff6ff !important;
        }

        .distributor-shell .distributor-team-card span {
          color: #2563eb !important;
        }

        .distributor-shell .distributor-team-card strong {
          color: #0f172a !important;
        }

        .distributor-shell .distributor-menu-scroll {
          padding: 6px 16px 16px !important;
        }

        .distributor-shell .distributor-menu.ant-menu-dark .ant-menu-item {
          height: 46px !important;
          border-radius: 14px !important;
          color: #475569 !important;
          background: transparent !important;
          font-weight: 750 !important;
        }

        .distributor-shell
          .distributor-menu.ant-menu-dark
          .ant-menu-item
          .ant-menu-item-icon {
          color: #64748b !important;
        }

        .distributor-shell
          .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover {
          color: #1d4ed8 !important;
          background: #eff6ff !important;
          box-shadow: inset 4px 0 0 #60a5fa !important;
        }

        .distributor-shell
          .distributor-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover
          .ant-menu-item-icon {
          color: #1d4ed8 !important;
        }

        .distributor-shell .distributor-menu.ant-menu-dark .ant-menu-item-selected {
          color: #ffffff !important;
          background: #2563eb !important;
          box-shadow: inset 4px 0 0 #93c5fd !important;
        }

        .distributor-shell
          .distributor-menu.ant-menu-dark
          .ant-menu-item-selected
          .ant-menu-item-icon {
          color: #ffffff !important;
        }

        .distributor-shell .distributor-header {
          height: 84px !important;
          margin: 0 !important;
          padding: 0 20px !important;
          border: 0 !important;
          border-bottom: 1px solid #dbeafe !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        .distributor-shell .distributor-header::before,
        .distributor-shell .distributor-header::after {
          display: none !important;
        }

        .distributor-shell .distributor-content {
          height: calc(100vh - 84px) !important;
          margin: 0 !important;
          border-top: 0 !important;
          border-right: 0 !important;
          border-bottom: 0 !important;
          border-radius: 0 !important;
          background: #f8fbff !important;
        }

        .distributor-shell
          .distributor-header-actions
          > .distributor-realtime-tag.ant-tag-success {
          border-color: #86efac !important;
          background: #dcfce7 !important;
          color: #15803d !important;
        }

        .distributor-shell
          .distributor-header-actions
          > .distributor-realtime-tag.ant-tag-error {
          border-color: #fecaca !important;
          background: #fee2e2 !important;
          color: #b91c1c !important;
        }

        @media (max-width: 1240px) {
          .distributor-ops-chip {
            display: none;
          }

          .distributor-user-chip {
            max-width: 180px;
          }
        }

        @media (max-width: 1040px) {
          .distributor-logout-button.ant-btn span:not(.anticon) {
            display: none;
          }

          .distributor-logout-button.ant-btn {
            width: 38px;
            padding: 0;
            flex-basis: 38px;
          }
        }
      `}</style>
    </Layout>
  );
}





