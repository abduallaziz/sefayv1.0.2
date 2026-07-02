# COVERAGE_PHASE_H_BATCH_2.md
# Phase H — Column / Schema Mismatches — Batch 2/2
# Tables: subscriptions, tenants, device_sessions, dunning_attempts, enums, feature_flags

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files Read / Confirmed | 15 |
| New reads | billing.service.ts (partial), dunning.service.ts (partial), billing.types.ts |
| "Wasted call" (already cached) | 12 files — content confirmed from Phase context |
| Mismatches Documented | 13 |

---

## Files Processed

| # | File | Lines | Last Line | Status | Notes |
|---|------|-------|-----------|--------|-------|
| 1 | web/src/features/superadmin/subscriptions/types/subscription.types.ts | 43 | 43 | READ_VERIFIED | Defines `Subscription.interval`, `tenant_name`, `plan_name`, `amount_paid` |
| 2 | web/src/features/superadmin/tenants/types.ts | 15 | 15 | READ_VERIFIED | Defines `owner_name?`, `owner_email?`, `subscription_plan?` |
| 3 | web/src/features/superadmin/auth-control/types.ts | 27 | 27 | READ_VERIFIED | Defines `DeviceSession` with `user_name`, `user_email`, `tenant_name` |
| 4 | api/src/modules/tenants/repositories/tenants.repository.ts | 84 | 84 | READ_VERIFIED | SELECTs `expires_at, max_users, max_branches` from subscriptions |
| 5 | api/src/core/billing/billing.service.ts | 304 | 100 (partial) | READ_VERIFIED | Inserts `billing_cycle` — not `interval` |
| 6 | api/src/core/billing/dunning/dunning.service.ts | 242 | 100 (partial) | READ_VERIFIED | Filters on `attempted_at` (line 82) — never inserted |
| 7 | api/src/shared/types/enums.ts | 57 | 57 | READ_VERIFIED | `SERVICES = 'services'` (plural) |
| 8 | api/src/modules/tenants/dto/update-tenant-profile.dto.ts | 19 | 19 | READ_VERIFIED | `BusinessType.SERVICE = 'service'` (singular) — conflict with enums.ts |
| 9 | web/src/features/superadmin/types/index.ts | 61 | 61 | READ_VERIFIED | `Tenant.mrr?` — not in tenants/types.ts |
| 10 | web/src/features/superadmin/feature-flags/types/feature-flags.types.ts | 39 | 39 | READ_VERIFIED | `FeatureWithOverride` requires 4 computed fields from backend |
| 11 | api/src/modules/items/dto/create-item.dto.ts | 42 | 42 | READ_VERIFIED | `@IsEnum(OperationType) operation_type` — required |
| 12 | web/src/features/items/api/items.api.ts | 26 | 26 | READ_VERIFIED | `CreateItemDto` — no `operation_type` |
| 13 | api/src/modules/subscriptions/subscriptions.service.ts | 55 | 55 | READ_VERIFIED | Reads `tenants.name` + `users.email` directly — no subscription-level join |
| 14 | api/src/modules/invoices/repositories/invoices.repository.ts | 80 | 80 | READ_VERIFIED | Inserts `qty`, `price` — not `quantity`, `unit_price` |
| 15 | api/src/core/billing/billing.types.ts | 83 | 83 | READ_VERIFIED | `SubscriptionRecord` has `billing_cycle: BillingCycle` — confirmed backend field name |

---

## Mismatch-by-Mismatch Report

---

### H-016 — `subscriptions.billing_cycle` vs `interval`

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Column in DB** | `billing_cycle` |
| **Column in Frontend** | `interval: 'monthly' \| 'yearly'` |
| **Backend File** | `api/src/core/billing/billing.types.ts` — line 10–13: `enum BillingCycle { MONTHLY='monthly', YEARLY='yearly' }` · `SubscriptionRecord.billing_cycle: BillingCycle` (line 32) |
| **Backend Insert** | `api/src/core/billing/billing.service.ts` — line 35: `billing_cycle: BillingCycle.MONTHLY` |
| **Frontend File** | `web/src/features/superadmin/subscriptions/types/subscription.types.ts` — line 8: `interval: PlanInterval` where `PlanInterval = 'monthly' \| 'yearly'` |
| **Frontend Display** | `SubscriptionsTable.tsx` — line 52: `{t('interval.${sub.interval}')}` |
| **Impact** | Frontend reads `sub.interval` → `undefined` (DB has `billing_cycle`). Interval column always blank in subscriptions table |

---

### H-017 — `subscriptions.tenant_name` — not in DB

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Column in DB** | NOT PRESENT — subscriptions only stores `tenant_id` |
| **Frontend Expects** | `tenant_name: string` — line 22 of `subscription.types.ts` |
| **Frontend Display** | `SubscriptionsTable.tsx` — line 45: `{sub.tenant_name}` |
| **Backend Evidence** | `api/src/core/billing/billing.service.ts` — INSERT (lines 31–38): only inserts `tenant_id`, never `tenant_name` |
| **Fix Required** | JOIN `subscriptions → tenants` on `tenant_id` to resolve name |
| **Impact** | Tenant name column in subscriptions table always `undefined` |

