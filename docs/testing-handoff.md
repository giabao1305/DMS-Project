# Tài liệu hướng dẫn test hệ thống DMS

Cập nhật: 25/05/2026

Tài liệu này dùng cho người test hệ thống DMS. Nội dung viết theo hướng thao tác thực tế: mở trang nào, bấm nút gì, nhập dữ liệu gì, kiểm tra kết quả ra sao.

Không commit file này nếu chỉ dùng để bàn giao test tạm thời.

## 1. Thông tin hệ thống

Hệ thống gồm 3 phần:

- Backend: NestJS, deploy trên Render.
- Web dashboard: Next.js, deploy trên Vercel/custom domain.
- App mobile/web: Expo React Native Web, dùng cho seller/DSR.

URL đang dùng:

- Web: `https://tgbaodev.id.vn`
- Web www: `https://www.tgbaodev.id.vn`
- Backend: `https://dms-backend-m5v4.onrender.com`
- Health check: `https://dms-backend-m5v4.onrender.com/health`
- Swagger API: `https://dms-backend-m5v4.onrender.com/api-docs`

## 2. Kiểm tra môi trường trước khi test

### 2.1. Backend Render

Mở:

```text
https://dms-backend-m5v4.onrender.com/health
```

Kết quả đúng:

- Có JSON trả về.
- `status` là `ok`.
- `environment` là `production`.
- `database.status` là `connected`.

Nếu bị chậm lần đầu: Render free tier có thể đang sleep. Đợi 30-60 giây rồi refresh lại.

### 2.2. CORS trên Render

Trong Render Environment Variables, kiểm tra:

```env
CORS_ORIGIN=https://tgbaodev.id.vn,https://www.tgbaodev.id.vn,https://dms-tttn-deploy.vercel.app,http://localhost:3000,http://localhost:8082
SOCKET_CORS_ORIGIN=https://tgbaodev.id.vn,https://www.tgbaodev.id.vn,https://dms-tttn-deploy.vercel.app,http://localhost:3000,http://localhost:8082
```

Sau khi sửa env phải bấm Save Changes và Redeploy backend.

### 2.3. Frontend Vercel

Biến môi trường frontend cần có:

```env
NEXT_PUBLIC_API_URL=https://dms-backend-m5v4.onrender.com
```

Khi mở DevTools Network, frontend deploy không được gọi:

```text
http://localhost:5000
```

Nếu còn gọi localhost nghĩa là sai env hoặc chưa redeploy frontend.

## 3. Tài khoản test

Nếu database đã seed demo:

| Vai trò       | Email                   | Mật khẩu             |
| ------------- | ----------------------- | -------------------- |
| Admin         | `admin@dms.local`       | `Admin@123456`       |
| Nhà phân phối | `distributor@dms.local` | `Distributor@123456` |
| Seller/DSR    | `seller@dms.local`      | `Seller@123456`      |

Nếu production không có các tài khoản này, dùng tài khoản thật do người quản trị cung cấp.

## 4. Cách test đăng nhập

### 4.1. Test giao diện login

1. Mở:

```text
https://tgbaodev.id.vn/auth/login
```

2. Refresh trang 3-5 lần.

Kết quả đúng:

- Không thấy chữ thô trước khi CSS hiện.
- Giao diện login hiện đủ nền, khung, input, nút.
- Animation nhẹ, không giật mạnh.
- Ô email có placeholder: `Nhập email tài khoản`.

### 4.2. Test đăng nhập admin

1. Tại trang login, nhập:

```text
Email: admin@dms.local
Mật khẩu: Admin@123456
```

2. Bấm nút `Tiếp tục`.

Kết quả đúng:

- Đăng nhập thành công.
- Trang chuyển sang `/admin/dashboard`.
- Không có lỗi CORS trong Console.
- Không có request gọi `localhost:5000`.

### 4.3. Test đăng nhập distributor

1. Đăng xuất tài khoản hiện tại.
2. Nhập:

```text
Email: distributor@dms.local
Mật khẩu: Distributor@123456
```

