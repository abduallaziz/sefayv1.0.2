# SaaS Licensing & Subscription Platform

*Status: Partially Implemented (SuperAdmin layer) — Tenant-facing layer not yet built*
*Added: 2026-06-30*

---

## Overview and Motivation

Sefay is a multi-tenant SaaS ERP. The commercial engine that governs which tenants can access which features, at what usage limits, and for how long — is the SaaS Licensing Platform. This is **not** customer recurring billing (that is handled by the Subscription Billing module planned for a future business module). This is Sefay's own internal licensing and monetization infrastructure.

A mature SaaS licensing platform allows Sefay to:
- Define and manage subscription plans with feature entitlements and resource limits.
- Enforce those limits at runtime so a Starter plan tenant cannot exceed their seat count or use a Premium-tier feature.
- Give tenants a self-service portal to manage their own subscription, view invoice history, and upgrade or downgrade without requiring Sefay support.
- Track usage metering against plan limits for AI tokens, API calls, and storage.
- Run promotions and coupons to support sales motions.
- Analyze subscription health (MRR, ARR, churn, growth) through a dedicated analytics dashboard.

---

## Current State (What Already Exists)

The SuperAdmin layer has a working foundation. The following is **already implemented** and must not be rebuilt:

### Plans (`src/features/superadmin/subscriptions/`)
- `Plan` model: `name`, `description`, `price_monthly`, `price_yearly`, `max_users`, `max_branches`, `trial_days`, `is_active`
- Plan CRUD: create, edit, toggle active/inactive
- `PlanCard` UI, `PlanFormDialog`

### Subscriptions
- `Subscription` model: `tenant_id`, `plan_id`, `status`, `billing_cycle`, `started_at`, `current_period_end`, `cancelled_at`, `trial_ends_at`
- `SubscriptionStatus` enum: `active | trial | cancelled | expired | suspended | grace_period`
- `BillingCycle` enum: `monthly | yearly`
- Manual payment recording (`ManualPaymentDialog`, `ManualPaymentDto`)
- Subscription list with search and status filter (`SubscriptionsTable`)
- Cancel subscription action

### Feature Entitlements (`src/features/superadmin/feature-flags/`)
- `Feature` model: `key`, `name`, `description`, `category` (core / advanced / premium), `is_enabled`
- `PlanFeature`: per-plan feature enablement + `limit_value` (numeric quota per feature per plan)
- `TenantFeatureOverride`: per-tenant override of any feature flag or limit, with `overridden_by`, `overridden_at`, `note`
- `FeatureWithOverride`: resolved effective state (`effective_enabled`, `effective_limit`) after plan + override evaluation
- `OverrideLimitDialog` for SuperAdmin to apply per-tenant overrides
- Global features panel + tenant-specific overrides panel

### Analytics (SuperAdmin types)
- `AnalyticsSummary`: MRR, ARR, totalTenants, activeTenants, trialTenants, churnRate, growthRate, newTenantsThisMonth
- `MRRHistoryPoint`, `ChurnData`, `GrowthData`, `RevenueByPlanItem`
- Tenant model includes `mrr`, `users_count`, `branches_count`, `subscription_plan`

---

## What Is Missing

The following capabilities are **not yet implemented** and represent the open scope of this initiative:

### 1. Extended Plan Limits
The `Plan` model currently only tracks `max_users` and `max_branches`. Missing resource limits:

| Limit Field | Description |
|---|---|
| `max_warehouses` | Maximum warehouse count per tenant on this plan |
| `max_storage_gb` | Storage quota in gigabytes (for company branding assets, document attachments, PDF archives) |
| `max_ai_tokens_monthly` | AI token budget per month (for Phase 8 AI Features) |
| `max_api_calls_monthly` | Public API call quota per month (for the planned Public API — see `docs/future/README.md`) |
| `max_locations` | Maximum location count per tenant |
| `max_products` | Maximum product catalogue size (relevant for Starter plans) |

These limits must be added as columns on the `plans` table and exposed through the existing `PlanFormDialog`.

