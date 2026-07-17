# Parking Lot — Rebuild Tracking

Date started: 2026-07-17
Status: LIVE — append as new items are discovered during the pos-cloud rebuild.

## Purpose

The rebuild's current priority is 100% visual parity with pos-cloud, using the
simplest version of each page (matching pos-cloud's scope), even where that
means an existing Sefay feature isn't shown on the new page yet. Nothing is
deleted — every item below is parked here so it can be reintroduced/merged
into the new design in a later consolidation pass, once the full visual
rebuild is done.

Two categories:
- **A — Existing Sefay features to re-integrate**: things Sefay already has
  (real, working, built) that the simplified pos-cloud-matching page doesn't
  show yet. Add these back into the new design later, styled to match it —
  don't rebuild them from scratch.
- **B — Needs real development/business logic**: things pos-cloud's design
  implies (visually) but Sefay has no real data/backend for yet. These are
  NOT implemented with placeholders or fake data anywhere in the rebuild —
  they're genuine gaps needing new backend work before they can be built.

---

## A — Existing Sefay Features to Re-integrate

### A1 — Dashboard home: HR/Audit KPI rows — ✅ REMOVED FROM DASHBOARD (2026-07-17)
- **What**: Present Today / Absent Today / Pending Leaves / Approved Leaves,
  and Audit Total/Leave/Payroll/Attendance Today — 8 real stat cards.
- **Done so far**: Removed from `DashboardOverview.tsx` entirely (both the
  JSX rows and the `reportsApi.getHrSummary()`/`getAuditSummary()` query
  calls). Dashboard home now shows only the 6 main stat cards, matching
  pos-cloud's card count exactly. The two report endpoints themselves are
  untouched — just not called from this page anymore.
- **Still open**: The actual destination page for this data (e.g. "HR
  Overview" / "Audit Summary" in the sidebar) has not been built yet. This
  is real, working data with nowhere to live right now — build that page
  when the sidebar/page-by-page rebuild reaches HR/Attendance.

### A2 — Dashboard home: Quick Actions card
- **What**: 4 shortcut links (New Invoice → POS, New Customer, New Expense,
  Today's Report). Real navigation, no data dependency.
- **Where it lived**: Third slot in the charts row, replacing pos-cloud's
  inventory `OverviewCard` (which Sefay has no data for — see B1).
- **Plan**: Keep on the dashboard if it fits pos-cloud's 3-card row cleanly,
  or move to sidebar/elsewhere if the simplified dashboard drops to fewer
  cards. Re-evaluate once the "few cards only" simplification is done.

### A3 — Dashboard home: Recent Activity feed
- **What**: Real activity feed (order/refund/alert entries) via
  `reportsApi.getRecentActivity()`.
- **Where it lived**: Second row, right column.
- **Plan**: Keep if it survives the "few cards only" cut, otherwise move to
  its own page (there's already a placeholder task for a full Activity Log
  page — see note below).

### A4 — Dashboard home: Top Selling Items
- **What**: Real top-items ranking via `reportsApi.getTopItems()`.
- **Plan**: Same treatment as A3 — keep if it fits the simplified dashboard,
  otherwise its own page.

### A5 — Sidebar: Inventory collapsible group
- **What**: `DashboardSidebar.tsx`'s "Inventory" group (warehouses, locations,
  stock, movements, transfers, adjustments, stock counts, purchase orders,
  goods receipts, inventory reports) — 10 real sub-pages, no pos-cloud
  equivalent (pos-cloud has 1 mock inventory page).
- **Plan**: Already correctly kept in the sidebar (C2/C4). No action needed
  unless the sidebar itself gets simplified — flag here for visibility only.

### A6 — Branch UI element (header)
- **What**: Non-functional branch-switcher placeholder in `DashboardHeader.tsx`
  (per prior B6 decision — no real branch backend exists).
- **Plan**: Stays as a placeholder. Not removed. See B2 for the real backend
  work this depends on.

### A7 — Coupon / Loyalty / Gift Card flows (POS)
- **What**: Real, working coupon validation, loyalty-point redemption, and
  gift-card application in the POS checkout flow (`PaymentModal.tsx`,
  `CartPanel.tsx`) — none of this exists in pos-cloud's mock POS page.
- **Plan**: Already migrated visually in F1 (kept, restyled). No further
  action — listed here for completeness/traceability only.

### A8 — Customer custom fields (`CustomFieldsManager.tsx`)
- **What**: Tenant-configurable custom fields for customer records, currently
  lives under `features/customers/components/` but is actually consumed by
  the Settings page, not the Customers page (Component Discovery Rule finding
  from the earlier migration phase).
- **Plan**: Belongs to the Settings page rebuild, not Customers. Re-confirm
  when Settings is tackled.

---

## B — Needs Real Development / Business Logic

### B1 — Inventory aggregate stats (Products page + Dashboard OverviewCard)
- **What pos-cloud shows**: Total Products, Low Stock count, Out of Stock
  count, Total Inventory Value (Products page); Total Products, Low Stock,
  Total Stock, Due Invoices (Dashboard's OverviewCard).
- **Why it's a gap**: `Item` (the real API type) has no stock/quantity field
  at all. Stock only exists per-variant (`ItemVariant.stock_quantity`),
  fetched lazily one item at a time — never as a bulk aggregate.
- **What's needed**: A backend endpoint that returns aggregate stock counts
  across all items/variants (e.g. `GET /items/stock-summary` or similar) —
  real database work, not a frontend task.
- **Status**: Logged previously as AF-10. **Dashboard OverviewCard added
  2026-07-17**: Total Products shows a real count (reused `itemsApi.getAll()`
  length, same endpoint the Products page already uses). Low Stock, Total
  Stock, and Due Invoices show a muted "Soon" badge instead of pos-cloud's
  mock numbers (1,245 / 23 / 8,752 / 5) — still blocked on the same real
  backend aggregate endpoint described above.

### B2 — Real branch backend
- **What pos-cloud shows**: A working branch switcher (header dropdown) and
  a full Branches page with per-branch stats.
- **Why it's a gap**: No branch data model, store, or API exists on the
  frontend. Only `AuthUser.branchId?: string` (a single ID) and
  `Warehouse.branch_id` (a foreign key reference) exist — no list of
  branches, no per-branch sales breakdown, no branch CRUD.
- **What's needed**: A real branch entity (backend model + API), a frontend
  store, and a "switch active branch" flow. Significant scope — a full
  feature, not a styling task.
- **Status**: Standing decision (B6, prior migration phase): keep the header
  element as a non-functional placeholder until this is built. Confirmed
  2026-07-17 via direct search: no branches-list endpoint exists anywhere
  in the codebase. Three dashboard slots are blocked on this and show a
  "Soon" placeholder instead of fabricated data: the "Sales by Branch" bar
  chart, the "Branches Overview" card (per-branch open/closed + monthly
  sales), and a dedicated Branches page.

### B3 — Product images
- **What pos-cloud shows**: Real product photos on POS item cards and the
  Products page grid.
- **Why it's a gap**: Neither the `Item` type, `CreateItemDto`, nor the
  "Add/Edit Item" form has any `image_url` field or upload capability —
  confirmed by direct code search (zero matches for "image" anywhere in the
  items feature). Not a frontend oversight — the backend has never supported
  product images.
- **What's needed**: A database column, an upload endpoint (likely to blob
  storage), and a form field to attach it — real backend + frontend work.
- **Status**: **Temporary stand-in added 2026-07-17 (POS page only)** — per
  explicit user decision, POS item cards now show a stock photo pulled from
  a public image service (loremflickr.com), keyed by the item's own real
  name and locked to its id (same technique pos-cloud's own mock data
  uses). This is acknowledged as imprecise — a random photo may not match
  the actual product — and is explicitly a placeholder, not a substitute
  for real upload. **Products page grid still has no image slot** — apply
  the same treatment there if/when requested. Real upload feature (DB
  column + endpoint + form field) still not built.

### B4 — Invoices table (Dashboard) / per-branch sales breakdown
- **What pos-cloud shows**: A "recent invoices" table distinct from the
  activity feed, and a per-branch sales bar chart on the dashboard.
- **Why it's a gap**: Sefay has no separate "recent invoices" data feed
  beyond `recentActivity` (which already covers orders/refunds/alerts), and
  no per-branch sales data (see B2).
- **What's needed**: Either confirm `recentActivity` is sufficient (design
  decision, not dev work) or build a dedicated invoices-list endpoint;
  per-branch chart is blocked on B2.
- **Status**: **Invoices table added 2026-07-17** — reused `fetchOrders()`
  from `orders.api.ts` (already used by the Orders page) for a real "Recent
  Invoices" list: real invoice #, customer_name, total, status
  (completed→Paid, pending→Due, cancelled→Cancelled). `recentActivity`
  stays as a separate additional widget (Sefay-only extra, third row) since
  it covers a broader event set (orders/refunds/alerts) that invoices alone
  don't. **Per-branch chart still blocked on B2** — shows a "Soon — needs a
  real branch system" placeholder instead of fabricated branch names/figures.

### B6 — Payment methods breakdown (mada / Visa / Mastercard / Apple Pay / STC Pay / bank transfer) — ⚠️ VISUAL-ONLY ADDED (2026-07-17)
- **What pos-cloud shows**: A payment-methods donut+legend with generic
  cash/card/bank-transfer/wallet categories.
- **What was actually requested**: A specific 8-method list (Cash, mada,
  Visa, Mastercard, Apple Pay, STC Pay, Bank Transfer, E-Wallet), 2 columns.
- **Why it's a gap**: Sefay's real payment system (`PaymentMethod` type,
  `pos.types.ts`) only has `cash | card | split` at checkout. The dine-in
  checkout flow (`tables.api.ts` `CheckoutDineInInput.payment_method`) does
  accept a broader set (`wallet | mada | visa | mastercard | stc_pay |
  apple_pay`) as real input, so `revenue.by_payment_method` *could* contain
  these keys for tenants using dine-in checkout with those methods — but
  regular POS checkout never produces them, and "bank transfer" doesn't
  exist as an accepted value anywhere.
- **What was done now (2026-07-17)**: Added the full 8-method list to the
  Dashboard's payment card, 2 columns, per explicit user instruction to add
  it "visual only for now." Each row shows a **real** percentage when the
  key exists in `revenue.by_payment_method` with data > 0; otherwise it
  shows a muted "قريبًا / Soon" badge — never a fabricated number.
- **What's needed for full completion**: Confirm/extend POS checkout (not
  just dine-in) to accept the same granular method set, and verify the
  backend's `by_payment_method` aggregation reliably surfaces all 8 keys
  tenant-wide. This is real backend/business-logic work, not styling —
  do it as its own scoped item later, not silently during a visual pass.

### B5 — Full Activity Log page
- **What**: A dedicated `/dashboard/activity-log` page showing the complete
  activity history (the dashboard widget only shows the latest few).
- **Status**: Already tracked as a known future task (see task list item
  "FUTURE: build full Activity Log page"). Not pos-cloud-driven — a
  pre-existing Sefay roadmap item, unrelated to this rebuild's scope.
