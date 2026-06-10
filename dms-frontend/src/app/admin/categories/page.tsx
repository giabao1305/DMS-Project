"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/features/categories/categoryService";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/features/categories/categoryTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;
const CATEGORY_CODE_PREFIX = "NES-CAT-";

function CategoryCodeInput({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const suffix = value?.replace(/^NES-CAT-/i, "") ?? "";

  return (
    <Space.Compact className="admin-category-code-compact">
      <span className="admin-category-code-prefix">{CATEGORY_CODE_PREFIX}</span>
      <Input
        size="large"
        placeholder="COF"
        disabled={disabled}
        value={suffix}
        onChange={(event) => {
          const nextSuffix = event.target.value
            .toUpperCase()
            .replace(/^NES-CAT-/i, "")
            .replace(/^NESCAT/i, "")
            .replace(/[^A-Z0-9]/g, "");
          onChange?.(`${CATEGORY_CODE_PREFIX}${nextSuffix}`);
        }}
      />
    </Space.Compact>
  );
}

export default function CategoriesPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateCategoryRequest>();
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  useRealtimeRefetch(["category-updated"], refetch);

  const submitting = creating || updating;

  const overview = useMemo(() => {
    const active = categories.filter((category) => category.isActive).length;

    return {
      total: categories.length,
      active,
      inactive: categories.length - active,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return categories.filter((category) => {
      return (
        normalizedKeyword.length === 0 ||
        category.code?.toLowerCase().includes(normalizedKeyword) ||
        category.name.toLowerCase().includes(normalizedKeyword) ||
        category.description?.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [categories, keyword]);


  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      code: category.code,
      name: category.name,
      description: category.description,
    });
    setOpen(true);
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = async (values: CreateCategoryRequest) => {
    try {
      const body = Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      ) as CreateCategoryRequest | UpdateCategoryRequest;

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          body,
        }).unwrap();
        message.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(body as CreateCategoryRequest).unwrap();
        message.success("Thêm danh mục thành công");
      }

      handleClose();
    } catch (error: unknown) {

      const err = error as {
        data?: {
          message?: string | string[];
        };
      };

      message.error(
        Array.isArray(err?.data?.message)
          ? err.data.message[0]
          : err?.data?.message || "Lưu danh mục thất bại",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      message.success("Xóa danh mục thành công");
    } catch {
      message.error("Xóa danh mục thất bại");
    }
  };

  const columns: ColumnsType<Category> = [
    {
      title: "Mã danh mục",
      dataIndex: "code",
      width: 170,
      fixed: "left",
      render: (value?: string) => (
        <Text code className="admin-categories-code">
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      width: 280,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <Flex
            align="center"
            justify="center"
            className="admin-categories-row-icon"
          >
            <TagsOutlined />
          </Flex>
          <Text className="admin-categories-strong">{value}</Text>
        </Flex>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 150,
      align: "center",
      render: (isActive: boolean) => (
        <Tag
          color={isActive ? "green" : "default"}
          className="admin-categories-status-tag"
        >
          {isActive ? "Đang dùng" : "Khóa"}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      width: 420,
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 220,
      fixed: "right",
      render: (_, record) => (
        <Space size={8} className="admin-categories-actions">
          <Button
            color="orange"
            variant="solid"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            className="admin-categories-action-button"
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa danh mục?"
            description="Bạn chắc chắn muốn xóa danh mục này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              color="danger"
              variant="solid"
              icon={<DeleteOutlined />}
              className="admin-categories-action-button"
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
        title="Quản lý danh mục"
        description="Quản lý nhóm sản phẩm dùng để phân loại hàng hóa trong hệ thống."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Thêm danh mục
          </Button>
        }
      />

      <section className="admin-categories-shell">
        <div className="admin-categories-hero">
          <div>
            <Tag className="admin-categories-hero-tag">Quản lý danh mục</Tag>
            <Title level={2} className="admin-categories-hero-title">
              Điều phối danh mục hàng hóa
            </Title>
            <Text className="admin-categories-hero-desc">
              Chuẩn hóa nhóm sản phẩm để dữ liệu hàng hóa, đơn hàng và báo cáo
              dễ lọc, dễ theo dõi hơn.
            </Text>

            <div className="admin-categories-hero-metrics">
              <div>
                <TagsOutlined />
                <span>Tổng danh mục</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <TagsOutlined />
                <span>Đang dùng</span>
                <strong>{overview.active.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <TagsOutlined />
                <span>Đang khóa</span>
                <strong>{overview.inactive.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-categories-hero-panel">
            <TagsOutlined />
            <span>Kết quả lọc</span>
            <strong>{filteredCategories.length.toLocaleString("vi-VN")}</strong>
            <Text>danh mục đang hiển thị</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-categories-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-categories-filter-title">
                Bộ lọc danh mục
              </Title>
              <Text className="admin-categories-filter-description">
                Tìm theo mã, tên hoặc mô tả danh mục sản phẩm.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-categories-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm mã, tên hoặc mô tả danh mục"
                prefix={<SearchOutlined />}
                className="admin-categories-search-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-categories-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-categories-panel-title">
                  Danh sách danh mục
                </Text>
                <Text className="admin-categories-panel-desc">
                  Hiển thị {filteredCategories.length.toLocaleString("vi-VN")}{" "}
                  danh mục
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<Category>
            rowKey="_id"
            loading={isLoading || creating || updating || deleting}
            dataSource={filteredCategories}
            columns={columns}
            scroll={{ x: 1240 }}
            className="admin-categories-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} danh mục`,
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy danh mục phù hợp" />,
            }}
          />
        </Card>
      </section>

      <Modal
        open={open}
        forceRender
        centered
        width={560}
        title={null}
        footer={null}
        mask
        maskClosable={!submitting}
        keyboard={!submitting}
        closable={!submitting}
        onCancel={handleClose}
        styles={{
          content: {
            borderRadius: 8,
            padding: 0,
            overflow: "hidden",
          },
          body: {
            padding: 0,
          },
        }}
      >
        <div className="admin-category-modal-head">
          <Flex align="center" gap={14}>
            <Flex
              align="center"
              justify="center"
              className="admin-category-modal-icon"
            >
              {editingCategory ? <EditOutlined /> : <PlusOutlined />}
            </Flex>

            <div>
              <Title level={4} className="admin-category-modal-title">
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
              </Title>
              <Text className="admin-category-modal-desc">
                {editingCategory
                  ? "Cập nhật tên và mô tả của danh mục hiện tại."
                  : "Tạo nhóm sản phẩm mới để phân loại hàng hóa."}
              </Text>
            </div>
          </Flex>
        </div>

        <div className="admin-category-modal-body">
          <Form<CreateCategoryRequest>
            form={form}
            layout="vertical"
            preserve={false}
            onFinish={handleSubmit}
            requiredMark="optional"
          >
            <section className="admin-category-form-section">
              <Form.Item
                label="Mã danh mục"
                name="code"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mã danh mục",
                  },
                  {
                    pattern: /^NES-CAT-[A-Z0-9]{2,6}$/,
                    message: "Mã danh mục có dạng NES-CAT-COF",
                  },
                ]}
              >
                <CategoryCodeInput disabled={submitting} />
              </Form.Item>

              <Form.Item
                label="Tên danh mục"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên danh mục",
                  },
                  {
                    whitespace: true,
                    message: "Tên danh mục không được chỉ chứa khoảng trắng",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Ví dụ: Nước giải khát"
                  disabled={submitting}
                />
              </Form.Item>

              <Form.Item label="Mô tả" name="description">
                <Input.TextArea
                  rows={4}
                  placeholder="Nhập mô tả ngắn cho danh mục"
                  disabled={submitting}
                  showCount
                  maxLength={300}
                />
              </Form.Item>
            </section>

            <Flex
              justify="flex-end"
              gap={12}
              wrap="wrap"
              className="admin-category-form-footer"
            >
              <Button
                size="large"
                onClick={handleClose}
                disabled={submitting}
                className="admin-categories-action-button"
              >
                Hủy
              </Button>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={submitting}
                icon={editingCategory ? <EditOutlined /> : <PlusOutlined />}
                className="admin-categories-action-button"
              >
                {editingCategory ? "Cập nhật danh mục" : "Thêm danh mục"}
              </Button>
            </Flex>
          </Form>
        </div>
      </Modal>

      <style jsx global>{`
        .admin-categories-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-categories-code {
          white-space: nowrap;
          font-weight: 800;
        }

        .admin-category-code-compact {
          width: 100%;
        }

        .admin-category-code-prefix {
          height: 40px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          border: 1px solid #d9d9d9;
          border-right: 0;
          border-radius: 8px 0 0 8px;
          background: #f5f7fb;
          color: #475569;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .admin-category-code-compact .ant-input {
          border-radius: 0 8px 8px 0 !important;
        }

        .admin-categories-hero {
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

        .admin-categories-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-categories-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-categories-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-categories-hero-metrics {
          margin-top: 24px;
          max-width: 760px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-categories-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-categories-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-categories-hero-metrics .anticon {
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

        .admin-categories-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-categories-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-categories-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-categories-hero-panel .anticon {
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

        .admin-categories-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-categories-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-categories-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-categories-filter-card,
        .admin-categories-table-card {
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

        .admin-categories-filter-card:hover,
        .admin-categories-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-categories-filter-card {
          margin-bottom: 16px;
        }

        .admin-categories-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-categories-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-categories-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-categories-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-categories-search-input,
        .admin-categories-action-button {
          border-radius: 8px !important;
        }

        .admin-categories-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-categories-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-categories-panel-title,
        .admin-categories-panel-desc,
        .admin-categories-strong {
          display: block;
        }

        .admin-categories-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-categories-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-categories-result-tag,
        .admin-categories-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-categories-status-tag {
          min-width: 96px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-categories-table .ant-table,
        .admin-categories-table .ant-table-container,
        .admin-categories-table .ant-table-content,
        .admin-categories-table .ant-table-body,
        .admin-categories-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-categories-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-categories-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-categories-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-categories-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-categories-table .ant-table-cell-fix-left,
        .admin-categories-table .ant-table-cell-fix-left-first,
        .admin-categories-table .ant-table-cell-fix-left-last,
        .admin-categories-table .ant-table-cell-fix-right,
        .admin-categories-table .ant-table-cell-fix-right-first,
        .admin-categories-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-categories-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left,
        .admin-categories-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right,
        .admin-categories-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-first,
        .admin-categories-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-categories-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-categories-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-categories-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left,
        .admin-categories-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right,
        .admin-categories-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-first,
        .admin-categories-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-last,
        .admin-categories-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-categories-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-categories-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-categories-row-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-categories-strong {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-categories-actions {
          justify-content: center;
        }

        .admin-categories-action-button {
          height: 40px !important;
          font-weight: 700 !important;
        }

        .admin-category-modal-head {
          padding: 22px 24px 18px;
          border-bottom: 1px solid #dbe4f0;
          background: #f8fafc;
        }

        .admin-category-modal-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          font-size: 22px;
          background: #eff6ff;
        }

        .admin-category-modal-title.ant-typography {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-category-modal-desc.ant-typography {
          color: #64748b;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-category-modal-body {
          padding: 20px;
          background: #ffffff;
        }

        .admin-category-form-section {
          padding: 0;
        }

        .admin-category-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbe4f0;
        }

        @media (max-width: 1199px) {
          .admin-categories-hero {
            grid-template-columns: 1fr;
          }

          .admin-categories-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-categories-hero-metrics > div {
            border-right: 0;
          }

          .admin-categories-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-categories-hero {
            padding: 20px;
          }

          .admin-categories-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-categories-filter-actions,
          .admin-categories-search-input,
          .admin-categories-action-button {
            width: 100% !important;
          }

          .admin-category-modal-body {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
