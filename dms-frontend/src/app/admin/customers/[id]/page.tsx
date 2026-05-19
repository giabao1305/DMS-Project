"use client";

import type { ReactNode } from "react";
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Empty,
  Flex,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";
import {
  useApproveCustomerMutation,
  useGetCustomerByIdQuery,
  useRejectCustomerMutation,
} from "@/features/customers/customerService";
import type { CustomerStatus } from "@/features/customers/customerTypes";

const { Text, Title } = Typography;

const statusMap: Record<CustomerStatus, { color: string; text: string }> = {
  pending: { color: "gold", text: "Chờ duyệt" },
  approved: { color: "green", text: "Đã duyệt" },
  rejected: { color: "red", text: "Từ chối" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const formatCoordinates = (latitude?: number, longitude?: number) => {
  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null
  ) {
    return "-";
  }

  return `${latitude}, ${longitude}`;
};

const getRelationName = (
  value?: string | { fullName?: string; email?: string; _id: string },
) => {
  if (!value) return "-";
  return typeof value === "string" ? value : value.fullName || value.email || "-";
};

export default function CustomerDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: customer, isLoading } = useGetCustomerByIdQuery(id);
  const [approveCustomer, { isLoading: approving }] =
    useApproveCustomerMutation();
  const [rejectCustomer, { isLoading: rejecting }] =
    useRejectCustomerMutation();

  if (isLoading) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết khách hàng"
          description="Xem thông tin chi tiết khách hàng và điểm bán."
          extra={
            <Button onClick={() => router.push("/admin/customers")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-customer-detail-frame is-loading" />
        <CustomerDetailStyles />
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <AdminBreadcrumb />
        <AdminPageHeader
          title="Chi tiết khách hàng"
          description="Xem thông tin chi tiết khách hàng và điểm bán."
          extra={
            <Button onClick={() => router.push("/admin/customers")}>
              Quay lại
            </Button>
          }
        />
        <div className="admin-customer-detail-frame">
          <Empty description="Không tìm thấy khách hàng" />
        </div>
        <CustomerDetailStyles />
      </>
    );
  }

  const currentStatus = statusMap[customer.status] || {
    color: "default",
    text: customer.status || "-",
  };

  const handleApprove = async () => {
    try {
      await approveCustomer(customer._id).unwrap();
      message.success("Duyệt khách hàng thành công");
    } catch {
      message.error("Duyệt khách hàng thất bại");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await rejectCustomer({
        id: customer._id,
        rejectReason: rejectReason.trim(),
      }).unwrap();

      message.success("Từ chối khách hàng thành công");
      setRejectOpen(false);
      setRejectReason("");
    } catch {
      message.error("Từ chối khách hàng thất bại");
    }
  };

  return (
    <>
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Chi tiết khách hàng"
        description="Xem thông tin khách hàng, điểm bán và trạng thái kiểm duyệt."
        extra={
          <Flex gap={8} wrap="wrap">
            <Button onClick={() => router.push("/admin/customers")}>
              Quay lại
            </Button>

            {customer.status === "pending" ? (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={approving}
                  onClick={handleApprove}
                >
                  Duyệt
                </Button>

                <Button
                  color="danger"
                  variant="solid"
                  icon={<CloseOutlined />}
                  onClick={() => setRejectOpen(true)}
                >
                  Từ chối
                </Button>
              </>
            ) : null}

            <Link href={`/admin/customers/${customer._id}/edit`}>
              <Button color="orange" variant="solid" icon={<EditOutlined />}>
                Sửa khách hàng
              </Button>
            </Link>
          </Flex>
        }
      />

      <section className="admin-customer-detail-shell">
        <div className="admin-customer-detail-frame">
          <section className="admin-customer-detail-section">
            <Flex
              align="center"
              justify="space-between"
              gap={18}
              wrap="wrap"
              className="admin-customer-profile-head"
            >
              <Flex align="center" gap={16} className="admin-customer-profile-main">
                <Flex
                  align="center"
                  justify="center"
                  className="admin-customer-profile-icon"
                >
                  <ShopOutlined />
                </Flex>
                <div>
                  <Title level={3} className="admin-customer-title">
                    {customer.name}
                  </Title>
                  <Text className="admin-customer-subtitle">
                    {customer.customerType || "Chưa phân loại"}
                  </Text>
                </div>
              </Flex>

              <Space wrap>
                <Tag
                  color={currentStatus.color}
                  className="admin-customer-detail-tag"
                >
                  {currentStatus.text}
                </Tag>
                <Tag
                  color={customer.isActive ? "green" : "default"}
                  className="admin-customer-detail-tag"
                >
                  {customer.isActive ? "Hoạt động" : "Tạm khóa"}
                </Tag>
              </Space>
            </Flex>
          </section>

          <section className="admin-customer-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-customer-section-head"
            >
              <div>
                <Text className="admin-customer-section-title">
                  Thông tin khách hàng
                </Text>
                <Text className="admin-customer-section-desc">
                  Dữ liệu nhận diện, liên hệ và vị trí của điểm bán.
                </Text>
              </div>
            </Flex>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} xl={8}>
                <InfoItem icon={<ShopOutlined />} label="Tên khách hàng" value={customer.name} />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem
                  icon={<PhoneOutlined />}
                  label="Số điện thoại"
                  value={customer.phone || "-"}
                />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <InfoItem
                  icon={<UserOutlined />}
                  label="Chủ cửa hàng"
                  value={customer.ownerName || "-"}
                />
              </Col>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<ShopOutlined />}
                  label="Loại khách hàng"
                  value={customer.customerType || "-"}
                />
              </Col>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<EnvironmentOutlined />}
                  label="Tọa độ GPS"
                  value={formatCoordinates(customer.latitude, customer.longitude)}
                />
              </Col>
              <Col xs={24}>
                <InfoItem
                  icon={<EnvironmentOutlined />}
                  label="Địa chỉ"
                  value={customer.address || "-"}
                />
              </Col>
            </Row>
          </section>

          <section className="admin-customer-detail-section">
            <Flex
              justify="space-between"
              align="flex-start"
              gap={14}
              wrap="wrap"
              className="admin-customer-section-head"
            >
              <div>
                <Text className="admin-customer-section-title">
                  Phân công và kiểm duyệt
                </Text>
                <Text className="admin-customer-section-desc">
                  Seller phụ trách, người tạo, người duyệt và ghi chú từ chối.
                </Text>
              </div>
            </Flex>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<UserOutlined />}
                  label="Seller phụ trách"
                  value={getRelationName(customer.assignedSeller)}
                />
              </Col>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<UserOutlined />}
                  label="Người tạo"
                  value={getRelationName(customer.createdBy)}
                />
              </Col>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<CheckOutlined />}
                  label="Người duyệt"
                  value={getRelationName(customer.approvedBy)}
                />
              </Col>
              <Col xs={24} md={12}>
                <InfoItem
                  icon={<CheckOutlined />}
                  label="Ngày tạo"
                  value={formatDateTime(customer.createdAt)}
                />
              </Col>
              <Col xs={24}>
                <div className="admin-customer-review-box">
                  <Flex align="center" gap={10} wrap="wrap">
                    <Text className="admin-customer-review-label">
                      Trạng thái hiện tại:
                    </Text>
                    <Tag
                      color={currentStatus.color}
                      className="admin-customer-detail-tag"
                    >
                      {currentStatus.text}
                    </Tag>
                  </Flex>

                  {customer.status === "rejected" && customer.rejectReason ? (
                    <div className="admin-customer-reject-reason">
                      <Text className="admin-customer-review-label">
                        Lý do từ chối
                      </Text>
                      <Text type="danger" className="admin-customer-review-value">
                        {customer.rejectReason}
                      </Text>
                    </div>
                  ) : (
                    <Text className="admin-customer-review-muted">
                      Chưa có ghi chú kiểm duyệt bổ sung.
                    </Text>
                  )}
                </div>
              </Col>
            </Row>
          </section>
        </div>
      </section>

      <Modal
        title="Từ chối khách hàng"
        open={rejectOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason("");
        }}
        confirmLoading={rejecting}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối..."
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>

      <CustomerDetailStyles />
    </>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <Flex gap={12} align="flex-start" className="admin-customer-info-item">
      <Flex align="center" justify="center" className="admin-customer-info-icon">
        {icon}
      </Flex>
      <div className="admin-customer-info-copy">
        <Text className="admin-customer-info-label">{label}</Text>
        <Text className="admin-customer-info-value">{value}</Text>
      </div>
    </Flex>
  );
}

