"use client";

import {
  BarChartOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Flex,
  Form,
  InputNumber,
  Row,
  Space,
  Typography,
  theme,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";

import {
  useGetKpisQuery,
  useUpdateKpiMutation,
} from "@/features/reports/reportService";

import type { UpdateKpiRequest } from "@/features/reports/reportTypes";

const { Text, Title } = Typography;
const { useToken } = theme;

export default function EditKpiPage() {
  const { token } = useToken();
  const { message } = App.useApp();

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form] = Form.useForm<UpdateKpiRequest>();

  const { data: kpis = [], isLoading } = useGetKpisQuery();
  const [updateKpi, { isLoading: updating }] = useUpdateKpiMutation();

  const kpi = kpis.find((item) => item._id === id);

  useEffect(() => {
    if (!kpi) return;

    form.setFieldsValue({
      month: kpi.month,
      year: kpi.year,
      targetRevenue: kpi.targetRevenue,
      targetOrders: kpi.targetOrders,
      targetVisits: kpi.targetVisits,
    });
  }, [kpi, form]);

  const moneyFormatter = (value?: string | number) => {
    if (value === undefined || value === null || value === "") return "";

    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  };

  const moneyParser = (value?: string) =>
    value ? Number(value.replace(/\./g, "").replace("đ", "")) : 0;

  const handleSubmit = async (values: UpdateKpiRequest) => {
    try {
      await updateKpi({
        id,
        body: values,
      }).unwrap();

      message.success("Cập nhật KPI thành công");
      router.push("/admin/kpis");
    } catch (error: unknown) {

      const err = error as {
        data?: {
          message?: string | string[];
        };
      };

      message.error(
        Array.isArray(err?.data?.message)
          ? err.data.message[0]
          : err?.data?.message || "Cập nhật KPI thất bại",
      );
    }
  };

  const cardStyle = {
    borderRadius: 14,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowTertiary,
  };

  const sectionCardStyle = {
    borderRadius: 12,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillAlter,
  };

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />

        <AdminPageHeader
          title="Sửa KPI"
          description="Cập nhật KPI theo tháng cho seller."
          extra={
            <Button onClick={() => router.push("/admin/kpis")}>Quay lại</Button>
          }
        />

        <Form form={form} component={false} />
        <Card
          loading
          variant="borderless"
          style={{
            ...cardStyle,
            minHeight: 520,
          }}
        />
      </>
    );
  }

  if (!kpi) {
    return (
      <>
        <AdminBreadcrumb />

        <AdminPageHeader
          title="Sửa KPI"
          description="Cập nhật KPI theo tháng cho seller."
          extra={
            <Button onClick={() => router.push("/admin/kpis")}>Quay lại</Button>
          }
        />

        <Form form={form} component={false} />
        <Card
          variant="borderless"
          style={cardStyle}
          styles={{
            body: {
              padding: 24,
            },
          }}
        >
          <Text type="secondary">Không tìm thấy KPI.</Text>
        </Card>
      </>
    );
  }

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Sửa KPI"
        description={`Cập nhật KPI cho ${kpi.seller?.fullName || "-"}.`}
        extra={
          <Button onClick={() => router.push("/admin/kpis")}>Quay lại</Button>
        }
      />

      <Card
        variant="borderless"
        style={cardStyle}
        styles={{
          body: {
            padding: 24,
          },
        }}
      >
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              Thông tin KPI cần cập nhật
            </Title>

            <Text type="secondary">
              Điều chỉnh kỳ áp dụng và các chỉ tiêu mục tiêu của seller.
            </Text>
          </div>

          <Form<UpdateKpiRequest>
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {/* KỲ KPI */}
            <Card
              size="small"
              title="Kỳ KPI"
              variant="borderless"
              style={{
                ...sectionCardStyle,
                marginBottom: 20,
              }}
              styles={{
                body: {
                  padding: 16,
                },
              }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tháng"
                    name="month"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tháng",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={12}
                      style={{ width: "100%" }}
                      controls={false}
                      placeholder="Nhập tháng"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Năm"
                    name="year"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập năm",
                      },
                    ]}
                  >
                    <InputNumber
                      min={2024}
                      style={{ width: "100%" }}
                      controls={false}
                      placeholder="Nhập năm"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* CHỈ TIÊU MỤC TIÊU */}
            <Card
              size="small"
              title="Chỉ tiêu mục tiêu"
              variant="borderless"
              style={sectionCardStyle}
              styles={{
                body: {
                  padding: 16,
                },
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    variant="borderless"
                    style={{
                      height: "100%",
                      borderRadius: 12,
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                    styles={{
                      body: {
                        padding: 16,
                      },
                    }}
                  >
                    <Flex vertical gap={12}>
                      <Flex align="center" gap={10}>
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: token.colorSuccessBg,
                            color: token.colorSuccess,
                          }}
                        >
                          <DollarOutlined />
                        </Flex>

                        <Text strong>Doanh thu</Text>
                      </Flex>

                      <Form.Item
                        label="Doanh thu mục tiêu"
                        name="targetRevenue"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập doanh thu mục tiêu",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber<number>
                          min={0}
                          style={{ width: "100%" }}
                          formatter={moneyFormatter}
                          parser={moneyParser}
                          controls={false}
                          placeholder="Nhập doanh thu mục tiêu"
                        />
                      </Form.Item>
                    </Flex>
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    variant="borderless"
                    style={{
                      height: "100%",
                      borderRadius: 12,
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                    styles={{
                      body: {
                        padding: 16,
                      },
                    }}
                  >
                    <Flex vertical gap={12}>
                      <Flex align="center" gap={10}>
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: token.colorPrimaryBg,
                            color: token.colorPrimary,
                          }}
                        >
                          <ShoppingCartOutlined />
                        </Flex>

                        <Text strong>Đơn hàng</Text>
                      </Flex>

                      <Form.Item
                        label="Đơn hàng mục tiêu"
                        name="targetOrders"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập đơn hàng mục tiêu",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          style={{ width: "100%" }}
                          controls={false}
                          placeholder="Nhập số đơn mục tiêu"
                        />
                      </Form.Item>
                    </Flex>
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    variant="borderless"
                    style={{
                      height: "100%",
                      borderRadius: 12,
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                    styles={{
                      body: {
                        padding: 16,
                      },
                    }}
                  >
                    <Flex vertical gap={12}>
                      <Flex align="center" gap={10}>
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: token.colorWarningBg,
                            color: token.colorWarning,
                          }}
                        >
                          <TeamOutlined />
                        </Flex>

                        <Text strong>Ghé thăm</Text>
                      </Flex>

                      <Form.Item
                        label="Ghé thăm mục tiêu"
                        name="targetVisits"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập ghé thăm mục tiêu",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          style={{ width: "100%" }}
                          controls={false}
                          placeholder="Nhập lượt ghé mục tiêu"
                        />
                      </Form.Item>
                    </Flex>
                  </Card>
                </Col>
              </Row>

              <Flex
                gap={10}
                align="center"
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 12,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <BarChartOutlined style={{ color: token.colorPrimary }} />

                <Text type="secondary">
                  Cập nhật các chỉ tiêu để hệ thống so sánh hiệu suất thực tế
                  theo tháng.
                </Text>
              </Flex>
            </Card>

            {/* ACTIONS */}
            <Flex
              justify="flex-end"
              gap={12}
              wrap="wrap"
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Button onClick={() => router.push("/admin/kpis")}>Hủy</Button>

              <Button type="primary" htmlType="submit" loading={updating}>
                Cập nhật KPI
              </Button>
            </Flex>
          </Form>
        </Space>
      </Card>
    </>
  );
}
