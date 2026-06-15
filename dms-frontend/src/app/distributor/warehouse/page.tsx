"use client";

import {
  InboxOutlined,
  ProductOutlined,
  ShopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Empty,
  Flex,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

import {
  DistributorCommandCenter,
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import { orderApiMessage } from "@/features/orders/orderErrorMessage";
import {
  useGetWarehousesQuery,
  useGetWarehouseStocksQuery,
  useUpdateWarehouseSellingPriceMutation,
} from "@/features/warehouses/warehouseService";
import type { WarehouseStock } from "@/features/warehouses/warehouseTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
const parseMoneyInput = (value: string) => Number(value.replace(/[^\d]/g, ""));
const moneyInput = (value: number) =>
  `${Math.round(value)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const getStockProduct = (stock: WarehouseStock) =>
  typeof stock.product === "string" ? undefined : stock.product;

export default function DistributorWarehousePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const {
    data: warehouses = [],
    isLoading: loadingWarehouses,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery();

  const warehouse = warehouses.find(
    (entry) => entry.type === "distributor" && entry.isActive,
  );
  const inactiveWarehouse = warehouses.find(
    (entry) => entry.type === "distributor" && !entry.isActive,
  );
  const {
    data: stocks = [],
    isLoading: loadingStocks,
    refetch: refetchStocks,
  } =
    useGetWarehouseStocksQuery(warehouse?._id || "", {
      skip: !warehouse?._id,
    });
  const [updateWarehouseSellingPrice] =
    useUpdateWarehouseSellingPriceMutation();

  useRealtimeRefetch(
    ["warehouse-stock-updated", "stock-updated", "order-updated"],
    () => {
      refetchWarehouses();
      if (warehouse?._id) {
        refetchStocks();
      }
    },
  );

  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const totalCostValue = stocks.reduce(
    (sum, stock) => sum + stock.quantity * stock.averageCost,
    0,
  );
  const lowStockCount = stocks.filter((stock) => stock.quantity <= 10).length;
  const productsWithPrice = stocks.filter(
    (stock) => stock.sellingPrice !== undefined && stock.sellingPrice !== null,
  ).length;

  const handleSellingPriceChange = async (
    stock: WarehouseStock,
    sellingPrice: number | null,
  ) => {
    if (!warehouse || sellingPrice === null) return;

    if (sellingPrice < 0) {
      message.error("Giá bán ra tiệm không được nhỏ hơn 0");
      return;
    }

    if (sellingPrice < stock.averageCost) {
      message.warning("Giá bán ra đang thấp hơn giá vốn NPP");
    }

    try {
      await updateWarehouseSellingPrice({
        warehouseId: warehouse._id,
        stockId: stock._id,
        body: { sellingPrice },
      }).unwrap();
      message.success("Đã cập nhật giá bán ra tiệm");
    } catch (error: unknown) {
      message.error(
        orderApiMessage(error, "Không thể cập nhật giá bán ra tiệm"),
      );
    }
  };

  const columns: ColumnsType<WarehouseStock> = [
    {
      title: "Sản phẩm",
      dataIndex: "product",
      width: 300,
      render: (_, record) => {
        const product = getStockProduct(record);
        return product ? (
          <div className="distributor-warehouse-product-cell">
            <strong>{product.name}</strong>
            <span>{product.code}</span>
          </div>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Tồn kho",
      dataIndex: "quantity",
      align: "right",
      width: 130,
      render: (value: number) => (
        <span
          className={
            value <= 10
              ? "distributor-warehouse-cell-tag is-warning"
              : "distributor-warehouse-cell-tag is-info"
          }
        >
          {value.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Giá vốn bình quân",
      dataIndex: "averageCost",
      align: "right",
      width: 180,
      render: (value: number) => money(value),
    },
    {
      title: "Giá bán ra tiệm",
      dataIndex: "sellingPrice",
      align: "right",
      width: 190,
      render: (value: number | undefined, record) => (
        <input
          type="text"
          inputMode="numeric"
          defaultValue={moneyInput(value ?? record.averageCost)}
          className="distributor-warehouse-price-input"
          onBlur={(event) =>
            handleSellingPriceChange(
              record,
              parseMoneyInput(event.target.value),
            )
          }
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.currentTarget.blur();
          }}
        />
      ),
    },
    {
      title: "Lãi dự kiến / SP",
      align: "right",
      width: 170,
      render: (_, record) => {
        const profit =
          (record.sellingPrice ?? record.averageCost) - record.averageCost;
        return (
          <span
            className={
              profit >= 0
                ? "distributor-warehouse-cell-tag is-success"
                : "distributor-warehouse-cell-tag is-danger"
            }
          >
            {money(profit)}
          </span>
        );
      },
    },
    {
      title: "Nhập hàng",
      key: "import",
      align: "center",
      width: 140,
      render: (_, record) => {
        const product = getStockProduct(record);

        return (
          <button
            type="button"
            disabled={!warehouse || !product}
            className="distributor-warehouse-row-import"
            onClick={() => {
              if (!product) return;
              router.push(`/distributor/warehouse/import?productId=${product._id}`);
            }}
          >
            <InboxOutlined />
            Nhập hàng
          </button>
        );
      },
    },
  ];

  return (
    <DistributorPageShell
      eyebrow="Kho NPP"
      title="Kho của tôi"
      description="Theo dõi tồn kho NPP, thiết lập giá bán ra tiệm và gửi đơn nhập hàng cho Admin duyệt."
      extra={
        <Button
          type="primary"
          icon={<InboxOutlined />}
          disabled={!warehouse}
          onClick={() => router.push("/distributor/warehouse/import")}
          className="distributor-warehouse-primary-action"
        >
          Nhập SP mới
        </Button>
      }
    >
      <DistributorCommandCenter
        eyebrow="Tồn kho"
        title={warehouse ? warehouse.name : "Kho nhà phân phối"}
        description={
          warehouse
            ? `${warehouse.code} đang hoạt động. Giá bán ra tiệm có thể chỉnh ngay trong bảng tồn kho.`
            : "Kho NPP chưa sẵn sàng, vui lòng liên hệ Admin để kích hoạt trước khi nhập hàng."
        }
        meterValue={money(totalCostValue)}
        meterLabel="Giá trị vốn tồn kho"
        stats={[
          { label: "Sản phẩm", value: stocks.length },
          { label: "Tổng tồn", value: totalQuantity },
          { label: "Đã đặt giá", value: productsWithPrice },
        ]}
        progressLabel="Sản phẩm tồn thấp"
        progressValue={`${lowStockCount}/${stocks.length || 0}`}
        progressPercent={stocks.length ? (lowStockCount / stocks.length) * 100 : 0}
        feature={
          <>
            <Text className="distributor-command-feature-label">
              Trạng thái kho
            </Text>
            <Text className="distributor-command-feature-title">
              {warehouse ? "Đang hoạt động" : "Chưa hoạt động"}
            </Text>
            <div className="distributor-command-feature-meta">
              <span>{warehouse?.code || "Chưa có mã kho"}</span>
              <span>{stocks.length} mặt hàng</span>
            </div>
            <Tag
              color={warehouse ? "green" : "orange"}
              className="distributor-pill-tag"
            >
              {warehouse ? "Sẵn sàng nhập hàng" : "Cần Admin xử lý"}
            </Tag>
          </>
        }
      />

      {!warehouse && (
        <Alert
          showIcon
          type="warning"
          className="distributor-warehouse-alert"
          message={
            inactiveWarehouse
              ? "Kho NPP đang tạm ngưng"
              : "Chưa có kho NPP đang hoạt động"
          }
          description="Vui lòng liên hệ Admin tạo hoặc kích hoạt lại kho trước khi gửi đơn nhập hàng."
        />
      )}

      <DistributorTableCard
        title={warehouse ? `${warehouse.name} - ${warehouse.code}` : "Tồn kho"}
        description="Danh sách tồn kho hiện có và giá bán ra tiệm của từng sản phẩm."
        extra={
          <Flex gap={8} wrap="wrap">
            <Tag icon={<ProductOutlined />} color="blue">
              {stocks.length} sản phẩm
            </Tag>
            <Tag icon={<ShopOutlined />} color="cyan">
              {totalQuantity.toLocaleString("vi-VN")} tồn
            </Tag>
            {lowStockCount > 0 && (
              <Tag icon={<WarningOutlined />} color="orange">
                {lowStockCount} tồn thấp
              </Tag>
            )}
          </Flex>
        }
      >
        <Table<WarehouseStock>
          rowKey="_id"
          loading={loadingWarehouses || loadingStocks}
          columns={columns}
          dataSource={stocks}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
          scroll={{ x: 1120 }}
          locale={{
            emptyText: <Empty description="Chưa có hàng trong kho" />,
          }}
        />
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-warehouse-alert {
          margin-bottom: 16px;
          border-radius: 8px !important;
        }

        .distributor-warehouse-price-input {
          width: 150px !important;
          height: 32px;
          padding: 4px 11px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
        }

        .distributor-warehouse-price-input {
          font-weight: 700 !important;
          text-align: right !important;
        }

        .distributor-warehouse-price-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
        }

        .distributor-warehouse-product-cell {
          display: grid;
          gap: 2px;
        }

        .distributor-warehouse-product-cell strong {
          color: #0f172a;
          font-weight: 800;
          line-height: 1.35;
        }

        .distributor-warehouse-product-cell span {
          color: #64748b;
          font-size: 12.5px;
          line-height: 1.35;
        }

        .distributor-warehouse-cell-tag {
          min-width: 56px;
          min-height: 24px;
          padding: 2px 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.2;
        }

        .distributor-warehouse-cell-tag.is-info {
          border-color: #91caff;
          color: #0958d9;
          background: #e6f4ff;
        }

        .distributor-warehouse-cell-tag.is-warning {
          border-color: #ffd591;
          color: #ad6800;
          background: #fff7e6;
        }

        .distributor-warehouse-cell-tag.is-success {
          border-color: #b7eb8f;
          color: #389e0d;
          background: #f6ffed;
        }

        .distributor-warehouse-cell-tag.is-danger {
          border-color: #ffa39e;
          color: #cf1322;
          background: #fff1f0;
        }

        .distributor-warehouse-row-import {
          min-height: 30px;
          padding: 4px 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid #2563eb;
          border-radius: 8px;
          color: #ffffff;
          background: #2563eb;
          font-size: 12.5px;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.14);
        }

        .distributor-warehouse-row-import:hover {
          border-color: #1d4ed8;
          background: #1d4ed8;
        }

        .distributor-warehouse-row-import:disabled {
          border-color: #bfdbfe;
          color: #64748b;
          background: #dbeafe;
          cursor: not-allowed;
          box-shadow: none;
        }

        .distributor-content
          .distributor-warehouse-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .distributor-warehouse-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }
      `}</style>
    </DistributorPageShell>
  );
}
