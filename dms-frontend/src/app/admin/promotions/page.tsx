"use client";

import {
  CalendarOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  GiftOutlined,
  PercentageOutlined,
  PlusOutlined,
  SearchOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Dropdown,
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
  useDeletePromotionMutation,
  useGetPromotionsQuery,
  useUpdatePromotionMutation,
} from "@/features/promotions/promotionService";
import type {
  Promotion,
  PromotionType,
} from "@/features/promotions/promotionTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type PromotionTypeFilter = "all" | PromotionType;

const typeMap: Record<PromotionType, { label: string; color: string }> = {
  percent: { label: "Giảm %", color: "blue" },
  amount: { label: "Giảm tiền", color: "green" },
  product_gift: { label: "Tặng sản phẩm", color: "blue" },
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

export default function PromotionsPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<PromotionTypeFilter>("all");

  const { data: promotions = [], isLoading, refetch } = useGetPromotionsQuery();
  const [deletePromotion, { isLoading: deleting }] =
    useDeletePromotionMutation();
  const [updatePromotion, { isLoading: updating }] =
    useUpdatePromotionMutation();

  useRealtimeRefetch(["new-notification", "promotion-updated"], refetch);

  const overview = useMemo(() => {
    const active = promotions.filter((promotion) => promotion.isActive).length;
    const gifts = promotions.filter(
      (promotion) => promotion.type === "product_gift",
    ).length;

    return {
      total: promotions.length,
      active,
      inactive: promotions.length - active,
      gifts,
    };
  }, [promotions]);

  const filteredPromotions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        promotion.name.toLowerCase().includes(normalizedKeyword) ||
        promotion.description?.toLowerCase().includes(normalizedKeyword);
      const matchesType = type === "all" || promotion.type === type;

      return matchesKeyword && matchesType;
    });
  }, [promotions, keyword, type]);


  const handleDelete = async (id: string) => {
    try {
      await deletePromotion(id).unwrap();
      message.success("Xóa khuyến mãi thành công");
    } catch {
      message.error("Xóa khuyến mãi thất bại");
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      await updatePromotion({
        id: promotion._id,
        body: { isActive: !promotion.isActive },
      }).unwrap();
      message.success("Cập nhật trạng thái thành công");
    } catch {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleChangeStatus = async (promotion: Promotion, nextActive: boolean) => {
    if (promotion.isActive === nextActive) return;
    await handleToggleStatus(promotion);
  };

  const renderStatusDropdown = (promotion: Promotion) => (
    <Dropdown
      trigger={["click"]}
      overlayClassName="admin-promotions-status-menu"
      menu={{
        selectedKeys: [promotion.isActive ? "active" : "inactive"],
        items: [
          {
            key: "active",
            label: (
              <span className="admin-promotions-status-menu-label is-active">
                Đang dùng
              </span>
            ),
          },
          {
            key: "inactive",
            label: (
              <span className="admin-promotions-status-menu-label is-inactive">
                Khóa
              </span>
            ),
          },
        ],
        onClick: ({ key }) => handleChangeStatus(promotion, key === "active"),
      }}
    >
      <Button
        type="text"
        loading={updating}
        className={
          promotion.isActive
            ? "admin-promotions-status-dropdown is-active"
            : "admin-promotions-status-dropdown is-inactive"
        }
      >
        <span className="admin-promotions-status-text">
          {promotion.isActive ? "Đang dùng" : "Khóa"}
        </span>
        <DownOutlined />
      </Button>
    </Dropdown>
  );

  const getPromotionValue = (promotion: Promotion) => {
    if (promotion.type === "percent") return `${promotion.discountPercent || 0}%`;
    if (promotion.type === "amount") return money(promotion.discountAmount || 0);
    return `Tặng ${promotion.giftQuantity || 0} sản phẩm`;
  };

  const columns: ColumnsType<Promotion> = [
    {
      title: "Khuyến mãi",
      dataIndex: "name",
      width: 280,
      fixed: "left",
      ellipsis: true,
      render: (value: string, record) => (
        <div className="admin-promotions-cell-copy">
          <Text className="admin-promotions-strong">{value}</Text>
          <Text className="admin-promotions-muted">
            {record.description || "Chương trình ưu đãi"}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 150,
      align: "center",
      render: (_, record) => renderStatusDropdown(record),
    },
    {
      title: "Loại",
      dataIndex: "type",
      width: 170,
      align: "center",
      render: (promotionType: PromotionType) => (
        <Tag
          color={typeMap[promotionType]?.color}
          className="admin-promotions-status-tag"
        >
          {typeMap[promotionType]?.label}
        </Tag>
      ),
    },
    {
      title: "Giá trị",
      width: 180,
      render: (_, record) => (
        <Text className="admin-promotions-money">{getPromotionValue(record)}</Text>
      ),
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderValue",
      width: 170,
      align: "right",
      render: (value?: number) => (value ? money(value) : "-"),
    },
    {
      title: "Thời gian",
      width: 240,
      render: (_, record) => (
        <Text className="admin-promotions-date">
          {formatDate(record.startDate)} - {formatDate(record.endDate)}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 230,
      fixed: "right",
      render: (_, record) => (
        <Space size={8} className="admin-promotions-actions">
          <Link href={`/admin/promotions/${record._id}/edit`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              className="admin-promotions-action-button"
            >
              Sửa
            </Button>
          </Link>

          <Popconfirm
            title="Xóa khuyến mãi?"
            description="Bạn chắc chắn muốn xóa khuyến mãi này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              color="danger"
              variant="solid"
              icon={<DeleteOutlined />}
              className="admin-promotions-action-button"
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
        title="Quản lý khuyến mãi"
        description="Quản lý chương trình giảm giá, tặng sản phẩm và thời gian áp dụng."
        extra={
          <Link href="/admin/promotions/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm khuyến mãi
            </Button>
          </Link>
        }
      />

      <section className="admin-promotions-shell">
        <div className="admin-promotions-hero">
          <div>
            <Tag className="admin-promotions-hero-tag">Quản lý khuyến mãi</Tag>
            <Title level={2} className="admin-promotions-hero-title">
              Điều phối chương trình ưu đãi
            </Title>
            <Text className="admin-promotions-hero-desc">
              Theo dõi giảm giá, tặng sản phẩm, điều kiện đơn tối thiểu và thời
              gian áp dụng cho đơn hàng.
            </Text>

            <div className="admin-promotions-hero-metrics">
              <div>
                <PercentageOutlined />
                <span>Tổng chương trình</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <TagsOutlined />
                <span>Đang dùng</span>
                <strong>{overview.active.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <GiftOutlined />
                <span>Tặng sản phẩm</span>
                <strong>{overview.gifts.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <CalendarOutlined />
                <span>Đang khóa</span>
                <strong>{overview.inactive.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-promotions-hero-panel">
            <PercentageOutlined />
            <span>Kết quả lọc</span>
            <strong>{filteredPromotions.length.toLocaleString("vi-VN")}</strong>
            <Text>khuyến mãi đang hiển thị</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-promotions-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-promotions-filter-title">
                Bộ lọc khuyến mãi
              </Title>
              <Text className="admin-promotions-filter-description">
                Tìm theo tên, mô tả hoặc lọc theo loại chương trình.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-promotions-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm tên hoặc mô tả khuyến mãi"
                prefix={<SearchOutlined />}
                className="admin-promotions-search-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

              <Segmented<PromotionTypeFilter>
                size="large"
                value={type}
                onChange={setType}
                className="admin-promotions-type-select"
                options={[
                  { label: "Tất cả loại", value: "all" },
                  { label: "Giảm %", value: "percent" },
                  { label: "Giảm tiền", value: "amount" },
                  { label: "Tặng sản phẩm", value: "product_gift" },
                ]}
              />

            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-promotions-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-promotions-panel-title">
                  Danh sách khuyến mãi
                </Text>
                <Text className="admin-promotions-panel-desc">
                  Hiển thị {filteredPromotions.length.toLocaleString("vi-VN")}{" "}
                  khuyến mãi
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<Promotion>
            rowKey="_id"
            loading={isLoading || deleting || updating}
            dataSource={filteredPromotions}
            columns={columns}
            scroll={{ x: 1420 }}
            className="admin-promotions-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} khuyến mãi`,
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy khuyến mãi phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-promotions-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-promotions-hero {
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

        .admin-promotions-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-promotions-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-promotions-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-promotions-hero-metrics {
          margin-top: 24px;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-promotions-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-promotions-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-promotions-hero-metrics .anticon {
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

        .admin-promotions-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-promotions-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-promotions-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-promotions-hero-panel .anticon {
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

        .admin-promotions-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-promotions-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-promotions-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-promotions-filter-card,
        .admin-promotions-table-card {
          overflow: hidden;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
        }

        .admin-promotions-filter-card {
          margin-bottom: 16px;
        }

        .admin-promotions-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-promotions-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-promotions-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-promotions-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-promotions-type-select {
          width: 210px !important;
        }

        .admin-promotions-search-input,
        .admin-promotions-type-select .ant-select-selector,
        .admin-promotions-action-button {
          border-radius: 8px !important;
        }

        .admin-promotions-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-promotions-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-promotions-panel-title,
        .admin-promotions-panel-desc,
        .admin-promotions-strong,
        .admin-promotions-muted {
          display: block;
        }

        .admin-promotions-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-promotions-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-promotions-result-tag,
        .admin-promotions-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-promotions-status-tag {
          min-width: 108px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-promotions-status-dropdown {
          height: 36px !important;
          min-width: 112px;
          padding: 0 10px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid transparent !important;
          border-radius: 4px !important;
        }

        .admin-promotions-status-dropdown.is-active {
          border-color: #b7ebc6 !important;
          color: #389e0d !important;
          background: #f6ffed !important;
        }

        .admin-promotions-status-dropdown.is-active:hover,
        .admin-promotions-status-dropdown.is-active:focus-visible {
          border-color: #95de64 !important;
          color: #237804 !important;
          background: #efffe5 !important;
        }

        .admin-promotions-status-dropdown.is-inactive {
          border-color: #d9d9d9 !important;
          color: #64748b !important;
          background: #f8fafc !important;
        }

        .admin-promotions-status-dropdown.is-inactive:hover,
        .admin-promotions-status-dropdown.is-inactive:focus-visible {
          border-color: #bfbfbf !important;
          color: #334155 !important;
          background: #f1f5f9 !important;
        }

        .admin-promotions-status-dropdown .anticon {
          color: currentColor;
          font-size: 11px;
        }

        .admin-promotions-status-text {
          font-size: 12.5px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-promotions-status-menu .ant-dropdown-menu {
          padding: 6px !important;
          border: 1px solid #dbe4f0;
          border-radius: 6px !important;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.14) !important;
        }

        .admin-promotions-status-menu .ant-dropdown-menu-item {
          margin: 2px 0 !important;
          border-radius: 4px !important;
          font-weight: 800;
        }

        .admin-promotions-status-menu-label {
          min-width: 108px;
          height: 30px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          border: 1px solid transparent;
          border-radius: 4px;
          font-size: 12.5px;
          font-weight: 900;
        }

        .admin-promotions-status-menu-label.is-active {
          border-color: #b7ebc6;
          color: #389e0d;
          background: #f6ffed;
        }

        .admin-promotions-status-menu-label.is-inactive {
          border-color: #d9d9d9;
          color: #64748b;
          background: #f8fafc;
        }

        .admin-promotions-status-menu
          .ant-dropdown-menu-item-selected
          .admin-promotions-status-menu-label.is-active,
        .admin-promotions-status-menu
          .ant-dropdown-menu-item:hover
          .admin-promotions-status-menu-label.is-active {
          border-color: #95de64;
          color: #237804;
          background: #efffe5;
        }

        .admin-promotions-status-menu
          .ant-dropdown-menu-item-selected
          .admin-promotions-status-menu-label.is-inactive,
        .admin-promotions-status-menu
          .ant-dropdown-menu-item:hover
          .admin-promotions-status-menu-label.is-inactive {
          border-color: #bfbfbf;
          color: #334155;
          background: #f1f5f9;
        }

        .admin-promotions-table .ant-table,
        .admin-promotions-table .ant-table-container,
        .admin-promotions-table .ant-table-content,
        .admin-promotions-table .ant-table-body,
        .admin-promotions-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-promotions-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-promotions-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-promotions-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-promotions-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-promotions-table .ant-table-cell-fix-left,
        .admin-promotions-table .ant-table-cell-fix-left-first,
        .admin-promotions-table .ant-table-cell-fix-left-last,
        .admin-promotions-table .ant-table-cell-fix-right,
        .admin-promotions-table .ant-table-cell-fix-right-first,
        .admin-promotions-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-promotions-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .admin-promotions-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
        .admin-promotions-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-first,
        .admin-promotions-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-promotions-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-promotions-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-promotions-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left,
        .admin-promotions-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right,
        .admin-promotions-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-first,
        .admin-promotions-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-last,
        .admin-promotions-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-promotions-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-promotions-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-promotions-cell-copy {
          min-width: 0;
        }

        .admin-promotions-strong {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-promotions-muted {
          max-width: 220px;
          overflow: hidden;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-promotions-money,
        .admin-promotions-date {
          color: #0f172a !important;
          font-weight: 900;
        }

        .admin-promotions-actions {
          justify-content: center;
        }

        .admin-promotions-action-button {
          height: 40px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 1199px) {
          .admin-promotions-hero {
            grid-template-columns: 1fr;
          }

          .admin-promotions-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-promotions-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-promotions-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-promotions-hero {
            padding: 20px;
          }

          .admin-promotions-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-promotions-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-promotions-hero-metrics > div,
          .admin-promotions-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-promotions-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-promotions-filter-actions,
          .admin-promotions-search-input,
          .admin-promotions-type-select,
          .admin-promotions-action-button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
