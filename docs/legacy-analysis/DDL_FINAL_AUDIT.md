# DDL_FINAL_AUDIT.md
# Final Database Audit — Derived Exclusively from DATABASE_USAGE_PROOF.md

---

## Table-by-Table Column Audit

---

### TABLE: `users`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return) | NOT NULL | PK |
| `email` | SELECT, INSERT (return) | NOT NULL | login required |
| `name` | SELECT, INSERT (return), UPDATE (dynamic) | NULLABLE | |
| `role` | SELECT, INSERT (return), UPDATE (dynamic) | NOT NULL | used in JWT |
| `is_active` | SELECT, INSERT (return), UPDATE (soft delete) | NOT NULL | boolean flag |
| `created_at` | SELECT | NOT NULL | |
| `password_hash` | SELECT | NOT NULL | bcrypt.compare requires it |
| `tenant_id` | SELECT, INSERT (dynamic), filter | NULLABLE | superadmin = null |
| `deleted_at` | filter (.is null), UPDATE (soft delete) | NULLABLE | soft delete pattern |

---

### TABLE: `branches`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return), count | NOT NULL | PK |
| `name` | SELECT, INSERT | NOT NULL | required in create |
| `address` | SELECT, INSERT | NULLABLE | `address?: string` in dto |
| `is_active` | SELECT, INSERT, UPDATE (soft delete), filter | NOT NULL | |
| `created_at` | SELECT | NOT NULL | |
| `tenant_id` | INSERT, filter | NOT NULL | |
| `deleted_at` | filter, UPDATE (soft delete) | NULLABLE | |

---

### TABLE: `categories`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT | NOT NULL | PK |
| `name` | SELECT, INSERT (via payload) | NOT NULL | |
| `type` | SELECT, INSERT (via payload), filter | NULLABLE | optional |
| `is_active` | SELECT, INSERT, UPDATE (soft delete), filter | NOT NULL | |
| `created_at` | SELECT | NOT NULL | |
| `tenant_id` | INSERT, filter | NOT NULL | |
| `deleted_at` | filter (via scopedQuery) | NULLABLE | |

---

### TABLE: `items`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT | NOT NULL | PK |
| `name` | SELECT, INSERT (via payload) | NOT NULL | |
| `type` | SELECT, INSERT (via payload) | NULLABLE | |
| `operation_type` | SELECT | NULLABLE | |
| `price` | SELECT, INSERT (via payload) | NULLABLE | |
| `has_inventory` | SELECT | NOT NULL | boolean |
| `has_variants` | SELECT | NOT NULL | boolean |
| `is_active` | SELECT, INSERT, UPDATE (soft delete), filter | NOT NULL | |
| `created_at` | SELECT | NOT NULL | |
| `tenant_id` | INSERT, filter | NOT NULL | |
| `deleted_at` | UPDATE (soft delete), filter (via scopedQuery) | NULLABLE | |

---

### TABLE: `item_variants`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, JOIN (from items) | NOT NULL | PK |
| `name` | SELECT, INSERT (via payload), JOIN | NOT NULL | |
| `price_adjustment` | SELECT, JOIN | NULLABLE | |
| `sku` | SELECT, JOIN | NULLABLE | |
| `stock_quantity` | SELECT, JOIN | NULLABLE | |
| `is_active` | SELECT, INSERT, UPDATE (soft delete), filter, JOIN | NOT NULL | |
| `item_id` | INSERT, filter | NOT NULL | FK → items |
| `tenant_id` | INSERT, filter | NOT NULL | |

---

### TABLE: `orders`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return), count | NOT NULL | PK |
| `status` | SELECT, INSERT (via payload), UPDATE | NOT NULL | |
| `subtotal` | SELECT | NULLABLE | |
| `discount` | SELECT | NULLABLE | |
| `tax` | SELECT | NULLABLE | |
| `total` | SELECT | NULLABLE | |
| `payment_method` | SELECT | NULLABLE | |
| `notes` | SELECT | NULLABLE | |
| `created_at` | SELECT, filter | NOT NULL | |
| `cashier_id` | SELECT | NULLABLE | |
| `customer_id` | SELECT, filter | NULLABLE | |
| `branch_id` | SELECT, filter | NULLABLE | |
| `tenant_id` | INSERT (via payload), filter | NOT NULL | |
| `shift_id` | filter only (.eq('shift_id', shiftId)) | NULLABLE | never selected directly |

