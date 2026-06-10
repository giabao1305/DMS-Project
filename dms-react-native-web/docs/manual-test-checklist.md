# DMS Manual Test Checklist

Ghi chu: khong tao tai khoan moi neu da co tai khoan san. Dung tai khoan hien co theo role: Admin, Distributor/NPP, Seller/DSR. Moi buoc nen ghi lai: pass/fail, loi hien thi, API bi loi neu co, anh chup man hinh.

## 0. Chuan bi chung

- [ ] Chay backend, frontend web va app mobile/web.
- [ ] Dang nhap lan luot bang tai khoan co san: Admin, Distributor, Seller.
- [ ] Kiem tra refresh trang/app khong mat phien dang nhap bat thuong.
- [ ] Kiem tra logout va dang nhap lai.
- [ ] Kiem tra role guard: Admin khong vao nham trang Distributor/Seller neu khong duoc phep; Seller khong vao duoc trang Admin.
- [ ] Kiem tra loi chung: loading, empty state, network error, form validation, toast/thong bao.

## 1. Backend/API

### Auth

- [ ] POST `/auth/login`: dang nhap thanh cong voi tung role co san.
- [ ] POST `/auth/login`: sai mat khau tra loi loi ro rang.
- [ ] GET `/auth/me`: tra dung thong tin user dang dang nhap.
- [ ] PATCH `/auth/profile`: cap nhat ho so, reload van con du lieu moi.
- [ ] PATCH `/auth/change-password`: doi mat khau voi current password dung/sai.
- [ ] POST `/auth/refresh`: refresh token con hoat dong.
- [ ] POST `/auth/logout`: logout xong token cu khong truy cap duoc API can auth.

### Dashboard

- [ ] GET `/dashboard/admin`: Admin xem tong quan he thong.
- [ ] GET `/dashboard/seller`: Seller/Distributor xem dashboard cua minh/doi.
- [ ] Kiem tra cac so lieu dashboard khop voi order, customer, visit, notification hien co.

### Users

- [ ] GET `/users`: Admin loc/tim/pagination danh sach nhan vien.
- [ ] GET `/users/sellers`: Admin/Distributor xem DSR phu hop role.
- [ ] POST `/users` va POST `/users/sellers`: chi test validation/permission neu khong muon tao tai khoan moi.
- [ ] GET `/users/:id`: xem chi tiet user.
- [ ] PATCH `/users/:id`: sua thong tin user co san.
- [ ] PATCH `/users/:id/status`: khoa/mo khoa user co san, sau do tra lai trang thai ban dau.
- [ ] DELETE `/users/:id`: chi test permission/confirm, khong xoa user dang can dung.

### Customers

- [ ] POST `/customers`: Seller/Distributor tao khach hang test neu duoc phep dung du lieu co san; khong tao account.
- [ ] GET `/customers`: Admin xem tat ca khach hang, loc/tim/pagination.
- [ ] GET `/customers/pending`: Admin xem khach hang cho duyet.
- [ ] GET `/customers/my-customers`: Seller/Distributor xem dung scope cua minh.
- [ ] GET `/customers/:id`: xem chi tiet.
- [ ] PATCH `/customers/:id`: sua thong tin, GPS, owner/store label.
- [ ] PATCH `/customers/:id/approve`: Admin/Distributor duyet khach hang pending.
- [ ] PATCH `/customers/:id/reject`: Admin/Distributor tu choi va co ly do.
- [ ] DELETE `/customers/:id`: chi test khi co du lieu rac co the xoa.

### Products/Categories/Promotions

- [ ] GET `/categories`, GET `/products/categories`: danh muc hien dung.
- [ ] POST/PATCH/DELETE `/categories`: Admin them/sua/xoa danh muc test neu co du lieu phu hop.
- [ ] GET `/products`: Admin/Distributor/Seller xem san pham.
- [ ] GET `/products/:id`: xem chi tiet.
- [ ] POST/PATCH/DELETE `/products`: Admin tao/sua/xoa san pham test.
- [ ] PATCH `/products/:id/status`: doi trang thai san pham va kiem tra an/hien tren order.
- [ ] GET `/products/low-stock`: Admin xem canh bao ton kho.
- [ ] GET `/promotions/active`: Seller/Distributor thay khuyen mai dang hieu luc.
- [ ] POST/PATCH/DELETE `/promotions`: Admin quan ly khuyen mai.

