# TABLE_USAGE_REPORT.md
# Sefay V2 — Full Database Usage Report
# Generated: 2026-06-05 | Source: C:\Fp\api\src (code) + C:\Fp\DATABASE.md (docs)

---

## Summary Statistics

| Metric | Count |
|---|---|
| Tables used in code | 29 |
| Tables documented in DATABASE.md | 21 |
| Tables in code BUT NOT in DATABASE.md | 5 |
| Tables in DATABASE.md BUT NOT in code | 1 |
| Tables with column drift | 9 |
| Direct Supabase calls in web frontend | 0 (API-only) |

---

## TABLE INVENTORY

---

### 1. `tenants`
**Status:** ✅ Documented + Used
**Risk:** CRITICAL (root table)

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, name, business_type, status, trial_ends_at, created_at | tenants.repository.ts |
| SELECT * | all | tenant-management.repository.ts |
| SELECT | id, name | platform-analytics.repository.ts, subscriptions.service.ts |
| SELECT | id | health.service.ts, backup.service.ts |
| SELECT | subscriptions(plan_id) | feature-flags.service.ts |
| UPDATE | status | tenant-management.repository.ts |
| UPDATE | deleted_at, status | tenant-management.repository.ts |
| UPDATE | status='suspended' | dunning.service.ts |
| UPDATE | name, business_type | tenants.repository.ts |

**All Columns Referenced:** `id`, `name`, `business_type`, `status`, `trial_ends_at`, `created_at`, `deleted_at`

**CRUD:** C❌ R✅ U✅ D✅(soft)

**Filters Used:** `id`, `status`, `deleted_at`, `created_at`

---

### 2. `users`
**Status:** ✅ Documented + Used
**Risk:** CRITICAL (auth table)

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, email, name, role, is_active, created_at | users.repository.ts |
| SELECT | id, email, password_hash, role, tenant_id, is_active, name | auth.service.ts |
| SELECT | id, email, role, tenant_id | auth.service.ts (refresh) |
| SELECT | id, name, email, role, tenant_id, is_active, created_at | auth.service.ts (me) |
| SELECT count | * | billing.service.ts, tenant-management.repository.ts |
| SELECT | email | subscriptions.service.ts |
| INSERT | tenant_id, email, password_hash, role, name, is_active (via data) | users.repository.ts |
| UPDATE | deleted_at, is_active | users.repository.ts (softDelete) |
| UPDATE | (partial updates) | users.repository.ts |

**All Columns Referenced:** `id`, `email`, `password_hash`, `name`, `role`, `tenant_id`, `is_active`, `created_at`, `deleted_at`

**CRUD:** C✅ R✅ U✅ D✅(soft)

**Filters:** `id`, `email`, `tenant_id`, `role`, `deleted_at`, `is_active`

---

### 3. `branches`
**Status:** ✅ Documented + Used
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, name, address, is_active, created_at | branches.repository.ts |
| SELECT count | id | branches.repository.ts, billing.service.ts |
| INSERT | tenant_id, name, address, is_active | branches.repository.ts |
| UPDATE | name, address, is_active | branches.repository.ts |
| UPDATE | deleted_at, is_active | branches.repository.ts (softDelete) |

**All Columns Referenced:** `id`, `name`, `address`, `is_active`, `tenant_id`, `created_at`, `deleted_at`

**CRUD:** C✅ R✅ U✅ D✅(soft)

**Filters:** `id`, `tenant_id`, `deleted_at`, `is_active`

---

### 4. `items`
**Status:** ✅ Documented + Used
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, name, type, operation_type, price, has_inventory, has_variants, is_active, created_at, categories(*), item_variants(*) | items.repository.ts |
| INSERT | tenant_id, name, type, operation_type, price, has_inventory, has_variants, category_id, is_active | items.repository.ts |
| UPDATE | (partial payload) | items.repository.ts |
| UPDATE | deleted_at, is_active | items.repository.ts (softDelete) |

**All Columns Referenced:** `id`, `name`, `type`, `operation_type`, `price`, `has_inventory`, `has_variants`, `category_id`, `is_active`, `tenant_id`, `created_at`, `deleted_at`

**CRUD:** C✅ R✅ U✅ D✅(soft)

**Filters:** `id`, `tenant_id`, `is_active`, `deleted_at`

---

