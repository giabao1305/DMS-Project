"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import type { ReactNode } from "react";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useGetMyLeavesQuery } from "@/features/leaves/leaveService";
import type { LeaveRequest, LeaveStatus } from "@/features/leaves/leaveTypes";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const { Text } = Typography;

type LeaveRealtimePayload = {
  leave?: LeaveRequest;
};

const COLORS = {
  primary: "#0D9488",
  primaryHover: "#0F766E",
  card: "#FFFFFF",
  surface: "#F3FBF9",
  text: "#0B2F2A",
  secondary: "#5D7471",
  border: "#D7EBE7",
};

const statusMap: Record<
  LeaveStatus,
  { color: string; text: string; icon: ReactNode; description: string }
> = {
  pending: {
    color: "gold",
    text: "Chờ duyệt",
    icon: <ClockCircleOutlined />,
    description: "Đang chờ admin phản hồi",
  },
  approved: {
    color: "green",
    text: "Đã duyệt",
    icon: <CheckCircleOutlined />,
    description: "Yêu cầu đã được chấp thuận",
  },
  rejected: {
    color: "red",
    text: "Từ chối",
    icon: <CloseCircleOutlined />,
  description: "Cần xem lại phản hồi admin",
  },
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const getLeaveDays = (leave: Pick<LeaveRequest, "startDate" | "endDate">) => {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
};

export default function SellerLeavesPage() {
  const { data: leaves = [], isLoading, refetch } = useGetMyLeavesQuery();

  useRealtimeRefetch(["new-notification", "leave-updated"], refetch);

  const highlightedLeaveId = useRealtimeHighlight(
    ["leave-updated"],
    (payload) => (payload as LeaveRealtimePayload).leave?._id,
  );

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: "Thời gian nghỉ",
      dataIndex: "startDate",
      width: 260,
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <div className="seller-leaves-date-mark">
            <CalendarOutlined />
          </div>
          <Flex vertical gap={2}>
            <Text strong className="seller-leaves-table-strong">
              {formatDate(record.startDate)} - {formatDate(record.endDate)}
            </Text>
            <Text className="seller-leaves-table-muted">
              {getLeaveDays(record)} ngày nghỉ
            </Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      width: 360,
      ellipsis: true,
      render: (value: string) => (
        <Text ellipsis className="seller-leaves-table-muted">
          {value || "-"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 170,
      render: (status: LeaveStatus) => {
        const item = statusMap[status] ?? statusMap.pending;
        return (
          <Tag
            color={item.color}
            icon={item.icon}
            className="seller-leaves-status-tag"
          >
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 150,
      align: "center",
      render: (value: string) => (
        <Text className="seller-leaves-table-muted">{formatDate(value)}</Text>
      ),
    },
    {
      title: "Hành động",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Link href={`/seller/leaves/${record._id}`}>
          <Button icon={<EyeOutlined />} className="seller-leaves-action">
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
        title="Đơn nghỉ phép"
        description="Theo dõi lịch nghỉ, trạng thái duyệt và phản hồi từ admin."
        extra={
          <Link href="/seller/leaves/create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="seller-leaves-primary-button"
            >
              Tạo đơn nghỉ phép
            </Button>
          </Link>
        }
      />

      <Flex className="seller-leaves-stack" vertical gap={20}>
        <Card
          variant="borderless"
          title={
            <Flex vertical gap={2}>
              <Text strong className="seller-leaves-section-title">
                Danh sách đơn nghỉ phép
              </Text>
              <Text className="seller-leaves-section-description">
                Theo dõi thời gian nghỉ, lý do và trạng thái xét duyệt.
              </Text>
            </Flex>
          }
          className="seller-leaves-section-card"
        >
          <Table
            className="seller-leaves-table"
            rowKey="_id"
            loading={isLoading}
            columns={columns}
            dataSource={leaves}
            rowClassName={(record) =>
              record._id === highlightedLeaveId ? "realtime-highlight-row" : ""
            }
            scroll={{ x: 1120 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} đơn nghỉ phép`,
            }}
            locale={{
              emptyText: <Empty description="Chưa có đơn nghỉ phép nào" />,
            }}
          />
        </Card>
      </Flex>

      <style jsx global>{`
        .seller-leaves-stack {
          position: relative;
        }

        .seller-leaves-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-leaves-date-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${COLORS.surface};
          color: ${COLORS.primary};
        }

        .seller-leaves-date-mark {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border-radius: 12px;
          font-size: 17px;
        }

        .seller-leaves-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-leaves-section-description,
        .seller-leaves-table-muted {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.55;
        }

        .seller-leaves-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-leaves-section-card .ant-card-body {
          padding: 18px;
        }

        .seller-leaves-table-strong {
          color: ${COLORS.text};
          font-size: 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-leaves-status-tag.ant-tag {
          min-width: 104px;
          margin-inline-end: 0;
          border-radius: 999px;
          font-weight: 750;
          line-height: 26px;
          padding-inline: 10px;
          text-align: center;
        }

        .seller-leaves-primary-button.ant-btn {
          height: 42px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-leaves-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-leaves-action.ant-btn {
          height: 36px;
          border-color: ${COLORS.border};
          border-radius: 10px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-leaves-action.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }

        .seller-leaves-table .ant-table-container {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
        }

        .seller-leaves-table .ant-table-thead > tr > th {
          background: ${COLORS.surface} !important;
          color: ${COLORS.text} !important;
          font-size: 13px !important;
          font-weight: 850 !important;
          border-bottom: 1px solid ${COLORS.border} !important;
        }

        .seller-leaves-table .ant-table-tbody > tr > td {
          background: #ffffff !important;
          border-bottom: 1px solid #ecf6f3 !important;
        }

        .seller-leaves-table .ant-table-tbody > tr:hover > td {
          background: ${COLORS.surface} !important;
        }

        .seller-leaves-table .ant-table-tbody > tr.realtime-highlight-row > td {
          background: #e7f8f5 !important;
          animation: sellerLeaveHighlight 1.8s ease;
        }

        @keyframes sellerLeaveHighlight {
          0% {
            background: #b7e7de;
          }
          100% {
            background: #e7f8f5;
          }
        }

      `}</style>
    </>
  );
}
