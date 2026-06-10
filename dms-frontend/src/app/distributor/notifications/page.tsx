"use client";

import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MailOutlined,
  NotificationOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { App, Button, Empty, Flex, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/features/notifications/notificationService";
import type {
  Notification,
  NotificationType,
} from "@/features/notifications/notificationTypes";

const { Text } = Typography;

const typeConfig: Record<
  NotificationType,
  { label: string; color: string; accent: string; soft: string }
> = {
  order: {
    label: "Đơn hàng",
    color: "blue",
    accent: "#2563eb",
    soft: "#dbeafe",
  },
  leave: {
    label: "Nghỉ phép",
    color: "gold",
    accent: "#d97706",
    soft: "#fef3c7",
  },
  visit: {
    label: "Ghé thăm",
    color: "cyan",
    accent: "#0891b2",
    soft: "#cffafe",
  },
  route: {
    label: "Tuyến",
    color: "blue",
    accent: "#2563eb",
    soft: "#dbeafe",
  },
  inventory: {
    label: "Tồn kho",
    color: "green",
    accent: "#16a34a",
    soft: "#dcfce7",
  },
  promotion: {
    label: "Khuyến mãi",
    color: "magenta",
    accent: "#db2777",
    soft: "#fce7f3",
  },
  system: {
    label: "Hệ thống",
    color: "default",
    accent: "#475569",
    soft: "#f1f5f9",
  },
};

const getNotificationLink = (notification: Notification) => {
  if (!notification.relatedId) return null;

  switch (notification.type) {
    case "order":
      return `/distributor/orders/${notification.relatedId}`;
    case "leave":
      return `/distributor/leaves/${notification.relatedId}`;
    case "visit":
      return `/distributor/visits/${notification.relatedId}`;
    case "route":
      return `/distributor/routes/${notification.relatedId}`;
    case "inventory":
      return "/distributor/warehouse";
    case "promotion":
      return null;
    case "system":
      return null;
    default:
      return null;
  }
};

export default function DistributorNotificationsPage() {
  const { message } = App.useApp();
  const { data = [], isLoading } = useGetNotificationsQuery();
  const [markAsRead, { isLoading: markingOne }] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: markingAll }] = useMarkAllAsReadMutation();

  const unread = data.filter((item) => !item.isRead).length;
  const read = data.length - unread;
  const unreadRate = data.length ? Math.round((unread / data.length) * 100) : 0;

  const latest = useMemo(() => {
    if (!data.length) return undefined;
    return [...data].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [data]);

  const typeCounts = useMemo(
    () =>
      data.reduce<Record<NotificationType, number>>(
        (acc, item) => {
          acc[item.type] = (acc[item.type] ?? 0) + 1;
          return acc;
        },
        {
          order: 0,
          leave: 0,
          visit: 0,
          route: 0,
          inventory: 0,
          promotion: 0,
          system: 0,
        },
      ),
    [data],
  );

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      message.success("Đã đánh dấu tất cả là đã đọc");
    } catch {
      message.error("Không thể đánh dấu tất cả là đã đọc");
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
      message.success("Đã đánh dấu là đã đọc");
    } catch {
      message.error("Không thể đánh dấu thông báo");
    }
  };

  return (
    <DistributorPageShell
      eyebrow="Thông báo"
      title="Trung tâm thông báo"
      description="Theo dõi các cập nhật liên quan đến đơn hàng, tuyến, ghé thăm và hoạt động của đội DSR."
    >
      <DistributorCommandCenter
        eyebrow="Notification center"
        title="Không bỏ lỡ cập nhật đội"
        description="Theo dõi thông báo mới, loại nghiệp vụ phát sinh và các cập nhật cần distributor xem trong ngày."
        meterValue={unread}
        meterLabel="Thông báo chưa đọc"
        stats={[
          { label: "Tổng thông báo", value: data.length },
          { label: "Chưa đọc", value: unread },
          { label: "Đã đọc", value: read },
        ]}
        progressLabel="Tỷ lệ thông báo chưa đọc"
        progressValue={`${unread}/${data.length}`}
        progressPercent={unreadRate}
        feature={
          latest ? (
            <>
              <Text className="distributor-command-feature-label">
                Thông báo mới nhất
              </Text>
              <Text ellipsis className="distributor-command-feature-title">
                {latest.title}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{typeConfig[latest.type].label}</span>
                <span>{new Date(latest.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <Tag
                color={latest.isRead ? "default" : "blue"}
                className="distributor-pill-tag"
              >
                {latest.isRead ? "Đã đọc" : "Mới"}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có thông báo nào.
            </Text>
          )
        }
        statusItems={[
          {
            label: "Đơn hàng",
            value: typeCounts.order,
            icon: <BellOutlined />,
          },
          {
            label: "Tuyến",
            value: typeCounts.route,
            icon: <ClockCircleOutlined />,
          },
          {
            label: "Ghé thăm",
            value: typeCounts.visit,
            icon: <MailOutlined />,
          },
          {
            label: "Đã đọc",
            value: read,
            icon: <CheckCircleOutlined />,
          },
        ]}
      />

      <DistributorTableCard
        title="Dòng thông báo"
        description="Các thông báo chưa đọc được gắn nhãn mới để distributor xử lý nhanh."
        extra={
          <Button
            icon={<ReadOutlined />}
            loading={markingAll}
            disabled={unread === 0}
            onClick={handleMarkAll}
            className="distributor-notification-action"
          >
            Đánh dấu đã đọc
          </Button>
        }
      >
        <div className="distributor-notification-list">
          {isLoading ? (
            <Flex
              justify="center"
              align="center"
              className="distributor-notification-state"
            >
              <Text type="secondary">Đang tải thông báo...</Text>
            </Flex>
          ) : data.length === 0 ? (
            <Flex
              justify="center"
              align="center"
              className="distributor-notification-state"
            >
              <Empty description="Chưa có thông báo" />
            </Flex>
          ) : (
            data.map((item) => {
              const config = typeConfig[item.type];
              const detailLink = getNotificationLink(item);

              return (
                <div
                  key={item._id}
                  className={
                    item.isRead
                      ? "distributor-notification-item"
                      : "distributor-notification-item is-unread"
                  }
                >
                  <Flex gap={14} align="flex-start" className="distributor-notification-main">
                    <span
                      className="distributor-notification-type-icon"
                      style={
                        {
                          "--notification-accent": config.accent,
                          "--notification-soft": config.soft,
                        } as React.CSSProperties
                      }
                    >
                      <NotificationOutlined />
                    </span>

                    <div className="distributor-notification-copy">
                      <Flex align="center" gap={8} wrap="wrap">
                        <Text className="distributor-notification-title">
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <Tag color="blue" className="distributor-pill-tag">
                            Mới
                          </Tag>
                        )}
                        <Tag
                          color={config.color}
                          className="distributor-pill-tag"
                        >
                          {config.label}
                        </Tag>
                      </Flex>
                      <Text className="distributor-notification-message">
                        {item.message}
                      </Text>
                      <Text className="distributor-notification-time">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </Text>
                    </div>
                  </Flex>

                  <Flex gap={8} wrap="wrap" className="distributor-notification-actions">
                    {!item.isRead && (
                      <Button
                        size="small"
                        loading={markingOne}
                        onClick={() => handleMarkOne(item._id)}
                        className="distributor-notification-action"
                      >
                        Đã đọc
                      </Button>
                    )}
                    {detailLink && (
                      <Link href={detailLink}>
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          className="distributor-row-action distributor-row-action-view"
                        >
                          Xem
                        </Button>
                      </Link>
                    )}
                  </Flex>
                </div>
              );
            })
          )}
        </div>
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-notification-list {
          display: grid;
          gap: 10px;
          padding: 14px;
        }

        .distributor-notification-state {
          min-height: 220px;
        }

        .distributor-notification-item {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .distributor-notification-item:hover {
          border-color: #bfdbfe;
          background: #f8fbff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.07);
        }

        .distributor-notification-item.is-unread {
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        .distributor-notification-main {
          min-width: 0;
          flex: 1 1 auto;
        }

        .distributor-notification-type-icon {
          display: inline-flex;
          width: 42px;
          height: 42px;
          min-width: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: var(--notification-accent);
          background: var(--notification-soft);
        }

        .distributor-notification-copy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .distributor-notification-title {
          color: #0f172a !important;
          font-weight: 900;
          line-height: 1.35;
        }

        .distributor-notification-message {
          color: #334155 !important;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.55;
        }

        .distributor-notification-time {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 650;
        }

        .distributor-notification-actions {
          justify-content: flex-end;
          align-content: flex-start;
          min-width: 150px;
        }

        .distributor-notification-action {
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 767px) {
          .distributor-notification-item {
            flex-direction: column;
          }

          .distributor-notification-actions,
          .distributor-notification-actions .ant-btn,
          .distributor-notification-actions .ant-space-item {
            width: 100%;
          }
        }
      `}</style>
    </DistributorPageShell>
  );
}
