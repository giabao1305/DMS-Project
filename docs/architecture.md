# Architecture

## Tổng quan

```text
Browser
  |
  | HTTP + WebSocket
  v
Next.js Frontend
  |
  | REST API with JWT
  v
NestJS Backend
  |
  | Mongoose
  v
MongoDB Atlas

NestJS Backend
  |
  | Socket.IO events
  v
Frontend realtime refetch / highlight / notifications

NestJS Backend
  |
  | Cloudinary SDK
  v
Cloudinary image storage
```

## Frontend

Frontend nằm trong `dms-frontend`.

Công nghệ:

- Next.js App Router.
- React.
- Ant Design.
- Redux Toolkit Query.
- Socket.IO client.

Trách nhiệm:

- Hiển thị giao diện admin và seller.
- Gửi request API tới backend.
- Lưu phiên đăng nhập phía client.
- Gắn JWT vào request API.
- Nhận realtime events từ Socket.IO.
- Điều hướng theo role.
- Hiển thị trạng thái 403, 404 và lỗi hệ thống.

## Backend

Backend nằm trong `dms-backend`.

Công nghệ:

- NestJS.
- Mongoose.
- Passport JWT.
- Socket.IO gateway.
- Swagger.
- Jest and Supertest.

Trách nhiệm:

- Xác thực và phân quyền.
- Quản lý nghiệp vụ DMS.
- Validate DTO.
- Kết nối MongoDB Atlas.
- Phát realtime notification.
- Ghi audit logs.
- Cung cấp Swagger API docs.
- Cung cấp health endpoint cho vận hành.

## Database

MongoDB Atlas lưu dữ liệu theo collection nghiệp vụ:

- users
- customers
- categories
- products
- orders
- inventorytransactions
- routes
- visits
- leaverequests
- notifications
- promotions
- auditlogs
- kpis

## Realtime

Socket.IO được dùng cho:

- Thông báo mới.
- Cập nhật danh sách khi có dữ liệu thay đổi.
- Highlight dòng mới/cập nhật trên một số màn quản trị.

## Security

Hiện tại hệ thống có:

- JWT access token.
- Refresh token rotation và revoke khi logout.
- Role guard cho admin/seller.
- DTO validation với whitelist và forbid non-whitelisted fields.
- Rate limit cho các endpoint auth nhạy cảm.
- Account lockout sau nhiều lần đăng nhập sai.
- Audit log cho login, refresh token, logout, lockout, đổi mật khẩu và reset mật khẩu.
- 403 page phía frontend.
- Backend e2e test cho phân quyền dashboard.

Các nâng cấp bảo mật nên làm tiếp:

- HttpOnly cookie thay vì localStorage.
- Permission matrix chi tiết theo chức năng.
- Audit log UI cho admin tra cứu.
