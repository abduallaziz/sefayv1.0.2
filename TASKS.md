# Tasks

Detailed specs for proposed and active work. Current high-level status lives in `STATUS.md`.

## In Progress

### Date-Range Picker Redesign — Compact UI

**Goal:** Replace the heavy two-pane calendar popup (presets sidebar + full month/year-zoomable calendar grid, ~430px wide) used by the shared `DateRangePicker` with a compact, single-column control that visually matches the rest of the ERP's filter inputs.

**✅ Completed:**
- Rebuilt `src/shared/ui/date-range-picker/DateRangePicker.tsx`: popup is now a single 224px-wide dropdown (`w-56`) listing the existing 8 presets (Today/Yesterday/Last 7 Days/Last 30 Days/This Month/Last Month/Last 3 Months/This Year) plus a compact custom-range row using two native `<input type="date">` fields and an Apply button — replacing the custom-built day/month/year calendar grid entirely.
- Trigger button restyled to match the standard Inventory/filter-bar input convention (`border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950`, `#0C447C` focus border) instead of its previous bespoke style.
- Kept the exact same `DateRangePicker` props (`value`, `onChange`, `placeholder`) and the `DateRange` type, so all 5 consumers (`OrderFilters`, `ReportsPage`, `DashboardOverview`, `ReportsAuditPage`, `revenue-chart`) needed no changes — confirmed via `grep` that every usage imports from the same barrel and passes the same shape.
- No external date-picker library was introduced; the codebase had none already in use for this control (`date-fns` is present but unused by this component), so a lighter custom implementation was the correct fit per the requirement to use a library's compact mode only if one was already in place.
- Added `datePicker.apply` translation key to `messages/en.json` and `messages/ar.json` for the new Apply button.
- Verified via `tsc --noEmit`, `npm run lint` (no new warnings/errors introduced — pre-existing unrelated lint issues untouched), `npm run build`, and a local `next dev` smoke check (Orders/Reports pages render correctly with the new compact picker).

**✅ Follow-up completed:** `SingleDatePicker` (used in `CustomerPickerModal`, `CustomerFormModal`) previously still used the older full month/year-zoom calendar grid. It has now been replaced with a lightweight native `<input type="date">`, styled to match the rest of the filter/form inputs — consistent with `DateRangePicker`'s own custom-range fields, which already use native date inputs. Same external props (`value`, `onChange`, `placeholder`, `align`); no consumer changes needed. Verified via `tsc --noEmit`, `npm run lint`, `npm run build`. Merged via PR #22. Every date-picking control in the app is now compact and visually consistent — no large calendar popups remain.

**✅ Follow-up completed (RTL native date-input bug):** native `<input type="date">` elements render their internal day/month/year segments garbled when inherited text direction is `rtl` without an explicit `dir="ltr"` override — this surfaced visibly in the Purchase Order form's "Order Date" field. Root-caused and fixed in two parts: (1) added `dir="ltr"` to the native date inputs inside `SingleDatePicker.tsx` and `DateRangePicker.tsx`'s custom-range fields, centralizing the fix in the shared components themselves; (2) added an optional `className` prop to `SingleDatePicker` and replaced the 4 remaining raw inline `<input type="date">` instances project-wide — `PurchaseOrderFormModal.tsx` (order date, expected date), `MovementsFiltersBar.tsx` (date-from, date-to filters), and `GoodsReceiptLineItems.tsx` (per-row expiration date) — with `SingleDatePicker`, preserving each consumer's exact state-update pattern. Confirmed via project-wide grep that the only remaining `type="date"` occurrences in `src/` are inside the shared date-picker components themselves. Verified via `tsc --noEmit`, `npm run lint` (no new issues in changed files), `npm run build`. Every date field in the project now uses a shared, RTL-safe date-picker component — standing rule going forward: never use a raw `<input type="date">`, always use `SingleDatePicker`/`DateRangePicker`.