### 5. `item_variants`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, name, price_adjustment, sku, stock_quantity, is_active | items.repository.ts |
| INSERT | item_id, tenant_id, name, price_adjustment, sku, stock_quantity, is_active | items.repository.ts |
| UPDATE | (partial payload) | items.repository.ts |
| UPDATE | is_active=false | items.repository.ts (softDelete) |

**All Columns Referenced:** `id`, `item_id`, `tenant_id`, `name`, `price_adjustment`, `sku`, `stock_quantity`, `is_active`

**CRUD:** C✅ R✅ U✅ D✅(soft via is_active)

**Filters:** `id`, `item_id`, `tenant_id`, `is_active`

⚠️ **Note:** `softDeleteVariant` uses `is_active=false` NOT `deleted_at` — inconsistent with other tables.

---

### 6. `categories`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, name, type, is_active, created_at | categories.repository.ts |
| INSERT | tenant_id, name, type, is_active | categories.repository.ts |
| UPDATE | (partial payload) | categories.repository.ts |
| UPDATE | is_active=false | categories.repository.ts (softDelete) |

**All Columns Referenced:** `id`, `tenant_id`, `name`, `type`, `is_active`, `created_at`

**CRUD:** C✅ R✅ U✅ D✅(soft via is_active)

**Filters:** `id`, `tenant_id`, `type`, `is_active`, `deleted_at`

⚠️ **Note:** `softDelete` uses `is_active=false` but ScopedRepository base also filters `deleted_at`. DATABASE.md doesn't document `deleted_at` on this table.

---

### 7. `orders`
**Status:** ✅ Documented + Used (⚠️ COLUMN DRIFT)
**Risk:** CRITICAL (core transaction table)

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, status, subtotal, **discount**, **tax**, total, payment_method, notes, created_at, cashier_id, customer_id, branch_id | invoices.repository.ts |
| SELECT | id, total, subtotal, **discount**, **tax**, payment_method, created_at, branch_id | reports.service.ts |
| SELECT | id, total, payment_method, status, created_at | customers.repository.ts |
| SELECT | total, payment_method | shifts.repository.ts |
| SELECT count | * | analytics, tenant-management |
| INSERT | tenant_id, cashier_id, customer_id, branch_id, shift_id, status, subtotal, discount, tax, total, payment_method, notes | invoices.repository.ts |
| UPDATE | status='cancelled' | invoices.repository.ts |

**All Columns Referenced:** `id`, `tenant_id`, `branch_id`, `cashier_id`, `customer_id`, `shift_id`, `status`, `subtotal`, `discount`, `tax`, `total`, `payment_method`, `notes`, `created_at`

**CRUD:** C✅ R✅ U✅(cancel) D❌

**Filters:** `tenant_id`, `branch_id`, `shift_id`, `customer_id`, `status`, `created_at`

⚠️ **DRIFT:** DATABASE.md uses `discount_amount` and `tax_amount`. Code uses `discount` and `tax`.
⚠️ **DRIFT:** DATABASE.md has `cancelled_at`, `cancelled_by`. Code does NOT update these on cancel.

---

### 8. `order_items`
**Status:** ✅ Documented + Used (⚠️ COLUMN DRIFT)
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| INSERT | order_id, item_id, item_name, **qty**, **price** | invoices.repository.ts |

**All Columns Referenced (inserted):** `order_id`, `item_id`, `item_name`, `qty`, `price`

**CRUD:** C✅ R❌(no explicit select) U❌ D❌

⚠️ **CRITICAL DRIFT:** DATABASE.md has `quantity` and `unit_price`. Code inserts `qty` and `price`.
⚠️ **DRIFT:** DATABASE.md has `variant_id`, `variant_name`, `total_price`, `tenant_id`. Code does NOT insert these.

---

### 9. `customers`
**Status:** ✅ Documented + Used (⚠️ COLUMN DRIFT)
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, **full_name**, phone, email, loyalty_points, is_active, created_at | customers.repository.ts |
| SELECT * | all | customers.repository.ts (findById) |
| INSERT | tenant_id, **full_name**, phone, email, loyalty_points, is_active | customers.repository.ts |
| UPDATE | **full_name**, phone, email, updated_at | customers.repository.ts |
| UPDATE | deleted_at | customers.repository.ts (softDelete) |

**All Columns Referenced:** `id`, `tenant_id`, `full_name`, `phone`, `email`, `loyalty_points`, `is_active`, `created_at`, `deleted_at`, `updated_at`

