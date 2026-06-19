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
  Segmented,
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const { Text, Title } = Typography;

type FilterValue = "all" | string;

const actionMap: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  account_locked: { label: "Khóa tài khoản", color: "red", icon: <AuditOutlined /> },
  create: { label: "Tạo", color: "green", icon: <PlusOutlined /> },
  update: { label: "Cập nhật", color: "blue", icon: <EditOutlined /> },
  delete: { label: "Xóa", color: "red", icon: <DeleteOutlined /> },
  approve: { label: "Duyệt", color: "cyan", icon: <AuditOutlined /> },
  reject: { label: "Từ chối", color: "orange", icon: <AuditOutlined /> },
  login_blocked: { label: "Chặn đăng nhập", color: "red", icon: <AuditOutlined /> },
  login_failed: { label: "Đăng nhập lỗi", color: "orange", icon: <AuditOutlined /> },
  login_success: { label: "Đăng nhập", color: "green", icon: <AuditOutlined /> },
  logout: { label: "Đăng xuất", color: "default", icon: <AuditOutlined /> },
  password_changed: { label: "Đổi mật khẩu", color: "blue", icon: <AuditOutlined /> },
  password_change_failed: { label: "Đổi mật khẩu lỗi", color: "orange", icon: <AuditOutlined /> },
  password_reset_completed: { label: "Đặt lại mật khẩu", color: "blue", icon: <AuditOutlined /> },
  password_reset_failed: { label: "Đặt lại mật khẩu lỗi", color: "orange", icon: <AuditOutlined /> },
  password_reset_requested: { label: "Yêu cầu đặt lại mật khẩu", color: "cyan", icon: <AuditOutlined /> },
  refresh_failed: { label: "Làm mới phiên lỗi", color: "orange", icon: <AuditOutlined /> },
  token_refreshed: { label: "Làm mới phiên", color: "blue", icon: <AuditOutlined /> },
};

const moduleLabels: Record<string, string> = {
  auth: "Xác thực",
  "audit-logs": "Nhật ký",
  audit_logs: "Nhật ký",
  categories: "Danh mục",
  category: "Danh mục",
  customer: "Khách hàng",
  customers: "Khách hàng",
  distributor: "Nhà phân phối",
  distributors: "Nhà phân phối",
  inventory: "Kho",
  kpis: "KPI",
  leaves: "Đơn nghỉ phép",
  notifications: "Thông báo",
  order: "Đơn hàng",
  orders: "Đơn hàng",
  payments: "Thanh toán",
  product: "Sản phẩm",
  products: "Sản phẩm",
  promotion: "Khuyến mãi",
  promotions: "Khuyến mãi",
  route: "Tuyến bán hàng",
  routes: "Tuyến bán hàng",
  seller: "Nhân viên bán hàng",
  sellers: "Nhân viên bán hàng",
  stock: "Tồn kho",
  stocks: "Tồn kho",
  user: "Nhân viên",
  users: "Nhân viên",
  visit: "Lượt ghé thăm",
  visits: "Lượt ghé thăm",
  warehouse: "Kho NPP",
  warehouses: "Kho NPP",
};

const objectIdPattern = /^[a-f\d]{24}$/i;
const objectIdInTextPattern = /\b[a-f\d]{24}\b/gi;
const readableActionWords: Record<string, string> = {
  account: "tài khoản",
  activate: "kích hoạt",
  activated: "đã kích hoạt",
  add: "thêm",
  added: "đã thêm",
  approve: "duyệt",
  approved: "đã duyệt",
  blocked: "bị chặn",
  cancel: "hủy",
  cancelled: "đã hủy",
  change: "đổi",
  changed: "đã đổi",
  completed: "hoàn tất",
  create: "tạo",
  created: "đã tạo",
  delete: "xóa",
  deleted: "đã xóa",
  deliver: "giao hàng",
  delivered: "đã giao hàng",
  disable: "tắt",
  disabled: "đã tắt",
  enable: "bật",
  enabled: "đã bật",
  failed: "lỗi",
  import: "nhập kho",
  imported: "đã nhập kho",
  login: "đăng nhập",
  logout: "đăng xuất",
  order: "đơn hàng",
  password: "mật khẩu",
  payment: "thanh toán",
  reject: "từ chối",
  rejected: "đã từ chối",
  refresh: "làm mới",
  remove: "xóa",
  removed: "đã xóa",
  request: "yêu cầu",
  requested: "đã yêu cầu",
  reset: "đặt lại",
  return: "trả hàng",
  returned: "đã trả hàng",
  status: "trạng thái",
  stock: "tồn kho",
  supply: "cấp hàng",
  token: "phiên",
  update: "cập nhật",
  updated: "đã cập nhật",
  upload: "tải lên",
  uploaded: "đã tải lên",
};

