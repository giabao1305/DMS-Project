import type { Customer, Product } from "../types/domain";

export const currency = (value?: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const shortDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const shortDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getCustomerName = (customer?: string | Customer) =>
  !customer
    ? "Khách hàng"
    : typeof customer === "string"
      ? customer
      : customer.name || "Khách hàng";

export const getCustomerOwnerName = (customer?: string | Customer) =>
  !customer
    ? "Cửa hàng"
    : typeof customer === "string"
      ? customer
      : customer.ownerName || "Cửa hàng";

export const getCustomerId = (customer?: string | Customer) =>
  !customer ? "" : typeof customer === "string" ? customer : customer._id;

export const getProductName = (product?: string | Product) =>
  !product ? "Sản phẩm" : typeof product === "string" ? product : product.name;

export const statusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    delivered: "Đã giao",
    return_requested: "Yêu cầu trả",
    cancelled: "Đã hủy",
    returned: "Đã trả",
    planned: "Đã lên lịch",
    in_progress: "Đang chạy",
    completed: "Hoàn thành",
    checked_in: "Đã check-in",
    checked_out: "Đã check-out",
    skipped: "Bỏ qua",
    visited: "Đã ghé",
  };

  return status ? labels[status] || status : "-";
};
