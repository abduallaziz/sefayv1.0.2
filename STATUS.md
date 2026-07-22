# Status

High-level project state. Detailed specs and engineering history live in `TASKS.md` and `docs/`.

> **Documentation:** Architecture docs → `docs/architecture/` · Future initiatives → `docs/future/` · Roadmap planning → `docs/roadmap/`

---

## Standing Convention — Date Pickers & Numerals (2026-07-05)

Never use native `<input type="date">`/`<input type="month">` — always use `DateRangePicker`/`SingleDatePicker` from `src/shared/ui/date-range-picker`. Always render numbers in English (Western) numerals everywhere, in every locale. Permanent rule set by the user — check before starting any task touching date selection or number display.

---

## Current Phase

**Phase 2 — Inventory UX Production-Readiness** (In Progress)

Core Inventory modules are functional. UX consistency work is ongoing. Live end-to-end workflow verification requires backend credentials (SUPABASE_URL / SERVICE_ROLE_KEY) not available in the current environment.

---

## Recently Completed

| What | PR | Notes |
| --- | --- | --- |
| Orders page toolbar rework + real backend bugs found/fixed via live testing session | — | Orders quick-filter row restyled (export/settings pinned to far edge, status pills reordered/centered, "All" pinned opposite edge, single white toolbar card, orders table header/date-column alignment fixes, Status column added to desktop table, view action moved into row dropdown, invoice-details items rendered as a real line-items table). Products Phase A shipped on the API side (Units + Brands modules, category delete-guard — see apiv1.0.2 STATUS.md §91) with no `web` UI yet (backend-only this session). **The bulk of this session was live-testing-driven bug discovery, not planned feature work** — full detail in apiv1.0.2 STATUS.md §91: (1) `AuthProvider`'s refresh call raced independently against `apiClient`'s own 401-triggered refresh, and the backend's single-use refresh-token rotation revoked the session whenever both landed together — every local page refresh logged the user out; fixed by funneling both through one deduped `refreshSession()` in `lib/api.ts`. (2) POS checkout's `stock_warning` field (new, from the API-side silent-failure fix) is now surfaced as a `sonner` toast in `POSPage.tsx` instead of being invisible to the cashier. (3) `InventoryDashboardPage.tsx` and `InventoryReportsPage.tsx` were rendering raw untranslated English enum values (`movement_type`, `status`) — wired to the existing `movements.type.*`/`purchasing.status.*`/`adjustments.status.*`/`transfers.status.*` catalogs already used elsewhere. (4) 24 missing `sidebar` translation keys (over half the nav menu was rendering raw i18n keys) + 3 missing `dashboard` keys (`netProfit`, `occupiedTables`, `salesOver7Days`) added to `messages/ar.json`/`en.json`. **Known deferred gap, explicit user decision**: the dashboard header's notification bell (`DashboardHeader.tsx`) is fully decorative (`useState(3)` hardcoded), not wired to the real `notifications` table — real fix postponed. July 22-23, 2026. |
| POS rebuild session (pos-cloud visual parity, ongoing) — order notes, accordion discounts, mobile scroll fix | — | Part of the pos-cloud visual-parity rebuild (`docs/rebuild/PARKING_LOT.md`). Coupon/gift-card/loyalty rows in `CartPanel.tsx` unified into a single collapsed-by-default accordion (no business-logic change). New **order-notes feature, full real scope**: `note_presets` table + full CRUD/reorder API (`note_presets.manage` permission) in `apiv1.0.2` (see apiv1.0.2 STATUS.md §90 — migration `091_order_note_presets.sql` still needs to be run manually in Supabase before it works end-to-end), new `/dashboard/note-presets` admin page, and a 4th accordion row in the cart (choose-from-list / write-custom tabs) whose result joins into the existing real `Order.notes` field — contract unchanged. Also fixed a real mobile+desktop layout bug: the cart panel was independently height-clipped with its own internal scroll nested inside the dashboard shell's already-scrollable `<main>`, which visually read as the cart floating over the product grid and hid the checkout button entirely on desktop once the accordion content grew past the row height — replaced with a single bounded, internally-scrollable cart column (`h-full`/`overflow-y-auto`) so the checkout button is always reachable. July 17, 2026. |
| POS checkout rework: coupons + gift cards with live validation, manual discount removed | — | Coupon field in the cart was dead (typed code silently dropped, never reached the API) and any code *looked* accepted with zero validation until checkout — where failures were silently console.error'd. Now both coupons (cart) and gift cards (payment modal) validate live via new preview-only `POST /coupons/validate` / `POST /gift-cards/validate` endpoints before showing as applied, the real server-computed discount shows in cart/payment/receipt totals, any cart mutation auto-clears the coupon (stale percentage math), checkout failures surface as visible errors, and the receipt shows the authoritative server `order.total`. Manual cashier discount removed entirely per explicit user decision — coupon only. Loyalty program on/off toggle added to Settings (hides redeem UI in POS when off, backed by `tenants.loyalty_enabled`). See apiv1.0.2 STATUS.md §77. July 9, 2026. |
| Loyalty Tiers + Gift Cards pages | — | `LoyaltyTiersManager` embedded in Settings (bonus points-multiplier brackets, tenant-configurable) + standalone `/dashboard/gift-cards` page (issue/list/toggle/delete stored-value cards). Consumes the new backend `/loyalty-tiers` and `/gift-cards` APIs (see apiv1.0.2 STATUS.md §74). Found a real i18n bug while wiring this up: the `giftCards` message namespace was destructured in `i18n/request.ts` but never actually `loadFile()`'d nor included in the returned `messages` object — fixed both. July 8, 2026. |
| Access Control Center (tenant-aware roles/permissions admin UI) | — | New `/dashboard/settings/access-control` split-view page (role list + selected role's detail on one screen, no page navigation between them). Consumes the new backend `/access-control/*` API (see apiv1.0.2 STATUS.md §68) — real data only, no hardcoded roles/groups/permission keys. Owner/superadmin only; protected roles (`owner`, `superadmin`) render read-only. Custom-role creation and the "Users" tab are honestly labeled "coming soon" rather than faked, since the backend doesn't support them yet. July 7-8, 2026. |
| Employee Core / System User domain separation cleanup | — | Deleted `EmployeeSettingsModal.tsx` (mixed System User + Employee concerns) after moving its Payroll/Geofence sections into `EmployeeDetailPage.tsx`; removed the Settings-gear action from `UsersPage.tsx`; trimmed the Employee Profile Attendance tab to configuration-only (no daily/monthly stats — those belong only to the mobile attendance portal and the admin Attendance dashboard). Backed by a "storage compatibility layer" decision on the API side (`users.is_employee_profile` flag, no physical table split — see apiv1.0.2 STATUS.md §69). **Also documents two real incidents from this work**: two real employee records were accidentally soft-deleted via imprecise browser-automation clicks during destructive-action testing (both caught via direct DB verification and restored, both fully disclosed) — testing methodology changed afterward to always use disposable API-created test records for destructive-action tests, never real records via browser automation. July 7, 2026. |
| Attendance mobile portal — remove confirmation interstitial | #(commit `4b5e585`) | Check-in/out now flips the same screen instantly (button + status badge) instead of navigating to a separate "تم تسجيل حضورك" confirmation screen with a code the employee had to tap through. July 7, 2026. |
| Date-Range Picker — full calendar-grid redesign + portal positioning | — | Both `SingleDatePicker` and `DateRangePicker` rewritten to portal-rendered calendar grid via `useFloatingPosition`. Mobile overflow fixed. Full history in TASKS.md. |
| RTL native date-input fix + raw `<input type="date">` removal | — | All 4 raw date inputs replaced with shared pickers. `dir="ltr"` fix centralized in components. |
| Shared `StatusBadge` | #16 | Replaces 8 per-feature badge implementations across Inventory. |
| Shared `EmptyState` | #18 | Wired into all 9 Inventory list tables. |
| Shared `ConfirmDialog` — Inventory | #20 | All Inventory delete/cancel dialogs. |
| Shared `ConfirmDialog` — App-wide | #22 | Extended to Suppliers, Items, Customers, Orders. 9 dialogs total. |
| Documentation system (`docs/`) | #27+ | Architecture docs, future initiative specs, roadmap and decision records. |

---

## Active Work

| Area | Status |
| --- | --- |
| Phase 2 Inventory UX — form-modal consolidation | Next milestone (7 create/edit modals) |
| Phase 2 Inventory UX — pagination for 5 modules | Planned (data-layer change required) |
| Documentation foundation | In progress |

---

## Architecture State

| Layer | Current State |
| --- | --- |
| Frontend | Next.js 16.2.6 (App Router), React 19, TypeScript strict, Tailwind CSS, next-intl (ar/en) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Shared UI | StatusBadge, EmptyState, ConfirmDialog, SingleDatePicker, DateRangePicker, useFloatingPosition |
| Storage | Supabase Storage (direct) — StorageProvider abstraction planned (Phase 11) |
| Accounting | Not yet started — see `docs/future/advanced-accounting.md` |

→ Full architecture details: `docs/architecture/`

---

## Roadmap Summary

### Active Phases

| Phase | Name | Status |
| --- | --- | --- |
| 2 | Inventory UX Production-Readiness | In Progress |
| 3 | Barcode & Scanning | Planned |
| 4 | Smart Product Creation | Planned |
| 5 | Inventory Intelligence | Planned |
| 6 | Warehouse Management | Planned |
| 7 | Productivity | Planned |
| 8 | AI Features | Planned |
| 9 | Company Branding & Information | Planned |
| 10 | Document & Print Designer | Planned |
| 11 | Storage Abstraction | Planned |

### Future Initiatives (post Phase 11)

| Initiative | Category | Spec |
| --- | --- | --- |
| Advanced Accounting & Financial Management | Business Module | `docs/future/advanced-accounting.md` |
| SaaS Licensing Platform (extended) | Platform Service | `docs/future/saas-licensing-platform.md` |
| Marketplace & Extension Platform | Platform Service | `docs/future/marketplace-extension-platform.md` |
| Public API & Developer Platform | Platform Service | `docs/future/` — spec pending |
| Webhook Delivery System | Platform Service | `docs/future/` — spec pending |
| Notification Center | Infrastructure | `docs/future/` — spec pending |
| Approval Workflow Engine | Platform Service | `docs/future/` — spec pending |
| CRM | Business Module | `docs/future/` — spec pending |
| HR & Payroll | Business Module | ⚠️ Substantially more built than "spec pending" suggests — Employee Core, attendance (mobile portal + admin dashboard + geofencing), leave requests, and payroll fields are all in production (see "Recently Completed" above and apiv1.0.2 STATUS.md §66/§69/§70). Still missing: org chart/reporting hierarchy, GOSI/WPS compliance, Posting Engine integration. See TASKS.md for the full breakdown. |
| Manufacturing & MRP | Business Module | `docs/future/` — spec pending |
| Payment Gateway Integration | Integration | `docs/future/` — spec pending |
| E-commerce Integration | Integration | `docs/future/` — spec pending |
| WhatsApp Business Integration | Integration | `docs/future/` — spec pending |
| ZATCA Phase 2 Integration | Compliance | `docs/future/` — spec pending |
| PWA / Mobile App | Mobile | `docs/future/` — spec pending |
| Custom Report Builder | Analytics | `docs/future/` — spec pending |
| 2FA, SSO & Security Hardening | Security | `docs/future/` — spec pending |
| Multi-Branch Management | Platform | `docs/future/` — spec pending |
| Multi-Company & Consolidation | Enterprise | `docs/future/` — spec pending |
| Granular Permissions & Custom Roles | Platform | ⚠️ Partially superseded — tenant-aware per-permission customization for existing system roles is now **implemented and shipped** (see "Recently Completed" above / apiv1.0.2 STATUS.md §68). What's genuinely still pending: creating brand-new custom roles, multiple roles per user, branch/department-scoped permissions, per-user allow/deny exceptions, approval-limit policies, and time-boxed temporary access. `docs/future/` spec still describes the original unstarted scope — needs a rewrite reflecting what's actually done. |
| Pricing Engine & Discount Management | Commerce | `docs/future/` — spec pending |
| UOM & Conversion | Commerce | `docs/future/` — spec pending |
| Data Import & Migration Tools | Platform | `docs/future/` — spec pending |
| Quality Control | Business Module | `docs/future/` — spec pending |
| Project Management | Business Module | `docs/future/` — spec pending |
| Collaboration & Activity Feed | Platform | `docs/future/` — spec pending |
| Subscription & Recurring Billing | Business Module | `docs/future/` — spec pending |
| White-Labeling & Reseller Program | Enterprise | `docs/future/` — spec pending |
| Executive KPI Dashboard | Analytics | `docs/future/` — spec pending |
| Field Service & Maintenance | Business Module | `docs/future/` — spec pending |
| Fleet Management | Business Module | `docs/future/` — spec pending |

→ **Master Roadmap (dependency map + implementation sequence):** `docs/roadmap/master-roadmap.md`
→ **Phase specs:** `TASKS.md` · **Initiative specs:** `docs/future/`

---

## Deferred

| Feature | Notes |
| --- | --- |
| Company Factory Reset | Owner-only, multi-step, transactional wipe. Full spec in TASKS.md. |