const readableDescriptionPhrases: Record<string, string> = {
  "account locked": "khóa tài khoản",
  "change password": "đổi mật khẩu",
  "changed password": "đã đổi mật khẩu",
  "create auth": "tạo bản ghi xác thực",
  "create order": "tạo đơn hàng",
  "created order": "đã tạo đơn hàng",
  "create product": "tạo sản phẩm",
  "created product": "đã tạo sản phẩm",
  "create user": "tạo nhân viên",
  "created user": "đã tạo nhân viên",
  "delete order": "xóa đơn hàng",
  "deleted order": "đã xóa đơn hàng",
  "delete product": "xóa sản phẩm",
  "deleted product": "đã xóa sản phẩm",
  "delete user": "xóa nhân viên",
  "deleted user": "đã xóa nhân viên",
  "login blocked": "chặn đăng nhập",
  "login failed": "đăng nhập thất bại",
  "login success": "đăng nhập thành công",
  "logout successfully": "đăng xuất thành công",
  "password change failed": "đổi mật khẩu thất bại",
  "password reset completed": "đặt lại mật khẩu hoàn tất",
  "password reset failed": "đặt lại mật khẩu thất bại",
  "password reset requested": "yêu cầu đặt lại mật khẩu",
  "refresh failed": "làm mới phiên thất bại",
  "token refreshed": "làm mới phiên đăng nhập",
  "update order": "cập nhật đơn hàng",
  "updated order": "đã cập nhật đơn hàng",
  "update product": "cập nhật sản phẩm",
  "updated product": "đã cập nhật sản phẩm",
  "update user": "cập nhật nhân viên",
  "updated user": "đã cập nhật nhân viên",
};

const readableDescriptionWords: Record<string, string> = {
  action: "hành động",
  active: "hoạt động",
  address: "địa chỉ",
  amount: "số tiền",
  approved: "đã duyệt",
  auth: "xác thực",
  avatar: "ảnh đại diện",
  cancelled: "đã hủy",
  category: "danh mục",
  code: "mã",
  company: "công ty",
  create: "tạo",
  created: "đã tạo",
  customer: "khách hàng",
  deleted: "đã xóa",
  delivered: "đã giao",
  description: "mô tả",
  distributor: "nhà phân phối",
  email: "email",
  failed: "thất bại",
  final: "cuối cùng",
  full: "đầy đủ",
  import: "nhập kho",
  inventory: "kho",
  name: "tên",
  order: "đơn hàng",
  payment: "thanh toán",
  phone: "số điện thoại",
  price: "giá",
  product: "sản phẩm",
  promotion: "khuyến mãi",
  quantity: "số lượng",
  rejected: "đã từ chối",
  role: "vai trò",
  route: "tuyến",
  seller: "nhân viên bán hàng",
  status: "trạng thái",
  stock: "tồn kho",
  successfully: "thành công",
  store: "cửa hàng",
  supply: "cấp hàng",
  tax: "thuế",
  total: "tổng",
  updated: "đã cập nhật",
  user: "nhân viên",
  warehouse: "kho",
};

const isObjectId = (value?: string) => Boolean(value && objectIdPattern.test(value));
const containsObjectId = (value?: string) =>
  Boolean(value && /\b[a-f\d]{24}\b/i.test(value));

const toReadableAction = (action: string) =>
  action
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => readableActionWords[word.toLowerCase()] || word)
    .join(" ");

const cleanTechnicalText = (value?: string) =>
  value?.replace(objectIdInTextPattern, "bản ghi").trim();

