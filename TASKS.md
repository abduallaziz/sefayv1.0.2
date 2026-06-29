# Tasks

Detailed specs for proposed and active work. Current high-level status lives in `STATUS.md`.

## In Progress

### Phase 2 Inventory UX Production-Readiness Audit

**Goal:** Bring every Inventory module page (Dashboard, Warehouses, Locations, Stock Levels, Movements, Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments, Reports) to production-ready quality across both UX and business-logic correctness.

**Method:** Code-level audit (no live backend available in this session — see "Known limitation" below) covering: UI consistency, empty/loading/error states, accessibility, table usability, forms, dialogs, filters, search, export, responsiveness, and — where verifiable from code alone — calculations, status transitions, approvals, location handling, and permissions.

**✅ Completed this session:**
- CSV export added to Purchase Orders, Goods Receipts, Transfers, Stock Counts, and Adjustments list pages (previously only Stock Levels had it), via a shared `exportToCsv` utility (`src/shared/utils/exportCsv.ts`).
- Required-field asterisk indicator (`RequiredMark` shared component) added to Warehouse, Location, Adjustment, Transfer, Goods Receipt, Purchase Order, and Stock Count forms so required fields are visible before submission, not only after a failed submit.
- Verified via `tsc --noEmit`, `npm run lint`, `npm run build`, and a local `next dev` smoke check that all changed pages render without errors.

**⚠️ Remaining (from code-level audit, not yet fixed):**
- Inconsistent pagination: Locations and Movements have pagination controls; Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments do not — needs server-side pagination added for parity and to avoid large-list performance issues.
- Inconsistent empty-state treatment: some tables show icon + title + description, others show plain text only — needs a shared `EmptyState` component used everywhere.
- Status badge logic is duplicated with slightly different implementations per table (Purchase Orders, Adjustments, Movements, Reports) — should be consolidated into one shared `StatusBadge` component.
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
