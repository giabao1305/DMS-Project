"use client";

import {
  BellOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  NotificationOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Progress,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import type {
  Notification,
  NotificationType,
} from "@/features/notifications/notificationTypes";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/features/notifications/notificationService";
import { getSocket } from "@/lib/socket";

const { Text, Paragraph } = Typography;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  softPrimary: "#E7F8F5",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
  dark: "#07171F",
  darkMuted: "#A9D8D1",
};

const typeMap: Record<
  NotificationType,
  {
    color: string;
    soft: string;
    accent: string;
    icon: ReactNode;
    label: string;
  }
> = {
  order: {
    color: "blue",
    soft: "#EFF6FF",
    accent: "#2563EB",
    icon: <ShoppingCartOutlined />,
    label: "Đơn hàng",
  },
  route: {
    color: "purple",
    soft: "#F5F3FF",
    accent: "#7C3AED",
    icon: <EnvironmentOutlined />,
    label: "Tuyến",
  },
  visit: {
    color: "cyan",
    soft: "#ECFEFF",
    accent: "#0891B2",
    icon: <EnvironmentOutlined />,
    label: "Ghé thăm",
  },
  promotion: {
    color: "magenta",
    soft: "#FDF2F8",
    accent: "#DB2777",
    icon: <GiftOutlined />,
    label: "Khuyến mãi",
  },
  inventory: {
    color: "orange",
    soft: "#FFF7ED",
    accent: "#EA580C",
    icon: <TeamOutlined />,
    label: "Kho",
  },
  leave: {
    color: "gold",
    soft: "#FFFBEB",
    accent: "#D97706",
    icon: <ClockCircleOutlined />,
    label: "Nghỉ phép",
  },
  system: {
    color: "default",
    soft: "#F8FAFC",
    accent: "#475569",
    icon: <NotificationOutlined />,
    label: "Hệ thống",
  },
};

const getNotificationLink = (notification: Notification) => {
  if (!notification.relatedId) return null;

  switch (notification.type) {
    case "order":
      return `/seller/orders/${notification.relatedId}`;
    case "route":
      return `/seller/routes/${notification.relatedId}`;
    case "visit":
      return `/seller/visits/${notification.relatedId}`;
    case "leave":
      return `/seller/leaves/${notification.relatedId}`;
    case "promotion":
    case "inventory":
      return "/seller/orders/create";
    default:
      return null;
  }
};

