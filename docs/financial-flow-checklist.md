# DMS Financial Flow Checklist

Run the demo seed:

```bash
cd dms-backend
npm run seed:demo
```

Demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@dms.local | Admin@123456 |
| Distributor | distributor@dms.local | Distributor@123456 |
| Seller | seller@dms.local | Seller@123456 |

## Seeded Data

- Distributor warehouse: `WH-NPP-HCM-001`
- Products:
  - `NES-BEV-COFFEE-001`
  - `NES-BEV-TEA-001`
- Supply order: `DEMO-SUPPLY-001`
- Partial collection store order: `DEMO-STORE-PARTIAL-001`
- Refunded return-review order: `DEMO-STORE-REFUND-001`

## Manual Verification

1. Admin opens `/admin/warehouses`.
   - Confirm NPP warehouse has stock, average cost, selling price and 10% seller commission.

2. Admin opens `/admin/orders`.
   - Confirm supply order is separate from store orders.
   - Confirm store order detail shows cost, gross profit, paid amount, balance due and commission.

3. Admin opens `/admin/commissions`.
   - Select current month.
   - Confirm seller commission is based on net collected cash flow.
   - Lock the period and confirm the status changes to locked.

4. Admin opens `/admin/financial-reports`.
   - Confirm revenue, cost, gross profit, collected, refunded, commission and NPP net profit are visible.
   - Check seller and product tabs.

5. Distributor opens `/distributor/warehouse`.
   - Confirm warehouse stock and selling prices match Admin view.
   - Create an inbound stock request from main products.
   - Confirm the request appears in Admin orders as a pending `Nestle -> NPP` supply order.

6. Admin approves and delivers the distributor inbound request.
   - Confirm main product stock is reduced when the order is approved.
   - Confirm distributor warehouse stock is increased when the order is delivered.

7. Admin creates a store order.
   - Select distributor first.
   - Select seller from that distributor.
   - Select customer assigned to that seller.
   - Confirm products are listed from the selected distributor warehouse, not main stock.

8. Distributor opens `/distributor/commissions` and `/distributor/financial-reports`.
   - Confirm the distributor only sees their own seller/team data.

9. Seller opens mobile or web order detail for demo orders.
   - Confirm paid/refunded/net-held values are visible.
   - Confirm return request is only available after net held amount is zero.
