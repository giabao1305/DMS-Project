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
import { useEffect, useMemo, useRef, useState } from "react";

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
  "/distributor/routes",
  "/distributor/visits",
  "/distributor/leaves",
  "/distributor/kpis",
  "/distributor/notifications",
  "/distributor/profile",
];

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
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);
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
        label: "Đơn hàng đội",
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
      .find((route) => pathname === route || pathname.startsWith(`${route}/`)) ??
    "/distributor/dashboard";

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

  useEffect(() => {
    const contentScroll = contentScrollRef.current;

    if (!contentScroll) {
      return;
    }

    let scrollTimeout = 0;

    const handleScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        contentScroll.classList.add("is-scrolling");
      }

      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        isScrollingRef.current = false;
        contentScroll.classList.remove("is-scrolling");
      }, 140);
    };

    contentScroll.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(scrollTimeout);
      isScrollingRef.current = false;
      contentScroll.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
                <div className="distributor-brand-title">DMS Distributor</div>
                <div className="distributor-brand-subtitle">
                  Điều phối đội DSR và chăm sóc điểm bán
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
                <span>Workspace</span>
              <strong>Nhà phân phối</strong>
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
              Distributor Workspace
            </Typography.Text>
            <Typography.Title level={4} className="distributor-header-title">
              Quản lý đội DSR
            </Typography.Title>
          </div>

          <div className="distributor-header-actions">
            <Tag color={isSocketConnected ? "success" : "error"}>
              Realtime {isSocketConnected ? "online" : "offline"}
            </Tag>
            <Button
              icon={
                <Badge dot={unreadCount > 0} offset={[2, 0]}>
                  <BellOutlined />
                </Badge>
              }
              onClick={() => router.push("/distributor/notifications")}
            />
            <div className="distributor-user-chip">
              <Avatar icon={<UserOutlined />} />
              <span>{currentUser?.fullName || "Distributor"}</span>
            </div>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </Header>

        <Content ref={contentScrollRef} className="distributor-content">
          <div key={pathname} className="distributor-content-frame">
            {children}
          </div>
        </Content>
      </Layout>

      <style jsx global>{`
        .distributor-shell {
          min-height: 100vh;
          background: #edf7f5;
        }

        .distributor-sider {
          background: #07171f !important;
          border-right: 1px solid rgba(20, 184, 166, 0.18);
          box-shadow: 14px 0 34px rgba(7, 23, 31, 0.2);
        }

        .distributor-sidebar-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #07171f;
        }

        .distributor-brand {
          min-height: 92px;
          margin: 18px 14px 12px;
          padding: 14px;
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr) 36px;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(20, 184, 166, 0.18);
          border-radius: 16px;
          background: #0d2430;
          box-shadow: 0 14px 28px rgba(3, 12, 18, 0.28);
        }

        .distributor-brand-collapsed {
          min-height: 126px;
          margin-inline: 10px;
          padding: 12px 8px;
          grid-template-columns: 1fr;
          justify-items: center;
          row-gap: 12px;
        }

        .distributor-brand-mark {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #14b8a6;
          color: #ffffff;
          font-size: 21px;
        }

        .distributor-brand-title {
          color: #ffffff;
          font-size: 17px;
          font-weight: 800;
        }

        .distributor-brand-subtitle {
          color: #a9d8d1;
          font-size: 12.5px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .distributor-collapse-button {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(20, 184, 166, 0.24);
          border-radius: 12px;
          background: #102b38;
          color: #d9fffa;
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
          border-color: #14b8a6;
          background: #123a48;
          transform: none;
        }

        .distributor-team-card {
          margin: 0 14px 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(20, 184, 166, 0.15);
          border-radius: 14px;
          background: #0b202a;
          color: #e9fffc;
        }

        .distributor-team-card span,
        .distributor-team-card strong {
          display: block;
          line-height: 1.3;
        }

        .distributor-team-card span {
          color: #70e4d7;
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
          color: #cbe3df;
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
          background: #102b38 !important;
          transform: none;
          box-shadow: inset 3px 0 0 #14b8a6;
        }

        .distributor-menu.ant-menu-dark .ant-menu-item-selected {
          background: #0d9488 !important;
          box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.72);
        }

        .distributor-menu.ant-menu-inline-collapsed.ant-menu-dark .ant-menu-item {
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
          background: #edf7f5;
        }

        .distributor-header {
          height: 70px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
          border-bottom: 1px solid #d7ebe7;
        }

        .distributor-header-eyebrow {
          display: block;
          color: #0d9488;
          font-size: 11.5px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .distributor-header-title.ant-typography {
          margin: 2px 0 0;
          color: #0b2f2a;
          font-size: 19px;
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
          height: calc(100vh - 70px);
          padding: 22px;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }

        .distributor-content-frame {
          min-width: 0;
          animation: distributor-page-enter 240ms ease-out both;
        }

        .distributor-content.is-scrolling *,
        .distributor-content.is-scrolling *::before,
        .distributor-content.is-scrolling *::after {
          transition: none !important;
          animation-play-state: paused !important;
        }

        .distributor-content
          :is(
            .ant-card,
            .ant-table-wrapper,
            [class*="-card"],
            [class*="-panel"],
            [class*="-table"],
            [class*="-hero"],
            [class*="-item"],
            [class*="-row"]
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
          :is(
            .ant-card,
            [class*="-card"],
            [class*="-panel"],
            [class*="-item"],
            [class*="-row"]
          ) {
          transition:
            border-color 150ms ease,
            background-color 150ms ease,
            color 150ms ease !important;
        }

        .distributor-content
          :is(
            .ant-card,
            [class*="-card"],
            [class*="-panel"],
            [class*="-item"],
            [class*="-row"]
          ):hover {
          border-color: #b7ddd8 !important;
          box-shadow: 0 8px 18px rgba(11, 47, 42, 0.045) !important;
          transform: none !important;
        }

        .distributor-content [class*="-hero"] {
          box-shadow: 0 10px 22px rgba(11, 47, 42, 0.055) !important;
          contain: paint;
        }

        .distributor-content.is-scrolling
          :is(
            .ant-card,
            .ant-table-wrapper,
            [class*="-card"],
            [class*="-panel"],
            [class*="-table"],
            [class*="-hero"],
            [class*="-item"],
            [class*="-row"]
          ) {
          box-shadow: 0 8px 18px rgba(11, 47, 42, 0.04) !important;
          transform: none !important;
        }

        .distributor-content.is-scrolling
          :is(
            .ant-table-wrapper,
            .ant-table,
            .ant-table-container,
            .ant-table-content,
            [class*="-table"],
            [class*="-table-card"]
          ) {
          box-shadow: none !important;
        }

        .distributor-content .ant-table-tbody > tr > td {
          transition: background-color 140ms ease;
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

        .distributor-page-hero {
          position: relative;
          min-height: 58px;
          padding: 8px 14px;
          overflow: hidden;
          display: flex;
          align-items: center;
          border: 1px solid #d7ebe7;
          border-radius: 16px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 252, 251, 0.95)),
            radial-gradient(circle at 88% 12%, rgba(20, 184, 166, 0.22), transparent 30%),
            linear-gradient(90deg, rgba(13, 148, 136, 0.08), transparent 55%);
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .distributor-page-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 760px;
        }

        .distributor-page-eyebrow {
          color: #0d9488;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .distributor-page-title.ant-typography {
          margin: 2px 0 2px;
          color: #0b2f2a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .distributor-page-description {
          color: #5d7471 !important;
          font-size: 11.5px;
          font-weight: 600;
        }

        .distributor-stat-card.ant-card {
          min-height: 116px;
          border: 1px solid #d7ebe7;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 12px 28px rgba(11, 47, 42, 0.05);
        }

        .distributor-stat-card .ant-card-body {
          padding: 16px;
        }

        .distributor-stat-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #e7f8f5;
          color: #0d9488;
          font-size: 19px;
        }

        .distributor-stat-card .ant-statistic-title {
          margin-bottom: 2px;
          color: #5d7471;
          font-size: 12.5px;
          font-weight: 850;
        }

        .distributor-stat-card .ant-statistic-content {
          color: #0b2f2a;
          font-size: 24px;
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
          border: 1px solid #d7ebe7;
          border-radius: 8px;
          box-shadow: 0 12px 28px rgba(11, 47, 42, 0.05);
        }

        .distributor-metric-card.ant-card,
        .distributor-panel-card.ant-card {
          background: #ffffff;
        }

        .distributor-metric-card .ant-statistic-title {
          color: #5d7471;
          font-weight: 800;
        }

        .distributor-metric-card .ant-statistic-content {
          color: #0b2f2a;
          font-weight: 900;
        }

        .distributor-panel-card .ant-card-head {
          min-height: 52px;
          border-bottom: 1px solid #d7ebe7;
        }

        .distributor-panel-card .ant-card-head-title {
          color: #0b2f2a;
          font-weight: 850;
        }

        .distributor-table-card .ant-card-head {
          padding-inline: 18px;
        }

        .distributor-table-card .ant-card-body {
          padding: 0;
        }

        .distributor-table-card-title {
          color: #0b2f2a;
          font-size: 15px;
          font-weight: 900;
        }

        .distributor-table-card-description {
          color: #6b827f;
          font-size: 12px;
          font-weight: 650;
        }

        .distributor-panel-card .ant-table-thead > tr > th {
          background: #f3fbf9 !important;
          color: #123c36 !important;
          font-size: 12px;
          font-weight: 900 !important;
          text-transform: uppercase;
        }

        .distributor-panel-card .ant-table-tbody > tr:hover > td {
          background: #f5fbfa !important;
        }

        .distributor-insight-card .anticon {
          color: #0d9488;
          font-size: 20px;
        }

        .distributor-insight-card h2.ant-typography {
          color: #0b2f2a;
          font-weight: 900;
          letter-spacing: 0;
        }

        .distributor-table-card .ant-list-item {
          padding-inline: 18px;
          transition: background 160ms ease;
        }

        .distributor-table-card .ant-list-item:hover {
          background: #f5fbfa;
        }

        .distributor-notification-read {
          opacity: 0.72;
          background: #fbfefd;
        }

        .distributor-command-card {
          overflow: hidden;
          border: 1px solid #d7ebe7;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .distributor-command-dark {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: #07171f;
        }

        .distributor-command-eyebrow {
          color: #a9d8d1 !important;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .distributor-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .distributor-command-description {
          display: block;
          max-width: 440px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78) !important;
          font-size: 14px;
          line-height: 1.6;
        }

        .distributor-command-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .distributor-command-meter span {
          display: block;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.15;
        }

        .distributor-command-meter label {
          display: block;
          margin-top: 5px;
          color: #a9d8d1;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .distributor-command-summary {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
        }

        .distributor-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .distributor-command-stat {
          min-width: 128px;
          flex: 1 1 128px;
          padding: 14px 16px;
          border: 1px solid #d7ebe7;
          border-radius: 14px;
          background: #f3fbf9;
        }

        .distributor-command-stat span {
          display: block;
          color: #0b2f2a;
          font-size: 25px;
          font-weight: 850;
          line-height: 1.1;
        }

        .distributor-command-stat label {
          display: block;
          margin-top: 5px;
          color: #5d7471;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .distributor-command-progress {
          margin-top: 18px;
          padding: 14px 15px;
          border: 1px solid #d7ebe7;
          border-radius: 14px;
          background: #ffffff;
        }

        .distributor-command-progress-label {
          color: #0b2f2a !important;
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .distributor-command-progress-value {
          color: #5d7471 !important;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .distributor-command-feature {
          min-height: 152px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #d7ebe7;
          border-radius: 14px;
          background: #f3fbf9;
        }

        .distributor-command-feature-label {
          color: #0f766e !important;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .distributor-command-feature-title {
          display: block;
          color: #0b2f2a !important;
          font-size: 17px;
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
          border: 1px solid #cbe9e3;
          border-radius: 999px;
          background: #ffffff;
          color: #5d7471;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
        }

        .distributor-command-feature-empty {
          color: #5d7471 !important;
          font-size: 13px;
          line-height: 1.5;
        }

        .distributor-command-status-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .distributor-command-status-grid > div {
          min-height: 76px;
          padding: 12px;
          display: grid;
          gap: 4px;
          border: 1px solid #d7ebe7;
          border-radius: 14px;
          background: #f3fbf9;
        }

        .distributor-command-status-grid .anticon {
          color: #0d9488;
          font-size: 17px;
        }

        .distributor-command-status-grid span {
          color: #5d7471;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .distributor-command-status-grid strong {
          color: #0b2f2a;
          font-size: 20px;
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
          background: #e7f8f5;
          color: #0d9488;
          font-size: 17px;
        }

        .distributor-row-strong {
          color: #0b2f2a !important;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .distributor-row-muted {
          color: #5d7471 !important;
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

        .distributor-profile-card {
          padding: 0;
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
            height: calc(100vh - 130px);
            padding: 14px;
          }

          .distributor-command-content {
            grid-template-columns: 1fr;
          }

          .distributor-command-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </Layout>
  );
}