export default function SellerNotificationsPage() {
  const { message } = App.useApp();
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useGetNotificationsQuery();

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllAsReadMutation();

  useEffect(() => {
    const socket = getSocket();

    const handleRefreshNotifications = () => {
      refetch();
    };

    socket.on("new-notification", handleRefreshNotifications);

    return () => {
      socket.off("new-notification", handleRefreshNotifications);
    };
  }, [refetch]);

  const notificationStats = useMemo(() => {
    const unread = notifications.filter((item) => !item.isRead).length;

    return {
      total: notifications.length,
      unread,
      read: notifications.length - unread,
    };
  }, [notifications]);

  const readRate = notificationStats.total
    ? Math.round((notificationStats.read / notificationStats.total) * 100)
    : 0;

  const latestNotification = useMemo(() => {
    if (!notifications.length) return undefined;

    return [...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [notifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch {
      message.error("Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      message.success("Đã đánh dấu tất cả là đã đọc");
    } catch {
      message.error("Không thể cập nhật thông báo");
    }
  };

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Thông báo"
        description="Theo dõi cập nhật đơn hàng, tuyến bán hàng và hoạt động liên quan."
        extra={
          <Flex gap={12} align="center" wrap="wrap">
            <Badge count={notificationStats.unread} offset={[-2, 6]} size="small">
              <div className="seller-notification-bell">
                <BellOutlined />
              </div>
            </Badge>

            <Button
              onClick={handleMarkAll}
              loading={isMarkingAll}
              className="seller-notification-secondary-button"
            >
              Đọc tất cả
            </Button>
          </Flex>
        }
      />

      <Flex className="seller-notification-stack" vertical gap={20}>
        <Card
          variant="borderless"
          className="seller-notification-command-card"
          styles={{ body: { padding: 0 } }}
        >
          <Flex className="seller-notification-command">
            <div className="seller-notification-command-dark">
              <Text className="seller-notification-command-eyebrow">
                Notification center
              </Text>
              <div className="seller-notification-command-title">
                Cập nhật mới trong công việc
              </div>
              <Text className="seller-notification-command-description">
                Ưu tiên xử lý thông báo chưa đọc, mở nhanh nội dung liên quan
                và giữ luồng bán hàng luôn rõ ràng.
              </Text>
            </div>

            <div className="seller-notification-command-summary">
              <Flex gap={14} wrap="wrap">
                <div className="seller-notification-command-stat">
                  <span>{notificationStats.total}</span>
                  <label>Tổng thông báo</label>
                </div>
                <div className="seller-notification-command-stat">
                  <span>{notificationStats.unread}</span>
                  <label>Chưa đọc</label>
                </div>
                <div className="seller-notification-command-stat">
                  <span>{readRate}%</span>
                  <label>Đã xử lý</label>
                </div>
              </Flex>

              <div className="seller-notification-progress-block">
                <Flex justify="space-between" align="center" gap={12}>
                  <Text className="seller-notification-progress-label">
                    Tỷ lệ thông báo đã đọc
                  </Text>
                  <Text className="seller-notification-progress-value">
                    {notificationStats.read}/{notificationStats.total}
                  </Text>
                </Flex>
                <Progress
                  percent={readRate}
                  strokeColor={COLORS.primary}
                  trailColor="#D9EEE9"
                  showInfo={false}
                />
              </div>

              <div className="seller-notification-latest-card">
                <Text className="seller-notification-latest-label">
                  Thông báo gần nhất
                </Text>
                {latestNotification ? (
                  <>
                    <Text ellipsis className="seller-notification-latest-title">
                      {latestNotification.title}
                    </Text>
                    <Text ellipsis className="seller-notification-latest-message">
                      {latestNotification.message}
                    </Text>
                  </>
                ) : (
                  <Text className="seller-notification-latest-message">
                    Chưa có thông báo nào.
                  </Text>
                )}
              </div>
            </div>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-notification-section-title">
                Danh sách thông báo
              </Text>
              <Text className="seller-notification-section-description">
                Ưu tiên các thông báo chưa đọc và mở nhanh nội dung liên quan.
              </Text>
            </Flex>
          }
          className="seller-notification-section-card"
        >
          {isLoading ? (
            <Flex justify="center" align="center" className="seller-notification-state">
              <Spin size="large" />
            </Flex>
          ) : notifications.length === 0 ? (
            <Flex justify="center" align="center" className="seller-notification-state">
              <Empty description="Chưa có thông báo nào" />
            </Flex>
          ) : (
            <Flex vertical gap={12}>
              {notifications.map((notification) => {
                const type = typeMap[notification.type] ?? typeMap.system;
                const detailLink = getNotificationLink(notification);

                return (
                  <Card
                    key={notification._id}
                    variant="borderless"
                    className={
                      notification.isRead
                        ? "seller-notification-item-card"
                        : "seller-notification-item-card seller-notification-item-unread"
                    }
                  >
                    <Flex
                      justify="space-between"
                      align="flex-start"
                      gap={18}
                      wrap="wrap"
                    >
                      <Flex gap={14} align="flex-start" flex={1}>
                        <Badge dot={!notification.isRead}>
                          <div
                            className="seller-notification-type-icon"
                            style={{
                              color: type.accent,
                              background: type.soft,
                            }}
                          >
                            {type.icon}
                          </div>
                        </Badge>

                        <Flex vertical gap={8} flex={1} style={{ minWidth: 0 }}>
                          <Flex gap={8} wrap="wrap" align="center">
                            <Text strong className="seller-notification-item-title">
                              {notification.title}
                            </Text>

                            <Tag
                              color={type.color}
                              className="seller-notification-type-tag"
                            >
                              {type.label}
                            </Tag>

                            {!notification.isRead && (
                              <Tag
                                color="cyan"
                                className="seller-notification-type-tag"
                              >
                                Mới
                              </Tag>
                            )}
                          </Flex>

                          <Paragraph className="seller-notification-item-message">
                            {notification.message}
                          </Paragraph>

                          <Text className="seller-notification-item-time">
                            {new Date(notification.createdAt).toLocaleString(
                              "vi-VN",
                            )}
                          </Text>
                        </Flex>
                      </Flex>

                      <Flex gap={10} wrap="wrap" className="seller-notification-actions">
                        {!notification.isRead && (
                          <Button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="seller-notification-secondary-button"
                          >
                            Đánh dấu đã đọc
                          </Button>
                        )}

                        {detailLink && (
                          <Link href={detailLink}>
                            <Button
                              type="primary"
                              className="seller-notification-primary-button"
                            >
                              Xem chi tiết
                            </Button>
                          </Link>
                        )}
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          )}
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-notification-stack {
          position: relative;
        }

        .seller-notification-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 208px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-notification-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-notification-bell {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
          background: ${COLORS.surface};
          color: ${COLORS.primary};
          font-size: 19px;
        }

        .seller-notification-command-card,
        .seller-notification-section-card,
        .seller-notification-item-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-notification-command {
          align-items: stretch;
        }

        .seller-notification-command-dark {
          width: 36%;
          min-width: 280px;
          min-height: 260px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-notification-command-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-notification-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .seller-notification-command-description {
          display: block;
          max-width: 420px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-notification-command-summary {
          flex: 1;
          min-height: 260px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          background: #ffffff;
        }

        .seller-notification-command-stat {
          min-width: 132px;
          flex: 1 1 132px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-notification-command-stat span {
          display: block;
          color: ${COLORS.text};
          font-size: 25px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-notification-command-stat label,
        .seller-notification-progress-value,
        .seller-notification-latest-message {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.4;
        }

        .seller-notification-command-stat label {
          display: block;
          margin-top: 5px;
        }

        .seller-notification-progress-block,
        .seller-notification-latest-card {
          padding: 14px 15px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-notification-progress-label {
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-notification-latest-card {
          background: ${COLORS.surface};
        }

        .seller-notification-latest-label {
          display: block;
          color: ${COLORS.primaryHover};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-notification-latest-title {
          display: block;
          margin-top: 8px;
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.3;
        }

        .seller-notification-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-notification-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-notification-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-notification-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-notification-state {
          min-height: 280px;
        }

        .seller-notification-item-card {
          box-shadow: 0 10px 26px rgba(11, 47, 42, 0.04);
        }

        .seller-notification-item-card .ant-card-body {
          padding: 18px;
        }

        .seller-notification-item-unread {
          border-color: #a9ddd6;
          background: linear-gradient(135deg, #e7f8f5 0%, #ffffff 62%);
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.08);
        }

        .seller-notification-type-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 48px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          font-size: 21px;
        }

        .seller-notification-item-title {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-notification-item-message {
          margin-bottom: 0 !important;
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.65;
        }

        .seller-notification-item-time {
          color: #8aa09d;
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-notification-type-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
        }

        .seller-notification-primary-button.ant-btn {
          height: 40px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 12px 24px rgba(13, 148, 136, 0.18);
        }

        .seller-notification-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-notification-secondary-button.ant-btn {
          height: 40px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-notification-secondary-button.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        @media (max-width: 900px) {
          .seller-notification-command {
            flex-direction: column;
          }

          .seller-notification-command-dark {
            width: 100%;
          }

          .seller-notification-actions {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