### 2. Usage Metering Infrastructure
The `limit_value` field exists on `PlanFeature` and `TenantFeatureOverride` but there is no infrastructure to:
- Track actual usage against limits in real time (current user count, current warehouse count, current storage consumed, current AI tokens consumed this month, current API calls this month).
- Enforce limits at the API layer before allowing a resource-creating operation.
- Surface current usage vs. limit in the SuperAdmin tenant detail view.
- Surface current usage vs. limit to the tenant in their own settings.

**Required components:**
- A `usage_snapshots` table (or real-time computed metrics from existing tables) tracking current usage per `tenant_id` per resource type.
- A `checkLimit(tenantId, featureKey)` service function called before any resource-creating operation.
- A usage dashboard in SuperAdmin Tenant Detail.
- A usage summary in the tenant's own Settings → Subscription page.

### 3. Tenant Self-Service Billing Portal
Tenants currently have no way to manage their own subscription without contacting Sefay. Required:

- **Subscription overview page** (Settings → Subscription): current plan, status, renewal date, seat usage, storage usage.
- **Plan comparison page**: visual comparison of available plans with feature matrices and pricing.
- **Upgrade / Downgrade flow**: tenant selects a new plan, sees proration calculation, confirms, payment is processed.
- **Invoice history**: list of past payments with downloadable PDF receipts.
- **Billing settings**: stored payment method, billing address, tax ID.
- **Cancellation flow**: multi-step cancellation with retention prompts and an exit survey.

This is the tenant-facing counterpart to the SuperAdmin-facing Subscriptions page that already exists.

### 4. Coupon & Promotion System
No coupon or promotion mechanism exists. Required:

- `coupons` table: `code`, `discount_type` (percentage / fixed), `discount_value`, `applies_to_plan_ids`, `max_uses`, `uses_count`, `valid_from`, `valid_until`, `is_active`
- Coupon application at upgrade/subscribe time
- SuperAdmin CRUD for coupons
- Coupon analytics (uses, revenue impact)

### 5. Subscription Analytics Dashboard
The type definitions for MRR/ARR/churn/growth exist but there is no dedicated analytics dashboard page in the SuperAdmin area. Required:

- MRR and ARR trend chart (monthly)
- Churn rate trend
- New tenants per month vs. churned tenants
- Revenue by plan breakdown
- Trial conversion rate
- Average revenue per user (ARPU)
- Lifetime value (LTV) estimate

### 6. Grace Period Enforcement
`SubscriptionStatus` includes `grace_period` but there is no documented logic for:
- When a subscription transitions to `grace_period` (e.g. payment failed, still within N-day grace window).
- What access restrictions apply during grace period.
- What triggers the transition from `grace_period` to `suspended`.
- What notifications are sent during the grace period.

This logic must be defined before the grace period status is used in production.

### 7. Upgrade / Downgrade Proration Logic
No proration calculation exists. When a tenant upgrades mid-billing-cycle:
- How is the credit for unused days on the current plan calculated?
- How is the charge for the new plan's remaining days calculated?
- Is proration applied immediately or at the next renewal date?

This must be defined and documented before the self-service upgrade flow is built.

---

## Architecture

### Entitlement Evaluation
The existing `FeatureWithOverride` pattern is the correct architecture. The entitlement resolution order is:

```
1. Global feature default (Feature.is_enabled)
2. Plan-level override (PlanFeature.is_enabled, PlanFeature.limit_value)
3. Tenant-level override (TenantFeatureOverride.is_enabled, TenantFeatureOverride.limit_value)
→ Resolved: FeatureWithOverride.effective_enabled, effective_limit
```

This pattern must be extended to cover numeric limits (not just boolean flags) and must be checked at the API layer before any resource-creating operation.

### Limit Enforcement Pattern
```ts
// Example: before creating a new warehouse
const canCreate = await checkLimit(companyId, 'warehouses');
if (!canCreate.allowed) {
  throw new LimitExceededError('warehouses', canCreate.current, canCreate.limit);
}
```

The `checkLimit` function must be a shared service function in `src/shared/services/entitlements.ts`, not duplicated per resource type.

