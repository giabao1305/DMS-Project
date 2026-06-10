export function orderApiMessage(error: unknown, fallback: string) {
  const payload = error as { data?: { message?: string | string[] } };
  const detail = payload.data?.message;
  const raw = Array.isArray(detail) ? detail[0] : detail;

  if (!raw) return fallback;

  if (raw.includes("Distributor must have an active warehouse")) {
    return "Nhà phân phối chưa có kho đang hoạt động. Vui lòng tạo hoặc kích hoạt kho NPP trước khi nhập hàng.";
  }

  if (raw.includes("Not enough stock for product")) {
    return raw.replace(
      "Not enough stock for product",
      "Kho chính không đủ hàng cho sản phẩm",
    );
  }

  if (raw.includes("Not enough stock in distributor warehouse")) {
    return "Tồn kho NPP không đủ để xác nhận đơn này.";
  }

  if (raw.includes("Product is not stocked in distributor warehouse")) {
    return "Sản phẩm chưa có trong tồn kho NPP.";
  }

  if (raw.includes("Distributor not found")) {
    return "Không tìm thấy nhà phân phối hoặc tài khoản NPP đã bị khóa.";
  }

  if (raw.includes("Supply order does not have a destination warehouse")) {
    return "Đơn nhập kho chưa có kho NPP đích. Vui lòng kiểm tra lại đơn hoặc tạo đơn mới.";
  }

  return raw;
}
