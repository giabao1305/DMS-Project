# DMS Seller Mockup UI Spec

This document is the reusable UI standard for rebuilding the app from the new mockup. Treat the mockup as the source of truth. Existing screens may be discarded or rewritten when they conflict with this spec.

## Product Direction

DMS Seller is a mobile-first field sales app, not a shrunken admin dashboard.

The UI should support sellers who are moving between stores and need to act quickly. Each screen should have one clear job: find data, inspect details, create an order, check in, or review progress. Information must be scannable in one or two seconds, with clear status colors and a small number of strong calls to action.

Core qualities:

- Mobile-first, single-column layout.
- Light, clean, soft card-based interface.
- Dashboard as the central hub.
- Fast actions for creating orders, check-in, customers, inventory, and routes.
- Minimal text, high information density, no table/admin feeling.
- Strong primary CTA, usually one per screen.
- Status shown with small colored pills, not long explanatory text.

## Visual Tokens

Suggested colors from the mockup:

- Primary cyan: `#4ADEDE`
- Secondary blue: `#5086FF`
- Navy text/dark mode: `#0A1B34`
- White surface: `#FFFFFF`
- Light background: `#F7FAFC` or `#F5F7FA`
- Soft border: `#E5E7EB` or `#EEF2F7`
- Muted text: `#8E97A6`

Status tones:

- Success: soft green/cyan for completed, checked-in, paid.
- Warning: soft orange for pending, upcoming, attention.
- Danger: soft red/coral for overdue, cancelled, rejected.
- Info: soft blue for route/progress/context.

Typography:

- Hero title/value: `24-32`, bold or semibold.
- Screen title: `22-24`, bold.
- Section title: `16-18`, semibold.
- Body: `14-16`.
- Meta/label/time: `11-13`.
- Metric value: `20-32`, bold.
- Avoid negative letter spacing.

Shape and spacing:

- Screen horizontal padding: `20-24`.
- Section gap: `16-24`.
- Card inner padding: `12-16`.
- Card radius: `18-24`.
- Button radius: `12-16` or pill.
- Input radius: `10-14`.
- Avatar/image radius: `10-16`, or circular for people/customers.
- Bottom sheet top radius: `24-28`.
- Shadows should be very soft; cards mostly stand out through white surface, light border, and gentle elevation.

## Common Layout Types

### A. Brand/Auth

Used by Splash and Login.

- No bottom navigation.
- Focused, centered, low-noise.
- Splash is full dark brand screen.
- Login is a clean form without a heavy wrapping card.

### B. Dashboard/Home

Used by Dashboard and high-level KPI views.

- Greeting header.
- Notification action.
- Main metric card.
- Secondary metrics.
- Chart card.
- Quick actions.
- Today route/customer schedule.
- Bottom navigation with center FAB.

### C. List/Search

Used by Customers, Orders, Products, Inventory, Debt, Promotions, Notifications.

- Header or top search.
- Search bar.
- Filter chips or segmented tabs.
- Optional summary cards.
- Card/row list.
- Empty state.

### D. Detail

Used by Customer Detail, Order Detail, Product Detail, Profile.

- Back/header.
- Identity or hero block.
- Status/action row.
- Info cards with label/value rows.
- One main CTA near bottom.

### E. Map/Timeline

Used by Routes, GPS Check-in, Customer Map, Visit Calendar.

- Map or timeline is the main content.
- Floating controls.
- Bottom sheet or progress card.
- Strong CTA for check-in/navigation/add visit.

## Screen-by-Screen Standard

### 1. Splash Screen

Purpose: brand recognition and loading.

Layout:

- Full-screen navy background.
- Large centered DMS logo.
- Cyan glow ring around logo.
- App name and short slogan under logo.
- Small loading bar near bottom.
- No card, no navigation.

### 2. Login

Purpose: fast account login.

Layout:

- Small logo at top of form.
- Title: `Dang nhap tai khoan`.
- Phone input.
- Password input with eye icon.
- Remember checkbox and forgot password link.
- Full-width cyan login button.
- Divider for social login.
- Circular social buttons.
- Register link at bottom.

Implementation notes:

- Keep form centered with `24px` side padding.
- Inputs height around `44-48`.
- Primary button height around `48-52`.
- Do not wrap the form in a heavy dashboard card.