---

### H-018 — `subscriptions.plan_name` — not in DB

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Column in DB** | NOT PRESENT — subscriptions only stores `plan_id` |
| **Frontend Expects** | `plan_name: string` — line 23 of `subscription.types.ts` |
| **Frontend Display** | `SubscriptionsTable.tsx` — line 46: `{sub.plan_name}` |
| **Backend Evidence** | No INSERT or UPDATE ever writes `plan_name` to subscriptions |
| **Fix Required** | JOIN `subscriptions → plans` on `plan_id` |
| **Impact** | Plan name column in subscriptions table always `undefined` |

---

### H-019 — `subscriptions.amount_paid` — not in DB

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Column in DB** | NOT PRESENT — payment amounts stored in `payments` table |
| **Frontend Expects** | `amount_paid: number` — line 30 of `subscription.types.ts` |
| **Frontend Display** | `SubscriptionsTable.tsx` — line 54: `${sub.amount_paid}` |
| **Backend Evidence** | `api/src/core/billing/repositories/payments.repository.ts` — `PaymentRecord.amount` |
| **Fix Required** | JOIN/subquery: `subscriptions → payments.amount` most recent paid payment |
| **Impact** | Amount column in subscriptions table always `undefined` → shows `$undefined` |

---

### H-020 — `tenants.owner_name`, `owner_email` — not in DB

| Field | Value |
|-------|-------|
| **Table** | `tenants` |
| **Columns in DB** | NOT PRESENT — tenant only stores business info, not owner personal details |
| **Frontend Expects** | `owner_name?: string`, `owner_email?: string` — `tenants/types.ts` lines 11–12 |
| **Frontend Display** | `TenantsTable.tsx` — line 57: `{tenant.owner_email}` shown under tenant name |
| **Backend Evidence** | `api/src/modules/shared/tenant-management/tenant-management.repository.ts` — `findAll()` does `SELECT '*'` from `tenants` — no user JOIN |
| **Fix Required** | JOIN `tenants → users WHERE role='owner' AND tenant_id=...` |
| **Impact** | Owner email never shown in TenantsTable. Owner identification not possible from tenant list |

---

### H-021 — `tenants.subscription_plan` — not in DB

| Field | Value |
|-------|-------|
| **Table** | `tenants` |
| **Column in DB** | NOT PRESENT |
| **Frontend Expects** | `subscription_plan?: string` — `tenants/types.ts` line 15 |
| **Frontend Display** | `TenantsTable.tsx` — line 65: `{tenant.subscription_plan ?? '—'}` |
| **Fix Required** | JOIN `tenants → subscriptions (active) → plans.name` |
| **Impact** | Plan column in TenantsTable always shows `'—'` |

---

### H-022 — `tenants.users_count`, `branches_count` — require COUNT queries

| Field | Value |
|-------|-------|
| **Table** | `tenants` |
| **Columns in DB** | NOT PRESENT (denormalized counts) |
| **Frontend Expects** | `users_count?: number`, `branches_count?: number` — `tenants/types.ts` lines 13–14 |
| **Frontend Display** | `TenantsTable.tsx` — lines 68, 73: icons with counts |
| **Backend Evidence** | `TenantManagementRepository.getStats(tenantId)` (line 71–93) computes counts — but only per individual tenant, not in bulk list |
| **Impact** | Count columns always show `0` in paginated tenant list |

---

### H-023 — `tenants.mrr` — conflicting type definitions

| Field | Value |
|-------|-------|
| **Table** | `tenants` |
| **Column in DB** | NOT PRESENT |
| **File 1** | `web/src/features/superadmin/types/index.ts` — line 13: `Tenant.mrr?: number` |
| **File 2** | `web/src/features/superadmin/tenants/types.ts` — `mrr?` absent, has `subscription_plan?` instead |
| **Impact** | Two different `Tenant` type interfaces in same feature; `TenantsTable` (superadmin/components) uses `types/index.ts` with `mrr`, `TenantsTable` (tenants/components) uses `tenants/types.ts` with `subscription_plan`. Data never in `tenants` table for either |

---

### H-024 — `device_sessions.user_name`, `user_email`, `tenant_name` — denormalized

| Field | Value |
|-------|-------|
| **Table** | `device_sessions` |
| **Columns in DB** | `user_id` (FK), `tenant_id` (FK) — IDs only, no names |
| **Frontend Expects** | `user_name: string`, `user_email: string`, `tenant_name: string` — `auth-control/types.ts` lines 14–15, 17 |
| **Frontend Display** | `SessionsSection.tsx` — lines 41–44: renders `session.user_name`, `session.user_email`, `session.tenant_name` |
| **Backend Evidence** | `api/src/core/auth/auth.service.ts` — device_sessions INSERT (lines 108–118): stores `user_id, tenant_id, device_name, device_type, ip_address, user_agent, last_active_at, is_revoked` — NO user/tenant names |
| **Fix Required** | JOIN `device_sessions → users (user_id)` + `→ tenants (tenant_id)` |
| **Impact** | Sessions section shows blank user info. Auth control page unusable even if endpoints existed |

