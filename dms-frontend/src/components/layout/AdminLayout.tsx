"use client";

import {
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Flex,
  Grid,
  Layout,
  Menu,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  adminRouteByKey,
  adminRouteGroups,
  adminSidebarRoutes,
} from "@/config/adminMenu";
import { useLogoutSessionMutation } from "@/features/auth/authService";
import { logout } from "@/features/auth/authSlice";
import { useGetUnreadCountQuery } from "@/features/notifications/notificationService";
import { useSocketStatus } from "@/hooks/useSocketStatus";
import { getSocket } from "@/lib/socket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

function SidebarIcon({
  children,
  hasDot = false,
}: {
  children: ReactNode;
  hasDot?: boolean;
}) {
  return (
    <Badge dot={hasDot} offset={[-2, 2]}>
      <span className="admin-sidebar-icon">{children}</span>
    </Badge>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const screens = useBreakpoint();
  const admin = useAppSelector((state) => state.auth.user);
  const [logoutSession] = useLogoutSessionMutation();

  const isMobile = !screens.lg;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isSocketConnected = useSocketStatus();
  const { data: unreadData, refetch } = useGetUnreadCountQuery();

  const unreadCount = unreadData?.unreadCount ?? 0;
  const isDesktopCollapsed = collapsed && !isMobile;
  const adminName = admin?.fullName || "Admin";
  const adminInitial = adminName.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    const socket = getSocket();

    const handleRefreshUnreadCount = () => {
      refetch();
    };

    socket.on("new-notification", handleRefreshUnreadCount);

    return () => {
      socket.off("new-notification", handleRefreshUnreadCount);
    };
  }, [refetch]);

  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile, pathname]);

  const activeRoute = useMemo(() => {
    return (
      [...adminSidebarRoutes]
        .sort((a, b) => b.key.length - a.key.length)
        .find(
          (route) =>
            pathname === route.key || pathname.startsWith(`${route.key}/`),
        ) ?? adminSidebarRoutes[0]
    );
  }, [pathname]);

  const menuItems: MenuProps["items"] = useMemo(
    () =>
      adminRouteGroups.map((group) => ({
        type: "group",
        label: group.label,
        children: group.keys.map((key) => {
          const route = adminRouteByKey.get(key);

          if (!route) {
            return null;
          }

          const isNotification = route.key === "/admin/notifications";

          return {
            key: route.key,
            icon: (
              <SidebarIcon hasDot={isNotification && unreadCount > 0}>
                {route.icon}
              </SidebarIcon>
            ),
            label: isNotification ? (
              <Flex
                align="center"
                justify="space-between"
                gap={10}
                className="admin-notification-menu-label"
              >
                <span>{route.label}</span>

                {unreadCount > 0 && (
                  <span className="admin-menu-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Flex>
            ) : (
              route.label
            ),
          };
        }),
      })),
    [unreadCount],
  );

  const handleMenuClick = useCallback<NonNullable<MenuProps["onClick"]>>(
    ({ key }) => {
      router.push(String(key));

      if (isMobile) {
        setMobileSidebarOpen(false);
      }
    },
    [isMobile, router],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutSession().unwrap();
    } catch {
      // Local logout should still work when the server session is already gone.
    }

    dispatch(logout());
    router.replace("/auth/login");
  }, [dispatch, logoutSession, router]);

  const handleToggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const sidebarPanel = (
    <div
      className={`admin-sidebar-shell ${
        isDesktopCollapsed ? "is-collapsed" : ""
      }`}
    >
      <div className="admin-brand">
        <div className="admin-brand-logo">
          <span>D</span>
        </div>

        <div className="admin-brand-copy">
          <Text className="admin-brand-title">DMS Admin</Text>
          <Text className="admin-brand-subtitle">Distribution Control</Text>
        </div>

        {!isMobile && (
          <Tooltip
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            placement={collapsed ? "right" : "bottom"}
          >
            <button
              type="button"
              className="admin-collapse-button"
              onClick={handleToggleSidebar}
              aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </Tooltip>
        )}
      </div>

      <div className="admin-status-zone">
        <div className="admin-status-panel">
          <Flex align="center" justify="space-between" gap={12}>
            <Flex align="center" gap={10}>
              <span
                className={`admin-status-dot ${
                  isSocketConnected ? "online" : "offline"
                }`}
              />

              <div className="admin-status-copy">
                <Text className="admin-status-description">
                  {isSocketConnected ? "Kết nối ổn định" : "Đang gián đoạn"}
                </Text>
              </div>
            </Flex>

            <Tag color={isSocketConnected ? "success" : "error"}>
              {isSocketConnected ? "Online" : "Offline"}
            </Tag>
          </Flex>
        </div>

        <Tooltip
          placement="right"
          title={isSocketConnected ? "Realtime online" : "Realtime offline"}
        ></Tooltip>
      </div>

      <div className="admin-menu-scroll">
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={[activeRoute.key]}
          inlineCollapsed={isDesktopCollapsed}
          onClick={handleMenuClick}
          className={`admin-sidebar-menu ${
            isDesktopCollapsed ? "admin-sidebar-menu-collapsed" : ""
          }`}
        />
      </div>

      <div className="admin-profile-card">
        <div className="admin-profile-expanded">
          <Flex align="center" gap={12} className="admin-profile-main">
            <Avatar size={42} className="admin-profile-avatar">
              {adminInitial}
            </Avatar>

            <div className="admin-profile-meta">
              <Text className="admin-profile-name">{adminName}</Text>
              <Text className="admin-profile-role">
                {admin?.email || "Quản trị hệ thống"}
              </Text>
            </div>
          </Flex>

          <Tooltip title="Đăng xuất">
            <Button
              danger
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="admin-profile-logout"
              aria-label="Đăng xuất"
            />
          </Tooltip>
        </div>

        <Tooltip placement="right" title={adminName}>
          <div className="admin-profile-collapsed">
            <Avatar size={42} className="admin-profile-avatar">
              {adminInitial}
            </Avatar>
          </div>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <>
      <Layout className="admin-layout-root">
        {!isMobile && (
          <Sider
            width={280}
            collapsedWidth={88}
            collapsed={collapsed}
            trigger={null}
            className="admin-layout-sider"
          >
            {sidebarPanel}
          </Sider>
        )}

        <Drawer
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          placement="left"
          width={304}
          title={null}
          styles={{
            header: {
              display: "none",
            },
            body: {
              padding: 0,
              overflow: "hidden",
              background: "#071a24",
            },
          }}
        >
          {sidebarPanel}
        </Drawer>

        <Layout className="admin-layout-main">
          <Header className="admin-header">
            <Flex align="center" gap={14} className="admin-header-left">
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  onClick={() => setMobileSidebarOpen(true)}
                  className="admin-icon-button"
                  aria-label="Mở menu quản trị"
                />
              )}

              <div className="admin-page-heading">
                <Title level={3} className="admin-page-title">
                  {activeRoute.title}
                </Title>

                <Text className="admin-page-description">
                  {activeRoute.description}
                </Text>
              </div>
            </Flex>

            <Flex align="center" gap={10} className="admin-header-actions">
              {!isMobile && (
                <div className="admin-live-chip">
                  <span
                    className={`admin-status-dot ${
                      isSocketConnected ? "online" : "offline"
                    }`}
                  />

                  <Text>
                    {isSocketConnected ? "Realtime online" : "Realtime offline"}
                  </Text>
                </div>
              )}

              <Tooltip title="Thông báo">
                <Badge count={unreadCount} overflowCount={99} size="small">
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    onClick={() => router.push("/admin/notifications")}
                    className="admin-icon-button"
                    aria-label="Mở thông báo"
                  />
                </Badge>
              </Tooltip>

              {!isMobile && (
                <div className="admin-header-user">
                  <Avatar size={36} className="admin-header-avatar">
                    {adminInitial}
                  </Avatar>

                  <div className="admin-header-user-copy">
                    <Text className="admin-header-user-name">{adminName}</Text>
                    <Text className="admin-header-user-role">
                      Administrator
                    </Text>
                  </div>
                </div>
              )}

              <Tooltip title="Đăng xuất">
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className="admin-logout-button"
                >
                  {!isMobile && "Đăng xuất"}
                </Button>
              </Tooltip>
            </Flex>
          </Header>

          <Content className="admin-content-scroll">
            <main className="admin-content">
              <div className="admin-content-frame">{children}</div>
            </main>
          </Content>
        </Layout>
      </Layout>

      <style jsx global>{`
        :root {
          --admin-primary: #2563eb;
          --admin-primary-hover: #1d4ed8;
          --admin-primary-soft: #eff6ff;
          --admin-sidebar: #0b2230;
          --admin-sidebar-deep: #071a24;
          --admin-sidebar-card: #102b3a;
          --admin-sidebar-hover: rgba(125, 211, 252, 0.12);
          --admin-sidebar-border: rgba(125, 211, 252, 0.16);
          --admin-sidebar-text: #d8edf7;
          --admin-page-bg: #f4f7fb;
          --admin-card-bg: #ffffff;
          --admin-surface-soft: #f8fafc;
          --admin-text-main: #0f172a;
          --admin-text-secondary: #64748b;
          --admin-text-muted: #94a3b8;
          --admin-border: #dbe4f0;
          --admin-success: #10b981;
          --admin-warning: #f59e0b;
          --admin-error: #ef4444;
          --admin-info: #0ea5e9;
          --admin-radius: 8px;
          --admin-radius-lg: 12px;
          --admin-shadow-sm: 0 8px 20px rgba(17, 24, 39, 0.05);
          --admin-shadow-md: 0 16px 36px rgba(17, 24, 39, 0.08);
          --admin-motion: 160ms ease;
          --admin-layout-motion: 220ms ease;
        }

        .admin-layout-root,
        .admin-layout-root .ant-layout,
        .admin-layout-root .ant-typography,
        .admin-layout-root .ant-menu,
        .admin-layout-root .ant-btn,
        .admin-layout-root .ant-tag,
        .admin-layout-root .ant-input,
        .admin-layout-root .ant-select,
        .admin-layout-root .ant-picker,
        .admin-layout-root .ant-table,
        .admin-layout-root .ant-descriptions {
          font-family:
            var(--font-roboto),
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .admin-layout-root {
          height: 100dvh;
          min-height: 100dvh;
          overflow: hidden;
          background: var(--admin-page-bg);
        }

        .admin-layout-sider {
          position: relative !important;
          height: 100dvh;
          overflow: visible !important;
          z-index: 30;
          background: var(--admin-sidebar-deep) !important;
          border-right: 1px solid var(--admin-sidebar-border);
          box-shadow: 18px 0 36px rgba(7, 26, 36, 0.18);
          transition:
            width var(--admin-layout-motion),
            min-width var(--admin-layout-motion),
            max-width var(--admin-layout-motion),
            flex-basis var(--admin-layout-motion) !important;
          will-change: width;
        }

        .admin-sidebar-shell {
          height: 100%;
          min-height: 0;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: linear-gradient(
            180deg,
            #0d2a39 0%,
            #0b2230 48%,
            #071a24 100%
          );
        }

        .admin-brand {
          min-height: 72px;
          padding: 12px;
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) 36px;
          align-items: center;
          gap: 12px;
          border-radius: var(--admin-radius-lg);
          background: rgba(16, 43, 58, 0.92);
          border: 1px solid var(--admin-sidebar-border);
          box-shadow: 0 10px 22px rgba(3, 12, 18, 0.2);
          transition:
            min-height var(--admin-layout-motion),
            padding var(--admin-layout-motion);
        }

        .admin-brand-logo {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--admin-radius);
          color: #ffffff;
          font-size: 19px;
          font-weight: 900;
          background: #2563eb;
          box-shadow: 0 8px 18px rgba(14, 165, 233, 0.22);
        }

        .admin-brand-copy,
        .admin-status-panel,
        .admin-profile-expanded,
        .admin-menu-badge {
          transition:
            opacity var(--admin-motion),
            visibility var(--admin-motion),
            transform var(--admin-motion);
        }

        .admin-brand-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-brand-title {
          color: #ffffff !important;
          font-size: 17px;
          font-weight: 800;
          line-height: 1.25;
          white-space: nowrap;
        }

        .admin-brand-subtitle {
          margin-top: 3px;
          color: #9ed7eb !important;
          font-size: 12px;
          line-height: 1.35;
          white-space: nowrap;
        }

        .admin-sidebar-shell.is-collapsed .admin-brand {
          box-sizing: border-box;
          width: 60px;
          min-height: 126px;
          grid-template-columns: 1fr;
          grid-template-rows: 44px 36px;
          justify-content: center;
          align-content: center;
          justify-items: center;
          align-self: center;
          padding: 12px 8px;
          gap: 12px;
        }

        .admin-sidebar-shell.is-collapsed .admin-brand-copy {
          display: none;
        }

        .admin-sidebar-shell.is-collapsed .admin-brand-logo {
          margin: 0;
        }

        .admin-sidebar-shell.is-collapsed .admin-brand-copy,
        .admin-sidebar-shell.is-collapsed .admin-status-panel,
        .admin-sidebar-shell.is-collapsed .admin-profile-expanded,
        .admin-sidebar-shell.is-collapsed .admin-menu-badge {
          opacity: 0;
          visibility: hidden;
          transform: translateX(-8px);
          pointer-events: none;
        }

        .admin-sidebar-shell.is-collapsed .admin-status-panel {
          display: none;
        }

        .admin-status-zone {
          position: relative;
          margin-top: 12px;
        }

        .admin-sidebar-shell.is-collapsed .admin-status-zone {
          height: 42px;
          margin-top: 10px;
        }

        .admin-status-panel {
          padding: 12px;
          border-radius: var(--admin-radius-lg);
          background: rgba(6, 32, 44, 0.72);
          border: 1px solid var(--admin-sidebar-border);
        }

        .admin-status-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-status-title {
          color: #ffffff !important;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
        }

        .admin-status-description {
          color: #9ed7eb !important;
          font-size: 12px;
          line-height: 1.35;
        }

        .admin-status-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 999px;
          background: var(--admin-error);
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.14);
        }

        .admin-status-dot.online {
          background: var(--admin-success);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.16);
        }

        .admin-menu-scroll {
          flex: 1;
          min-height: 0;
          margin-top: 14px;
          padding-right: 2px;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-color: rgba(125, 211, 252, 0.28) transparent;
          contain: layout paint;
        }

        .admin-sidebar-shell.is-collapsed .admin-menu-scroll {
          margin-top: 8px;
          padding-right: 0;
          scrollbar-width: none;
        }

        .admin-sidebar-shell.is-collapsed
          .admin-menu-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        .admin-sidebar-menu {
          background: transparent !important;
          border-inline-end: none !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item {
          height: 44px;
          line-height: 44px;
          margin: 5px 0;
          padding-inline: 12px 14px !important;
          border-radius: var(--admin-radius);
          color: var(--admin-sidebar-text);
          transition:
            background var(--admin-motion),
            color var(--admin-motion),
            box-shadow var(--admin-motion);
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item:hover {
          color: #ffffff !important;
          background: var(--admin-sidebar-hover) !important;
          box-shadow: inset 3px 0 0 #38bdf8;
        }

        .admin-sidebar-menu.ant-menu-dark
          .ant-menu-item:hover
          .admin-sidebar-icon {
          color: #ffffff !important;
          background: rgba(56, 189, 248, 0.18);
          border-color: rgba(125, 211, 252, 0.28);
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item-selected {
          color: #ffffff !important;
          background: #2563eb !important;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.26);
        }

        .admin-sidebar-menu.ant-menu-dark
          .ant-menu-item-selected
          .admin-sidebar-icon {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.24);
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item .ant-menu-item-icon {
          min-width: 36px;
          margin-inline-end: 14px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .admin-sidebar-icon {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: #a7dff4 !important;
          font-size: 16px;
          background: rgba(125, 211, 252, 0.1);
          border: 1px solid rgba(125, 211, 252, 0.12);
          transition:
            color var(--admin-motion),
            background var(--admin-motion),
            border-color var(--admin-motion);
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-title-content {
          margin-inline-start: 6px !important;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0;
        }

        .admin-sidebar-shell.is-collapsed
          .admin-sidebar-menu.ant-menu-dark
          .ant-menu-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          width: 48px;
          margin-inline: auto;
          line-height: normal;
          overflow: hidden;
          padding-inline: 0 !important;
        }

        .admin-sidebar-menu-collapsed.ant-menu-inline-collapsed {
          width: 100%;
        }

        .admin-sidebar-menu-collapsed.ant-menu-dark .ant-menu-item {
          box-shadow: none;
          transform: none !important;
        }

        .admin-sidebar-menu-collapsed.ant-menu-dark
          .ant-menu-item
          .ant-menu-title-content,
        .admin-sidebar-shell.is-collapsed
          .admin-sidebar-menu.ant-menu-dark
          .ant-menu-item
          .ant-menu-title-content {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          opacity: 0 !important;
        }

        .admin-sidebar-shell.is-collapsed
          .admin-sidebar-menu.ant-menu-dark
          .ant-menu-item
          .ant-menu-item-icon {
          width: 100%;
          height: 100%;
          min-width: 0;
          line-height: normal;
          margin-inline: 0 !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-sidebar-menu-collapsed.ant-menu-dark
          .ant-menu-item
          .ant-menu-item-icon {
          width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .admin-sidebar-shell.is-collapsed
          .admin-sidebar-menu.ant-menu-dark
          .ant-menu-title-content {
          margin-inline-start: 0 !important;
        }

        .admin-sidebar-shell.is-collapsed
          .admin-sidebar-menu.ant-menu-dark
          .ant-badge {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-sidebar-shell.is-collapsed .admin-sidebar-icon {
          margin: 0 auto;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item-group-title {
          padding: 14px 12px 5px;
          color: #7dd3fc;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.3;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .admin-sidebar-shell.is-collapsed
          .admin-sidebar-menu.ant-menu-dark
          .ant-menu-item-group-title {
          height: 8px;
          padding: 0;
          overflow: hidden;
          opacity: 0;
        }

        .admin-notification-menu-label {
          min-width: 0;
        }

        .admin-menu-badge {
          min-width: 24px;
          height: 20px;
          padding: 0 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          background: #f97316;
        }

        .admin-profile-card {
          margin-top: 12px;
          min-height: 58px;
          position: relative;
          border-radius: var(--admin-radius-lg);
          background: rgba(6, 32, 44, 0.74);
          border: 1px solid var(--admin-sidebar-border);
        }

        .admin-profile-expanded,
        .admin-profile-collapsed {
          position: absolute;
          inset: 0;
          padding: 8px;
          display: flex;
          align-items: center;
        }

        .admin-profile-expanded {
          justify-content: space-between;
          gap: 10px;
        }

        .admin-profile-collapsed {
          justify-content: center;
          opacity: 0;
          visibility: hidden;
        }

        .admin-sidebar-shell.is-collapsed .admin-profile-collapsed {
          opacity: 1;
          visibility: visible;
        }

        .admin-profile-main,
        .admin-profile-meta,
        .admin-header-user-copy {
          min-width: 0;
        }

        .admin-profile-avatar,
        .admin-header-avatar {
          color: #ffffff !important;
          background: linear-gradient(135deg, #2563eb, #0ea5e9) !important;
          font-weight: 800;
          flex-shrink: 0;
        }

        .admin-profile-meta {
          display: flex;
          flex-direction: column;
        }

        .admin-profile-name {
          color: #ffffff !important;
          font-size: 13.5px;
          font-weight: 800;
          line-height: 1.25;
          white-space: nowrap;
        }

        .admin-profile-role {
          max-width: 150px;
          margin-top: 3px;
          overflow: hidden;
          color: #9ed7eb !important;
          font-size: 11.5px;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-profile-logout {
          width: 36px !important;
          height: 36px !important;
          border-radius: var(--admin-radius) !important;
          color: #fecaca !important;
          background: rgba(239, 68, 68, 0.12) !important;
        }

        .admin-profile-logout:hover {
          color: #ffffff !important;
          background: var(--admin-error) !important;
        }

        .admin-collapse-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(125, 211, 252, 0.24);
          border-radius: var(--admin-radius);
          color: #d8edf7;
          font-size: 15px;
          cursor: pointer;
          background: rgba(14, 165, 233, 0.12);
          box-shadow: none;
          transition:
            color var(--admin-motion),
            border-color var(--admin-motion),
            background var(--admin-motion),
            transform var(--admin-motion);
        }

        .admin-collapse-button:hover {
          color: #ffffff;
          border-color: #38bdf8;
          background: rgba(14, 165, 233, 0.22);
          transform: translateY(-1px);
        }

        .admin-layout-main {
          height: 100dvh;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          background: transparent !important;
        }

        .admin-header {
          height: 76px !important;
          min-height: 76px !important;
          flex-shrink: 0;
          padding: 0 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 18px;
          background: #ffffff !important;
          border-bottom: 1px solid var(--admin-border);
        }

        .admin-header-left {
          min-width: 0;
          flex: 1;
        }

        .admin-page-heading {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .admin-page-title {
          margin: 0 !important;
          color: var(--admin-text-main) !important;
          font-size: 22px !important;
          line-height: 1.28 !important;
          font-weight: 800 !important;
          letter-spacing: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-page-description {
          margin-top: 4px;
          max-width: 760px;
          color: var(--admin-text-secondary) !important;
          font-size: 13px;
          line-height: 1.45;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-header-actions {
          min-width: 0;
          flex-shrink: 0;
        }

        .admin-live-chip,
        .admin-header-user {
          border: 1px solid var(--admin-border);
          background: #ffffff;
          box-shadow: var(--admin-shadow-sm);
        }

        .admin-live-chip {
          height: 40px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
        }

        .admin-live-chip .ant-typography {
          color: #374151 !important;
          font-size: 12.5px;
          font-weight: 700;
        }

        .admin-icon-button {
          width: 42px !important;
          height: 42px !important;
          border-radius: var(--admin-radius) !important;
          color: var(--admin-text-main) !important;
          font-size: 17px !important;
          background: #ffffff !important;
          border: 1px solid var(--admin-border) !important;
          box-shadow: var(--admin-shadow-sm);
          transition:
            color var(--admin-motion),
            border-color var(--admin-motion),
            background-color var(--admin-motion);
        }

        .admin-icon-button:hover {
          color: var(--admin-primary) !important;
          border-color: #bfd0ff !important;
          background: var(--admin-primary-soft) !important;
        }

        .admin-header-user {
          height: 44px;
          padding: 0 12px 0 6px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
        }

        .admin-header-user-name {
          display: block;
          max-width: 130px;
          overflow: hidden;
          color: var(--admin-text-main) !important;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.22;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-header-user-role {
          display: block;
          margin-top: 2px;
          color: var(--admin-text-secondary) !important;
          font-size: 11.5px;
          line-height: 1.28;
        }

        .admin-logout-button {
          height: 42px !important;
          border-radius: var(--admin-radius) !important;
          padding-inline: 14px !important;
          font-size: 13px;
          font-weight: 700 !important;
          border-color: #fecaca !important;
          background: #ffffff !important;
          box-shadow: var(--admin-shadow-sm);
        }

        .admin-content-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: transparent !important;
        }

        .admin-content {
          min-height: 100%;
          padding: 20px;
          background: transparent;
        }

        .admin-content-frame {
          min-height: calc(100dvh - 116px);
          padding: 22px;
          border-radius: var(--admin-radius-lg);
          border: 1px solid var(--admin-border);
          background: #ffffff;
          box-shadow: var(--admin-shadow-sm);
        }

        .admin-content-frame > * {
          max-width: 100%;
        }

        /* One admin page style for future files */
        .admin-page-card,
        .admin-content-frame .ant-card {
          border-color: var(--admin-border) !important;
          border-radius: var(--admin-radius) !important;
          background: var(--admin-card-bg) !important;
          box-shadow: var(--admin-shadow-sm);
          overflow: hidden;
        }

        .admin-page-card .ant-card-head,
        .admin-content-frame .ant-card-head {
          min-height: 56px;
          border-bottom-color: var(--admin-border) !important;
          background: #ffffff !important;
        }

        .admin-page-card .ant-card-head-title,
        .admin-content-frame .ant-card-head-title {
          color: var(--admin-text-main);
          font-weight: 800;
          letter-spacing: 0;
        }

        .admin-content-frame .ant-card-body {
          background: #ffffff !important;
        }

        .admin-page-toolbar {
          padding: 14px;
          border: 1px solid var(--admin-border);
          border-radius: var(--admin-radius);
          background: var(--admin-surface-soft);
        }

        .admin-section-title {
          margin: 0 !important;
          color: var(--admin-text-main) !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
          letter-spacing: 0;
        }

        .admin-section-description {
          color: var(--admin-text-secondary) !important;
          font-size: 13px;
          line-height: 1.5;
        }

        .admin-content-frame .ant-btn {
          border-radius: var(--admin-radius) !important;
          font-weight: 700 !important;
        }

        .admin-content-frame .ant-btn-primary {
          background: var(--admin-primary) !important;
          border-color: var(--admin-primary) !important;
          box-shadow: 0 8px 18px rgba(49, 94, 251, 0.18);
        }

        .admin-content-frame .ant-btn-primary:hover {
          background: var(--admin-primary-hover) !important;
          border-color: var(--admin-primary-hover) !important;
        }

        .admin-content-frame .ant-input,
        .admin-content-frame .ant-input-affix-wrapper,
        .admin-content-frame .ant-picker,
        .admin-content-frame .ant-select-selector,
        .admin-content-frame .ant-input-number,
        .admin-content-frame .ant-input-number-affix-wrapper,
        .admin-content-frame .ant-upload-wrapper .ant-upload-drag {
          border-radius: var(--admin-radius) !important;
          border-color: var(--admin-border) !important;
          background: #ffffff !important;
        }

        .admin-content-frame .ant-input:hover,
        .admin-content-frame .ant-input-affix-wrapper:hover,
        .admin-content-frame .ant-picker:hover,
        .admin-content-frame .ant-select-selector:hover,
        .admin-content-frame .ant-input-number:hover,
        .admin-content-frame .ant-input-number-affix-wrapper:hover {
          border-color: #b9c8ff !important;
        }

        .admin-content-frame .ant-input:focus,
        .admin-content-frame .ant-input-affix-wrapper-focused,
        .admin-content-frame .ant-picker-focused,
        .admin-content-frame .ant-select-focused .ant-select-selector,
        .admin-content-frame .ant-input-number-focused,
        .admin-content-frame .ant-input-number-affix-wrapper-focused {
          border-color: var(--admin-primary) !important;
          box-shadow: 0 0 0 3px rgba(49, 94, 251, 0.12) !important;
        }

        .admin-content-frame .ant-form-item-label > label {
          color: #374151 !important;
          font-weight: 700;
        }

        .admin-content-frame .ant-table-wrapper,
        .admin-page-table {
          overflow: hidden;
          border-radius: var(--admin-radius) !important;
          border: 1px solid var(--admin-border);
          background: #ffffff;
        }

        .admin-content-frame .ant-table,
        .admin-content-frame .ant-table-container,
        .admin-content-frame .ant-table-content,
        .admin-content-frame .ant-table-body,
        .admin-content-frame .ant-table-sticky-holder,
        .admin-content-frame .ant-table-sticky-scroll,
        .admin-content-frame .ant-table-cell-scrollbar {
          background: #ffffff !important;
        }

        .admin-content-frame .ant-table-thead > tr > th,
        .admin-content-frame .ant-table-cell-fix-left,
        .admin-content-frame .ant-table-cell-fix-right,
        .admin-content-frame .ant-table-tbody > tr > td {
          background: #ffffff !important;
        }

        .admin-content-frame .ant-table-thead > tr > th {
          color: #374151 !important;
          font-size: 12px;
          font-weight: 800 !important;
          text-transform: uppercase;
          border-bottom: 1px solid var(--admin-border) !important;
          background: var(--admin-surface-soft) !important;
          letter-spacing: 0;
        }

        .admin-content-frame .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .admin-content-frame
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right {
          background: var(--admin-surface-soft) !important;
        }

        .admin-content-frame .ant-table-tbody > tr > td {
          color: var(--admin-text-main);
          border-bottom-color: #edf2f7 !important;
        }

        .admin-content-frame .ant-table-tbody > tr:hover > td,
        .admin-content-frame
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left,
        .admin-content-frame
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right {
          background: #f8fbff !important;
        }

        .admin-content-frame .ant-table-tbody > tr.ant-table-row-selected > td,
        .admin-content-frame
          .ant-table-tbody
          > tr.ant-table-row-selected
          > td.ant-table-cell-fix-left,
        .admin-content-frame
          .ant-table-tbody
          > tr.ant-table-row-selected
          > td.ant-table-cell-fix-right {
          background: var(--admin-primary-soft) !important;
        }

        .admin-content-frame .ant-table-cell-fix-left,
        .admin-content-frame .ant-table-cell-fix-right {
          z-index: 2;
        }

        .admin-content-frame .ant-table-cell-fix-left-last::after,
        .admin-content-frame .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(17, 24, 39, 0.12) !important;
        }

        .admin-content-frame .ant-table-placeholder td {
          background: #ffffff !important;
        }

        .admin-content-frame .ant-pagination-item {
          border-radius: var(--admin-radius) !important;
        }

        .admin-content-frame .ant-table-pagination.ant-pagination {
          flex-wrap: wrap;
          row-gap: 8px;
        }

        .admin-content-frame .ant-pagination-item-active {
          border-color: var(--admin-primary) !important;
        }

        .admin-content-frame .ant-pagination-item-active a {
          color: var(--admin-primary) !important;
        }

        .admin-content-frame .ant-tag {
          border-radius: 999px;
          font-weight: 700;
          margin-inline-end: 0;
        }

        .admin-content-frame .ant-descriptions {
          border-radius: var(--admin-radius);
          overflow: hidden;
          background: #ffffff;
        }

        .admin-content-frame .ant-descriptions-view,
        .admin-content-frame .ant-descriptions-item-label,
        .admin-content-frame .ant-descriptions-item-content {
          border-color: var(--admin-border) !important;
        }

        .admin-content-frame .ant-descriptions-item-label {
          color: var(--admin-text-secondary) !important;
          font-weight: 700;
          background: var(--admin-surface-soft) !important;
        }

        .admin-content-frame .ant-descriptions-item-content {
          color: var(--admin-text-main) !important;
          background: #ffffff !important;
        }

        .ant-modal .ant-modal-content {
          border-radius: var(--admin-radius-lg) !important;
          padding: 22px !important;
          box-shadow: var(--admin-shadow-md) !important;
        }

        .ant-modal .ant-modal-header {
          margin-bottom: 18px !important;
          background: #ffffff !important;
        }

        .ant-modal .ant-modal-title {
          color: var(--admin-text-main) !important;
          font-weight: 800 !important;
          letter-spacing: 0;
        }

        .ant-modal .ant-modal-footer {
          margin-top: 22px !important;
        }

        .ant-drawer .ant-drawer-content {
          background: var(--admin-sidebar) !important;
        }

        @media (max-width: 1199px) {
          .admin-header {
            padding: 0 18px !important;
          }

          .admin-content {
            padding: 16px;
          }

          .admin-content-frame {
            padding: 18px;
          }
        }

        @media (max-width: 991px) {
          .admin-sidebar-shell {
            padding: 16px 12px;
          }

          .admin-brand-copy,
          .admin-status-panel,
          .admin-profile-expanded,
          .admin-menu-badge {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            pointer-events: auto !important;
          }

          .admin-status-mini,
          .admin-profile-collapsed {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }

          .admin-header {
            height: 72px !important;
            min-height: 72px !important;
            padding: 0 14px !important;
          }

          .admin-page-title {
            font-size: 19px !important;
          }

          .admin-page-description {
            display: none;
          }

          .admin-content {
            padding: 12px;
          }

          .admin-content-frame {
            min-height: calc(100dvh - 96px);
            padding: 14px;
          }

          .admin-header-actions {
            gap: 8px !important;
          }

          .admin-content-frame .ant-pagination-total-text {
            width: 100%;
            margin-inline-end: 0;
          }

          .admin-icon-button,
          .admin-logout-button {
            width: 42px !important;
            height: 42px !important;
          }

          .admin-logout-button {
            padding-inline: 0 !important;
          }
        }

        @media (max-width: 575px) {
          .admin-header {
            padding: 0 10px !important;
          }

          .admin-header-left {
            gap: 10px !important;
          }

          .admin-page-title {
            font-size: 17px !important;
          }

          .admin-content {
            padding: 8px;
          }

          .admin-content-frame {
            padding: 10px;
          }

          .admin-content-frame .ant-card-body {
            padding: 14px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-layout-sider,
          .admin-brand-copy,
          .admin-status-panel,
          .admin-sidebar-menu.ant-menu-dark .ant-menu-item,
          .admin-menu-badge,
          .admin-profile-expanded,
          .admin-profile-collapsed,
          .admin-collapse-button,
          .admin-icon-button {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