3. Bấm `Tiếp tục`.

Kết quả đúng:

- Trang chuyển sang `/distributor/dashboard`.
- Không vào được các trang admin như `/admin/users`.

### 4.4. Test đăng nhập seller

1. Đăng xuất tài khoản hiện tại.
2. Nhập:

```text
Email: seller@dms.local
Mật khẩu: Seller@123456
```

3. Bấm `Tiếp tục`.

Kết quả đúng:

- Trang chuyển sang `/seller/dashboard`.
- Không vào được `/admin/dashboard` hoặc `/distributor/team`.

### 4.5. Test nhập sai mật khẩu

1. Nhập đúng email nhưng sai mật khẩu.
2. Bấm `Tiếp tục`.

Kết quả đúng:

- Có thông báo lỗi đăng nhập.
- Không chuyển trang.
- Tài khoản không bị đăng nhập nhầm.

## 5. Luồng Admin chuẩn bị dữ liệu để test

Nên test luồng admin trước, vì seller và distributor cần dữ liệu do admin tạo.

### 5.1. Tạo nhân viên / user

Mục tiêu: tạo tài khoản để test phân quyền.

1. Đăng nhập admin.
2. Vào menu `Users`.
3. Bấm nút tạo mới, thường là `Tạo mới`, `Thêm`, hoặc biểu tượng dấu `+`.
4. Nhập thông tin nhân viên:

```text
Họ tên: Nguyễn Văn Test
Email: seller.test@example.com
Số điện thoại: 0900000001
Vai trò: Seller hoặc DSR
Mật khẩu: Seller@123456
Trạng thái: Hoạt động
```

5. Nếu có trường nhà phân phối/quản lý, chọn distributor phù hợp.
6. Bấm `Lưu` hoặc `Tạo`.

Kết quả đúng:

- User mới xuất hiện trong danh sách.
- Có thể tìm user bằng email hoặc tên.
- User đăng nhập được nếu hệ thống cho phép dùng tài khoản mới.

Test sửa user:

1. Trong danh sách `Users`, bấm vào user vừa tạo hoặc bấm nút `Sửa`.
2. Đổi số điện thoại hoặc trạng thái.
3. Bấm `Lưu`.
4. Kiểm tra dữ liệu cập nhật đúng.

Test khóa/mở user:

1. Chọn user.
2. Đổi trạng thái `Hoạt động` / `Không hoạt động`.
3. Thử đăng nhập bằng user đó.

Kết quả đúng:

- User không hoạt động không đăng nhập được hoặc bị chặn theo logic hệ thống.

### 5.2. Tạo danh mục sản phẩm

1. Đăng nhập admin.
2. Vào `Categories`.
3. Bấm `Tạo mới`.
4. Nhập:

```text
Tên danh mục: Nước giải khát test
Mô tả: Danh mục dùng để test
Trạng thái: Hoạt động
```

5. Bấm `Lưu`.

Kết quả đúng:

- Danh mục mới xuất hiện trong danh sách.
- Có thể sửa/xem chi tiết danh mục.

### 5.3. Tạo sản phẩm

1. Vào `Products`.
2. Bấm `Tạo mới`.
3. Nhập:

```text
Tên sản phẩm: Sản phẩm test 01
Mã sản phẩm: SPTEST01
Danh mục: Nước giải khát test
Giá: 10000
Đơn vị: chai hoặc thùng
Mô tả: Sản phẩm dùng để test đơn hàng
```

4. Bấm `Lưu`.

Kết quả đúng:

- Sản phẩm xuất hiện trong danh sách.
- Có thể mở chi tiết sản phẩm.
- Có thể sửa thông tin sản phẩm.

### 5.4. Nhập tồn kho sản phẩm

1. Vào `Inventory`.
2. Bấm `Tạo giao dịch`, `Nhập kho`, hoặc nút tạo mới.
3. Chọn sản phẩm `Sản phẩm test 01`.
4. Nhập:

```text
Loại giao dịch: Nhập kho
Số lượng: 100
Ghi chú: Nhập kho để test
```

