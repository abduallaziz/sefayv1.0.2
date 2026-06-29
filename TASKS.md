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