**CRUD:** C✅ R✅ U✅ D✅(soft)

**Filters:** `id`, `tenant_id`, `phone`, `full_name` (ilike), `deleted_at`

⚠️ **CRITICAL DRIFT:** DATABASE.md uses `name`. Code consistently uses `full_name`.
⚠️ **DRIFT:** `is_active` and `updated_at` used in code but NOT in DATABASE.md.

---

### 10. `expenses`
**Status:** ✅ Documented + Used (⚠️ COLUMN DRIFT)
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | status, amount | expenses.service.ts (getStats) |
| SELECT * + joins | template, requester, approver | expenses.service.ts (findAll) |
| SELECT | id, amount, status, **notes**, created_at, branch_id, template_id, requested_by, approved_by, resolved_at | reports.service.ts |
| SELECT count | * | analytics |
| INSERT | tenant_id, branch_id, requested_by, template_id, amount, note, photo_url, status, expires_at | expenses.service.ts |
| UPDATE | status='expired' | expenses.service.ts |
| UPDATE | status, approved_by, resolved_at | expenses.service.ts (approve) |
| UPDATE | status, approved_by, resolved_at, **notes** | expenses.service.ts (reject) |

**All Columns Referenced:** `id`, `tenant_id`, `branch_id`, `template_id`, `requested_by`, `approved_by`, `amount`, `note`/`notes`, `photo_url`, `status`, `expires_at`, `created_at`, `resolved_at`, `deleted_at`

**CRUD:** C✅ R✅ U✅ D❌(soft via deleted_at filter)

**Filters:** `tenant_id`, `branch_id`, `status`, `created_at`, `expires_at`, `deleted_at`

⚠️ **DRIFT:** DATABASE.md uses `note` (singular). Reports service selects `notes` (plural). Both used in code.

---

### 11. `expense_templates`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT * | all | expense-templates.service.ts |
| SELECT | id, name, expiry_hours, requires_photo, default_amount | expenses.service.ts |
| INSERT | tenant_id, name, default_amount, requires_photo, expiry_hours, is_active | expense-templates.service.ts |
| UPDATE | (partial DTO) | expense-templates.service.ts |
| UPDATE | deleted_at | expense-templates.service.ts (remove) |

**All Columns Referenced:** `id`, `tenant_id`, `name`, `default_amount`, `requires_photo`, `expiry_hours`, `is_active`, `created_at`, `deleted_at`

**CRUD:** C✅ R✅ U✅ D✅(soft)

---

### 12. `shifts`
**Status:** ✅ Documented + Used (⚠️ UNDOCUMENTED COLUMNS)
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, status, opening_cash, closing_cash, discrepancy, expected_cash, opened_at, closed_at, cashier_id, branch_id | shifts.repository.ts |
| SELECT | id, cashier_id, branch_id, status, opening_cash, closing_cash, expected_cash, discrepancy, opened_at, closed_at | reports.service.ts |
| SELECT count | * | analytics |
| INSERT | tenant_id, branch_id, cashier_id, opening_cash, **notes**, status, opened_at | shifts.repository.ts |
| UPDATE | status, closing_cash, expected_cash, discrepancy, closed_at | shifts.repository.ts (close) |

**All Columns Referenced:** `id`, `tenant_id`, `branch_id`, `cashier_id`, `status`, `opening_cash`, `closing_cash`, `expected_cash`, `discrepancy`, `opened_at`, `closed_at`, `notes`, `deleted_at`

**CRUD:** C✅ R✅ U✅(close) D❌(soft filter via deleted_at)

⚠️ **UNDOCUMENTED:** `notes` and `deleted_at` used in code but absent from DATABASE.md.

---

### 13. `subscriptions`
**Status:** ✅ Documented + Used (⚠️ MAJOR COLUMN DRIFT)
**Risk:** CRITICAL (billing table)