5. Bấm `Lưu`.

Kết quả đúng:

- Tồn kho sản phẩm tăng thêm 100.
- Giao dịch xuất hiện trong lịch sử tồn kho.

### 5.5. Tạo khách hàng

1. Vào `Customers`.
2. Bấm `Tạo mới`.
3. Nhập:

```text
Tên khách hàng: Khách hàng test 01
Số điện thoại: 0911111111
Địa chỉ: 123 Đường Test
Khu vực: Quận/Huyện test
Trạng thái: Đã duyệt hoặc Hoạt động
Seller phụ trách: chọn seller test nếu có
```

phần tọa độ lưu ý: mở gg map lấy tọa độ lat lon chỗ anh em đang ở, dùng cái đó cho tất cả khách để test checkin checkout.

4. Bấm `Lưu`.

Kết quả đúng:

- Khách hàng xuất hiện trong danh sách.
- Seller được gán có thể nhìn thấy khách hàng.

### 5.6. Tạo tuyến bán hàng

1. Vào `Routes`.
2. Bấm `Tạo mới`.
3. Nhập:

```text
Tên tuyến: Tuyến test 01
Seller/DSR: chọn seller test
Ngày/Khu vực: chọn theo form
Khách hàng: chọn Khách hàng test 01
Trạng thái: Hoạt động
```

4. Bấm `Lưu`.

Kết quả đúng:

- Tuyến xuất hiện trong danh sách admin.
- Seller được gán có thể thấy tuyến trong trang `Routes`.

### 5.7. Tạo KPI cho seller

1. Vào `KPIs`.
2. Bấm `Tạo mới`.
3. Nhập:

```text
Seller: seller test
Tháng/Năm: tháng hiện tại
Chỉ tiêu đơn hàng: 20
Chỉ tiêu ghé thăm: 30
Chỉ tiêu doanh thu: 10000000
```

4. Bấm `Lưu`.

Kết quả đúng:

- KPI xuất hiện trong danh sách.
- Seller thấy KPI của mình ở trang `KPIs`.

## 6. Luồng Seller tạo khách hàng và Admin duyệt

Mục tiêu: kiểm tra khách hàng do seller đề xuất.

### 6.1. Seller tạo khách hàng

1. Đăng nhập seller.
2. Vào `Customers`.
3. Bấm `Tạo mới`.
4. Nhập:

```text
Tên khách hàng: Khách seller tạo 01
Số điện thoại: 0922222222
Địa chỉ: 456 Đường Seller Test
Ghi chú: Khách hàng do seller tạo để test duyệt
```

5. Bấm `Lưu`.

Kết quả đúng:

- Khách hàng được tạo.
- Trạng thái là `Chờ duyệt`, `Pending`, hoặc trạng thái tương đương.

### 6.2. Admin duyệt khách hàng

1. Đăng xuất seller.
2. Đăng nhập admin.
3. Vào `Customers`.
4. Tìm `Khách seller tạo 01`.
5. Mở chi tiết hoặc bấm thao tác duyệt.
6. Bấm `Duyệt`.

Kết quả đúng:

- Trạng thái khách hàng chuyển sang `Đã duyệt` hoặc `Hoạt động`.
- Seller thấy khách hàng trong danh sách của mình.
- Nếu có thông báo, seller nhận notification.

### 6.3. Admin từ chối khách hàng

1. Seller tạo thêm khách hàng khác.
2. Admin mở khách hàng đó.
3. Bấm `Từ chối`.

Kết quả đúng:

- Trạng thái chuyển sang `Từ chối`.
- Seller thấy trạng thái bị từ chối hoặc nhận thông báo.

## 7. Luồng Seller tạo đơn hàng và Admin xử lý

Mục tiêu: kiểm tra tạo đơn, chuyển trạng thái và tồn kho.

### 7.1. Seller tạo đơn hàng

1. Đăng nhập seller.
2. Vào `Orders`.
3. Bấm `Tạo mới`.
4. Chọn khách hàng đã được duyệt.
5. Thêm sản phẩm:

```text
Sản phẩm: Sản phẩm test 01
Số lượng: 2
```

6. Kiểm tra tổng tiền.
7. Bấm `Lưu` hoặc `Tạo đơn`.

Kết quả đúng:

- Đơn hàng xuất hiện trong danh sách.
- Trạng thái ban đầu đúng theo hệ thống, ví dụ `Chờ xác nhận`.
- Chi tiết đơn hiển thị đúng khách hàng, sản phẩm, số lượng, tổng tiền.

### 7.2. Admin duyệt/xác nhận đơn hàng

1. Đăng nhập admin.
2. Vào `Orders`.
3. Tìm đơn seller vừa tạo.
4. Mở chi tiết đơn.
5. Bấm thao tác chuyển trạng thái, ví dụ:
   - `Xác nhận`
   - `Duyệt`
   - `Đang giao`
   - `Hoàn tất`

6. Sau mỗi lần chuyển trạng thái, kiểm tra trạng thái hiển thị đúng.

Kết quả đúng:

- Đơn chuyển trạng thái thành công.
- Không lỗi API.
- Seller nhìn thấy trạng thái mới khi reload hoặc realtime.

### 7.3. Kiểm tra tồn kho sau khi duyệt đơn

1. Trước khi duyệt đơn, ghi lại tồn kho sản phẩm.
2. Sau khi admin duyệt/xác nhận đơn theo trạng thái có trừ kho, vào `Products` hoặc `Inventory`.
3. Kiểm tra tồn kho sản phẩm.

Kết quả đúng:

- Nếu đơn 2 sản phẩm được duyệt, tồn kho giảm đúng 2.
- Lịch sử inventory có giao dịch xuất kho nếu hệ thống có ghi nhận.

### 7.4. Test trả hàng hoặc hủy đơn

1. Chọn một đơn đã duyệt/giao.
2. Nếu hệ thống có trạng thái `Trả hàng` hoặc `Hủy`, bấm chuyển trạng thái đó.
3. Kiểm tra tồn kho.

Kết quả đúng:

- Nếu nghiệp vụ yêu cầu hoàn kho, tồn kho tăng lại đúng số lượng.
- Trạng thái đơn hiển thị đúng.

## 8. Luồng tuyến bán hàng và ghé thăm

Mục tiêu: kiểm tra seller có tuyến và tạo lượt ghé thăm.

### 8.1. Seller xem tuyến

1. Đăng nhập seller.
2. Vào `Routes`.
3. Mở tuyến `Tuyến test 01`.

Kết quả đúng:

- Thấy danh sách khách hàng trong tuyến.
- Thông tin tuyến đúng seller đang đăng nhập.

### 8.2. Seller tạo lượt ghé thăm

1. Vào `Visits`.
2. Bấm `Tạo mới`.
3. Nhập:

```text
Khách hàng: Khách hàng test 01
Kết quả ghé thăm: Đã ghé thăm
Ghi chú: Test lượt ghé thăm
Vị trí/hình ảnh: nhập hoặc bỏ qua tùy form
```

4. Bấm `Lưu`.

Kết quả đúng:

- Visit xuất hiện trong danh sách seller.
- Chi tiết visit hiển thị đúng khách hàng và ghi chú.

### 8.3. Distributor/Admin xem lượt ghé thăm

1. Đăng nhập distributor.
2. Vào `Visits`.
3. Kiểm tra thấy lượt ghé thăm của seller thuộc đội.
4. Đăng nhập admin.
5. Vào `Visits`.
6. Kiểm tra admin thấy lượt ghé thăm.

Kết quả đúng:

- Distributor chỉ thấy dữ liệu đội mình.
- Admin thấy toàn bộ dữ liệu.

## 9. Luồng nghỉ phép

Mục tiêu: kiểm tra seller gửi nghỉ phép và admin duyệt/từ chối.

### 9.1. Seller tạo đơn nghỉ phép

1. Đăng nhập seller.
2. Vào `Leaves`.
3. Bấm `Tạo mới`.
4. Nhập:

```text
Ngày bắt đầu: chọn ngày hôm nay hoặc ngày tương lai
Ngày kết thúc: chọn sau ngày bắt đầu
Lý do: Test xin nghỉ phép
```

5. Bấm `Lưu`.

Kết quả đúng:

- Đơn nghỉ phép xuất hiện trong danh sách seller.
- Trạng thái là `Chờ duyệt`.

### 9.2. Admin duyệt nghỉ phép

1. Đăng nhập admin.
2. Vào `Leaves`.
3. Tìm đơn nghỉ phép vừa tạo.
4. Mở chi tiết.
5. Bấm `Duyệt`.

Kết quả đúng:

- Trạng thái chuyển sang `Đã duyệt`.
- Seller thấy trạng thái mới.
- Seller nhận thông báo nếu realtime/notification hoạt động.

### 9.3. Admin từ chối nghỉ phép

1. Seller tạo thêm một đơn nghỉ phép khác.
2. Admin mở đơn đó.
3. Bấm `Từ chối`.
4. Nhập lý do từ chối nếu có.

Kết quả đúng:

- Trạng thái chuyển sang `Từ chối`.
- Seller thấy trạng thái và lý do nếu hệ thống có hiển thị.

## 10. Luồng Distributor giám sát đội DSR

Mục tiêu: kiểm tra nhà phân phối xem được dữ liệu đội của mình.

1. Đăng nhập distributor.
2. Vào `Dashboard`.
3. Kiểm tra các chỉ số tổng quan.
4. Vào `Team`.
5. Kiểm tra danh sách seller/DSR thuộc distributor.
6. Vào `Customers`.
7. Kiểm tra khách hàng của đội.
8. Vào `Orders`.
9. Kiểm tra đơn hàng của đội.
10. Vào `Routes`.
11. Kiểm tra tuyến của đội.
12. Vào `Visits`.
13. Kiểm tra lượt ghé thăm của đội.
14. Vào `KPIs`.
15. Kiểm tra KPI của seller thuộc đội.

Kết quả đúng:

- Distributor không thấy trang quản trị admin.
- Distributor không thao tác vượt quyền.
- Bảng có tìm kiếm/lọc/phân trang hoạt động ổn.

## 11. Luồng thông báo realtime

Mục tiêu: kiểm tra Socket.IO và notification.

1. Mở hai trình duyệt hoặc hai cửa sổ ẩn danh.
2. Cửa sổ 1 đăng nhập admin.
3. Cửa sổ 2 đăng nhập seller.
4. Seller tạo khách hàng hoặc tạo đơn nghỉ phép.
5. Admin duyệt hoặc từ chối.
6. Quan sát cửa sổ seller.

Kết quả đúng:

- Badge thông báo tăng.
- Danh sách thông báo có item mới.
- Nếu đang ở trang liên quan, dữ liệu có thể tự cập nhật hoặc có highlight realtime.

Nếu không realtime:

1. Reload trang seller.
2. Nếu thông báo xuất hiện sau reload, API đúng nhưng socket có thể lỗi.
3. Kiểm tra `SOCKET_CORS_ORIGIN` trên Render.
4. Redeploy backend.

## 12. Test giao diện và hiệu năng

### 12.1. Login

1. Mở `/auth/login`.
2. Hard refresh nhiều lần.
3. Nhập email và mật khẩu.

Kết quả đúng:

- Không thấy text thô trước CSS.
- Input không bị đổi nền xanh sau khi nhập.
- Animation nhẹ, không giật mạnh.
- Nút login hover/click bình thường.

### 12.2. Dashboard và bảng dữ liệu

Test với từng vai trò:

1. Đăng nhập.
2. Vào dashboard.
3. Cuộn trang nhanh.
4. Hover các card.
5. Vào các trang có bảng lớn như Orders, Customers, Products, Visits.
6. Cuộn bảng, đổi trang, tìm kiếm, lọc.

Kết quả đúng:

- Không giật mạnh.
- Không có shadow hover quá nặng.
- Không mất layout.
- Không có lỗi console.