### 3. Dashboard

Purpose: home hub for seller work.

Layout:

- Top gradient/navy header with greeting and notification icon.
- Main revenue metric card: label, large value, growth percent.
- Smaller order/customer/visit cards.
- 7-day sales line chart.
- Quick actions: create order, check-in, customers, inventory.
- Today's schedule/customer list.
- Bottom nav and centered FAB.

Implementation notes:

- First viewport should show greeting, key metrics, and quick actions.
- Dashboard should feel like the visual reference for every other screen.
- Metrics must be more prominent than labels.

### 4. Customer List

Purpose: find and choose a store quickly.

Layout:

- Search bar.
- Horizontal filter chips: all, VIP, grocery, supermarket.
- Customer cards.

Customer card:

- Circular avatar left.
- Customer name bold.
- Type/address line.
- Debt/status line.
- Status/VIP tag on right.
- Chevron or quick action on right.

Implementation notes:

- Card height around `78-92`.
- Show at most three information layers.
- Avoid admin-style dense rows.

### 5. Customer Detail

Purpose: customer hub for call, check-in, history, and order creation.

Layout:

- Profile header with avatar, customer name, customer code/type.
- Four quick action icons: call, check-in, history, add/more.
- General info card: address, phone, current debt, debt limit, owner/seller.
- Sales card: current month, order count.
- Full-width primary button: create order.

Implementation notes:

- Customer identity must be immediately clear.
- Debt and limit should be more visually prominent than minor metadata.

### 6. Routes

Purpose: show where the seller goes today and progress.

Layout:

- Segmented control: today/week.
- Date on the right.
- Route summary card: route name, `done/total`, percent, progress bar.
- Timeline list of stops.
- Floating navigation/map button.

Timeline stop:

- Time or index on the left.
- Vertical line/dots.
- Customer name.
- Address.
- Status pill.

Implementation notes:

- Timeline should be its own reusable component.
- Completed/check-in is success, upcoming is warning, active route is primary/info.

### 7. GPS Check-in

Purpose: confirm location and check in at a customer.

Layout:

- Full-screen map.
- Floating back button.
- Current location circle/radius.
- Customer marker.
- Bottom sheet with customer avatar, name, address, close button, confirmation text, time/GPS, full-width check-in button.

States:

- Loading location.
- Permission denied.
- GPS weak.
- Outside allowed radius.
- Ready to check in.

Implementation notes:

- Map must not be inside a decorative card.
- Bottom sheet height around `220-280`.

### 8. Customer Map

Purpose: browse nearby customers on a map.

Layout:

- Full-screen map.
- Floating header: back, title, close/filter.
- Multiple markers.
- Floating filter button.
- Bottom card/sheet for nearby customers.

Implementation notes:

- Bottom sheet should leave enough map visible.
- Selected marker should visually differ.

### 9. Create Order

Purpose: create an order quickly at a store.

Layout:

- Customer header with avatar, name, address.
- Product search.
- Product/cart rows with image, name, unit, price, quantity stepper.
- Bottom summary with total amount.
- Primary button: continue/create order.

Implementation notes:

- This screen should feel like shopping/cart, not an admin form.
- Product image size around `48-56`.
- Product row height around `76-92`.
- Quantity stepper must be easy to tap.
- Total panel should be sticky or always close to CTA.

### 10. Order Detail

Purpose: see order status, progress, and payment summary.

Layout:

- Header with order code.
- Status pill.
- Order timeline: placed, confirmed, delivering, completed.
- Progress bar.
- Order info card.
- Payment card: subtotal, fee/discount, final amount.
- CTA: view details or next action.

Implementation notes:

- Timeline is required to match the mockup.
- Final amount should be visually strongest in payment card.

### 11. Product List

Purpose: search product, see price and stock, choose item.

Layout:

- Search bar.
- Category chips.
- Product rows.

Product row:

- Image left.
- Name.
- Unit/spec.
- Price.
- Stock.
- Sale/new tag when applicable.

Implementation notes:

- Use real images when available.
- Price is bold.
- Stock can be a small pill on right.

### 12. Product Detail

Purpose: inspect product before adding to order.

Layout:

- Back button.
- Large product image.
- Product name.
- Unit/spec.
- Large price.
- Stock.
- Description.
- Promotion block.
- Quantity stepper.
- Button: add to order.

Implementation notes:

- Product image is the hero.
- CTA stays near bottom.

### 13. Inventory

Purpose: check stock quickly.

Layout:

- Search.
- Inventory rows with image, name, unit, stock quantity on right.

Implementation notes:

- Keep minimal.
- Low stock should use warning, out of stock danger.

### 14. Debt

Purpose: track customer debt and overdue amounts.

Layout:

- Top summary cards: current debt, overdue.
- Filter chips: all, unpaid, overdue.
- Debt cards with customer name, current debt, due date, status, colored left rail.

Implementation notes:

- Amount is bold.
- Overdue status must be visually obvious but not harsh.

### 15. Promotions

Purpose: help sellers advise customers on active promotions.

Layout:

- Tabs: active, upcoming, ended.
- Promotion cards with image, campaign name, short condition, validity dates.

Implementation notes:

- Active promotions use primary/success.
- Expired promotions use muted styling.

### 16. Sales Report

Purpose: show seller performance.

Layout:

- Time/month filter.
- Main revenue card with growth percent.
- Bar chart.
- Top products list with image, name, revenue.

Implementation notes:

- Revenue total is the hero.
- Chart should be clean and simple.

### 17. Notifications

Purpose: updates for orders, promotions, and system.

Layout:

- Tabs: all, orders, promotions, system.
- Notification rows with type icon, title, description, time.
- Optional `view all` button.

Implementation notes:

- Unread state uses dot or subtle highlighted background.
- Rows should not be too tall.

### 18. Profile

Purpose: seller account and personal settings.

Layout:

- Profile header with avatar, name, role.
- Info card: phone, email, region, manager.
- Menu rows: change password, change area, logout.

Implementation notes:

- Quiet, low-color screen.
- Logout uses danger tone.

### 19. Settings

Purpose: app configuration.

Layout:

- Grouped setting rows: language, mode, notifications, security, version, privacy policy, terms.

Implementation notes:

- Row with icon left, label, optional value, chevron/switch right.
- No complex cards.

### 20. Visit Calendar

Purpose: view visit schedule by day.

Layout:

- Month header.
- Calendar grid.
- Selected date in cyan.
- Daily schedule timeline.
- Floating plus button.

Implementation notes:

- Calendar card at top.
- Schedule rows should share timeline styling with routes.

## Dark Mode

Dark mode keeps the same layout and component structure.

Colors:

- Background: navy/ink.
- Surface: dark panel.
- Text: white.
- Muted text: blue-gray.
- Border: lighter navy.
- Primary cyan remains bright.
- Shadows are reduced; use borders/glow instead.

Implementation rule:

- Do not create separate dark-mode screens.
- Components should consume theme tokens instead of hardcoded light colors.

## Components To Build Or Standardize

- `AppScreen`: page background, safe padding, max width.
- `ScreenHeader`: back/title/action.
- `MetricCard`: dashboard/list metric.
- `SearchBar`: standard search.
- `FilterTabs`: chips or segmented controls.
- `StatusPill`: status label with tone.
- `ListCard`: base for customer/order/product rows.
- `Avatar`: image or initials.
- `ProductRow`: image/name/price/stock.
- `QuantityStepper`: plus/minus/input.
- `InfoCard`: section card.
- `InfoRow`: label/value row.
- `Timeline`: route/order/visit progress.
- `BottomSheet`: map and check-in panels.
- `PrimaryButton`: main CTA.
- `BottomNav`: tab bar with centered FAB.

## Six Design Rules

1. Dashboard is the hub.
2. Each screen has one main task.
3. Cards are the primary unit of information.
4. Use one strong CTA per screen whenever possible.
5. Status must be scannable through color and pills.
6. Mobile-first always; desktop/web is only an expanded container.

## Implementation Priority

Start by defining the reusable visual system, then rebuild screens in this order:

1. Dashboard.
2. Orders: list, detail, create order.
3. Customers: list, detail.
4. Routes and visits.
5. Products/inventory/debt/promotions if available.
6. Notifications, profile, settings.
7. Login/splash polish.