**✅ Follow-up completed (reverted to full calendar-grid popup with portal positioning):** the compact native-`<input type="date">` design above was superseded in a later session per updated design direction — both `SingleDatePicker` and `DateRangePicker` were rewritten back to a custom day/month/year-zoomable calendar grid (no native date inputs), but this time rendered through `createPortal(..., document.body)` and positioned via a new shared `useFloatingPosition` hook (`src/shared/ui/date-range-picker/useFloatingPosition.ts`) instead of being laid out inline. `useFloatingPosition` computes `fixed` viewport coordinates (`top`/`left`) from the trigger's `getBoundingClientRect()`, clamping within the viewport and flipping above the trigger when there isn't room below — this fixes two real bugs the old inline-positioned popup had: (1) clipping inside scrollable modal bodies (`overflow-y-auto`/`overflow-hidden` ancestors), and (2) RTL/LTR `left-0`/`right-0` class math pushing the panel off-screen. Same external props/consumers as before — `SingleDatePicker` gained one additive prop (`className`, needed by 3 existing call sites) but otherwise no call-site changes. `DateRangePicker`'s `align` prop is now unused (portal positioning makes it unnecessary) but kept in the type for backward compatibility. **Mobile-overflow fix:** `DateRangePicker`'s presets sidebar + calendar are fixed-width and were overflowing viewports narrower than ~432px; fixed by stacking them vertically (`flex-col`) below the `sm` breakpoint and capping the panel to `max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto` — side-by-side layout on tablet/desktop unchanged. Verified via `tsc --noEmit`, `npm run lint` (held at the pre-existing baseline of 95 problems/77 errors/18 warnings — zero net-new), `npm run build`, and Playwright screenshots at 320/375/768px confirming no horizontal overflow plus portal/RTL/preset/keyboard-open behavior, in both `ar` and `en` locales. **Known pre-existing cosmetic issue, not yet fixed:** the year-range header (e.g. "2027 — 2016") displays with the two bounds visually reversed under `dir="rtl"` because they're separate JSX text nodes subject to bidi reordering — needs an explicit `<bdi>`/`unicode-bidi: isolate` wrap or pre-formatted string to fix.

---

### Confirmation Dialog Consolidation — App-Wide

**Goal:** Ensure every delete/cancel confirmation dialog in the project — not just Inventory — uses the shared, polished `ConfirmDialog` component, so the design is consistent across all modules.

**✅ Completed:**
- Audited the whole project (not just Inventory) for any modal matching the old bespoke confirmation-dialog pattern (`fixed inset-0 ... bg-black/50` overlay + `AlertTriangle` icon + red confirm button).
- Found 4 additional dialogs outside Inventory still using the old pattern: `DeleteSupplierModal`, `DeleteItemModal`, `DeleteCustomerModal`, `CancelOrderModal`. All 4 migrated onto `ConfirmDialog`, preserving each file's existing external prop interface.
- `CancelOrderModal`'s cancellation-reason `<textarea>` is now embedded directly in `ConfirmDialog`'s `message` slot (which accepts `ReactNode`) — same `onConfirm(id, reason)` behavior, no functional change.
- Confirmed via project-wide search that no other delete/cancel/confirmation dialogs remain on the old pattern; the only remaining `fixed inset-0 ... bg-black` matches are create/edit **form** modals (7 in Inventory plus a few elsewhere), which are a separate, already-tracked future milestone, not confirmation dialogs.
- All 9 delete/cancel confirmation dialogs in the app (5 Inventory + Suppliers, Items, Customers, Orders) now share one visually consistent, accessible design.
- Verified via `tsc --noEmit`, `npm run lint`, `npm run build`. Merged via PR #22.

---

### Phase 2 Inventory UX Production-Readiness Audit

**Goal:** Bring every Inventory module page (Dashboard, Warehouses, Locations, Stock Levels, Movements, Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments, Reports) to production-ready quality across both UX and business-logic correctness.

**Method:** Code-level audit (no live backend available in this session — see "Known limitation" below) covering: UI consistency, empty/loading/error states, accessibility, table usability, forms, dialogs, filters, search, export, responsiveness, and — where verifiable from code alone — calculations, status transitions, approvals, location handling, and permissions.

