const exactMessages: Record<string, string> = {
  "Seller must check in at this customer before creating an order":
    "DSR phải check-in tại khách hàng này trước khi tạo đơn.",
  "Order items are required": "Vui lòng thêm sản phẩm vào đơn.",
  "Customer is required for store orders":
    "Vui lòng chọn khách hàng cho đơn bán ra tiệm.",
  "Customer not found": "Không tìm thấy khách hàng.",
  "Customer has not been approved": "Khách hàng chưa được duyệt.",
  "Distributor must select a managed seller":
    "Nhà phân phối phải chọn DSR thuộc đội của mình.",
  "This customer is not assigned to selected seller":
    "Khách hàng này không được gán cho DSR đã chọn.",
  "Promotion not found": "Không tìm thấy khuyến mãi.",
  "Promotion is not active": "Khuyến mãi chưa hoạt động hoặc đã hết hạn.",
  "Order value does not meet promotion condition":
    "Giá trị đơn chưa đạt điều kiện áp dụng khuyến mãi.",
  "Only admins or distributors can create manufacturer supply orders":
    "Chỉ admin hoặc nhà phân phối mới có thể tạo đơn cấp hàng NPP.",
  "Distributor is required for supply orders":
    "Vui lòng chọn nhà phân phối cho đơn cấp hàng.",
  "Supply orders cannot contain seller, customer or promotion":
    "Đơn cấp hàng NPP không được chọn DSR, khách hàng hoặc khuyến mãi.",
  "Distributor not found":
    "Không tìm thấy nhà phân phối hoặc tài khoản NPP đã bị khóa.",
  "Order not found": "Không tìm thấy đơn hàng.",
  "Pricing can only be updated for supply orders":
    "Chỉ đơn cấp hàng NPP mới được cập nhật giá vốn.",
  "Supply pricing can only be updated before delivery":
    "Chỉ có thể cập nhật giá vốn trước khi giao hàng.",
  "Supply order editing is not available; cancel and create a new order":
    "Không thể sửa đơn cấp hàng NPP. Vui lòng hủy và tạo đơn mới.",
  "You cannot update this order": "Bạn không có quyền cập nhật đơn này.",
  "Only pending orders can be updated":
    "Chỉ đơn đang chờ xử lý mới có thể cập nhật.",
  "Seller cannot reassign orders": "DSR không được đổi người phụ trách đơn.",
  "You can only view your own orders": "Bạn chỉ có thể xem đơn của mình.",
  "You can only view orders created by your sellers or distributor":
    "Bạn chỉ có thể xem đơn do đội DSR hoặc nhà phân phối của mình tạo.",
  "Only pending orders can be approved":
    "Chỉ đơn đang chờ duyệt mới có thể duyệt.",
  "Store order is missing seller": "Đơn bán ra tiệm đang thiếu DSR phụ trách.",
  "Distributor can only approve their own store orders":
    "NPP chỉ được duyệt đơn bán ra tiệm thuộc NPP mình.",
  "Store order does not have a distributor warehouse":
    "Đơn chưa có kho NPP. Vui lòng kiểm tra phân công NPP/DSR.",
  "Only approved orders can be delivered":
    "Chỉ đơn đã duyệt mới có thể giao hàng.",
  "Distributor can only deliver their own store orders":
    "NPP chỉ được giao đơn bán ra tiệm thuộc NPP mình.",
  "Supply order does not have a destination warehouse":
    "Đơn nhập kho chưa có kho NPP đích. Vui lòng kiểm tra lại đơn hoặc tạo đơn mới.",
  "VNPay payment can only be created after delivery":
    "Chỉ có thể tạo thanh toán VNPay sau khi đơn đã giao.",
  "Order has no outstanding balance": "Đơn hàng không còn công nợ cần thu.",
  "Invalid checksum": "Chữ ký thanh toán không hợp lệ.",
  "Missing transaction reference": "Thiếu mã tham chiếu giao dịch.",
  "Order is missing payment collector":
    "Đơn hàng đang thiếu người ghi nhận thanh toán.",
  "Invalid VNPay payment amount": "Số tiền thanh toán VNPay không hợp lệ.",
  "Missing VNPAY_TMN_CODE or VNPAY_HASH_SECRET":
    "Thiếu cấu hình VNPay. Vui lòng kiểm tra biến môi trường.",
  "Payment can only be recorded after delivery":
    "Chỉ có thể ghi nhận thanh toán sau khi đơn đã giao.",
  "You can only collect payment for your own orders":
    "Bạn chỉ có thể thu tiền cho đơn của mình.",
  "Payment exceeds outstanding balance":
    "Số tiền thanh toán vượt quá công nợ còn lại.",
  "Refund can only be recorded after delivery or during return review":
    "Chỉ có thể hoàn tiền sau khi đơn đã giao hoặc khi đang duyệt trả hàng.",
  "Refund exceeds collected balance":
    "Số tiền hoàn vượt quá số tiền đã thu.",
  "Only admins or distributors can approve return requests":
    "Chỉ admin hoặc NPP mới có thể duyệt yêu cầu trả hàng.",
  "Only return-requested orders can be returned":
    "Chỉ đơn đang yêu cầu trả hàng mới có thể xác nhận trả.",
  "Distributor can only approve returns for their own store orders":
    "NPP chỉ được duyệt trả hàng cho đơn thuộc NPP mình.",
  "You can only request return for your own orders":
    "Bạn chỉ có thể yêu cầu trả hàng cho đơn của mình.",
  "Distributor can only return their own store orders":
    "NPP chỉ được trả hàng cho đơn thuộc NPP mình.",
  "Only delivered orders can request return":
    "Chỉ đơn đã giao mới có thể yêu cầu trả hàng.",
  "You can only cancel your own orders": "Bạn chỉ có thể hủy đơn của mình.",
  "You cannot cancel this order": "Bạn không có quyền hủy đơn này.",
  "Only pending orders can be cancelled":
    "Chỉ đơn đang chờ xử lý mới có thể hủy.",
  "Distributor warehouse must belong to a distributor":
    "Kho NPP phải được gắn với một nhà phân phối.",
  "Warehouse code already exists": "Mã kho đã tồn tại.",
  "Distributor already has a warehouse": "Nhà phân phối này đã có kho.",
  "Seller not found": "Không tìm thấy DSR.",
  "You cannot access this seller warehouse":
    "Bạn không có quyền truy cập kho DSR này.",
  "Seller is not managed by this distributor":
    "DSR không thuộc nhà phân phối này.",
  "Warehouse not found": "Không tìm thấy kho.",
  "Product not found": "Không tìm thấy sản phẩm.",
  "Warehouse stock is already initialized":
    "Sản phẩm này đã được khởi tạo trong kho.",
  "Distributor must have an active warehouse before receiving stock":
    "Nhà phân phối chưa có kho đang hoạt động. Vui lòng tạo hoặc kích hoạt kho NPP trước khi nhập hàng.",
  "Cannot update an inactive warehouse": "Không thể cập nhật kho đang tạm ngưng.",
  "Warehouse stock not found": "Không tìm thấy tồn kho.",
  "Distributor warehouse not found": "Không tìm thấy kho NPP.",
  "Seller must belong to a distributor with an active warehouse":
    "DSR phải thuộc NPP có kho đang hoạt động.",
  "Not enough stock in distributor warehouse":
    "Tồn kho NPP không đủ để xác nhận đơn này.",
  "Distributor warehouse stock not found": "Không tìm thấy tồn kho NPP.",
  "You cannot access this warehouse": "Bạn không có quyền truy cập kho này.",
  Unauthorized: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "Invalid credentials": "Email hoặc mật khẩu không đúng.",
  "Account is inactive": "Tài khoản đang bị khóa.",
  "Account is temporarily locked":
    "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.",
  "Invalid refresh token": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Current password is incorrect": "Mật khẩu hiện tại không đúng.",
  "Invalid or expired reset token":
    "Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
  "Seller must be assigned to a distributor":
    "DSR phải được gán cho một nhà phân phối.",
  "Distributor manager is invalid": "Nhà phân phối quản lý không hợp lệ.",
  "User not found": "Không tìm thấy nhân viên.",
  "You can only manage DSR in your team":
    "Bạn chỉ có thể quản lý DSR trong đội của mình.",
  "User code already exists": "Mã nhân viên đã tồn tại.",
  "Email already exists": "Email đã tồn tại.",
  "Category code is required": "Vui lòng nhập mã danh mục.",
  "Category name is required": "Vui lòng nhập tên danh mục.",
  "Category already exists": "Danh mục đã tồn tại.",
  "Product code is required": "Vui lòng nhập mã sản phẩm.",
  "Category is required": "Vui lòng chọn danh mục.",
  "Invalid category id": "Danh mục không hợp lệ.",
  "Product code already exists": "Mã sản phẩm đã tồn tại.",
  "Category not found": "Không tìm thấy danh mục.",
  "Customer must be assigned to a seller": "Khách hàng phải được gán cho DSR.",
  "You can only view your own customers":
    "Bạn chỉ có thể xem khách hàng của mình.",
  "You can only update your own customers":
    "Bạn chỉ có thể cập nhật khách hàng của mình.",
  "Seller cannot reassign customers": "DSR không được đổi người phụ trách khách.",
  "Reject reason is required": "Vui lòng nhập lý do từ chối.",
  "Leave request not found": "Không tìm thấy đơn nghỉ phép.",
  "Start date must be before end date":
    "Ngày bắt đầu phải trước ngày kết thúc.",
  "You can only view your own leave requests":
    "Bạn chỉ có thể xem đơn nghỉ phép của mình.",
  "You can only view leave requests from your sellers":
    "Bạn chỉ có thể xem đơn nghỉ phép của DSR trong đội.",
  "Route not found": "Không tìm thấy tuyến.",
  "Route customers are required": "Vui lòng thêm khách hàng vào tuyến.",
  "Route contains duplicated customers": "Tuyến có khách hàng bị trùng.",
  "You can only view your own routes": "Bạn chỉ có thể xem tuyến của mình.",
  "Route is not available for check-in":
    "Tuyến không khả dụng để check-in.",
  "Customer not found in route": "Không tìm thấy khách hàng trong tuyến.",
  "Route has been cancelled": "Tuyến đã bị hủy.",
};

const prefixMessages: Array<[string, string]> = [
  ["Product not found:", "Không tìm thấy sản phẩm:"],
  ["Customer not found:", "Không tìm thấy khách hàng:"],
  [
    "Not enough distributor stock for product",
    "Tồn kho NPP không đủ cho sản phẩm",
  ],
  ["Not enough stock for product", "Kho tổng không đủ hàng cho sản phẩm"],
  ["Missing pricing for product", "Thiếu giá vốn cho sản phẩm"],
  [
    "Product is not stocked in distributor warehouse",
    "Sản phẩm chưa có trong tồn kho NPP",
  ],
];

export function translateApiMessage(raw?: string) {
  if (!raw) return undefined;

  const exact = exactMessages[raw];
  if (exact) return exact;

  for (const [source, target] of prefixMessages) {
    if (raw.includes(source)) {
      return raw.replace(source, target);
    }
  }

  return raw;
}

export function orderApiMessage(error: unknown, fallback: string) {
  const payload = error as { data?: { message?: string | string[] } };
  const detail = payload.data?.message;
  const raw = Array.isArray(detail) ? detail[0] : detail;

  return translateApiMessage(raw) || fallback;
}
