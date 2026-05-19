# Database Schema

Database dùng MongoDB Atlas. Backend truy cập qua Mongoose schemas.

## users

Mục đích: lưu tài khoản admin và seller.

Fields chính:

- fullName
- email
- password
- phone
- avatar
- role: `admin` hoặc `seller`
- companyName
- address
- taxCode
- createdBy
- isActive
- resetPasswordToken
- resetPasswordExpires
- createdAt
- updatedAt

Quan hệ:

- Admin có thể tạo seller qua `createdBy`.
- Seller được tham chiếu bởi customers, orders, routes, visits, leaves.

## customers

Mục đích: lưu khách hàng/điểm bán.

Fields chính:

- name
- phone
- address
- latitude
- longitude
- ownerName
- customerType
- assignedSeller
- createdBy
- status: `pending`, `approved`, `rejected`
- approvedBy
- approvedAt
- rejectReason
- isActive
- createdAt
- updatedAt

Quan hệ:

- assignedSeller -> users
- createdBy -> users
- approvedBy -> users

## categories

Mục đích: nhóm sản phẩm.

Fields chính:

- name
- description
- isActive
- createdAt
- updatedAt

## products

Mục đích: lưu sản phẩm bán hàng.

Fields chính:

- name
- code
- description
- category
- price
- unit
- stock
- minStock
- image
- isActive
- isDeleted
- deletedAt
- createdAt
- updatedAt

Quan hệ:

- category -> categories

## inventorytransactions

Mục đích: ghi nhận biến động kho.

Fields chính:

- product
- type: `import`, `export`, `order`, `return`, `adjustment`
- quantity
- beforeStock
- afterStock
- note
- createdBy
- createdAt
- updatedAt

Quan hệ:

- product -> products
- createdBy -> users

## orders

Mục đích: lưu đơn hàng.

Fields chính:

- orderCode
- seller
- customer
- items
- promotion
- totalAmount
- discountAmount
- finalAmount
- status: `pending`, `approved`, `delivered`, `return_requested`, `cancelled`, `returned`
- note
- approvedBy
- approvedAt
- deliveredAt
- returnReason
- returnRequestedBy
- returnRequestedAt
- returnApprovedBy
- returnedAt
- createdAt
- updatedAt

Order item:

- product
- productName
- quantity
- price
- subtotal

Quan hệ:

- seller -> users
- customer -> customers
- items.product -> products
- promotion -> promotions
- approvedBy -> users
- returnRequestedBy -> users
- returnApprovedBy -> users

## routes

Mục đích: lập tuyến bán hàng.

Fields chính:

- name
- seller
- workDate
- customers
- status: `planned`, `in_progress`, `completed`, `cancelled`
- createdBy
- createdAt
- updatedAt

Route customer:

- customer
- orderIndex
- note
- status: `pending`, `checked_in`, `visited`, `skipped`

Quan hệ:

- seller -> users
- customers.customer -> customers
- createdBy -> users

## visits

Mục đích: ghi nhận ghé thăm khách hàng.

Fields thường dùng:

- seller
- customer
- route
- checkInTime
- checkOutTime
- checkInLatitude
- checkInLongitude
- checkOutLatitude
- checkOutLongitude
- distanceFromCustomer
- gpsAccuracy
- status
- note
- createdAt
- updatedAt

Quan hệ:

- seller -> users
- customer -> customers
- route -> routes

## leaverequests

Mục đích: quản lý nghỉ phép.

Fields chính:

- seller
- startDate
- endDate
- reason
- status: `pending`, `approved`, `rejected`
- approvedBy
- approvedAt
- adminNote
- createdAt
- updatedAt

Quan hệ:

- seller -> users
- approvedBy -> users

## notifications

Mục đích: lưu thông báo cho admin/seller.

Fields thường dùng:

- recipient
- title
- message
- type
- entityType
- entityId
- isRead
- createdAt
- updatedAt

Quan hệ:

- recipient -> users

## promotions

Mục đích: lưu chương trình khuyến mãi.

Fields chính:

- name
- description
- type: `percent`, `amount`, `product_gift`
- discountPercent
- discountAmount
- giftProduct
- giftQuantity
- minOrderValue
- startDate
- endDate
- isActive
- createdAt
- updatedAt

Quan hệ:

- giftProduct -> products

## auditlogs

Mục đích: lưu lịch sử thao tác quan trọng.

Fields thường dùng:

- actor
- action
- module
- method
- path
- targetId
- before
- after
- createdAt

Quan hệ:

- actor -> users

## kpis

Mục đích: lưu mục tiêu kinh doanh.

Fields thường dùng:

- seller
- month
- year
- targetRevenue
- targetOrders
- targetCustomers
- achievedRevenue
- achievedOrders
- achievedCustomers
- createdAt
- updatedAt

Quan hệ:

- seller -> users