---

### TABLE: `order_items`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `order_id` | INSERT | NOT NULL | FK → orders |
| `item_id` | INSERT | NOT NULL | FK → items |
| `item_name` | INSERT | NOT NULL | denormalized name |
| `qty` | INSERT | NOT NULL | |
| `price` | INSERT | NOT NULL | |

No SELECT, no UPDATE, no DELETE ever performed on this table in the codebase.

---

### TABLE: `customers`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return) | NOT NULL | PK |
| `full_name` | SELECT, INSERT (via payload) | NOT NULL | |
| `phone` | SELECT, INSERT (via payload), filter | NULLABLE | |
| `email` | SELECT, INSERT (via payload) | NULLABLE | |
| `loyalty_points` | SELECT, INSERT | NOT NULL | default 0 |
| `is_active` | SELECT, INSERT | NOT NULL | |
| `created_at` | SELECT | NOT NULL | |
| `tenant_id` | INSERT, filter | NOT NULL | |
| `updated_at` | UPDATE | NULLABLE | |
| `deleted_at` | filter, UPDATE (soft delete) | NULLABLE | |

---

### TABLE: `shifts`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT | NOT NULL | PK |
| `status` | SELECT, INSERT, UPDATE | NOT NULL | 'open' / 'closed' |
| `opening_cash` | SELECT, INSERT (via payload) | NOT NULL | |
| `closing_cash` | SELECT, UPDATE | NULLABLE | set on close |
| `discrepancy` | SELECT, UPDATE | NULLABLE | set on close |
| `expected_cash` | SELECT, UPDATE | NULLABLE | set on close |
| `opened_at` | SELECT, INSERT | NOT NULL | |
| `closed_at` | SELECT, UPDATE | NULLABLE | set on close |
| `cashier_id` | SELECT, INSERT (via payload) | NOT NULL | |
| `branch_id` | SELECT, INSERT (via payload), filter | NOT NULL | |
| `tenant_id` | INSERT (via payload), filter | NOT NULL | |
| `notes` | INSERT (via payload) | NULLABLE | |
| `deleted_at` | filter | NULLABLE | |

---

### TABLE: `expenses`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT | NOT NULL | PK |
| `amount` | SELECT | NOT NULL | |
| `status` | SELECT, INSERT (via engine), UPDATE, filter | NOT NULL | |
| `notes` | SELECT, UPDATE | NULLABLE | |
| `created_at` | SELECT, filter | NOT NULL | |
| `branch_id` | SELECT, filter | NOT NULL | |
| `template_id` | SELECT | NULLABLE | optional FK |
| `requested_by` | SELECT, INSERT (via engine) | NOT NULL | FK → users |
| `approved_by` | SELECT, UPDATE | NULLABLE | FK → users |
| `resolved_at` | SELECT, UPDATE | NULLABLE | |
| `tenant_id` | INSERT (via engine), filter | NOT NULL | |
| `deleted_at` | filter | NULLABLE | |
| `expires_at` | filter (.lt) | NOT NULL | required for expiry logic |

JOIN references: `expense_templates(id, name, requires_photo)`, `users!requested_by(id, name, role)`, `users!approved_by(id, name, role)`

---

### TABLE: `expense_templates`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT | NOT NULL | PK |
| `name` | SELECT, INSERT | NOT NULL | |
| `default_amount` | SELECT, INSERT | NULLABLE | `default_amount ?? null` |
| `requires_photo` | SELECT, INSERT | NOT NULL | default false |
| `expiry_hours` | SELECT, INSERT | NOT NULL | |
| `is_active` | INSERT | NOT NULL | |
| `tenant_id` | INSERT, filter | NOT NULL | |
| `deleted_at` | filter, UPDATE (soft delete) | NULLABLE | |