### Inventory/Warehouses

- [ ] GET `/warehouses`: Admin/Distributor/Seller xem dung kho theo role.
- [ ] POST `/warehouses`: Admin tao kho neu can test du lieu kho.
- [ ] GET `/warehouses/:warehouseId/stocks`: xem ton kho.
- [ ] GET `/warehouses/seller/:sellerId/stocks`: xem stock theo seller.
- [ ] POST `/warehouses/:warehouseId/stocks`: Admin khoi tao stock.
- [ ] PATCH `/warehouses/:warehouseId/stocks/:stockId/selling-price`: Admin/Distributor sua gia ban NPP.
- [ ] PATCH `/warehouses/:warehouseId/status`: Admin doi trang thai kho.
- [ ] POST `/inventory/import`: Admin nhap kho.
- [ ] POST `/inventory/export`: Admin xuat kho.
- [ ] POST `/inventory/adjust`: Admin dieu chinh ton.
- [ ] GET `/inventory/transactions`: xem lich su giao dich kho.
- [ ] GET `/inventory/product/:productId`: xem ton theo san pham.

### Routes/Visits

- [ ] POST `/routes`: Admin/Distributor tao tuyen.
- [ ] GET `/routes`: Admin xem danh sach tuyen.
- [ ] GET `/routes/my-routes`: Distributor/Seller xem tuyen cua minh.
- [ ] GET `/routes/today`: Seller xem tuyen hom nay.
- [ ] GET `/routes/:id`: xem chi tiet tuyen.
- [ ] PATCH `/routes/:id`: sua tuyen.
- [ ] PATCH `/routes/:id/substitute`: gan nguoi thay the.
- [ ] DELETE `/routes/:id/substitute`: go nguoi thay the.
- [ ] PATCH `/routes/:id/status`: doi trang thai tuyen.
- [ ] DELETE `/routes/:id`: chi test voi tuyen rac.
- [ ] POST `/visits/check-in`: Seller check-in dung tuyen/ngoai tuyen/GPS yeu.
- [ ] PATCH `/visits/:id/check-out`: Seller check-out, co ghi chu/anh neu co.
- [ ] GET `/visits`: Admin xem tat ca.
- [ ] GET `/visits/my-visits`: Seller/Distributor xem dung scope.
- [ ] GET `/visits/:id`: xem chi tiet visit.

### Orders/Payments

- [ ] POST `/orders`: Seller/Distributor/Admin tao don, kiem tra san pham/gia/khuyen mai.
- [ ] PATCH `/orders/:id`: sua don khi trang thai cho phep.
- [ ] GET `/orders`: Admin xem danh sach.
- [ ] GET `/orders/my-orders`: Seller/Distributor xem dung scope.
- [ ] GET `/orders/:id`: xem chi tiet.
- [ ] PATCH `/orders/:id/approve`: Admin/Distributor duyet don.
- [ ] PATCH `/orders/:id/deliver`: Admin/Distributor giao don, kiem tra tru kho.
- [ ] PATCH `/orders/:id/return-request`: Seller tao yeu cau tra hang.
- [ ] PATCH `/orders/:id/return`: Admin xu ly tra hang.
- [ ] PATCH `/orders/:id/cancel`: huy don theo role/trang thai.
- [ ] POST `/orders/:id/payments`: ghi nhan thanh toan.
- [ ] POST `/orders/:id/refunds`: ghi nhan hoan tien.
- [ ] PATCH `/orders/:id/supply-pricing`: Admin cap nhat gia nhap/don giao kho.

### Leaves/Reports/Notifications/Audit

