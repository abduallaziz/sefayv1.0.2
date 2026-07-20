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

### B7 — Cart panel: inline gift-card / loyalty-points fields — ✅ RESOLVED (2026-07-17)
- **What pos-cloud's reference shows**: Gift-card code field and a "use
  loyalty points" checkbox inline in the cart panel, above the totals,
  alongside the coupon field.
- **Original gap**: Sefay's real gift-card validation (`giftCardsApi.validate`)
  and loyalty-point redemption both existed — but only inside
  `PaymentModal.tsx`. Duplicating that state into `CartPanel.tsx` would have
  meant two independent copies of the same real logic (risk of desync).
- **Resolution (2026-07-17)**: Lifted `giftCardCode`/`giftCardApplied`/
  `giftCardAmount`/`giftCardError`/`validatingGiftCard`/`redeemPoints` state
  and `handleApplyGiftCard`/`handleRemoveGiftCard` up from `PaymentModal`
  into `POSPage.tsx`, passed down as props to both `CartPanel` (new inline
  accordion row) and `PaymentModal` (unchanged confirm-time UI, now reading
  the same shared state instead of its own local copies). One real,
  server-validated source of truth, no duplicate logic.

### B8 — Order notes (note presets) — ✅ MIGRATION APPLIED (2026-07-17)
- **What**: A dedicated "order notes" feature — cashier picks from a
  tenant-managed preset list or writes a custom note at checkout, saved to
  the existing real `Order.notes` field. Full scope per explicit user
  decision (not a UI-only placeholder): real DB table, full CRUD + reorder
  API, admin management page, POS tabbed UI.
- **What's built**: `note_presets` table + RLS + `note_presets.manage`
  permission (migration `091_order_note_presets.sql`, apiv1.0.2), full
  `NotePresetsModule` (repository/service/controller/DTOs, mirrors the
  `coupons` module exactly) — see apiv1.0.2 STATUS.md §90. Admin page at
  `/dashboard/note-presets` (add/edit/delete/reorder/enable-disable). 4th
  accordion row in `CartPanel.tsx` with "choose from list" (multi-select
  checkboxes) / "write a note" (Textarea) tabs — the result joins into
  `Order.notes` at checkout via `POSPage.tsx`'s `finalNotes`, no contract
  change. All code pushed to `main` on both repos; Railway auto-deployed the
  backend (confirmed via `curl` on `/note-presets/active` → `401`, meaning
  the route is live and guarded).