**✅ Completed this session:**
- CSV export added to Purchase Orders, Goods Receipts, Transfers, Stock Counts, and Adjustments list pages (previously only Stock Levels had it), via a shared `exportToCsv` utility (`src/shared/utils/exportCsv.ts`).
- Required-field asterisk indicator (`RequiredMark` shared component) added to Warehouse, Location, Adjustment, Transfer, Goods Receipt, Purchase Order, and Stock Count forms so required fields are visible before submission, not only after a failed submit.
- Status badge logic consolidated: new shared `StatusBadge` component (`src/shared/ui/status-badge.tsx`, tone-based: neutral/info/success/warning/danger/brand) replacing 8 previously duplicated per-feature badge-color implementations across Purchase Orders (list + detail), Goods Receipts, Transfers, Stock Counts, Adjustments, Movements ledger (direction badge), Stock Levels enriched table, and Inventory Reports. Each feature keeps only its small status→tone mapping; rendering/markup is now centralized. Merged via PR #16.
- Empty states consolidated: existing-but-previously-unused shared `EmptyState` component (`src/shared/ui/empty-state.tsx`) extended with a new `inventory` theme (dashed border + brand-tinted icon circle), then wired into all 9 Inventory list tables — Locations and Warehouses (replacing their duplicated inline JSX) plus Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments, Movements ledger, and Stock Levels (list + enriched table) which previously showed plain text-only empty messages. Merged via PR #18.
- Delete/Cancel confirmation dialogs consolidated: new shared `ConfirmDialog` component (`src/shared/ui/confirm-dialog.tsx`) — portal-rendered to `document.body`, `role="alertdialog"`/`aria-modal`/`aria-labelledby`, ESC-to-close (disabled while loading), body scroll-lock, centered icon/title/message layout matching the Sefay design system (`rounded-2xl`, `shadow-2xl`, brand-consistent spacing/typography), with `danger`/`warning` variants driving icon/title/confirm-button color. Wired into all 5 previously-duplicated bespoke modals — `DeleteLocationModal`, `DeleteWarehouseModal`, `CancelPurchaseOrderModal`, `CancelGoodsReceiptModal`, `CancelTransferModal` — each keeping its existing external prop interface so no consumer call sites changed. Merged via PR #20. Subsequently extended app-wide to the 4 remaining non-Inventory confirmation dialogs (Suppliers, Items, Customers, Orders) — see "Confirmation Dialog Consolidation — App-Wide" below. Merged via PR #22.
- Verified via `tsc --noEmit`, `npm run lint`, `npm run build`, and a local `next dev` smoke check that all changed pages render without errors.

**⚠️ Remaining (from code-level audit, not yet fixed):**
- Inconsistent pagination: Locations and Movements have pagination controls; Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments do not — needs server-side pagination added for parity and to avoid large-list performance issues. Confirmed via code search that these 5 features have **no pagination plumbing at all** (no `page`/`pageSize` fields) in their types/hooks/api layers, unlike Locations/Movements — so this is a data-layer change, not just a UI swap onto the shared `Pagination` component.
- Form modals (7: Warehouse, Location, Adjustment, Purchase Order, Transfer, Goods Receipt, Stock Count create/edit forms) are all custom, near-identical implementations with no shared wrapper — should be consolidated into a shared form-modal wrapper (existing-but-unused `src/shared/ui/modal.tsx` / `dialog.tsx`). **Next planned milestone.**
- No column sorting on any list/ledger table (e.g. Movements ledger, 11 columns, no sort).
- Responsive breakpoint inconsistency: some tables switch to card view at `sm:`, others at `md:` — should standardize.
- No disabled/locked visual state for action buttons when the current user lacks permission (buttons are only gated by data-completeness, not role).
- i18n pluralization not used for counts (e.g. "1 totalLocations" instead of singular).

**📋 Future enhancements (lower priority / out of current Phase 2 scope):**
- Table virtualization for very large inventory datasets.
- Keyboard-navigable sortable headers with persisted sort state.
- Centralized empty/loading/error state primitives reused app-wide (beyond Inventory).

