# COVERAGE_SCHEMA_MISMATCHES.md
# Phase H — Complete Column / Schema Mismatches
# Source: Phases A–H READ_VERIFIED (399 files — api/src: 231, web/src: 168)

---

## Overall Summary

| Metric | Value |
|--------|-------|
| Total Mismatches | 28 |
| Tables Affected | 9 |
| CRITICAL severity | 4 |
| HIGH severity | 17 |
| MEDIUM severity | 5 |
| LOW severity | 2 |

---

## Mismatches by Table

---

### TABLE: `orders`

| ID | Column (DB) | Column (Frontend) | File + Line | Impact |
|----|-------------|-------------------|-------------|--------|
| H-001 | `discount` | `discount_amount` | `invoices.repository.ts:24` vs `order.types.ts:11` | Discount never displayed |
| H-006 | `cashier_id`, `customer_id` | `cashier_name`, `customer_name` | `invoices.repository.ts:23–25` vs `order.types.ts:4,6` | Names always undefined |
| H-015 | Headers `x-branch-id`, `x-shift-id` | Body `branch_id`, `shift_id` | `invoices.controller.ts:36–37` vs `invoices.api.ts(web):10–11` | **CRITICAL** — invoice saved without branch/shift |

---

### TABLE: `order_items`

| ID | Column (DB) | Column (Frontend) | File + Line | Impact |
|----|-------------|-------------------|-------------|--------|
| H-002 | `qty` | `quantity` | `invoices.repository.ts:68` vs `order.types.ts:9` | Qty always undefined |
| H-003 | `price` | `unit_price` | `invoices.repository.ts:69` vs `order.types.ts:10` | Unit price always undefined |
| H-004 | NOT PRESENT | `total_price` | `invoices.repository.ts:63–72` (not inserted) vs `order.types.ts:11` | Per-item total always undefined |
| H-005 | NOT STORED | `variant_id`, `variant_name` | `invoices.repository.ts:63–72` vs `order.types.ts:7–8` | Variant info silently dropped on save |

---

### TABLE: `customers`

| ID | Column (DB) | Column (Frontend) | File + Line | Impact |
|----|-------------|-------------------|-------------|--------|
| H-007 | (none) | `orders_count` vs `total_orders` | `customer.types.ts:10` vs `customers.mock.ts:14` | Frontend-internal inconsistency |
| H-008 | NOT IN customers table | `total_spent` | `customers.repository.ts:129–146` (computed) vs `customer.types.ts:11` | Spent always shows 0 in list view |

---

### TABLE: `items`

| ID | Column (DB) | Column (Frontend) | File + Line | Impact |
|----|-------------|-------------------|-------------|--------|
| H-009 | nested `categories{id,name,type}` | `category_name: string` (flat) | `items.repository.ts:18–22` vs `item.types.ts:24` | Category column always `—` |
| H-010 | `operation_type` required | `CreateItemDto` missing field | `create-item.dto.ts:34` vs `items.api.ts(web):14–21` | **Item creation fails with 400** |

---

### TABLE: `invoices` (billing)

| ID | Column (DB) | Column (Backend) | File + Line | Impact |
|----|-------------|-----------------|-------------|--------|
| H-011 | `total_amount` (written) | `amount_due` (read by dunning) | `invoices.repository.ts:86` vs `dunning.service.ts:167` | **CRITICAL** — dunning charges $0 always |
| H-012 | `invoices` table | `billing_invoices` table (Stripe webhook) | `invoices.repository.ts:77` vs `stripe-webhook.controller.ts:106,130` | **CRITICAL** — payment confirmations lost |

---

### TABLE: `subscriptions`

| ID | Column (DB) | Column (Frontend/Backend) | File + Line | Impact |
|----|-------------|--------------------------|-------------|--------|
| H-013 | `expires_at` (never written) | Read by `tenants.repository.ts:44` | Backend: no INSERT sets `expires_at` | Subscription end date always null |
| H-014 | `max_users`, `max_branches` (never written) | Read by `tenants.repository.ts:44` | Backend: limits in `plans` table, not subscriptions | Usage limits always null |
| H-016 | `billing_cycle` | `interval` | `billing.service.ts:35` vs `subscription.types.ts(web):8` | Billing interval always blank |
| H-017 | NOT PRESENT | `tenant_name` | `subscription.types.ts(web):22` | Tenant name blank in sub list |
| H-018 | NOT PRESENT | `plan_name` | `subscription.types.ts(web):23` | Plan name blank in sub list |
| H-019 | NOT PRESENT (in payments table) | `amount_paid` | `subscription.types.ts(web):30` | Amount shows `$undefined` |
| H-026 | `grace_period_ends_at` (never written) | Filter in `billing.service.ts:290` | No INSERT sets this column | Grace period cron is dead code |