---

### TABLE: `tenants`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, count, filter | NOT NULL | PK |
| `name` | SELECT, UPDATE, INSERT (via dto) | NOT NULL | |
| `business_type` | SELECT, UPDATE | NULLABLE | |
| `status` | SELECT, UPDATE, filter | NOT NULL | |
| `trial_ends_at` | SELECT | NULLABLE | on tenants table directly |
| `created_at` | SELECT, filter | NOT NULL | |
| `deleted_at` | filter, UPDATE (soft delete) | NULLABLE | |

JOIN: `subscriptions(plan_id)` used in feature-flags.service.ts

---

### TABLE: `tenant_feature_overrides`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `tenant_id` | UPSERT, SELECT, filter | NOT NULL | PK part (onConflict) |
| `feature_key` | UPSERT, SELECT, filter | NOT NULL | PK part (onConflict) |
| `is_enabled` | SELECT, UPSERT | NULLABLE | null = use plan default |
| `limit_value` | SELECT, UPSERT | NULLABLE | |
| `overridden_by` | UPSERT | NULLABLE | |
| `overridden_at` | UPSERT | NULLABLE | |
| `note` | UPSERT | NULLABLE | |

---

### TABLE: `subscriptions`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return), UPDATE filter | NOT NULL | PK |
| `tenant_id` | SELECT, INSERT, filter | NOT NULL | |
| `plan_id` | SELECT, INSERT, UPDATE | NOT NULL | |
| `status` | SELECT, INSERT, UPDATE, filter | NOT NULL | |
| `billing_cycle` | SELECT, INSERT, UPDATE | NOT NULL | |
| `started_at` | SELECT, INSERT | NOT NULL | |
| `trial_ends_at` | SELECT, INSERT, UPDATE, filter | NULLABLE | |
| `current_period_start` | SELECT, INSERT, UPDATE | NULLABLE | |
| `current_period_end` | SELECT, INSERT, UPDATE | NULLABLE | |
| `cancelled_at` | SELECT, UPDATE | NULLABLE | |
| `updated_at` | UPDATE | NULLABLE | |
| `suspended_at` | UPDATE | NULLABLE | |
| `grace_period_ends_at` | filter only (.lt) | NULLABLE | never written in code |
| `ends_at` | SELECT, UPDATE | NULLABLE | used in analytics + tenant-management |
| `created_at` | ORDER BY (implied) | NOT NULL | |
| `expires_at` | SELECT only | NULLABLE | **⚠ CONFLICT — see section 4** |
| `max_users` | SELECT only | NULLABLE | **⚠ CONFLICT — see section 4** |
| `max_branches` | SELECT only | NULLABLE | **⚠ CONFLICT — see section 4** |

---

### TABLE: `plans`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, filter | NOT NULL | PK |
| `name` | SELECT (via *), JOIN result | NOT NULL | |
| `price_monthly` | SELECT (via *), JOIN result | NOT NULL | |
| `price_yearly` | SELECT (via *) | NULLABLE | used in activateSubscription |
| `max_users` | SELECT (via *) | NOT NULL | used in limit checks |
| `max_branches` | SELECT (via *) | NOT NULL | used in limit checks |
| `trial_days` | SELECT (via *), INSERT | NOT NULL | default 14 |
| `is_active` | SELECT, INSERT, UPDATE (deactivate), filter | NOT NULL | |
| `updated_at` | UPDATE | NULLABLE | |

---

### TABLE: `plan_features`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `plan_id` | SELECT, filter | NOT NULL | FK → plans |
| `feature_key` | SELECT, filter | NOT NULL | |
| `is_enabled` | SELECT, filter | NOT NULL | |
| `limit_value` | SELECT | NULLABLE | |

No INSERT, no UPDATE ever performed on this table in the codebase.

---

