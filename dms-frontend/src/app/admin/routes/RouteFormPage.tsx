"use client";

import {
  CalendarOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { isSalesRepRole } from "@/features/auth/roleUtils";
import { useGetCustomersQuery } from "@/features/customers/customerService";
import type { Customer } from "@/features/customers/customerTypes";
import {
  useCreateRouteMutation,
  useGetRouteByIdQuery,
  useUpdateRouteMutation,
} from "@/features/routes/routeService";
import type {
  CreateRouteRequest,
  RouteCustomer,
  UpdateRouteRequest,
} from "@/features/routes/routeTypes";
import { useGetUsersQuery } from "@/features/users/userService";
import type { User } from "@/features/users/userTypes";

const { Text } = Typography;

type RouteFormMode = "create" | "edit";
type RepeatMode = "none" | "weekly" | "even_weeks" | "odd_weeks";

type RouteFormPageProps = {
  mode: RouteFormMode;
  routeId?: string;
};

type RouteFormValues = {
  name: string;
  seller: string;
  workDate: dayjs.Dayjs;
  repeatMode?: RepeatMode;
  endDate?: dayjs.Dayjs;
};

type SelectedCustomer = {
  customer: Customer;
  orderIndex: number;
  note?: string;
};

const getSellerId = (seller: string | User) =>
  typeof seller === "string" ? seller : seller._id;

const getCustomerId = (customer: string | Customer) =>
  typeof customer === "string" ? customer : customer._id;

const getAssignedSellerId = (customer: Customer) => {
  const assignedSeller = customer.assignedSeller;

  if (!assignedSeller) return undefined;

  return typeof assignedSeller === "string"
    ? assignedSeller
    : assignedSeller._id;
};

const getIsoWeek = (date: Date) => {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const isWeekAllowed = (date: dayjs.Dayjs, repeatMode: RepeatMode) => {
  if (repeatMode === "weekly" || repeatMode === "none") return true;

  const isEvenWeek = getIsoWeek(date.toDate()) % 2 === 0;

  return repeatMode === "even_weeks" ? isEvenWeek : !isEvenWeek;
};

const buildRouteWorkDates = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs | undefined,
  repeatMode: RepeatMode,
) => {
  if (repeatMode === "none") {
    return [startDate];
  }

  if (!endDate || endDate.isBefore(startDate, "day")) {
    return [];
  }

  const dates: dayjs.Dayjs[] = [];
  let currentDate = startDate;

  while (!currentDate.isAfter(endDate, "day")) {
    if (isWeekAllowed(currentDate, repeatMode)) {
      dates.push(currentDate);
    }

    currentDate = currentDate.add(1, "week");
  }

  return dates;
};

export default function RouteFormPage({ mode, routeId }: RouteFormPageProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<RouteFormValues>();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [note, setNote] = useState("");
  const [customersInRoute, setCustomersInRoute] = useState<SelectedCustomer[]>(
    [],
  );

  const { data: users = [] } = useGetUsersQuery();
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: route, isLoading: loadingRoute } = useGetRouteByIdQuery(
    routeId || "",
    { skip: !isEdit || !routeId },
  );
  const [createRoute, { isLoading: creating }] = useCreateRouteMutation();
  const [updateRoute, { isLoading: updating }] = useUpdateRouteMutation();
  const selectedSellerId = Form.useWatch("seller", form);
  const repeatMode = Form.useWatch("repeatMode", form) ?? "none";
  const workDate = Form.useWatch("workDate", form);
  const endDate = Form.useWatch("endDate", form);

  const plannedWorkDates = useMemo(
    () =>
      workDate
        ? buildRouteWorkDates(workDate, endDate, repeatMode as RepeatMode)
        : [],
    [endDate, repeatMode, workDate],
  );

  const sellers = useMemo(
    () => users.filter((user) => isSalesRepRole(user.role) && user.isActive),
    [users],
  );

  const routeSelectableCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!customer.isActive || customer.status !== "approved") return false;
      if (!selectedSellerId) return true;

      return getAssignedSellerId(customer) === selectedSellerId;
    });
  }, [customers, selectedSellerId]);

  useEffect(() => {
    if (
      selectedCustomerId &&
      !routeSelectableCustomers.some((customer) => customer._id === selectedCustomerId)
    ) {
      setSelectedCustomerId(undefined);
    }
  }, [routeSelectableCustomers, selectedCustomerId]);

  useEffect(() => {
    if (!isEdit || !route || customers.length === 0) return;

    form.setFieldsValue({
      name: route.name,
      seller: getSellerId(route.seller),
      workDate: dayjs(route.workDate),
    });

    const mappedCustomers = route.customers
      .map((item: RouteCustomer) => {
        const customerId = getCustomerId(item.customer);
        const customer = customers.find((entry) => entry._id === customerId);

        if (!customer) return null;

        return {
          customer,
          orderIndex: item.orderIndex,
          note: item.note,
        };
      })
      .filter(Boolean) as SelectedCustomer[];

    setCustomersInRoute(mappedCustomers);
  }, [customers, form, isEdit, route]);

  const handleAddCustomer = () => {
    if (!selectedCustomerId) {
      message.warning("Vui lòng chọn khách hàng");
      return;
    }

    const customer = routeSelectableCustomers.find(
      (item) => item._id === selectedCustomerId,
    );

    if (!customer) {
      message.warning("Khách hàng không hợp lệ với seller đã chọn");
      return;
    }

    const existed = customersInRoute.some(
      (item) => item.customer._id === customer._id,
    );

    if (existed) {
      message.warning("Khách hàng đã có trong tuyến");
      return;
    }

    setCustomersInRoute((previous) => [
      ...previous,
      {
        customer,
        orderIndex: previous.length + 1,
        note: note.trim() || undefined,
      },
    ]);

    setSelectedCustomerId(undefined);
    setNote("");
  };

  const handleRemoveCustomer = (customerId: string) => {
    setCustomersInRoute((previous) =>
      previous
        .filter((item) => item.customer._id !== customerId)
        .map((item, index) => ({
          ...item,
          orderIndex: index + 1,
        })),
    );
  };

  const handleChangeOrderIndex = (customerId: string, value: number | null) => {
    setCustomersInRoute((previous) =>
      previous.map((item) =>
        item.customer._id === customerId
          ? {
              ...item,
              orderIndex: value || 1,
            }
          : item,
      ),
    );
  };

  const handleSubmit = async (values: RouteFormValues) => {
    try {
      if (customersInRoute.length === 0) {
        message.warning("Vui lòng thêm ít nhất 1 khách hàng vào tuyến");
        return;
      }

      const body: CreateRouteRequest | UpdateRouteRequest = {
        name: values.name,
        seller: values.seller,
        workDate: values.workDate.format("YYYY-MM-DD"),
        customers: customersInRoute.map((item) => ({
          customer: item.customer._id,
          orderIndex: item.orderIndex,
          note: item.note,
        })),
      };

      if (isEdit && routeId) {
        await updateRoute({ id: routeId, body }).unwrap();
        message.success("Cập nhật tuyến thành công");
        router.push(`/admin/routes/${routeId}`);
        return;
      }

      const workDates = buildRouteWorkDates(
        values.workDate,
        values.endDate,
        values.repeatMode ?? "none",
      );

      if (workDates.length === 0) {
        message.warning("Khoảng lặp không tạo được tuyến phù hợp");
        return;
      }

      for (const date of workDates) {
        await createRoute({
          ...(body as CreateRouteRequest),
          name:
            workDates.length > 1
              ? `${values.name} - ${date.format("DD/MM/YYYY")}`
              : values.name,
          workDate: date.format("YYYY-MM-DD"),
        }).unwrap();
      }

      message.success(
        workDates.length > 1
          ? `Đã tạo ${workDates.length} tuyến theo lịch lặp`
          : "Tạo tuyến thành công",
      );
      router.push("/admin/routes");
    } catch (error: unknown) {

      const err = error as {
        data?: {
          message?: string | string[];
        };
      };

      message.error(
        Array.isArray(err?.data?.message)
          ? err.data.message[0]
          : err?.data?.message ||
              (isEdit ? "Cập nhật tuyến thất bại" : "Tạo tuyến thất bại"),
      );
    }
  };

  const customerColumns: ColumnsType<SelectedCustomer> = [
    {
      title: "Thứ tự",
      dataIndex: "orderIndex",
      width: 120,
      align: "center",
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.orderIndex}
          className="admin-route-form-order-input"
          onChange={(value) =>
            handleChangeOrderIndex(record.customer._id, value)
          }
        />
      ),
    },
    {
      title: "Khách hàng",
      width: 250,
      render: (_, record) => (
        <Flex align="center" gap={12} className="admin-route-form-customer">
          <Flex
            align="center"
            justify="center"
            className="admin-route-form-customer-icon"
          >
            <ShopOutlined />
          </Flex>
          <div className="admin-route-form-customer-copy">
            <Text className="admin-route-form-customer-name">
              {record.customer.name}
            </Text>
            <Text className="admin-route-form-muted">
              {record.customer.ownerName || "Điểm bán trong tuyến"}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Số điện thoại",
      width: 170,
      render: (_, record) => record.customer.phone || "-",
    },
    {
      title: "Địa chỉ",
      width: 340,
      ellipsis: true,
      render: (_, record) => record.customer.address || "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      width: 220,
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Hành động",
      width: 126,
      align: "center",
      render: (_, record) => (
        <Button
          color="danger"
          variant="solid"
          icon={<DeleteOutlined />}
          className="admin-route-form-table-action"
          onClick={() => handleRemoveCustomer(record.customer._id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  if (isEdit && loadingRoute) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa kế hoạch tuyến"
          description="Cập nhật nhân viên, ngày làm việc và danh sách khách hàng."
          extra={
            <Button
              onClick={() => router.push("/admin/routes")}
              className="admin-route-form-action"
            >
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-route-form-panel is-loading" />
      </>
    );
  }

  if (isEdit && !route) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Sửa kế hoạch tuyến"
          description="Cập nhật nhân viên, ngày làm việc và danh sách khách hàng."
          extra={
            <Button
              onClick={() => router.push("/admin/routes")}
              className="admin-route-form-action"
            >
              Quay lại
            </Button>
          }
        />
        <Form form={form} component={false} />
        <div className="admin-route-form-panel">
          <Empty description="Không tìm thấy tuyến" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title={isEdit ? "Sửa kế hoạch tuyến" : "Tạo kế hoạch tuyến"}
        description={
          isEdit
            ? "Cập nhật seller, ngày làm việc và thứ tự điểm bán trong tuyến."
            : "Phân công seller đi thăm khách hàng theo ngày và thứ tự rõ ràng."
        }
        extra={
          <Button
            onClick={() => router.push("/admin/routes")}
            className="admin-route-form-action"
          >
            Quay lại
          </Button>
        }
      />

      <section className="admin-route-form-shell">
        <div className="admin-route-form-panel">
          <Form<RouteFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              workDate: dayjs(),
              repeatMode: "none",
            }}
            onFinish={handleSubmit}
          >
            <div className="admin-route-form-section">
              <Flex
                align="flex-start"
                justify="space-between"
                gap={14}
                wrap="wrap"
                className="admin-route-form-section-head"
              >
                <div>
                  <Text className="admin-route-form-section-title">
                    Thông tin cơ bản
                  </Text>
                  <Text className="admin-route-form-section-desc">
                    Tên tuyến, người phụ trách và ngày triển khai.
                  </Text>
                </div>
                <Tag color="blue" className="admin-route-form-section-tag">
                  Required
                </Tag>
              </Flex>

              <Row gutter={[18, 0]}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label="Tên tuyến"
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên tuyến",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<EnvironmentOutlined />}
                      placeholder="VD: Tuyến Cần Thơ ngày hôm nay"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="Nhân viên phụ trách"
                    name="seller"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn seller",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                      allowClear
                      placeholder="Chọn seller"
                      optionFilterProp="label"
                      onChange={() => {
                        setSelectedCustomerId(undefined);
                        setCustomersInRoute([]);
                      }}
                      options={sellers.map((seller) => ({
                        label: `${seller.fullName} - ${seller.email}`,
                        value: seller._id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="Ngày làm việc"
                    name="workDate"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày",
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      suffixIcon={<CalendarOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {!isEdit ? (
                <Row gutter={[18, 0]}>
                  <Col xs={24} lg={12}>
                    <Form.Item label="Kiểu tạo tuyến" name="repeatMode">
                      <Select
                        size="large"
                        options={[
                          { label: "Tạo 1 tuyến", value: "none" },
                          { label: "Lặp hằng tuần", value: "weekly" },
                          { label: "Chỉ tuần chẵn", value: "even_weeks" },
                          { label: "Chỉ tuần lẻ", value: "odd_weeks" },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  {repeatMode !== "none" ? (
                    <Col xs={24} lg={12}>
                      <Form.Item
                        label="Tạo đến ngày"
                        name="endDate"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn ngày kết thúc",
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          style={{ width: "100%" }}
                          format="DD/MM/YYYY"
                          suffixIcon={<CalendarOutlined />}
                        />
                      </Form.Item>
                    </Col>
                  ) : null}
                </Row>
              ) : null}

              {!isEdit && repeatMode !== "none" ? (
                <Tag color="geekblue" className="admin-route-form-repeat-tag">
                  Dự kiến tạo {plannedWorkDates.length} tuyến
                </Tag>
              ) : null}
            </div>

            <div className="admin-route-form-section">
              <Flex
                align="flex-start"
                justify="space-between"
                gap={14}
                wrap="wrap"
                className="admin-route-form-section-head"
              >
                <div>
                  <Text className="admin-route-form-section-title">
                    Danh sách khách hàng trong tuyến
                  </Text>
                  <Text className="admin-route-form-section-desc">
                    Chọn điểm bán, thêm ghi chú và điều chỉnh thứ tự ghé thăm.
                  </Text>
                </div>
                <Tag color="cyan" className="admin-route-form-section-tag">
                  {customersInRoute.length} điểm bán
                </Tag>
              </Flex>

              <Row gutter={[12, 12]} align="middle" className="admin-route-form-add-row">
                <Col xs={24} xl={11}>
                  <Select
                    size="large"
                    showSearch
                    allowClear
                    placeholder="Chọn khách hàng"
                    style={{ width: "100%" }}
                    value={selectedCustomerId}
                    optionFilterProp="label"
                    onChange={setSelectedCustomerId}
                    options={routeSelectableCustomers.map((customer) => ({
                      label: `${customer.name} - ${customer.phone}`,
                      value: customer._id,
                    }))}
                  />
                </Col>

                <Col xs={24} xl={8}>
                  <Input
                    size="large"
                    placeholder="Ghi chú điểm ghé"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </Col>

                <Col xs={24} xl={5}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    className="admin-route-form-add-button"
                    onClick={handleAddCustomer}
                  >
                    Thêm khách hàng
                  </Button>
                </Col>
              </Row>

              <Table<SelectedCustomer>
                rowKey={(record) => record.customer._id}
                pagination={false}
                dataSource={customersInRoute}
                columns={customerColumns}
                scroll={{ x: 1040 }}
                className="admin-route-form-table"
                locale={{
                  emptyText: <Empty description="Chưa có khách hàng trong tuyến" />,
                }}
              />
            </div>

            <Flex justify="space-between" gap={12} wrap="wrap" className="admin-route-form-footer">
              <Flex align="center" gap={10} className="admin-route-form-total">
                <TeamOutlined />
                <Text>Tổng khách hàng</Text>
                <strong>{customersInRoute.length}</strong>
              </Flex>

              <Space wrap>
                <Button
                  size="large"
                  onClick={() => router.push("/admin/routes")}
                  className="admin-route-form-action"
                >
                  Hủy
                </Button>

                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating || updating}
                  className="admin-route-form-action"
                >
                  {isEdit ? "Cập nhật tuyến" : "Tạo tuyến"}
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </section>

      <style jsx global>{`
        .admin-route-form-shell {
          margin: -2px -2px 0;
          padding: 2px;
        }

        .admin-route-form-section-tag {
          margin: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .admin-route-form-repeat-tag.ant-tag {
          margin: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .admin-route-form-panel {
          min-height: 260px;
          padding: 20px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-route-form-panel.is-loading {
          min-height: 180px;
          border-radius: 8px;
          background:
            linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: admin-route-form-loading 1.2s ease infinite;
        }

        @keyframes admin-route-form-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }

        .admin-route-form-section {
          padding: 0;
          background: transparent;
        }

        .admin-route-form-section + .admin-route-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-route-form-section-head {
          margin-bottom: 18px;
        }

        .admin-route-form-section-title,
        .admin-route-form-section-desc {
          display: block;
        }

        .admin-route-form-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-route-form-section-desc {
          margin-top: 3px;
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .admin-route-form-add-row {
          margin-bottom: 18px;
        }

        .admin-route-form-add-button {
          width: 100%;
        }

        .admin-route-form-table .ant-table,
        .admin-route-form-table .ant-table-container,
        .admin-route-form-table .ant-table-content,
        .admin-route-form-table .ant-table-placeholder {
          background: #ffffff !important;
        }

        .admin-route-form-table .ant-table-container {
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }

        .admin-route-form-table .ant-table-thead > tr > th {
          color: #64748b !important;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc !important;
          border-bottom-color: #e7edf5 !important;
        }

        .admin-route-form-table .ant-table-tbody > tr > td {
          padding-block: 14px !important;
          background: #ffffff !important;
          border-bottom-color: #edf2f7 !important;
        }

        .admin-route-form-table .ant-table-tbody > tr:hover > td {
          background: #f8fbff !important;
        }

        .admin-route-form-customer,
        .admin-route-form-customer-copy {
          min-width: 0;
        }

        .admin-route-form-customer-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border: 1px solid #c7ddfe;
          border-radius: 8px;
          color: #2563eb;
          background: #eff6ff;
        }

        .admin-route-form-customer-name {
          display: block;
          max-width: 178px;
          overflow: hidden;
          color: #0f172a !important;
          font-size: 13.5px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-route-form-muted {
          display: block;
          color: #64748b !important;
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-route-form-order-input {
          width: 86px !important;
        }

        .admin-route-form-table-action,
        .admin-route-form-action,
        .admin-route-form-add-button {
          height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        .admin-route-form-footer {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #dbe4f0;
        }

        .admin-route-form-total {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .admin-route-form-total .anticon {
          color: #2563eb;
        }

        .admin-route-form-total .ant-typography {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 800;
        }

        .admin-route-form-total strong {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        @media (max-width: 767px) {
          .admin-route-form-panel {
            padding: 14px;
          }

          .admin-route-form-section {
            padding: 0;
          }
        }
      `}</style>
    </>
  );
}
