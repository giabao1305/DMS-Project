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
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
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
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLogoutSessionMutation } from "@/features/auth/authService";
import { logout } from "@/features/auth/authSlice";
import { getRoleLabel, isSalesRepRole } from "@/features/auth/roleUtils";
import { useGetUnreadCountQuery } from "@/features/notifications/notificationService";
import { useSocketStatus } from "@/hooks/useSocketStatus";
import { getSocket, resetSocket } from "@/lib/socket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetApiState } from "@/store/resetApiState";

const { Header, Sider, Content } = Layout;

const navigationRoutes = [
  "/seller/dashboard",
  "/seller/customers",
  "/seller/routes",
  "/seller/visits",
  "/seller/orders",
  "/seller/kpis",
  "/seller/leaves",
  "/seller/notifications",
  "/seller/profile",
];

export default function SellerLayout({
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);

  const { data: unreadData, refetch } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const isDsr = isSalesRepRole(currentUser?.role);
  const workspaceTitle = isDsr
    ? "Kênh DSR bán hàng"
    : "Kênh nhà phân phối";
  const workspaceSubtitle = isDsr
    ? "Theo dõi tuyến và chăm sóc điểm bán"
    : "Điều phối đội DSR và vận hành khu vực";

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

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "/seller/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
      },
      {
        key: "/seller/customers",
        icon: <TeamOutlined />,
        label: isDsr ? "Khách hàng của tôi" : "Khách hàng",
      },
      {
        key: "/seller/routes",
        icon: <EnvironmentOutlined />,
        label: isDsr ? "Tuyến của tôi" : "Tuyến bán hàng",
      },
      {
        key: "/seller/visits",
        icon: <AimOutlined />,
        label: "Ghé thăm",
      },
      {
        key: "/seller/orders",
        icon: <ShoppingCartOutlined />,
        label: isDsr ? "Đơn hàng của tôi" : "Đơn hàng",
      },
      {
        key: "/seller/kpis",
        icon: <LineChartOutlined />,
        label: isDsr ? "KPI cá nhân" : "KPI đội bán",
      },
      {
        key: "/seller/leaves",
        icon: <CalendarOutlined />,
        label: "Nghỉ phép",
      },
      {
        key: "/seller/notifications",
        icon: sidebarCollapsed ? (
          <Badge
            dot={unreadCount > 0}
            offset={[-1, 2]}
            styles={{
              indicator: {
                background: "#14B8A6",
                boxShadow: "0 0 0 2px #0B2F2A",
              },
            }}
          >
            <BellOutlined />
          </Badge>
        ) : (
          <BellOutlined />
        ),
        label: (
          <div className="seller-menu-label-with-badge">
            <span>Thông báo</span>

            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                size="small"
                overflowCount={99}
                style={{
                  background: "#14B8A6",
                  boxShadow: "none",
                  color: "#FFFFFF",
                  fontFamily: "inherit",
                  fontWeight: 800,
                }}
              />
            )}
          </div>
        ),
      },
      {
        key: "/seller/profile",
        icon: <UserOutlined />,
        label: "Tài khoản",
      },
    ],
    [isDsr, sidebarCollapsed, unreadCount],
  );

  const selectedMenuKey =
    [...navigationRoutes]
      .sort((a, b) => b.length - a.length)
      .find(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ) ?? "/seller/dashboard";

  return (
    <>
      <Layout className="seller-shell">
        <Sider
          width={276}
          collapsedWidth={88}
          collapsed={sidebarCollapsed}
          trigger={null}
          theme="dark"
          className="seller-sider"
        >
          <div className="seller-sidebar-inner">
            <div
              className={`seller-sidebar-top ${
                sidebarCollapsed ? "seller-sidebar-top-collapsed" : ""
              }`}
            >
              <div className="seller-brand-mark">
                <ShoppingCartOutlined />
              </div>

              {!sidebarCollapsed && (
                <div className="seller-brand-copy">
                  <div className="seller-brand-title">DMS Seller</div>
                  <div className="seller-brand-subtitle">
                    {workspaceSubtitle}
                  </div>
                </div>
              )}

              <Tooltip
                title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                placement={sidebarCollapsed ? "right" : "bottom"}
              >
                <button
                  type="button"
                  className="seller-collapse-button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  aria-label={
                    sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
                  }
                >
                  {sidebarCollapsed ? (
                    <MenuUnfoldOutlined />
                  ) : (
                    <MenuFoldOutlined />
                  )}
                </button>
              </Tooltip>
            </div>

            {!sidebarCollapsed && (
              <div className="seller-sidebar-status-card">
                <div>
                  <div className="seller-sidebar-status-label">Hôm nay</div>
                  <div className="seller-sidebar-status-value">
                    {isDsr ? "Sẵn sàng chăm sóc tuyến" : "Sẵn sàng điều phối đội"}
                  </div>
                </div>
                <span className="seller-sidebar-status-dot" />
              </div>
            )}

            <div className="seller-menu-scroll">
              <Menu
                className={`seller-sidebar-menu ${
                  sidebarCollapsed ? "seller-sidebar-menu-collapsed" : ""
                }`}
                theme="dark"
                mode="inline"
                inlineCollapsed={sidebarCollapsed}
                selectedKeys={[selectedMenuKey]}
                items={menuItems}
                onClick={(item) => router.push(item.key)}
              />
            </div>
          </div>
        </Sider>

        <Layout className="seller-main-layout">
          <Header className="seller-header">
            <div className="seller-header-title-group">
              <Typography.Text className="seller-header-eyebrow">
                Sales Workspace
              </Typography.Text>
              <Typography.Title level={4} className="seller-header-title">
                {workspaceTitle}
              </Typography.Title>
            </div>

            <div className="seller-header-actions">
              <Tag
                className="seller-realtime-tag"
                color={isSocketConnected ? "success" : "error"}
              >
                Realtime {isSocketConnected ? "online" : "offline"}
              </Tag>

              <div className="seller-user-chip">
                <Avatar icon={<UserOutlined />} className="seller-avatar" />
                <span>{currentUser?.fullName || getRoleLabel(currentUser?.role)}</span>
              </div>

              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={async () => {
                  try {
                    await logoutSession().unwrap();
                  } catch {
                    // Local logout should still work when the server session is already gone.
                  }

                  resetApiState(dispatch);
                  resetSocket();
                  dispatch(logout());
                  router.replace("/auth/login");
                }}
              >
                Đăng xuất
              </Button>
            </div>
          </Header>

          <Content ref={contentScrollRef} className="seller-content">
            <div key={pathname} className="seller-content-frame">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>

      <style jsx global>{`
        .seller-shell {
          min-height: 100vh;
          overflow: hidden;
          background: #edf7f5;
        }

        .seller-sider {
          overflow: hidden;
          background: #07171f !important;
          border-right: 1px solid rgba(20, 184, 166, 0.18);
          box-shadow: 14px 0 34px rgba(7, 23, 31, 0.2);
          transition:
            width 220ms ease,
            min-width 220ms ease,
            max-width 220ms ease,
            flex-basis 220ms ease;
        }

        .seller-sidebar-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #07171f;
        }

        .seller-sidebar-top {
          min-height: 92px;
          margin: 18px 14px 12px;
          padding: 14px;
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr) 36px;
          align-items: center;
          column-gap: 12px;
          border: 1px solid rgba(20, 184, 166, 0.18);
          border-radius: 16px;
          background: #0d2430;
          box-shadow: 0 14px 28px rgba(3, 12, 18, 0.28);
          transition:
            margin 220ms ease,
            padding 220ms ease,
            min-height 220ms ease;
        }

        .seller-sidebar-top-collapsed {
          min-height: 126px;
          margin-inline: 10px;
          padding: 12px 8px;
          grid-template-columns: 1fr;
          justify-items: center;
          row-gap: 12px;
        }

        .seller-brand-mark {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #14b8a6;
          color: #ffffff;
          font-size: 21px;
          box-shadow: 0 10px 22px rgba(20, 184, 166, 0.26);
        }

        .seller-brand-copy {
          min-width: 0;
        }

        .seller-brand-title {
          color: #ffffff;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: 0;
        }

        .seller-brand-subtitle {
          margin-top: 4px;
          color: #a9d8d1;
          font-size: 12.5px;
          font-weight: 500;
          line-height: 1.4;
          letter-spacing: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .seller-collapse-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(20, 184, 166, 0.24);
          border-radius: 12px;
          color: #d9fffa;
          font-size: 15px;
          cursor: pointer;
          background: #102b38;
          box-shadow: none;
          transition:
            background 170ms ease,
            border-color 170ms ease,
            color 170ms ease,
            transform 170ms ease;
        }

        .seller-collapse-button:hover {
          color: #ffffff;
          border-color: #14b8a6;
          background: #123a48;
          transform: none;
        }

        .seller-sidebar-status-card {
          min-height: 56px;
          margin: 0 14px 14px;
          padding: 11px 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid rgba(20, 184, 166, 0.15);
          border-radius: 14px;
          background: #0b202a;
        }

        .seller-sidebar-status-label {
          color: #70e4d7;
          font-size: 11.5px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .seller-sidebar-status-value {
          margin-top: 4px;
          color: #e9fffc;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.35;
        }

        .seller-sidebar-status-dot {
          width: 10px;
          height: 10px;
          flex: 0 0 10px;
          border-radius: 999px;
          background: #14b8a6;
          box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.15);
        }

        .seller-menu-scroll {
          flex: 1;
          min-height: 0;
          padding: 2px 12px 16px;
          overflow-y: auto;
          transition: padding 220ms ease;
        }

        .seller-sider.ant-layout-sider-collapsed .seller-menu-scroll {
          padding-inline: 10px;
        }

        .seller-sidebar-menu.ant-menu {
          background: transparent;
          border-inline-end: none;
          color: #d2e8e4;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.45;
          letter-spacing: 0;
        }

        .seller-sidebar-menu.ant-menu-dark .ant-menu-item {
          height: 44px;
          line-height: 44px;
          margin-block: 5px;
          margin-inline: 0;
          padding-inline: 15px !important;
          border-radius: 12px;
          color: #cbe3df;
          transition:
            background 180ms ease,
            color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .seller-sidebar-menu.ant-menu-dark .ant-menu-item::after {
          display: none;
        }

        .seller-sidebar-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover {
          color: #ffffff !important;
          background: #102b38 !important;
          transform: none;
          box-shadow: inset 3px 0 0 #14b8a6;
        }

        .seller-sidebar-menu.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover
          .ant-menu-item-icon {
          color: #70e4d7 !important;
          transform: none;
        }

        .seller-sidebar-menu.ant-menu-dark
          .ant-menu-item
          .ant-menu-title-content {
          min-width: 0;
          font-weight: 600;
          letter-spacing: 0;
          transition: color 180ms ease;
        }

        .seller-sidebar-menu.ant-menu-dark .ant-menu-item .ant-menu-item-icon {
          min-width: 18px;
          font-size: 16.5px;
          color: #a9d8d1;
          transition:
            color 180ms ease,
            transform 180ms ease;
        }

        .seller-sidebar-menu.ant-menu-dark .ant-menu-item-selected {
          color: #ffffff !important;
          background: #0d9488 !important;
          box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.72);
        }

        .seller-sidebar-menu.ant-menu-dark
          .ant-menu-item-selected
          .ant-menu-item-icon {
          color: #ffffff !important;
        }

        .seller-sidebar-menu.ant-menu-dark
          .ant-menu-item-selected
          .ant-menu-title-content {
          font-weight: 750;
        }

        .seller-menu-label-with-badge {
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .seller-menu-label-with-badge > span:first-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .seller-sidebar-menu-collapsed.ant-menu-dark .ant-menu-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 44px;
          margin-inline: auto;
          padding-inline: 0 !important;
          text-align: center;
        }

        .seller-sidebar-menu-collapsed.ant-menu-dark
          .ant-menu-item
          .ant-menu-item-icon {
          width: 100%;
          min-width: 0;
          height: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-inline-end: 0 !important;
          font-size: 18px;
          line-height: 1;
        }

        .seller-sidebar-menu-collapsed.ant-menu-dark
          .ant-menu-item
          .ant-menu-item-icon
          .ant-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .seller-sidebar-menu-collapsed.ant-menu-dark
          .ant-menu-item
          .ant-menu-title-content {
          display: none;
          margin: 0 !important;
          padding: 0 !important;
        }

        .seller-sidebar-menu-collapsed.ant-menu-dark
          .ant-menu-item:not(.ant-menu-item-selected):hover {
          transform: none;
        }

        .seller-main-layout {
          min-width: 0;
          background: #edf7f5;
        }

        .seller-header {
          height: 70px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
          border-bottom: 1px solid #d7ebe7;
          box-shadow: 0 8px 24px rgba(11, 47, 42, 0.04);
        }

        .seller-header-title-group {
          min-width: 0;
          flex: 1;
        }

        .seller-header-eyebrow {
          display: block;
          color: #0d9488;
          font-size: 11.5px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .seller-header-title.ant-typography {
          margin: 3px 0 0;
          color: #0b2f2a;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .seller-header-actions {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .seller-realtime-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 700;
        }

        .seller-user-chip {
          min-height: 28px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: #123c36;
          font-size: 13px;
          font-weight: 700;
        }

        .seller-avatar {
          width: 26px;
          height: 26px;
          line-height: 26px;
          background: #0d9488;
          color: #ffffff;
          font-size: 12px;
        }

        .seller-content {
          height: calc(100vh - 102px);
          margin: 16px;
          padding: 24px;
          overflow-y: auto;
          border: 1px solid #d7ebe7;
          border-radius: 16px;
          background: #f8fcfb;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }

        .seller-content-frame {
          min-width: 0;
          animation: seller-page-enter 240ms ease-out both;
        }

        .seller-content.is-scrolling *,
        .seller-content.is-scrolling *::before,
        .seller-content.is-scrolling *::after {
          transition: none !important;
          animation-play-state: paused !important;
        }

        .seller-content
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

        .seller-content
          :is(
            .ant-card,
            .ant-table-wrapper,
            [class*="-card"],
            [class*="-panel"],
            [class*="-table"]
          ) {
          contain: layout paint;
        }

        .seller-content
          :is(
            .ant-card,
            [class*="-card"],
            [class*="-panel"]
          ) {
          transition:
            border-color 150ms ease,
            background-color 150ms ease,
            color 150ms ease !important;
        }

        .seller-content
          :is(
            .ant-card,
            [class*="-card"],
            [class*="-panel"]
          ):hover {
          border-color: #b7ddd8 !important;
          box-shadow: 0 8px 18px rgba(11, 47, 42, 0.045) !important;
          transform: none !important;
        }

        .seller-content [class*="-hero"] {
          box-shadow: 0 10px 22px rgba(11, 47, 42, 0.055) !important;
          contain: paint;
        }

        .seller-content.is-scrolling
          :is(
            .ant-card,
            .ant-table-wrapper,
            [class*="-card"],
            [class*="-panel"],
            [class*="-table"],
            [class*="-hero"]
          ) {
          box-shadow: 0 8px 18px rgba(11, 47, 42, 0.04) !important;
          transform: none !important;
        }

        .seller-content.is-scrolling
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

        .seller-content .ant-table-tbody > tr > td {
          transition: background-color 140ms ease;
        }

        @keyframes seller-page-enter {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @media (max-width: 900px) {
          .seller-header {
            height: auto;
            min-height: 72px;
            padding: 14px 18px;
            align-items: flex-start;
            flex-direction: column;
          }

          .seller-header-actions {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .seller-content {
            height: calc(100vh - 148px);
            margin: 12px;
            padding: 16px;
            border-radius: 14px;
          }
        }
      `}</style>
    </>
  );
}