- [ ] POST `/leaves`: Seller tao don nghi.
- [ ] GET `/leaves`: Admin xem tat ca.
- [ ] GET `/leaves/my-leaves`: Seller/Distributor xem dung scope.
- [ ] GET `/leaves/:id`: xem chi tiet.
- [ ] PATCH `/leaves/:id/approve`: Admin/Distributor duyet.
- [ ] PATCH `/leaves/:id/reject`: Admin/Distributor tu choi co ly do.
- [ ] GET `/reports/sales`, `/reports/orders`, `/reports/visits`, `/reports/sellers`: Admin xem bao cao.
- [ ] GET `/reports/financial`: Admin/Distributor xem bao cao tai chinh dung scope.
- [ ] GET/POST/PATCH `/reports/kpis`: quan ly KPI.
- [ ] GET `/reports/kpis/my-kpi`: Seller/Distributor xem KPI ca nhan/doi.
- [ ] PATCH `/reports/kpis/:id/refresh`: lam moi KPI.
- [ ] GET `/notifications`: xem danh sach thong bao.
- [ ] GET `/notifications/unread-count`: so chua doc dung.
- [ ] PATCH `/notifications/:id/read`: danh dau da doc.
- [ ] PATCH `/notifications/read-all`: danh dau doc het.
- [ ] GET `/audit-logs`: Admin xem nhat ky sau khi thuc hien create/update/delete.

## 2. Web Admin

### Auth/Login

- [ ] Vao `/auth/login`, dang nhap Admin bang tai khoan co san.
- [ ] Dang nhap sai password, kiem tra message loi.
- [ ] Refresh trang sau dang nhap, van o dung layout Admin.
- [ ] Bam logout, quay ve login.

### Tong quan he thong - `/admin/dashboard`

- [ ] Card tong quan load dung: doanh so, don, khach hang, visit/KPI/thong bao neu co.
- [ ] Doi filter thoi gian neu trang co filter.
- [ ] Bam cac lien ket nhanh sang don hang, khach hang, visit.
- [ ] Refresh realtime/socket status khong lam mat du lieu.

### Ghe tham - `/admin/visits`, `/admin/visits/[id]`

- [ ] Danh sach visit load, search/filter/pagination hoat dong.
- [ ] Mo chi tiet visit, xem seller, khach hang, thoi gian check-in/check-out, GPS, ghi chu.
- [ ] Kiem tra visit cua Seller vua tao tren app co xuat hien.

### Ke hoach tuyen - `/admin/routes`

- [ ] Danh sach route load, search/filter/pagination.
- [ ] Tao route `/admin/routes/create` bang seller/customer co san.
- [ ] Xem chi tiet `/admin/routes/[id]`.
- [ ] Sua route `/admin/routes/[id]/edit`.
- [ ] Gan/go nguoi thay the neu UI co.
- [ ] Doi trang thai route va kiem tra Seller thay doi tren app.

### Nhan vien - `/admin/users`

- [ ] Danh sach user load, loc theo role/status.
- [ ] Xem chi tiet `/admin/users/[id]`.
- [ ] Sua user `/admin/users/[id]/edit`.
- [ ] Tao user `/admin/users/create`: chi test validation form neu khong muon tao tai khoan moi.
- [ ] Khoa/mo khoa user co san roi tra lai trang thai ban dau.

### Khach hang - `/admin/customers`

- [ ] Danh sach load, search/filter theo trang thai/owner/type.
- [ ] Tao khach hang `/admin/customers/create` neu can du lieu test.
- [ ] Xem chi tiet `/admin/customers/[id]`.
- [ ] Sua `/admin/customers/[id]/edit`.
- [ ] Duyet/tu choi khach hang pending, kiem tra ly do reject.
- [ ] Kiem tra customer owner/store label hien dung.

### Danh muc - `/admin/categories`

- [ ] Danh sach danh muc load.
- [ ] Them danh muc, trung ten bi chan neu co rule.
- [ ] Sua danh muc.
- [ ] Xoa danh muc chi khi khong co san pham lien quan hoac dung du lieu rac.

### San pham - `/admin/products`

- [ ] Danh sach load, search/filter/status/category.
- [ ] Tao san pham `/admin/products/create`.
- [ ] Upload/hien anh san pham neu co.
- [ ] Xem chi tiet `/admin/products/[id]`.
- [ ] Sua `/admin/products/[id]/edit`.
- [ ] Doi active/inactive, kiem tra Seller khong chon duoc san pham inactive.

### Don thi truong - `/admin/orders`

