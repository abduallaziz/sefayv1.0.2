# Architectural Audit v2 — FROZEN

Date: 2026-07-16
Status: FROZEN after completion. Do not edit in place — supersede with a new dated section if facts change.
Source of truth for this audit: direct inspection of the current codebase at `C:\Fp\web` (production, Source of Truth) and `C:\Fp\pos-cloud` (visual/UX reference only).

This document replaces the v1 Architectural Audit, which existed only in
conversation and was lost to context-window truncation. The current codebase
(not memory, not prior conversation) is the sole basis for every statement
below.

---

## 1. Project Structure

**Sefay (`web`)** — Next.js 16 App Router, locale-prefixed routing (`src/app/[locale]/...`), feature-sliced architecture:
- `src/app/[locale]/` — route segments only (thin, delegate to `features/*/pages`)
- `src/features/*` — 30 feature modules (pos, items, orders, customers, suppliers, expenses, shifts, reports, users, warehouses, locations, purchase-orders, goods-receipts, stock, adjustments, inventory-dashboard, movements, inventory-reports, transfers, stock-counts, tables, kitchen, hr, coupons, gift-cards, loyalty-tiers, invoices, access-control, superadmin, onboarding, landing, attend, dashboard, auth, settings)
- `src/core/*` — cross-cutting singletons: `auth` (store + hooks), `tenant` (store), `theme` (store + provider), `permissions` (hooks), `realtime` (provider)
- `src/shared/*` — `ui` (design-system primitives), `components/ui` (a second, smaller UI folder — see Architectural Finding below), `hooks`, `config`, `layout`, `tokens`, `utils`

**pos-cloud** — Next.js prototype, flat structure:
- `src/app/dashboard/*` — 12 route segments (branches, customers, expenses, inventory, kitchen, orders, pos, products, reports, suppliers, tables, settings) — no locale prefix, no auth gating, no real routing depth
- `src/components/dashboard/*` — `sidebar.tsx`, `topbar.tsx` (the two files already migrated as C1–C4)
- `src/components/ui/*` — 4 primitives only: `badge`, `button`, `card`, `switch`
- `src/lib/*` — mock-data contexts: `branch-context`, `business-type-context`, `mobile-nav-context`, `theme`, `i18n`, `business-type`, `utils`

**Classification**: pos-cloud is confirmed to be a prototype in scope and depth — 12 route stubs with mock data vs. Sefay's 30+ production feature modules with real data/permissions/routing. This validates the standing rule: pos-cloud is a visual reference only, never a structural or functional target.

---

## 2. Layouts

| Area | Sefay | pos-cloud | Classification |
|---|---|---|---|
| Dashboard shell | `DashboardLayout.tsx` → `DashboardHeader` + `DashboardSidebar` + `<main>` | `app/dashboard/layout.tsx` → `Topbar` + `Sidebar` + `<main>` | Match (structurally, post C1–C4) |
| Header position | `sticky top-0` | normal flow (not sticky) | **Product Decision** — Sefay's sticky header approved and kept (see `04_PRODUCT_DECISIONS.md`) |
| Sidebar position (desktop) | `lg:sticky`, real flex sibling (post-C4) | static flex sibling (`lg:flex`, no `position`) | Match (both are flex-flow now; sticky vs static is the header/scroll decision, not a layout-structure gap) |
| Sidebar scroll | independent, `lg:overflow-y-auto` | shares main scroll (page-level) | **Product Decision** — independent scroll kept |
| Main content scroll | independent `overflow-y-auto` within bounded row height | page-level scroll | **Product Decision** — kept |
| Sidebar width | 260px (post-C3/C4) | 260px | Match |
| Mobile drawer | `fixed` overlay + backdrop, slide via `translate-x`, RTL-aware | `fixed` overlay + backdrop, slide-in from start edge | Match |
| Superadmin shell | separate `SuperAdminLayout.tsx`, also consumes `DashboardHeader` | no equivalent in pos-cloud | **Extra Feature** — Sefay-only, no pos-cloud counterpart to compare against; out of scope for visual migration until/unless explicitly scheduled |

---

## 3. Routing

- Sefay: `[locale]` segment (`ar`/`en`) prefixes every route; `next-intl` middleware handles locale detection/redirect. Auth-gated routes redirect via `useTenantAuth()` (client-side) to `/${locale}/login`; superadmin users are redirected to `/${locale}/superadmin`.
- pos-cloud: no locale prefix, no auth gating, no middleware — routes are directly reachable, mock data only.
- **Classification**: Match in intent (both use file-based App Router routing), Sefay has real auth/locale routing pos-cloud has none of by design (prototype). Not a gap — pos-cloud never needed this.

---

## 4. Providers

Sefay's provider stack (mounted inside `DashboardLayout.tsx`): `ThemeProvider` → `RealtimeProvider`. Auth state lives in a Zustand store (not a Context/Provider) — `useAuthStore`. Tenant currency lives in `useTenantStore` (Zustand). Business-type/activity resolution is a plain hook (`useBusinessType()`), not a Provider.

