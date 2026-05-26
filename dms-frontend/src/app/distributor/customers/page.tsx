"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ShopOutlined,
  TeamOutlined,
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
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import type { Customer } from "@/features/customers/customerTypes";
import { useGetSellerUsersQuery } from "@/features/users/userService";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

const isMongoId = (value: string) => /^[a-f\d]{24}$/i.test(value);

const getUserName = (
  user: Customer["assignedSeller"],
  sellerNameById: Map<string, string>,
) => {
  if (!user) return "-";
  if (typeof user === "string") {
    return sellerNameById.get(user) ?? (isMongoId(user) ? "-" : user);
  }
  return user.fullName || user.email || "-";
};

const statusMap = {
  pending: { color: "gold", text: "Chờ duyệt", icon: <ClockCircleOutlined /> },
  approved: { color: "green", text: "Đã duyệt", icon: <CheckCircleOutlined /> },
  rejected: { color: "red", text: "Từ chối", icon: <CloseCircleOutlined /> },
};

export default function DistributorCustomersPage() {
  const { data = [], isLoading, refetch } = useGetMyCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: sellers = [], refetch: refetchSellers } = useGetSellerUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useRealtimeRefetch(["new-notification", "customer-updated", "user-updated"], () => {
    refetch();
    refetchSellers();
  });

  const sellerNameById = useMemo(
    () =>
      new Map(
        sellers.map((seller) => [
          seller._id,
          seller.fullName || seller.email || seller.companyName || "-",
        ]),
      ),
    [sellers],
  );

  const stats = useMemo(
    () => ({
      total: data.length,
      approved: data.filter((item) => item.status === "approved").length,
      pending: data.filter((item) => item.status === "pending").length,
      rejected: data.filter((item) => item.status === "rejected").length,
    }),
    [data],
  );

  const approvedRate = stats.total
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;
  const latestCustomer = data[0];

  const columns: ColumnsType<Customer> = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      width: 260,
      ellipsis: true,
      render: (value: string, record) => (
        <Flex align="center" gap={12}>
          <div className="distributor-table-mark">
            <ShopOutlined />
          </div>
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Text strong ellipsis className="distributor-row-strong">
              {value}
            </Text>
            <Text ellipsis className="distributor-row-muted">
              {record.phone || "-"}
            </Text>
          </Flex>
        </Flex>
      ),
    },
    { title: "Địa chỉ", dataIndex: "address", ellipsis: true },
    {
      title: "DSR phụ trách",
      dataIndex: "assignedSeller",
      width: 190,
      render: (value) => (
        <Text className="distributor-row-muted">
          {getUserName(value, sellerNameById)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 150,
      render: (status: Customer["status"]) => {
        const item = statusMap[status];
        return (
          <Tag color={item.color} icon={item.icon} className="distributor-pill-tag">
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Link href={`/distributor/customers/${record._id}`}>
          <Button size="small" icon={<EyeOutlined />} className="distributor-row-action">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Khách hàng"
      title="Khách hàng đội DSR"
      description="Theo dõi điểm bán được gán cho các DSR cấp dưới."
    >
      <DistributorCommandCenter
        eyebrow="Outlet coverage"
        title="Nắm độ phủ điểm bán"
        description="Theo dõi trạng thái duyệt, hồ sơ điểm bán và DSR phụ trách để đảm bảo đội có đủ khách hàng hoạt động."
        meterValue={`${approvedRate}%`}
        meterLabel="Điểm bán đã duyệt"
        stats={[
          { label: "Tổng điểm bán", value: stats.total },
          { label: "Đã duyệt", value: stats.approved },
          { label: "Chờ duyệt", value: stats.pending },
        ]}
        progressLabel="Tỷ lệ điểm bán đã duyệt"
        progressValue={`${stats.approved}/${stats.total}`}
        progressPercent={approvedRate}
        feature={
          latestCustomer ? (
            <>
              <Text className="distributor-command-feature-label">Điểm bán gần nhất</Text>
              <Text ellipsis className="distributor-command-feature-title">
                {latestCustomer.name}
              </Text>
              <div className="distributor-command-feature-meta">
                <span>{getUserName(latestCustomer.assignedSeller, sellerNameById)}</span>
                <span>{latestCustomer.phone || "Chưa có SĐT"}</span>
              </div>
              <Tag color={statusMap[latestCustomer.status].color} className="distributor-pill-tag">
                {statusMap[latestCustomer.status].text}
              </Tag>
            </>
          ) : (
            <Text className="distributor-command-feature-empty">
              Chưa có khách hàng trong đội.
            </Text>
          )
        }
        statusItems={[
          { label: "Tổng điểm bán", value: stats.total, icon: <TeamOutlined /> },
          { label: "Đã duyệt", value: stats.approved, icon: <CheckCircleOutlined /> },
          { label: "Chờ duyệt", value: stats.pending, icon: <ClockCircleOutlined /> },
          { label: "Từ chối", value: stats.rejected, icon: <CloseCircleOutlined /> },
        ]}
      />

      <DistributorTableCard
        title="Danh sách điểm bán"
        description="Theo dõi trạng thái duyệt và DSR đang phụ trách từng khách hàng."
      >
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1040 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} điểm bán`,
          }}
          locale={{ emptyText: <Empty description="Chưa có khách hàng" /> }}
        />
      </DistributorTableCard>
    </DistributorPageShell>
  );
}
