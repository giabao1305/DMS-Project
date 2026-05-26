"use client";

import {
  AlertOutlined,
  DownloadOutlined,
  InboxOutlined,
  PlusOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetInventoryTransactionsQuery } from "@/features/inventory/inventoryService";
import type {
  InventoryTransaction,
  InventoryType,
} from "@/features/inventory/inventoryTypes";
import {
  productService,
  useGetProductsQuery,
} from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import type { User } from "@/features/users/userTypes";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import { exportCsv } from "@/lib/exportCsv";
import { useAppDispatch } from "@/store/hooks";

const { Text, Title } = Typography;

const typeMap: Record<InventoryType, { label: string; color: string }> = {
  import: { label: "Nhập kho", color: "green" },
  export: { label: "Xuất kho", color: "orange" },
  order: { label: "Đơn hàng", color: "blue" },
  return: { label: "Trả hàng", color: "purple" },
  adjustment: { label: "Điều chỉnh", color: "purple" },
};

type InventoryRealtimePayload = {
  transaction?: InventoryTransaction;
  product?: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const getProductName = (product: InventoryTransaction["product"]) =>
  typeof product === "string" ? product : (product as Product)?.name || "-";

const getCreatedByName = (user: InventoryTransaction["createdBy"]) =>
  typeof user === "string" ? user : (user as User)?.fullName || "-";

export default function AdminInventoryPage() {
  const dispatch = useAppDispatch();
  const [keyword, setKeyword] = useState("");

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useGetProductsQuery();
  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useGetInventoryTransactionsQuery();

  const highlightedProductId = useRealtimeHighlight(
    ["stock-updated", "product-updated"],
    (payload) => (payload as InventoryRealtimePayload).product,
  );
  const highlightedTransactionId = useRealtimeHighlight(
    ["inventory-updated"],
    (payload) => (payload as InventoryRealtimePayload).transaction?._id,
  );

  useRealtimeRefetch(
    [
      "new-notification",
      "inventory-updated",
      "stock-updated",
      "product-updated",
    ],
    () => {
      dispatch(productService.util.invalidateTags(["Products"]));
      refetchProducts();
      refetchTransactions();
    },
  );

  const overview = useMemo(() => {
    const lowStock = products.filter(
      (product) => product.stock <= product.minStock,
    ).length;
    const totalStock = products.reduce(
      (sum, product) => sum + product.stock,
      0,
    );
    const adjustments = transactions.filter(
      (item) => item.type === "adjustment",
    ).length;

    return {
      products: products.length,
      lowStock,
      totalStock,
      transactions: transactions.length,
      adjustments,
    };
  }, [products, transactions]);

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return products.filter((product) => {
      return (
        normalizedKeyword.length === 0 ||
        product.name.toLowerCase().includes(normalizedKeyword) ||
        product.code.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [keyword, products]);

  const filteredTransactions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return transactions.filter((item) => {
      const productName = getProductName(item.product).toLowerCase();
      const createdByName = getCreatedByName(item.createdBy).toLowerCase();

      return (
        normalizedKeyword.length === 0 ||
        productName.includes(normalizedKeyword) ||
        createdByName.includes(normalizedKeyword) ||
        item.note?.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [keyword, transactions]);

  const handleExportProducts = () => {
    exportCsv(
      `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Mã SP", "Tên sản phẩm", "Đơn vị", "Tồn kho", "Tồn tối thiểu", "Trạng thái"],
      filteredProducts.map((product) => [
        product.code,
        product.name,
        product.unit,
        product.stock,
        product.minStock,
        product.stock <= product.minStock ? "Sắp hết hàng" : "Còn hàng",
      ]),
    );
  };

  const handleExportTransactions = () => {
    exportCsv(
      `lich-su-kho-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Sản phẩm",
        "Loại",
        "Số lượng",
        "Tồn trước",
        "Tồn sau",
        "Người tạo",
        "Ghi chú",
        "Ngày tạo",
      ],
      filteredTransactions.map((transaction) => [
        getProductName(transaction.product),
        typeMap[transaction.type]?.label,
        transaction.quantity,
        transaction.beforeStock,
        transaction.afterStock,
        getCreatedByName(transaction.createdBy),
        transaction.note || "-",
        formatDateTime(transaction.createdAt),
      ]),
    );
  };

  const productColumns: ColumnsType<Product> = [
    {
      title: "Mã SP",
      dataIndex: "code",
      width: 140,
      render: (value: string) => (
        <Text className="admin-inventory-code">{value}</Text>
      ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      width: 280,
      ellipsis: true,
      render: (value: string) => (
        <div className="admin-inventory-cell-copy">
          <Text className="admin-inventory-strong">{value}</Text>
          <Text className="admin-inventory-muted">Sản phẩm trong kho</Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      width: 170,
      align: "center",
      render: (_, record) => (
        <Tag
          color={record.stock <= record.minStock ? "red" : "green"}
          className="admin-inventory-status-tag"
        >
          {record.stock <= record.minStock ? "Sắp hết hàng" : "Còn hàng"}
        </Tag>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      width: 120,
      align: "center",
      render: (value?: string) => value || "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      width: 130,
      align: "center",
      render: (value: number, record) => (
        <Tag
          color={value <= record.minStock ? "red" : "green"}
          className="admin-inventory-count-tag"
        >
          {value}
        </Tag>
      ),
    },
    {
      title: "Tồn tối thiểu",
      dataIndex: "minStock",
      width: 150,
      align: "center",
    },
  ];

  const transactionColumns: ColumnsType<InventoryTransaction> = [
    {
      title: "Sản phẩm",
      dataIndex: "product",
      width: 260,
      ellipsis: true,
      render: (product) => (
        <Text className="admin-inventory-strong">{getProductName(product)}</Text>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      width: 150,
      align: "center",
      render: (type: InventoryType) => (
        <Tag color={typeMap[type]?.color} className="admin-inventory-status-tag">
          {typeMap[type]?.label}
        </Tag>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      align: "center",
      render: (value: number) => (
        <Text className="admin-inventory-strong">
          {value.toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Tồn trước",
      dataIndex: "beforeStock",
      width: 130,
      align: "center",
    },
    {
      title: "Tồn sau",
      dataIndex: "afterStock",
      width: 130,
      align: "center",
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      width: 190,
      ellipsis: true,
      render: (user) => getCreatedByName(user),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      width: 240,
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Quản lý tồn kho"
        description="Theo dõi sản phẩm trong kho và lịch sử nhập, xuất, điều chỉnh."
        extra={
          <Flex gap={10} wrap="wrap">
            <Link href="/admin/inventory/alerts">
              <Button icon={<AlertOutlined />}>Cảnh báo tồn kho</Button>
            </Link>
            <Link href="/admin/inventory/create">
              <Button type="primary" icon={<PlusOutlined />}>
                Tạo giao dịch kho
              </Button>
            </Link>
          </Flex>
        }
      />

      <section className="admin-inventory-shell">
        <div className="admin-inventory-hero">
          <div>
            <Tag className="admin-inventory-hero-tag">Quản lý kho</Tag>
            <Title level={2} className="admin-inventory-hero-title">
              Điều phối tồn kho
            </Title>
            <Text className="admin-inventory-hero-desc">
              Theo dõi sức khỏe tồn kho, cảnh báo sản phẩm sắp hết và lịch sử
              biến động số lượng.
            </Text>

            <div className="admin-inventory-hero-metrics">
              <div>
                <InboxOutlined />
                <span>Sản phẩm</span>
                <strong>{overview.products.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <AlertOutlined />
                <span>Cảnh báo kho</span>
                <strong>{overview.lowStock.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <InboxOutlined />
                <span>Tổng tồn</span>
                <strong>{overview.totalStock.toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                <SwapOutlined />
                <span>Giao dịch</span>
                <strong>{overview.transactions.toLocaleString("vi-VN")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-inventory-hero-panel">
            <AlertOutlined />
            <span>Điều chỉnh</span>
            <strong>{overview.adjustments.toLocaleString("vi-VN")}</strong>
            <Text>lần điều chỉnh tồn kho</Text>
          </div>
        </div>

        <Card variant="borderless" className="admin-inventory-filter-card">
          <Flex justify="space-between" align="center" gap={18} wrap="wrap">
            <div>
              <Title level={5} className="admin-inventory-filter-title">
                Bộ lọc kho
              </Title>
              <Text className="admin-inventory-filter-description">
                Tìm theo tên sản phẩm, mã sản phẩm, người tạo hoặc ghi chú.
              </Text>
            </div>

            <Flex gap={12} wrap="wrap" className="admin-inventory-filter-actions">
              <Input
                allowClear
                size="large"
                placeholder="Tìm sản phẩm, mã, người tạo"
                prefix={<SearchOutlined />}
                className="admin-inventory-search-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

              <Button
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleExportProducts}
                className="admin-inventory-action-button"
              >
                Xuất tồn kho
              </Button>

              <Button
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleExportTransactions}
                className="admin-inventory-action-button"
              >
                Xuất lịch sử
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card
          variant="borderless"
          className="admin-inventory-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-inventory-panel-title">
                  Sản phẩm trong kho
                </Text>
                <Text className="admin-inventory-panel-desc">
                  Hiển thị {filteredProducts.length.toLocaleString("vi-VN")} sản
                  phẩm
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<Product>
            className="admin-inventory-table"
            rowKey="_id"
            loading={isLoadingProducts}
            dataSource={filteredProducts}
            columns={productColumns}
            scroll={{ x: 1050 }}
            rowClassName={(record) =>
              record._id === highlightedProductId ? "realtime-highlight-row" : ""
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} sản phẩm`,
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy sản phẩm phù hợp" />,
            }}
          />
        </Card>

        <Card
          variant="borderless"
          className="admin-inventory-table-card"
          title={
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <div>
                <Text className="admin-inventory-panel-title">
                  Lịch sử giao dịch kho
                </Text>
                <Text className="admin-inventory-panel-desc">
                  Hiển thị {filteredTransactions.length.toLocaleString("vi-VN")}{" "}
                  giao dịch
                </Text>
              </div>
            </Flex>
          }
        >
          <Table<InventoryTransaction>
            className="admin-inventory-table"
            rowKey="_id"
            loading={isLoadingTransactions}
            dataSource={filteredTransactions}
            columns={transactionColumns}
            scroll={{ x: 1220 }}
            rowClassName={(record) =>
              record._id === highlightedTransactionId
                ? "realtime-highlight-row"
                : ""
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} giao dịch kho`,
            }}
            locale={{
              emptyText: <Empty description="Không tìm thấy giao dịch phù hợp" />,
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-inventory-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-inventory-hero {
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
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.24), transparent 28%),
            linear-gradient(135deg, #071a24 0%, #102b3a 52%, #12394a 100%);
          box-shadow: 0 22px 46px rgba(7, 26, 36, 0.18);
        }

        .admin-inventory-hero-tag.ant-tag {
          margin: 0 0 14px;
          padding: 4px 12px;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 999px;
          color: #d8edf7;
          font-weight: 800;
          background: rgba(14, 165, 233, 0.12);
        }

        .admin-inventory-hero-title.ant-typography {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .admin-inventory-hero-desc.ant-typography {
          display: block;
          max-width: 680px;
          margin-top: 12px;
          color: #b8d8e6;
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-inventory-hero-metrics {
          margin-top: 24px;
          max-width: 920px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          overflow: hidden;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
        }

        .admin-inventory-hero-metrics > div {
          min-height: 96px;
          padding: 14px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          column-gap: 10px;
          border-right: 1px solid rgba(125, 211, 252, 0.14);
        }

        .admin-inventory-hero-metrics > div:last-child {
          border-right: 0;
        }

        .admin-inventory-hero-metrics .anticon {
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

        .admin-inventory-hero-metrics span {
          color: #9ed7eb;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .admin-inventory-hero-metrics strong {
          margin-top: 5px;
          overflow: hidden;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-inventory-hero-panel {
          min-height: 178px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(125, 211, 252, 0.18);
          border-radius: 8px;
          background: rgba(6, 32, 44, 0.62);
        }

        .admin-inventory-hero-panel .anticon {
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

        .admin-inventory-hero-panel span {
          margin-top: 18px;
          color: #9ed7eb;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-inventory-hero-panel strong {
          margin-top: 8px;
          color: #ffffff;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
        }

        .admin-inventory-hero-panel .ant-typography {
          margin-top: 10px;
          color: #9ed7eb !important;
          font-size: 12px;
          font-weight: 700;
        }

        .admin-inventory-filter-card,
        .admin-inventory-table-card {
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

        .admin-inventory-filter-card:hover,
        .admin-inventory-table-card:hover {
          border-color: #b9cce5 !important;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08) !important;
          transform: translateY(-1px);
        }

        .admin-inventory-filter-card,
        .admin-inventory-table-card {
          margin-bottom: 16px;
        }

        .admin-inventory-filter-card .ant-card-body {
          padding: 20px;
        }

        .admin-inventory-filter-title.ant-typography {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .admin-inventory-filter-description.ant-typography {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-inventory-search-input {
          width: 360px !important;
          max-width: 100%;
        }

        .admin-inventory-search-input,
        .admin-inventory-action-button {
          border-radius: 8px !important;
        }

        .admin-inventory-table-card .ant-card-head {
          min-height: 78px;
          border-bottom: 1px solid #e7edf5 !important;
          background: #fbfdff;
        }

        .admin-inventory-table-card .ant-card-body {
          padding: 18px !important;
        }

        .admin-inventory-panel-title,
        .admin-inventory-panel-desc,
        .admin-inventory-strong,
        .admin-inventory-muted {
          display: block;
        }

        .admin-inventory-panel-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-inventory-panel-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-inventory-result-tag,
        .admin-inventory-count-tag,
        .admin-inventory-status-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
          text-align: center;
        }

        .admin-inventory-table .ant-table,
        .admin-inventory-table .ant-table-container,
        .admin-inventory-table .ant-table-content,
        .admin-inventory-table .ant-table-body,
        .admin-inventory-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-inventory-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-inventory-table .ant-table-thead > tr > th {
          height: 58px;
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-inventory-table .ant-table-tbody > tr > td {
          height: 76px;
          padding-block: 14px !important;
          padding-inline: 16px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
          vertical-align: middle !important;
        }

        .admin-inventory-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-inventory-code,
        .admin-inventory-strong {
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-inventory-code {
          color: #2563eb !important;
        }

        .admin-inventory-cell-copy {
          min-width: 0;
        }

        .admin-inventory-muted {
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-inventory-count-tag,
        .admin-inventory-status-tag {
          min-width: 104px;
          height: 31px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        .admin-inventory-count-tag {
          min-width: 64px;
        }

        @media (max-width: 1199px) {
          .admin-inventory-hero {
            grid-template-columns: 1fr;
          }

          .admin-inventory-hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-inventory-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-inventory-hero-metrics > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }
        }

        @media (max-width: 767px) {
          .admin-inventory-hero {
            padding: 20px;
          }

          .admin-inventory-hero-title.ant-typography {
            font-size: 26px;
          }

          .admin-inventory-hero-metrics {
            grid-template-columns: 1fr;
          }

          .admin-inventory-hero-metrics > div,
          .admin-inventory-hero-metrics > div:nth-child(2) {
            border-right: 0;
          }

          .admin-inventory-hero-metrics > div:not(:last-child) {
            border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          }

          .admin-inventory-filter-actions,
          .admin-inventory-search-input,
          .admin-inventory-action-button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