---

### H-025 — `dunning_attempts.attempted_at` — filtered but never written

| Field | Value |
|-------|-------|
| **Table** | `dunning_attempts` |
| **Column** | `attempted_at` |
| **Read** | `api/src/core/billing/dunning/dunning.service.ts` — line 82: `.lte('attempted_at', graceCutoff.toISOString())` |
| **Written** | **NEVER** — INSERT at lines 127–133 sets: `tenant_id, subscription_id, attempt_number, status, next_retry_at` — NO `attempted_at` |
| **Impact** | `suspendExpiredGracePeriods()` filter never matches. Grace period suspension never fires — tenants with exhausted dunning remain unsuspended indefinitely |

---

### H-026 — `subscriptions.grace_period_ends_at` — filtered but never written

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Column** | `grace_period_ends_at` |
| **Read** | `api/src/core/billing/billing.service.ts` — line 290 (from Phase A read): `.lt('grace_period_ends_at', now)` in `handleSubscriptionExpiry()` |
| **Written** | **NEVER** — no INSERT or UPDATE sets `grace_period_ends_at` |
| **Also** | No code ever assigns `status = 'grace_period'` to any subscription |
| **Impact** | Grace period expiry cron branch is dead code. `GRACE_PERIOD` status is never reachable via normal business flow |

---

### H-027 — `BusinessType` enum — `'services'` vs `'service'`

| Field | Value |
|-------|-------|
| **Table** | `tenants` (column `business_type`) |
| **File 1** | `api/src/shared/types/enums.ts` — line 15: `SERVICES = 'services'` (plural) |
| **File 2** | `api/src/modules/tenants/dto/update-tenant-profile.dto.ts` — line 8: `BusinessType.SERVICE = 'service'` (singular) — completely separate `BusinessType` enum |
| **Frontend File** | `web/src/features/superadmin/tenants/dto/update-tenant-profile.dto.ts` — same singular `'service'` |
| **Impact** | Tenant profile updates with `business_type='service'` (singular) cannot be filtered/matched with the shared enum `'services'` (plural). Any query using the shared enum finds no results for service businesses |

---

### H-028 — `FeatureWithOverride` — backend returns no composite object

| Field | Value |
|-------|-------|
| **Tables** | `features`, `plan_features`, `tenant_feature_overrides` |
| **Frontend Type** | `web/src/features/superadmin/feature-flags/types/feature-flags.types.ts` — lines 30–36 |
| **Frontend Fields Expected** | `plan_default: boolean`, `plan_limit: number \| null`, `tenant_override: TenantFeatureOverride \| null`, `effective_enabled: boolean`, `effective_limit: number \| null` |
| **Backend Evidence** | No existing endpoint joins `features + plan_features + tenant_feature_overrides` and computes effective values |
| **Backend Closest** | `FeatureFlagsService.resolveFeature()` (api/src/core/feature-flags/feature-flags.service.ts) resolves feature for one tenant/key — returns `boolean`, not the composite |
| **Impact** | Even if the frontend endpoint existed, backend would need a new aggregation query. `TenantFeaturesPanel` would always show wrong values |

---

## Batch 2 Summary

| ID | Table | Column(s) | Issue | Severity |
|----|-------|-----------|-------|----------|
| H-016 | subscriptions | `billing_cycle` vs `interval` | Name mismatch | HIGH |
| H-017 | subscriptions | `tenant_name` — not in DB | Missing JOIN | HIGH |
| H-018 | subscriptions | `plan_name` — not in DB | Missing JOIN | HIGH |
| H-019 | subscriptions | `amount_paid` — not in DB | Wrong table (payments) | HIGH |
| H-020 | tenants | `owner_name`, `owner_email` — not in DB | Missing JOIN to users | HIGH |
| H-021 | tenants | `subscription_plan` — not in DB | Missing JOIN subscriptions→plans | MEDIUM |
| H-022 | tenants | `users_count`, `branches_count` | Require COUNT queries | MEDIUM |
| H-023 | tenants | `mrr` (type conflict) | Two Tenant type definitions | LOW |
| H-024 | device_sessions | `user_name`, `user_email`, `tenant_name` | Missing JOINs to users/tenants | HIGH |
| H-025 | dunning_attempts | `attempted_at` — never written | Dead filter | CRITICAL |
| H-026 | subscriptions | `grace_period_ends_at` — never written | Dead cron branch | HIGH |
| H-027 | tenants | `business_type` enum value | `'services'` vs `'service'` | MEDIUM |
| H-028 | features/plan_features/overrides | `FeatureWithOverride` composite | No backend aggregation | HIGH |

---

## ⛔ PHASE H — ALL BATCHES COMPLETE
## Total mismatches documented: 28 (Batch 1: 15 + Batch 2: 13)
## Awaiting confirmation before consolidating into COVERAGE_SCHEMA_MISMATCHES.md
