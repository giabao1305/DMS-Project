# DMS Frontend

Frontend web cho hệ thống quản lý phân phối DMS, xây dựng bằng Next.js, React, Redux Toolkit Query và Ant Design.

## Vai trò trên web

- Admin: quản trị nhân viên, nhà phân phối, khách hàng, sản phẩm, kho, đơn hàng, tuyến bán hàng, KPI, báo cáo, nghỉ phép và nhật ký hệ thống.
- Distributor: quản lý đội DSR, khách hàng, đơn bán ra tiệm, kho NPP, tuyến, ghé thăm, KPI, nghỉ phép và thông báo.

Seller/DSR sử dụng app mobile riêng trong `dms-react-native-web`; web seller đã được gỡ khỏi project này.

## Chức năng chính

- Đăng nhập, phân quyền admin/distributor, đổi mật khẩu, quên mật khẩu và đặt lại mật khẩu.
- Dashboard admin và dashboard distributor.
- Quản lý nhân viên, đội DSR, khách hàng, danh mục, sản phẩm.
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

## Demo

Luồng web hiện tại tập trung vào Admin và Distributor. Seller/DSR thao tác trên app mobile riêng.