const capitalizeSentence = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const humanizeModuleName = (moduleName: string) => {
  const normalized = moduleName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.-]+/g, " ")
    .trim()
    .toLowerCase();

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => moduleLabels[word] || readableDescriptionWords[word] || word)
    .join(" ");
};

const translateEnglishText = (value: string) => {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = normalized.toLowerCase();

  if (readableDescriptionPhrases[lower]) {
    return readableDescriptionPhrases[lower];
  }

  const phraseTranslated = Object.entries(readableDescriptionPhrases).reduce(
    (text, [english, vietnamese]) =>
      text.replace(new RegExp(`\\b${english}\\b`, "gi"), vietnamese),
    normalized,
  );

  return phraseTranslated
    .split(/\s+/)
    .map((word) => {
      const cleanWord = word.replace(/[.,:;!?()[\]{}]/g, "");
      const translated = readableDescriptionWords[cleanWord.toLowerCase()];

      return translated ? word.replace(cleanWord, translated) : word;
    })
    .join(" ");
};

const getSafeTargetLabel = (log: AuditLog) => {
  if (log.targetLabel && !isObjectId(log.targetLabel)) {
    return capitalizeSentence(translateEnglishText(log.targetLabel));
  }

  const moduleName = getModuleLabel(log.module).toLowerCase();

  if (log.targetId) {
    return `Bản ghi ${moduleName}`;
  }

  return "-";
};

const getActorName = (actor?: string | User) => {
  if (!actor) return "Hệ thống";
  if (typeof actor === "string") {
    return isObjectId(actor) ? "Người dùng hệ thống" : actor;
  }

  return actor.fullName || actor.email || "Người dùng hệ thống";
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const getActionLabel = (action: string) =>
  capitalizeSentence(actionMap[action]?.label || toReadableAction(action));

const getModuleLabel = (moduleName: string) =>
  moduleLabels[moduleName] || capitalizeSentence(humanizeModuleName(moduleName));

const isTechnicalDescription = (description?: string) =>
  /^(GET|POST|PUT|PATCH|DELETE)\s+\//i.test(description?.trim() || "");

const getAuditDescription = (log: AuditLog) => {
  const safeTarget = getSafeTargetLabel(log);

  if (
    log.description &&
    !isTechnicalDescription(log.description) &&
    !containsObjectId(log.description)
  ) {
    return capitalizeSentence(
      translateEnglishText(cleanTechnicalText(log.description) || log.description),
    );
  }

  const action = getActionLabel(log.action).toLowerCase();
  const moduleName = getModuleLabel(log.module).toLowerCase();
  const target = safeTarget === "-" ? undefined : safeTarget;

  if (target?.startsWith("Bản ghi")) {
    return capitalizeSentence(`${action} ${target.toLowerCase()}`);
  }

  return capitalizeSentence(
    target ? `${action} ${moduleName} ${target}` : `${action} ${moduleName}`,
  );
};

export default function AdminAuditLogsPage() {
  const [keyword, setKeyword] = useState("");
  const [actionFilter, setActionFilter] = useState<FilterValue>("all");
  const [moduleFilter, setModuleFilter] = useState<FilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchKeyword = useDebouncedValue(keyword);

  const { data, isLoading, refetch } = useGetAuditLogsPageQuery({
    page,
    limit: pageSize,
    search: searchKeyword.trim() || undefined,
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
      { label: "Tất cả phân hệ", value: "all" },
      ...modules.map((moduleName) => ({
        label: getModuleLabel(moduleName),
        value: moduleName,
      })),
    ];
  }, [logs]);

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
          label: getActionLabel(value),
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
      title: "Phân hệ",
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
          {getSafeTargetLabel({ ...record, targetLabel: value })}
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
            <Tag className="admin-audit-hero-tag">Lịch sử thao tác</Tag>
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

            <Segmented<FilterValue>
              size="large"
              value={actionFilter}
              onChange={(value) => { setActionFilter(value); setPage(1); }}
              options={actionOptions}
              className="admin-audit-select"
            />

            <Segmented<FilterValue>
              size="large"
              value={moduleFilter}
              onChange={(value) => { setModuleFilter(value); setPage(1); }}
              options={moduleOptions}
              className="admin-audit-select"
            />

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
