"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Segmented,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyCustomersQuery } from "@/features/customers/customerService";
import type { Customer } from "@/features/customers/customerTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import { useAppSelector } from "@/store/hooks";

const { Text } = Typography;

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  softPrimary: "#E7F8F5",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
  dark: "#07171F",
  darkMuted: "#A9D8D1",
};

const statusMap = {
  pending: {
    label: "Chờ duyệt",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    label: "Đã duyệt",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "Từ chối",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
};

const isMongoId = (value: string) => /^[a-f\d]{24}$/i.test(value);

const getUserName = (
  user: Customer["assignedSeller"],
  currentUser?: { _id: string; fullName?: string; email?: string } | null,
) => {
  if (!user) return "-";
  if (typeof user === "string") {
    if (currentUser?._id === user) {
      return currentUser.fullName || currentUser.email || "-";
    }

    return isMongoId(user) ? "-" : user;
  }
  return user.fullName || user.email || user.companyName || "-";
};

export default function SellerCustomersPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data: customers = [], isLoading, refetch } = useGetMyCustomersQuery();

  useRealtimeRefetch(["new-notification", "customer-updated"], refetch);

  const stats = useMemo(
    () => ({
      total: customers.length,
      pending: customers.filter((item) => item.status === "pending").length,
      approved: customers.filter((item) => item.status === "approved").length,
      rejected: customers.filter((item) => item.status === "rejected").length,
    }),
    [customers],
  );

  const approvedRate = stats.total
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

  const focusCustomer =
    customers.find((item) => item.status === "pending") ??
    customers.find((item) => item.status === "rejected") ??
    customers[0];

  const filteredCustomers = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return customers.filter((item) => {
      const matchStatus = status === "all" || item.status === status;

      const matchKeyword =
        !searchValue ||
        item.name?.toLowerCase().includes(searchValue) ||
        item.phone?.toLowerCase().includes(searchValue) ||
        item.address?.toLowerCase().includes(searchValue) ||
        item.ownerName?.toLowerCase().includes(searchValue) ||
        item.customerType?.toLowerCase().includes(searchValue);

      return matchStatus && matchKeyword;
    });
  }, [customers, keyword, status]);

  const columns: ColumnsType<Customer> = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      width: 280,
      render: (value: string, record) => (
        <Flex align="center" gap={12}>
          <div className="seller-customers-store-mark">
            <ShopOutlined />
          </div>

          <Flex vertical gap={3} style={{ minWidth: 0 }}>
            <Text strong ellipsis className="seller-customers-table-strong">
              {value}
            </Text>
            <Text ellipsis className="seller-customers-table-muted">
              {record.ownerName || "Chưa có chủ cửa hàng"}
            </Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      width: 150,
      render: (value?: string) => (
        <Text className="seller-customers-table-muted">{value || "-"}</Text>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      width: 320,
      ellipsis: true,
      render: (value?: string) => (
        <Text className="seller-customers-table-muted">{value || "-"}</Text>
      ),
    },
    {
      title: "Loại KH",
      dataIndex: "customerType",
      width: 150,
      render: (value?: string) => (
        <Tag color="cyan" className="seller-customers-type-tag">
          {value || "Chưa phân loại"}
        </Tag>
      ),
    },
    {
      title: "Seller phụ trách",
      dataIndex: "assignedSeller",
      width: 190,
      render: (value: Customer["assignedSeller"]) => (
        <Text className="seller-customers-table-muted">
          {getUserName(value, currentUser)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 160,
      align: "center",
      render: (value: Customer["status"]) => {
        const item = statusMap[value] ?? statusMap.pending;

        return (
          <Tag
            color={item.color}
            icon={item.icon}
            className="seller-customers-status-tag"
          >
            {item.label}
          </Tag>
        );
      },
    },
    {
      title: "Lý do từ chối",
      dataIndex: "rejectReason",
      width: 240,
      ellipsis: true,
      render: (value?: string) =>
        value ? (
          <Text type="danger" className="seller-customers-reject-text">
            {value}
          </Text>
        ) : (
          <Text className="seller-customers-empty-text">-</Text>
        ),
    },
    {
      title: "Hành động",
      width: 204,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Flex gap={8} justify="center">
          <Link href={`/seller/customers/${record._id}`}>
            <Button icon={<EyeOutlined />} className="seller-customers-action">
              Chi tiết
            </Button>
          </Link>

          {record.status !== "approved" && (
            <Link href={`/seller/customers/${record._id}/edit`}>
              <Button
                icon={<EditOutlined />}
                className="seller-customers-action"
              >
                Sửa
              </Button>
            </Link>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Khách hàng của tôi"
        description="Quản lý khách hàng đã tạo và theo dõi trạng thái duyệt từ admin."
        extra={
          <Link href="/seller/customers/create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="seller-customers-primary-button"
            >
              Thêm khách hàng
            </Button>
          </Link>
        }
      />

      <Flex className="seller-customers-stack" vertical gap={20}>
        <Card
          variant="borderless"
          className="seller-customers-command-card"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <Row gutter={0}>
            <Col xs={24} lg={9}>
              <div className="seller-customers-command-dark">
                <Text className="seller-customers-command-eyebrow">
                  Customer portfolio
                </Text>
                <div className="seller-customers-command-title">
                  Theo dõi điểm bán của bạn
                </div>
                <Text className="seller-customers-command-description">
                  Quản lý trạng thái duyệt, thông tin liên hệ và nhóm khách hàng
                  để chuẩn bị cho các tuyến bán hàng.
                </Text>

                <div className="seller-customers-dark-meter">
                  <span>{approvedRate}%</span>
                  <label>Khách hàng đã được duyệt</label>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={15}>
              <div className="seller-customers-command-summary">
                <div className="seller-customers-command-content">
                  <div>
                    <Flex gap={14} wrap="wrap">
                      <div className="seller-customers-command-stat">
                        <span>{stats.total}</span>
                        <label>Tổng khách</label>
                      </div>
                      <div className="seller-customers-command-stat">
                        <span>{approvedRate}%</span>
                        <label>Tỷ lệ đã duyệt</label>
                      </div>
                      <div className="seller-customers-command-stat">
                        <span>{filteredCustomers.length}</span>
                        <label>Đang hiển thị</label>
                      </div>
                    </Flex>

                    <div className="seller-customers-progress-block">
                      <Flex justify="space-between" align="center" gap={12}>
                        <Text className="seller-customers-progress-label">
                          Tỷ lệ khách đã duyệt
                        </Text>
                        <Text className="seller-customers-progress-value">
                          {stats.approved}/{stats.total}
                        </Text>
                      </Flex>
                      <div className="seller-customers-progress-track">
                        <span style={{ width: `${approvedRate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="seller-customers-focus-card">
                    <Text className="seller-customers-focus-label">
                      Khách cần xử lý
                    </Text>

                    {focusCustomer ? (
                      <>
                        <Text ellipsis className="seller-customers-focus-title">
                          {focusCustomer.name}
                        </Text>

                        <div className="seller-customers-focus-meta">
                          <span>{focusCustomer.phone || "Chưa có SĐT"}</span>
                          <span>
                            {focusCustomer.customerType || "Chưa phân loại"}
                          </span>
                        </div>

                        <Flex justify="space-between" align="center" gap={10}>
                          <Tag
                            color={
                              statusMap[
                                focusCustomer.status as keyof typeof statusMap
                              ]?.color ?? "default"
                            }
                            className="seller-customers-focus-tag"
                          >
                            {statusMap[
                              focusCustomer.status as keyof typeof statusMap
                            ]?.label ?? "Chờ duyệt"}
                          </Tag>

                          <Link href={`/seller/customers/${focusCustomer._id}`}>
                            <Button
                              type="primary"
                              size="small"
                              className="seller-customers-focus-button"
                            >
                              Mở khách
                            </Button>
                          </Link>
                        </Flex>
                      </>
                    ) : (
                      <Text className="seller-customers-focus-empty">
                        Chưa có khách hàng nào.
                      </Text>
                    )}
                  </div>
                </div>

                <div className="seller-customers-status-grid">
                  <div>
                    <CheckCircleOutlined />
                    <span>Đã duyệt</span>
                    <strong>{stats.approved}</strong>
                  </div>
                  <div>
                    <ClockCircleOutlined />
                    <span>Chờ duyệt</span>
                    <strong>{stats.pending}</strong>
                  </div>
                  <div>
                    <CloseCircleOutlined />
                    <span>Từ chối</span>
                    <strong>{stats.rejected}</strong>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-customers-section-title">
                Danh sách khách hàng
              </Text>

              <Text className="seller-customers-section-description">
                Tìm kiếm, lọc trạng thái và thao tác nhanh với từng khách hàng.
              </Text>
            </Flex>
          }
          className="seller-customers-section-card"
        >
          <Flex vertical gap={18}>
            <div className="seller-customers-toolbar">
              <Input
                allowClear
                size="large"
                prefix={<SearchOutlined className="seller-customers-search-icon" />}
                placeholder="Tìm theo tên, SĐT, địa chỉ, loại khách hàng..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="seller-customers-search"
              />

              <Flex gap={10} align="center" wrap="wrap">
                <Tag color="cyan" className="seller-customers-result-tag">
                  {filteredCustomers.length} kết quả
                </Tag>

                <Segmented
                  value={status}
                  onChange={(value) => setStatus(value as FilterStatus)}
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Chờ duyệt", value: "pending" },
                    { label: "Đã duyệt", value: "approved" },
                    { label: "Từ chối", value: "rejected" },
                  ]}
                  className="seller-customers-segmented"
                />
              </Flex>
            </div>

            <Table
              className="seller-customers-table"
              rowKey="_id"
              loading={isLoading}
              columns={columns}
              dataSource={filteredCustomers}
              scroll={{ x: 1540 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (total) => `Tổng ${total} khách hàng`,
              }}
              locale={{
                emptyText: <Empty description="Chưa có khách hàng nào" />,
              }}
            />
          </Flex>
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-content > .ant-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06);
        }

        .seller-content > .ant-card .ant-card-body {
          padding: 20px 22px;
        }

        .seller-customers-stack {
          position: relative;
        }

        .seller-customers-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 208px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-customers-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-customers-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-customers-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-customers-command-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .seller-customers-command-dark {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-customers-command-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-customers-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .seller-customers-command-description {
          display: block;
          max-width: 420px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-customers-dark-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .seller-customers-dark-meter span {
          display: block;
          color: #ffffff;
          font-size: 26px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-customers-dark-meter label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-customers-command-summary {
          height: 100%;
          min-height: 248px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
        }

        .seller-customers-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .seller-customers-command-stat {
          min-width: 128px;
          flex: 1 1 128px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-customers-command-stat span {
          display: block;
          color: ${COLORS.text};
          font-size: 25px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-customers-command-stat label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-customers-progress-block {
          margin-top: 18px;
          padding: 14px 15px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-customers-progress-label {
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-customers-progress-value {
          color: ${COLORS.secondary};
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-customers-progress-track {
          height: 8px;
          margin-top: 12px;
          overflow: hidden;
          border-radius: 999px;
          background: #d9eee9;
        }

        .seller-customers-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: ${COLORS.primary};
        }

        .seller-customers-focus-card {
          min-height: 152px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-customers-focus-label {
          color: ${COLORS.primaryHover};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-customers-focus-title {
          display: block;
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.25;
        }

        .seller-customers-focus-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .seller-customers-focus-meta span {
          padding: 5px 9px;
          border: 1px solid #cbe9e3;
          border-radius: 999px;
          background: #ffffff;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
        }

        .seller-customers-focus-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
        }

        .seller-customers-focus-button.ant-btn {
          border-color: ${COLORS.primary};
          border-radius: 9px;
          background: ${COLORS.primary};
          font-weight: 750;
        }

        .seller-customers-focus-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-customers-focus-empty {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-customers-status-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-customers-status-grid > div {
          min-height: 76px;
          padding: 12px;
          display: grid;
          gap: 4px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-customers-status-grid .anticon {
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-customers-status-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .seller-customers-status-grid strong {
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-customers-section-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-customers-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
        }

        .seller-customers-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-customers-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-customers-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-customers-toolbar {
          min-height: 64px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-customers-search.ant-input-affix-wrapper {
          width: 100%;
          max-width: 460px;
          border-color: #c9e5df;
          border-radius: 12px;
          background: #ffffff;
        }

        .seller-customers-search-icon {
          color: ${COLORS.secondary};
        }

        .seller-customers-result-tag.ant-tag,
        .seller-customers-type-tag.ant-tag,
        .seller-customers-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
        }

        .seller-customers-status-tag.ant-tag {
          min-width: 108px;
          text-align: center;
        }

        .seller-customers-result-tag.ant-tag {
          padding-block: 4px;
        }

        .seller-customers-segmented.ant-segmented {
          border-radius: 12px;
          background: #ffffff;
          padding: 4px;
        }

        .seller-customers-segmented .ant-segmented-item-selected {
          color: ${COLORS.text};
          font-weight: 850;
        }

        .seller-customers-store-mark {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border-radius: 12px;
          background: ${COLORS.softPrimary};
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-customers-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-customers-table-muted {
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-customers-reject-text {
          font-size: 14px;
          font-weight: 650;
          line-height: 1.5;
        }

        .seller-customers-empty-text {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-customers-action.ant-btn {
          height: 34px;
          border-color: ${COLORS.border};
          border-radius: 10px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-customers-action.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-customers-table .ant-table {
          background: #ffffff !important;
        }

        .seller-customers-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-customers-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-customers-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-customers-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }

        .seller-customers-table .ant-table-cell-fix-right,
        .seller-customers-table .ant-table-cell-fix-right-first,
        .seller-customers-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
        }

        .seller-customers-table
          .ant-table-tbody
          > tr.ant-table-row:hover
          > .ant-table-cell-fix-right,
        .seller-customers-table
          .ant-table-tbody
          > tr.ant-table-row:hover
          > .ant-table-cell-fix-right-first,
        .seller-customers-table
          .ant-table-tbody
          > tr.ant-table-row:hover
          > .ant-table-cell-fix-right-last {
          background: ${COLORS.surface} !important;
        }

        @media (max-width: 900px) {
          .seller-customers-command-content {
            grid-template-columns: 1fr;
          }

          .seller-customers-status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
