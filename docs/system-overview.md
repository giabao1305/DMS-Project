# System Overview

DMS (Distribution Management System) là hệ thống quản lý phân phối hỗ trợ doanh nghiệp theo dõi dữ liệu bán hàng, nhân viên, khách hàng, sản phẩm, tồn kho và hoạt động ngoài thị trường.

## Mục tiêu

- Tập trung dữ liệu vận hành phân phối vào một hệ thống.
- Hỗ trợ admin quản trị dữ liệu, phê duyệt nghiệp vụ và theo dõi báo cáo.
- Hỗ trợ seller làm việc hằng ngày với khách hàng, đơn hàng, tuyến bán hàng và ghé thăm.
- Cung cấp realtime notification để giảm độ trễ khi có thay đổi quan trọng.
- Ghi nhận audit logs cho các thao tác nhạy cảm.

## Vai trò

### Admin

- Quản lý nhân viên.
- Quản lý khách hàng và duyệt khách hàng mới.
- Quản lý danh mục, sản phẩm, khuyến mãi.
- Quản lý tồn kho, nhập kho, xuất kho, điều chỉnh kho và cảnh báo tồn thấp.
- Quản lý đơn hàng, duyệt đơn, giao hàng, trả hàng.
- Lập kế hoạch tuyến bán hàng thủ công hoặc lặp theo tuần/tuần chẵn/tuần lẻ.
- Theo dõi lượt ghé thăm khách hàng.
- Duyệt hoặc từ chối yêu cầu nghỉ phép.
- Xem dashboard, báo cáo, KPI, thông báo và audit logs.

### Seller

- Xem dashboard cá nhân.
- Quản lý khách hàng phụ trách.
- Tạo khách hàng mới.
- Tạo và theo dõi đơn hàng.
- Xem tuyến bán hàng được phân công.
- Check-in/check-out khi ghé thăm khách hàng.
- Gửi yêu cầu nghỉ phép.
- Xem KPI và thông báo cá nhân.

## Module Chính

- Authentication and authorization.
- User management.
- Customer management.
- Product and category management.
- Inventory management.
- Order management.
- Promotion management.
- Route planning.
- Visit tracking.
- Leave management.
- Notification center.
- Dashboard and reporting.
- KPI management.
- Audit logging.

## Trạng thái hiện tại

Hệ thống đã có:

- Frontend Next.js cho admin và seller.
- Backend NestJS API.
- MongoDB Atlas.
- JWT authentication.
- Role-based access control.
- Socket.IO realtime notification.
- Swagger API documentation.
- Health endpoint.
- Demo seed data.
- Backend unit test và e2e test cho các workflow quan trọng.
- Dockerfile và Docker Compose cấu hình theo MongoDB Atlas.
