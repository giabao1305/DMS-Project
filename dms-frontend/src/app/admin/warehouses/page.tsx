"use client";

import { BankOutlined, PlusOutlined, SettingOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import type { Product } from "@/features/products/productTypes";
import { useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";
import {
  useCreateWarehouseMutation,
  useGetWarehousesQuery,
  useGetWarehouseStocksQuery,
  useUpdateWarehouseSellingPriceMutation,
  useUpdateWarehouseStatusMutation,
} from "@/features/warehouses/warehouseService";
import type {
  CreateWarehouseRequest,
  Warehouse,
  WarehouseStock,
} from "@/features/warehouses/warehouseTypes";

const { Text } = Typography;
const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const apiMessage = (error: unknown, fallback: string) => {
  const payload = error as { data?: { message?: string | string[] } };
  const detail = payload.data?.message;
  const raw = Array.isArray(detail) ? detail[0] : detail;

  if (!raw) return fallback;
  if (raw.includes("sellingPrice")) return "Giá bán ra tiệm không hợp lệ";

  return raw;
};

function distributorName(distributor?: string | User) {
  if (!distributor || typeof distributor === "string") return "-";
  return distributor.companyName || distributor.fullName;
}

function productValue(product: string | Product) {
  return typeof product === "string" ? undefined : product;
}

function normalizeWarehouseCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDistributorWarehouseCode(distributor: User) {
  const distributorCode = distributor.code
    ? normalizeWarehouseCode(distributor.code)
    : normalizeWarehouseCode(distributor._id.slice(-6));

  return `WH-${distributorCode}`;
}

function getDistributorWarehouseName(distributor: User) {
  return `Kho ${distributor.companyName || distributor.fullName}`;
}

export default function WarehousesPage() {
  const { message } = App.useApp();
  const [warehouseForm] = Form.useForm<CreateWarehouseRequest>();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>();
  const [distributorFilter, setDistributorFilter] = useState<string>();
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);

  const { data: warehouses = [], isLoading: loadingWarehouses } =
    useGetWarehousesQuery();
  const { data: users = [] } = useGetUsersQuery();
  const distributorWarehouses = useMemo(
    () =>
      warehouses.filter((warehouse) => {
        if (warehouse.type !== "distributor") return false;
        if (!distributorFilter) return true;
        const distributor =
          typeof warehouse.distributor === "string"
            ? warehouse.distributor
            : warehouse.distributor?._id;
        return distributor === distributorFilter;
      }),
    [distributorFilter, warehouses],
  );
  const selectedWarehouse =
    distributorWarehouses.find(
      (warehouse) => warehouse._id === selectedWarehouseId,
    ) || distributorWarehouses[0];
  const activeWarehouseId = selectedWarehouse?._id || "";
  const { data: stocks = [], isLoading: loadingStocks } =
    useGetWarehouseStocksQuery(activeWarehouseId, {
      skip: !activeWarehouseId,
    });
  const [createWarehouse, { isLoading: creating }] =
    useCreateWarehouseMutation();
  const [updateWarehouseSellingPrice] =
    useUpdateWarehouseSellingPriceMutation();
  const [updateWarehouseStatus] = useUpdateWarehouseStatusMutation();

  const distributors = useMemo(
    () => users.filter((user) => user.role === "distributor" && user.isActive),
    [users],
  );

  const handleCreateWarehouse = async (values: CreateWarehouseRequest) => {
    try {
      const created = await createWarehouse({
        ...values,
        type: "distributor",
      }).unwrap();
      message.success("Đã tạo kho nhà phân phối");
      setSelectedWarehouseId(created._id);
      setWarehouseModalOpen(false);
      warehouseForm.resetFields();
    } catch (error: unknown) {
      message.error(apiMessage(error, "Không thể tạo kho nhà phân phối"));
    }
  };

  const handleSelectDistributor = (distributorId: string) => {
    const distributor = distributors.find((item) => item._id === distributorId);
    if (!distributor) return;

    warehouseForm.setFieldsValue({
      code: getDistributorWarehouseCode(distributor),
      name:
        warehouseForm.getFieldValue("name") ||
        getDistributorWarehouseName(distributor),
    });
  };

  const handleSellingPriceChange = async (
    stock: WarehouseStock,
    sellingPrice: number | null,
  ) => {
    if (!activeWarehouseId || sellingPrice === null) return;
    if (sellingPrice < 0) {
      message.error("Giá bán ra tiệm không được nhỏ hơn 0");
      return;
    }

    try {
      await updateWarehouseSellingPrice({
        warehouseId: activeWarehouseId,
        stockId: stock._id,
        body: { sellingPrice },
      }).unwrap();
      message.success("Đã cập nhật giá bán ra tiệm");
    } catch {
      message.error("Không thể cập nhật giá bán");
    }
  };

  const handleWarehouseStatusChange = async (
    warehouse: Warehouse,
    isActive: boolean,
  ) => {
    try {
      const updated = await updateWarehouseStatus({
        warehouseId: warehouse._id,
        body: { isActive },
      }).unwrap();

      message.success(
        isActive ? "Đã kích hoạt lại kho NPP" : "Đã ngưng hoạt động kho NPP",
      );

      if (updated._id === activeWarehouseId) {
        setSelectedWarehouseId(updated._id);
      }
    } catch (error: unknown) {
      message.error(apiMessage(error, "Không thể cập nhật trạng thái kho NPP"));
    }
  };

  const warehouseColumns: ColumnsType<Warehouse> = [
    {
      title: "Kho",
      dataIndex: "name",
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">{record.code}</Text>
        </Space>
      ),
    },
    {
      title: "Nhà phân phối",
      dataIndex: "distributor",
      render: (value: Warehouse["distributor"]) => distributorName(value),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Hoạt động" : "Tạm ngưng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      align: "right",
      render: (_, record) =>
        record.isActive ? (
          <Popconfirm
            title="Ngưng hoạt động kho NPP?"
            description="NPP sẽ không thể nhập hàng hoặc tạo đơn mới bằng kho này. Lịch sử kho và đơn hàng vẫn được giữ lại."
            okText="Ngưng hoạt động"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleWarehouseStatusChange(record, false)}
          >
            <Button danger>Ngưng hợp tác</Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Kích hoạt lại kho NPP?"
            description="NPP sẽ có thể tiếp tục tạo đơn nhập hàng và bán hàng từ kho này."
            okText="Kích hoạt"
            cancelText="Hủy"
            onConfirm={() => handleWarehouseStatusChange(record, true)}
          >
            <Button>Kích hoạt lại</Button>
          </Popconfirm>
        ),
    },
  ];

  const stockColumns: ColumnsType<WarehouseStock> = [
    {
      title: "Sản phẩm",
      dataIndex: "product",
      render: (value: WarehouseStock["product"]) => {
        const product = productValue(value);
        return product ? `${product.code} - ${product.name}` : "-";
      },
    },
    {
      title: "Tồn NPP",
      dataIndex: "quantity",
      align: "right",
      render: (value: number) => value.toLocaleString("vi-VN"),
    },
    {
      title: "Giá vốn bình quân",
      dataIndex: "averageCost",
      align: "right",
      render: (value: number) => money(value),
    },
    {
      title: "Giá bán ra tiệm",
      dataIndex: "sellingPrice",
      align: "right",
      render: (value: number | undefined, record) => (
        <Space.Compact>
          <InputNumber
            min={0}
            disabled={!selectedWarehouse?.isActive}
            defaultValue={value ?? record.averageCost}
            onBlur={(event) =>
              handleSellingPriceChange(record, Number(event.target.value))
            }
          />
          <Button disabled>đ</Button>
        </Space.Compact>
      ),
    },
    {
      title: "Giá trị vốn tồn",
      align: "right",
      render: (_, record) => money(record.quantity * record.averageCost),
    },
  ];

  return (
    <>
      <AdminBreadcrumb />
      <AdminPageHeader
        title="Kho nhà phân phối"
        description="Quản lý tồn, giá vốn và giá bán ra tiệm riêng cho từng nhà phân phối."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setWarehouseModalOpen(true)}
          >
            Tạo kho NPP
          </Button>
        }
      />

      <Flex gap={18} vertical>
        <Card
          title={
            <Space>
              <BankOutlined />
              Danh sách kho NPP
            </Space>
          }
          extra={
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Lọc nhà phân phối"
              style={{ width: 260 }}
              value={distributorFilter}
              onChange={(value) => {
                setDistributorFilter(value);
                setSelectedWarehouseId(undefined);
              }}
              options={distributors.map((distributor) => ({
                value: distributor._id,
                label: `${distributor.code ? `${distributor.code} - ` : ""}${
                  distributor.companyName || distributor.fullName
                }`,
              }))}
            />
          }
        >
          <Table<Warehouse>
            rowKey="_id"
            loading={loadingWarehouses}
            columns={warehouseColumns}
            dataSource={distributorWarehouses}
            pagination={false}
            rowSelection={{
              type: "radio",
              selectedRowKeys: activeWarehouseId ? [activeWarehouseId] : [],
              onChange: (keys) => setSelectedWarehouseId(String(keys[0])),
            }}
            locale={{ emptyText: <Empty description="Chưa có kho NPP" /> }}
          />
        </Card>

        <Card
          title={
            <Space>
              <SettingOutlined />
              {selectedWarehouse
                ? `Tồn kho: ${selectedWarehouse.name}`
                : "Tồn kho NPP"}
            </Space>
          }
        >
          <Table<WarehouseStock>
            rowKey="_id"
            loading={loadingStocks}
            columns={stockColumns}
            dataSource={stocks}
            pagination={false}
            locale={{
              emptyText: (
                <Empty description="Chưa có tồn kho. NPP tạo đơn nhập kho/cấp hàng để Admin duyệt và giao hàng." />
              ),
            }}
          />
        </Card>
      </Flex>

      <Modal
        title={
          <Flex align="center" gap={12} className="admin-warehouse-modal-title">
            <Flex
              align="center"
              justify="center"
              className="admin-warehouse-modal-icon"
            >
              <BankOutlined />
            </Flex>
            <div className="admin-warehouse-modal-copy">
              <Text strong className="admin-warehouse-modal-heading">
                Tạo kho cho nhà phân phối
              </Text>
              <Text className="admin-warehouse-modal-subtitle">
                Mã kho tự đồng bộ theo mã NPP, giúp quản lý tồn và giá bán nhất
                quán.
              </Text>
            </div>
          </Flex>
        }
        open={warehouseModalOpen}
        centered
        width={680}
        forceRender
        className="admin-warehouse-create-modal"
        okText="Tạo kho NPP"
        cancelText="Hủy"
        onCancel={() => {
          setWarehouseModalOpen(false);
          warehouseForm.resetFields();
        }}
        onOk={() => warehouseForm.submit()}
        confirmLoading={creating}
        destroyOnHidden
      >
        <Form<CreateWarehouseRequest>
          form={warehouseForm}
          layout="vertical"
          className="admin-warehouse-modal-form"
          onFinish={handleCreateWarehouse}
        >
          <Form.Item
            label="Nhà phân phối"
            name="distributor"
            rules={[{ required: true, message: "Vui lòng chọn NPP" }]}
          >
            <Select
              size="large"
              showSearch
              optionFilterProp="label"
              placeholder="Chọn nhà phân phối"
              onChange={handleSelectDistributor}
              options={distributors.map((distributor) => ({
                value: distributor._id,
                label: `${distributor.code ? `${distributor.code} - ` : ""}${
                  distributor.companyName || distributor.fullName
                }`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Tên kho"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên kho" }]}
          >
            <Input size="large" placeholder="Kho NPP Quận 1" />
          </Form.Item>
          <Form.Item
            label="Mã kho"
            name="code"
            extra="Mã kho được tự sinh theo mã NPP và có thể chỉnh sửa nếu cần."
            rules={[{ required: true, message: "Vui lòng nhập mã kho" }]}
          >
            <Input size="large" placeholder="WH-NPP-HCM-001" />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .admin-warehouse-create-modal .ant-modal-content {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
          box-shadow:
            0 24px 60px rgba(15, 23, 42, 0.18),
            0 2px 8px rgba(15, 23, 42, 0.06);
        }

        .admin-warehouse-create-modal .ant-modal-header {
          margin: -20px -24px 18px;
          padding: 22px 24px 20px;
          border-bottom: 1px solid #dbe4f0;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .admin-warehouse-create-modal .ant-modal-title {
          color: #0f172a;
        }

        .admin-warehouse-create-modal .ant-modal-body {
          padding-top: 2px;
        }

        .admin-warehouse-create-modal .ant-modal-footer {
          margin: 22px -24px -20px;
          padding: 16px 24px;
          border-top: 1px solid #dbe4f0;
          background: #f8fafc;
        }

        .admin-warehouse-create-modal .ant-modal-footer .ant-btn {
          height: 40px;
          border-radius: 8px;
          font-weight: 800;
        }

        .admin-warehouse-create-modal .ant-modal-footer .ant-btn-primary {
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
        }

        .admin-warehouse-modal-title {
          min-width: 0;
        }

        .admin-warehouse-modal-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
          font-size: 19px;
        }

        .admin-warehouse-modal-copy {
          min-width: 0;
        }

        .admin-warehouse-modal-heading,
        .admin-warehouse-modal-subtitle {
          display: block;
        }

        .admin-warehouse-modal-heading {
          color: #0f172a !important;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.35;
        }

        .admin-warehouse-modal-subtitle {
          max-width: 520px;
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 650;
          line-height: 1.45;
        }

        .admin-warehouse-modal-form {
          display: grid;
          gap: 2px;
        }

        .admin-warehouse-create-modal .ant-form-item-label > label {
          color: #0f172a;
          font-weight: 800;
        }

        .admin-warehouse-create-modal .ant-form-item {
          margin-bottom: 18px;
        }

        .admin-warehouse-create-modal .ant-input,
        .admin-warehouse-create-modal .ant-select-selector {
          min-height: 42px;
          border-color: #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        .admin-warehouse-create-modal .ant-select-selection-item,
        .admin-warehouse-create-modal .ant-select-selection-placeholder {
          line-height: 40px !important;
        }

        .admin-warehouse-create-modal .ant-input:hover,
        .admin-warehouse-create-modal .ant-select-selector:hover {
          border-color: #93c5fd !important;
        }

        .admin-warehouse-create-modal .ant-input:focus,
        .admin-warehouse-create-modal .ant-input-focused,
        .admin-warehouse-create-modal .ant-select-focused .ant-select-selector {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }

        .admin-warehouse-create-modal .ant-form-item-extra {
          margin-top: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.45;
        }

        @media (max-width: 767px) {
          .admin-warehouse-create-modal {
            max-width: calc(100vw - 24px);
          }

          .admin-warehouse-create-modal .ant-modal-header {
            padding: 18px;
          }

          .admin-warehouse-create-modal .ant-modal-body {
            padding-inline: 18px;
          }

          .admin-warehouse-modal-subtitle {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}
