# Migration Matrix v2

Date: 2026-07-16
Status: ACTIVE — items marked `Done` are historical record of C1–C4 (validated against current code); everything else is `Not Started` unless noted.
Source of truth for scope/order: this file, going forward. Supersedes any conversation-only planning.

Categories used: `Shell`, `Design System`, `Feature Page`, `Architecture`.

---

## COMPLETED (historical record, confirmed present in code as of this audit)

### C1 — DashboardHeader
- Category: Shell
- Description: Full visual conversion of the dashboard topbar to `posCloud`/`posCloudDark` tokens, including sub-480px/360px responsive-fidelity restoration.
- Scope: `src/features/dashboard/components/DashboardHeader.tsx`
- Expected Files: same
- Dependencies: `tailwind.config.js` (A1/A3 token additions)
- Risk: Low (presentation-only)
- Consumer Count: 2 (`DashboardLayout.tsx`, `SuperAdminLayout.tsx`) — unchanged
- Status: **Done**

### C2 — DashboardSidebar
- Category: Shell
- Description: Full visual conversion of the sidebar to `posCloud`/`posCloudDark` tokens; flat active/hover states matching pos-cloud; width later corrected 264→260px in C3.
- Scope: `src/features/dashboard/components/DashboardSidebar.tsx`
- Dependencies: C1 (shared header height offset `top-[66px]`)
- Risk: Low (presentation-only; 2 pre-existing unrelated ESLint errors noted, not introduced)
- Consumer Count: 1 (`DashboardLayout.tsx`) — unchanged
- Status: **Done**

### C3 — DashboardLayout (width-offset fix)
- Category: Shell
- Description: Corrected sidebar width 264px→260px and its coupled `lg:ms-[260px]` offset on `<main>`; flat background tokens; loading-state restyle.
- Scope: `src/features/dashboard/components/DashboardLayout.tsx`, `DashboardSidebar.tsx` (width value only)
- Dependencies: C2
- Risk: Low
- Consumer Count: `DashboardLayout.tsx` — 1, unchanged
- Status: **Done**

### C4 — Dashboard Shell Positioning Model
- Category: Architecture
- Description: Sidebar converted from `position: fixed` + manual main-offset to `lg:sticky` real flex sibling, eliminating the width-offset coupling entirely. Sticky header and independent scroll regions explicitly preserved as an Approved Product Decision (see `04_PRODUCT_DECISIONS.md`), not migrated to pos-cloud's shared-scroll model.
- Scope: `DashboardSidebar.tsx` (positioning classes), `DashboardLayout.tsx` (row wrapper, offset removal)
- Dependencies: C1–C3
- Risk: Medium (touches scroll/height model for every `/dashboard/*` and `/superadmin/*` route — widest blast radius so far)
- Consumer Count: 1 each — unchanged
- Status: **Done**

### D1–D6 — Design System Primitives (prior phase, Checkpoint 1)
- Category: Design System
- Description: `button.tsx`, `card.tsx`, `status-badge.tsx`, `switch.tsx`, `date-range-picker/*`, `dialog.tsx`, `dropdown.tsx`, `select.tsx`, `sheet.tsx`, `tabs.tsx`, `tooltip.tsx`, `avatar.tsx`, `data-table.tsx`, `page-header.tsx`, `section-card.tsx`, `empty-state.tsx`, `location-map-picker/*` converted to `posCloud`/`posCloudDark` tokens.
- Status: **Done** (confirmed present in code during this audit)

---

## REMAINING — Design System (unmigrated primitives)