---

### TABLE: `tenants`

| ID | Column (DB) | Column (Frontend) | File + Line | Impact |
|----|-------------|-------------------|-------------|--------|
| H-020 | NOT PRESENT | `owner_name`, `owner_email` | `tenants/types.ts(web):11–12` | Owner info never shown |
| H-021 | NOT PRESENT | `subscription_plan` | `tenants/types.ts(web):15` | Plan column always `—` |
| H-022 | NOT PRESENT (require COUNT) | `users_count`, `branches_count` | `tenants/types.ts(web):13–14` | Stats always show 0 in list |
| H-023 | NOT PRESENT | `mrr` (type conflict) | `types/index.ts(web):13` vs `tenants/types.ts(web)` | Two conflicting Tenant types in same feature |
| H-027 | `business_type` values | `'services'` vs `'service'` | `enums.ts:15` vs `update-tenant-profile.dto.ts:8` | Enum value mismatch breaks filtering |

---

### TABLE: `device_sessions`

| ID | Column (DB) | Column (Frontend) | File + Line | Impact |
|----|-------------|-------------------|-------------|--------|
| H-024 | `user_id`, `tenant_id` (IDs only) | `user_name`, `user_email`, `tenant_name` | `auth.service.ts:108–118` vs `auth-control/types.ts(web):14–17` | Auth Control shows no user/tenant names |

---

### TABLE: `dunning_attempts`

| ID | Column (DB) | Backend Usage | File + Line | Impact |
|----|-------------|--------------|-------------|--------|
| H-025 | `attempted_at` (never written) | Filtered in `dunning.service.ts:82` | INSERT (lines 127–133) never sets it | **CRITICAL** — grace period suspension never fires |

---

### TABLE: `features` / `plan_features` / `tenant_feature_overrides`

| ID | Expected | Actual | File + Line | Impact |
|----|----------|--------|-------------|--------|
| H-028 | `FeatureWithOverride` composite: `plan_default`, `plan_limit`, `effective_enabled`, `effective_limit` | No backend endpoint aggregates these | `feature-flags.types.ts(web):30–36` | Feature flags page non-functional even with correct endpoints |

---

## Severity Summary

### 🔴 CRITICAL (4)

| ID | Issue | File |
|----|-------|------|
| H-011 | `amount_due` vs `total_amount` — dunning charges $0 | `dunning.service.ts:167` |
| H-012 | `billing_invoices` vs `invoices` — Stripe events lost | `stripe-webhook.controller.ts:106,130` |
| H-015 | `branch_id`/`shift_id` body vs headers — invoices saved without branch/shift | `invoices.controller.ts:36–37` |
| H-025 | `attempted_at` never written — grace period suspension dead | `dunning.service.ts:82` |

### 🔴 HIGH (17)

| ID | Issue |
|----|-------|
| H-001 | `discount` vs `discount_amount` |
| H-002 | `qty` vs `quantity` |
| H-003 | `price` vs `unit_price` |
| H-006 | `cashier_name`, `customer_name` not in orders |
| H-010 | `operation_type` missing from web CreateItemDto |
| H-013 | `expires_at` never written in subscriptions |
| H-014 | `max_users`, `max_branches` never written in subscriptions |
| H-016 | `billing_cycle` vs `interval` |
| H-017 | `tenant_name` not in subscriptions |
| H-018 | `plan_name` not in subscriptions |
| H-019 | `amount_paid` not in subscriptions |
| H-020 | `owner_name`, `owner_email` not in tenants |
| H-024 | `user_name`, `user_email`, `tenant_name` not in device_sessions |
| H-026 | `grace_period_ends_at` never written |
| H-028 | `FeatureWithOverride` requires backend aggregation |
| H-004 | `total_price` not stored in order_items |
| H-005 | `variant_id`, `variant_name` dropped on order_items insert |

### 🟡 MEDIUM (5)

| ID | Issue |
|----|-------|
| H-008 | `total_spent` computed, not in customers table |
| H-009 | `category_name` nested vs flat |
| H-021 | `subscription_plan` not in tenants |
| H-022 | `users_count`, `branches_count` require COUNT queries |
| H-027 | `BusinessType` enum `'services'` vs `'service'` |

### 🟢 LOW (2)

| ID | Issue |
|----|-------|
| H-007 | `orders_count` vs `total_orders` frontend-internal |
| H-023 | Two conflicting `Tenant` type definitions |

---

*All findings from actual code — no assumptions. Source: Phases A–H READ_VERIFIED (399 files).*
