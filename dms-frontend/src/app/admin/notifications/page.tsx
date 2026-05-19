"use client";

import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  GiftOutlined,
  NotificationOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Empty,
  Flex,
  Input,
  Pagination,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useGetNotificationsPageQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/features/notifications/notificationService";
import type {
  Notification,
  NotificationType,
} from "@/features/notifications/notificationTypes";
import { getSocket } from "@/lib/socket";

const { Text, Title } = Typography;

type StatusFilter = "all" | "unread" | "read";
type TypeFilter = "all" | NotificationType;

const emptyNotifications: Notification[] = [];

const typeMap: Record<
  NotificationType,
  {
    label: string;
    color: string;
    accent: string;
    soft: string;
    icon: ReactNode;
  }
> = {
  order: {
    label: "Đơn hàng",
    color: "blue",
    accent: "#2563eb",
    soft: "#eff6ff",
    icon: <ShoppingCartOutlined />,
  },
  leave: {
    label: "Nghỉ phép",
    color: "orange",
    accent: "#f59e0b",
    soft: "#fffbeb",
    icon: <ClockCircleOutlined />,
  },
  visit: {
    label: "Ghé thăm",
    color: "green",
    accent: "#10b981",
    soft: "#ecfdf5",
    icon: <TeamOutlined />,
  },
  route: {
    label: "Tuyến",
    color: "purple",
    accent: "#7c3aed",
    soft: "#f5f3ff",
    icon: <EnvironmentOutlined />,
  },
  inventory: {
    label: "Kho",
    color: "red",
    accent: "#ef4444",
    soft: "#fef2f2",
    icon: <DatabaseOutlined />,
  },
  promotion: {
    label: "Khuyến mãi",
    color: "gold",
    accent: "#d97706",
    soft: "#fffbeb",
    icon: <GiftOutlined />,
  },
  system: {
    label: "Hệ thống",
    color: "default",
    accent: "#64748b",
    soft: "#f8fafc",
    icon: <NotificationOutlined />,
  },
};