### E1 — input.tsx
- Category: Design System
- Description: Converted to `posCloud`/`posCloudDark` tokens. No standalone Input exists in pos-cloud — derived from established token conventions (matching `SelectTrigger`'s field styling) per explicit user direction, not a 1:1 copy.
- Scope: `src/shared/ui/input.tsx`
- Expected Files: same
- Dependencies: none
- Risk: Medium (assessed) — actual consumer count was low (6, all superadmin)
- Consumer Count: 6 before / 6 after — unchanged
- Behavior Change Assessment: No logic changed, full API preserved (see `06_MIGRATION_LOG.md`)
- Expected Visual Impact: border/background/text/placeholder/focus-ring color only — realized as expected, no layout change
- Validation: Build clean, TypeScript clean, ESLint 1 pre-existing unrelated error (DEF-5), Runtime clean
- Rollback Scope: single file, single line
- Status: **Done**

### E2 — modal.tsx
- Category: Design System
- Scope: `src/shared/ui/modal.tsx`
- Consumer Count: 0 — confirmed dead code, duplicates `dialog.tsx` (see AF-6).
- Status: **Skipped (Dead Component)** — not styled, not deleted. Logged as a deletion candidate (AF-6), deferred to a future explicit architectural cleanup task.

### E3 — confirm-dialog.tsx
- Category: Design System
- Scope: `src/shared/ui/confirm-dialog.tsx`
- Description: Converted to `posCloud`/`posCloudDark` tokens. No pos-cloud equivalent exists (no confirm/cancel business flows in mock data) — derived from established token conventions per the permanent E1 rule.
- Consumer Count: 13 before / 13 after — unchanged. Exceeds 10-consumer Manual QA threshold — flagged, not blocking.
- Behavior Change Assessment: No logic changed, full API preserved (see `06_MIGRATION_LOG.md`)
- Status: **Done**

### E4 — separator.tsx
- Category: Design System
- Scope: `src/shared/ui/separator.tsx`
- Consumer Count: 0 — confirmed dead code.
- Status: **Skipped (Dead Component)** — logged as deletion candidate (AF-7).

### E5 — Skeleton (scope corrected)
- Category: Design System
- Scope: `src/shared/components/ui/Skeleton.tsx` (corrected — `src/shared/ui/skeleton.tsx`, the originally-scoped file, was confirmed dead code, 0 consumers, and left untouched; see AF-8)
- Consumer Count: 18 before / 18 after — unchanged. Exceeds 10-consumer Manual QA threshold — flagged, not blocking.
- Behavior Change Assessment: No logic changed, full API preserved (see `06_MIGRATION_LOG.md`)
- Status: **Done**

### E6 — number-input.tsx
- Category: Design System
- Scope: `src/shared/ui/number-input/NumberInput.tsx`
- Note: confirmed no color classes exist — fully unopinionated component, `className` passed through by consumers. Numeral-forcing logic (permanent rule) read and confirmed untouched.
- Status: **Done (No Action Required)**

### E7 — stat-card.tsx
- Category: Design System
- Scope: `src/shared/ui/stat-card.tsx`
- Consumer Count: 0 — confirmed dead code. This resolves the "requires re-confirmation" blocker — no active deferral to reconfirm against a component with no consumers.
- Status: **Skipped (Dead Component)** — logged as deletion candidate (AF-9), supersedes DEF-4.

---

## REMAINING — Feature Pages (pos-cloud has a visual reference; Sefay has the real page)

| Matrix ID | Title | pos-cloud reference | Sefay scope (expected files) | Status |
|---|---|---|---|---|
| F1 | POS page | `pos-cloud/src/app/dashboard/pos/page.tsx` | `src/features/pos/**` | **Split into F1.1–F1.6** (see below) |
| F2 | Products/Items page | `pos-cloud/.../products/page.tsx` | `src/features/items/**` | Not Started |
| F3 | Orders page | `pos-cloud/.../orders/page.tsx` | `src/features/orders/**` | Not Started |
| F4 | Customers page | `pos-cloud/.../customers/page.tsx` | `src/features/customers/**` | Not Started |
| F5 | Suppliers page | `pos-cloud/.../suppliers/page.tsx` | `src/features/suppliers/**` | Not Started |
| F6 | Expenses page | `pos-cloud/.../expenses/page.tsx` | `src/features/dashboard/expenses/**` (verify exact path) | Not Started |
| F7 | Reports page | `pos-cloud/.../reports/page.tsx` | `src/features/reports/**` | Not Started |
| F8 | Settings page | `pos-cloud/.../settings/page.tsx` | `src/features/settings/**` | Not Started |
| F9 | Tables page | `pos-cloud/.../tables/page.tsx` | `src/features/tables/**` | Not Started |
| F10 | Kitchen page | `pos-cloud/.../kitchen/page.tsx` | `src/features/kitchen/**` | Not Started |
| F11 | Inventory (multi-page) | `pos-cloud/.../inventory/page.tsx` (single mock page) | `src/features/inventory-dashboard`, `warehouses`, `locations`, `stock`, `movements`, `transfers`, `adjustments`, `stock-counts`, `purchase-orders`, `goods-receipts`, `inventory-reports` — **Sefay has 10 real sub-pages vs pos-cloud's 1 mock page.** Requires its own scoping decision before execution (likely one Matrix item per sub-page, or a batch decision). | Not Started — **needs scoping decision** |
| F12 | Branches | `pos-cloud/.../branches/page.tsx` | No Sefay equivalent (B6: branch backend does not exist) | **Not applicable** — do not build a branches page; would violate B6 and rule 7 (no new architecture/stores) |

### F1 Breakdown — POS Page Child Items

F1 was assessed as too large for a single item (6 files, 1,181 lines, 6 independent visual areas, 3 with no pos-cloud reference). Split per user approval, execution order: F1.1 → F1.2 → F1.3 → F1.4 → F1.5 → F1.6.

#### F1.1 — POS Page Shell
- Category: Feature Page
- Scope: `src/features/pos/page/POSPage.tsx`
- pos-cloud reference: outer layout only (`flex flex-col gap-5 p-4 sm:p-6 lg:flex-row`) — pos-cloud has no mobile-tabs equivalent (stacks vertically instead); Sefay's tabbed mobile UX kept as an existing capability, restyled with tokens, not removed.
- Consumer Count: 1 (route file `src/app/[locale]/dashboard/pos/page.tsx`) — unchanged
- Behavior Change Assessment: No logic changed — `mobileTab` state, checkout flow, all data fetching (`branches`, `currentShift`, `posConfig`), `useCart` hook, all handlers untouched. Only layout/spacing/token classes changed.
- Product Decision continuity: Sefay's fixed-height (`h-full min-h-0 overflow-hidden`) page structure with internally-scrolling item grid/cart panel was kept as-is (not flattened to pos-cloud's page-level scroll), consistent with the already-approved PD-3/PD-4 precedent (independent scroll regions as a production UX improvement) — not a new decision, an extension of the existing one to this page.
- Status: **Done**

