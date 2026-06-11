# Test Case cho 3 giao dien Seller App

Pham vi: kiem thu thu cong 3 giao dien chinh cua app Expo/React Native Web: Tong quan, Khach hang, Don hang.

Moi truong de xuat:
- Backend dang chay va co du lieu mau.
- App chay bang `npm run web` hoac Expo mobile.
- Dang nhap bang tai khoan Seller/DSR co san.
- Tai khoan co it nhat 1 route hom nay, 1 customer approved, 1 customer pending, 1 order pending va 1 order delivered neu co the.

## TC-UI-001 - Tong quan Seller

Muc tieu: Dam bao giao dien Tong quan hien dung so lieu, trang thai route/visit va dieu huong nhanh.

Tien dieu kien:
- Seller da dang nhap thanh cong.
- API dashboard va visits tra ve du lieu hop le.

| Buoc | Thao tac | Ket qua mong doi |
| --- | --- | --- |
| 1 | Mo tab Tong quan. | Man hinh hien loi chao, ngay hien tai va nut Thong bao. Khong bi treo loading. |
| 2 | Kiem tra 4 card chi so: Doanh so, Don hang, Ghe tham, Diem ban. | Gia tri card khop du lieu API dashboard; text khong tran nut/card tren mobile va desktop web. |
| 3 | Bam card Don hang. | App dieu huong sang tab Don hang. |
| 4 | Quay lai Tong quan, bam card Diem ban. | App dieu huong sang tab Khach hang. |
| 5 | Kiem tra khu vuc Tuyen hom nay. | Hien ten route, phan tram hoan thanh, so diem da ghe/con lai; neu khong co route thi hien empty state phu hop. |
| 6 | Neu co active visit, bam Tao don trong panel Dang ghe tham. | App mo man hinh Tao don va prefill customer cua active visit neu co. |
| 7 | Bam nut Thong bao tren header. | App dieu huong sang tab Thong bao; badge hien dung so unread neu unread > 0. |
| 8 | Pull-to-refresh hoac bam Dong bo tren web desktop. | Du lieu dashboard va visit duoc tai lai, khong mat trang thai dang nhap. |

Tieu chi dat:
- Tat ca thanh phan chinh hien thi dung, khong co loi UI/API.
- Cac luong dieu huong nhanh mo dung tab/man hinh.
- Loading, empty state va error banner hien ro khi API cham/loi.

## TC-UI-002 - Danh sach Khach hang

Muc tieu: Dam bao giao dien Khach hang loc, tim kiem, tao va mo chi tiet dung.

Tien dieu kien:
- Seller da dang nhap thanh cong.
- API customers tra ve danh sach customer trong scope cua Seller.

| Buoc | Thao tac | Ket qua mong doi |
| --- | --- | --- |
| 1 | Mo tab Khach. | Header Khach hang hien dung, co nut quay lai va nut them khach hang. |
| 2 | Kiem tra summary strip Tong, Da duyet, Cho duyet, Tu choi. | So lieu khop voi danh sach customer hien co. |
| 3 | Nhap tu khoa theo ten/SĐT/dia chi vao o tim kiem. | Danh sach loc theo tu khoa; so ket qua cap nhat dung. |
| 4 | Chon filter Da duyet, Cho duyet, Tu choi. | Danh sach chi hien customer theo trang thai da chon; status pill hien dung label. |
| 5 | Bam mot customer trong danh sach. | App mo man hinh chi tiet customer dung ban ghi da chon. |
| 6 | Quay lai danh sach, bam nut Them khach hang. | App mo form Them khach hang. |
| 7 | Submit form voi truong bat buoc bo trong. | Form chan submit va hien validation/error phu hop. |
| 8 | Khi danh sach rong hoac loc khong co ket qua. | Empty state hien thong diep phu hop; voi danh sach rong co action them khach hang. |

Tieu chi dat:
- Tim kiem va filter khong lam sai scope du lieu cua Seller.
- Detail/form dieu huong dung, khong crash khi reload du lieu.
- Text trong card customer khong tran tren man hinh nho.

## TC-UI-003 - Danh sach Don hang

Muc tieu: Dam bao giao dien Don hang hien so lieu, loc/tim, rang buoc check-in va mo chi tiet/sua don dung.

Tien dieu kien:
- Seller da dang nhap thanh cong.
- API orders, customers, saleProducts, activePromotions va visits tra ve thanh cong.
- Co it nhat 1 don pending va 1 don delivered neu co the.

| Buoc | Thao tac | Ket qua mong doi |
| --- | --- | --- |
| 1 | Mo tab Don hang. | Header Don hang hien dung, co nut quay lai va nut tao/check-in theo trang thai active visit. |
| 2 | Kiem tra summary: Tong don, Cho duyet, Da giao, Doanh thu giao, Chua thanh toan. | So lieu tinh dung tu danh sach orders; doanh thu chi tinh don delivered. |
| 3 | Khi khong co active visit, bam nut tao/check-in hoac prompt check-in. | App dieu huong sang tab Ghe tham thay vi cho tao don truc tiep. |
| 4 | Khi co active visit, bam nut Tao don. | App mo form Tao don, co danh sach customer/product/promotion va active visit duoc truyen vao. |
| 5 | Nhap tu khoa theo ma don/khach hang/ghi chu. | Danh sach loc dung va co nut xoa nhanh tu khoa. |
| 6 | Chon cac filter Cho duyet, Da duyet, Da giao, Chua thanh toan, Huy. | Danh sach chi hien don phu hop; so ket qua cap nhat dung. |
| 7 | Bam mot don pending. | App mo chi tiet don; nut Sua hien va cho vao form sua don. |
| 8 | Bam mot don khong phai pending. | App mo chi tiet don; danh sach khong hien action sua truc tiep. |
| 9 | Khi khong co don hoac loc khong co ket qua. | Empty panel hien thong diep phu hop; neu chua co don thi action Tao don/Check-in phu thuoc active visit. |

Tieu chi dat:
- Khong tao don neu chua co active check-in theo rule hien tai.
- Filter Chua thanh toan chi tinh delivered order con cong no/chua paid.
- Status, amount, item count va thoi gian tren order row hien dung, khong bi vo layout.

## Ghi nhan ket qua

| Test case | Trang thai | Tester | Ngay test | Ghi chu/Evidence |
| --- | --- | --- | --- | --- |
| TC-UI-001 | Not Run |  |  |  |
| TC-UI-002 | Not Run |  |  |  |
| TC-UI-003 | Not Run |  |  |  |
