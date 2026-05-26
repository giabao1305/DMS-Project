"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Segmented,
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
import {
  useDeleteCustomerMutation,
  useGetCustomersPageQuery,
} from "@/features/customers/customerService";
import type {
  Customer,
  CustomerStatus,
} from "@/features/customers/customerTypes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type CustomerStatusFilter = "all" | CustomerStatus;
const isMongoId = (value: string) => /^[a-f\d]{24}$/i.test(value);

const statusMap: Record<CustomerStatus, { color: string; text: string }> = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  rejected: { color: "red", text: "Từ chối" },
};

const getSellerName = (customer: Customer) => {
  const seller = customer.assignedSeller;
  if (!seller) return "-";
  return typeof seller === "string"
    ? isMongoId(seller)
      ? "-"
      : seller
    : seller.fullName || seller.email || "-";
};

export default function CustomersPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CustomerStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchKeyword = useDebouncedValue(keyword);

  const { data, isLoading, refetch } = useGetCustomersPageQuery({
    page,
    limit: pageSize,
    search: searchKeyword.trim() || undefined,
    status: status === "all" ? undefined : status,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const customers = useMemo(() => data?.data ?? [], [data?.data]);
  const totalCustomers = data?.meta.total ?? 0;
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation();

  useRealtimeRefetch(["new-notification", "customer-updated"], refetch);

  const overview = useMemo(() => {
    const pending = customers.filter((item) => item.status === "pending").length;
    const approved = customers.filter((item) => item.status === "approved").length;
    const rejected = customers.filter((item) => item.status === "rejected").length;

    return {
      total: customers.length,
      pending,
      approved,
      rejected,
    };
  }, [customers]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id).unwrap();
      message.success("Xóa khách hàng thành công");
    } catch {
      message.error("Xóa khách hàng thất bại");
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      width: 260,
      fixed: "left",
      render: (value: string, record) => (
        <div className="admin-customers-cell-copy">
          <Text className="admin-customers-strong">{value}</Text>
          <Text className="admin-customers-muted">
            {record.customerType || "Điểm bán"}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái duyệt",
      dataIndex: "status",
      width: 170,
      align: "center",
      render: (customerStatus: Customer["status"]) => {
        const current = customerStatus
          ? statusMap[customerStatus]
          : { color: "default", text: "-" };

        return (
          <Tag color={current.color} className="admin-customers-status-tag">
            {current.text}
          </Tag>
        );
      },
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 160,
      render: (value?: string) => value || "-",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      width: 280,
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Chủ cửa hàng",
      dataIndex: "ownerName",
      width: 180,
      render: (value?: string) => value || "-",
    },
    {
      title: "Seller phụ trách",
      width: 210,
      ellipsis: true,
      render: (_, record) => getSellerName(record),
    },
    {
      title: "Lý do từ chối",
      dataIndex: "rejectReason",
      width: 220,
      ellipsis: true,
      render: (value?: string, record?: Customer) =>
        record?.status === "rejected" ? value || "-" : "-",
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 290,
      fixed: "right",
      render: (_, record) => (
        <Space size={8} className="admin-customers-actions">
          <Link href={`/admin/customers/${record._id}`}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              className="admin-customers-action-button"
            >
              Chi tiết
            </Button>
          </Link>

          <Link href={`/admin/customers/${record._id}/edit`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              className="admin-customers-action-button"
            >
              Sửa
            </Button>
          </Link>

          <Popconfirm
            title="Xóa khách hàng?"
            description="Bạn chắc chắn muốn xóa khách hàng này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              color="danger"
              variant="solid"
              icon={<DeleteOutlined />}
              className="admin-customers-action-button"
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
        title="Quản lý khách hàng"
        description="Quản lý khách hàng, điểm bán, trạng thái duyệt và seller phụ trách."
        extra={
          <Link href="/admin/customers/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm khách hàng
            </Button>
          </Link>
        }
      />

      <section className="admin-customers-shell">
        <div className="admin-customers-hero">
          <div>
            <Tag className="admin-customers-hero-tag">Quản lý khách hàng</Tag>
            <Title level={2} className="admin-customers-hero-title">
              Điều phối điểm bán
            </Title>
            <Text className="admin-customers-hero-desc">
              Theo dõi khách hàng, trạng thái kiểm duyệt và vùng phụ trách của
              từng seller trong hệ thống phân phối.
            </Text>

            <div className="admin-customers-hero-metrics">
              <div>
                <TeamOutlined />
                <span>Tổng khách</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <ShopOutlined />
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

          <div className="admin-customers-hero-panel">
            <ShopOutlined />
            <span>Kết quả lọc</span>
            <strong>{totalCustomers.toLocaleString("vi-VN")}</strong>
            <Text>khách hàng đang hiển thị</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-customers-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-customers-filter-title">
                Bộ lọc khách hàng
              </Title>
              <Text className="admin-customers-filter-description">
                Tìm theo tên, điện thoại, địa chỉ, chủ cửa hàng, seller hoặc lọc
                theo trạng thái duyệt.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-customers-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm khách hàng, điện thoại, seller"
                prefix={<SearchOutlined />}
                className="admin-customers-search-input"
                value={keyword}
                onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
              />

              <Segmented<CustomerStatusFilter>
                size="large"
                value={status}
                onChange={(value) => { setStatus(value); setPage(1); }}
                className="admin-customers-status-select"
                options={[
                  { label: "Tất cả trạng thái", value: "all" },
                  { label: "Chờ duyệt", value: "pending" },
                  { label: "Đã duyệt", value: "approved" },
                  { label: "Từ chối", value: "rejected" },
                ]}
              />

            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-customers-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-customers-panel-title">
                  Danh sách khách hàng
                </Text>
                <Text className="admin-customers-panel-desc">
                  Hiển thị {totalCustomers.toLocaleString("vi-VN")}{" "}
                  khách hàng
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<Customer>
            rowKey="_id"
            loading={isLoading || deleting}
            dataSource={customers}
            columns={columns}
            scroll={{ x: 1770 }}
            className="admin-customers-table"
            pagination={{
              current: page,
              pageSize,
              total: totalCustomers,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} khách hàng`,
            }}
            onChange={(pagination) => {
              setPage(pagination.current ?? 1);
              setPageSize(pagination.pageSize ?? 10);
            }}
            locale={{              emptyText: <Empty description="Không tìm thấy khách hàng phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-customers-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-customers-hero {
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

        .admin-customers-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-customers-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-customers-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-customers-hero-metrics {
          margin-top: 24px;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-customers-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-customers-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-customers-hero-metrics .anticon {
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

        .admin-customers-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-customers-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-customers-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-customers-hero-panel .anticon {
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

        .admin-customers-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-customers-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-customers-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-customers-filter-card,
        .admin-customers-table-card {
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

        .admin-customers-filter-card:hover,
        .admin-customers-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-customers-filter-card {
          margin-bottom: 16px;
        }

        .admin-customers-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-customers-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-customers-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-customers-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-customers-status-select {
          width: 210px !important;
        }

        .admin-customers-search-input,
        .admin-customers-status-select .ant-select-selector,
        .admin-customers-action-button {
          border-radius: 8px !important;
        }

        .admin-customers-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-customers-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-customers-panel-title,
        .admin-customers-panel-desc,
        .admin-customers-strong,
        .admin-customers-muted {
          display: block;
        }

        .admin-customers-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-customers-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-customers-result-tag,
        .admin-customers-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-customers-status-tag {
          min-width: 108px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-customers-table .ant-table,
        .admin-customers-table .ant-table-container,
        .admin-customers-table .ant-table-content,
        .admin-customers-table .ant-table-body,
        .admin-customers-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-customers-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-customers-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-customers-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-customers-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-customers-table .ant-table-cell-fix-left,
        .admin-customers-table .ant-table-cell-fix-left-first,
        .admin-customers-table .ant-table-cell-fix-left-last,
        .admin-customers-table .ant-table-cell-fix-right,
        .admin-customers-table .ant-table-cell-fix-right-first,
        .admin-customers-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-customers-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .admin-customers-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-customers-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-first,
        .admin-customers-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-customers-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-customers-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-customers-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left,
        .admin-customers-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right,
        .admin-customers-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-first,
        .admin-customers-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-last,
        .admin-customers-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-customers-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-customers-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-customers-cell-copy {
          min-width: 0;
        }

        .admin-customers-strong {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-customers-muted {
          max-width: 210px;
          overflow: hidden;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-customers-actions {
          justify-content: center;
        }

        .admin-customers-action-button {
          height: 40px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 1199px) {
          .admin-customers-hero {
            grid-template-columns: 1fr;
          }

          .admin-customers-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-customers-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-customers-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-customers-hero {
            padding: 20px;
          }

          .admin-customers-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-customers-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-customers-hero-metrics > div,
          .admin-customers-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-customers-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-customers-filter-actions,
          .admin-customers-search-input,
          .admin-customers-status-select,
          .admin-customers-action-button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