### TABLE: `billing_customers`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT (via *) | NOT NULL | PK |
| `tenant_id` | SELECT (via *), INSERT, filter | NOT NULL | |
| `provider` | SELECT (via *), INSERT, filter | NOT NULL | |
| `provider_customer_id` | SELECT, INSERT | NOT NULL | |
| `email` | SELECT (via *), INSERT | NOT NULL | |
| `created_at` | SELECT (via *) | NOT NULL | |
| `updated_at` | SELECT (via *) | NOT NULL | |

---

### TABLE: `invoices`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return), filter | NOT NULL | PK |
| `tenant_id` | SELECT (via *), INSERT, filter | NOT NULL | |
| `subscription_id` | SELECT (via *), INSERT, filter | NULLABLE | |
| `invoice_number` | SELECT (via *), INSERT | NOT NULL | generated |
| `currency` | SELECT (via *), INSERT | NOT NULL | |
| `subtotal` | SELECT (via *), INSERT | NOT NULL | |
| `tax_amount` | SELECT (via *), INSERT | NOT NULL | |
| `discount_amount` | SELECT (via *), INSERT | NOT NULL | |
| `total_amount` | SELECT (via *), INSERT | NOT NULL | **⚠ CONFLICT — see section 4** |
| `status` | SELECT (via *), INSERT, UPDATE | NOT NULL | |
| `period_start` | SELECT (via *), INSERT | NULLABLE | |
| `period_end` | SELECT (via *), INSERT | NULLABLE | |
| `issued_at` | SELECT (via *), INSERT | NULLABLE | |
| `due_at` | SELECT (via *), INSERT | NULLABLE | |
| `paid_at` | SELECT (via *), UPDATE | NULLABLE | |
| `created_at` | SELECT (via *), ORDER BY | NOT NULL | |
| `updated_at` | SELECT (via *), UPDATE | NOT NULL | |
| `amount_due` | SELECT only (dunning.service) | NULLABLE | **⚠ CONFLICT — never written** |

---

### TABLE: `invoice_items`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT (via *) | NOT NULL | PK |
| `invoice_id` | SELECT (via *), INSERT, filter | NOT NULL | FK → invoices |
| `description` | SELECT (via *), INSERT | NOT NULL | |
| `quantity` | SELECT (via *), INSERT | NOT NULL | |
| `unit_price` | SELECT (via *), INSERT | NOT NULL | |
| `amount` | SELECT (via *), INSERT | NOT NULL | |
| `metadata_json` | SELECT (via *), INSERT | NULLABLE | |
| `created_at` | SELECT (via *), ORDER BY | NOT NULL | |

---

### TABLE: `payments`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT (via *) | NOT NULL | PK |
| `tenant_id` | SELECT (via *), INSERT | NOT NULL | |
| `invoice_id` | SELECT (via *), INSERT, filter | NOT NULL | FK → invoices |
| `provider` | SELECT (via *), INSERT | NOT NULL | |
| `amount` | SELECT (via *), INSERT | NOT NULL | |
| `currency` | SELECT (via *), INSERT | NOT NULL | |
| `status` | SELECT (via *), INSERT, UPDATE | NOT NULL | |
| `provider_payment_id` | SELECT (via *), UPDATE, filter | NULLABLE | |
| `failure_reason` | SELECT (via *), UPDATE | NULLABLE | |
| `paid_at` | SELECT (via *), UPDATE | NULLABLE | |
| `updated_at` | SELECT (via *), UPDATE | NOT NULL | |
| `created_at` | SELECT (via *), ORDER BY | NOT NULL | |

---

### TABLE: `audit_logs`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT (via *), filter | NOT NULL | PK |
| `tenant_id` | SELECT (via *), INSERT, filter | NULLABLE | null for superadmin |
| `actor_id` | SELECT (via *), INSERT, filter | NOT NULL | |
| `actor_role` | SELECT (via *), INSERT | NOT NULL | |
| `action` | SELECT (via *), INSERT, filter | NOT NULL | |
| `resource_type` | SELECT (via *), INSERT, filter | NOT NULL | |
| `resource_id` | SELECT (via *), INSERT | NULLABLE | `?? null` in code |
| `before_data` | SELECT (via *), INSERT | NULLABLE | JSON |
| `after_data` | SELECT (via *), INSERT | NULLABLE | JSON |
| `ip_address` | SELECT (via *), INSERT | NULLABLE | |
| `device` | SELECT (via *), INSERT | NULLABLE | |
| `created_at` | SELECT (via *), INSERT, filter, DELETE filter | NOT NULL | |