pos-cloud's provider stack (mounted in `app/dashboard/layout.tsx`): `BusinessTypeProvider` → `BranchProvider` → `MobileNavProvider` — all React Context, all mock/demo state (business type is a `<select>` the demo user can change live; branch is a hardcoded value with no backend).

**Classification**:
- Business-type mechanism: **Match in outcome, different mechanism** — Sefay resolves business type from real auth/tenant data via a hook (`useBusinessType()` reading `useAuthStore`); pos-cloud simulates it via a Context + a demo `<select>` picker. This is expected and correct — pos-cloud's picker is prototype scaffolding, never to be copied into Sefay (already decided, B7).
- Branch mechanism: **Match in outcome (placeholder), different mechanism** — Sefay's branch UI element is an intentional non-functional placeholder (B6 decision, no store exists). pos-cloud's `BranchProvider` is mock data feeding a working demo switcher. Sefay must NOT gain a `BranchProvider` copying pos-cloud's context — B6 already ruled this out explicitly.
- Mobile nav state: **Match in outcome, different mechanism** — Sefay uses local `useState` in `DashboardLayout.tsx` (confirmed no Context needed, checked during earlier investigation). pos-cloud uses `MobileNavProvider`. No migration needed; Sefay's simpler local-state approach is sufficient for its actual usage (2 consumers: header trigger + sidebar).

---

## 5. Stores (Sefay only — pos-cloud has none, only Context+mock-state)

| Store | Purpose | Real backend? |
|---|---|---|
| `useAuthStore` | user, role, permissions, business_type, activity, tenantId, branchId, tokens | Yes |
| `useTenantStore` | currency_code, currency_symbol | Yes |
| `useThemeStore` | light/dark, persisted, toggles `<html class="dark">` | Yes (local persistence) |

**Classification**: Extra Feature (Sefay-only, correctly so — these hold real business state pos-cloud never needed).

---

## 6. Business Logic Boundaries

- `useBusinessType()` (`src/shared/hooks/useBusinessType.ts`) reads `useAuthStore`, resolves `ActivityKey` (37 values) via `business-type.config.ts`, returns a `sidebar: NavKey[]` filter list. Confirmed the only source of truth for sidebar visibility (B7, previously investigated and approved).
- Role-based filtering (`item.roles`) is separate and additional to activity-based filtering, both applied in `DashboardSidebar.tsx`.
- None of this exists in pos-cloud in a form that should ever be copied — pos-cloud's `business-type-context.tsx` is demo-only state, not a business rule engine.

**Classification**: Match (already fully preserved and correctly isolated from any visual migration — confirmed unmodified through C1–C4).

---

## 7. Design System / Shared UI

Migrated in the previous execution phase (D1–D6, confirmed present in code):
- `button.tsx`, `card.tsx`, `status-badge.tsx`, `switch.tsx`, `date-range-picker/*`, `dialog.tsx`, `dropdown.tsx`, `select.tsx`, `sheet.tsx`, `tabs.tsx`, `tooltip.tsx`, `avatar.tsx`, `data-table.tsx`, `page-header.tsx`, `section-card.tsx`, `empty-state.tsx`, `location-map-picker/*` — all converted to `posCloud`/`posCloudDark` Tailwind tokens.

**Not yet migrated** (confirmed still present, unconverted):
- `input.tsx`, `modal.tsx`, `confirm-dialog.tsx`, `separator.tsx`, `skeleton.tsx`, `stat-card.tsx` (previously logged defect — dead-token classes, deferred), `number-input.tsx` (had no color classes at D6 time, may need re-check)

**Architectural Finding (pre-existing, logged previously, still open)**: `shared/ui/badge.tsx` vs `shared/ui/status-badge.tsx` — two components with overlapping purpose, only `status-badge.tsx` was migrated (17 consumers). `badge.tsx` (1 consumer) untouched, deferred for architectural review, not reclassified as a defect per prior explicit user decision.

**Architectural Finding (pre-existing)**: `shared/ui/*` vs `shared/components/ui/*` — two parallel UI folders exist. `shared/components/ui/` contains only `Pagination.tsx`, `RequiredMark.tsx`, `Skeleton.tsx` (note: also a second `Skeleton` distinct from `shared/ui/skeleton.tsx` — a naming collision across folders). Not yet assessed for consolidation; flagged for future architectural review, out of scope until explicitly scheduled.

---

## 8. Dashboard Shell

Fully audited above (Layouts section). Header (C1), Sidebar (C2), Layout/positioning (C3–C4) are migrated and approved. Confirmed via direct file read as of this audit.

---

## 9. Authentication

Sefay: `useAuthStore` (Zustand, no persist middleware — confirmed no `persist()` wrapper on `auth.store.ts`, unlike `theme.store.ts` which does persist), `useTenantAuth()` hook handles redirect-on-unauthenticated + redirect-on-superadmin. Login flow via `useLogin()` (`@tanstack/react-query` mutation) → `authApi.login()` → sets auth state → redirects by role. Silent auto-refresh via `AuthProvider` (root-level `useEffect`, fires `POST /auth/refresh` on mount — see `07_DEFECT_LOG.md` for the local-dev-only 429 finding).

