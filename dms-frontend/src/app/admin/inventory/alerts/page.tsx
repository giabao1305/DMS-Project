"use client";

import {
  AlertOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Flex, Input, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { useGetProductsQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";

const { Text, Title } = Typography;

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export default function InventoryAlertsPage() {
  const [keyword, setKeyword] = useState("");
  const { data: products = [], isLoading, refetch } = useGetProductsQuery();

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= product.minStock),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return lowStockProducts;

    return lowStockProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedKeyword) ||
        product.code.toLowerCase().includes(normalizedKeyword),
    );
  }, [keyword, lowStockProducts]);

  const columns: ColumnsType<Product> = [
    {
      title: "Mã SP",
      dataIndex: "code",
      width: 140,
      render: (value: string) => (
        <Text className="admin-stock-alert-code">{value}</Text>
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "name",
      ellipsis: true,
      render: (value: string, record) => (
        <div>
          <Text className="admin-stock-alert-strong">{value}</Text>
          <Text className="admin-stock-alert-muted">
            {record.unit} - {money(record.price)}
          </Text>
        </div>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      width: 130,
      align: "center",
      render: (value: number) => (
        <Tag color="red" className="admin-stock-alert-tag">
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
    {
      title: "Cần nhập thêm",
      width: 150,
      align: "center",
      render: (_, record) => Math.max(record.minStock - record.stock, 0),
    },
    {
      title: "Trạng thái",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Tag
          color={record.stock === 0 ? "volcano" : "orange"}
          className="admin-stock-alert-tag"
        >
          {record.stock === 0 ? "Hết hàng" : "Sắp hết hàng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Link href={`/admin/products/${record._id}/edit`}>
          <Button size="small">Cập nhật</Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />
      <AdminPageHeader
        title="Cảnh báo tồn kho"
        description="Theo dõi sản phẩm hết hàng hoặc dưới ngưỡng tồn tối thiểu."
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
        }
      />

      <section className="admin-stock-alert-shell">
        <Card className="admin-stock-alert-hero" variant="borderless">
          <Flex align="center" justify="space-between" gap={18} wrap="wrap">
            <Flex align="center" gap={16}>
              <div className="admin-stock-alert-icon">
                <AlertOutlined />
              </div>
              <div>
                <Title level={3}>
                  {lowStockProducts.length.toLocaleString("vi-VN")} cảnh báo
                </Title>
                <Text>Sản phẩm cần được bổ sung hoặc kiểm tra tồn kho.</Text>
              </div>
            </Flex>

            <Input
              allowClear
              size="large"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Tìm mã hoặc tên sản phẩm"
              className="admin-stock-alert-search"
            />
          </Flex>
        </Card>

        <Card className="admin-stock-alert-table-card" variant="borderless">
          <Table<Product>
            rowKey="_id"
            loading={isLoading}
            dataSource={filteredProducts}
            columns={columns}
            scroll={{ x: 980 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
            }}
            locale={{
              emptyText: (
                <Empty
                  image={<InboxOutlined />}
                  description="Không có sản phẩm cần cảnh báo"
                />
              ),
            }}
          />
        </Card>
      </section>

      <style jsx global>{`
        .admin-stock-alert-shell {
          display: grid;
          gap: 16px;
        }

        .admin-stock-alert-hero,
        .admin-stock-alert-table-card {
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.055) !important;
        }

        .admin-stock-alert-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #ffffff;
          font-size: 24px;
          background: #ef4444;
        }

        .admin-stock-alert-hero h3.ant-typography {
          margin: 0;
          color: #0f172a;
          font-weight: 900;
        }

        .admin-stock-alert-hero span.ant-typography,
        .admin-stock-alert-muted {
          display: block;
          color: #64748b !important;
          font-size: 12.5px;
        }

        .admin-stock-alert-search {
          width: 340px;
          max-width: 100%;
        }

        .admin-stock-alert-code,
        .admin-stock-alert-strong {
          color: #0f172a !important;
          font-weight: 900;
        }

        .admin-stock-alert-code {
          color: #2563eb !important;
        }

        .admin-stock-alert-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 800;
        }
      `}</style>
    </>
  );
}
