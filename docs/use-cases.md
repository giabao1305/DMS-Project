# Use Cases

## Actors

- Admin
- Distributor
- Seller / DSR

## Authentication

### Login

Actor: Admin, Distributor, Seller

Main flow:

1. User nhập email và password.
2. Backend xác thực tài khoản.
3. Backend trả JWT và thông tin user.
4. Frontend điều hướng theo role.

Expected result:

- Admin vào `/admin/dashboard`.
- Distributor và Seller vào `/seller/dashboard`.

### Role protection

Actor: Admin, Distributor, Seller

Rules:

- Seller không được truy cập khu vực `/admin`.
- Admin không được truy cập khu vực `/seller`.
- Distributor không được truy cập khu vực `/admin`.
- Distributor chỉ xem dữ liệu thuộc các DSR có `manager = distributorId`.
- Backend trả `403` khi role không hợp lệ.
- Frontend hiển thị trang `/forbidden`.

## User Management

Actor: Admin

Use cases:

- Tạo nhân viên.
- Tạo nhà phân phối.
- Tạo DSR/seller và gán `manager` là nhà phân phối phụ trách.
- Cập nhật thông tin nhân viên.
- Xem chi tiết nhân viên.
- Kích hoạt hoặc vô hiệu hóa tài khoản.

## Customer Management

Actor: Admin, Distributor, Seller

Distributor:

- Xem khách hàng của các DSR cấp dưới.
- Tạo khách hàng mới và chọn DSR phụ trách.
- Cập nhật khách hàng trong phạm vi đội mình.

Seller:

- Tạo khách hàng mới.
- Xem khách hàng được phân công.
- Cập nhật khách hàng trong phạm vi cho phép.

Admin:

- Xem tất cả khách hàng.
- Duyệt khách hàng mới.
- Từ chối khách hàng kèm lý do.
- Chỉnh sửa hồ sơ khách hàng.

## Product and Category Management

Actor: Admin

Use cases:

- Tạo danh mục sản phẩm.
- Tạo sản phẩm.
- Cập nhật sản phẩm.
- Xem chi tiết sản phẩm.
- Ẩn hoặc xóa mềm sản phẩm.

## Inventory Management

Actor: Admin

Use cases:

- Nhập kho.
- Xuất kho.
- Điều chỉnh tồn kho.
- Xem lịch sử giao dịch kho.
- Xem cảnh báo sản phẩm dưới tồn tối thiểu.

Business rules:

- Duyệt đơn hàng làm giảm tồn kho.
- Duyệt trả hàng làm tăng tồn kho.
- Mọi biến động kho cần có inventory transaction.

## Order Management

Actor: Admin, Distributor, Seller

Distributor:

- Tạo đơn hàng cho khách hàng thuộc DSR cấp dưới.
- Theo dõi trạng thái đơn hàng của đội DSR.
- Hủy hoặc cập nhật đơn pending trong phạm vi đội mình.

Seller:

- Tạo đơn hàng.
- Theo dõi trạng thái đơn hàng.
- Yêu cầu trả hàng khi đơn đã giao.

Admin:

- Xem tất cả đơn hàng.
- Duyệt đơn hàng.
- Đánh dấu giao hàng.
- Duyệt trả hàng.
- Hủy hoặc cập nhật đơn theo nghiệp vụ.

## Route Planning

Actor: Admin, Distributor, Seller

Admin:

- Tạo tuyến bán hàng.
- Gán seller.
- Chọn danh sách khách hàng theo thứ tự ghé thăm.
- Tạo tuyến lặp theo tuần, tuần chẵn hoặc tuần lẻ trong một khoảng thời gian.
- Điều chỉnh từng tuyến đã sinh nếu lịch thực tế thay đổi.
- Cập nhật trạng thái tuyến.

Seller:

- Xem tuyến được phân công.
- Theo dõi danh sách điểm bán cần ghé.
- Check-in/check-out theo từng điểm bán trong tuyến.

Distributor:

- Xem tuyến của các DSR cấp dưới.
- Theo dõi tiến độ ghé khách của đội DSR.
- Không trực tiếp check-in/check-out.

## Visit Tracking

Actor: Seller, Distributor, Admin

Seller:

- Check-in tại khách hàng.
- Check-out sau khi hoàn tất ghé thăm.
- Ghi chú kết quả ghé thăm.

Distributor:

- Xem lịch sử ghé thăm của các DSR cấp dưới.
- Kiểm tra GPS distance và trạng thái check-in/check-out của đội.

Admin:

- Xem lịch sử ghé thăm.
- Kiểm tra GPS distance và accuracy.
- Theo dõi trạng thái check-in/check-out.

## Leave Management

Actor: Seller, Distributor, Admin

Seller:

- Gửi yêu cầu nghỉ phép.
- Xem trạng thái nghỉ phép.

Distributor:

- Xem lịch nghỉ của các DSR cấp dưới.
- Không trực tiếp tạo đơn nghỉ phép thay DSR.

Admin:

- Xem danh sách yêu cầu.
- Duyệt yêu cầu.
- Từ chối yêu cầu kèm ghi chú.

## Notifications

Actor: Admin, Distributor, Seller

Use cases:

- Nhận thông báo realtime.
- Xem danh sách thông báo.
- Đánh dấu đã đọc.
- Điều hướng tới chi tiết nghiệp vụ liên quan.

## Reporting and KPI

Actor: Admin, Distributor, Seller

Admin:

- Xem báo cáo vận hành.
- Tạo và cập nhật KPI.
- Theo dõi hiệu suất seller.

Seller:

- Xem KPI cá nhân.
- Theo dõi tiến độ mục tiêu.

Distributor:

- Xem KPI của các DSR cấp dưới.
- Theo dõi hiệu suất đội bán hàng.

## Audit Logs

Actor: Admin

Use cases:

- Xem lịch sử thao tác quan trọng.
- Lọc audit logs theo module, action hoặc người thực hiện.