**Known limitation — live workflow execution not performed:** Executing Create/Edit/Delete/Approve/Post workflows end-to-end (as opposed to reading the code) requires a running apiv1.0.2 backend. That backend's migration/seed scripts (`src/database/migrate.ts`) are hard-wired to a specific Supabase project (`uugxagglmkxcjmncxgja`) and require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ACCESS_TOKEN` env vars that were not available in this sandboxed session, and there is no local-Postgres fallback path. Business-logic bugs that can only be found by exercising real workflows (e.g. stock-level recalculation on goods receipt posting, approval-state transitions, transfer dispatch/receive flow) were **not** verified live and remain open until a session with real backend credentials (or a staging Supabase project) is available.

## Deferred

### Company Factory Reset

**Goal:** Reset a company back to a brand-new state, as if it had just signed up — without losing the owner account, subscription, or base system configuration.

**Trigger location:** System Settings → Advanced Tools, visible to **Owner role only**.

**What survives the reset:**
- Owner account
- Company record
- Subscription
- Plan
- Base system settings (language, currency, timezone)

**What gets wiped:**
- Users (admins, employees, cashiers) — only Owner remains
- Branches (full delete)
- Warehouses (full delete)
- Locations (full delete)
- Products (full delete)
- Categories (full delete)
- Customers (full delete)
- Suppliers (full delete)
- Inventory: levels, movements, reservations, counts, adjustments, transfers, goods receipts — all reset to zero
- Sales (full delete)
- Purchases (full delete)
- Accounting: journal entries, operating accounts, payments — all deleted
- Reports — recalculated to zero/empty state
- Dashboard — resets as if the customer just signed up

**Confirmation flow (must be Owner-gated, multi-step):**
1. Button: `Factory Reset`
2. Warning modal:
   > ⚠️ This action cannot be undone.
   > Your company will be reset to a brand-new state.
   > Only the Owner account and subscription information will remain.
3. Type-to-confirm: user must type `RESET MY COMPANY` exactly to enable the action button.
4. Re-enter password to authorize execution.

**Execution requirements:**
- Entire wipe runs inside a single database transaction.
- Any failure triggers a full rollback — the system must never end up in a partially-reset state.

**Post-reset experience:**
- Replace the usual toast/snackbar with a full onboarding wizard, e.g.:
  > Welcome back! Your company has been successfully reset. Let's set up your business.
- Wizard steps: create branch → create warehouse → (optionally) create first additional user → or skip straight to the dashboard.

**Why it matters:** not just a dev/admin utility — useful for real company owners after a trial period with test data, or to relaunch a business cleanly. Differentiator vs. competing systems.

**Open questions / follow-up before implementation:**
- Confirm which backend tables/services own each entity above (apiv1.0.2) so the transaction script covers every table without missing soft-deleted or audit-log data.
- Decide whether audit/history logs of the reset itself should be retained (for support/compliance) even though everything else is wiped.
- Define exact permission check (Owner role only — confirm this maps to an existing role enum in apiv1.0.2).

## Future Roadmap (Planned — Not Started)

Documentation-only audit. No code in this section has been implemented; each phase is scoped here so future sessions have an agreed starting spec instead of re-deriving requirements. Phases are intentionally ordered by dependency (e.g. Barcode & Scanning before Smart Product Creation, since the latter is triggered by an unrecognized scan) but are independent epics — none blocks current Phase 2 Inventory UX work.

### Phase 3 — Barcode & Scanning

**Goal:** Let warehouse/POS staff drive every Inventory transaction type (count, receipt, transfer, adjustment) by scanning instead of manual line-item entry, and let products carry real-world barcode data.

