# COVERAGE_PHASE_E_BATCH_9.md
# Phase E — web/src — Batch 9/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 10.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 114 / 168 = 67.9% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 100 | features/superadmin/components/command-palette.tsx | 302 | 302 | READ_VERIFIED | **None — all handlers are empty `() => {}`** | None | Fully functional UI (search, keyboard nav, danger confirmation) with 20 commands across 6 categories. All `handler: () => {}` on line 51–71. Zero backend connectivity. Pure cosmetic UI |
| 101 | features/superadmin/components/dir | 1 | 1 | READ_VERIFIED | None | None | **Accidental empty file** — likely created by `dir` or `ls` command redirect. PowerShell confirms it is a regular file (not directory) with 1 empty line. No code content |
| 102 | features/superadmin/components/overview-cards.tsx | 122 | 122 | READ_VERIFIED | None direct — receives `stats: OverviewStats` as prop | `tenants`: `total_tenants,active_tenants` · billing: `mrr,arr` | Displays 4 stat cards: Total Tenants, MRR ($), Active Tenants, ARR ($k). Change % values are **hardcoded** (12%, 8%, 5%, -2%) — not from API |
| 103 | features/superadmin/components/revenue-chart.tsx | 100 | 100 | READ_VERIFIED | None direct — receives `data: RevenueData[]` as prop | `orders`/`subscriptions` (implied): `month,revenue,tenants` fields | Recharts AreaChart. Period selector (7D/1M/3M/1Y) — **client-side only, no re-fetch on period change**. Period buttons change display state but don't change the data source |
| 104 | features/superadmin/components/system-health.tsx | 136 | 136 | READ_VERIFIED | **None — 100% hardcoded mock** | None | `mockServices` hardcoded (line 26–33): api/database/queue/ai/storage/payments. Status: queue=warning, payments=critical. Does NOT call `GET /superadmin/health`. Live clock via `setInterval` is only real-time element |
| 105 | features/superadmin/components/tenants-table.tsx | 138 | 138 | READ_VERIFIED | None direct — receives `tenants: Tenant[]` as prop | `tenants`: `id,name,business_type,status,users_count,branches_count,mrr,created_at` | Client-side search + status filter. Actions: activate, deactivate, extendTrial (via parent callbacks). `users_count`, `branches_count`, `mrr` expected but likely not returned by current `GET /superadmin/tenants` endpoint |
| 106 | features/superadmin/feature-flags/FeatureFlagsPage.tsx | 69 | 69 | READ_VERIFIED | None direct | None | **`MOCK_TENANTS` hardcoded** (3 tenants, lines 8–12). Should use real tenant list from API. Two views: global (GlobalFeaturesPanel) + tenant (TenantFeaturesPanel with sidebar) |
| 107 | features/superadmin/feature-flags/api/feature-flags.api.ts | 28 | 28 | READ_VERIFIED | `GET /superadmin/features`, `GET /superadmin/plans/:planId/features`, `GET /superadmin/tenants/:id/features`, `PATCH /superadmin/tenants/:id/features/:featureKey`, `DELETE /superadmin/tenants/:id/features/:featureKey/override` | `features`: `key,name,description,category,is_enabled` · `plan_features`: `plan_id,feature_key,is_enabled,limit_value` · `tenant_feature_overrides`: `tenant_id,feature_key,is_enabled,limit_value,note` | ⚠ **All 5 endpoints non-existent in backend.** Backend uses: `GET /superadmin/tenants/:id/feature-overrides` and `PATCH /superadmin/tenants/:id/feature-overrides/:featureKey`. No `/superadmin/features` endpoint exists |
| 108 | features/superadmin/feature-flags/components/FeatureCategoryBadge.tsx | 19 | 19 | READ_VERIFIED | None | None | Badge component for `core`/`advanced`/`premium` categories. Pure display |
| 109 | features/superadmin/feature-flags/components/FeatureRow.tsx | 94 | 94 | READ_VERIFIED | Via `useUpsertOverride()` → `PATCH /superadmin/tenants/:id/features/:key`, `useResetOverride()` → `DELETE /superadmin/tenants/:id/features/:key/override` | `tenant_feature_overrides`: `tenant_id,feature_key,is_enabled,limit_value,note` | Toggle + limit override + reset. Both mutations depend on non-existent endpoints |
| 110 | features/superadmin/feature-flags/components/GlobalFeaturesPanel.tsx | 44 | 44 | READ_VERIFIED | Via `useFeatures()` → `GET /superadmin/features` | `features`: `key,name,description,category,is_enabled` | Read-only list of all global features. Calls non-existent endpoint |
| 111 | features/superadmin/feature-flags/components/OverrideLimitDialog.tsx | 79 | 79 | READ_VERIFIED | Via `useUpsertOverride()` → `PATCH /superadmin/tenants/:id/features/:key` | `tenant_feature_overrides`: `feature_key,is_enabled,limit_value,note` | Dialog to set `limit_value` + `note` for a tenant feature override |
| 112 | features/superadmin/feature-flags/components/TenantFeaturesPanel.tsx | 65 | 65 | READ_VERIFIED | Via `useTenantFeatures(tenantId)` → `GET /superadmin/tenants/:id/features` | `features`+`tenant_feature_overrides` joined: `key,name,description,category,plan_default,plan_limit,tenant_override,effective_enabled,effective_limit` | Calls non-existent endpoint. `FeatureWithOverride` type requires backend to return joined/computed object |
| 113 | features/superadmin/feature-flags/hooks/useFeatureFlags.ts | 39 | 39 | READ_VERIFIED | All via `featureFlagsApi`: getFeatures, getTenantFeatures, upsertOverride, resetOverride | None direct | 4 hooks. All depend on non-existent endpoints. Cache invalidates `['tenant-features', tenantId]` on mutations |
| 114 | features/superadmin/feature-flags/types/feature-flags.types.ts | 39 | 39 | READ_VERIFIED | None | `features`: `id,key,name,description,category,is_enabled` · `plan_features`: `plan_id,feature_key,is_enabled,limit_value` · `tenant_feature_overrides`: `id,tenant_id,feature_key,is_enabled,limit_value,overridden_by,overridden_at,note` · `FeatureWithOverride` computed: `plan_default,plan_limit,effective_enabled,effective_limit` | Confirms all column names for feature flag tables. `FeatureWithOverride` extends `Feature` with 4 computed fields requiring backend aggregation |

