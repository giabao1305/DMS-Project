"use client";

import type { ReactNode } from "react";

import { useEffect } from "react";

import {
  BellOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { Avatar, Flex, notification, Tag, Typography } from "antd";

import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket";
import { useAppSelector } from "@/store/hooks";

const { Text } = Typography;

type NotificationType = "order" | "success" | "warning" | "system";

type NotificationPayload = {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  isRead: boolean;
};

type NotificationConfig = {
  color: string;
  icon: ReactNode;
  label: string;
};

const notificationConfig: Record<NotificationType, NotificationConfig> = {
  order: {
    color: "#1677ff",
    icon: <BellOutlined />,
    label: "Đơn hàng",
  },

  success: {
    color: "#52c41a",
    icon: <CheckCircleOutlined />,
    label: "Thành công",
  },

  warning: {
    color: "#faad14",
    icon: <WarningOutlined />,
    label: "Cảnh báo",
  },

  system: {
    color: "#722ed1",
    icon: <InfoCircleOutlined />,
    label: "Hệ thống",
  },
};

export default function SocketProvider() {
  const [api, contextHolder] = notification.useNotification();

  const user = useAppSelector((state) => state.auth.user);

  useSocket({
    userId: user?._id,
    role: user?.role,
  });

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();

    const handleNewNotification = (data: NotificationPayload) => {
      const config =
        notificationConfig[data.type as keyof typeof notificationConfig] ??
        notificationConfig.system;

      api.open({
        placement: "topRight",
        duration: 4,
        className: "dms-notification",

        message: (
          <Flex align="center" justify="space-between" gap={12}>
            <Flex align="center" gap={10}>
              <Avatar
                size={42}
                icon={config.icon}
                style={{
                  background: config.color,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  flexShrink: 0,
                }}
              />

              <div>
                <Text strong style={{ fontSize: 16, display: "block" }}>
                  {data.title}
                </Text>

                <Tag color={config.color}>{config.label}</Tag>
              </div>
            </Flex>
          </Flex>
        ),

        description: data.message,
      });
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [api, user?._id]);

  return <>{contextHolder}</>;
}
