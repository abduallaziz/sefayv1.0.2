# Migration Manifest — Live Tracker

Date: 2026-07-16
Status: LIVE — update after every Matrix item.

## Completed Items

| ID | Title | Checkpoint |
|---|---|---|
| A1, A3 | Tailwind token additions (`posCloud`/`posCloudDark`) | Checkpoint 1 |
| D1–D6 | Design system primitives (button, card, status-badge, switch, date-range-picker, dialog, dropdown, select, sheet, tabs, tooltip, avatar, data-table, page-header, section-card, empty-state, location-map-picker) | Checkpoint 1 |
| C1 | DashboardHeader | Checkpoint 2 |
| C2 | DashboardSidebar | Checkpoint 2 |
| C3 | DashboardLayout (width-offset fix) | Checkpoint 2 |
| C4 | Dashboard Shell Positioning Model | Checkpoint 2 |
| E1 | input.tsx | Checkpoint 3 |
| E2 | modal.tsx — Skipped (Dead Component), logged as deletion candidate AF-6 | Checkpoint 3 |
| E3 | confirm-dialog.tsx | Checkpoint 3 |
| E4 | separator.tsx — Skipped (Dead Component), logged as deletion candidate AF-7 | Checkpoint 3 |
| E5 | Skeleton (scope corrected to `shared/components/ui/Skeleton.tsx`) | Checkpoint 3 |
| E6 | number-input.tsx — No Action Required (no color classes exist) | Checkpoint 3 |
| E7 | stat-card.tsx — Skipped (Dead Component), logged as deletion candidate AF-9, supersedes DEF-4 | Checkpoint 3 |
| F1 (planning) | POS Page — size assessment, split into F1.1–F1.6 | Checkpoint 4 |
| F1.1 | POS Page Shell — deployed to production, visual review approved | Checkpoint 4 |
| F1.2 | Item Grid | Checkpoint 4 |
| F1.3 | Cart Panel — checkout button swapped to shared Button primitive — deployed to production (`bbf40c4`), pending visual review | Checkpoint 4 |
| F1.4 | Payment Modal — Cancel/Confirm swapped to shared Button primitive | Checkpoint 4 |
| F1.5 | Receipt Modal — Print/New Order swapped to shared Button primitive | Checkpoint 4 |
| F1.6 | Customer Picker Modal — Cancel/Save swapped to shared Button primitive | Checkpoint 4 |

## F1 — POS Page

- **Status**: Complete
- **Production validated**: Yes
- **Deployment**: `755ab1f`
- Children: F1.1 (Shell), F1.2 (Item Grid), F1.3 (Cart Panel), F1.4 (Payment Modal), F1.5 (Receipt Modal), F1.6 (Customer Picker Modal) — all Done.

## F2 — Products/Items Page

- **Status**: Complete
- **Production validated**: Pending (deploying now)
- Children: F2.1 (Shell, Total Products stat tile), F2.2 (Item Filters), F2.3 (Items Table), F2.4 (Item Form Modal), F2.5 (Variants Modal), F2.6 (Delete Item Modal) — all Done.
- Final visual-quality check performed (single stat tile kept, natural-width, not forced into empty grid).

## Current Item

F2 fully complete. Deploying to production for user's visual review, then awaiting approval before F3.

## Remaining Items

See `02_MIGRATION_MATRIX.md` for full detail:
- F3–F11: remaining feature pages (Orders, Customers, Suppliers, Expenses, Reports, Settings, Tables, Kitchen, Inventory-suite)
- Sefay-only pages (no pos-cloud reference): shifts, users/employees, attendance, schedules, payroll, leaves, coupons, gift-cards, loyalty-tiers, invoices, access-control, onboarding, superadmin/*, attend

## Checkpoints

- **Checkpoint 1** (Design System primitives, D1–D6): Complete.
- **Checkpoint 2** (Dashboard Shell, C1–C4): Complete.
- **Checkpoint 3** (remaining Design System primitives, E1–E7): **Complete.** Final tally: E1 Done, E2 Skipped (dead), E3 Done, E4 Skipped (dead), E5 Done (scope-corrected), E6 No Action Required, E7 Skipped (dead).
- **Checkpoint 4** (Feature Pages, F1–F11 and Sefay-only pages): In progress. **F1 (POS Page) Complete** — Deployment: `755ab1f`. **F2 (Products/Items) Complete** — deploying now.

## Progress

Shell: 100% (4/4 items). Design System: 100% resolved (7/7 E-series items — 3 styled, 3 confirmed dead/deleted-candidate, 1 no-action-needed; plus 16 from D1–D6/E1/E3/E5 total actually restyled). Feature Pages: F1 (POS Page) 100% complete (6/6 children). F2 (Products/Items) 100% complete (6/6 children). 0/9 remaining feature pages started (F3–F11), not yet fully sequenced.

## Temporary Deviations

None open.

## Open Blockers

None blocking Checkpoint 4 progress. Five deletion candidates / gaps deferred (not blockers):
- AF-6 (`modal.tsx`), AF-7 (`separator.tsx`), AF-8 (`shared/ui/skeleton.tsx`), AF-9 (`stat-card.tsx`) — all dead code, all deferred to the same future cleanup task, after the UI migration completes.
- AF-10 (Products page stat cards — Low Stock/Out of Stock/Total Value): Content/Data Gap, requires new stock-aggregate data that doesn't exist on the frontend yet — deferred, not implemented with placeholders.
- AF-2 (`shared/ui/` vs `shared/components/ui/` folder split): still open, confirmed to have caused one real scope error (AF-8) — worth resolving eventually, not strictly blocking.
- F11 (Inventory suite): requires a scoping decision — Sefay has 10 real sub-pages vs. pos-cloud's 1 mock page; needs a decision on whether this becomes 10 separate Matrix items or a different batching approach.

## Documentation Note

This Manifest, and the entire `docs/migration/` folder, is Version 2. Version 1 planning documents (Architectural Audit, Migration Matrix, Execution Protocol) existed only in conversation and were lost to context-window truncation. All completed-item history above was reconstructed by direct inspection of the current codebase, not from memory of the lost conversation — see `01_ARCHITECTURAL_AUDIT.md` for the audit methodology.