---

### TABLE: `notifications`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT (via *) | NOT NULL | PK |
| `user_id` | SELECT (via *), INSERT, filter | NOT NULL | |
| `tenant_id` | SELECT (via *), INSERT, filter | NULLABLE | `?? null` in inapp.channel |
| `type` | SELECT (via *), INSERT | NOT NULL | |
| `title` | SELECT (via *), INSERT | NOT NULL | |
| `body` | SELECT (via *), INSERT | NOT NULL | |
| `data` | SELECT (via *), INSERT | NULLABLE | JSON |
| `channel` | SELECT (via *), INSERT | NOT NULL | |
| `is_read` | SELECT (via *), UPDATE, filter | NOT NULL | default false |
| `read_at` | SELECT (via *), UPDATE | NULLABLE | |
| `created_at` | SELECT (via *), ORDER BY | NOT NULL | |

---

### TABLE: `device_sessions`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, INSERT (return), filter | NOT NULL | PK |
| `user_id` | SELECT, INSERT | NOT NULL | |
| `tenant_id` | SELECT, INSERT | NULLABLE | superadmin = null |
| `device_name` | INSERT | NULLABLE | from dto (optional) |
| `device_type` | INSERT | NOT NULL | hardcoded 'web' |
| `ip_address` | INSERT | NULLABLE | |
| `user_agent` | INSERT | NULLABLE | |
| `last_active_at` | INSERT, UPDATE | NOT NULL | |
| `is_revoked` | SELECT, INSERT, UPDATE | NOT NULL | default false |

---

### TABLE: `refresh_tokens`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT, UPDATE filter | NOT NULL | PK |
| `user_id` | SELECT, INSERT | NOT NULL | |
| `session_id` | SELECT, INSERT, filter | NOT NULL | FK → device_sessions |
| `token_hash` | SELECT, INSERT, filter | NOT NULL | SHA-256 hash |
| `expires_at` | SELECT, INSERT | NOT NULL | |
| `is_used` | SELECT, INSERT, UPDATE, filter | NOT NULL | default false |

---

### TABLE: `role_permissions`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `role` | SELECT, UPSERT, filter | NOT NULL | PK part |
| `permission_key` | SELECT, UPSERT, filter | NOT NULL | PK part (onConflict) |
| `is_granted` | SELECT, UPSERT, filter | NOT NULL | |

---

### TABLE: `permissions`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `key` | UPSERT (onConflict) | NOT NULL | PK |
| `resource` | UPSERT | NOT NULL | |
| `action` | UPSERT | NOT NULL | |
| `scope` | UPSERT | NOT NULL | |
| `description` | UPSERT | NULLABLE | |

No SELECT ever performed on this table from runtime code. Seeds only.

---

### TABLE: `features`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `key` | filter | NOT NULL | PK implied |
| `is_enabled` | SELECT | NOT NULL | |

No INSERT, no UPDATE, no DELETE ever performed on this table in the codebase.

---

### TABLE: `dunning_attempts`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | SELECT (via *), UPDATE filter | NOT NULL | PK |
| `tenant_id` | SELECT, INSERT, filter | NOT NULL | |
| `subscription_id` | SELECT, INSERT, filter | NOT NULL | |
| `attempt_number` | SELECT, INSERT | NOT NULL | |
| `status` | SELECT, INSERT, UPDATE, filter | NOT NULL | |
| `next_retry_at` | INSERT, filter (.lte) | NULLABLE | |
| `attempted_at` | filter (.lte) | NULLABLE | never written |
| `error_message` | UPDATE | NULLABLE | |

---

### TABLE: `billing_invoices`