- **Barcode Scan Mode** — a global, toggleable input mode (likely a persistent bottom-sheet or focus-trapped hidden input) that captures scanner/keyboard-wedge input app-wide and routes the decoded barcode to context-aware handlers depending on which screen is active.
- **Count by Scan** — within Stock Counts, scanning a barcode locates (or prompts to add) the corresponding count line and increments/sets its counted quantity, instead of searching the product list manually.
- **Goods Receipt by Scan** — within Goods Receipts, scanning adds/increments a line item for the matched product (and, where serial/expiry tracking is enabled, prompts for those fields per the existing `GoodsReceiptLineItems` per-row fields).
- **Transfer by Scan** — same pattern applied to Transfers: scan at source location to add to the outgoing list, scan at destination to confirm receipt.
- **Adjustment by Scan** — same pattern applied to Adjustments: scan to locate the product/location pair, then enter the quantity delta and reason.
- **Barcode Import** — bulk-assign/import barcodes for existing products via CSV (reusing the existing `exportCsv` utility's counterpart import path), for catalogs migrating from another system.
- **Unknown Barcode Assistant** — when a scan doesn't match any known barcode, present a modal offering: create a new product (→ Smart Product Creation, Phase 4), link the barcode to an existing product, or ignore/retry. This is the integration seam between Phase 3 and Phase 4.
- **Multi Barcode per Product** — data model change: a product needs a one-to-many barcode relationship (e.g. a `product_barcodes` table: `product_id`, `barcode`, `type`, `is_primary`) instead of a single `barcode` column, to support case/pallet/unit barcodes and legacy/replacement codes on the same SKU.
- **Barcode / QR Printing** — generate and print barcode/QR labels for a product or batch of products; feeds into the Document & Print Designer (Phase 10) as one of its template types rather than a bespoke printing path.
- **Shelf Labels** — a specific label template (product name, price, barcode, location) sized for shelf-edge label printers; another Document & Print Designer (Phase 10) template, not a separate feature.
- **Mobile Camera Scanner** — fallback scan input using the device camera (e.g. `@zxing/browser` or the native `BarcodeDetector` API where supported) for staff without dedicated hardware scanners; feeds into the same Barcode Scan Mode handler as hardware-scanner input.
- **Offline Scan Mode** — queue scans locally (IndexedDB) when the network is unreachable and sync once connectivity returns; needed for warehouses with poor connectivity. Requires a conflict-resolution policy (e.g. last-write-wins per line, or a manual reconciliation review) to be defined before implementation.
- **Barcode Templates (GS1, Code128, EAN13, UPC, QR)** — the label/printing system must support generating and rendering each of these symbologies; GS1-128 in particular needs Application Identifier (AI) support for batch/lot/expiry-encoded barcodes used in goods-receipt scanning.

### Phase 4 — Smart Product Creation

**Goal:** Turn "scanned a barcode we don't recognize" into a fast, low-friction product-creation flow instead of a dead end.

- **Create Product from unknown barcode** — the primary action surfaced by the Unknown Barcode Assistant (Phase 3): opens the existing product create form pre-filled with the scanned barcode in the new multi-barcode field.
- **Link Existing Product** — the alternative action from the same assistant: search/select an existing product and attach the scanned barcode to it (writes a new `product_barcodes` row) instead of creating a duplicate.
- **AI-assisted Product Creation** — given a barcode (and optionally a photo), call an AI provider to suggest product name, category, unit, and description for the human to review/edit before saving — review-before-save is mandatory, no auto-save of AI output. Shares its provider/config plumbing with the AI Features phase (Phase 8) rather than having its own separate integration.
- **Product lookup from barcode databases** — query an external barcode-database API (e.g. UPCitemdb, GS1 lookup, or a regional equivalent) to pre-fill product details from the barcode alone, as a faster alternative/complement to the AI-assisted flow above. Needs a decision on which provider(s) to integrate and how API costs/rate-limits are handled per tenant.

### Phase 5 — Inventory Intelligence

**Goal:** Move Inventory from a transactional system of record to one that surfaces insight and recommends action, without requiring the user to build their own reports.

- **Product Activity Timeline** — a per-product chronological feed of every movement/adjustment/transfer/receipt/sale touching that SKU, sourced from the existing `movements` ledger (already used by `MovementsLedgerTable`) filtered to one product — primarily a new UI view over existing data, not a new data model.
- **Inventory Health Score** — a composite per-product or per-warehouse score (e.g. weighted combination of stockout frequency, overstock days, dead-stock flag, count-accuracy variance) — needs the scoring formula and weight tuning defined with the business before implementation; this is a derived/calculated metric, not raw stored data.
- **Inventory Snapshot by Date** — point-in-time reconstruction of stock levels as of any past date, for audit/reporting purposes. Two viable approaches to evaluate: (a) periodic snapshot table populated by a scheduled job, or (b) replaying the `movements` ledger backward/forward from the current balance — (b) avoids extra storage but is more expensive to query for old dates; needs a decision before implementation.
- **Undo Last Inventory Operation** — a time-boxed (e.g. 5-minute) reversal action for the most recent stock-affecting operation (adjustment, transfer, count post, receipt post) performed by the current user, implemented as an explicit compensating transaction (not a hard delete) so the audit trail is preserved.
- **Smart Inventory Dashboard** — an upgraded `InventoryDashboardPage` surfacing the metrics below (Dead/Fast/Slow-Moving, Overstock, ABC class, Health Score, Smart Alerts) in one view instead of requiring separate report pages.
- **Smart Alerts** — rule-based notifications (low stock below reorder point, dead stock detected, count variance over threshold, expiring-soon batches) — needs a notification-delivery decision (in-app only vs. email/push) and a rules-configuration UI.
- **Smart Reorder Suggestions** — given sales/usage velocity and current stock, suggest reorder quantity and timing per product; a natural consumer of, and possible precursor to, an automated purchase-order draft feature (out of scope here, just noting the dependency).
- **Dead Stock** — products with zero movement over a configurable lookback window (e.g. 90/180 days) and stock > 0.
- **Fast Moving** / **Slow Moving** — classification by movement velocity over a lookback window; thresholds need to be configurable per business type rather than hardcoded.
- **Overstock** — stock level significantly above a defined reorder/max threshold for the product.
- **ABC Analysis** — classic inventory classification by contribution to revenue/usage (A = top ~80% of value, B/C = the rest by Pareto bands); a reporting computation over existing sales + stock data, surfaced as a new `InventoryReportsPage` report.

### Phase 6 — Warehouse Management

**Goal:** Give multi-location/multi-shelf warehouses the operational tooling they currently lack beyond flat location lists.

- **Cycle Counting** — scheduled, partial (subset-of-locations or subset-of-products) stock counts on a rotation, distinct from the existing full Stock Counts feature which assumes counting everything at once; needs a new schedule/rotation concept in the data model.
- **Warehouse Heatmap** — visual density/activity map of a warehouse's locations (e.g. color-coded by pick frequency or stock value) — requires the Tree View / spatial location model below to exist first, since a heatmap needs a notion of physical layout, not just a flat location list.
- **Shelf Capacity** — track max capacity per location/shelf and surface over-capacity warnings; needs a new `capacity` field on the location model plus a check on receipt/transfer-in operations.
- **Smart Picking** — suggest an optimal pick path/order across multiple locations for an outgoing order, to minimize walking distance; depends on the spatial layout data from Tree View / Warehouse Heatmap below.
- **Smart Receiving** — suggest optimal put-away location(s) for incoming goods-receipt lines based on existing stock placement, product category, and shelf capacity.
- **Drag & Drop Location Management** — a visual editor for rearranging the location hierarchy (move a shelf between aisles, etc.) instead of the current flat `LocationsTable` CRUD-only UI.
- **Tree View Locations** — hierarchical (warehouse → zone → aisle → shelf → bin) visualization of locations, replacing/augmenting the current flat `LocationsTable`; this is the prerequisite data-model and UI work for Warehouse Heatmap and Smart Picking above.
- **Product Stock Card** — a per-product, per-location ledger card view (running balance over time, similar to an accounting ledger card) — a focused subset of Product Activity Timeline (Phase 5) scoped to one location.
- **Available vs Reserved vs On-Hand** — split the single stock-level number into three tracked quantities (`on_hand`, `reserved`, `available = on_hand - reserved`) so that orders/transfers in progress don't oversell stock that's already committed elsewhere. This is the data-model prerequisite for Reservation Management below and likely the most foundational item in this phase.
- **Reservation Management** — explicit reservation records (order/transfer holds a quantity at a location until fulfilled or released), built on top of the on-hand/reserved/available split above.

### Phase 7 — Productivity

**Goal:** Reduce clicks/time for the highest-frequency Inventory actions; these are UX-layer improvements, not new data models.

- **Quick Product Creation** — a lightweight inline/modal product-create form (name + barcode + price + category only) for use mid-workflow (e.g. mid-goods-receipt) without leaving the current screen, vs. the full multi-tab product form.
- **Quick Actions** — a per-row or global action menu (e.g. "Adjust stock", "Transfer", "View ledger") surfaced contextually on Stock Levels / product rows, reducing navigation hops.
- **Bulk Actions** — multi-select rows in list tables (Items, Stock Levels, Purchase Orders, etc.) to apply one action (export, status change, delete) to many rows at once — needs a shared multi-select/bulk-toolbar pattern, ideally added to the shared table primitives rather than per-feature.
- **Global Inventory Search** — a single search box (likely in the shell header) that searches across products, locations, and recent transactions simultaneously, vs. today's per-page filters only.
- **Saved Filters** — let users save a named filter combination (e.g. "Low stock in Warehouse A") for one-click reuse — needs a small per-user persistence store (could be a new lightweight backend table or `localStorage` for a first pass).
- **Recent Filters** — automatically remember and surface the last N filter combinations used on a page, no explicit save action required.
- **Favorite Products** — per-user starring of frequently-used products for quick access in pickers/search.
- **Column Manager** — let users show/hide/reorder table columns on the larger list tables (Stock Levels enriched table, Movements ledger) and persist the choice — needs a shared column-config primitive, not per-table bespoke logic.
- **Keyboard Shortcuts** — global shortcuts for common actions (e.g. `/` to focus search, `n` for new record) with a discoverable shortcut-help overlay (e.g. `?`).

### Phase 8 — AI Features

**Goal:** Add an AI assistant layer over Inventory data for natural-language Q&A and proactive recommendations, sharing one provider integration rather than ad-hoc per-feature AI calls.

- **AI Inventory Assistant** — a chat-style assistant (likely a docked panel, similar pattern to `command-palette.tsx`) that can answer questions about current inventory state and trigger read-only lookups; write actions (if any) must go through normal confirmation flows, never directly from assistant output.
- **Inventory analysis and recommendations** — periodic or on-demand AI-generated summaries (e.g. "3 products are trending toward stockout this week") — should consume the same metrics computed for Phase 5 (Smart Alerts, Dead/Fast/Slow-Moving, ABC Analysis) rather than recomputing them independently.
- **Natural language inventory queries** — translate a free-text question (e.g. "كم عدد القطع المتبقية من المنتج X في مستودع الرياض؟") into a structured query against the existing Inventory API, in both Arabic and English. Needs a decision on which LLM provider/model to standardize on app-wide (shared with AI-assisted Product Creation in Phase 4) before implementation, plus a data-privacy review of what tenant data is sent to the provider.

### Phase 9 — Company Branding & Information

**Goal:** Let each tenant configure their legal/branding identity once and reuse it everywhere documents are generated (invoices, purchase orders, labels) — currently `SettingsPage` only exposes company name, currency, tax rate, and customer-capture toggle; none of the fields below exist yet in the settings UI or (as far as verified from the frontend) the backend profile model.

**Company Branding:**
- **Company Logo** — primary logo, used in document headers and the app shell.
- **Secondary Logo** — alternate/monochrome logo variant for contexts where the primary doesn't fit (e.g. dark backgrounds, thermal receipt printing).
- **Company Stamp** — an official stamp/seal image, commonly required on printed invoices/POs in Saudi/GCC business practice.
- **Manager Signature** — image of the manager's signature for use on approval-requiring documents.
- **Accountant Signature** — same, for the accountant role.
- **QR Code** — for Saudi e-invoicing (ZATCA) compliance, a QR code encoding seller/VAT/invoice data is typically required on simplified tax invoices — this needs explicit confirmation of ZATCA Phase 2 (integration phase) requirements before implementation, since the QR payload format is regulated, not freeform.
- **Watermark** — optional background watermark image/text for draft or internal-use document variants.

**Company Information:**
- **Legal Name**, **Trade Name** — distinct fields; many GCC businesses operate under a trade name different from the registered legal entity name.
- **VAT Number** — required for ZATCA-compliant invoicing; should be validated against the Saudi VAT number format.
- **Commercial Registration**, **Tax Registration** — registration numbers for legal/tax document footers.
- **Address**, **Phone**, **Email**, **Website** — standard contact/letterhead fields.
- **IBAN**, **SWIFT** — banking details for invoice payment instructions.
- **Social Links** — optional social media links for marketing-facing documents (quotations, branded receipts).

All of the above are inputs/assets that the Document & Print Designer (Phase 10) needs as bindable "company" fields/images — this phase is effectively the data-entry prerequisite for that phase's template variables, and should land before or alongside Phase 10's first templates rather than after.

### Phase 10 — Document & Print Designer (Standalone Phase)

**Goal:** A reusable, drag-and-drop document/template engine shared by every module that currently needs (or will need) printed/exported output — invoices, purchase orders, warehouse/inventory documents, labels, kitchen/service tickets — instead of each feature building its own one-off print view. Positioned as a lightweight, ERP-embedded equivalent of a Canva/PowerPoint-style editor: drag elements onto a canvas, bind them to data fields, preview live, and save as a reusable template per document type.

**Core engine:**
- **Drag & Drop Designer** — canvas-based editor (text blocks, images, tables, barcodes/QR, dividers) with snap/align guides; needs a decision on the underlying canvas tech (e.g. an HTML/CSS-based absolute-positioned layout vs. a `<canvas>`/SVG renderer) before implementation, since that choice drives both the editor and the print/PDF output pipeline.
- **Live Preview** — real-time rendering of the template with sample or real bound data as it's being edited.
- **Dynamic Fields** — bindable placeholders (e.g. `{{company.legal_name}}`, `{{invoice.total}}`, `{{customer.name}}`) resolved against the relevant entity at render/print time — this is the integration point with Phase 9's company fields and each feature's existing data models.
- **Conditional Printing** — show/hide a block based on a data condition (e.g. only show the VAT breakdown row if `tax_rate > 0`, only show the stamp on finalized documents not drafts).
- **Custom Components** — reusable, named sub-blocks (e.g. a "totals table" component) that can be inserted into multiple templates and updated centrally.
- **Multiple Paper Sizes** — A4, thermal receipt widths (58mm/80mm), label sizes, etc. — the canvas/print pipeline must be paper-size-aware from the start, not retrofitted.
- **Print Profiles** — saved printer/paper-size/margin configurations per document type or per device, so staff don't have to reconfigure print settings every time.
- **Multi-language Templates** — a template can have per-locale text content (ar/en at minimum, matching the app's existing `next-intl` locales) while sharing the same layout and bound fields.
- **PDF Designer** / **PDF export** — render any template to PDF for download/email/archival, not just direct printing.
- **Email Templates** — the same engine reused for transactional email bodies (e.g. emailing an invoice), sharing the dynamic-fields/data-binding system with print templates.

**Template library (built on the core engine above — not separate features):**
- **Multiple Templates** — support more than one saved template per document type (e.g. two different invoice layouts), with a default-template selector.
- **Invoice Templates**, **Quotation Templates**, **Purchase Order Templates** — sales/purchasing document types.
- **Warehouse Documents**, **Inventory Documents** — e.g. goods-receipt notes, transfer slips, stock-count sheets, adjustment vouchers.
- **Receipt Templates**, **Kitchen Tickets**, **Service Tickets** — POS/service-flow output (kitchen tickets in particular need fast, minimal-layout thermal printing, likely a constrained template subset rather than the full designer).
- **Label Templates** — shares its barcode/QR rendering with Phase 3's Barcode/QR Printing and Shelf Labels, rather than reimplementing symbology rendering separately.
- **Template Marketplace (future)** — explicitly out of scope for the initial engine; noted here only so it isn't lost — a later phase where pre-built templates (possibly from other tenants or Sefay-provided) can be browsed/installed, which implies a template-sharing/versioning data model not needed for the first release.

**Why standalone:** every other roadmap phase that produces a physical or digital document (barcode labels in Phase 3, invoices/POs across existing Sales/Purchasing, warehouse paperwork in Phase 6) depends on this engine existing rather than building its own renderer — this phase should be scoped and resourced as core platform infrastructure, not as a sub-task of any one feature module.
