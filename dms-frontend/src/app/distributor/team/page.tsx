"use client";

import {
  CheckCircleOutlined,
  EyeOutlined,
  PhoneOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Empty, Flex, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { useGetSellerUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

export default function DistributorTeamPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useGetSellerUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(["user-updated", "new-notification"], refetch);

  const stats = useMemo(
    () => ({
      total: data.length,
      active: data.filter((item) => item.isActive).length,
      inactive: data.filter((item) => !item.isActive).length,
      hasPhone: data.filter((item) => Boolean(item.phone)).length,
    }),
    [data],
  );

  const activeRate = stats.total
    ? Math.round((stats.active / stats.total) * 100)
    : 0;
  const highlightDsr = data.find((item) => item.isActive) ?? data[0];

  const columns: ColumnsType<User> = [
    {
      title: "DSR",
      dataIndex: "fullName",
      ellipsis: true,
      width: 260,
      render: (value: string, record) => (
        <Flex align="center" gap={12}>
          <div className="distributor-table-mark">
            <UserOutlined />
          </div>
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Text strong ellipsis className="distributor-row-strong">
              {value}
            </Text>
            <Text ellipsis className="distributor-row-muted">
              {record.code ? `${record.code} · ${record.email}` : record.email}
            </Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 150,
      render: (value?: string) => value || "-",
    },
    {
      title: "Khu vực/Công ty",
      dataIndex: "companyName",
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      align: "center",
      width: 150,
      render: (value: boolean) => (
        <Tag color={value ? "green" : "red"} className="distributor-pill-tag">
          {value ? "Hoạt động" : "Tạm khóa"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Link href={`/distributor/team/${record._id}`}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            className="distributor-row-action"
          >
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Đội bán hàng"
      title="Đội DSR của tôi"
      description="Danh sách DSR được gán quản lý trực tiếp cho nhà phân phối."
    >
      <DistributorCommandCenter
        eyebrow="Team command"
        title="Theo dõi sức khỏe đội DSR"
        description="Nắm nhanh số nhân sự đang hoạt động, hồ sơ liên hệ và trạng thái sẵn sàng nhận tuyến."
        meterValue={`${activeRate}%`}
        meterLabel="DSR đang hoạt động"
        stats={[
          { label: "Tổng DSR", value: stats.total },
          { label: "Hoạt động", value: stats.active },
          { label: "Có liên hệ", value: stats.hasPhone },
        ]}
        progressLabel="Tỷ lệ đội đang hoạt động"
        progressValue={`${stats.active}/${stats.total}`}
        progressPercent={activeRate}
        feature={
          highlightDsr ? (
            <>
              <Text className="distributor-command-feature-label">
                DSR nổi bật
              </Text>
              <Text ellipsis className="distributor-command-feature-title">
                {highlightDsr.fullName}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{highlightDsr.email}</span>
                <span>{highlightDsr.code || "Chưa có mã DSR"}</span>
                <span>{highlightDsr.phone || "Chưa có SĐT"}</span>
              </div>
              <Tag
                color={highlightDsr.isActive ? "green" : "red"}
                className="distributor-pill-tag"
              >
                {highlightDsr.isActive ? "Hoạt động" : "Tạm khóa"}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có DSR trong đội.
            </Text>
          )
        }
        statusItems={[
          { label: "Tổng DSR", value: stats.total, icon: <TeamOutlined /> },
          {
            label: "Hoạt động",
            value: stats.active,
            icon: <CheckCircleOutlined />,
          },
          { label: "Tạm khóa", value: stats.inactive, icon: <StopOutlined /> },
          { label: "Có SĐT", value: stats.hasPhone, icon: <PhoneOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Danh sách DSR"
        description="Theo dõi trạng thái, khu vực và thông tin liên hệ của từng nhân sự."
      >
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1080 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} DSR`,
          }}
          locale={{ emptyText: <Empty description="Chưa có DSR trong đội" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}
