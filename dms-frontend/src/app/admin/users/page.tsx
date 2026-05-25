"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { getRoleLabel } from "@/features/auth/roleUtils";
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useToggleUserStatusMutation,
} from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type UserStatusFilter = "all" | "active" | "inactive";

export default function UsersPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<UserStatusFilter>("all");

  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [toggleUserStatus, { isLoading: togglingStatus }] =
    useToggleUserStatusMutation();

  useRealtimeRefetch(["user-updated"], refetch);

  const sellerUsers = useMemo(
    () => users.filter((user) => user.role !== "admin"),
    [users],
  );

  const overview = useMemo(() => {
    const active = sellerUsers.filter((user) => user.isActive).length;
    const inactive = sellerUsers.length - active;

    return {
      total: sellerUsers.length,
      active,
      inactive,
    };
  }, [sellerUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return sellerUsers.filter((user) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        user.code?.toLowerCase().includes(normalizedKeyword) ||
        user.fullName.toLowerCase().includes(normalizedKeyword) ||
        user.email.toLowerCase().includes(normalizedKeyword) ||
        user.phone?.toLowerCase().includes(normalizedKeyword) ||
        user.companyName?.toLowerCase().includes(normalizedKeyword);
      const matchesStatus =
        status === "all" ||
        (status === "active" ? user.isActive : !user.isActive);

      return matchesKeyword && matchesStatus;
    });
  }, [keyword, sellerUsers, status]);

  const hasFilter = keyword.trim().length > 0 || status !== "all";

  const handleResetFilters = () => {
    setKeyword("");
    setStatus("all");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      message.success("Xóa nhân viên thành công");
    } catch {
      message.error("Xóa nhân viên thất bại");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleUserStatus(id).unwrap();
      message.success("Cập nhật trạng thái thành công");
    } catch {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: "Nhân viên",
      key: "employee",
      width: 300,
      fixed: "left",
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <Avatar size={42} src={record.avatar?.trim() || undefined} icon={<UserOutlined />} />
          <div className="admin-users-cell-copy">
            <Text className="admin-users-strong">{record.fullName}</Text>
            <Text className="admin-users-muted">{record.email}</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Mã",
      dataIndex: "code",
      width: 180,
      render: (value?: string) => (value ? <Text code>{value}</Text> : "-"),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 160,
      render: (phone?: string) => phone || "-",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 130,
      align: "center",
      render: (role: string) => (
        <Tag color="blue" className="admin-users-status-tag">
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: "Công ty",
      dataIndex: "companyName",
      width: 220,
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Mã số thuế",
      dataIndex: "taxCode",
      width: 160,
      render: (value?: string) => value || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 150,
      align: "center",
      render: (isActive: boolean, record) => (
        <Tag
          color={isActive ? "green" : "default"}
          className="admin-users-status-tag is-clickable"
          onClick={() => handleToggleStatus(record._id)}
        >
          {isActive ? "Hoạt động" : "Khóa"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 290,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={8} className="admin-users-actions">
          <Link href={`/admin/users/${record._id}`}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              className="admin-users-action-button"
            >
              Chi tiết
            </Button>
          </Link>

          <Link href={`/admin/users/${record._id}/edit`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              className="admin-users-action-button"
            >
              Sửa
            </Button>
          </Link>

          <Popconfirm
            title="Xóa nhân viên?"
            description="Bạn chắc chắn muốn xóa nhân viên này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              danger
              color="danger"
              variant="solid"
              icon={<DeleteOutlined />}
              className="admin-users-action-button"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Quản lý nhân viên"
        description="Quản lý tài khoản nhân viên bán hàng, thông tin liên hệ, công ty và trạng thái hoạt động."
        extra={
          <Link href="/admin/users/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm nhân viên
            </Button>
          </Link>
        }
      />

      <section className="admin-users-shell">
        <div className="admin-users-hero">
          <div>
            <Tag className="admin-users-hero-tag">Nhân sự bán hàng</Tag>
            <Title level={2} className="admin-users-hero-title">
              Điều phối nhân sự bán hàng
            </Title>
            <Text className="admin-users-hero-desc">
              Theo dõi tài khoản nhân viên, trạng thái đăng nhập và hồ sơ công ty
              phục vụ vận hành phân phối.
            </Text>

            <div className="admin-users-hero-metrics">
              <div>
                <TeamOutlined />
                <span>Tổng nhân viên</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <UserOutlined />
                <span>Đang hoạt động</span>
                <strong>{overview.active.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <UserOutlined />
                <span>Đang khóa</span>
                <strong>{overview.inactive.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-users-hero-panel">
            <TeamOutlined />
            <span>Kết quả lọc</span>
            <strong>{filteredUsers.length.toLocaleString("vi-VN")}</strong>
            <Text>nhân viên đang hiển thị</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-users-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-users-filter-title">
                Bộ lọc nhân viên
              </Title>
              <Text className="admin-users-filter-description">
                Tìm theo tên, email, số điện thoại, công ty hoặc lọc theo trạng
                thái tài khoản.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-users-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm tên, email, điện thoại, công ty"
                prefix={<SearchOutlined />}
                className="admin-users-search-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

              <Select<UserStatusFilter>
                size="large"
                value={status}
                onChange={setStatus}
                className="admin-users-status-select"
                options={[
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Hoạt động", value: "active" },
                  { label: "Khóa", value: "inactive" },
                ]}
              />

              {hasFilter ? (
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  className="admin-users-action-button"
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-users-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-users-panel-title">
                  Danh sách nhân viên
                </Text>
                <Text className="admin-users-panel-desc">
                  Hiển thị {filteredUsers.length.toLocaleString("vi-VN")} nhân
                  viên
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<User>
            rowKey="_id"
            loading={isLoading || deleting || togglingStatus}
            dataSource={filteredUsers}
            columns={columns}
            scroll={{ x: 1590 }}
            className="admin-users-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} nhân viên`,
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy nhân viên phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-users-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-users-hero {
          min-height: 230px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 230px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.22), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-users-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-users-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-users-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-users-hero-metrics {
          margin-top: 24px;
          max-width: 760px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-users-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-users-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-users-hero-metrics .anticon {
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

        .admin-users-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-users-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-users-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-users-hero-panel .anticon {
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

        .admin-users-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-users-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-users-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-users-filter-card,
        .admin-users-table-card {
          overflow: hidden;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .admin-users-filter-card:hover,
        .admin-users-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-users-filter-card {
          margin-bottom: 16px;
        }

        .admin-users-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-users-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-users-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-users-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-users-status-select {
          width: 210px !important;
        }

        .admin-users-search-input,
        .admin-users-status-select .ant-select-selector,
        .admin-users-action-button {
          border-radius: 8px !important;
        }

        .admin-users-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-users-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-users-panel-title,
        .admin-users-panel-desc,
        .admin-users-strong,
        .admin-users-muted {
          display: block;
        }

        .admin-users-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-users-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-users-result-tag,
        .admin-users-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-users-status-tag {
          min-width: 94px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-users-status-tag.is-clickable {
          cursor: pointer;
          user-select: none;
        }

        .admin-users-table .ant-table,
        .admin-users-table .ant-table-container,
        .admin-users-table .ant-table-content,
        .admin-users-table .ant-table-body,
        .admin-users-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-users-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-users-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-users-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-users-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-users-table .ant-table-cell-fix-left,
        .admin-users-table .ant-table-cell-fix-left-first,
        .admin-users-table .ant-table-cell-fix-left-last,
        .admin-users-table .ant-table-cell-fix-right,
        .admin-users-table .ant-table-cell-fix-right-first,
        .admin-users-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-users-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .admin-users-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-users-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-first,
        .admin-users-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-users-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-users-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-users-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left,
        .admin-users-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
        .admin-users-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-first,
        .admin-users-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-last,
        .admin-users-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-users-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-users-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-users-cell-copy {
          min-width: 0;
        }

        .admin-users-strong {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-users-muted {
          max-width: 220px;
          overflow: hidden;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-users-actions {
          justify-content: center;
        }

        .admin-users-action-button {
          height: 40px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 1199px) {
          .admin-users-hero {
            grid-template-columns: 1fr;
          }

          .admin-users-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-users-hero-metrics > div {
            border-right: 0;
          }

          .admin-users-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-users-hero {
            padding: 20px;
          }

          .admin-users-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-users-filter-actions,
          .admin-users-search-input,
          .admin-users-status-select,
          .admin-users-action-button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
