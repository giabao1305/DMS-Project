# Test Plan

## Mục tiêu

Đảm bảo hệ thống DMS hoạt động đúng ở các luồng quan trọng:

- Authentication.
- Role-based authorization.
- Order and inventory workflow.
- Customer approval workflow.
- Leave approval/rejection workflow.
- Health monitoring.
- Frontend build/lint.
- Backend build/unit/e2e.

## Test Commands

Frontend:

```bash
cd dms-frontend
npm run lint
npm run build
```

Backend:

```bash
cd dms-backend
npm run test
npm run test:e2e
npm run build
```

## Automated Backend Tests

### Unit test

File:

```text
dms-backend/src/app.controller.spec.ts
```

Coverage:

- App health response.
- Database connection status formatting.

### E2E test

File:

```text
dms-backend/test/app.e2e-spec.ts
```

Coverage:

- Health endpoint returns operational status.
- Admin and seller can login.
- `/auth/me` returns current profile from JWT.
- Password is not exposed by `/auth/me`.
- Successful login writes auth audit logs.
- Sensitive auth endpoints are rate limited.
- Refresh tokens are rotated and revoked on logout.
- Accounts are temporarily locked after repeated failed logins.
- Admin can access admin dashboard.
- Seller can access seller dashboard.
- Seller is forbidden from admin dashboard.
- Admin is forbidden from seller dashboard.
- Seller creates order.
- Admin approves order.
- Approved order subtracts product stock.
- Inventory transaction is created for order approval.
- Admin marks order delivered.
- Seller requests return.
- Admin approves return.
- Return restores product stock.
- Inventory transaction is created for return.
- Seller-created customer starts as pending.
- Admin can see pending customer.
- Admin can approve customer.
- Seller creates leave request.
- Admin can approve leave request.
- Admin can reject leave request with note.

## Manual Test Cases

### Authentication

1. Open frontend.
2. Login with admin demo account.
3. Verify redirect to admin dashboard.
4. Logout.
5. Login with seller demo account.
6. Verify redirect to seller dashboard.

Expected:

- Correct role dashboard is shown.
- Invalid credentials show an error.
- Expired token redirects to login.

### Authorization

1. Login as seller.
2. Open `/admin/dashboard`.
3. Login as admin.
4. Open `/seller/dashboard`.

Expected:

- User sees `/forbidden`.
- Page describes required role and current role.

### Product and inventory

1. Login as admin.
2. Create a category.
3. Create a product.
4. Import stock.
5. Adjust stock.
6. Open inventory alerts.

Expected:

- Product appears in list.
- Stock is updated correctly.
- Inventory transactions are recorded.
- Low stock products appear in alerts.

### Order workflow

1. Login as seller.
2. Create an order.
3. Login as admin.
4. Approve order.
5. Mark delivered.
6. Login as seller.
7. Request return.
8. Login as admin.
9. Approve return.

Expected:

- Order status changes in sequence.
- Stock decreases on approval.
- Stock increases on return.
- Notifications are created.

### Customer approval

1. Seller creates customer.
2. Admin opens pending customers.
3. Admin approves or rejects customer.

Expected:

- New customer starts pending.
- Approved customer becomes available for operations.
- Rejected customer stores reject reason.

### Route and visit

1. Admin creates route for seller.
2. Seller opens route.
3. Seller check-ins at customer.
4. Seller check-outs after visit.
5. Admin opens visits page.

Expected:

- Visit status updates correctly.
- GPS distance/accuracy are displayed.
- Admin can inspect visit history.

### Leave workflow

1. Seller creates leave request.
2. Admin approves it.
3. Seller creates another leave request.
4. Admin rejects it with note.

Expected:

- Status changes to approved/rejected.
- Admin note is saved.
- Seller sees updated status.

### Error pages

1. Open an invalid route.
2. Trigger role mismatch.

Expected:

- Invalid route shows 404 page.
- Role mismatch shows 403 page.

## Demo Accounts

```text
Admin:  admin@dms.local  / Admin@123456
Seller: seller@dms.local / Seller@123456
```

Create or refresh demo data:

```bash
cd dms-backend
npm run seed:demo
```