### 12.3. Màn hình độ phân giải cao

Nếu máy dùng màn `2560x1600`, `240Hz`:

1. Test ở 240Hz.
2. Nếu thấy giật, đổi Windows refresh rate xuống 120Hz hoặc 60Hz.
3. Test lại cùng thao tác.

Kết quả đánh giá:

- Nếu 60/120Hz mượt hơn nhiều, nguyên nhân có thể do animation/shadow/render trên màn refresh cao.
- Nếu vẫn thấy text thô hoặc layout nhảy, nguyên nhân là CSS/hydration/cache, không phải màn hình.

## 13. Test API bằng Swagger

Mở:

```text
https://dms-backend-m5v4.onrender.com/api-docs
```

Các bước test:

1. Gọi `POST /auth/login`.
2. Copy access token.
3. Bấm Authorize trong Swagger.
4. Nhập:

```text
Bearer <access_token>
```

5. Gọi `/auth/me`.
6. Gọi các API danh sách:
   - users
   - products
   - customers
   - orders
   - routes
   - visits
   - leaves
   - notifications

Kết quả đúng:

- API yêu cầu token phải trả 401 nếu không có token.
- API đúng quyền trả dữ liệu.
- API sai quyền trả 403 hoặc bị chặn.

## 14. Test app mobile / Expo web

Chạy local:

```powershell
cd E:\TTTN\DMS_Project\dms-react-native-web
npm.cmd run web
```

Nếu test với backend deploy, tạo hoặc sửa `.env.local`:

```env
EXPO_PUBLIC_API_URL=https://dms-backend-m5v4.onrender.com
```

Các màn cần test:

1. Login
2. Dashboard
3. Customers
4. Orders
5. Routes
6. Visits
7. KPIs
8. Leaves
9. Notifications
10. Profile

Kết quả đúng:

- Tab bar không bị tràn.
- Nội dung không bị che bởi safe area.
- API gọi đúng backend deploy nếu đang test production/staging.
- Đăng nhập seller hoạt động.

## 15. Các lỗi cần ghi lại khi test

Khi gặp lỗi, ghi theo mẫu:

```text
Vai trò:
Trang:
Thao tác:
Dữ liệu nhập:
Kết quả thực tế:
Kết quả mong đợi:
Console error:
Network request lỗi:
Ảnh/video minh chứng:
```

Ví dụ:

```text
Vai trò: Seller
Trang: /seller/orders/create
Thao tác: Tạo đơn với sản phẩm SPTEST01 số lượng 2
Dữ liệu nhập: Khách hàng test 01, SPTEST01, số lượng 2
Kết quả thực tế: Bấm lưu không có phản hồi
Kết quả mong đợi: Đơn được tạo và chuyển về danh sách
Console error: ...
Network request lỗi: POST /orders 400
Ảnh/video minh chứng: ...
```

## 16. Tiêu chí pass/fail

### Pass

- Backend health OK.
- Web login được bằng đủ 3 vai trò.
- Không còn CORS error.
- Frontend deploy không gọi localhost.
- Admin tạo được dữ liệu nền.
- Seller tạo được khách hàng, đơn hàng, visit, leave.
- Admin duyệt/từ chối được khách hàng và leave.
- Admin xử lý đơn hàng và tồn kho cập nhật đúng.
- Distributor xem được dữ liệu đội.
- Notification/realtime hoạt động hoặc lỗi được xác định rõ do env.
- Giao diện không giật nặng khi reload/login/scroll bảng.

### Fail

- Không đăng nhập được dù tài khoản đúng.
- Request bị CORS.
- Frontend gọi `http://localhost:5000` trên production.
- Sai phân quyền giữa admin/distributor/seller.
- Tạo đơn không cập nhật tồn kho đúng.
- Duyệt khách hàng/leave không cập nhật trạng thái.
- Login vẫn hiện text thô trước CSS sau khi hard refresh và redeploy.
- Có lỗi console nghiêm trọng khi thao tác chính.
