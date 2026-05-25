"use client";

import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Row,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";

import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";
import { useCreateLeaveMutation } from "@/features/leaves/leaveService";
import type { CreateLeaveRequest } from "@/features/leaves/leaveTypes";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";

const { Text } = Typography;

type LeaveFormValues = {
  dateRange: [Dayjs, Dayjs];
  reason: string;
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

const getLeaveDays = (range?: [Dayjs, Dayjs]) => {
  if (!range?.[0] || !range?.[1]) return 0;

  return Math.max(
    1,
    range[1].startOf("day").diff(range[0].startOf("day"), "day") + 1,
  );
};

export default function SellerCreateLeavePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [form] = Form.useForm<LeaveFormValues>();
  const [createLeave, { isLoading }] = useCreateLeaveMutation();
  const selectedRange = Form.useWatch("dateRange", form);
  const selectedDays = getLeaveDays(selectedRange);

  useEffect(() => {
    if (currentUser?.role === "distributor") {
      router.replace("/forbidden?required=DSR&current=distributor");
    }
  }, [currentUser?.role, router]);

  const handleSubmit = async (values: LeaveFormValues) => {
    try {
      const body: CreateLeaveRequest = {
        startDate: values.dateRange[0].startOf("day").toISOString(),
        endDate: values.dateRange[1].endOf("day").toISOString(),
        reason: values.reason.trim(),
      };

      await createLeave(body).unwrap();

      message.success("Tạo đơn nghỉ phép thành công");
      router.push("/seller/leaves");
    } catch {
      message.error("Tạo đơn nghỉ phép thất bại");
    }
  };

  return (
    <>
      <SellerBreadcrumb />

      <SellerPageHeader
        title="Tạo đơn nghỉ phép"
        description="Gửi yêu cầu nghỉ phép để admin xét duyệt và phản hồi."
        extra={
          <Button onClick={() => router.push("/seller/leaves")}>
            Quay lại
          </Button>
        }
      />

      <Card
        variant="borderless"
        title={
          <Flex vertical gap={2}>
            <Text strong className="seller-leave-form-section-title">
              Thông tin đơn nghỉ phép
            </Text>
            <Text className="seller-leave-form-section-description">
              Chọn thời gian nghỉ và nhập lý do trước khi gửi đơn.
            </Text>
          </Flex>
        }
        className="seller-leave-form-section-card"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark>
          <Row gutter={[18, 4]}>
            <Col xs={24}>
              <Form.Item
                label="Thời gian nghỉ"
                name="dateRange"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian nghỉ",
                  },
                ]}
              >
                <DatePicker.RangePicker
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                  className="seller-leave-form-range"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Lý do nghỉ"
                name="reason"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng nhập lý do nghỉ",
                  },
                ]}
              >
                <Input.TextArea
                  rows={5}
                  placeholder="Nhập lý do xin nghỉ phép"
                  className="seller-leave-form-textarea"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="seller-leave-form-note">
            <Flex align="center" justify="space-between" gap={14} wrap="wrap">
              <Flex align="flex-start" gap={12}>
                <Flex vertical gap={4}>
                  <Text strong>Lưu ý khi gửi đơn</Text>
                  <Text>
                    Hãy nhập lý do ngắn gọn, rõ ràng để admin xử lý yêu cầu
                    nhanh hơn.
                  </Text>
                </Flex>
              </Flex>

              <div className="seller-leave-form-days">
                <span>{selectedDays || "--"}</span>
                <label>ngày nghỉ</label>
              </div>
            </Flex>
          </div>

          <Flex gap={10} wrap="wrap" style={{ marginTop: 10 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="seller-leave-form-primary-button"
            >
              Gửi đơn
            </Button>

            <Button
              onClick={() => router.push("/seller/leaves")}
              className="seller-leave-form-secondary-button"
            >
              Hủy
            </Button>
          </Flex>
        </Form>
      </Card>

      <style jsx global>{`
        .seller-leave-form-section-card {
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          box-shadow: 0 16px 34px rgba(11, 47, 42, 0.06);
        }

        .seller-leave-form-section-card .ant-card-head {
          min-height: 82px;
          padding: 18px 22px;
          border-bottom: 1px solid ${COLORS.border};
          background: ${COLORS.surface};
        }

        .seller-leave-form-section-card .ant-card-body {
          padding: 22px;
        }

        .seller-leave-form-section-title {
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 850;
          line-height: 1.45;
        }

        .seller-leave-form-section-description {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.5;
        }

        .seller-leave-form-range.ant-picker,
        .seller-leave-form-textarea.ant-input {
          width: 100%;
          border-color: ${COLORS.border};
          border-radius: 12px;
        }

        .seller-leave-form-range.ant-picker:hover,
        .seller-leave-form-textarea.ant-input:hover {
          border-color: ${COLORS.primary};
        }

        .seller-leave-form-textarea.ant-input {
          resize: vertical;
        }

        .seller-leave-form-note {
          margin: 8px 0 18px;
          padding: 16px 18px;
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.surface};
        }

        .seller-leave-form-note strong {
          color: ${COLORS.text};
          font-size: 15px;
          font-weight: 850;
        }

        .seller-leave-form-note span {
          color: ${COLORS.secondary};
          font-size: 13px;
          line-height: 1.6;
        }

        .seller-leave-form-days {
          min-width: 112px;
          padding: 10px 14px;
          border: 1px solid ${COLORS.border};
          border-radius: 14px;
          background: #ffffff;
          text-align: center;
        }

        .seller-leave-form-days span {
          display: block;
          color: ${COLORS.text};
          font-size: 22px;
          font-weight: 850;
          line-height: 1.1;
        }

        .seller-leave-form-days label {
          display: block;
          margin-top: 4px;
          color: ${COLORS.secondary};
          font-size: 12px;
          font-weight: 750;
          line-height: 1.3;
        }

        .seller-leave-form-primary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.primary};
          border-radius: 12px;
          background: ${COLORS.primary};
          font-weight: 800;
          box-shadow: 0 14px 30px rgba(13, 148, 136, 0.22);
        }

        .seller-leave-form-primary-button.ant-btn:hover {
          border-color: ${COLORS.primaryHover} !important;
          background: ${COLORS.primaryHover} !important;
        }

        .seller-leave-form-secondary-button.ant-btn {
          height: 44px;
          border-color: ${COLORS.border};
          border-radius: 12px;
          color: ${COLORS.text};
          font-weight: 750;
        }

        .seller-leave-form-secondary-button.ant-btn:hover {
          border-color: ${COLORS.primary} !important;
          color: ${COLORS.primary} !important;
        }
      `}</style>
    </>
  );
}
