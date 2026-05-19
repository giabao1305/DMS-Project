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
  Select,
  Space,
  Typography,
  theme,
} from "antd";
import { useRouter } from "next/navigation";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import { isSalesRepRole } from "@/features/auth/roleUtils";

import { useCreateKpiMutation } from "@/features/reports/reportService";
import type { CreateKpiRequest } from "@/features/reports/reportTypes";
import { useGetUsersQuery } from "@/features/users/userService";

const { Text, Title } = Typography;
const { useToken } = theme;

export default function CreateKpiPage() {
  const { token } = useToken();
  const { message } = App.useApp();

  const router = useRouter();
  const [form] = Form.useForm<CreateKpiRequest>();

  const { data: users = [] } = useGetUsersQuery();
  const [createKpi, { isLoading }] = useCreateKpiMutation();

  const sellers = users.filter(
    (user) => isSalesRepRole(user.role) && user.isActive,
  );

  const moneyFormatter = (value?: string | number) => {
    if (value === undefined || value === null || value === "") return "";

    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  };

  const moneyParser = (value?: string) =>
    value ? Number(value.replace(/\./g, "").replace("đ", "")) : 0;

  const handleSubmit = async (values: CreateKpiRequest) => {
    try {
      await createKpi(values).unwrap();

      message.success("Tạo KPI thành công");
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
          : err?.data?.message || "Tạo KPI thất bại",
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

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Tạo KPI"
        description="Thiết lập KPI theo tháng cho seller."
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
              Thông tin KPI
            </Title>

            <Text type="secondary">
              Chọn seller, kỳ áp dụng và nhập các chỉ tiêu mục tiêu cần theo
              dõi.
            </Text>
          </div>

          <Form<CreateKpiRequest>
            form={form}
            layout="vertical"
            initialValues={{
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
              targetRevenue: 0,
              targetOrders: 0,
              targetVisits: 0,
            }}
            onFinish={handleSubmit}
          >
            {/* SELLER & KỲ KPI */}
            <Card
              size="small"
              title="Seller và kỳ KPI"
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
                    label="Seller"
                    name="seller"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn seller",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="Chọn seller"
                      optionFilterProp="label"
                      options={sellers.map((seller) => ({
                        label: `${seller.fullName} - ${seller.email}`,
                        value: seller._id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
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
                      placeholder="Tháng"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
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
                      min={2020}
                      style={{ width: "100%" }}
                      controls={false}
                      placeholder="Năm"
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
                        label="Số đơn mục tiêu"
                        name="targetOrders"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập số đơn mục tiêu",
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
                        label="Lượt ghé thăm mục tiêu"
                        name="targetVisits"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập lượt ghé thăm mục tiêu",
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
                  KPI được dùng để so sánh kết quả thực tế của seller theo từng
                  tháng.
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

              <Button type="primary" htmlType="submit" loading={isLoading}>
                Tạo KPI
              </Button>
            </Flex>
          </Form>
        </Space>
      </Card>
    </>
  );
}
