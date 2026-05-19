# DMS Backend

Backend NestJS cho hệ thống quản lý phân phối DMS. API phục vụ frontend admin/seller, xác thực JWT, phân quyền, realtime Socket.IO, upload hình ảnh và tài liệu Swagger.

## Chức năng chính

- Auth: đăng nhập, lấy thông tin cá nhân, đổi mật khẩu, quên/đặt lại mật khẩu.
- Users: quản lý tài khoản admin/seller.
- Customers: tạo, duyệt, từ chối và quản lý khách hàng.
- Products/Categories: quản lý danh mục và sản phẩm.
- Inventory: nhập, xuất, điều chỉnh tồn kho và cảnh báo tồn thấp.
- Orders: tạo, duyệt, giao hàng, trả hàng và hủy đơn.
- Routes/Visits: lập tuyến bán hàng và ghi nhận ghé thăm khách hàng.
- Leaves: seller gửi nghỉ phép, admin duyệt hoặc từ chối.
- Notifications: thông báo realtime.
- Reports/KPI: báo cáo vận hành và mục tiêu kinh doanh.
- Audit logs: ghi nhận thao tác quan trọng.

## Biến môi trường

Tạo `.env` từ `.env.example` và dùng MongoDB Atlas:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority&appName=<app-name>
MONGODB_SERVER_SELECTION_TIMEOUT_MS=60000
MONGODB_RETRY_ATTEMPTS=3

JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Chạy development

```bash
npm install
npm run start:dev
```

Endpoints:

```text
API:     http://localhost:5000
Swagger: http://localhost:5000/api-docs
Health:  http://localhost:5000/health
```

## Seed dữ liệu demo

```bash
npm run seed:demo
```

Tài khoản demo:

```text
Admin:  admin@dms.local  / Admin@123456
Seller: seller@dms.local / Seller@123456
```

## Docker với MongoDB Atlas

Từ thư mục gốc `DMS_Project`:

```bash
copy .env.docker.example .env
```

Cập nhật `MONGODB_URI`, `JWT_SECRET` và Cloudinary trong `.env`, sau đó chạy:

```bash
docker compose up --build
```

Seed demo qua container backend:

```bash
docker compose exec backend npm run seed:demo
```

## Kiểm tra

```bash
npm run lint
npm run test
npm run build
```
