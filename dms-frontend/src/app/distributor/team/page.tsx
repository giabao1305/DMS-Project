"use client";

import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  PhoneOutlined,
  PlusOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Dropdown,
  Empty,
  Flex,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import {
  useDeleteUserMutation,
  useGetSellerUsersQuery,
  useToggleUserStatusMutation,
} from "@/features/users/userService";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

export default function DistributorTeamPage() {
  const { message } = App.useApp();
  const {
    data = [],
    isLoading,
    refetch,
  } = useGetSellerUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [toggleUserStatus, { isLoading: togglingStatus }] =
    useToggleUserStatusMutation();

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

  const handleStatusChange = async (user: User, nextActive: boolean) => {
    if (user.isActive === nextActive) return;

    try {
      await toggleUserStatus(user._id).unwrap();
      message.success(nextActive ? "Đã mở khóa DSR" : "Đã khóa DSR");
    } catch (error) {
      message.error(orderApiMessage(error, "Không thể cập nhật trạng thái DSR"));
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user._id).unwrap();
      message.success("Xóa DSR thành công");
    } catch (error) {
      message.error(orderApiMessage(error, "Không thể xóa DSR"));
    }
  };

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
      title: "MST",
      dataIndex: "taxCode",
      width: 150,
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      align: "center",
      width: 160,
      render: (value: boolean, record) => (
        <Dropdown
          trigger={["click"]}
          menu={
            {
              selectedKeys: [value ? "active" : "inactive"],
              onClick: ({ key }) =>
                handleStatusChange(record, key === "active"),
              items: [
                {
                  key: "active",
                  label: (
                    <span className="distributor-team-status-menu-item is-active">
                      Hoạt động
                    </span>
                  ),
                },
                {
                  key: "inactive",
                  label: (
                    <span className="distributor-team-status-menu-item is-inactive">
                      Tạm khóa
                    </span>
                  ),
                },
              ],
            } satisfies MenuProps
          }
          overlayClassName="distributor-team-status-menu"
        >
          <Button
            size="small"
            loading={togglingStatus}
            className={`distributor-team-status-button ${
              value ? "is-active" : "is-inactive"
            }`}
          >
            <span className="distributor-team-status-dot" />
            <span>{value ? "Hoạt động" : "Tạm khóa"}</span>
            <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
    {
      title: "Thao tác",
      align: "center",
      width: 280,
      render: (_, record) => (
        <Space size={8} wrap>
          <Link href={`/distributor/team/${record._id}`}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              className="distributor-row-action distributor-row-action-view"
            >
              Chi tiết
            </Button>
          </Link>
          <Link href={`/distributor/team/${record._id}/edit`}>
            <Button
              size="small"
              icon={<EditOutlined />}
              className="distributor-row-action distributor-row-action-edit"
            >
              Sửa
            </Button>
          </Link>
          <Popconfirm
            title="Xóa DSR này?"
            description="Thao tác này sẽ xóa tài khoản DSR khỏi danh sách quản lý."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleting }}
            onConfirm={() => handleDelete(record)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              className="distributor-row-action distributor-row-action-delete"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Đội bán hàng"
      title="Đội DSR của tôi"
      description="Danh sách DSR được gán quản lý trực tiếp cho nhà phân phối."
      extra={
        <Link href="/distributor/team/create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="distributor-team-create-button"
          >
            Thêm DSR
          </Button>
        </Link>
      }
    >
      <DistributorCommandCenter
        eyebrow="Team command"
        title="Theo dõi sức khỏee đội DSR"
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
                <span>{highlightDsr.taxCode || "Chưa có MST"}</span>
              </div>
              <Tag
                color={highlightDsr.isActive ? "blue" : "red"}
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
        <div className="distributor-team-list">
          <Table
            rowKey="_id"
            loading={isLoading}
            columns={columns}
            dataSource={data}
            scroll={{ x: 1220 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} DSR`,
            }}
            locale={{ emptyText: <Empty description="Chưa có DSR trong đội" /> }}
          />
        </div>
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-content
          .seller-page-header-extra
          .distributor-team-create-button.ant-btn-primary {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .seller-page-header-extra
          .distributor-team-create-button.ant-btn-primary:hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2) !important;
        }

        .distributor-team-status-button.ant-btn {
          width: 132px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px !important;
          border-radius: 999px !important;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          box-shadow: none !important;
        }

        .distributor-team-status-button.is-active.ant-btn {
          border-color: #bbf7d0 !important;
          color: #15803d !important;
          background: #f0fdf4 !important;
        }

        .distributor-team-status-button.is-inactive.ant-btn {
          border-color: #fecdd3 !important;
          color: #be123c !important;
          background: #fff1f2 !important;
        }

        .distributor-team-status-button.ant-btn:hover,
        .distributor-team-status-button.ant-btn:focus {
          transform: none !important;
        }

        .distributor-team-status-button.is-active.ant-btn:hover,
        .distributor-team-status-button.is-active.ant-btn:focus {
          border-color: #22c55e !important;
          color: #166534 !important;
          background: #dcfce7 !important;
        }

        .distributor-team-status-button.is-inactive.ant-btn:hover,
        .distributor-team-status-button.is-inactive.ant-btn:focus {
          border-color: #fb7185 !important;
          color: #9f1239 !important;
          background: #ffe4e6 !important;
        }

        .distributor-team-status-button .anticon-down {
          margin-left: auto;
          font-size: 9px;
        }

        .distributor-team-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: currentColor;
        }

        .distributor-team-status-menu .ant-dropdown-menu {
          min-width: 142px;
          padding: 6px !important;
          border: 1px solid #dbeafe;
          border-radius: 10px !important;
          box-shadow: 0 14px 28px rgba(11, 47, 42, 0.12) !important;
        }

        .distributor-team-status-menu .ant-dropdown-menu-item {
          min-height: 34px;
          border-radius: 8px !important;
          padding: 6px 8px !important;
        }

        .distributor-team-status-menu-item {
          width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 850;
        }

        .distributor-team-status-menu-item::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: currentColor;
        }

        .distributor-team-status-menu-item.is-active {
          color: #15803d;
        }

        .distributor-team-status-menu-item.is-inactive {
          color: #be123c;
        }
      `}</style>
    </DistributorPageShell>
  );
}