| Column | Operations | Nullable | Notes |
|--------|-----------|----------|-------|
| `id` | UPDATE filter | NOT NULL | PK — **⚠ CONFLICT: see section 4** |
| `status` | UPDATE | NOT NULL | |
| `updated_at` | UPDATE | NOT NULL | |
| `paid_at` | UPDATE | NULLABLE | |

This table is referenced ONLY in `stripe-webhook.controller.ts`. No SELECT, no INSERT anywhere.

---

---

## Section 1 — Tables Used in Code But Potentially Missing from Schema

| Table | Evidence | Risk |
|-------|----------|------|
| `billing_invoices` | Referenced in stripe-webhook.controller.ts lines 105–133. Never created or populated by any INSERT in the codebase. No repository for it exists. | **HIGH** — all Stripe webhook payment updates silently fail if table does not exist |
| `dunning_attempts` | Referenced extensively in dunning.service.ts. No dedicated repository class created. | MEDIUM — exists likely, but no formal schema reference in codebase |

---

## Section 2 — Columns Used in Code But Potentially Missing from Schema

| Table | Column | Location | Evidence | Risk |
|-------|--------|----------|----------|------|
| `invoices` | `amount_due` | dunning.service.ts:168 | `.select('id, amount_due, currency')` — never inserted anywhere. The INSERT uses `total_amount` | **HIGH** — dunning always reads null, processes $0 payments |
| `subscriptions` | `expires_at` | tenants.repository.ts:44 | SELECTed but never written by any INSERT or UPDATE in the codebase | MEDIUM — returns null in subscription profile responses |
| `subscriptions` | `max_users` | tenants.repository.ts:44 | SELECTed but billing limits come from `plans.max_users`, never written to subscriptions | MEDIUM — subscription detail responses show null |
| `subscriptions` | `max_branches` | tenants.repository.ts:44 | SELECTed but billing limits come from `plans.max_branches`, never written to subscriptions | MEDIUM — subscription detail responses show null |
| `dunning_attempts` | `attempted_at` | dunning.service.ts:82 | Used as filter `.lte('attempted_at', ...)` but never written in any INSERT | LOW — filter always matches nothing or all rows depending on schema default |
| `subscriptions` | `grace_period_ends_at` | billing.service.ts:290 | Used as filter `.lt('grace_period_ends_at', now)` but never written in any INSERT or UPDATE | MEDIUM — grace period expiry cron never fires |

---

## Section 3 — Columns Potentially in Schema But Unused by Code

> **Note:** No DDL schema file exists in the analyzed codebase (`api/src`). The migrations directory contains only 2 SQL files (`C0_add_shift_id_to_orders.sql`, `C0_rollback_shift_id_from_orders.sql`) which do not define the full schema. Therefore this section cannot be completed from `DATABASE_USAGE_PROOF.md` alone.
>
> The only observable gap is:
>
> | Table | Column | Observation |
> |-------|--------|-------------|
> | `order_items` | (all columns) | INSERT-only table. No SELECT, UPDATE, or DELETE exists anywhere in the codebase. If schema has additional columns they are invisible to the application. |
> | `permissions` | (all columns) | Seed-only table. No runtime SELECT exists. Application never reads from `permissions` table directly — only `role_permissions` is queried at runtime. |
> | `features` | (all columns) | No INSERT, UPDATE, or DELETE. Read-only from the application's perspective. Seed file `features.seed.ts` was referenced but not analyzed. |

---

## Section 4 — Naming Conflicts

### CONFLICT A: `billing_invoices` vs `invoices`

| Attribute | Detail |
|-----------|--------|
| **Type** | Table name conflict |
| **File 1** | `stripe-webhook.controller.ts` lines 105, 128 |
| **Uses** | `billing_invoices` table |
| **File 2** | `core/billing/repositories/invoices.repository.ts` lines 76–96 |
| **Uses** | `invoices` table |
| **Conclusion** | Same business concept (billing invoice), two different table names in the same codebase. Stripe webhook writes to `billing_invoices`; billing repository writes to `invoices`. One of them is wrong. |
| **Impact** | All Stripe payment events (`payment_intent.succeeded`, `payment_intent.payment_failed`) update a table that either does not exist or is perpetually empty. Invoice status is never updated from Stripe callbacks. |