---

## Data Model Additions

### `plans` table (additions)
```sql
ALTER TABLE plans ADD COLUMN max_warehouses    integer NOT NULL DEFAULT 1;
ALTER TABLE plans ADD COLUMN max_locations     integer NOT NULL DEFAULT 10;
ALTER TABLE plans ADD COLUMN max_products      integer NOT NULL DEFAULT 500;
ALTER TABLE plans ADD COLUMN max_storage_gb    integer NOT NULL DEFAULT 1;
ALTER TABLE plans ADD COLUMN max_ai_tokens_monthly  integer NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN max_api_calls_monthly  integer NOT NULL DEFAULT 0;
```

### `coupons` table (new)
```sql
CREATE TABLE coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  discount_type   text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  numeric NOT NULL,
  applies_to_plans uuid[],          -- null = all plans
  max_uses        integer,          -- null = unlimited
  uses_count      integer NOT NULL DEFAULT 0,
  valid_from      timestamptz,
  valid_until     timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### `usage_snapshots` table (new)
```sql
CREATE TABLE usage_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  snapshot_date   date NOT NULL DEFAULT CURRENT_DATE,
  users_count     integer NOT NULL DEFAULT 0,
  branches_count  integer NOT NULL DEFAULT 0,
  warehouses_count integer NOT NULL DEFAULT 0,
  locations_count integer NOT NULL DEFAULT 0,
  products_count  integer NOT NULL DEFAULT 0,
  storage_bytes   bigint NOT NULL DEFAULT 0,
  ai_tokens_month integer NOT NULL DEFAULT 0,
  api_calls_month integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, snapshot_date)
);
```

---

## Security Considerations

- The tenant self-service portal must enforce that a tenant can only view and modify their own subscription. `tenant_id` scoping via RLS applies.
- Upgrade/downgrade operations that involve payment must require re-authentication (password confirmation), following the same pattern as Company Factory Reset.
- Coupon codes must not be enumerable — brute-force coupon discovery must be rate-limited.
- Limit enforcement must occur at the backend service layer, not only in the frontend UI. A tenant cannot bypass a seat limit by calling the API directly.

---

## Dependencies

- **Phase 9 (Company Branding)** must align storage quotas with the StorageProvider (Phase 11).
- **Phase 8 (AI Features)** must consume AI token quotas from the entitlement system.
- **Phase 13 (Public API)** must consume API call quotas from the entitlement system.
- The `checkLimit` service must be in place before Phase 9, Phase 8, or Phase 13 begin, so those phases can enforce their respective quotas without building custom enforcement.

---

## Implementation Milestones

1. **Extend Plan model** — add missing quota fields to `plans` table and `PlanFormDialog`.
2. **Usage metering** — create `usage_snapshots`, populate via scheduled job, expose in SuperAdmin Tenant Detail.
3. **Limit enforcement** — implement `checkLimit` service; wire into Warehouses, Users, Locations, Products create operations.
4. **Coupon system** — `coupons` table, SuperAdmin CRUD, apply at subscription creation.
5. **Tenant self-service portal** — Settings → Subscription page (plan overview, usage, upgrade/downgrade, invoice history).
6. **Subscription analytics dashboard** — MRR/ARR/churn/growth charts in SuperAdmin.
7. **Grace period enforcement** — define and implement transition rules, notifications.

---

## Future Enhancements

- **Annual billing discount automation**: automatically apply a configurable percentage discount for yearly billing vs. monthly (currently this requires manual plan pricing).
- **Seat-based billing**: charge per seat above the plan minimum (e.g. base plan includes 5 users, each additional user is SAR 50/month).
- **Usage-based billing components**: charge per AI token consumed beyond the plan quota, rather than hard-blocking.
- **Revenue recognition integration**: when the Advanced Accounting module (see `docs/future/advanced-accounting.md`) is built, subscription revenue must flow through the Posting Engine for deferred revenue recognition on annual plans.
- **Partner / Reseller commissions**: track and calculate commission for reseller partners who refer tenants.