- [ ] Danh sach don load, search/filter status/date/seller/customer.
- [ ] Tao don `/admin/orders/create`.
- [ ] Xem chi tiet `/admin/orders/[id]`: line items, tong tien, khuyen mai, thanh toan, loi nhuan.
- [ ] Sua don `/admin/orders/[id]/edit` khi trang thai cho phep.
- [ ] Duyet don, giao don, huy don.
- [ ] Ghi nhan thanh toan/hoan tien, kiem tra receivable con lai.
- [ ] Xuat invoice/CSV neu UI co.

### Duyet nhap kho - `/admin/orders/supply`

- [ ] Danh sach don giao kho NPP load.
- [ ] Tao don supply `/admin/orders/supply/create`.
- [ ] Cap nhat gia nhap/gia ban neu UI co.
- [ ] Duyet/giao don supply, kiem tra kho NPP tang ton.

### Kho hang - `/admin/inventory`

- [ ] Danh sach ton kho load.
- [ ] Nhap kho `/admin/inventory/create` hoac action import.
- [ ] Xuat/dieu chinh ton neu co action.
- [ ] Xem transaction history.
- [ ] Kiem tra ton kho thay doi sau don giao/huy/tra.

### Canh bao kho - `/admin/inventory/alerts`

- [ ] Danh sach low stock load.
- [ ] Dieu chinh threshold/stock neu co.
- [ ] Kiem tra san pham gan het hang xuat hien dung.

### Kho NPP - `/admin/warehouses`

- [ ] Danh sach kho NPP load.
- [ ] Tao kho NPP, gan distributor co san.
- [ ] Xem stock trong kho.
- [ ] Cap nhat trang thai kho.
- [ ] Cap nhat selling price cho stock.

### Khuyen mai - `/admin/promotions`

- [ ] Danh sach promotion load.
- [ ] Tao promotion `/admin/promotions/create`.
- [ ] Sua `/admin/promotions/[id]/edit`.
- [ ] Kiem tra promotion active xuat hien khi tao don.
- [ ] Het han/inactive khong duoc ap dung.

### Nghi phep - `/admin/leaves`

- [ ] Danh sach leave requests load.
- [ ] Xem chi tiet `/admin/leaves/[id]`.
- [ ] Approve/reject co ghi chu.
- [ ] Seller thay doi trang thai tren app.

### Bao cao - `/admin/reports`

- [ ] Bao cao sales/orders/visits/sellers load dung filter ngay.
- [ ] Bao cao tai chinh tinh doanh thu, thu tien, cong no, loi nhuan.
- [ ] Export CSV neu co.

### KPI - `/admin/kpis`

- [ ] Danh sach KPI load.
- [ ] Tao KPI `/admin/kpis/create` cho seller co san.
- [ ] Sua KPI `/admin/kpis/[id]/edit`.
- [ ] Refresh KPI va doi chieu voi order/visit thuc te.

### Thong bao - `/admin/notifications`

- [ ] Danh sach thong bao load.
- [ ] Unread count hien dung tren menu/header.
- [ ] Danh dau doc mot thong bao va doc tat ca.
- [ ] Link thong bao dieu huong dung trang lien quan.

### Nhat ky - `/admin/audit-logs`

- [ ] Sau khi tao/sua/xoa du lieu, log xuat hien.
- [ ] Filter theo user/action/module/date.
- [ ] Xem chi tiet log co before/after neu he thong co.

### Tai khoan - `/admin/profile`

- [ ] Xem thong tin ca nhan.
- [ ] Sua profile/avatar neu co.
- [ ] Doi mat khau va dang nhap lai.

## 3. Web Distributor/NPP

### Login/Layout

- [ ] Dang nhap Distributor bang tai khoan co san.
- [ ] Vao `/distributor`, tu dieu huong ve dashboard dung.
- [ ] Sidebar co cac muc: Tong quan doi, Doi DSR, Khach hang doi, Don & nhap kho, Kho cua toi, Tuyen doi, Ghe tham, Nghi phep, KPI doi, Thong bao, Tai khoan.
- [ ] Thu gon/mo sidebar, responsive mobile neu can.

### Tong quan doi - `/distributor/dashboard`