| Operation | Columns Used | File |
|---|---|---|
| SELECT | id, status, plan_id, started_at, expires_at, cancelled_at, trial_ends_at, max_users, max_branches, billing_cycle, current_period_start, current_period_end | tenants.repository.ts |
| SELECT | plan_id, plans!inner(price_monthly) | analytics |
| SELECT * | all | billing.service.ts |
| SELECT | id, tenant_id, plan_id, status | dunning.service.ts |
| INSERT | tenant_id, plan_id, status, billing_cycle, started_at, trial_ends_at | billing.service.ts |
| INSERT | tenant_id, plan_id, status, billing_cycle, started_at, current_period_start, current_period_end | billing.service.ts |
| UPDATE | status, billing_cycle, current_period_start, current_period_end, updated_at | billing.service.ts |
| UPDATE | trial_ends_at, status, updated_at | billing.service.ts (extendTrial) |
| UPDATE | status, cancelled_at, updated_at | billing.service.ts (cancel) |
| UPDATE | status='active' | dunning.service.ts |
| UPDATE | status, ends_at | tenant-management.repository.ts |
| UPDATE | status='suspended', suspended_at | billing.service.ts (cron) |

**All Columns Referenced:** `id`, `tenant_id`, `plan_id`, `status`, `billing_cycle`, `started_at`, `ends_at`, `cancelled_at`, `trial_ends_at`, `current_period_start`, `current_period_end`, `updated_at`, `suspended_at`, `grace_period_ends_at`, `created_at`

**Status Enum in Code:** `trial | active | grace_period | suspended | cancelled | expired | past_due`
**Status Enum in DATABASE.md:** `active | cancelled | expired | trial`

**CRUD:** C✅ R✅ U✅ D❌

⚠️ **CRITICAL DRIFT:** DATABASE.md missing `billing_cycle`, `current_period_start`, `current_period_end`, `trial_ends_at`, `updated_at`, `suspended_at`, `grace_period_ends_at`, `past_due` status.

---

### 14. `plans`
**Status:** ✅ Documented + Used (⚠️ MINOR DRIFT)
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT * | all | plans.service.ts, billing.service.ts |
| INSERT | name, price_monthly, price_yearly, max_users, max_branches, **trial_days**, is_active | plans.service.ts |
| UPDATE | (partial) + updated_at | plans.service.ts |

**All Columns Referenced:** `id`, `name`, `description`, `price_monthly`, `price_yearly`, `max_users`, `max_branches`, `trial_days`, `is_active`, `updated_at`

**CRUD:** C✅ R✅ U✅ D✅(soft via is_active=false)

⚠️ **MISSING FROM DATABASE.md:** `trial_days`, `description`, `updated_at`

---

### 15. `features`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT | is_enabled | feature-flags.service.ts |
| UPSERT | key, name, category, is_enabled | features.seed.ts |

**All Columns Referenced:** `id`, `key`, `name`, `category`, `is_enabled`, `created_at`

**CRUD:** C✅ R✅ U❌ D❌

---

### 16. `plan_features`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT | is_enabled | feature-flags.service.ts |
| SELECT | feature_key | auth.service.ts |
| SELECT | limit_value | feature-flags.service.ts |

**All Columns Referenced:** `id`, `plan_id`, `feature_key`, `is_enabled`, `limit_value`

**CRUD:** C❌ R✅ U❌ D❌

---

### 17. `tenant_feature_overrides`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| SELECT * | all | tenant-management.repository.ts |
| SELECT | is_enabled | feature-flags.service.ts |
| SELECT | limit_value | feature-flags.service.ts |
| SELECT | feature_key, is_enabled | auth.service.ts |
| UPSERT | tenant_id, feature_key, is_enabled, limit_value, overridden_by, overridden_at, note | tenant-management.repository.ts |

**All Columns Referenced:** `id`, `tenant_id`, `feature_key`, `is_enabled`, `limit_value`, `overridden_by`, `overridden_at`, `note`

**CRUD:** C✅(upsert) R✅ U✅(upsert) D❌

---

### 18. `permissions`
**Status:** ✅ Documented + Used
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| UPSERT | key, resource, action, scope, description | permissions.seed.ts |

**All Columns Referenced:** `id`, `key`, `resource`, `action`, `scope`, `description`

**CRUD:** C✅(seed) R❌(no runtime read) U❌ D❌

---

### 19. `role_permissions`
**Status:** ✅ Documented + Used
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | is_granted | permissions.service.ts |
| SELECT | permission_key | permissions.service.ts, auth.service.ts |
| UPSERT | role, permission_key, is_granted | permissions.seed.ts |

**All Columns Referenced:** `id`, `role`, `permission_key`, `is_granted`

**CRUD:** C✅(seed) R✅ U❌ D❌

---

