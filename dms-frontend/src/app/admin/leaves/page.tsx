"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Segmented,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TablePaginationConfig } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetLeavesPageQuery } from "@/features/leaves/leaveService";
import type { LeaveRequest, LeaveStatus } from "@/features/leaves/leaveTypes";
import { useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type LeaveRealtimePayload = {
  leave?: LeaveRequest;
};

type LeaveStatusFilter = "all" | LeaveStatus;

const emptyLeaves: LeaveRequest[] = [];

const statusMap: Record<LeaveStatus, { label: string; color: string }> = {
  pending: {
    label: "Chờ duyệt",
    color: "orange",
  },
  approved: {
    label: "Đã duyệt",
    color: "green",
  },
  rejected: {
    label: "Từ chối",
    color: "red",
  },
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN");
};

const getLeaveDays = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff)) return 0;

  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
};

const getSellerName = (seller: LeaveRequest["seller"]) => {
  if (typeof seller === "string")
    return /^[a-f\d]{24}$/i.test(seller) ? "-" : seller;
  return (seller as User)?.fullName || "-";
};

export default function AdminLeavesPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<LeaveStatusFilter>("all");
  const [distributor, setDistributor] = useState<string>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const searchKeyword = useDebouncedValue(keyword);
  const { data: users = [] } = useGetUsersQuery();
  const distributors = useMemo(
    () => users.filter((user) => user.role === "distributor" && user.isActive),
    [users],
  );

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      search: searchKeyword.trim() || undefined,
      status: status === "all" ? undefined : status,
      distributor,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [distributor, limit, page, searchKeyword, status],
  );

  const {
    data: leavesPage,
    isLoading,
    isFetching,
    refetch,
  } = useGetLeavesPageQuery(queryArgs);

  const leaves = leavesPage?.data ?? emptyLeaves;
  const meta = leavesPage?.meta;

  useRealtimeRefetch(["new-notification", "leave-updated"], refetch);

  const highlightedLeaveId = useRealtimeHighlight(
    ["leave-updated"],
    (payload) => (payload as LeaveRealtimePayload).leave?._id,
  );

  const overview = useMemo(() => {
    const pending = leaves.filter((leave) => leave.status === "pending").length;
    const approved = leaves.filter(
      (leave) => leave.status === "approved",
    ).length;
    const rejected = leaves.filter(
      (leave) => leave.status === "rejected",
    ).length;
    const totalDays = leaves.reduce(
      (sum, leave) => sum + getLeaveDays(leave.startDate, leave.endDate),
      0,
    );

    return {
      total: leaves.length,
      pending,
      approved,
      rejected,
      totalDays,
    };
  }, [leaves]);

  const handleStatusChange = (value: LeaveStatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  const handleDistributorChange = (value?: string) => {
    setDistributor(value);
    setPage(1);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setLimit(pagination.pageSize ?? 10);
  };

  const columns: ColumnsType<LeaveRequest> = useMemo(
    () => [
      {
        title: "Nhân viên",
        dataIndex: "seller",
        width: 240,
        ellipsis: true,
        render: (seller) => (
          <div className="admin-leaves-cell-copy">
            <Text className="admin-leaves-strong">{getSellerName(seller)}</Text>
            <Text className="admin-leaves-muted">Người gửi yêu cầu</Text>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 170,
        align: "center",
        render: (leaveStatus: LeaveStatus) => (
          <Tag
            color={statusMap[leaveStatus]?.color}
            className="admin-leaves-status-tag"
          >
            {statusMap[leaveStatus]?.label}
          </Tag>
        ),
      },
      {
        title: "Thời gian nghỉ",
        key: "leaveRange",
        width: 260,
        render: (_, record) => (
          <Flex align="center" gap={12}>
            <div className="admin-leaves-date-mark">
              <CalendarOutlined />
            </div>
            <div className="admin-leaves-cell-copy">
              <Text className="admin-leaves-strong">
                {formatDate(record.startDate)} - {formatDate(record.endDate)}
              </Text>
              <Text className="admin-leaves-muted">
                {getLeaveDays(record.startDate, record.endDate)} ngày nghỉ
              </Text>
            </div>
          </Flex>
        ),
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        width: 340,
        ellipsis: true,
        render: (value?: string) => (
          <Text className="admin-leaves-muted" ellipsis>
            {value || "-"}
          </Text>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        width: 170,
        render: (value: string) => (
          <Text className="admin-leaves-date">{formatDateTime(value)}</Text>
        ),
      },
      {
        title: "Hành động",
        key: "actions",
        align: "center",
        width: 150,
        fixed: "right",
        render: (_, record) => (
          <Link href={`/admin/leaves/${record._id}`}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              className="admin-leaves-action-button"
            >
              Chi tiết
            </Button>
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Quản lý nghỉ phép"
        description="Theo dõi, lọc và xử lý đơn xin nghỉ của nhân viên bán hàng trong hệ thống phân phối."
      />

      <section className="admin-leaves-shell">
        <div className="admin-leaves-hero">
          <div>
            <Tag className="admin-leaves-hero-tag">Quản lý nghỉ phép</Tag>
            <Title level={2} className="admin-leaves-hero-title">
              Điều phối nghỉ phép
            </Title>
            <Text className="admin-leaves-hero-desc">
              Theo dõi trạng thái xét duyệt, tổng ngày nghỉ và các yêu cầu cần
              admin phản hồi trong ngày.
            </Text>

            <div className="admin-leaves-hero-metrics">
              <div>
                <CalendarOutlined />
                <span>Tổng đơn</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <ClockCircleOutlined />
                <span>Chờ duyệt</span>
                <strong>{overview.pending.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CheckCircleOutlined />
                <span>Đã duyệt</span>
                <strong>{overview.approved.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CloseCircleOutlined />
                <span>Từ chối</span>
                <strong>{overview.rejected.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-leaves-hero-panel">
            <UserSwitchOutlined />
            <span>Tổng ngày nghỉ</span>
            <strong>{overview.totalDays.toLocaleString("vi-VN")}</strong>
            <Text>ngày được ghi nhận từ tất cả yêu cầu</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-leaves-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-leaves-filter-title">
                Bộ lọc nghỉ phép
              </Title>
              <Text className="admin-leaves-filter-description">
                Tìm theo nhân viên, lý do hoặc lọc theo trạng thái xét duyệt.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-leaves-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm nhân viên hoặc lý do"
                prefix={<SearchOutlined />}
                className="admin-leaves-search-input"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
              />

              <Segmented<LeaveStatusFilter>
                size="large"
                value={status}
                onChange={handleStatusChange}
                className="admin-leaves-status-select"
                options={[
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Chờ duyệt", value: "pending" },
                  { label: "Đã duyệt", value: "approved" },
                  { label: "Từ chối", value: "rejected" },
                ]}
              />

              <Select
                allowClear
                showSearch
                size="large"
                placeholder="Lọc nhà phân phối"
                optionFilterProp="label"
                value={distributor}
                onChange={handleDistributorChange}
                className="admin-leaves-distributor-select"
                options={distributors.map((item) => ({
                  value: item._id,
                  label: `${item.code ? `${item.code} - ` : ""}${
                    item.companyName || item.fullName || item.email
                  }`,
                }))}
              />
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-leaves-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-leaves-panel-title">
                  Danh sách đơn nghỉ phép
                </Text>
                <Text className="admin-leaves-panel-desc">
                  Hiển thị {leaves.length.toLocaleString("vi-VN")} /{" "}
                  {(meta?.total ?? leaves.length).toLocaleString("vi-VN")} đơn
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<LeaveRequest>
            rowKey="_id"
            loading={isLoading || isFetching}
            dataSource={leaves}
            columns={columns}
            scroll={{ x: 1330 }}
            className="admin-leaves-table"
            onChange={handleTableChange}
            rowClassName={(record) =>
              record._id === highlightedLeaveId ? "realtime-highlight-row" : ""
            }
            pagination={{
              current: meta?.page ?? page,
              pageSize: meta?.limit ?? limit,
              total: meta?.total ?? leaves.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} đơn nghỉ phép`,
            }}
            locale={{
              emptyText: (
                <Empty description="Không tìm thấy đơn nghỉ phép phù hợp" />
              ),
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-leaves-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-leaves-hero {
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
            radial-gradient(
              circle at 86% 18%,
              rgba(245, 158, 11, 0.2),
              transparent 28%
            ),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-leaves-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-leaves-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-leaves-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-leaves-hero-metrics {
          margin-top: 24px;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-leaves-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-leaves-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-leaves-hero-metrics .anticon {
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

        .admin-leaves-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-leaves-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-leaves-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-leaves-hero-panel .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #f59e0b;
        }

        .admin-leaves-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-leaves-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-leaves-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-leaves-filter-card,
        .admin-leaves-table-card {
          height: 100%;
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

        .admin-leaves-filter-card:hover,
        .admin-leaves-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-leaves-filter-card {
          margin-bottom: 16px;
        }

        .admin-leaves-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-leaves-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-leaves-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-leaves-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-leaves-status-select {
          width: 220px !important;
        }

        .admin-leaves-distributor-select {
          width: 260px !important;
        }

        .admin-leaves-search-input,
        .admin-leaves-status-select .ant-select-selector,
        .admin-leaves-distributor-select .ant-select-selector,
        .admin-leaves-reset-button {
          border-radius: 8px !important;
        }

        .admin-leaves-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-leaves-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-leaves-panel-title,
        .admin-leaves-panel-desc {
          display: block;
        }

        .admin-leaves-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-leaves-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-leaves-result-tag,
        .admin-leaves-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-leaves-table .ant-table,
        .admin-leaves-table .ant-table-container,
        .admin-leaves-table .ant-table-content,
        .admin-leaves-table .ant-table-body,
        .admin-leaves-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-leaves-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-leaves-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-leaves-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-leaves-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-leaves-table .ant-table-cell-fix-right,
        .admin-leaves-table .ant-table-cell-fix-right-first,
        .admin-leaves-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-leaves-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-leaves-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-leaves-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-leaves-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right,
        .admin-leaves-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-leaves-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-leaves-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-leaves-date-mark {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 17px;
          background: #eff6ff;
        }

        .admin-leaves-cell-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-leaves-strong,
        .admin-leaves-date {
          display: block;
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-leaves-muted {
          display: block;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-leaves-status-tag {
          min-width: 104px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-leaves-action-button,
        .admin-leaves-reset-button {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700;
        }

        .admin-leaves-table .ant-pagination {
          margin-top: 18px !important;
        }

        .admin-leaves-table .ant-pagination-total-text {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-leaves-hero {
            grid-template-columns: 1fr;
          }

          .admin-leaves-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-leaves-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-leaves-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-leaves-hero {
            padding: 20px;
          }

          .admin-leaves-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-leaves-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-leaves-hero-metrics > div,
          .admin-leaves-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-leaves-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-leaves-filter-actions,
          .admin-leaves-search-input,
          .admin-leaves-status-select,
          .admin-leaves-distributor-select,
          .admin-leaves-reset-button {
            width: 100% !important;
          }

          .admin-leaves-table .ant-table-tbody > tr > td {
            height: 74px;
            padding-inline: 14px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-leaves-filter-card,
          .admin-leaves-table-card {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
