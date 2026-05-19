"use client";

import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Empty,
  Flex,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Customer } from "@/features/customers/customerTypes";
import {
  useGetRouteByIdQuery,
  useUpdateRouteStatusMutation,
} from "@/features/routes/routeService";
import type { RouteCustomer, RouteStatus } from "@/features/routes/routeTypes";
import type { User } from "@/features/users/userTypes";

const { Text, Title } = Typography;

const statusMap: Record<RouteStatus, { label: string; color: string }> = {
  planned: { label: "Kế hoạch", color: "blue" },
  in_progress: { label: "Đang đi tuyến", color: "orange" },
  completed: { label: "Hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

const routeCustomerStatusMap: Record<
  NonNullable<RouteCustomer["status"]>,
  { label: string; color: string }
> = {
  pending: { label: "Chờ ghé", color: "default" },
  checked_in: { label: "Đã check-in", color: "orange" },
  visited: { label: "Đã ghé", color: "green" },
  skipped: { label: "Bỏ qua", color: "red" },
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

const getCustomer = (record: RouteCustomer) =>
  typeof record.customer === "string" ? null : (record.customer as Customer);

export default function AdminRouteDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: route, isLoading } = useGetRouteByIdQuery(id);
  const [updateRouteStatus, { isLoading: updatingStatus }] =
    useUpdateRouteStatusMutation();

  const handleUpdateStatus = useCallback(
    async (status: RouteStatus) => {
      try {
        await updateRouteStatus({ id, body: { status } }).unwrap();
        message.success("Cập nhật trạng thái tuyến thành công");
      } catch {
        message.error("Cập nhật trạng thái thất bại");
      }
    },
    [id, message, updateRouteStatus],
  );

  const customerColumns: ColumnsType<RouteCustomer> = useMemo(
    () => [
      {
        title: "Thứ tự",
        dataIndex: "orderIndex",
        width: 112,
        align: "center",
        render: (value: number) => (
          <Tag color="blue" className="admin-route-detail-order-tag">
            #{value}
          </Tag>
        ),
      },
      {
        title: "Khách hàng",
        width: 280,
        render: (_, record) => {
          const customer = getCustomer(record);

          return (
            <Flex align="center" gap={12} className="admin-route-detail-customer">
              <Flex
                align="center"
                justify="center"
                className="admin-route-detail-customer-icon"
              >
                <ShopOutlined />
              </Flex>
              <div className="admin-route-detail-customer-copy">
                <Text className="admin-route-detail-customer-name">
                  {customer?.name || "-"}
                </Text>
                <Text className="admin-route-detail-muted">
                  {customer?.ownerName || "Điểm bán trong tuyến"}
                </Text>
              </div>
            </Flex>
          );
        },
      },
      {
        title: "Số điện thoại",
        width: 180,
        render: (_, record) => {
          const customer = getCustomer(record);

          return (
            <Flex align="center" gap={8} className="admin-route-detail-inline">
              <PhoneOutlined />
              <Text>{customer?.phone || "-"}</Text>
            </Flex>
          );
        },
      },
      {
        title: "Địa chỉ",
        width: 360,
        ellipsis: true,
        render: (_, record) => {
          const customer = getCustomer(record);
          return (
            <Text className="admin-route-detail-text-ellipsis">
              {customer?.address || "-"}
            </Text>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 150,
        align: "center",
        render: (status?: RouteCustomer["status"]) => {
          const current = status
            ? routeCustomerStatusMap[status]
            : routeCustomerStatusMap.pending;

          return (
            <Tag color={current.color} className="admin-route-detail-status-tag">
              {current.label}
            </Tag>
          );
        },
      },
      {
        title: "Ghi chú",
        dataIndex: "note",
        width: 260,
        ellipsis: true,
        render: (value?: string) => (
          <Text
            className="admin-route-detail-text-ellipsis"
            type={value ? undefined : "secondary"}
          >
            {value || "-"}
          </Text>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết tuyến"
          description="Xem thông tin kế hoạch tuyến và danh sách khách hàng."
          extra={
            <Button
              onClick={() => router.push("/admin/routes")}
              className="admin-route-detail-action"
            >
              Quay lại
            </Button>
          }
        />
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="admin-route-detail-panel is-loading" />
          </Col>
          <Col xs={24} lg={8}>
            <div className="admin-route-detail-panel is-loading" />
          </Col>
          <Col xs={24} lg={16}>
            <div className="admin-route-detail-panel is-loading" />
          </Col>
        </Row>
      </>
    );
  }

  if (!route) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết tuyến"
          description="Xem thông tin kế hoạch tuyến và danh sách khách hàng."
          extra={
            <Button
              onClick={() => router.push("/admin/routes")}
              className="admin-route-detail-action"
            >
              Quay lại
            </Button>
          }
        />
        <div className="admin-route-detail-panel">
          <Empty description="Không tìm thấy tuyến" />
        </div>
      </>
    );
  }

  const seller =
    typeof route.seller === "string" ? null : (route.seller as User);
  const sellerName =
    seller?.fullName || (typeof route.seller === "string" ? route.seller : "-");
  const sellerEmail = seller?.email || "-";
  const currentStatus = statusMap[route.status];
  const completedCustomers = route.customers.filter(
    (item) => item.status === "visited",
  ).length;
  const pendingCustomers = route.customers.length - completedCustomers;

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={route.name}
        description="Chi tiết kế hoạch tuyến, seller phụ trách và danh sách điểm ghé thăm."
        extra={
          <Space wrap>
            <Button
              onClick={() => router.push("/admin/routes")}
              className="admin-route-detail-action"
            >
              Quay lại
            </Button>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              onClick={() => router.push(`/admin/routes/${id}/edit`)}
              className="admin-route-detail-action"
            >
              Sửa tuyến
            </Button>
            {route.status !== "completed" && route.status !== "cancelled" ? (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={updatingStatus}
                onClick={() => handleUpdateStatus("completed")}
                className="admin-route-detail-action"
              >
                Hoàn thành
              </Button>
            ) : null}
            {route.status !== "cancelled" ? (
              <Button
                color="danger"
                variant="solid"
                icon={<CloseOutlined />}
                loading={updatingStatus}
                onClick={() => handleUpdateStatus("cancelled")}
                className="admin-route-detail-action"
              >
                Hủy tuyến
              </Button>
            ) : null}
          </Space>
        }
      />

      <section className="admin-route-detail-shell">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <section className="admin-route-detail-panel">
              <Flex vertical align="center" className="admin-route-detail-summary">
                <Flex
                  align="center"
                  justify="center"
                  className="admin-route-detail-summary-icon"
                >
                  <EnvironmentOutlined />
                </Flex>
                <Title level={4} className="admin-route-detail-summary-title">
                  {route.name}
                </Title>
                <Text className="admin-route-detail-summary-subtitle">
                  {sellerName}
                </Text>
                <Tag color={currentStatus?.color} className="admin-route-detail-main-status">
                  {currentStatus?.label || route.status}
                </Tag>
              </Flex>

              <div className="admin-route-detail-summary-list">
                <Flex justify="space-between" align="center">
                  <Text>Đã ghé</Text>
                  <strong>{completedCustomers}</strong>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text>Còn lại</Text>
                  <strong>{pendingCustomers}</strong>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text>Ngày tạo</Text>
                  <strong>{formatDate(route.createdAt)}</strong>
                </Flex>
              </div>
            </section>
          </Col>

          <Col xs={24} lg={16}>
            <section className="admin-route-detail-panel">
              <div className="admin-route-detail-panel-head">
                <div>
                  <Text className="admin-route-detail-panel-title">
                    Thông tin tuyến
                  </Text>
                  <Text className="admin-route-detail-panel-desc">
                    Dữ liệu vận hành và seller phụ trách
                  </Text>
                </div>
              </div>
              <div className="admin-route-detail-info-grid">
                <div className="admin-route-detail-info-row is-wide">
                  <Text>Tên tuyến</Text>
                  <strong>{route.name}</strong>
                </div>
                <div className="admin-route-detail-info-row">
                  <Text>Trạng thái</Text>
                  <Tag color={currentStatus?.color} className="admin-route-detail-main-status">
                    {currentStatus?.label || route.status}
                  </Tag>
                </div>
                <div className="admin-route-detail-info-row">
                  <Text>Nhân viên</Text>
                  <strong>{sellerName}</strong>
                </div>
                <div className="admin-route-detail-info-row">
                  <Text>Email</Text>
                  <strong>{sellerEmail}</strong>
                </div>
                <div className="admin-route-detail-info-row">
                  <Text>Ngày làm việc</Text>
                  <strong>{formatDate(route.workDate)}</strong>
                </div>
                <div className="admin-route-detail-info-row">
                  <Text>Cập nhật</Text>
                  <strong>{formatDateTime(route.updatedAt)}</strong>
                </div>
              </div>

              <div className="admin-route-detail-contact-strip">
                <div>
                  <UserOutlined />
                  <span>{sellerName}</span>
                </div>
                <div>
                  <MailOutlined />
                  <span>{sellerEmail}</span>
                </div>
                <div>
                  <TeamOutlined />
                  <span>{route.customers.length} điểm bán</span>
                </div>
              </div>
            </section>
          </Col>

          <Col span={24}>
            <section className="admin-route-detail-panel admin-route-detail-table-panel">
              <div className="admin-route-detail-panel-head">
                <Flex align="center" justify="space-between" gap={14} wrap="wrap">
                  <div>
                    <Text className="admin-route-detail-panel-title">
                      Danh sách khách hàng
                    </Text>
                    <Text className="admin-route-detail-panel-desc">
                      Thứ tự các điểm ghé thăm trong tuyến
                    </Text>
                  </div>
                  <Tag color="blue" className="admin-route-detail-result-tag">
                    {route.customers.length} điểm bán
                  </Tag>
                </Flex>
              </div>
              <Table<RouteCustomer>
                rowKey={(record) =>
                  typeof record.customer === "string"
                    ? record.customer
                    : record.customer._id
                }
                dataSource={route.customers}
                columns={customerColumns}
                scroll={{ x: 1342 }}
                className="admin-route-detail-table"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: true,
                  pageSizeOptions: [8, 12, 20, 50],
                  showTotal: (total) => `Tổng ${total} khách hàng`,
                }}
                locale={{
                  emptyText: <Empty description="Chưa có khách hàng trong tuyến" />,
                }}
              />
            </section>
          </Col>
        </Row>
      </section>

      <style jsx global>{`
        .admin-route-detail-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-route-detail-panel {
          height: 100%;
          padding: 18px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-route-detail-panel.is-loading {
          min-height: 180px;
          border-radius: 8px;
          background:
            linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: admin-route-detail-loading 1.2s ease infinite;
        }

        .admin-route-detail-panel-head {
          margin: -18px -18px 18px;
          min-height: auto;
          padding: 18px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e7edf5;
          background: #fbfdff;
        }

        @keyframes admin-route-detail-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .admin-route-detail-action {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        .admin-route-detail-summary {
          text-align: center;
        }

        .admin-route-detail-summary-icon {
          width: 78px;
          height: 78px;
          margin-bottom: 16px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 34px;
          background: #eff6ff;
        }

        .admin-route-detail-summary-title.ant-typography {
          margin: 0 0 6px;
          color: #0f172a;
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: 0;
        }

        .admin-route-detail-summary-subtitle {
          margin-bottom: 14px;
          color: #64748b !important;
          font-weight: 700;
        }

        .admin-route-detail-summary-list {
          margin-top: 22px;
          padding-top: 18px;
          display: grid;
          gap: 13px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-route-detail-summary-list .ant-typography,
        .admin-route-detail-info-row .ant-typography {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-route-detail-summary-list strong,
        .admin-route-detail-info-row strong {
          min-width: 0;
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.4;
          word-break: break-word;
        }

        .admin-route-detail-panel-title,
        .admin-route-detail-panel-desc {
          display: block;
        }

        .admin-route-detail-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-route-detail-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-route-detail-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .admin-route-detail-info-row {
          min-width: 0;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(96px, 0.36fr) minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-route-detail-info-row.is-wide {
          grid-column: 1 / -1;
        }

        .admin-route-detail-main-status,
        .admin-route-detail-result-tag,
        .admin-route-detail-order-tag,
        .admin-route-detail-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-route-detail-contact-strip {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .admin-route-detail-contact-strip > div {
          min-width: 0;
          min-height: 52px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-route-detail-contact-strip .anticon {
          color: #2563eb;
        }

        .admin-route-detail-contact-strip span {
          overflow: hidden;
          color: #0f172a;
          font-size: 12.5px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-route-detail-table .ant-table,
        .admin-route-detail-table .ant-table-container,
        .admin-route-detail-table .ant-table-content,
        .admin-route-detail-table .ant-table-body,
        .admin-route-detail-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-route-detail-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-route-detail-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-route-detail-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-route-detail-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-route-detail-order-tag,
        .admin-route-detail-status-tag {
          min-width: 82px;
          height: 30px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-route-detail-customer,
        .admin-route-detail-customer-copy,
        .admin-route-detail-inline {
          min-width: 0;
        }

        .admin-route-detail-customer-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-route-detail-customer-name {
          display: block;
          max-width: 210px;
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-route-detail-muted {
          display: block;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-route-detail-inline .anticon {
          color: #64748b;
        }

        .admin-route-detail-inline .ant-typography {
          color: #0f172a !important;
          font-weight: 700;
        }

        .admin-route-detail-text-ellipsis {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-route-detail-table .ant-pagination {
          margin-top: 18px !important;
        }

        .admin-route-detail-table .ant-pagination-total-text {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 1199px) {
        @media (max-width: 767px) {
          .admin-route-detail-info-grid,
          .admin-route-detail-info-grid,
          .admin-route-detail-contact-strip {
            grid-template-columns: 1fr;
          }

          .admin-route-detail-info-row,
          .admin-route-detail-info-row.is-wide {
            grid-template-columns: 1fr;
            align-items: start;
            gap: 4px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-route-detail-panel {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