- [ ] So lieu doi DSR load dung scope NPP.
- [ ] Card don, doanh so, visit, customer, warehouse hien dung.
- [ ] Lien ket nhanh mo dung trang.

### Doi DSR - `/distributor/team`

- [ ] Danh sach seller thuoc NPP load.
- [ ] Search/filter/pagination.
- [ ] Xem chi tiet `/distributor/team/[id]`: KPI, don, visit, customers cua seller.
- [ ] Kiem tra khong thay seller cua NPP khac.

### Khach hang doi - `/distributor/customers`

- [ ] Danh sach customer cua doi load.
- [ ] Xem chi tiet `/distributor/customers/[id]`.
- [ ] Duyet/tu choi customer pending neu co.
- [ ] Sua thong tin neu role cho phep.

### Don & nhap kho - `/distributor/orders`

- [ ] Danh sach don store/order cua doi load.
- [ ] Xem chi tiet `/distributor/orders/[id]`.
- [ ] Duyet/giao/huy don theo quyen.
- [ ] Kiem tra tru kho NPP khi giao don.
- [ ] Ghi nhan thanh toan neu UI cho phep.
- [ ] Don supply/nhap kho NPP hien dung neu chung man hinh.

### Kho cua toi - `/distributor/warehouse`

- [ ] Stock kho NPP load dung distributor dang nhap.
- [ ] Cap nhat selling price cho tung san pham.
- [ ] Search/filter low stock.
- [ ] Import stock `/distributor/warehouse/import` neu UI co, kiem tra transaction/ton tang.
- [ ] Kiem tra Seller tao don lay gia ban moi.

### Tuyen doi - `/distributor/routes`

- [ ] Danh sach route cua doi load.
- [ ] Tao route `/distributor/routes/create`.
- [ ] Xem chi tiet `/distributor/routes/[id]`.
- [ ] Sua `/distributor/routes/[id]/edit`.
- [ ] Gan customers/seller co san, ngay lap lich, status.
- [ ] Seller thay duoc route moi tren app.

### Ghe tham - `/distributor/visits`

- [ ] Danh sach visit cua doi load.
- [ ] Xem chi tiet `/distributor/visits/[id]`.
- [ ] Kiem tra GPS/check-in/check-out cua Seller.
- [ ] Khong thay visit cua NPP khac.

### Nghi phep - `/distributor/leaves`

- [ ] Danh sach leave cua DSR thuoc NPP load.
- [ ] Xem chi tiet `/distributor/leaves/[id]`.
- [ ] Approve/reject, Seller thay doi trang thai tren app.

### KPI doi - `/distributor/kpis`

- [ ] KPI ca nhan/doi load dung.
- [ ] Refresh/loc theo seller/period neu co.
- [ ] Doi chieu voi orders/visits cua doi.

### Thong bao - `/distributor/notifications`

- [ ] Unread count dung.
- [ ] Mo chi tiet thong bao.
- [ ] Danh dau doc mot thong bao/doc tat ca.
- [ ] Link thong bao ve order/customer/route/leave dung.

### Tai khoan - `/distributor/profile`

- [ ] Xem/sua profile.
- [ ] Doi mat khau.
- [ ] Logout.

## 4. Web Seller/DSR

### Login/Layout

- [ ] Dang nhap Seller bang tai khoan co san.
- [ ] Sidebar hien: Tong quan, Khach hang cua toi, Tuyen cua toi, Ghe tham, Don hang cua toi, KPI ca nhan, Nghi phep, Thong bao, Tai khoan.
- [ ] Kiem tra Seller khong vao duoc `/admin/*` va khong thay du lieu ngoai scope.

### Tong quan - `/seller/dashboard`

- [ ] So lieu order/customer/visit/KPI/unread notification load.
- [ ] Route hom nay hien dung.
- [ ] Lien ket nhanh sang visit/order/customer.

### Khach hang - `/seller/customers`

- [ ] Danh sach customer cua toi load.
- [ ] Tao customer `/seller/customers/create`.
- [ ] Xem chi tiet `/seller/customers/[id]`.
- [ ] Sua `/seller/customers/[id]/edit`.
- [ ] Customer moi vao pending neu can duyet.

### Tuyen - `/seller/routes`

