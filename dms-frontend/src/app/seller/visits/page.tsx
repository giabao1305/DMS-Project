"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  ShopOutlined,
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
import { useGetMyVisitsQuery } from "@/features/visits/visitService";
import type { Visit } from "@/features/visits/visitTypes";
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
  checked_in: {
    color: "processing",
    text: "Đang ghé thăm",
    icon: <ClockCircleOutlined />,
  },
  checked_out: {
    color: "success",
    text: "Hoàn thành",
    icon: <CheckCircleOutlined />,
  },
};

const getCustomerName = (customer: Visit["customer"]) => {
  if (typeof customer === "string") return customer;
  return customer?.name || "-";
};

export default function SellerVisitsPage() {
  const { data: visits = [], isLoading, refetch } = useGetMyVisitsQuery();

  useRealtimeRefetch(["new-notification", "visit-updated"], refetch);

  const stats = useMemo(() => {
    return {
      total: visits.length,
      active: visits.filter((item) => item.status === "checked_in").length,
      completed: visits.filter((item) => item.status === "checked_out").length,
    };
  }, [visits]);

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const latestVisit = useMemo(() => {
    if (!visits.length) return undefined;

    return [...visits].sort(
      (a, b) =>
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime(),
    )[0];
  }, [visits]);

  const columns: ColumnsType<Visit> = [
    {
      title: "Khách hàng",
      dataIndex: "customer",
      ellipsis: true,
      width: 280,
      render: (customer: Visit["customer"]) => (
        <Flex align="center" gap={12}>
          <div className="seller-visits-customer-mark">
            <ShopOutlined />
          </div>

          <Text strong ellipsis className="seller-visits-table-strong">
            {getCustomerName(customer)}
          </Text>
        </Flex>
      ),
    },
    {
      title: "Check-in",
      dataIndex: "checkInTime",
      width: 190,
      render: (value: string) => (
        <Text className="seller-visits-table-muted">
          {new Date(value).toLocaleString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Check-out",
      dataIndex: "checkOutTime",
      width: 190,
      render: (value?: string) => (
        <Text
          className={
            value ? "seller-visits-table-muted" : "seller-visits-empty-text"
          }
        >
          {value ? new Date(value).toLocaleString("vi-VN") : "-"}
        </Text>
      ),
    },
    {
      title: "Khoảng cách",
      dataIndex: "checkInDistance",
      align: "center",
      width: 150,
      render: (value?: number) => (
        <Tag
          color={value !== undefined ? "cyan" : "default"}
          className="seller-visits-distance-tag"
        >
          {value !== undefined ? `${Math.round(value)} m` : "-"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 180,
      render: (status: keyof typeof statusMap) => {
        const item = statusMap[status] ?? statusMap.checked_in;

        return (
          <Tag color={item.color} icon={item.icon} className="seller-visits-status-tag">
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Link href={`/seller/visits/${record._id}`}>
          <Button icon={<EyeOutlined />} className="seller-visits-action">
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
        title="Lịch sử ghé thăm"
        description="Theo dõi hoạt động check-in, check-out và tiến độ ghé khách hàng."
        extra={
          <Link href="/seller/visits/create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="seller-visits-primary-button"
            >
              Check-in mới
            </Button>
          </Link>
        }
      />

      <Flex className="seller-visits-stack" vertical gap={20}>
        <Card
          variant="borderless"
          className="seller-visits-command-card"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <Row gutter={0}>
            <Col xs={24} lg={9}>
              <div className="seller-visits-command-dark">
                <Text className="seller-visits-command-eyebrow">
                  Visit tracking
                </Text>
                <div className="seller-visits-command-title">
                  Theo dõi lượt ghé thực địa
                </div>
                <Text className="seller-visits-command-description">
                  Kiểm soát check-in, check-out, khoảng cách GPS và trạng thái
                  từng lượt ghé khách hàng.
                </Text>

                <div className="seller-visits-dark-meter">
                  <span>{completionRate}%</span>
                  <label>Lượt ghé đã hoàn thành</label>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={15}>
              <div className="seller-visits-command-summary">
                <div className="seller-visits-command-content">
                  <div>
                    <Flex gap={14} wrap="wrap">
                      <div className="seller-visits-command-stat">
                        <span>{stats.total}</span>
                        <label>Tổng lượt ghé</label>
                      </div>
                      <div className="seller-visits-command-stat">
                        <span>{stats.active}</span>
                        <label>Đang check-in</label>
                      </div>
                      <div className="seller-visits-command-stat">
                        <span>{completionRate}%</span>
                        <label>Tỷ lệ hoàn thành</label>
                      </div>
                    </Flex>

                    <div className="seller-visits-progress-block">
                      <Flex justify="space-between" align="center" gap={12}>
                        <Text className="seller-visits-progress-label">
                          Hoàn thành lượt ghé
                        </Text>
                        <Text className="seller-visits-progress-value">
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

                  <div className="seller-visits-latest-card">
                    <Text className="seller-visits-latest-label">
                      Lượt ghé gần nhất
                    </Text>

                    {latestVisit ? (
                      <>
                        <Text ellipsis className="seller-visits-latest-title">
                          {getCustomerName(latestVisit.customer)}
                        </Text>

                        <div className="seller-visits-latest-meta">
                          <span>
                            {new Date(latestVisit.checkInTime).toLocaleString(
                              "vi-VN",
                            )}
                          </span>
                          <span>
                            {latestVisit.checkInDistance !== undefined
                              ? `${Math.round(latestVisit.checkInDistance)} m`
                              : "Chưa có khoảng cách"}
                          </span>
                        </div>

                        <Flex justify="space-between" align="center" gap={10}>
                          <Tag
                            color={
                              statusMap[
                                latestVisit.status as keyof typeof statusMap
                              ]?.color ?? "default"
                            }
                            className="seller-visits-latest-tag"
                          >
                            {statusMap[
                              latestVisit.status as keyof typeof statusMap
                            ]?.text ?? "Đang ghé thăm"}
                          </Tag>

                          <Link href={`/seller/visits/${latestVisit._id}`}>
                            <Button
                              type="primary"
                              size="small"
                              className="seller-visits-latest-button"
                            >
                              Mở lượt
                            </Button>
                          </Link>
                        </Flex>
                      </>
                    ) : (
                      <Text className="seller-visits-latest-empty">
                        Chưa có lượt ghé nào.
                      </Text>
                    )}
                  </div>
                </div>

                <div className="seller-visits-status-grid">
                  <div>
                    <EnvironmentOutlined />
                    <span>Tổng lượt</span>
                    <strong>{stats.total}</strong>
                  </div>
                  <div>
                    <ClockCircleOutlined />
                    <span>Đang check-in</span>
                    <strong>{stats.active}</strong>
                  </div>
                  <div>
                    <CheckCircleOutlined />
                    <span>Hoàn thành</span>
                    <strong>{stats.completed}</strong>
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
              <Text strong className="seller-visits-section-title">
                Danh sách lịch sử ghé thăm
              </Text>

              <Text className="seller-visits-section-description">
                Xem thời gian, khoảng cách và trạng thái từng lượt ghé khách.
              </Text>
            </Flex>
          }
          className="seller-visits-section-card"
        >
          <Table
            className="seller-visits-table"
            rowKey="_id"
            loading={isLoading}
            columns={columns}
            dataSource={visits}
            scroll={{ x: 1120 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} lượt ghé thăm`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có lượt ghé thăm nào" />,
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

        .seller-visits-stack {
          position: relative;
        }

        .seller-visits-stack::before {
          content: "";
          position: absolute;
          inset: -8px -8px auto;
          height: 208px;
          border-radius: 18px;
          background: ${COLORS.softPrimary};
          pointer-events: none;
          z-index: 0;
        }

        .seller-visits-stack > * {
          position: relative;
          z-index: 1;
        }

        .seller-visits-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-visits-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-visits-command-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(11, 47, 42, 0.07);
        }

        .seller-visits-command-dark {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: ${COLORS.dark};
        }

        .seller-visits-command-eyebrow {
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-visits-command-title {
          margin-top: 10px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .seller-visits-command-description {
          display: block;
          max-width: 420px;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.6;
        }

        .seller-visits-dark-meter {
          margin-top: auto;
          padding: 14px 15px;
          border: 1px solid rgba(20, 184, 166, 0.2);
          border-radius: 14px;
          background: #0d2430;
        }

        .seller-visits-dark-meter span {
          display: block;
          color: #ffffff;
          font-size: 26px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-visits-dark-meter label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.darkMuted};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-visits-command-summary {
          min-height: 248px;
          height: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          background: #ffffff;
        }

        .seller-visits-command-content {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .seller-visits-command-stat {
          min-width: 128px;
          flex: 1 1 128px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-visits-command-stat span {
          display: block;
          color: ${COLORS.text};
          font-size: 25px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-visits-command-stat label {
          display: block;
          margin-top: 5px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-visits-progress-block {
          margin-top: 18px;
          padding: 14px 15px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
        }

        .seller-visits-progress-label {
          color: ${COLORS.text};
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .seller-visits-progress-value {
          color: ${COLORS.secondary};
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .seller-visits-latest-card {
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

        .seller-visits-latest-label {
          color: ${COLORS.primaryHover};
          font-size: 12px;
          font-weight: 850;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .seller-visits-latest-title {
          display: block;
          color: ${COLORS.text};
          font-size: 17px;
          font-weight: 850;
          line-height: 1.25;
        }

        .seller-visits-latest-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .seller-visits-latest-meta span {
          padding: 5px 9px;
          border: 1px solid #cbe9e3;
          border-radius: 999px;
          background: #ffffff;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
        }

        .seller-visits-latest-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
        }

        .seller-visits-latest-button.ant-btn {
          border-color: ${COLORS.primary};
          border-radius: 9px;
          background: ${COLORS.primary};
          font-weight: 750;
        }

        .seller-visits-latest-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-visits-latest-empty {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-visits-status-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .seller-visits-status-grid > div {
          min-height: 76px;
          padding: 12px;
          display: grid;
          gap: 4px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.surface};
        }

        .seller-visits-status-grid .anticon {
          color: ${COLORS.primary};
          font-size: 17px;
        }

        .seller-visits-status-grid span {
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .seller-visits-status-grid strong {
          color: ${COLORS.text};
          font-size: 20px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-visits-section-card {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-visits-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
        }

        .seller-visits-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-visits-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-visits-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-visits-customer-mark {
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

        .seller-visits-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-visits-table-muted {
          color: ${COLORS.secondary};
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-visits-empty-text {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
        }

        .seller-visits-distance-tag.ant-tag,
        .seller-visits-status-tag.ant-tag {
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 24px;
          padding-inline: 10px;
          text-align: center;
        }

        .seller-visits-distance-tag.ant-tag {
          min-width: 72px;
        }

        .seller-visits-status-tag.ant-tag {
          min-width: 118px;
        }

        .seller-visits-action.ant-btn {
          height: 34px;
          border-color: ${COLORS.border};
          border-radius: 10px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-visits-action.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-visits-table .ant-table {
          background: #ffffff !important;
        }

        .seller-visits-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-visits-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-visits-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-visits-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: ${COLORS.surface} !important;
        }

        @media (max-width: 900px) {
          .seller-visits-command-content {
            grid-template-columns: 1fr;
          }

          .seller-visits-status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