function CustomerDetailStyles() {
  return (
    <style jsx global>{`
      .admin-customer-detail-shell {
        margin: -2px -2px 0;
        padding: 2px;
      }

      .admin-customer-detail-frame {
        min-height: 260px;
        padding: 20px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .admin-customer-detail-frame.is-loading {
        min-height: 180px;
        background: linear-gradient(90deg, #f8fafc 25%, #eef3f8 37%, #f8fafc 63%);
        background-size: 400% 100%;
        animation: admin-customer-detail-loading 1.2s ease infinite;
      }

      @keyframes admin-customer-detail-loading {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .admin-customer-detail-section + .admin-customer-detail-section {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #dbe4f0;
      }

      .admin-customer-profile-head {
        min-height: 92px;
      }

      .admin-customer-profile-main {
        min-width: 0;
      }

      .admin-customer-profile-icon {
        width: 72px;
        height: 72px;
        min-width: 72px;
        border: 1px solid #c7ddfe;
        border-radius: 8px;
        color: #2563eb;
        font-size: 30px;
        background: #eff6ff;
      }

      .admin-customer-title.ant-typography {
        margin: 0;
        color: #0f172a;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 0;
      }

      .admin-customer-subtitle.ant-typography {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
      }

      .admin-customer-detail-tag {
        min-width: 96px;
        height: 31px;
        margin-inline-end: 0;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 999px !important;
        font-weight: 800;
      }

      .admin-customer-section-head {
        margin-bottom: 18px;
      }

      .admin-customer-section-title,
      .admin-customer-section-desc,
      .admin-customer-info-label,
      .admin-customer-info-value,
      .admin-customer-review-value,
      .admin-customer-review-muted {
        display: block;
      }

      .admin-customer-section-title {
        color: #0f172a !important;
        font-size: 16px;
        font-weight: 900;
      }

      .admin-customer-section-desc,
      .admin-customer-info-label,
      .admin-customer-review-label,
      .admin-customer-review-muted {
        color: #64748b !important;
        font-size: 12.5px;
        font-weight: 600;
      }

      .admin-customer-info-item,
      .admin-customer-review-box {
        min-height: 82px;
        padding: 16px;
        border: 1px solid #dbe4f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      .admin-customer-info-icon {
        width: 40px;
        height: 40px;
        min-width: 40px;
        border: 1px solid #c7ddfe;
        border-radius: 8px;
        color: #2563eb;
        background: #eff6ff;
      }

      .admin-customer-info-copy {
        min-width: 0;
      }

      .admin-customer-info-value {
        margin-top: 4px;
        color: #0f172a !important;
        font-size: 14px;
        font-weight: 900;
        word-break: break-word;
      }

      .admin-customer-reject-reason {
        margin-top: 12px;
      }

      .admin-customer-review-value {
        margin-top: 4px;
        font-weight: 800;
      }

      .admin-customer-review-muted {
        margin-top: 10px;
      }

      @media (max-width: 767px) {
        .admin-customer-detail-frame {
          padding: 14px;
        }

        .admin-customer-title.ant-typography {
          font-size: 21px;
        }
      }
    `}</style>
  );
}