### 20. `device_sessions`
**Status:** ✅ Documented + Used
**Risk:** CRITICAL (security table)

| Operation | Columns Used | File |
|---|---|---|
| INSERT | user_id, tenant_id, device_name, device_type, ip_address, user_agent, last_active_at, is_revoked | auth.service.ts |
| SELECT | id | auth.service.ts (login) |
| SELECT | id, is_revoked, user_id, tenant_id | auth.service.ts (refresh) |
| SELECT | id, user_id | auth.service.ts (revoke) |
| UPDATE | is_revoked=true | auth.service.ts |
| UPDATE | last_active_at | auth.service.ts (refresh) |

**All Columns Referenced:** `id`, `user_id`, `tenant_id`, `device_name`, `device_type`, `ip_address`, `user_agent`, `last_active_at`, `is_revoked`, `created_at`

**CRUD:** C✅ R✅ U✅ D❌

---

### 21. `refresh_tokens`
**Status:** ✅ Documented + Used
**Risk:** CRITICAL (security table)

| Operation | Columns Used | File |
|---|---|---|
| INSERT | user_id, session_id, token_hash, expires_at, is_used | auth.service.ts |
| SELECT | id, user_id, session_id, is_used, expires_at | auth.service.ts |
| UPDATE | is_used=true | auth.service.ts |

**All Columns Referenced:** `id`, `user_id`, `session_id`, `token_hash`, `expires_at`, `is_used`, `created_at`

**CRUD:** C✅ R✅ U✅ D❌

---

### 22. `audit_logs`
**Status:** ✅ Documented + Used
**Risk:** HIGH (compliance table)

| Operation | Columns Used | File |
|---|---|---|
| INSERT | tenant_id, actor_id, actor_role, action, resource_type, resource_id, before_data, after_data, ip_address, device, created_at | audit.service.ts |
| SELECT * | all (with filters) | audit-logs.repository.ts |
| DELETE | (by age, via cleanup processor) | audit-cleanup.processor.ts |

