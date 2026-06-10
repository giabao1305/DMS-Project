"use client";

import {
  AimOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
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
import type { TablePaginationConfig } from "antd/es/table";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useDeleteRouteMutation,
  useGetRoutesPageQuery,
} from "@/features/routes/routeService";
import type { Route, RouteStatus } from "@/features/routes/routeTypes";
import { useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type RouteStatusFilter = "all" | RouteStatus;

const emptyRoutes: Route[] = [];
const statusMap: Record<RouteStatus, { label: string; color: string }> = {
  planned: { label: "Kế hoạch", color: "blue" },
  in_progress: { label: "Đang đi tuyến", color: "orange" },
  completed: { label: "Hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

const splitDate = (value?: string) => {
  if (!value) return { date: "-", weekday: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", weekday: "" };

  return {
    date: date.toLocaleDateString("vi-VN"),
    weekday: date.toLocaleDateString("vi-VN", { weekday: "long" }),
  };
};

const getSellerName = (seller: Route["seller"]) =>
  typeof seller === "string" ? seller : (seller as User)?.fullName || "-";

export default function AdminRoutesPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RouteStatusFilter>("all");
  const [distributor, setDistributor] = useState<string>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: users = [] } = useGetUsersQuery();
  const distributors = useMemo(
    () => users.filter((user) => user.role === "distributor" && user.isActive),
    [users],
  );

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      search: keyword.trim() || undefined,
      status: status === "all" ? undefined : status,
      distributor,
      sortBy: "workDate",
      sortOrder: "desc" as const,
    }),
    [distributor, keyword, limit, page, status],
  );

  const {
    data: routesPage,
    isLoading,
    isFetching,
    refetch,
  } = useGetRoutesPageQuery(queryArgs);
  const routes = routesPage?.data ?? emptyRoutes;
  const meta = routesPage?.meta;
  const [deleteRoute, { isLoading: deleting }] = useDeleteRouteMutation();

  useRealtimeRefetch(["new-notification", "route-updated"], refetch);

  const overview = useMemo(() => {
    const todayKey = new Date().toDateString();

    return {
      total: routes.length,
      planned: routes.filter((route) => route.status === "planned").length,
      inProgress: routes.filter((route) => route.status === "in_progress")
        .length,
      completed: routes.filter((route) => route.status === "completed").length,
      cancelled: routes.filter((route) => route.status === "cancelled").length,
      todayRoutes: routes.filter(
        (route) => new Date(route.workDate).toDateString() === todayKey,
      ).length,
      totalCustomers: routes.reduce(
        (sum, route) => sum + (route.customers?.length || 0),
        0,
      ),
    };
  }, [routes]);

  const hasFilter =
    keyword.trim().length > 0 || status !== "all" || Boolean(distributor);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteRoute(id).unwrap();
        message.success("Xóa tuyến thành công");
      } catch {
        message.error("Xóa tuyến thất bại");
      }
    },
    [deleteRoute, message],
  );

  const handleResetFilters = useCallback(() => {
    setKeyword("");
    setStatus("all");
    setDistributor(undefined);
    setPage(1);
  }, []);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleStatusChange = (value: RouteStatusFilter) => {
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

  const columns: ColumnsType<Route> = useMemo(
    () => [
      {
        title: "Tên tuyến",
        dataIndex: "name",
        width: 290,
        fixed: "left",
        ellipsis: true,
        render: (value: string, record) => (
          <div className="admin-routes-main-cell">
            <Text className="admin-routes-table-primary">{value}</Text>
            <Text className="admin-routes-table-subtitle">
              Mã tuyến: {record._id.slice(-8).toUpperCase()}
            </Text>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 190,
        align: "center",
        render: (routeStatus: RouteStatus) => (
          <Tag
            color={statusMap[routeStatus]?.color}
            className="admin-routes-status-tag"
          >
            {statusMap[routeStatus]?.label}
          </Tag>
        ),
      },
      {
        title: "Nhân viên",
        dataIndex: "seller",
        width: 250,
        ellipsis: true,
        render: (seller) => (
          <Flex align="center" gap={12} className="admin-routes-seller-cell">
            <Flex
              align="center"
              justify="center"
              className="admin-routes-seller-avatar"
            >
              <UserOutlined />
            </Flex>

            <div className="admin-routes-seller-copy">
              <Text className="admin-routes-seller-name">
                {getSellerName(seller)}
              </Text>
              <Text className="admin-routes-table-subtitle">
                Seller phụ trách
              </Text>
            </div>
          </Flex>
        ),
      },
      {
        title: "Ngày làm việc",
        dataIndex: "workDate",
        width: 190,
        render: (value: string) => {
          const workDate = splitDate(value);

          return (
            <Flex align="center" gap={10} className="admin-routes-date-cell">
              <Flex
                align="center"
                justify="center"
                className="admin-routes-date-icon"
              >
                <CalendarOutlined />
              </Flex>

              <div>
                <Text className="admin-routes-date-primary">
                  {workDate.date}
                </Text>
                <Text className="admin-routes-date-secondary">
                  {workDate.weekday || "-"}
                </Text>
              </div>
            </Flex>
          );
        },
      },
      {
        title: "Số khách hàng",
        width: 170,
        align: "center",
        render: (_, record) => {
          const totalCustomers = record.customers?.length || 0;

          return (
            <Flex vertical align="center" gap={5}>
              <Tag
                color={totalCustomers > 0 ? "blue" : "default"}
                className="admin-routes-count-tag"
              >
                {totalCustomers}
              </Tag>
              <Text className="admin-routes-mini-caption">điểm bán</Text>
            </Flex>
          );
        },
      },
      {
        title: "Hành động",
        key: "actions",
        width: 308,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Space size={8} className="admin-routes-actions-space">
            <Link href={`/admin/routes/${record._id}`}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                className="admin-routes-action-button"
              >
                Chi tiết
              </Button>
            </Link>

            <Link href={`/admin/routes/${record._id}/edit`}>
              <Button
                color="orange"
                variant="solid"
                icon={<EditOutlined />}
                className="admin-routes-action-button"
              >
                Sửa
              </Button>
            </Link>

            <Popconfirm
              title="Xóa tuyến?"
              description="Bạn chắc chắn muốn xóa tuyến này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record._id)}
            >
              <Button
                color="danger"
                variant="solid"
                icon={<DeleteOutlined />}
                className="admin-routes-action-button"
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDelete],
  );

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Kế hoạch tuyến"
        description="Quản lý tuyến đi thị trường, phân công seller và theo dõi tiến độ triển khai."
        extra={
          <Link href="/admin/routes/create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="admin-routes-create-button"
            >
              Tạo tuyến
            </Button>
          </Link>
        }
      />

      <section className="admin-routes-shell">
        <div className="admin-routes-hero">
          <div>
            <Tag className="admin-routes-hero-tag">Route Operation</Tag>
            <Title level={2} className="admin-routes-hero-title">
              Điều phối tuyến bán hàng
            </Title>
            <Text className="admin-routes-hero-desc">
              Kiểm soát kế hoạch đi thị trường, tiến độ triển khai và mật độ
              điểm bán trong từng tuyến của đội seller.
            </Text>

            <div className="admin-routes-hero-metrics">
              <div>
                <EnvironmentOutlined />
                <span>Tổng tuyến</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CalendarOutlined />
                <span>Tuyến hôm nay</span>
                <strong>{overview.todayRoutes.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <SwapOutlined />
                <span>Đang đi tuyến</span>
                <strong>{overview.inProgress.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <AimOutlined />
                <span>Điểm bán</span>
                <strong>
                  {overview.totalCustomers.toLocaleString("vi-VN")}
                </strong>
              </div>
            </div>
          </div>

          <div className="admin-routes-hero-panel">
            <CheckCircleOutlined />
            <span>Hoàn thành</span>
            <strong>{overview.completed.toLocaleString("vi-VN")}</strong>
            <Text>
              {overview.cancelled.toLocaleString("vi-VN")} tuyến đã hủy
            </Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-routes-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-routes-filter-title">
                Bộ lọc tuyến
              </Title>
              <Text className="admin-routes-filter-description">
                Tìm theo tên tuyến, seller hoặc lọc theo trạng thái vận hành.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-routes-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm tuyến hoặc nhân viên"
                prefix={<SearchOutlined />}
                className="admin-routes-search-input"
                value={keyword}
                onChange={(event) => handleKeywordChange(event.target.value)}
              />

              <Select<RouteStatusFilter>
                size="large"
                value={status}
                onChange={handleStatusChange}
                className="admin-routes-status-select"
                options={[
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Kế hoạch", value: "planned" },
                  { label: "Đang đi tuyến", value: "in_progress" },
                  { label: "Hoàn thành", value: "completed" },
                  { label: "Đã hủy", value: "cancelled" },
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
                className="admin-routes-distributor-select"
                options={distributors.map((item) => ({
                  value: item._id,
                  label: `${item.code ? `${item.code} - ` : ""}${
                    item.companyName || item.fullName || item.email
                  }`,
                }))}
              />

              {hasFilter ? (
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  className="admin-routes-reset-button"
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-routes-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-routes-panel-title">
                  Danh sách tuyến
                </Text>
                <Text className="admin-routes-panel-desc">
                  Hiển thị {routes.length.toLocaleString("vi-VN")} /{" "}
                  {(meta?.total ?? routes.length).toLocaleString("vi-VN")} tuyến
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<Route>
            rowKey="_id"
            loading={isLoading || isFetching || deleting}
            dataSource={routes}
            columns={columns}
            scroll={{ x: 1398 }}
            tableLayout="fixed"
            className="admin-routes-table"
            onChange={handleTableChange}
            pagination={{
              current: meta?.page ?? page,
              pageSize: meta?.limit ?? limit,
              total: meta?.total ?? routes.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => "Tổng " + total + " tuyến",
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy tuyến phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-routes-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-routes-hero {
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
              rgba(14, 165, 233, 0.26),
              transparent 28%
            ),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-routes-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-routes-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-routes-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-routes-hero-metrics {
          margin-top: 24px;
          max-width: 840px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-routes-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-routes-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-routes-hero-metrics .anticon {
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

        .admin-routes-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-routes-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-routes-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-routes-hero-panel .anticon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 20px;
          background: #10b981;
        }

        .admin-routes-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-routes-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-routes-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-routes-filter-card,
        .admin-routes-table-card {
          height: 100%;
          overflow: hidden;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transition: none !important;
        }

        .admin-routes-filter-card:hover,
        .admin-routes-table-card:hover {
          border-color: #dbe4f0 !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
          transform: none !important;
        }

        .admin-routes-filter-card {
          margin-bottom: 16px;
        }

        .admin-routes-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-routes-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-routes-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-routes-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-routes-status-select {
          width: 210px !important;
        }

        .admin-routes-distributor-select {
          width: 260px !important;
        }

        .admin-routes-search-input,
        .admin-routes-status-select .ant-select-selector,
        .admin-routes-distributor-select .ant-select-selector,
        .admin-routes-reset-button {
          border-radius: 8px !important;
        }

        .admin-routes-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-routes-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-routes-panel-title,
        .admin-routes-panel-desc {
          display: block;
        }

        .admin-routes-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-routes-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-routes-result-tag,
        .admin-routes-count-tag,
        .admin-routes-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-routes-table .ant-table,
        .admin-routes-table .ant-table-container,
        .admin-routes-table .ant-table-content,
        .admin-routes-table .ant-table-body,
        .admin-routes-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-routes-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-routes-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-routes-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-routes-table .ant-table-cell-fix-left,
        .admin-routes-table .ant-table-cell-fix-right,
        .admin-routes-table .ant-table-cell-fix-left-last,
        .admin-routes-table .ant-table-cell-fix-right-first {
          background: #ffffff !important;
          background-color: #ffffff !important;
        }

        .admin-routes-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .admin-routes-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-routes-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-routes-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first {
          background: #f8fafc !important;
        }

        .admin-routes-main-cell,
        .admin-routes-seller-cell,
        .admin-routes-seller-copy,
        .admin-routes-date-cell {
          min-width: 0;
        }

        .admin-routes-table-primary,
        .admin-routes-seller-name,
        .admin-routes-date-primary,
        .admin-routes-table-subtitle,
        .admin-routes-date-secondary {
          display: block;
        }

        .admin-routes-table-primary,
        .admin-routes-seller-name,
        .admin-routes-date-primary {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-routes-table-primary {
          max-width: 238px;
        }

        .admin-routes-seller-name {
          max-width: 170px;
        }

        .admin-routes-table-subtitle,
        .admin-routes-date-secondary,
        .admin-routes-mini-caption {
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-routes-seller-avatar,
        .admin-routes-date-icon {
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-routes-seller-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
        }

        .admin-routes-date-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
        }

        .admin-routes-count-tag {
          min-width: 64px;
          height: 30px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-routes-status-tag {
          min-width: 132px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-routes-actions-space {
          justify-content: center;
        }

        .admin-routes-create-button,
        .admin-routes-action-button,
        .admin-routes-reset-button {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700;
        }

        .admin-routes-create-button {
          height: 42px !important;
          padding-inline: 18px !important;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
        }

        .admin-routes-action-button {
          padding-inline: 14px !important;
        }

        .admin-routes-table .ant-pagination {
          margin-top: 18px !important;
        }

        .admin-routes-table .ant-pagination-total-text {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-routes-hero {
            grid-template-columns: 1fr;
          }

          .admin-routes-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-routes-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-routes-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-routes-hero {
            padding: 20px;
          }

          .admin-routes-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-routes-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-routes-hero-metrics > div,
          .admin-routes-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-routes-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-routes-filter-actions,
          .admin-routes-search-input,
          .admin-routes-status-select,
          .admin-routes-distributor-select,
          .admin-routes-reset-button {
            width: 100% !important;
          }

          .admin-routes-table .ant-table-tbody > tr > td {
            height: 74px;
            padding-inline: 14px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-routes-filter-card,
          .admin-routes-table-card {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
