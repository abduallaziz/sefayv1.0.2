# COVERAGE_PHASE_E_BATCH_11.md
# Phase E — web/src — Batch 11/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 12.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 144 / 168 = 85.7% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 130 | features/superadmin/tenants/types.ts | 15 | 15 | READ_VERIFIED | None | `tenants`: `id,name,business_type,status,trial_ends_at,created_at,deleted_at,owner_name?,owner_email?,branches_count?,users_count?,subscription_plan?` | `TenantStatus`: `active|trial|suspended|cancelled`. Includes `owner_name`, `owner_email`, `subscription_plan` — these require JOINs not present in backend `GET /superadmin/tenants` |
| 131 | features/superadmin/tenants/components/ExtendTrialDialog.tsx | 40 | 40 | READ_VERIFIED | Via `useExtendTrial()` → `PATCH /superadmin/tenants/:id/extend-trial` | `subscriptions`: `ends_at` (implied) | Default 14 days. Input: number 1–365. Calls `tenantsApi.extendTrial(id, days)` |
| 132 | features/superadmin/tenants/components/TenantActionsDropdown.tsx | 54 | 54 | READ_VERIFIED | Via `useActivateTenant()`, `useDeactivateTenant()`, `useSoftDeleteTenant()`, `useExtendTrial()` | `tenants`: `id,status,deleted_at` | Dropdown menu: activate (if not active), deactivate (if active), extend trial, soft delete (if not deleted). All 4 mutations use correct backend paths |
| 133 | features/superadmin/tenants/components/TenantsFilters.tsx | 48 | 48 | READ_VERIFIED | None | None | Search input + status filter buttons (all/active/trial/suspended/cancelled). Pure UI — filters passed up via callbacks |
| 134 | features/superadmin/tenants/components/TenantsTable.tsx | 80 | 80 | READ_VERIFIED | None direct | `tenants`: `id,name,business_type,status,owner_email?,deleted_at,subscription_plan?,branches_count,users_count,created_at` | Columns: name+owner_email, business_type, status badge, plan, branches, users, created_at, actions dropdown. Uses `date-fns.format` for date. Shows `(deleted)` badge if `deleted_at` set |
| 135 | features/superadmin/tenants/components/TenantStatusBadge.tsx | 12 | 12 | READ_VERIFIED | None | `tenants`: `status` | Maps `TenantStatus` → Badge variant. Labels in Arabic: نشط/تجريبي/موقوف/ملغي |
| 136 | features/superadmin/types/index.ts | 61 | 61 | READ_VERIFIED | None | `tenants`: `id,name,business_type,status,trial_ends_at,created_at,deleted_at,users_count?,branches_count?,mrr?` · `plans`: `id,name,price_monthly,price_yearly,max_users,max_branches,is_active` · `subscriptions`: `id,tenant_id,plan_id,status,started_at,ends_at,plan?,tenant?` · `OverviewStats`: `total_tenants,active_tenants,trial_tenants,suspended_tenants,mrr,arr,churn_rate,new_tenants_this_month` · `RevenueData`: `month,revenue,tenants` · `AuditLog`: full shape | Central type registry for superadmin feature. Note: `Tenant.mrr` here vs `Tenant.subscription_plan` in `tenants/types.ts` — **two different Tenant type definitions in same feature** |
| 137 | i18n/request.ts | 70 | 70 | READ_VERIFIED | None | None | `next-intl` server config. Loads namespaces from `messages/{locale}/{ns}.json`. Namespaces: `common`, `shell`, `superadmin`, `dashboard`, `orders`, `pos`, `expenses`, `items` + legacy fallbacks. Priority: new system overwrites legacy. Default locale: `en` (from routing) |
| 138 | i18n/routing.ts | 5 | 5 | READ_VERIFIED | None | None | `locales: ['en', 'ar']`, `defaultLocale: 'en'`. Simple 2-locale config |
| 139 | lib/api.ts | 69 | 69 | READ_VERIFIED | Core: `POST /auth/refresh` (auto retry on 401) | None | **Central API client.** Reads `accessToken` from `useAuthStore.getState()` — NOT from localStorage. Returns `undefined` on 204. Auto-refresh on 401: calls `/auth/refresh`, retries original request. Throws `ApiError` on non-ok. Base URL: `NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'` |
| 140 | lib/locale.ts | 83 | 83 | READ_VERIFIED | None | None | Locale utilities: `formatCurrency(amount, {locale})`, `formatDate(date, {locale,format?,timezone?})`, `formatNumber(value, {locale,decimals?})`, `getDirection(locale)`. Default currency: SAR (ar), USD (en). Default timezone: `Asia/Riyadh`. Relative dates in Arabic |
| 141 | lib/utils.ts | 5 | 5 | READ_VERIFIED | None | None | `cn(...inputs)` — `clsx` + `tailwind-merge` utility. Used throughout all components |
| 142 | shared/hooks/use-responsive.ts | 29 | 29 | READ_VERIFIED | None | None | Breakpoints: mobile(<640), tablet(<1024), desktop(<1280), wide(≥1280). Returns `{breakpoint, width, isMobile, isTablet, isDesktop, isWide, isMobileOrTablet}` |
| 143 | shared/layout/header.tsx | 101 | 101 | READ_VERIFIED | **None — notifications are hardcoded** | None | SuperAdmin header. Features: CommandPalette toggle (Ctrl+/ shortcut), locale switcher (ar↔en), notifications dropdown (3 hardcoded items), user avatar ("SA" / "Super Admin" hardcoded). No API calls |
| 144 | shared/layout/main-layout.tsx | 16 | 16 | READ_VERIFIED | None | None | SuperAdmin main layout wrapper. Background: `#080810`. Renders: `Header` + scrollable `main`. Used by `superadmin/layout.tsx` |