- **Migration status**: `091_order_note_presets.sql` was run manually by the
  user in the Supabase SQL Editor on 2026-07-17 (confirmed: `✅ Applied:
  091_order_note_presets.sql`, 20:15:17). The `note_presets` table now
  exists in production. Backend route sanity-checked post-migration via
  `curl` on `/note-presets/active` → still `401` (guard active, route
  live) — full authenticated verification (admin page CRUD + POS "choose
  from list" tab actually listing a real preset) still needs the user's
  own logged-in browser session, since Claude cannot log in.

### B5 — Full Activity Log page
- **What**: A dedicated `/dashboard/activity-log` page showing the complete
  activity history (the dashboard widget only shows the latest few).
- **Status**: Already tracked as a known future task (see task list item
  "FUTURE: build full Activity Log page"). Not pos-cloud-driven — a
  pre-existing Sefay roadmap item, unrelated to this rebuild's scope.

### B9 — Edit invoice/order — ⚠️ BUTTON ADDED, DISABLED (2026-07-20)
- **What**: An "Edit" action on `OrderDetailsModal` to modify an existing
  order (items/quantities/discount, per the user's own framing "تعديل
  كامل" as the intended eventual scope).
- **Why it's a gap**: No backend endpoint exists to update an existing
  invoice — `InvoicesController` only has `create` and
  `@Patch(':id/cancel')`. Editing a posted invoice also has real business
  implications (stock already deducted, shift totals already counted,
  reports already reflect it) that need actual design, not just a route.
- **Done so far**: Added a disabled "تعديل" action (with a "قريباً" tooltip)
  and a "إلغاء" action, moved out of `OrderDetailsModal` per explicit user
  request ("الافضل أرى ان نخرج زر الغاء وتعديل الى الرئيسيه ونضع مكانهم زر
  طباعه") — the details modal's footer now shows a "طباعة" (Print,
  `window.print()`) button instead. Actions were then consolidated into a
  single kebab-menu dropdown (`MoreVertical` trigger, `DropdownMenu` from
  `shared/ui/dropdown`) in `OrdersTable.tsx` per a reference screenshot the
  user shared of a similar table's actions-dropdown pattern (2026-07-20),
  in both the desktop table's actions column and the mobile card header.
- **Still open**: Full backend design (what's editable on a posted order,
  how it re-affects stock/shift/reports) + `PATCH /invoices/:id` endpoint +
  real edit form UI.

### B10 — Invoice details: accounting journal entry + PDF download/send — ⚠️ VISUAL-ONLY PLACEHOLDERS (2026-07-20)
- **What**: `OrderDetailsModal` was redesigned per a reference screenshot
  the user shared (a richer invoice-detail layout: info cards, items table,
  notes/financial-summary split, an accounting journal-entry row, and
  footer actions for downloading/sending a PDF and viewing as a receipt).
- **Why it's a gap**: No accounting/ledger module exists (no journal entry
  data tied to an invoice), and there's no PDF generation/email-sending
  backend for invoices.
- **Done so far**: Per explicit user instruction ("نعمل الشكل الكامل
  ونجعله قريبا" — build the full shape, mark it as coming soon), the full
  visual layout was built, but the journal-entry row and the
  download/send-PDF buttons are disabled with a "قريباً" badge/tooltip —
  no fake data anywhere. Only "طباعة" (Print, `window.print()`) is real,
  reusing the browser-print pattern already used in `ReceiptModal`.
- **Still open**: A real accounting/ledger module (journal entries per
  invoice) and PDF generation + email-sending backend, before these
  buttons can be wired up.

### B11 — Orders table: full layout parity with reference (filters bar, journal-entry column, pagination) — ✅ DONE, with real gaps flagged (2026-07-20)
- **What**: `OrdersTable`/`OrderFilters`/`OrdersPage` were rebuilt to match
  a reference table screenshot the user shared: pill-style filters bar
  (reset, more, branch, status, payment method, period, search), reordered
  columns (kebab actions, date+cashier, journal entry, status dot, payment
  method icon pill, amount, customer avatar, invoice # as a link), and a
  full pagination footer (page-size select, "from–to of total", numbered
  pager).
- **What's real vs. placeholder**: Pagination is fully real — it paginates
  client-side over the actual fetched/filtered `orders` array, so
  "من X إلى Y من Z نتيجة" always reflects a true count, not a mock number
  (per explicit user direction: "ابني نفسه الشكل اذا في باك اند نخليه
  قريباً" — build the same shape, mark backend-less parts "Soon"). The
  "المزيد" (more filters) and "الفرع" (branch) filter buttons are disabled
  with a "قريباً" tooltip: no additional filter set is designed yet, and no
  real multi-branch data model exists (same gap as B2). The journal-entry
  column cell is a disabled dash placeholder for the same reason as B10.
- **Still open**: B2 (real branch backend) and B10 (accounting ledger)
  remain the actual blockers for the branch filter and journal-entry
  column respectively.

### B12 — Customers table: full layout parity with reference (columns reordered, loyalty points parked) — ✅ DONE, with real gaps flagged (2026-07-20)
- **What**: `CustomersTable` was rebuilt to match a reference table
  screenshot the user shared: kebab actions column, status badge (نشط/
  معطّل, real — reused the existing `Customer.is_active` field), last
  operation date/amount, total purchases, invoice count, customer
  classification, email, phone, and a customer identity cell (avatar +
  name + `#CUST-XXXXXX` derived from the real id) — in that column order.
- **Why "last operation" and "classification" are gaps**: `Customer` has
  no last-order date/amount aggregate (would need a new backend
  aggregate, same category of gap as B1) and no company/individual
  classification field. Both are disabled dash placeholders with a
  "قريباً" tooltip — no fabricated dates/amounts/labels.
- **Real feature parked**: The previous desktop table showed a loyalty
  points column (star icon + `Customer.loyalty_points`, real data) and
  the mobile card showed it too. The reference layout has no room for it,
  so it was dropped from `CustomersTable` per rule 4 (park, don't delete)
  — `loyalty_points` is still fetched and available on `Customer`, just
  not rendered in this table right now. Still visible elsewhere (customer
  details modal). Needs a decision on where to reintroduce it (e.g. as a
  detail-view metric only) in a later consolidation pass.
- **Still open**: A last-order aggregate endpoint and a customer
  classification field/UI, before those two columns can go live.

---

## Decisions Log — tried and explicitly rejected/reverted

Not gaps or pending work — approaches that were built, shown to the user,
and explicitly reverted. Logged so they aren't tried again unprompted.

### ItemGrid product card height: adaptive (`grid-auto-rows: minmax(190px, 1fr)`) — ❌ REVERTED (2026-07-17)
- **What was tried**: Per an explicit user request to make the page control
  card height instead of a fixed pixel height, `ItemGrid.tsx`'s grid used
  `style={{ gridAutoRows: 'minmax(190px, 1fr)' }}` with each card's image
  area as `flex-1` (grows to fill whatever row height the grid gives it).
- **Why reverted**: When a tenant's product/category filter results in only
  one row of cards, that single row stretches to fill the *entire* remaining
  container height, and since the image is `flex-1`, the product photos
  stretched into tall, awkward portrait crops. User confirmed via screenshot
  and asked to revert.
- **Current state**: Back to the fixed `height: 240px` card / `height: 185px`
  image (the "premium product card" spec from earlier in this rebuild).
  If page-driven card sizing is revisited later, it needs a **max** row
  height cap (not just a min) so a single row can't stretch indefinitely —
  this was offered to the user but not yet approved.

### POS mobile/desktop layout: independent fixed-vh scroll boxes — ❌ REVERTED (2026-07-17)
- **What was tried**: To keep the checkout button reachable, the cart panel
  (and separately the items grid) were each given a fixed `vh` height with
  their own internal `overflow-y-auto`, nested inside the dashboard shell's
  already-scrollable `<main>`.
- **Why reverted**: Three competing/nested scroll containers produced a
  visibly broken layout — the cart panel appeared to float over/cover the
  product grid on mobile, and clipped the checkout button entirely on
  desktop once accordion content grew past the fixed row height.
- **Current state**: Mobile is a normal flowing page (no forced heights,
  scrolled once by the shell's `<main>`); desktop keeps the fixed two-pane
  layout but the cart column is bounded to the row's actual height
  (`lg:h-full`) and scrolls internally (`lg:overflow-y-auto`) — a single,
  correctly-nested scroll region instead of three.
