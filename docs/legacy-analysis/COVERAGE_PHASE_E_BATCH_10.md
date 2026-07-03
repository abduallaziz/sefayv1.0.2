# COVERAGE_PHASE_E_BATCH_10.md
# Phase E — web/src — Batch 10/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 11.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 129 / 168 = 76.8% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 115 | features/superadmin/hooks/use-tenants.ts | 38 | 38 | READ_VERIFIED | Via `superadminApi.getStats` → `GET /superadmin/stats`, `superadminApi.getRevenue` → `GET /superadmin/reports/revenue`, `tenantsApi.activate/deactivate/extendTrial` | `tenants`: activate/deactivate/extend-trial mutations | Bridge hooks connecting `superadmin.api.ts` + `tenants/api.ts`. `useActivateTenant/useDeactivateTenant/useExtendTrial` invalidate all `['superadmin']` queries on success |
| 116 | features/superadmin/reports/ReportsAuditPage.tsx | 262 | 262 | READ_VERIFIED | **None — 100% hardcoded mock data** | None | 4 tabs: Overview/Revenue/Tenants/Audit. All charts use hardcoded `revenueData` (6 months), `tenantsByPlan` (4 plans), `topTenants` (5 tenants). All stat card values hardcoded (`$19,400`, `252`, `0.9%`). Export button is cosmetic (no download). Audit tab renders `AuditLogViewer` |
| 117 | features/superadmin/reports/components/AuditLogViewer.tsx | 216 | 216 | READ_VERIFIED | **None — 100% hardcoded mock** | `audit_logs`: `id,actor,actor_role,tenant,action,resource_type,resource_id,ip,device,created_at,severity` (mock only) | 10 hardcoded mock entries. Filters: search, severity (info/warning/critical), action type. Refresh button is cosmetic (setTimeout). Does NOT call `GET /superadmin/audit-logs`. Expandable rows for detail view |
| 118 | features/superadmin/settings/SuperAdminSettingsPage.tsx | 230 | 230 | READ_VERIFIED | **None — zero API calls** | None | 4 tabs: Profile/Security/Notifications/System. All forms have no `onSubmit` API call — Save buttons just toggle a `saved` state for 2 seconds. API Key shown as masked static string. Active sessions are hardcoded (2 devices). System info hardcoded values |
| 119 | features/superadmin/subscriptions/SubscriptionsPage.tsx | 112 | 112 | READ_VERIFIED | Via hooks: `GET /superadmin/subscriptions`, `GET /superadmin/plans`, `POST /superadmin/plans`, `PATCH /superadmin/plans/:id`, `PATCH /superadmin/subscriptions/:id/cancel`, `POST /superadmin/subscriptions/manual-payment` | `subscriptions`: `id,tenant_id,tenant_name,plan_id,plan_name,status,interval,ends_at,amount_paid` · `plans`: `id,name,price_monthly,price_yearly,max_users,max_branches,is_active` | Tabs: subscriptions list + plans grid. Search + status filter. Real API calls via hooks |
| 120 | features/superadmin/subscriptions/api/subscriptions.api.ts | 27 | 27 | READ_VERIFIED | `GET /superadmin/subscriptions`, `GET /superadmin/plans`, `POST /superadmin/plans`, `PATCH /superadmin/plans/:id`, `PATCH /superadmin/subscriptions/:id/cancel`, `POST /superadmin/subscriptions/manual-payment` | Same as above | ⚠ `GET /superadmin/subscriptions` — not in backend (backend has `GET /subscriptions` for tenant). ⚠ `POST /superadmin/subscriptions/manual-payment` — not in backend. ⚠ `PATCH /superadmin/subscriptions/:id/cancel` — not in backend |
| 121 | features/superadmin/subscriptions/components/ManualPaymentDialog.tsx | 83 | 83 | READ_VERIFIED | Via parent → `POST /superadmin/subscriptions/manual-payment` | `ManualPaymentDto`: `tenant_id,plan_id,interval,amount,note?` | `react-hook-form` + `zod`. Fields: tenant (select), plan (select), interval (monthly/yearly), amount (number), note |
| 122 | features/superadmin/subscriptions/components/PlanCard.tsx | 70 | 70 | READ_VERIFIED | None direct | `plans`: `id,name,price_monthly,price_yearly,max_users,max_branches,is_active` | Card showing plan details. Edit + toggle active buttons |
| 123 | features/superadmin/subscriptions/components/PlanFormDialog.tsx | 79 | 79 | READ_VERIFIED | Via parent | `plans`: `name,price_monthly,price_yearly,max_users,max_branches` | `react-hook-form` + `zod`. Fields: name(min2), price_monthly, price_yearly, max_users(min1), max_branches(min1). Create + edit mode |
| 124 | features/superadmin/subscriptions/components/SubscriptionsTable.tsx | 63 | 63 | READ_VERIFIED | None direct | `subscriptions`: `id,tenant_name,plan_name,status,interval,ends_at,amount_paid` | Columns: tenant, plan, status badge, interval, ends_at, amount_paid($), cancel action. Cancel only shown for `active` or `trial` status |
| 125 | features/superadmin/subscriptions/hooks/useSubscriptions.ts | 54 | 54 | READ_VERIFIED | All via `subscriptionsApi`: getSubscriptions, getPlans, createPlan, updatePlan, togglePlan, cancelSubscription, manualPayment | None direct | 7 hooks. Query keys: `['superadmin','subscriptions']`, `['superadmin','plans']` |
| 126 | features/superadmin/subscriptions/types/subscription.types.ts | 43 | 43 | READ_VERIFIED | None | `plans`: `id,name,price_monthly,price_yearly,max_users,max_branches,is_active` · `subscriptions`: `id,tenant_id,tenant_name,plan_id,plan_name,status,interval,started_at,ends_at,cancelled_at,amount_paid` | Note: `Subscription` type has `tenant_name` and `plan_name` — denormalized names. `interval` field (`monthly`/`yearly`) maps to backend's `billing_cycle` |
| 127 | features/superadmin/tenants/api.ts | 39 | 39 | READ_VERIFIED | `GET /superadmin/tenants`, `GET /superadmin/tenants/:id`, `PATCH /superadmin/tenants/:id/activate`, `PATCH /superadmin/tenants/:id/deactivate`, `DELETE /superadmin/tenants/:id`, `PATCH /superadmin/tenants/:id/extend-trial` | `tenants`: `id,name,status` (TenantsResponse: `data[],total,page,limit`) | All 6 endpoints match the backend `SuperAdminController`. Supports pagination params: page, limit. Also has `softDelete` via DELETE |
| 128 | features/superadmin/tenants/hooks.ts | 45 | 45 | READ_VERIFIED | All via `tenantsApi`: getAll, getById, activate, deactivate, softDelete, extendTrial | None direct | 6 hooks. Query key: `'superadmin-tenants'` (string, not array — inconsistent with other modules using arrays). All mutations invalidate `[TENANTS_KEY]` |
| 129 | features/superadmin/tenants/TenantsPage.tsx | 61 | 61 | READ_VERIFIED | Via `useTenants({ search, status, page, limit:20 })` → `GET /superadmin/tenants?...` | `tenants`: `data[],total,page,limit` | Server-side pagination. Filters: search, status. Shows total count. Previous/next page buttons |