---

## Key Findings

### ✅ lib/api.ts — Correct Auto-Refresh Pattern (file 139)
The central `apiClient` reads `accessToken` from Zustand store state (NOT localStorage), which is correct. On 401:
1. Calls `POST /auth/refresh` with stored `refreshToken`
2. Updates tokens via `setTokens()`
3. Retries original request

This confirms `orders/api.ts` reading from `localStorage.getItem('access_token')` is a bug — `accessToken` is only in Zustand memory, never persisted.

### ⚠ Two Conflicting `Tenant` Type Definitions (files 130 vs 136)

| Field | `tenants/types.ts` (#130) | `types/index.ts` (#136) |
|-------|--------------------------|------------------------|
| `subscription_plan?` | ✅ present | ❌ absent |
| `mrr?` | ❌ absent | ✅ present |
| `owner_name?` | ✅ present | ❌ absent |
| `owner_email?` | ✅ present | ❌ absent |

Both are in the same `features/superadmin/` folder. `TenantsTable` imports from `tenants/types.ts`, `tenants-table.tsx` (components) imports from `../types` (which is `tenants/types.ts`), while `TenantsTable.tsx` in `superadmin/components/` imports from `../types` (which is `types/index.ts`). Two tables use two different shapes.

### ⚠ Tenant Fields Not in Backend Schema (files 130, 134)
Frontend `Tenant` type (tenants/types.ts) expects:
- `owner_name`, `owner_email` — not in `tenants` table, requires JOIN to `users`
- `subscription_plan` — not in `tenants` table, requires JOIN to `subscriptions` + `plans`
- `branches_count`, `users_count` — not in `tenants` table, require COUNT queries

Backend `GET /superadmin/tenants` calls `TenantManagementRepository.findAll()` which does `select('*')` from `tenants` — returns only: `id, name, status, business_type, created_at, deleted_at`.

### ⚠ Header Notifications — Hardcoded (file 143)
Header notification dropdown shows 3 hardcoded items (New tenant, Subscription renewed, Trial expiring soon). Not connected to `notifications` table or any API.

### ⚠ i18n Dual-System Loading (file 137)
Two message systems merged at runtime:
- **New:** `messages/{locale}/common.json`, `shell.json`, `superadmin.json`, etc.
- **Legacy:** `messages/{locale}.json`, `messages/{locale}/dashboard.json`, `messages/{locale}/items.json`, `messages/{locale}/customers.json`

New system takes priority (spread first, then legacy overrides would be overwritten). Risk: missing keys in new system fall back to legacy — may expose inconsistencies.

---

## ⛔ STOPPED — Batch 11/21 Complete.
## Overall Progress: 144 / 168 = 85.7%
## Awaiting confirmation for Batch 12 (files 145–152)