- [ ] Danh sach route/my route load.
- [ ] Xem chi tiet `/seller/routes/[id]`.
- [ ] Customer trong route dung thu tu, dia chi, GPS.

### Ghe tham - `/seller/visits`

- [ ] Danh sach visit load, loc upcoming/in progress/completed.
- [ ] Tao visit/check-in `/seller/visits/create`.
- [ ] Check-in dung tuyen, ngoai tuyen, GPS yeu/khong cap quyen.
- [ ] Xem chi tiet `/seller/visits/[id]`.
- [ ] Check-out, them ghi chu/anh neu co.
- [ ] Kiem tra khong cho tao order neu rule yeu cau active check-in ma chua check-in.

### Don hang - `/seller/orders`

- [ ] Danh sach don cua toi load.
- [ ] Tao don `/seller/orders/create` voi customer da duyet.
- [ ] Chon san pham, so luong, promotion, ghi chu.
- [ ] Kiem tra gia ban lay tu kho NPP neu Seller thuoc distributor.
- [ ] Xem chi tiet `/seller/orders/[id]`.
- [ ] Sua `/seller/orders/[id]/edit` khi trang thai cho phep.
- [ ] Gui yeu cau tra hang/huy don neu role/trang thai cho phep.

### KPI - `/seller/kpis`

- [ ] KPI ca nhan load.
- [ ] Doi chieu target/actual/progress voi don/visit.

### Nghi phep - `/seller/leaves`

- [ ] Danh sach don nghi load.
- [ ] Tao leave `/seller/leaves/create`.
- [ ] Xem chi tiet `/seller/leaves/[id]`.
- [ ] Sau Admin/Distributor duyet/tu choi, trang thai cap nhat.

### Thong bao - `/seller/notifications`

- [ ] Danh sach thong bao load.
- [ ] Mo chi tiet, link sang trang lien quan.
- [ ] Danh dau doc/doc tat ca.

### Tai khoan - `/seller/profile`

- [ ] Xem/sua profile.
- [ ] Doi mat khau.
- [ ] Logout.

## 5. App Mobile/Expo

### Dang nhap/Splash

- [ ] Mo app, splash load va khong treo.
- [ ] Dang nhap Seller bang tai khoan co san.
- [ ] Dang nhap Distributor bang tai khoan co san.
- [ ] Sai password hien loi ro rang.
- [ ] Logout xong quay ve login.

### Dashboard

- [ ] Card tong quan hien dung voi Seller.
- [ ] Card tong quan hien dung voi Distributor.
- [ ] Bam card Don/Visit/Customer/KPI/Notification dieu huong dung tab.
- [ ] Pull-to-refresh cap nhat du lieu.
- [ ] Route hom nay/active visit hien dung.

### Khach hang

- [ ] Tab Khach hang load danh sach.
- [ ] Search/filter trang thai hoat dong.
- [ ] Mo chi tiet: thong tin, tong quan ban hang, dia chi/GPS, activity.
- [ ] Them khach hang: nhap thong tin bat buoc, loai diem ban, GPS.
- [ ] Sua khach hang co san.
- [ ] Kiem tra pending/approved/rejected hien dung.

### Tuyen

- [ ] Tab Tuyen load danh sach.
- [ ] Loc theo tat ca/hom nay/sap toi/hoan thanh neu co.
- [ ] Mo chi tiet tuyen: danh sach diem ban, thong tin tuyen.
- [ ] Bam diem ban dieu huong sang khach hang/visit neu co.

### Ghe tham

- [ ] Danh sach ghe tham load, loc all/in progress/upcoming/completed.
- [ ] Tao check-in: chon route, chon customer trong route.
- [ ] Test GPS: chua cap quyen, dang lay GPS, GPS yeu, ngoai ban kinh, san sang check-in.
- [ ] Check-in thanh cong, active visit hien tren dashboard.
- [ ] Xem chi tiet visit: timeline check-in/check-out, thong tin visit.
- [ ] Check-out thanh cong, visit sang completed.

### Don hang

