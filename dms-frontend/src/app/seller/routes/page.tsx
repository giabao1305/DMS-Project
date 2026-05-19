"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  StopOutlined,
} from "@ant-design/icons";

import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Table,
  Tag,
  Typography,
} from "antd";

import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useMemo } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyRoutesQuery } from "@/features/routes/routeService";
import type { Route } from "@/features/routes/routeTypes";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  softPrimary: "#E7F8F5",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
  dark: "#07171F",
  darkMuted: "#A9D8D1",
};

const statusMap = {
  planned: {
    color: "default",
    text: "Kế hoạch",
    icon: <CalendarOutlined />,
  },
  in_progress: {
    color: "processing",
    text: "Đang đi tuyến",
    icon: <ClockCircleOutlined />,
  },
  completed: {
    color: "success",
    text: "Hoàn thành",
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    color: "error",
    text: "Đã hủy",
    icon: <StopOutlined />,
  },
};

export default function SellerRoutesPage() {
  const { data: routes = [], isLoading, refetch } = useGetMyRoutesQuery();

  useRealtimeRefetch(["new-notification", "route-updated"], refetch);

  const stats = useMemo(() => {
    const totalCustomers = routes.reduce(
      (total, route) => total + route.customers.length,
      0,
    );

    return {
      total: routes.length,
      planned: routes.filter((item) => item.status === "planned").length,
      progress: routes.filter((item) => item.status === "in_progress").length,
      completed: routes.filter((item) => item.status === "completed").length,
      cancelled: routes.filter((item) => item.status === "cancelled").length,
      totalCustomers,
    };
  }, [routes]);

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const activeRate = stats.total
    ? Math.round(((stats.progress + stats.completed) / stats.total) * 100)
    : 0;

  const nextRoute = useMemo(() => {
    if (!routes.length) return undefined;

    return [...routes].sort(
      (a, b) =>
        new Date(a.workDate).getTime() - new Date(b.workDate).getTime(),
    )[0];
  }, [routes]);

  const columns: ColumnsType<Route> = [
    {
      title: "Tên tuyến",
      dataIndex: "name",
      ellipsis: true,
      width: 280,
      render: (value: string) => (
        <Flex align="center" gap={12}>
          <div className="seller-routes-route-mark">
            <EnvironmentOutlined />
          </div>

          <Text strong ellipsis className="seller-routes-table-strong">
            {value}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Ngày làm việc",
      dataIndex: "workDate",
      width: 170,
      render: (value: string) => (
        <Text className="seller-routes-table-muted">
          {new Date(value).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customers",
      align: "center",
      width: 130,
      render: (customers: Route["customers"]) => (
        <Tag color="cyan" className="seller-routes-count-tag">
          {customers.length}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 180,
      render: (status: keyof typeof statusMap) => {
        const item = statusMap[status] ?? statusMap.planned;

        return (
          <Tag
            color={item.color}
            icon={item.icon}
            className="seller-routes-status-tag"
          >
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 170,
      render: (value: string) => (
        <Text className="seller-routes-table-muted">
          {new Date(value).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Hành động",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Link href={`/seller/routes/${record._id}`}>
          <Button icon={<EyeOutlined />} className="seller-routes-action">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Tuyến bán hàng"
        description="Theo dõi lịch trình bán hàng, số khách cần ghé và tiến độ hoàn thành tuyến."
      />

      <Flex className="seller-routes-stack" vertical gap={20}>
        <Card
          variant="borderless"
          className="seller-routes-command-card"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <Row gutter={0}>
            <Col xs={24} lg={9}>
              <div className="seller-routes-command-dark">
                <Text className="seller-routes-command-eyebrow">
                  Route execution
                </Text>
                <div className="seller-routes-command-title">
                  Nắm nhanh toàn bộ tuyến
                </div>
                <Text className="seller-routes-command-description">
                  Theo dõi ngày làm việc, lượng khách cần ghé và trạng thái
                  thực hiện để chủ động xử lý từng tuyến bán hàng.
                </Text>

                <div className="seller-routes-dark-meter">
                  <span>{activeRate}%</span>
                  <label>Tuyến đã bắt đầu hoặc hoàn thành</label>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={15}>
              <div className="seller-routes-command-summary">
                <div className="seller-routes-command-content">
                  <div>
                    <Flex gap={14} wrap="wrap">
                      <div className="seller-routes-command-stat">
                        <span>{stats.total}</span>
                        <label>Tổng tuyến</label>
                      </div>
                      <div className="seller-routes-command-stat">
                        <span>{stats.totalCustomers}</span>
                        <label>Khách cần ghé</label>
                      </div>
                      <div className="seller-routes-command-stat">
                        <span>{completionRate}%</span>
                        <label>Tỷ lệ hoàn thành</label>
                      </div>
                    </Flex>

                    <div className="seller-routes-progress-block">
                      <Flex justify="space-between" align="center" gap={12}>
                        <Text className="seller-routes-progress-label">
                          Hoàn thành tuyến
                        </Text>
                        <Text className="seller-routes-progress-value">
                          {stats.completed}/{stats.total}
                        </Text>
                      </Flex>
                      <Progress
                        percent={completionRate}
                        strokeColor={COLORS.primary}
                        trailColor="#D9EEE9"
                        showInfo={false}
                      />
                    </div>
                  </div>

                  <div className="seller-routes-next-card">
                    <Text className="seller-routes-next-label">
                      Tuyến gần nhất
                    </Text>

                    {nextRoute ? (
                      <>
                        <Text ellipsis className="seller-routes-next-title">
                          {nextRoute.name}
                        </Text>

                        <div className="seller-routes-next-meta">
                          <span>
                            {new Date(nextRoute.workDate).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                          <span>{nextRoute.customers.length} khách</span>
                        </div>

                        <Flex justify="space-between" align="center" gap={10}>
                          <Tag
                            color={
                              statusMap[
                                nextRoute.status as keyof typeof statusMap
                              ]?.color ?? "default"
                            }
                            className="seller-routes-next-tag"
                          >
                            {statusMap[
                              nextRoute.status as keyof typeof statusMap
                            ]?.text ?? "Kế hoạch"}
                          </Tag>

                          <Link href={`/seller/routes/${nextRoute._id}`}>
                            <Button
                              type="primary"
                              size="small"
                              className="seller-routes-next-button"
                            >
                              Mở tuyến
                            </Button>
                          </Link>
                        </Flex>
                      </>
                    ) : (
                      <Text className="seller-routes-next-empty">
                        Chưa có tuyến được phân công.
                      </Text>
                    )}
                  </div>
                </div>

                <div className="seller-routes-status-grid">
                  <div>
                    <CalendarOutlined />
                    <span>Kế hoạch</span>
                    <strong>{stats.planned}</strong>
                  </div>
                  <div>
                    <ClockCircleOutlined />
                    <span>Đang đi</span>
                    <strong>{stats.progress}</strong>
                  </div>
                  <div>
                    <CheckCircleOutlined />
                    <span>Hoàn thành</span>
                    <strong>{stats.completed}</strong>
                  </div>
                  <div>
                    <StopOutlined />
                    <span>Đã hủy</span>
                    <strong>{stats.cancelled}</strong>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-routes-section-title">
                Danh sách tuyến bán hàng
              </Text>

              <Text className="seller-routes-section-description">
                Theo dõi ngày làm việc, lượng khách và trạng thái từng tuyến.
              </Text>
            </Flex>
          }
          className="seller-routes-section-card"
        >
          <Table
            className="seller-routes-table"
            rowKey="_id"
            loading={isLoading}
            columns={columns}
            dataSource={routes}
            scroll={{ x: 1120 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} tuyến bán hàng`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có tuyến bán hàng" />,
            }}
          />
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-content > .ant-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(11, 47, 42, 0.06);
        }

        .seller-content > .ant-card .ant-card-body {
          padding: 20px 22px;
        }

        .seller-routes-stack {
          position: relative;
        }

        .seller-routes-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 208px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-routes-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-routes-command-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .seller-routes-command-dark {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-routes-command-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-routes-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .seller-routes-command-description {
          display: block;
          max-width: 430px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-routes-dark-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .seller-routes-dark-meter span {
          display: block;
          color: #ffffff;
          font-size: 26px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-routes-dark-meter label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-routes-command-summary {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
        }

        .seller-routes-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .seller-routes-command-stat {
          min-width: 128px;
          flex: 1 1 128px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-routes-command-stat span {
          display: block;
          color: ${COLORS.text};
          font-size: 25px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-routes-command-stat label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-routes-next-card {
          min-height: 152px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-routes-next-label {
          color: ${COLORS.primaryHover};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-routes-next-title {
          display: block;
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.25;
        }

        .seller-routes-next-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .seller-routes-next-meta span {
          padding: 5px 9px;
          border: 1px solid #cbe9e3;
          border-radius: 999px;
          background: #ffffff;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
        }

        .seller-routes-next-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
        }

        .seller-routes-next-button.ant-btn {
          border-color: ${COLORS.primary};
          border-radius: 9px;
          background: ${COLORS.primary};
          font-weight: 750;
        }

        .seller-routes-next-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-routes-next-empty {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-routes-progress-block {
          margin-top: 18px;
          padding: 14px 15px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-routes-progress-label {
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-routes-progress-value {
          color: ${COLORS.secondary};
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-routes-status-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-routes-status-grid > div {
          min-height: 76px;
          padding: 12px;
          display: grid;
          gap: 4px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-routes-status-grid .anticon {
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-routes-status-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .seller-routes-status-grid strong {
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-routes-section-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-routes-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
        }

        .seller-routes-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-routes-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-routes-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-routes-route-mark {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 38px;
          border-radius: 12px;
          background: ${COLORS.softPrimary};
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-routes-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-routes-table-muted {
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-routes-count-tag.ant-tag,
        .seller-routes-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
          text-align: center;
        }

        .seller-routes-count-tag.ant-tag {
          min-width: 44px;
        }

        .seller-routes-status-tag.ant-tag {
          min-width: 118px;
        }

        .seller-routes-action.ant-btn {
          height: 34px;
          border-color: ${COLORS.border};
          border-radius: 10px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-routes-action.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-routes-table .ant-table {
          background: #ffffff !important;
        }

        .seller-routes-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-routes-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-routes-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-routes-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }

        @media (max-width: 900px) {
          .seller-routes-command-content {
            grid-template-columns: 1fr;
          }

          .seller-routes-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}
