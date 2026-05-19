"use client";

import {
  AlertOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  TagsOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Dropdown,
  Empty,
  Flex,
  Image,
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
import type { Category } from "@/features/categories/categoryTypes";
import {
  useDeleteProductMutation,
  useGetProductsPageQuery,
  useToggleProductStatusMutation,
} from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title } = Typography;

type ProductRealtimePayload = {
  product?: string | Product;
};

type ProductViewMode = "table" | "card";

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const getCategoryName = (category: Product["category"]) => {
  if (!category) return "-";
  if (typeof category === "string") return category;
  return (category as Category)?.name || "-";
};

export default function ProductsPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<ProductViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useGetProductsPageQuery({
    page,
    limit: pageSize,
    search: keyword.trim() || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const products = useMemo(() => data?.data ?? [], [data?.data]);
  const totalProducts = data?.meta.total ?? 0;
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();
  const [toggleProductStatus, { isLoading: togglingStatus }] =
    useToggleProductStatusMutation();

  useRealtimeRefetch(
    ["new-notification", "product-updated", "stock-updated"],
    refetch,
  );

  const highlightedProductId = useRealtimeHighlight(
    ["product-updated", "stock-updated"],
    (payload) => {
      const product = (payload as ProductRealtimePayload).product;
      return typeof product === "string" ? product : product?._id;
    },
  );

  const overview = useMemo(() => {
    const lowStock = products.filter(
      (product) => product.stock <= product.minStock,
    ).length;
    const active = products.filter((product) => product.isActive).length;

    return {
      total: products.length,
      active,
      lowStock,
      stock: products.reduce((sum, product) => sum + product.stock, 0),
    };
  }, [products]);

  const hasFilter = keyword.trim().length > 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      message.success("Xóa sản phẩm thành công");
    } catch {
      message.error("Xóa sản phẩm thất bại");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleProductStatus(id).unwrap();
      message.success("Cập nhật trạng thái thành công");
    } catch {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleChangeStatus = async (record: Product, nextActive: boolean) => {
    if (record.isActive === nextActive) return;
    await handleToggleStatus(record._id);
  };

  const renderStatusDropdown = (record: Product) => (
    <Dropdown
      trigger={["click"]}
      overlayClassName="admin-products-status-menu"
      menu={{
        selectedKeys: [record.isActive ? "active" : "inactive"],
        items: [
          {
            key: "active",
            label: <span className="admin-products-status-menu-label is-active">Hoạt động</span>,
          },
          {
            key: "inactive",
            label: <span className="admin-products-status-menu-label is-inactive">Khóa</span>,
          },
        ],
        onClick: ({ key }) => handleChangeStatus(record, key === "active"),
      }}
    >
      <Button
        type="text"
        loading={togglingStatus}
        className={
          record.isActive
            ? "admin-products-status-dropdown is-active"
            : "admin-products-status-dropdown is-inactive"
        }
      >
        <span className="admin-products-status-text">
          {record.isActive ? "Hoạt động" : "Khóa"}
        </span>
        <DownOutlined />
      </Button>
    </Dropdown>
  );

  const columns: ColumnsType<Product> = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      width: 320,
      fixed: "left",
      render: (value: string, record) => (
        <Flex align="center" gap={12}>
          {record.image ? (
            <Image
              src={record.image}
              alt={value}
              width={48}
              height={48}
              preview={false}
              className="admin-products-thumb"
            />
          ) : (
            <Flex
              align="center"
              justify="center"
              className="admin-products-thumb-placeholder"
            >
              <ShoppingOutlined />
            </Flex>
          )}
          <div className="admin-products-cell-copy">
            <Text className="admin-products-strong">{value}</Text>
            <Text className="admin-products-muted">{record.code}</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      width: 190,
      ellipsis: true,
      render: (category) => getCategoryName(category),
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      width: 150,
      align: "right",
      render: (value: number) => (
        <Text className="admin-products-money">{money(value)}</Text>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      width: 110,
      align: "center",
      render: (value?: string) => value || "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      width: 130,
      align: "center",
      render: (stock: number, record) => (
        <Tag
          color={stock <= record.minStock ? "red" : "green"}
          className="admin-products-count-tag"
        >
          {stock}
        </Tag>
      ),
    },
    {
      title: "Tồn tối thiểu",
      dataIndex: "minStock",
      width: 150,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 150,
      align: "center",
      render: (_, record) => renderStatusDropdown(record),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 290,
      fixed: "right",
      render: (_, record) => (
        <Space size={8} className="admin-products-actions">
          <Link href={`/admin/products/${record._id}`}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              className="admin-products-action-button"
            >
              Chi tiết
            </Button>
          </Link>
          <Link href={`/admin/products/${record._id}/edit`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              className="admin-products-action-button"
            >
              Sửa
            </Button>
          </Link>
          <Popconfirm
            title="Xóa sản phẩm?"
            description="Bạn chắc chắn muốn xóa sản phẩm này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              color="danger"
              variant="solid"
              icon={<DeleteOutlined />}
              className="admin-products-action-button"
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
        title="Quản lý sản phẩm"
        description="Quản lý danh sách sản phẩm, giá bán, danh mục và tồn kho."
        extra={
          <Link href="/admin/products/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm sản phẩm
            </Button>
          </Link>
        }
      />

      <section className="admin-products-shell">
        <div className="admin-products-hero">
          <div>
            <Tag className="admin-products-hero-tag">Product Operation</Tag>
            <Title level={2} className="admin-products-hero-title">
              Điều phối danh mục sản phẩm
            </Title>
            <Text className="admin-products-hero-desc">
              Theo dõi sản phẩm đang bán, giá, danh mục và cảnh báo tồn kho để
              vận hành đơn hàng ổn định.
            </Text>

            <div className="admin-products-hero-metrics">
              <div>
                <ShoppingOutlined />
                <span>Tổng sản phẩm</span>
                <strong>{overview.total.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <TagsOutlined />
                <span>Đang bán</span>
                <strong>{overview.active.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <AlertOutlined />
                <span>Sắp hết hàng</span>
                <strong>{overview.lowStock.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <ShoppingOutlined />
                <span>Tổng tồn</span>
                <strong>{overview.stock.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-products-hero-panel">
            <ShoppingOutlined />
            <span>Kết quả lọc</span>
            <strong>{totalProducts.toLocaleString("vi-VN")}</strong>
            <Text>sản phẩm đang hiển thị</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-products-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-products-filter-title">
                Bộ lọc sản phẩm
              </Title>
              <Text className="admin-products-filter-description">
                Tìm theo tên, mã sản phẩm hoặc danh mục.
              </Text>
            </div>

            <Flex
              gap={12}
              wrap="wrap"
              className="admin-products-filter-actions"
            >
              <Input
                allowClear
                size="large"
                placeholder="Tìm tên, mã sản phẩm, danh mục"
                prefix={<SearchOutlined />}
                className="admin-products-search-input"
                value={keyword}
                onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
              />

              {hasFilter ? (
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={() => { setKeyword(""); setPage(1); }}
                  className="admin-products-action-button"
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-products-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-products-panel-title">
                  Danh sách sản phẩm
                </Text>
                <Text className="admin-products-panel-desc">
                  Hiển thị {totalProducts.toLocaleString("vi-VN")} sản
                  phẩm
                </Text>
              </div>
              <Flex align="center" gap={10} wrap="wrap">
                <Segmented<ProductViewMode>
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    {
                      label: "",
                      value: "table",
                      icon: <UnorderedListOutlined />,
                    },
                    {
                      label: "",
                      value: "card",
                      icon: <AppstoreOutlined />,
                    },
                  ]}
                  className="admin-products-view-switch"
                />
                <Tag color="blue" className="admin-products-result-tag">
                  Realtime product monitoring
                </Tag>
              </Flex>
            </Flex>
          }
        >
          {viewMode === "table" ? (
            <Table<Product>
              rowKey="_id"
              loading={isLoading || deleting || togglingStatus}
              dataSource={products}
              columns={columns}
              scroll={{ x: 1490 }}
              className="admin-products-table"
              rowClassName={(record) =>
                record._id === highlightedProductId
                  ? "realtime-highlight-row"
                  : ""
              }
              pagination={{
                current: page,
                pageSize,
                total: totalProducts,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                showTotal: (total) => `Tổng ${total} sản phẩm`,
              }}
              onChange={(pagination) => {
                setPage(pagination.current ?? 1);
                setPageSize(pagination.pageSize ?? 10);
              }}
              locale={{                emptyText: (
                  <Empty description="Không tìm thấy sản phẩm phù hợp" />
                ),
              }}
            />
          ) : (
            <div className="admin-products-card-view">
              {isLoading || deleting || togglingStatus ? (
                <div className="admin-products-card-loading" />
              ) : products.length === 0 ? (
                <Empty description="Không tìm thấy sản phẩm phù hợp" />
              ) : (
                products.map((product) => (
                  <Card
                    key={product._id}
                    variant="borderless"
                    className={
                      product._id === highlightedProductId
                        ? "admin-products-item-card realtime-highlight-row"
                        : "admin-products-item-card"
                    }
                  >
                    <div className="admin-products-card-media">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width="100%"
                          height={156}
                          preview={false}
                          className="admin-products-card-image"
                        />
                      ) : (
                        <Flex
                          align="center"
                          justify="center"
                          className="admin-products-card-placeholder"
                        >
                          <ShoppingOutlined />
                        </Flex>
                      )}
                    </div>

                    <Flex
                      align="flex-start"
                      justify="space-between"
                      gap={10}
                      className="admin-products-card-head"
                    >
                      <div className="admin-products-card-copy">
                        <Text className="admin-products-card-name">
                          {product.name}
                        </Text>
                        <Text className="admin-products-card-code">
                          {product.code}
                        </Text>
                      </div>
                      {renderStatusDropdown(product)}
                    </Flex>

                    <div className="admin-products-card-meta">
                      <Flex justify="space-between" align="center">
                        <Text>Danh mục</Text>
                        <strong>{getCategoryName(product.category)}</strong>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text>Giá bán</Text>
                        <strong>{money(product.price)}</strong>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text>Tồn kho</Text>
                        <Tag
                          color={
                            product.stock <= product.minStock ? "red" : "green"
                          }
                          className="admin-products-count-tag"
                        >
                          {product.stock}
                        </Tag>
                      </Flex>
                    </div>

                    <Flex
                      gap={8}
                      wrap="wrap"
                      className="admin-products-card-actions"
                    >
                      <Link href={`/admin/products/${product._id}`}>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          className="admin-products-action-button"
                        >
                          Chi tiết
                        </Button>
                      </Link>
                      <Link href={`/admin/products/${product._id}/edit`}>
                        <Button
                          color="orange"
                          variant="solid"
                          icon={<EditOutlined />}
                          className="admin-products-action-button"
                        >
                          Sửa
                        </Button>
                      </Link>
                      <Popconfirm
                        title="Xóa sản phẩm?"
                        description="Bạn chắc chắn muốn xóa sản phẩm này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(product._id)}
                      >
                        <Button
                          color="danger"
                          variant="solid"
                          icon={<DeleteOutlined />}
                          className="admin-products-action-button"
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Flex>
                  </Card>
                ))
              )}
            </div>
          )}
        </Card>
      </section>

      <style jsx global>{`
        .admin-products-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-products-hero {
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
              rgba(16, 185, 129, 0.22),
              transparent 28%
            ),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-products-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-products-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-products-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-products-hero-metrics {
          margin-top: 24px;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-products-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-products-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-products-hero-metrics .anticon {
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

        .admin-products-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-products-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-products-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-products-hero-panel .anticon {
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

        .admin-products-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-products-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-products-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-products-filter-card,
        .admin-products-table-card {
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

        .admin-products-filter-card:hover,
        .admin-products-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-products-filter-card {
          margin-bottom: 16px;
        }

        .admin-products-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-products-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-products-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-products-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-products-search-input,
        .admin-products-action-button {
          border-radius: 8px !important;
        }

        .admin-products-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-products-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-products-panel-title,
        .admin-products-panel-desc,
        .admin-products-strong,
        .admin-products-muted {
          display: block;
        }

        .admin-products-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-products-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-products-result-tag,
        .admin-products-count-tag,
        .admin-products-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-products-count-tag,
        .admin-products-status-tag {
          min-width: 96px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-products-count-tag {
          min-width: 64px;
        }

        .admin-products-status-dropdown {
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

        .admin-products-status-dropdown.is-active {
          border-color: #b7ebc6 !important;
          color: #389e0d !important;
          background: #f6ffed !important;
        }

        .admin-products-status-dropdown.is-active:hover,
        .admin-products-status-dropdown.is-active:focus-visible {
          border-color: #95de64 !important;
          color: #237804 !important;
          background: #efffe5 !important;
        }

        .admin-products-status-dropdown.is-inactive {
          border-color: #d9d9d9 !important;
          color: #64748b !important;
          background: #f8fafc !important;
        }

        .admin-products-status-dropdown.is-inactive:hover,
        .admin-products-status-dropdown.is-inactive:focus-visible {
          border-color: #bfbfbf !important;
          color: #334155 !important;
          background: #f1f5f9 !important;
        }

        .admin-products-status-dropdown .anticon {
          color: currentColor;
          font-size: 11px;
        }

        .admin-products-status-text {
          font-size: 12.5px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-products-status-menu .ant-dropdown-menu {
          padding: 6px !important;
          border: 1px solid #dbe4f0;
          border-radius: 6px !important;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.14) !important;
        }

        .admin-products-status-menu .ant-dropdown-menu-item {
          margin: 2px 0 !important;
          border-radius: 4px !important;
          font-weight: 800;
        }

        .admin-products-status-menu-label {
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

        .admin-products-status-menu-label.is-active {
          border-color: #b7ebc6;
          color: #389e0d;
          background: #f6ffed;
        }

        .admin-products-status-menu-label.is-inactive {
          border-color: #d9d9d9;
          color: #64748b;
          background: #f8fafc;
        }

        .admin-products-status-menu
          .ant-dropdown-menu-item-selected
          .admin-products-status-menu-label.is-active,
        .admin-products-status-menu
          .ant-dropdown-menu-item:hover
          .admin-products-status-menu-label.is-active {
          border-color: #95de64;
          color: #237804;
          background: #efffe5;
        }

        .admin-products-status-menu
          .ant-dropdown-menu-item-selected
          .admin-products-status-menu-label.is-inactive,
        .admin-products-status-menu
          .ant-dropdown-menu-item:hover
          .admin-products-status-menu-label.is-inactive {
          border-color: #bfbfbf;
          color: #334155;
          background: #f1f5f9;
        }

        .admin-products-view-switch {
          padding: 3px;
          border: 1px solid #dbe4f0;
          border-radius: 8px !important;
          background: #f8fafc !important;
        }

        .admin-products-card-view {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-products-card-loading {
          min-height: 260px;
          grid-column: 1 / -1;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: linear-gradient(
            90deg,
            #f8fafc 25%,
            #eef3f8 37%,
            #f8fafc 63%
          );
          background-size: 400% 100%;
          animation: admin-products-card-loading 1.2s ease infinite;
        }

        @keyframes admin-products-card-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .admin-products-item-card {
          overflow: hidden;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
        }

        .admin-products-item-card .ant-card-body {
          padding: 14px !important;
        }

        .admin-products-card-media {
          height: 156px;
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .admin-products-card-image {
          width: 100% !important;
          height: 156px !important;
          object-fit: cover;
          display: block;
        }

        .admin-products-card-placeholder {
          width: 100%;
          height: 156px;
          color: #2563eb;
          font-size: 38px;
          background: #eff6ff;
        }

        .admin-products-card-head {
          margin-top: 14px;
        }

        .admin-products-card-copy {
          min-width: 0;
        }

        .admin-products-card-name,
        .admin-products-card-code {
          display: block;
        }

        .admin-products-card-name {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-products-card-code {
          margin-top: 3px;
          color: #2563eb !important;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-products-card-meta {
          margin-top: 14px;
          padding: 12px;
          display: grid;
          gap: 9px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .admin-products-card-meta .ant-typography {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
        }

        .admin-products-card-meta strong {
          max-width: 150px;
          overflow: hidden;
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-products-card-actions {
          margin-top: 14px;
        }

        .admin-products-table .ant-table,
        .admin-products-table .ant-table-container,
        .admin-products-table .ant-table-content,
        .admin-products-table .ant-table-body,
        .admin-products-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-products-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-products-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-products-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-products-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-products-table .ant-table-cell-fix-left,
        .admin-products-table .ant-table-cell-fix-left-first,
        .admin-products-table .ant-table-cell-fix-left-last,
        .admin-products-table .ant-table-cell-fix-right,
        .admin-products-table .ant-table-cell-fix-right-first,
        .admin-products-table .ant-table-cell-fix-right-last {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-clip: padding-box !important;
        }

        .admin-products-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left,
        .admin-products-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right,
        .admin-products-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-first,
        .admin-products-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-left-last,
        .admin-products-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-first,
        .admin-products-table
          .ant-table-thead
          > tr
          > th.ant-table-cell-fix-right-last {
          background: #f8fafc !important;
          background-color: #f8fafc !important;
        }

        .admin-products-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left,
        .admin-products-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right,
        .admin-products-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-first,
        .admin-products-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-left-last,
        .admin-products-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-first,
        .admin-products-table
          .ant-table-tbody
          > tr:hover
          > td.ant-table-cell-fix-right-last {
          background: #f8fbff !important;
        }

        .admin-products-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 8px 0 8px -8px rgba(15, 23, 42, 0.12) !important;
        }

        .admin-products-thumb {
          object-fit: cover;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-products-thumb-placeholder {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-products-cell-copy {
          min-width: 0;
        }

        .admin-products-strong {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-products-muted {
          color: #2563eb !important;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.4;
        }

        .admin-products-money {
          color: #0f172a !important;
          font-weight: 900;
        }

        .admin-products-actions {
          justify-content: center;
        }

        .admin-products-action-button {
          height: 40px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 1199px) {
          .admin-products-hero {
            grid-template-columns: 1fr;
          }

          .admin-products-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-products-card-view {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-products-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-products-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-products-hero {
            padding: 20px;
          }

          .admin-products-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-products-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-products-hero-metrics > div,
          .admin-products-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-products-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-products-filter-actions,
          .admin-products-search-input,
          .admin-products-action-button,
          .admin-products-view-switch {
            width: 100% !important;
          }

          .admin-products-card-view {
            grid-template-columns: 1fr;
          }

          .admin-products-card-actions .ant-btn,
          .admin-products-card-actions a {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