- [ ] Danh sach don load, loc/search neu co.
- [ ] Tao don khi co active check-in neu rule yeu cau.
- [ ] Chon customer approved, chon san pham, so luong.
- [ ] Kiem tra promotion/ghi chu/tong tien.
- [ ] Submit don, don xuat hien tren web Admin/Distributor.
- [ ] Xem chi tiet don: tien trinh, line items, tong tien.
- [ ] Sua/huy/yeu cau tra hang neu app co action va trang thai cho phep.

### Distributor: Doi DSR

- [ ] Dang nhap Distributor, vao Khac > Doi DSR hoac tab desktop.
- [ ] Danh sach DSR load dung NPP.
- [ ] Mo chi tiet neu co, kiem tra KPI/orders/visits cua DSR.

### Distributor: Kho NPP

- [ ] Vao Khac > Kho NPP.
- [ ] Danh sach stock load dung kho cua distributor.
- [ ] Search/filter san pham.
- [ ] Kiem tra gia ban va ton kho khop web Distributor/Admin.

### KPI

- [ ] Vao KPI/Chi tieu.
- [ ] Seller thay KPI ca nhan.
- [ ] Distributor thay KPI doi neu role ho tro.
- [ ] Progress khop voi orders/visits.

### Nghi phep

- [ ] Vao Nghi phep.
- [ ] Xem lich/list leave.
- [ ] Tao de xuat nghi phep: chon ngay bat dau/ket thuc, ly do.
- [ ] Loc theo trang thai.
- [ ] Mo chi tiet leave, xem ly do va phan hoi duyet.

### Thong bao

- [ ] Vao Thong bao.
- [ ] Unread badge tren dashboard/bottom sheet dung.
- [ ] Mo chi tiet thong bao.
- [ ] Link sang tab lien quan.
- [ ] Danh dau doc/doc tat ca neu co.

### Ho so/Khac

- [ ] Vao Khac, cac muc menu dieu huong dung.
- [ ] Vao Ho so ca nhan, thong tin dung.
- [ ] Sua profile neu app ho tro.
- [ ] Dang xuat.

### Responsive/Thiet bi

- [ ] Test app tren mobile portrait.
- [ ] Test web mode/desktop rail neu chay Expo web.
- [ ] Kiem tra khong co text tran nut/card.
- [ ] Kiem tra loading/empty/error state tung tab.

## 6. Flow lien ket end-to-end

### Flow A: Customer pending -> approve -> order

- [ ] Seller/App tao customer moi.
- [ ] Admin hoac Distributor thay customer pending.
- [ ] Admin/Distributor approve.
- [ ] Seller/App thay customer approved.
- [ ] Seller tao order cho customer do.
- [ ] Admin/Distributor thay order moi.

### Flow B: Route -> visit -> order

- [ ] Admin/Distributor tao route cho Seller va customer co san.
- [ ] Seller/App thay route trong Tuyen/Hom nay.
- [ ] Seller check-in customer trong route.
- [ ] Seller tao order trong luc active check-in.
- [ ] Seller check-out.
- [ ] Admin/Distributor xem visit va order lien quan.

### Flow C: Distributor warehouse -> selling price -> store order

- [ ] Admin tao/nhap stock vao kho NPP.
- [ ] Distributor cap nhat selling price.
- [ ] Seller tao order chon san pham do.
- [ ] Kiem tra don dung selling price.
- [ ] Distributor/Admin approve va deliver.
- [ ] Kiem tra kho NPP bi tru stock, order profit/receivable cap nhat.

### Flow D: Payment/receivable/commission

- [ ] Tao hoac chon order da giao.
- [ ] Ghi nhan thanh toan mot phan.
- [ ] Kiem tra cong no con lai.
- [ ] Ghi nhan thanh toan du.
- [ ] Kiem tra paid status/receivable.
- [ ] Kiem tra bao cao tai chinh va commission Seller neu co.

### Flow E: Leave approval

- [ ] Seller/App tao leave request.
- [ ] Distributor duyet hoac tu choi.
- [ ] Seller/App thay trang thai moi va thong bao.
- [ ] Admin xem lich su leave.

### Flow F: Notifications/Audit

- [ ] Thuc hien mot action tao/sua/duyet.
- [ ] User lien quan nhan thong bao.
- [ ] Danh dau doc, unread count giam.
- [ ] Admin vao audit logs thay action vua lam.