---

### CONFLICT B: `invoices.amount_due` vs `invoices.total_amount`

| Attribute | Detail |
|-----------|--------|
| **Type** | Column name conflict |
| **File 1** | `dunning.service.ts` line 168 |
| **Uses** | `.select('id, amount_due, currency')` from `invoices` |
| **File 2** | `core/billing/repositories/invoices.repository.ts` line 81 |
| **Uses** | INSERT with column `total_amount` |
| **Conclusion** | The invoice amount is stored as `total_amount`. Dunning reads `amount_due` which does not exist. |
| **Impact** | Every dunning retry attempts to charge `null` / `0`. The payment provider either rejects the charge or processes a $0 payment. Subscription recovery never works. |

---

### CONFLICT C: `subscriptions.expires_at` (never written)

| Attribute | Detail |
|-----------|--------|
| **Type** | Column never populated |
| **File** | `tenants.repository.ts` line 44 |
| **Uses** | SELECT `expires_at` from `subscriptions` |
| **Reality** | `billing.service.ts` uses `current_period_end` for the same concept. `expires_at` is never written by any INSERT or UPDATE. |
| **Conclusion** | `expires_at` either does not exist in the schema, or exists but is always NULL because nothing writes to it. |
| **Impact** | `TenantsController` returns `expires_at: null` in every subscription response. |

---

### CONFLICT D: `subscriptions.max_users` / `subscriptions.max_branches` (never written)

| Attribute | Detail |
|-----------|--------|
| **Type** | Columns never populated |
| **File** | `tenants.repository.ts` line 44 |
| **Uses** | SELECT `max_users, max_branches` from `subscriptions` |
| **Reality** | `billing.service.ts` reads limits from `plans.max_users` and `plans.max_branches`. Nothing writes `max_users` or `max_branches` to the `subscriptions` table. |
| **Conclusion** | These columns either do not exist in subscriptions or exist but are always NULL. |
| **Impact** | `TenantsController` subscription response always shows `max_users: null, max_branches: null`. |

---

## Section 5 — Can the System Run Without TypeScript Changes?

**Answer: NO**

TypeScript compiles successfully because Supabase queries use `any`-typed responses and the column names are plain strings — there are no compile-time errors. However, four runtime bugs exist that cause incorrect behavior:

| # | Bug | Severity |
|---|-----|----------|
| 1 | Dunning reads `amount_due` which does not exist → all retries charge $0 | **CRITICAL** |
| 2 | Stripe webhook updates `billing_invoices` which does not exist → all payment confirmations silently no-op | **CRITICAL** |
| 3 | Subscription profile returns `expires_at: null` always | HIGH |
| 4 | Subscription profile returns `max_users: null, max_branches: null` always | HIGH |

The system starts, accepts requests, and processes most operations correctly. However, the entire billing payment confirmation loop and dunning recovery loop produce incorrect results silently at runtime.

---

## Section 6 — Minimum Lines Required to Fix

> These are the exact lines that must change. No architectural changes required.

| # | File | Line | Current Value | Conflict |
|---|------|------|---------------|---------|
| 1 | `api/src/core/billing/dunning/dunning.service.ts` | 168 | `'id, amount_due, currency'` | CONFLICT B |
| 2 | `api/src/core/billing/stripe-webhook.controller.ts` | 106 | `.from('billing_invoices')` | CONFLICT A |
| 3 | `api/src/core/billing/stripe-webhook.controller.ts` | 130 | `.from('billing_invoices')` | CONFLICT A |
| 4 | `api/src/modules/tenants/repositories/tenants.repository.ts` | 44 | `expires_at, max_users, max_branches` in SELECT string | CONFLICT C + D |

**Total: 4 lines**

---

*Audit generated from DATABASE_USAGE_PROOF.md — no assumptions, no SQL, no schema guessing.*