const getNotificationLink = (notification: Notification) => {
  if (!notification.relatedId) return null;

  switch (notification.type) {
    case "order":
      return `/admin/orders/${notification.relatedId}`;
    case "leave":
      return `/admin/leaves/${notification.relatedId}`;
    case "visit":
      return `/admin/visits/${notification.relatedId}`;
    case "route":
      return `/admin/routes/${notification.relatedId}`;
    case "inventory":
      return "/admin/inventory";
    case "promotion":
      return `/admin/promotions/${notification.relatedId}/edit`;
    case "system":
      return `/admin/customers/${notification.relatedId}`;
    default:
      return null;
  }
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

export default function AdminNotificationsPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      search: keyword.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [keyword, limit, page, statusFilter, typeFilter],
  );

  const {
    data: notificationsPage,
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsPageQuery(queryArgs);

  const notifications = notificationsPage?.data ?? emptyNotifications;
  const meta = notificationsPage?.meta;

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: readingAll }] = useMarkAllAsReadMutation();

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
    const latest = [...notifications].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )[0];

    return {
      total: notifications.length,
      unread,
      read: notifications.length - unread,
      latest,
    };
  }, [notifications]);


  const hasFilter =
    keyword.trim().length > 0 ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  const handleRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
      message.success("Đã đọc thông báo");
    } catch {
      message.error("Cập nhật thất bại");
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead().unwrap();
      message.success("Đã đọc tất cả thông báo");
    } catch {
      message.error("Cập nhật thất bại");
    }
  };

  const handleResetFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPage(1);
  };

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Thông báo"
        description="Theo dõi hoạt động mới của hệ thống và mở nhanh nội dung cần xử lý."
        extra={
          <Flex gap={10} align="center" wrap="wrap">
            <Tag color="blue" className="admin-notifications-unread-tag">
              Chưa đọc: {notificationStats.unread}
            </Tag>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={readingAll}
              onClick={handleReadAll}
              disabled={notificationStats.unread === 0}
            >
              Đọc tất cả
            </Button>
          </Flex>
        }
      />

      <section className="admin-notifications-shell">
        <div className="admin-notifications-hero">
          <div>
            <Tag className="admin-notifications-hero-tag">Notification Center</Tag>
            <Title level={2} className="admin-notifications-hero-title">
              Trung tâm thông báo
            </Title>
            <Text className="admin-notifications-hero-desc">
              Ưu tiên thông báo chưa đọc, lọc theo nghiệp vụ và đi thẳng tới nội
              dung liên quan.
            </Text>

            <div className="admin-notifications-hero-metrics">
              <div>
                <BellOutlined />
                <span>Tổng thông báo</span>
                <strong>{notificationStats.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <Badge dot={notificationStats.unread > 0}>
                  <ClockCircleOutlined />
                </Badge>
                <span>Chưa đọc</span>
                <strong>{notificationStats.unread.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CheckOutlined />
                <span>Đã đọc</span>
                <strong>{notificationStats.read.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-notifications-hero-panel">
            <NotificationOutlined />
            <span>Thông báo gần nhất</span>
            <strong>{notificationStats.latest?.title || "Chưa có thông báo"}</strong>
            <Text>
              {notificationStats.latest
                ? formatDateTime(notificationStats.latest.createdAt)
                : "Danh sách đang trống"}
            </Text>
          </div>
        </div>

        <div className="admin-notifications-filter">
          <div>
            <Title level={5} className="admin-notifications-filter-title">
              Bộ lọc thông báo
            </Title>
            <Text className="admin-notifications-filter-description">
              Tìm theo tiêu đề, nội dung hoặc loại thông báo.
            </Text>
          </div>

          <Flex gap={12} wrap="wrap" className="admin-notifications-filter-actions">
            <Input
              allowClear
              size="large"
              placeholder="Tìm thông báo"
              prefix={<SearchOutlined />}
              className="admin-notifications-search-input"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
            />

            <Select<StatusFilter>
              size="large"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              className="admin-notifications-select"
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Chưa đọc", value: "unread" },
                { label: "Đã đọc", value: "read" },
              ]}
            />

            <Select<TypeFilter>
              size="large"
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
              className="admin-notifications-select"
              options={[
                { label: "Tất cả loại", value: "all" },
                ...Object.entries(typeMap).map(([value, config]) => ({
                  label: config.label,
                  value: value as NotificationType,
                })),
              ]}
            />

            {hasFilter ? (
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                className="admin-notifications-reset-button"
              >
                Xóa bộ lọc
              </Button>
            ) : null}
          </Flex>
        </div>

        <div className="admin-notifications-list-panel">
          <Flex align="center" justify="space-between" gap={14} wrap="wrap">
            <div>
              <Text className="admin-notifications-panel-title">
                Danh sách thông báo
              </Text>
              <Text className="admin-notifications-panel-desc">
                Hiển thị {notifications.length.toLocaleString("vi-VN")} / {" "}
                {(meta?.total ?? notifications.length).toLocaleString("vi-VN")} thông báo
              </Text>
            </div>
            <Tag color="blue" className="admin-notifications-result-tag">
              Realtime notification monitoring
            </Tag>
          </Flex>

          <div className="admin-notifications-list">
            {isLoading || isFetching ? (
              <Flex justify="center" align="center" className="admin-notifications-state">
                <Spin size="large" />
              </Flex>
            ) : notifications.length === 0 ? (
              <Flex justify="center" align="center" className="admin-notifications-state">
                <Empty description="Không có thông báo phù hợp" />
              </Flex>
            ) : (
              notifications.map((item: Notification) => {
                const type = typeMap[item.type] ?? typeMap.system;
                const detailLink = getNotificationLink(item);

                return (
                  <div
                    key={item._id}
                    className={
                      item.isRead
                        ? "admin-notifications-item"
                        : "admin-notifications-item is-unread"
                    }
                  >
                    <Flex
                      justify="space-between"
                      align="flex-start"
                      gap={16}
                      wrap="wrap"
                    >
                      <Flex align="flex-start" gap={14} flex={1}>
                        <Badge dot={!item.isRead}>
                          <div
                            className="admin-notifications-type-icon"
                            style={
                              {
                                "--notification-accent": type.accent,
                                "--notification-soft": type.soft,
                              } as CSSProperties
                            }
                          >
                            {type.icon}
                          </div>
                        </Badge>

                        <div className="admin-notifications-item-copy">
                          <Flex gap={8} wrap="wrap" align="center">
                            <Text className="admin-notifications-item-title">
                              {item.title}
                            </Text>

                            <Tag
                              color={type.color}
                              className="admin-notifications-type-tag"
                            >
                              {type.label}
                            </Tag>

                            {!item.isRead && (
                              <Tag
                                color="cyan"
                                className="admin-notifications-type-tag"
                              >
                                Mới
                              </Tag>
                            )}
                          </Flex>

                          <Text className="admin-notifications-item-message">
                            {item.message}
                          </Text>

                          <Text className="admin-notifications-item-time">
                            {formatDateTime(item.createdAt)}
                          </Text>
                        </div>
                      </Flex>

                      <Flex gap={8} wrap="wrap" className="admin-notifications-actions">
                        {!item.isRead && (
                          <Button
                            icon={<CheckOutlined />}
                            onClick={() => handleRead(item._id)}
                            className="admin-notifications-action-button"
                          >
                            Đã đọc
                          </Button>
                        )}

                        {detailLink && (
                          <Link href={detailLink}>
                            <Button
                              type="primary"
                              icon={<EyeOutlined />}
                              className="admin-notifications-action-button"
                            >
                              Chi tiết
                            </Button>
                          </Link>
                        )}
                      </Flex>
                    </Flex>
                  </div>
                );
              })
            )}
          </div>

          {(meta?.total ?? 0) > 0 && (
            <Flex justify="flex-end" className="admin-notifications-pagination">
              <Pagination
                current={meta?.page ?? page}
                pageSize={meta?.limit ?? limit}
                total={meta?.total ?? notifications.length}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
                showTotal={(total) => `Tổng ${total} thông báo`}
                onChange={(nextPage, nextLimit) => {
                  setPage(nextPage);
                  setLimit(nextLimit);
                }}
              />
            </Flex>
          )}
        </div>
      </section>

      <style jsx global>{`
        .admin-notifications-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-notifications-hero {
          min-height: 230px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 270px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            radial-gradient(circle at 86% 18%, rgba(14, 165, 233, 0.26), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-notifications-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-notifications-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-notifications-hero-desc.ant-typography {
          display: block;
          max-width: 720px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-notifications-hero-metrics {
          margin-top: 24px;
          max-width: 760px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-notifications-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-notifications-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-notifications-hero-metrics .anticon {
          grid-row: 1 / span 2;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          background: rgba(14, 165, 233, 0.3);
        }

        .admin-notifications-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-notifications-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-notifications-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-notifications-hero-panel .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #2563eb;
        }

        .admin-notifications-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-notifications-hero-panel strong {
          margin-top: 8px;
          overflow: hidden;
          color: #ffffff;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-notifications-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-notifications-filter,
        .admin-notifications-list-panel {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055);
        }

        .admin-notifications-filter {
          margin-bottom: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .admin-notifications-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-notifications-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-notifications-search-input {
          width: 320px !important;
          max-width: 100%;
        }

        .admin-notifications-select {
          width: 190px !important;
        }

        .admin-notifications-search-input,
        .admin-notifications-select .ant-select-selector,
        .admin-notifications-reset-button,
        .admin-notifications-action-button {
          border-radius: 8px !important;
        }

        .admin-notifications-list-panel {
          padding: 18px;
        }

        .admin-notifications-pagination {
          margin-top: 18px;
        }

        .admin-notifications-list {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .admin-notifications-state {
          min-height: 260px;
        }

        .admin-notifications-panel-title,
        .admin-notifications-panel-desc {
          display: block;
        }

        .admin-notifications-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-notifications-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-notifications-unread-tag,
        .admin-notifications-result-tag,
        .admin-notifications-type-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .admin-notifications-item {
          padding: 16px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .admin-notifications-item:hover {
          border-color: #b9cce5;
          background: #f8fbff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055);
        }

        .admin-notifications-item.is-unread {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 64%);
        }

        .admin-notifications-type-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 46px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          color: var(--notification-accent);
          background: var(--notification-soft);
          font-size: 20px;
        }

        .admin-notifications-item-copy {
          min-width: 0;
          flex: 1;
        }

        .admin-notifications-item-title {
          color: #0f172a !important;
          font-size: 14.5px;
          font-weight: 900;
          line-height: 1.45;
        }

        .admin-notifications-item-message {
          display: block;
          margin-top: 8px;
          color: #64748b !important;
          font-size: 13px;
          line-height: 1.6;
        }

        .admin-notifications-item-time {
          display: block;
          margin-top: 8px;
          color: #94a3b8 !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-notifications-actions {
          flex-shrink: 0;
        }

        .admin-notifications-action-button,
        .admin-notifications-reset-button {
          height: 40px !important;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-notifications-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .admin-notifications-hero {
            padding: 20px;
          }

          .admin-notifications-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-notifications-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-notifications-hero-metrics > div {
            border-right: 0;
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-notifications-hero-metrics > div:last-child {
            border-bottom: 0;
          }

          .admin-notifications-filter-actions,
          .admin-notifications-search-input,
          .admin-notifications-select,
          .admin-notifications-reset-button,
          .admin-notifications-actions {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
