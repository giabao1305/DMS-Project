"use client";

import {
  AuditOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileSearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetAuditLogsPageQuery } from "@/features/audit/auditService";
import type { AuditLog } from "@/features/audit/auditTypes";
import type { User } from "@/features/users/userTypes";

const { Text, Title } = Typography;

type FilterValue = "all" | string;

const actionMap: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  create: { label: "Tạo", color: "green", icon: <PlusOutlined /> },
  update: { label: "Cập nhật", color: "blue", icon: <EditOutlined /> },
  delete: { label: "Xóa", color: "red", icon: <DeleteOutlined /> },
  approve: { label: "Duyệt", color: "cyan", icon: <AuditOutlined /> },
  reject: { label: "Từ chối", color: "orange", icon: <AuditOutlined /> },
};

const moduleLabels: Record<string, string> = {
  categories: "Danh mục",
  customers: "Khách hàng",
  inventory: "Kho",
  kpis: "KPI",
  leaves: "Đơn nghỉ phép",
  orders: "Đơn hàng",
  products: "Sản phẩm",
  promotions: "Khuyến mãi",
  routes: "Tuyến bán hàng",
  users: "Nhân viên",
  visits: "Lượt ghé thăm",
};

const getActorName = (actor?: string | User) => {
  if (!actor) return "Hệ thống";
  return typeof actor === "string" ? actor : actor.fullName;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const getActionLabel = (action: string) => actionMap[action]?.label || action;

const getModuleLabel = (moduleName: string) =>
  moduleLabels[moduleName] || moduleName;

const isTechnicalDescription = (description?: string) =>
  /^(GET|POST|PUT|PATCH|DELETE)\s+\//i.test(description?.trim() || "");

const getAuditDescription = (log: AuditLog) => {
  if (log.description && !isTechnicalDescription(log.description)) {
    return log.description;
  }

  const action = getActionLabel(log.action).toLowerCase();
  const moduleName = getModuleLabel(log.module).toLowerCase();
  const target = log.targetLabel || log.targetId;

  return target ? `${action} ${moduleName} ${target}` : `${action} ${moduleName}`;
};

export default function AdminAuditLogsPage() {
  const [keyword, setKeyword] = useState("");
  const [actionFilter, setActionFilter] = useState<FilterValue>("all");
  const [moduleFilter, setModuleFilter] = useState<FilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useGetAuditLogsPageQuery({
    page,
    limit: pageSize,
    search: keyword.trim() || undefined,
    status: actionFilter === "all" ? undefined : actionFilter,
    module: moduleFilter === "all" ? undefined : moduleFilter,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const logs = useMemo(() => data?.data ?? [], [data?.data]);
  const totalLogs = data?.meta.total ?? 0;

  const auditOverview = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todayLogs = logs.filter(
      (log) => new Date(log.createdAt).toDateString() === todayKey,
    ).length;
    const uniqueActors = new Set(logs.map((log) => getActorName(log.actor)));
    const destructive = logs.filter((log) => log.action === "delete").length;
    const latest = [...logs].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )[0];

    return {
      total: logs.length,
      todayLogs,
      actors: uniqueActors.size,
      destructive,
      latest,
    };
  }, [logs]);

  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set(logs.map((log) => log.action))).sort();

    return [
      { label: "Tất cả hành động", value: "all" },
      ...actions.map((action) => ({
        label: getActionLabel(action),
        value: action,
      })),
    ];
  }, [logs]);

  const moduleOptions = useMemo(() => {
    const modules = Array.from(new Set(logs.map((log) => log.module))).sort();

    return [
      { label: "Tất cả module", value: "all" },
      ...modules.map((moduleName) => ({
        label: getModuleLabel(moduleName),
        value: moduleName,
      })),
    ];
  }, [logs]);

  const hasFilter =
    keyword.trim().length > 0 ||
    actionFilter !== "all" ||
    moduleFilter !== "all";

  const handleResetFilters = () => {
    setKeyword("");
    setActionFilter("all");
    setModuleFilter("all");
    setPage(1);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => (
        <div className="admin-audit-cell-copy">
          <Text className="admin-audit-strong">{formatDateTime(value)}</Text>
          <Text className="admin-audit-muted">Thời điểm ghi nhận</Text>
        </div>
      ),
    },
    {
      title: "Người thao tác",
      dataIndex: "actor",
      width: 220,
      render: (actor?: string | User) => (
        <Flex align="center" gap={10}>
          <span className="admin-audit-actor-icon">
            <UserOutlined />
          </span>
          <Text className="admin-audit-strong">{getActorName(actor)}</Text>
        </Flex>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      width: 170,
      render: (value: string) => {
        const action = actionMap[value] || {
          label: value,
          color: "default",
          icon: <AuditOutlined />,
        };

        return (
          <Tag
            color={action.color}
            icon={action.icon}
            className="admin-audit-tag"
          >
            {action.label}
          </Tag>
        );
      },
    },
    {
      title: "Module",
      dataIndex: "module",
      width: 180,
      render: (value: string) => (
        <Tag color="blue" className="admin-audit-tag">
          {getModuleLabel(value)}
        </Tag>
      ),
    },
    {
      title: "Đối tượng",
      dataIndex: "targetLabel",
      width: 240,
      ellipsis: true,
      render: (value: string | undefined, record) => (
        <Text className="admin-audit-strong">
          {value || record.targetId || "-"}
        </Text>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
      render: (_, record) => (
        <Text className="admin-audit-description">
          {getAuditDescription(record)}
        </Text>
      ),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Nhật ký hệ thống"
        description="Theo dõi các thao tác tạo, sửa, xóa và duyệt dữ liệu quan trọng."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
        }
      />

      <section className="admin-audit-shell">
        <div className="admin-audit-hero">
          <div>
            <Tag className="admin-audit-hero-tag">Audit Trail</Tag>
            <Title level={2} className="admin-audit-hero-title">
              Dòng sự kiện hệ thống
            </Title>
            <Text className="admin-audit-hero-desc">
              Rà soát nhanh ai đã thao tác, thao tác gì, trên module nào và thời
              điểm phát sinh.
            </Text>

            <div className="admin-audit-hero-metrics">
              <div>
                <FileSearchOutlined />
                <span>Tổng bản ghi</span>
                <strong>{auditOverview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <ClockCircleOutlined />
                <span>Hôm nay</span>
                <strong>{auditOverview.todayLogs.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <UserOutlined />
                <span>Người thao tác</span>
                <strong>{auditOverview.actors.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-audit-hero-panel">
            <DatabaseOutlined />
            <span>Bản ghi gần nhất</span>
            <strong>
              {auditOverview.latest
                ? getAuditDescription(auditOverview.latest)
                : "Chưa có nhật ký"}
            </strong>
            <Text>
              {auditOverview.latest
                ? formatDateTime(auditOverview.latest.createdAt)
                : "Danh sách đang trống"}
            </Text>
          </div>
        </div>

        <div className="admin-audit-filter">
          <div>
            <Title level={5} className="admin-audit-filter-title">
              Bộ lọc nhật ký
            </Title>
            <Text className="admin-audit-filter-description">
              Tìm theo người thao tác, module, hành động, đối tượng hoặc mô tả.
            </Text>
          </div>

          <Flex gap={12} wrap="wrap" className="admin-audit-filter-actions">
            <Input
              allowClear
              size="large"
              value={keyword}
              onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
              prefix={<SearchOutlined />}
              placeholder="Tìm nhật ký"
              className="admin-audit-search"
            />

            <Select<FilterValue>
              size="large"
              value={actionFilter}
              onChange={(value) => { setActionFilter(value); setPage(1); }}
              options={actionOptions}
              className="admin-audit-select"
            />

            <Select<FilterValue>
              size="large"
              value={moduleFilter}
              onChange={(value) => { setModuleFilter(value); setPage(1); }}
              options={moduleOptions}
              className="admin-audit-select"
            />

            {hasFilter ? (
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                className="admin-audit-reset-button"
              >
                Xóa bộ lọc
              </Button>
            ) : null}
          </Flex>
        </div>

        <div className="admin-audit-table-panel">
          <Flex align="center" justify="space-between" gap={14} wrap="wrap">
            <div>
              <Text className="admin-audit-panel-title">
                Danh sách nhật ký
              </Text>
              <Text className="admin-audit-panel-desc">
                Hiển thị {totalLogs.toLocaleString("vi-VN")} bản ghi
              </Text>
            </div>
            <Tag color={auditOverview.destructive > 0 ? "red" : "blue"} className="admin-audit-result-tag">
              {auditOverview.destructive.toLocaleString("vi-VN")} thao tác xóa
            </Tag>
          </Flex>

          <Table<AuditLog>
            rowKey="_id"
            loading={isLoading}
            dataSource={logs}
            columns={columns}
            scroll={{ x: 1200 }}
            className="admin-audit-table"
            pagination={{
              current: page,
              pageSize,
              total: totalLogs,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
            onChange={(pagination) => {
              setPage(pagination.current ?? 1);
              setPageSize(pagination.pageSize ?? 10);
            }}
            locale={{              emptyText: <Empty description="Chưa có nhật ký phù hợp" />,
            }}
          />
        </div>
      </section>

      <style jsx global>{`
        .admin-audit-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-audit-hero {
          min-height: 230px;
          margin-bottom: 16px;
          padding: 26px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 24px;
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background:
            radial-gradient(circle at 86% 18%, rgba(14, 165, 233, 0.26), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-audit-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-audit-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-audit-hero-desc.ant-typography {
          display: block;
          max-width: 720px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-audit-hero-metrics {
          margin-top: 24px;
          max-width: 760px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-audit-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-audit-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-audit-hero-metrics .anticon {
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

        .admin-audit-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-audit-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-audit-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-audit-hero-panel .anticon {
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

        .admin-audit-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-audit-hero-panel strong {
          margin-top: 8px;
          overflow: hidden;
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-audit-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-audit-filter,
        .admin-audit-table-panel {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055);
        }

        .admin-audit-filter {
          margin-bottom: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .admin-audit-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-audit-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-audit-search {
          width: 320px !important;
          max-width: 100%;
        }

        .admin-audit-select {
          width: 190px !important;
        }

        .admin-audit-search,
        .admin-audit-select .ant-select-selector,
        .admin-audit-reset-button {
          border-radius: 8px !important;
        }

        .admin-audit-table-panel {
          padding: 18px;
        }

        .admin-audit-panel-title,
        .admin-audit-panel-desc {
          display: block;
        }

        .admin-audit-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-audit-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-audit-result-tag,
        .admin-audit-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-audit-table {
          margin-top: 16px;
        }

        .admin-audit-table .ant-table,
        .admin-audit-table .ant-table-container,
        .admin-audit-table .ant-table-content,
        .admin-audit-table .ant-table-body,
        .admin-audit-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-audit-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-audit-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-audit-table .ant-table-tbody > tr > td {
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-audit-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-audit-cell-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-audit-strong,
        .admin-audit-description {
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
        }

        .admin-audit-description {
          font-weight: 700;
        }

        .admin-audit-muted {
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-audit-actor-icon {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 34px;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-audit-reset-button {
          height: 40px !important;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
          .admin-audit-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .admin-audit-hero {
            padding: 20px;
          }

          .admin-audit-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-audit-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-audit-hero-metrics > div {
            border-right: 0;
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-audit-hero-metrics > div:last-child {
            border-bottom: 0;
          }

          .admin-audit-filter-actions,
          .admin-audit-search,
          .admin-audit-select,
          .admin-audit-reset-button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