pos-cloud: no authentication exists at all — this is expected, out of scope for comparison (prototype has no login).

**Classification**: Extra Feature (Sefay-only, correctly so).

---

## 10. Navigation

Covered under Dashboard Shell / Business Logic Boundaries. `NavKey`-driven, activity+role filtered, single source of truth (`useBusinessType()`). pos-cloud's nav list (`baseNav` + conditional `foodServiceNav`) is a simplified 11-item mirror used only to demonstrate the food-service conditional pattern — already confirmed structurally mirrored by Sefay's real system (`FOOD_SERVICE_SIDEBAR` in `business-type.config.ts`).

**Classification**: Match (concept), Sefay's is the real, production-grade superset — no migration needed, pos-cloud's nav list was never a target.

---

## 11. Responsive Behavior

- Header: fully restyled and responsive-fidelity-closed in C1 (sub-480px/360px shrink behavior restored as Tailwind arbitrary breakpoints).
- Sidebar: `<lg` = fixed drawer, `≥lg` = flex-flow sticky column (C2/C4). Matches pos-cloud's `hidden ... lg:flex` desktop / fixed-overlay mobile split.
- Remaining feature pages (POS, Items, Orders, etc.): **not yet audited individually** — this audit covers the shell only, per the current Matrix's scope-to-date. Per-page responsive audit is deferred to each page's own Matrix item when scheduled.

---

## 12. Mobile Behavior

Mobile drawer (sidebar), mobile menu trigger (header), mobile-hidden brand tile/search bar — all confirmed present and functioning as of C1–C4. No further mobile-specific gaps identified at the shell level.

---

## 13. Dark Mode

Mechanism: Tailwind `darkMode: 'class'`, toggled via `document.documentElement.classList` in `ThemeProvider` + `useThemeStore.setTheme()` (belt-and-suspenders, both toggle the class). Confirmed correctly wired through C1–C4's converted components (`dark:` variants throughout).

pos-cloud: `useTheme()` context toggling `document.body.classList` (not `documentElement`) — a real mechanism difference, but functionally equivalent from a user-facing standpoint. Not something to import into Sefay; Sefay's `documentElement`-based approach is already correct and pre-existing (not part of this migration's scope to change).

**Classification**: Match (outcome), Product Decision implicitly already in place (mechanism unchanged, no action needed).

---

## 14. Localization

Sefay: `next-intl`, `[locale]` routing, `messages/` directory, Arabic-Indic-numeral avoidance is a standing permanent rule (English numerals everywhere — see `CLAUDE.md`). pos-cloud: `lib/i18n.tsx`, a lightweight custom `t()` function, no routing integration, English/Arabic toggle only, no numeral-formatting concerns (mock data only).

**Classification**: Extra Feature (Sefay-only, correctly so — real i18n infrastructure pos-cloud never needed).

---

## 15. Business-Type System

Fully covered in section 6/10. `ActivityKey` (37 granular values) vs pos-cloud's flat `BusinessType` (6 values, `restaurant | cafe | retail | services | workshop | other`). Sefay's system is a confirmed superset (`BUSINESS_TYPE_TO_ACTIVITY` maps the legacy 6-value type onto the granular 37-value system for backward compatibility).

**Classification**: Extra Feature (Sefay), Match (conceptual parity — pos-cloud's simplified version was always just a demo of the *pattern*, not a target to replicate).

---

## 16. Tenant System

`useTenantStore` (currency only, real backend-fed). pos-cloud has no tenant concept — `BranchProvider`'s mock branch value is the closest analog, and it's explicitly not to be treated as a tenant/branch backend model (B6 ruling stands).

**Classification**: Extra Feature (Sefay-only).

---

## Summary Classification Table

| Area | Classification |
|---|---|
| Dashboard shell (header/sidebar/layout) | Match — migrated (C1–C4) |
| Sticky header / independent scroll | Product Decision |
| Flex-sidebar architecture | Product Decision / Match (resolved in C4) |
| Design system primitives (D1–D6 set) | Match — migrated |
| Remaining unmigrated primitives (input, modal, confirm-dialog, separator, skeleton, stat-card, number-input) | **Remaining scope** |
| Individual feature pages (POS, Items, Orders, Customers, Suppliers, Expenses, Reports, Settings, Tables, Kitchen, and all Sefay-only pages beyond pos-cloud's 12) | **Remaining scope** |
| badge.tsx / status-badge.tsx duplication | Architectural Finding (open) |
| shared/ui vs shared/components/ui split | Architectural Finding (open) |
| stat-card.tsx dead-token classes | Technical Debt (open, previously logged) |
| Auth, tenant, business-type, permissions, routing, localization infrastructure | Extra Feature (Sefay-only, never migrated from/to pos-cloud, correctly untouched) |

This document is now FROZEN.