---

## Key Findings

### ⚠ CRITICAL: Subscriptions API — 3 Non-Existent Endpoints (file 120)

| Frontend Endpoint | Backend Status |
|-------------------|---------------|
| `GET /superadmin/subscriptions` | ❌ NOT FOUND — backend has `GET /subscriptions` (tenant-scoped) |
| `PATCH /superadmin/subscriptions/:id/cancel` | ❌ NOT FOUND |
| `POST /superadmin/subscriptions/manual-payment` | ❌ NOT FOUND |

Plans endpoints DO exist in backend (`/superadmin/plans` via `PlansModule`):
- `GET /superadmin/plans` ← actually backend has `GET /plans` (no superadmin prefix) |
- `POST /superadmin/plans` ← frontend assumes `/superadmin/plans` but backend controller is `/plans` |

### ⚠ Reports + Audit Pages — 100% Mock (files 116, 117)
Both `ReportsAuditPage` and `AuditLogViewer` use hardcoded data arrays. Neither calls any API. Despite `GET /superadmin/audit-logs` existing in the backend, `AuditLogViewer` does not use it.

### ⚠ SuperAdmin Settings — Zero API Calls (file 118)
All save buttons perform local state toggle only. No profile update, password change, or notification preference endpoints called.

### ✅ Tenants API is Correctly Wired (file 127)
All 6 `tenantsApi` endpoints match backend `SuperAdminController`:
- `GET /superadmin/tenants` ✅
- `GET /superadmin/tenants/:id` ✅
- `PATCH /superadmin/tenants/:id/activate` ✅
- `PATCH /superadmin/tenants/:id/deactivate` ✅
- `DELETE /superadmin/tenants/:id` ✅
- `PATCH /superadmin/tenants/:id/extend-trial` ✅

### ⚠ Subscription Type Mismatches (file 126)
| Frontend Field | Backend Column |
|----------------|---------------|
| `interval` | `billing_cycle` (different name) |
| `tenant_name` | Not in `subscriptions` table — needs JOIN |
| `plan_name` | Not in `subscriptions` table — needs JOIN |
| `amount_paid` | Not in `subscriptions` table — from `payments` table |

### ⚠ Inconsistent QueryKey Pattern (file 128)
`tenants/hooks.ts` uses string key `'superadmin-tenants'` vs all other modules using array keys `['superadmin', 'tenants']`. This breaks cross-module cache invalidation — `useActivateTenant` in `use-tenants.ts` (file 115) invalidates `['superadmin']` but `tenants/hooks.ts` uses `'superadmin-tenants'` key. They do not cross-invalidate.

---

## ⛔ STOPPED — Batch 10/21 Complete.
## Overall Progress: 129 / 168 = 76.8%
## Awaiting confirmation for Batch 11 (files 130–137)
