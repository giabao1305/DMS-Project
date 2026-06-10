"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Flex,
  Form,
  InputNumber,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  DistributorPageShell,
  DistributorTableCard,
} from "@/components/distributor/DistributorPageShell";
import {
  useCreateKpiMutation,
  useGetMyKpisQuery,
  useUpdateKpiMutation,
} from "@/features/reports/reportService";
import { useGetSellerUsersQuery } from "@/features/users/userService";

const { Text } = Typography;

type KpiFormMode = "create" | "edit";

type KpiFormValues = {
  seller?: string;
  month: number;
  year: number;
  targetRevenue: number;
  targetOrders: number;
  targetVisits: number;
};

const currentDate = new Date();

const moneyFormatter = (value?: string | number) =>
  `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const moneyParser = (value?: string) =>
  Number((value || "").replace(/[^\d]/g, ""));

export default function KpiFormPage({ mode }: { mode: KpiFormMode }) {
  const isEdit = mode === "edit";
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<KpiFormValues>();
  const { data: kpis = [], isLoading: loadingKpis } = useGetMyKpisQuery(
    undefined,
    { skip: !isEdit },
  );
  const { data: sellers = [], isLoading: loadingSellers } =
    useGetSellerUsersQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const [createKpi, { isLoading: creating }] = useCreateKpiMutation();
  const [updateKpi, { isLoading: updating }] = useUpdateKpiMutation();
  const editingKpi = kpis.find((item) => item._id === id);

  useEffect(() => {
    if (isEdit) {
      if (!editingKpi) return;

      form.setFieldsValue({
        seller: editingKpi.seller?._id,
        month: editingKpi.month,
        year: editingKpi.year,
        targetRevenue: editingKpi.targetRevenue,
        targetOrders: editingKpi.targetOrders,
        targetVisits: editingKpi.targetVisits,
      });
      return;
    }

    form.setFieldsValue({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      targetRevenue: 0,
      targetOrders: 0,
      targetVisits: 0,
    });
  }, [editingKpi, form, isEdit]);

  const handleSubmit = async (values: KpiFormValues) => {
    try {
      if (isEdit && id) {
        await updateKpi({
          id,
          body: {
            month: values.month,
            year: values.year,
            targetRevenue: values.targetRevenue,
            targetOrders: values.targetOrders,
            targetVisits: values.targetVisits,
          },
        }).unwrap();
        message.success("Đã cập nhật KPI");
      } else {
        if (!values.seller) {
          message.warning("Vui lòng chọn DSR");
          return;
        }

        await createKpi({
          seller: values.seller,
          month: values.month,
          year: values.year,
          targetRevenue: values.targetRevenue,
          targetOrders: values.targetOrders,
          targetVisits: values.targetVisits,
        }).unwrap();
        message.success("Đã tạo KPI");
      }

      router.push("/distributor/kpis");
    } catch {
      message.error(isEdit ? "Không thể cập nhật KPI" : "Không thể tạo KPI");
    }
  };

  return (
    <DistributorPageShell
      eyebrow="KPI"
      title={isEdit ? "Sửa KPI" : "Tạo KPI"}
      description="Thiết lập mục tiêu doanh thu, đơn hàng và lượt ghé cho DSR."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Quay lại
        </Button>
      }
    >
      <DistributorTableCard
        title={isEdit ? "Thông tin KPI" : "KPI mới"}
        description="Chọn DSR, kỳ KPI và các mục tiêu cần theo dõi."
      >
        <Spin spinning={loadingKpis || loadingSellers}>
          <section className="distributor-kpi-form-shell">
            <div className="distributor-kpi-form-frame">
              <Form<KpiFormValues>
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <section className="distributor-kpi-form-section">
                  <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={14}
                    wrap="wrap"
                    className="distributor-kpi-section-head"
                  >
                    <div>
                      <Text className="distributor-kpi-section-title">
                        DSR và kỳ KPI
                      </Text>
                      <Text className="distributor-kpi-section-desc">
                        KPI được tính theo từng tháng cho từng DSR trong đội.
                      </Text>
                    </div>
                    <Tag color="blue" className="distributor-kpi-section-tag">
                      Bắt buộc
                    </Tag>
                  </Flex>

                  <Row gutter={[18, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="DSR"
                        name="seller"
                        rules={
                          !isEdit
                            ? [{ required: true, message: "Vui lòng chọn DSR" }]
                            : []
                        }
                      >
                        <Select
                          size="large"
                          showSearch
                          disabled={isEdit}
                          loading={loadingSellers}
                          placeholder="Chọn DSR"
                          optionFilterProp="label"
                          options={sellers.map((seller) => ({
                            value: seller._id,
                            label: seller.fullName || seller.email,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        label="Tháng"
                        name="month"
                        rules={[{ required: true, message: "Vui lòng nhập tháng" }]}
                      >
                        <InputNumber
                          size="large"
                          min={1}
                          max={12}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        label="Năm"
                        name="year"
                        rules={[{ required: true, message: "Vui lòng nhập năm" }]}
                      >
                        <InputNumber
                          size="large"
                          min={2020}
                          max={2100}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </section>

                <section className="distributor-kpi-form-section">
                  <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={14}
                    wrap="wrap"
                    className="distributor-kpi-section-head"
                  >
                    <div>
                      <Text className="distributor-kpi-section-title">
                        Mục tiêu cần đạt
                      </Text>
                      <Text className="distributor-kpi-section-desc">
                        Thiết lập mục tiêu doanh thu, số đơn và lượt ghé trong kỳ.
                      </Text>
                    </div>
                    <Tag color="blue" className="distributor-kpi-section-tag">
                      Chỉ tiêu
                    </Tag>
                  </Flex>

                  <Row gutter={[18, 18]}>
                    <Col xs={24} lg={8}>
                      <div className="distributor-kpi-target-card">
                        <DollarOutlined />
                        <Form.Item
                          label="Mục tiêu doanh thu"
                          name="targetRevenue"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập doanh thu mục tiêu",
                            },
                          ]}
                        >
                          <InputNumber
                            size="large"
                            min={0}
                            formatter={moneyFormatter}
                            parser={moneyParser}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </div>
                    </Col>
                    <Col xs={24} lg={8}>
                      <div className="distributor-kpi-target-card">
                        <ShoppingCartOutlined />
                        <Form.Item
                          label="Mục tiêu đơn hàng"
                          name="targetOrders"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập số đơn mục tiêu",
                            },
                          ]}
                        >
                          <InputNumber size="large" min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </div>
                    </Col>
                    <Col xs={24} lg={8}>
                      <div className="distributor-kpi-target-card">
                        <TeamOutlined />
                        <Form.Item
                          label="Mục tiêu ghé thăm"
                          name="targetVisits"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập lượt ghé mục tiêu",
                            },
                          ]}
                        >
                          <InputNumber size="large" min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </section>

                <Flex
                  justify="space-between"
                  align="center"
                  wrap="wrap"
                  gap={16}
                  className="distributor-kpi-form-footer"
                >
                  <Flex align="center" gap={10} className="distributor-kpi-form-note">
                    <CalendarOutlined />
                    <Text>
                      KPI sau khi tạo sẽ được dùng để so sánh với dữ liệu thực tế
                      của DSR.
                    </Text>
                  </Flex>

                  <Flex gap={10} wrap="wrap" className="distributor-kpi-form-actions">
                    <Button
                      size="large"
                      onClick={() => router.push("/distributor/kpis")}
                      className="distributor-kpi-form-action"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={creating || updating}
                      className="distributor-kpi-form-action distributor-kpi-primary-action"
                    >
                      {isEdit ? "Cập nhật KPI" : "Tạo KPI"}
                    </Button>
                  </Flex>
                </Flex>
              </Form>
            </div>
          </section>
        </Spin>
      </DistributorTableCard>

      <style jsx global>{`
        .distributor-kpi-form-shell {
          margin-top: 18px;
        }

        .distributor-kpi-form-frame {
          padding: 20px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.05);
        }

        .distributor-kpi-form-section + .distributor-kpi-form-section {
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-kpi-section-head {
          margin-bottom: 18px;
        }

        .distributor-kpi-section-title,
        .distributor-kpi-section-desc {
          display: block;
        }

        .distributor-kpi-section-title {
          color: #0f172a !important;
          font-size: 16px;
          font-weight: 900;
        }

        .distributor-kpi-section-desc {
          color: #64748b !important;
          font-size: 12.5px;
          font-weight: 600;
        }

        .distributor-kpi-section-tag {
          margin-inline-end: 0;
          border-radius: 999px !important;
          font-weight: 800;
        }

        .distributor-kpi-form-frame .ant-form-item-label > label {
          color: #334155;
          font-weight: 800;
        }

        .distributor-kpi-form-frame .ant-select-selector,
        .distributor-kpi-form-frame .ant-input-number {
          border-radius: 8px !important;
        }

        .distributor-kpi-target-card {
          height: 100%;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #f8fbff;
        }

        .distributor-kpi-target-card > .anticon {
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border-radius: 8px;
          color: #2563eb;
          background: #dbeafe;
        }

        .distributor-kpi-form-footer {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dbeafe;
        }

        .distributor-kpi-form-note {
          max-width: 560px;
          min-height: 48px;
          padding: 10px 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
        }

        .distributor-kpi-form-note .anticon {
          color: #2563eb;
        }

        .distributor-kpi-form-note .ant-typography {
          color: #334155 !important;
          font-weight: 650;
        }

        .distributor-kpi-form-action {
          min-height: 40px !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
        }

        .distributor-content
          .distributor-kpi-form-frame
          .distributor-kpi-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ) {
          border-color: #2563eb !important;
          background: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16) !important;
        }

        .distributor-content
          .distributor-kpi-form-frame
          .distributor-kpi-primary-action.ant-btn.ant-btn-primary:not(
            .ant-btn-dangerous
          ):hover {
          border-color: #1d4ed8 !important;
          background: #1d4ed8 !important;
          color: #ffffff !important;
        }

        @media (max-width: 767px) {
          .distributor-kpi-form-frame {
            padding: 14px;
          }

          .distributor-kpi-form-note,
          .distributor-kpi-form-actions,
          .distributor-kpi-form-action {
            width: 100%;
          }
        }
      `}</style>
    </DistributorPageShell>
  );
}
