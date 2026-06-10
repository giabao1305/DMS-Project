"use client";

import type { ReactNode } from "react";
import {
  EditOutlined,
  ShoppingOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Empty,
  Flex,
  Image,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Category } from "@/features/categories/categoryTypes";
import { useGetInventoryTransactionsByProductQuery } from "@/features/inventory/inventoryService";
import type {
  InventoryTransaction,
  InventoryType,
} from "@/features/inventory/inventoryTypes";
import { useGetProductByIdQuery } from "@/features/products/productService";
import type { Product } from "@/features/products/productTypes";
import type { User } from "@/features/users/userTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text, Title, Paragraph } = Typography;

const inventoryTypeMap: Record<InventoryType, { label: string; color: string }> = {
  import: { label: "Nhập kho", color: "green" },
  export: { label: "Xuất kho", color: "orange" },
  order: { label: "Đơn hàng", color: "blue" },
  return: { label: "Trả hàng", color: "blue" },
  adjustment: { label: "Điều chỉnh", color: "blue" },
};

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    data: product,
    isLoading,
    refetch: refetchProduct,
  } = useGetProductByIdQuery(id);

  const {
    data: inventoryTransactions = [],
    isLoading: isLoadingInventory,
    refetch: refetchInventory,
  } = useGetInventoryTransactionsByProductQuery(id);

  useRealtimeRefetch(
    ["inventory-updated", "stock-updated", "product-updated"],
    () => {
      refetchProduct();
      refetchInventory();
    },
  );

  const getCategoryName = (category: Product["category"]) => {
    if (!category) return "-";
    if (typeof category === "string") return /^[a-f\d]{24}$/i.test(category) ? "-" : category;
    const categoryValue = category as Category;
    return categoryValue.code
      ? `${categoryValue.code} - ${categoryValue.name}`
      : categoryValue.name || "-";
  };

  const getCreatedByName = (user: InventoryTransaction["createdBy"]) => {
    if (typeof user === "string") return /^[a-f\d]{24}$/i.test(user) ? "-" : user;
    return (user as User)?.fullName || "-";
  };

  const inventoryColumns: ColumnsType<InventoryTransaction> = [
    {
      title: "Loại",
      dataIndex: "type",
      width: 150,
      align: "center",
      render: (type: InventoryType) => (
        <Tag
          color={inventoryTypeMap[type]?.color}
          className="admin-product-detail-status-tag"
        >
          {inventoryTypeMap[type]?.label || type}
        </Tag>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      align: "center",
      render: (value: number) => (
        <Text className="admin-product-detail-strong">
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
      width: 180,
      render: (user) => getCreatedByName(user),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      width: 260,
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

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết sản phẩm"
          description="Xem thông tin chi tiết của sản phẩm."
          extra={
            <Button onClick={() => router.push("/admin/products")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-product-detail-frame is-loading" />
        <ProductDetailStyles />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết sản phẩm"
          description="Xem thông tin chi tiết của sản phẩm."
          extra={
            <Button onClick={() => router.push("/admin/products")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-product-detail-frame">
          <Empty description="Không tìm thấy sản phẩm" />
        </div>
        <ProductDetailStyles />
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Chi tiết sản phẩm"
        description="Xem thông tin sản phẩm, tồn kho và lịch sử biến động kho."
        extra={
          <Space wrap>
            <Button onClick={() => router.push("/admin/products")}>
              Quay lại
            </Button>
            <Link href={`/admin/products/${product._id}/edit`}>
              <Button color="orange" variant="solid" icon={<EditOutlined />}>
                Sửa sản phẩm
              </Button>
            </Link>
          </Space>
        }
      />

      <section className="admin-product-detail-shell">
        <div className="admin-product-detail-frame">
          <section className="admin-product-detail-section">
            <Flex
              align="center"
              justify="space-between"
              gap={18}
              wrap="wrap"
              className="admin-product-profile-head"
            >
              <Flex align="center" gap={16} className="admin-product-profile-main">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={86}
                    height={86}
                    className="admin-product-profile-image"
                  />
                ) : (
                  <Flex
                    align="center"
                    justify="center"
                    className="admin-product-profile-placeholder"
                  >
                    <ShoppingOutlined />
                  </Flex>
                )}
                <div>
                  <Title level={3} className="admin-product-title">
                    {product.name}
                  </Title>
                  <Text className="admin-product-subtitle">
                    Mã sản phẩm: {product.code}
                  </Text>
                </div>
              </Flex>

              <Space wrap>
                <Tag
                  icon={<TagsOutlined />}
                  color="blue"
                  className="admin-product-detail-status-tag"
                >
                  {getCategoryName(product.category)}
                </Tag>
                <Tag
                  color={product.isActive ? "green" : "default"}
                  className="admin-product-detail-status-tag"
                >
                  {product.isActive ? "Hoạt động" : "Khóa"}
                </Tag>
              </Space>
            </Flex>
          </section>

          <section className="admin-product-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-product-section-head"
            >
              <div>
                <Text className="admin-product-section-title">
                  Thông tin sản phẩm
                </Text>
                <Text className="admin-product-section-desc">
                  Giá bán, đơn vị, tồn kho và ngưỡng cảnh báo.
                </Text>
              </div>
            </Flex>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} xl={8}>
                <InfoItem label="Mã sản phẩm" value={product.code} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem label="Danh mục" value={getCategoryName(product.category)} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem label="Giá bán" value={money(product.price)} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem label="Đơn vị" value={product.unit || "-"} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem
                  label="Tồn kho"
                  value={
                    <Tag
                      color={product.stock <= product.minStock ? "red" : "green"}
                      className="admin-product-detail-status-tag"
                    >
                      {product.stock}
                    </Tag>
                  }
                />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem label="Tồn kho tối thiểu" value={product.minStock} />
              </Col>
            </Row>
          </section>

          <section className="admin-product-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-product-section-head"
            >
              <div>
                <Text className="admin-product-section-title">
                  Mô tả sản phẩm
                </Text>
                <Text className="admin-product-section-desc">
                  Nội dung mô tả hoặc ghi chú bán hàng.
                </Text>
              </div>
            </Flex>

            <div className="admin-product-description-box">
              <Paragraph style={{ marginBottom: 0 }}>
                {product.description || "Chưa có mô tả sản phẩm."}
              </Paragraph>
            </div>
          </section>

          <section className="admin-product-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-product-section-head"
            >
              <div>
                <Text className="admin-product-section-title">Lịch sử kho</Text>
                <Text className="admin-product-section-desc">
                  Biến động nhập, xuất, trả hàng và điều chỉnh tồn kho.
                </Text>
              </div>
            </Flex>

            <Table<InventoryTransaction>
              rowKey="_id"
              loading={isLoadingInventory}
              dataSource={inventoryTransactions}
              columns={inventoryColumns}
              scroll={{ x: 1080 }}
              className="admin-product-detail-table"
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                pageSizeOptions: [8, 12, 20, 50],
                showTotal: (total) => `Tổng ${total} giao dịch kho`,
              }}
              locale={{
                emptyText: <Empty description="Chưa có giao dịch kho" />,
              }}
            />
          </section>
        </div>
      </section>

      <ProductDetailStyles />
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="admin-product-info-item">
      <Text className="admin-product-info-label">{label}</Text>
      <Text className="admin-product-info-value">{value}</Text>
    </div>
  );
}

function ProductDetailStyles() {
  return (
    <style jsx global>{`
      .admin-product-detail-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-product-detail-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-product-detail-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-product-detail-loading 1.2s ease infinite;
      }

      @keyframes admin-product-detail-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-product-detail-section + .admin-product-detail-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-product-profile-head {
        min-height: 100px;
      }

      .admin-product-profile-main {
        min-width: 0;
      }

      .admin-product-profile-image {
        object-fit: cover;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
      }

      .admin-product-profile-placeholder {
        width: 86px;
        height: 86px;
        min-width: 86px;
        border: 1px solid #c7ddfe;
        border-radius: 8px;
        color: #2563eb;
        font-size: 34px;
        background: #eff6ff;
      }

      .admin-product-title.ant-typography {
        margin: 0;
        color: #0f172a;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 0;
      }

      .admin-product-subtitle.ant-typography {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
      }

      .admin-product-detail-status-tag {
        min-width: 96px;
        height: 31px;
        margin-inline-end: 0;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-product-section-head {
        margin-bottom: 18px;
      }

      .admin-product-section-title,
      .admin-product-section-desc,
      .admin-product-info-label,
      .admin-product-info-value {
        display: block;
      }

      .admin-product-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-product-section-desc,
      .admin-product-info-label {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-product-info-item,
      .admin-product-description-box {
        min-height: 82px;
        padding: 16px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-product-info-value {
        margin-top: 4px;
        color: #0f172a !important;
        font-size: 14px;
        font-weight: 900;
        word-break: break-word;
      }

      .admin-product-detail-strong {
        color: #0f172a !important;
        font-weight: 900;
      }

      .admin-product-detail-table .ant-table-container {
        overflow: hidden;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
      }

      .admin-product-detail-table .ant-table-thead > tr > th {
        color: #64748b !important;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        background: #f8fafc !important;
      }

      .admin-product-detail-table .ant-table-tbody > tr > td {
        padding-block: 14px !important;
        background: #ffffff !important;
        border-bottom-color: #edf2f7 !important;
      }

      @media (max-width: 767px) {
        .admin-product-detail-frame {
          padding: 14px;
        }

        .admin-product-title.ant-typography {
          font-size: 21px;
        }
      }
    `}</style>
  );
}