**All Columns Referenced:** `id`, `tenant_id`, `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `before_data`, `after_data`, `ip_address`, `device`, `created_at`

**CRUD:** C✅ R✅ U❌ D✅(cleanup)

**Filters:** `actor_id`, `action`, `resource_type`, `tenant_id`, `created_at`

---

### 23. `notifications`
**Status:** ✅ Documented + Used (⚠️ COLUMN DRIFT)
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| INSERT | user_id, tenant_id, type, **title**, body, data, channel | inapp.channel.ts |
| SELECT * | all | notifications.repository.ts |
| UPDATE | **is_read**=true, read_at | notifications.repository.ts |

**All Columns Referenced:** `id`, `tenant_id`, `user_id`, `type`, `title`, `body`, `data`, `channel`, `is_read`, `read_at`, `created_at`

**CRUD:** C✅ R✅ U✅ D❌

⚠️ **DRIFT:** DATABASE.md has `subject`, `sent_at`, `metadata`. Code uses `title`, `is_read`, `data`.

---

### 24. `billing_customers`
**Status:** ❌ NOT in DATABASE.md — Used Extensively
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | provider_customer_id | dunning.service.ts |
| SELECT * | all | billing-customers.repository.ts |
| INSERT | tenant_id, provider, provider_customer_id, email | billing-customers.repository.ts |

**All Columns Referenced:** `id`, `tenant_id`, `provider`, `provider_customer_id`, `email`, `created_at`, `updated_at`

**CRUD:** C✅ R✅ U❌ D❌

---

### 25. `invoices` (billing)
**Status:** ❌ NOT in DATABASE.md — Used Extensively
**Risk:** CRITICAL (billing table)

| Operation | Columns Used | File |
|---|---|---|
| INSERT | tenant_id, subscription_id, invoice_number, currency, subtotal, tax_amount, discount_amount, total_amount, status, period_start, period_end, issued_at, due_at | billing/invoices.repository.ts |
| SELECT * | all | billing/invoices.repository.ts |
| UPDATE | status='paid', paid_at, updated_at | billing/invoices.repository.ts |
| UPDATE | status='overdue', updated_at | billing/invoices.repository.ts |
| SELECT count | * | billing/invoices.repository.ts |
| SELECT | id, amount_due, currency | dunning.service.ts |

**Note:** `stripe-webhook.controller.ts` uses `.from('billing_invoices')` — this appears to be a naming bug; likely means the same `invoices` table.

**All Columns Referenced:** `id`, `tenant_id`, `subscription_id`, `invoice_number`, `currency`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `amount_due`, `status`, `period_start`, `period_end`, `issued_at`, `due_at`, `paid_at`, `created_at`, `updated_at`

**Status Enum:** `draft | open | paid | void | overdue | failed`

**CRUD:** C✅ R✅ U✅ D❌

---

### 26. `invoice_items` (billing)
**Status:** ❌ NOT in DATABASE.md (distinct from order_items)
**Risk:** MEDIUM

| Operation | Columns Used | File |
|---|---|---|
| INSERT | invoice_id, description, quantity, unit_price, amount, metadata_json | billing/invoices.repository.ts |
| SELECT * | all | billing/invoices.repository.ts |

**All Columns Referenced:** `id`, `invoice_id`, `description`, `quantity`, `unit_price`, `amount`, `metadata_json`, `created_at`

**CRUD:** C✅ R✅ U❌ D❌

---

### 27. `payments` (billing)
**Status:** ⚠️ Documented partially — MAJOR DRIFT
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| INSERT | tenant_id, invoice_id, provider, amount, currency, status='pending' | payments.repository.ts |
| UPDATE | status, provider_payment_id, failure_reason, paid_at, updated_at | payments.repository.ts |
| SELECT * | all | payments.repository.ts |
| UPDATE | status, failure_reason, updated_at | stripe-webhook.controller.ts |

**All Columns Referenced:** `id`, `tenant_id`, `invoice_id`, `provider`, `provider_payment_id`, `amount`, `currency`, `status`, `paid_at`, `failure_reason`, `metadata_json`, `created_at`, `updated_at`

**Status Enum:** `pending | succeeded | failed | refunded`

**CRUD:** C✅ R✅ U✅ D❌

⚠️ **DRIFT:** DATABASE.md has simplified payments linked to `orders/invoices`. Code uses billing-specific payments linked to `invoices` (billing) table.

---

### 28. `dunning_attempts`
**Status:** ❌ NOT in DATABASE.md — Used Extensively
**Risk:** HIGH

| Operation | Columns Used | File |
|---|---|---|
| SELECT | * | dunning.service.ts |
| SELECT | attempt_number | dunning.service.ts |
| SELECT | tenant_id, subscription_id | dunning.service.ts |
| INSERT | tenant_id, subscription_id, attempt_number, status, next_retry_at | dunning.service.ts |
| UPDATE | status='succeeded' | dunning.service.ts |
| UPDATE | status='failed', error_message | dunning.service.ts |
| UPDATE | status='exhausted' | dunning.service.ts |

**All Columns Referenced:** `id`, `tenant_id`, `subscription_id`, `attempt_number`, `status`, `next_retry_at`, `attempted_at`, `error_message`, `billing_invoice_id`

**Status Enum:** `pending | failed | succeeded | exhausted`

**CRUD:** C✅ R✅ U✅ D❌

---

### 29. `coupons`
**Status:** ✅ In DATABASE.md — ❌ NOT used in code
**Risk:** LOW (dead table)

**Usage in code:** ZERO references found across all 250+ TypeScript files.

**CRUD:** C❌ R❌ U❌ D❌

⚠️ **DEAD TABLE** — documented but never queried.

---

## Tables Used by Database Layer Only (no direct code interaction)

| Table | Source | Status |
|---|---|---|
| `vehicles` | ملاحظات.txt | LEGACY — undocumented, not in code |
| `workers` | ملاحظات.txt | LEGACY — undocumented, not in code |
| `availability` | ملاحظات.txt | LEGACY — undocumented, not in code |
| `business_config` | ملاحظات.txt | LEGACY — undocumented, not in code |
| `queue` | ملاحظات.txt | LEGACY — project uses BullMQ/Redis |

---

## Risk Summary

| Risk Level | Tables |
|---|---|
| CRITICAL | tenants, users, orders, subscriptions, refresh_tokens, device_sessions, invoices(billing) |
| HIGH | branches, items, customers, shifts, expenses, role_permissions, audit_logs, billing_customers, payments, dunning_attempts |
| MEDIUM | item_variants, categories, expense_templates, plans, notifications, features, plan_features, tenant_feature_overrides, invoice_items |
| LOW/DEAD | coupons |