#### F1.2 — Item Grid
- Category: Feature Page
- Scope: `src/features/pos/components/ItemGrid.tsx`
- pos-cloud reference: `pos-cloud/src/app/dashboard/pos/page.tsx` lines 183–236 (search bar, category chips, product card grid)
- Status: Not Started

#### F1.3 — Cart Panel
- Category: Feature Page
- Scope: `src/features/pos/components/CartPanel.tsx`
- pos-cloud reference: `pos-cloud/src/app/dashboard/pos/page.tsx` lines 239–432 (cart lines, promo/loyalty/gift-card, totals, checkout button)
- Status: Not Started

#### F1.4 — Payment Modal
- Category: Feature Page
- Scope: `src/features/pos/components/PaymentModal.tsx`
- pos-cloud reference: none — derive from established Dialog/ConfirmDialog conventions (rule 5a)
- Status: Not Started

#### F1.5 — Receipt Modal
- Category: Feature Page
- Scope: `src/features/pos/components/ReceiptModal.tsx`
- pos-cloud reference: none — derive from established conventions
- Status: Not Started

#### F1.6 — Customer Picker Modal
- Category: Feature Page
- Scope: `src/features/pos/components/CustomerPickerModal.tsx`
- pos-cloud reference: none — derive from established conventions
- Status: Not Started

---

**Sefay-only pages with no pos-cloud reference** (Extra Feature — visual direction is Sefay's own design-system tokens applied consistently, not a pos-cloud copy since no reference exists): `shifts`, `users`/`employees`, `attendance`, `schedules`, `payroll`, `leaves`, `coupons`, `gift-cards`, `loyalty-tiers`, `invoices`, `access-control`, `onboarding`, `superadmin/*`, `attend` (public mobile portal). These should use the already-migrated design-system primitives (D1–D6, E1–E7 once done) for consistency but have no 1:1 pos-cloud page to visually diff against.

---

## Notes on Matrix Completeness

This Matrix reflects what is knowable from the current codebase as of 2026-07-16. Individual Feature Page items (F1–F11) will each need their own detailed sub-scope (exact file list, consumer count, dependencies) determined at the time they're started — this table is the ordering/inventory layer, not the full per-item spec. Each item gets its full spec treatment (all required fields per `03_EXECUTION_PROTOCOL.md`) immediately before execution begins on it, and that spec gets appended to this file at that time.
