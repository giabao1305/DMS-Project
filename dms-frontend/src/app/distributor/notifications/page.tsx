"use client";

import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { App, Button, Empty, Flex, List, Tag, Typography } from "antd";
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

const { Text } = Typography;

const typeLabel: Record<string, string> = {
  order: "Đơn hàng",
  leave: "Nghỉ phép",
  visit: "Ghé thăm",
  route: "Tuyến",
  inventory: "Tồn kho",
  promotion: "Khuyến mãi",
  system: "Hệ thống",
};

export default function DistributorNotificationsPage() {
  const { message } = App.useApp();
  const { data = [], isLoading } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: markingAll }] = useMarkAllAsReadMutation();

  const unread = data.filter((item) => !item.isRead).length;
  const read = data.length - unread;
  const unreadRate = data.length ? Math.round((unread / data.length) * 100) : 0;
  const latest = data[0];

  const typeCounts = useMemo(
    () =>
      data.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {}),
    [data],
  );

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
              <Text className="distributor-command-feature-label">Thông báo mới nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {latest.title}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{typeLabel[latest.type] ?? latest.type}</span>
                <span>{new Date(latest.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <Tag color={latest.isRead ? "default" : "cyan"} className="distributor-pill-tag">
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
          { label: "Đơn hàng", value: typeCounts.order ?? 0, icon: <BellOutlined /> },
          { label: "Tuyến", value: typeCounts.route ?? 0, icon: <ClockCircleOutlined /> },
          { label: "Ghé thăm", value: typeCounts.visit ?? 0, icon: <MailOutlined /> },
          { label: "Đã đọc", value: read, icon: <CheckCircleOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Dòng thông báo"
        description="Các thông báo chưa đọc được gắn nhãn mới để distributor xử lý nhanh."
      >
        <Flex justify="flex-end" style={{ padding: "14px 16px 0" }}>
          <Button
            loading={markingAll}
            disabled={unread === 0}
            onClick={async () => {
              await markAllAsRead().unwrap();
              message.success("Đã đánh dấu tất cả là đã đọc");
            }}
          >
            Đánh dấu đã đọc
          </Button>
        </Flex>
        <List
          loading={isLoading}
          dataSource={data}
          locale={{ emptyText: <Empty description="Chưa có thông báo" /> }}
          renderItem={(item) => (
            <List.Item
              className={item.isRead ? "distributor-notification-read" : ""}
              actions={[
                item.isRead ? null : (
                  <Button
                    key="read"
                    size="small"
                    type="link"
                    onClick={() => markAsRead(item._id)}
                  >
                    Đã đọc
                  </Button>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Flex align="center" gap={8} wrap="wrap">
                    <Text strong>{item.title}</Text>
                    {!item.isRead && <Tag color="cyan">Mới</Tag>}
                    <Tag>{typeLabel[item.type] ?? item.type}</Tag>
                  </Flex>
                }
                description={
                  <Flex vertical gap={4}>
                    <Text>{item.message}</Text>
                    <Text type="secondary">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </Text>
                  </Flex>
                }
              />
            </List.Item>
          )}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}