---

## Key Findings

### ⚠ CRITICAL: Feature Flags — All 5 API Endpoints Non-Existent (file 107)

| Frontend Endpoint | Backend Status | Closest Backend Path |
|-------------------|---------------|---------------------|
| `GET /superadmin/features` | ❌ NOT FOUND | No equivalent |
| `GET /superadmin/plans/:id/features` | ❌ NOT FOUND | No equivalent |
| `GET /superadmin/tenants/:id/features` | ❌ NOT FOUND | `GET /superadmin/tenants/:id/feature-overrides` (different) |
| `PATCH /superadmin/tenants/:id/features/:key` | ❌ NOT FOUND | `PATCH /superadmin/tenants/:id/feature-overrides/:featureKey` (different path) |
| `DELETE /superadmin/tenants/:id/features/:key/override` | ❌ NOT FOUND | No DELETE endpoint for overrides |

The entire FeatureFlags UI (global view + tenant view + overrides) will fail to load or save.

### ⚠ `FeatureWithOverride` Requires Backend Aggregation (file 114)
Frontend type expects backend to return:
```ts
{
  ...Feature,
  plan_default: boolean,       // needs plan lookup
  plan_limit: number | null,   // needs plan_features lookup
  tenant_override: TenantFeatureOverride | null,  // needs tenant_feature_overrides lookup
  effective_enabled: boolean,  // computed: override > plan > global
  effective_limit: number | null  // computed
}
```
No existing backend endpoint returns this composite object.

### ⚠ Command Palette — All Handlers Empty (file 100)
20 commands defined. All `handler: () => {}`. Categories include dangerous operations (Suspend Tenant, Delete Tenant, Force Logout All Users) that are cosmetic only. No backend calls ever made.

### ⚠ System Health — 100% Hardcoded Mock (file 104)
`SystemHealth` component **does not call** `GET /superadmin/health` (which exists and works).
Shows hardcoded `mockServices` with queue=warning and payments=critical. These are fake statuses.

### ⚠ TenantsTable Expects Missing Fields (file 105)
Frontend `Tenant` type includes `users_count`, `branches_count`, `mrr`.
Backend `GET /superadmin/tenants` (via `TenantManagementRepository.findAll()`) returns `select('*')` from `tenants` table — which has `id, name, status, business_type, created_at, deleted_at` but NOT `users_count`, `branches_count`, or `mrr`.
These would display as `'-'` in the table.

### Revenue Chart Period Selector is Cosmetic (file 103)
Period buttons (7D/1M/3M/1Y) only change UI state. No re-fetch occurs on period change. All periods show the same data passed via `data` prop.

### File #101 (`dir`) is an Accidental Empty File
Confirmed: regular file, 1 empty line. Should be deleted. Not part of application logic.

---

## ⛔ STOPPED — Batch 9/21 Complete. Awaiting confirmation for Batch 10 (files 115–122).
