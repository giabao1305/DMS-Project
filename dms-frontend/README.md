# DMS Frontend

Frontend cho hệ thống quản lý phân phối DMS, xây dựng bằng Next.js, React, Redux Toolkit Query và Ant Design.

## Vai trò

- Admin: quản trị nhân viên, khách hàng, sản phẩm, kho, đơn hàng, tuyến bán hàng, KPI, báo cáo, nghỉ phép và nhật ký hệ thống.
- Seller: xem dashboard cá nhân, quản lý khách hàng, tạo đơn hàng, xem tuyến, ghi nhận ghé thăm và gửi yêu cầu nghỉ phép.

## Chức năng chính

- Đăng nhập, phân quyền admin/seller, đổi mật khẩu, quên mật khẩu và đặt lại mật khẩu.
- Dashboard quản trị và dashboard seller.
- Quản lý nhân viên, khách hàng, danh mục, sản phẩm.
- Quản lý đơn hàng, khuyến mãi, tồn kho và cảnh báo tồn thấp.
- Lập kế hoạch tuyến bán hàng và theo dõi ghé thăm khách hàng.
- Quản lý nghỉ phép, KPI, báo cáo, thông báo realtime và audit logs.

## Công nghệ

- Next.js 16, React 19, TypeScript.
- Ant Design 5, Ant Design Charts.
- Redux Toolkit, RTK Query, React Redux.
- Socket.IO Client.
- React Hook Form, Zod, Day.js.

## Biến môi trường

Tạo `.env.local` từ `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Chạy development

```bash
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:3000
```

## Kiểm tra

```bash
npm run lint
npm run build
```

## Docker với MongoDB Atlas

Docker Compose nằm ở thư mục gốc `DMS_Project` và dùng MongoDB Atlas qua `MONGODB_URI`.

Từ thư mục gốc:

```bash
copy .env.docker.example .env
```

Cập nhật `.env`:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-strong-secret
NEXT_PUBLIC_API_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
```

Chạy full stack:

```bash
docker compose up --build
```

Các URL:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
Swagger:  http://localhost:5000/api-docs
Health:   http://localhost:5000/health
```

Seed demo qua container backend:

```bash
docker compose exec backend npm run seed:demo
```

Tài khoản demo:

```text
Admin:  admin@dms.local  / Admin@123456
Seller: seller@dms.local / Seller@123456
```

## Luồng demo đề xuất

1. Admin đăng nhập và xem dashboard.
2. Admin tạo/sửa sản phẩm, nhập kho và kiểm tra cảnh báo tồn thấp.
3. Admin tạo tuyến bán hàng cho seller.
4. Seller đăng nhập, xem tuyến và ghi nhận ghé thăm.
5. Seller tạo khách hàng hoặc đơn hàng.
6. Admin duyệt khách hàng, duyệt đơn hàng và theo dõi thông báo realtime.
7. Seller gửi nghỉ phép, admin duyệt hoặc từ chối.
8. Admin xem báo cáo, KPI và audit logs.
