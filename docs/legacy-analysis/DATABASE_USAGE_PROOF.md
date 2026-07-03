# DATABASE_USAGE_PROOF.md
# Actual Supabase Query Analysis — Extracted from Source Code

---

## 1. api/src/core/tenant/scoped.repository.ts

**Table:** (dynamic — table name injected at call time)

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (base query, overridden by child) | 14–16 |
| SELECT | `*` (unscopedQuery) | 29–31 |

---

## 2. api/src/modules/users/users.repository.ts

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, email, name, role, is_active, created_at` | 14–16 |
| SELECT | `id, email, name, role, is_active, created_at` | 20–22 |
| SELECT | `id, email, name, role, is_active` | 29 |
| SELECT | `*` (count only) | 39 |
| INSERT | (dynamic via `data` record) → returns `id, email, name, role, is_active, created_at` | 44–49 |
| UPDATE | (dynamic via `data` record) → returns `id, email, name, role, is_active` | 52–59 |
| UPDATE (soft delete) | `deleted_at, is_active` | 62–68 |

---

## 3. api/src/modules/branches/branches.repository.ts

**Table:** `branches`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, name, address, is_active, created_at` | 13–15 |
| SELECT | `id, name, address, is_active, created_at` | 25–27 |
| SELECT | `id` (count only) | 38–40 |
| INSERT | `tenant_id, name, address, is_active` → returns `id, name, address, is_active, created_at` | 49–57 |
| UPDATE | (dynamic via partial record) → returns `id, name, address, is_active, created_at` | 67–75 |
| UPDATE (soft delete) | `deleted_at, is_active` | 81–87 |

---

## 4. api/src/modules/items/repositories/categories.repository.ts

**Table:** `categories`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, name, type, is_active, created_at` | 17–19 |
| SELECT | `id, name, type, is_active, created_at` | 32–33 |
| INSERT | `...payload, tenant_id, is_active` | 41–44 |
| UPDATE | `...payload` | 51–53 |
| UPDATE (soft delete) | `is_active` | 63–65 |

---

## 5. api/src/modules/items/repositories/items.repository.ts

**Table:** `items`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, name, type, operation_type, price, has_inventory, has_variants, is_active, created_at` + join `categories(id, name, type)` | 17–22 |
| SELECT | `id, name, type, operation_type, price, has_inventory, has_variants, is_active, created_at` + joins `categories(id,name,type)`, `item_variants(id,name,price_adjustment,sku,stock_quantity,is_active)` | 29–38 |
| INSERT | `...payload, tenant_id, is_active` | 41–44 |
| UPDATE | `...payload` | 51–53 |
| UPDATE (soft delete) | `deleted_at, is_active` | 63–66 |

**Table:** `item_variants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, name, price_adjustment, sku, stock_quantity, is_active` | 73–75 |
| INSERT | `...payload, item_id, tenant_id, is_active` | 84–87 |
| UPDATE | `...payload` | 100–101 |
| UPDATE (soft delete) | `is_active` | 112–114 |

---

## 6. api/src/modules/invoices/repositories/invoices.repository.ts

**Table:** `orders`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, status, subtotal, discount, tax, total, payment_method, notes, created_at, cashier_id, customer_id, branch_id` | 22–25 |
| SELECT | `id, status, subtotal, discount, tax, total, payment_method, notes, created_at, cashier_id, customer_id, branch_id` | 39–43 |
| INSERT | `...payload, tenant_id` → returns `id` | 51–56 |
| UPDATE | `status` → returns `id, status` | 76–84 |

**Table:** `order_items`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `order_id, item_id, item_name, qty, price` | 63–71 |

---

## 7. api/src/modules/customers/customers.repository.ts

**Table:** `customers`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, full_name, phone, email, loyalty_points, is_active, created_at` | 16–17 |
| SELECT | `*` | 32–33 |
| SELECT | `id` | 43 |
| SELECT | `id, created_at` | 89–91 |
| INSERT | `...payload, tenant_id, loyalty_points, is_active` | 51–58 |
| UPDATE | `...payload, updated_at` | 66–69 |
| UPDATE (soft delete) | `deleted_at` | 79–82 |

**Table:** `orders` (used for customer history/stats)

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, total, payment_method, status, created_at` | 117–119 |
| SELECT | `total, created_at` | 130–133 |

---

## 8. api/src/modules/shifts/shifts.repository.ts

**Table:** `shifts`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, status, opening_cash, closing_cash, discrepancy, expected_cash, opened_at, closed_at, cashier_id, branch_id` | 12–14 |
| SELECT | `*` | 29, 40 |
| SELECT | `*` | 119–121 |
| INSERT | `...payload, status, opened_at` | 56–63 |
| UPDATE (close) | `status, closing_cash, expected_cash, discrepancy, closed_at` | 79–88 |

**Table:** `orders` (shift invoices)

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `total, payment_method` | 97–99 |

**Table:** `expenses` (shift expenses)

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `amount, status` | 107–109 |

---

## 9. api/src/modules/shared/tenant-management/tenant-management.repository.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (with count) | 17–20 |
| SELECT | `*` | 39–43 |
| UPDATE | `status` | 50–54 |
| UPDATE (soft delete) | `deleted_at, status` | 61–65 |

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 73–77 |

**Table:** `branches`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 79–82 |

**Table:** `orders`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 84–87 |

**Table:** `tenant_feature_overrides`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` | 96–99 |
| UPSERT | `tenant_id, feature_key, is_enabled, limit_value, overridden_by, overridden_at, note` | 112–124 |

**Table:** `subscriptions` (+ join `plans`)

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*, plans(*)` | 133–140 |
| UPDATE | `ends_at, status` | 150–154 |

---

## 10. api/src/modules/tenants/repositories/tenants.repository.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, name, business_type, status, trial_ends_at, created_at` | 13–14 |
| UPDATE | `name, business_type` (dynamic) → returns `id, name, business_type, status, trial_ends_at, created_at` | 23–30 |

**Table:** `subscriptions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, status, plan_id, started_at, expires_at, cancelled_at, trial_ends_at, max_users, max_branches, billing_cycle, current_period_start, current_period_end` | 38–51 |

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 63–66 |

**Table:** `branches`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 74–77 |

**Table:** `orders`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 89–93 |

---

## 11. api/src/core/billing/repositories/billing-customers.repository.ts

**Table:** `billing_customers`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` | 22–27 |
| INSERT | `tenant_id, provider, provider_customer_id, email` | 39–45 |

---

## 12. api/src/core/billing/repositories/invoices.repository.ts

**Table:** `invoices`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 43–46 |
| INSERT | `tenant_id, subscription_id, invoice_number, currency, subtotal, tax_amount, discount_amount, total_amount, status, period_start, period_end, issued_at, due_at` | 76–92 |
| UPDATE (mark paid) | `status, paid_at, updated_at` | 119–125 |
| UPDATE (mark overdue) | `status, updated_at` | 132–136 |
| SELECT | `*` (with count) | 148–153 |
| SELECT | `*` | 160–165 |

**Table:** `invoice_items`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `invoice_id, description, quantity, unit_price, amount, metadata_json` | 99–110 |
| SELECT | `*` | 171–175 |

---

## 13. api/src/core/billing/repositories/payments.repository.ts

**Table:** `payments`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `tenant_id, invoice_id, provider, amount, currency, status` | 34–43 |
| UPDATE | `status, provider_payment_id, failure_reason, paid_at, updated_at` | 60–68 |
| SELECT | `*` (with count) | 79–84 |
| SELECT | `*` | 90–94 |

---

## 14. api/src/modules/shared/analytics/platform-analytics.repository.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 20 |
| SELECT | `created_at` | 156–159 |
| SELECT | `*` (count, baseline) | 160–161 |
| SELECT | `id, created_at` | 189–192 |
| SELECT | `id, name` | 299 |
| UPDATE | `status` (via suspendTenant — actually in dunning.service) | — |

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 21, 307 |

**Table:** `orders`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 22, 304 |
| SELECT | `total` | 23 |
| SELECT | `created_at, total` | 44 |
| SELECT | `created_at` | 308 |

**Table:** `subscriptions` (+ join `plans`)

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `plan_id, plans!inner(price_monthly)` | 76–78 |
| SELECT | `started_at, ends_at, cancelled_at, status, plan_id, plans!inner(price_monthly)` | 90–92 |
| SELECT | `cancelled_at, tenant_id` | 127–130 |
| SELECT | `*` (count, active) | 131–132 |
| SELECT | `tenant_id` | 199 |
| SELECT | `tenant_id, started_at, plans!inner(price_monthly)` | 200 |
| SELECT | `tenant_id, started_at, cancelled_at` | 201 |
| SELECT | `plan_id, plans!inner(name, price_monthly)` | 269–271 |
| SELECT | `tenant_id, status, started_at, ends_at, cancelled_at` | 227 |

**Table:** `expenses`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 306 |

**Table:** `shifts`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 305 |

---

## 15. api/src/modules/superadmin/repositories/audit-logs.repository.ts

**Table:** `audit_logs`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (with count) | 39–43 |
| SELECT | `*` | 68–71 |
| SELECT | `*` | 79–83 |

---

## 16. api/src/core/notification/repositories/notifications.repository.ts

**Table:** `notifications`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (with count) | 32–38 |
| SELECT | `*` (count only) | 45–50 |
| UPDATE (mark read) | `is_read, read_at` | 57–59 |
| UPDATE (mark all read) | `is_read, read_at` | 67–70 |

---

## 17. api/src/modules/auth/auth.service.ts

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, email, password_hash, role, tenant_id, is_active, name` | 78–80 |
| SELECT | `id, email, role, tenant_id` | 230–233 |
| SELECT | `id, name, email, role, tenant_id, is_active, created_at` | 315–317 |

**Table:** `role_permissions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `permission_key` | 30–32 |

**Table:** `subscriptions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `plan_id` | 43–46 |

**Table:** `plan_features`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `feature_key` | 53–56 |

**Table:** `tenant_feature_overrides`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `feature_key, is_enabled` | 62–63 |

**Table:** `device_sessions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `user_id, tenant_id, device_name, device_type, ip_address, user_agent, last_active_at, is_revoked` | 108–118 |
| SELECT | `id, is_revoked, user_id, tenant_id` | 221–223 |
| SELECT | `id, user_id` | 351–353 |
| UPDATE | `is_revoked` | 197–199, 295–297, 365–367 |
| UPDATE | `last_active_at` | 272–274 |

**Table:** `refresh_tokens`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `user_id, session_id, token_hash, expires_at, is_used` | 140–146 |
| INSERT | `user_id, session_id, token_hash, expires_at, is_used` | 264–270 |
| SELECT | `id, user_id, session_id, is_used, expires_at` | 186–189 |
| UPDATE | `is_used` | 241–243, 288–292, 371–374 |

---

## 18. api/src/core/audit/audit.service.ts

**Table:** `audit_logs`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `tenant_id, actor_id, actor_role, action, resource_type, resource_id, before_data, after_data, ip_address, device, created_at` | 14–27 |

---

## 19. api/src/core/feature-flags/feature-flags.service.ts

**Table:** `tenant_feature_overrides`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `is_enabled` | 13–16 |
| SELECT | `limit_value` | 57–60 |

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `subscriptions(plan_id)` (join) | 24–26, 66–68 |

**Table:** `plan_features`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `is_enabled` | 33–36 |
| SELECT | `limit_value` | 74–77 |

**Table:** `features`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `is_enabled` | 46–48 |

---

## 20. api/src/core/permissions/permissions.service.ts

**Table:** `role_permissions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `is_granted` | 13–15 |
| SELECT | `permission_key` | 25–27 |

---

## 21. api/src/core/security/branch-validator.service.ts

**Table:** `branches`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, tenant_id, is_active` | 13–16 |

---

## 22. api/src/core/notification/channels/inapp.channel.ts

**Table:** `notifications`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `user_id, tenant_id, type, title, body, data, channel` | 26–34 |

---

## 23. api/src/core/queue/processors/audit-cleanup.processor.ts

**Table:** `audit_logs`

| Operation | Columns | Lines |
|-----------|---------|-------|
| DELETE | (rows where `created_at < cutoffDate`) | 32–35 |

---

## 24. api/src/core/metrics/collectors/business.collector.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (count only) | 20–23 |

---

## 25. api/src/modules/expenses/expenses.service.ts

**Table:** `expenses`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `status, amount` | 27–29 |
| SELECT | `*, expense_templates(id,name), users!requested_by(id,name,role), users!approved_by(id,name,role)` | 60–64 |
| SELECT | `*, expense_templates(id,name,requires_photo), users!requested_by(id,name,role), users!approved_by(id,name,role)` | 83–87 |
| INSERT | `(via expenseEngine.buildExpenseRequest)` | 133–136 |
| UPDATE | `status` (expired) | 156–160 |
| UPDATE | `status, approved_by, resolved_at` | 169–173 |
| UPDATE | `status, approved_by, resolved_at, notes` | 204–210 |
| UPDATE | `status` (bulk expire) | 228–230 |

**Table:** `expense_templates`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `expiry_hours, requires_photo, default_amount, name` | 104–106 |

---

## 26. api/src/modules/reports/reports.service.ts

**Table:** `orders`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, total, subtotal, discount, tax, payment_method, created_at, branch_id` | 43–44 |
| SELECT | `id, total, payment_method, branch_id, created_at, cashier_id` | 181–182 |

**Table:** `shifts`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, cashier_id, branch_id, status, opening_cash, closing_cash, expected_cash, discrepancy, opened_at, closed_at` | 93–94 |

**Table:** `expenses`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, amount, status, notes, created_at, branch_id, template_id, requested_by, approved_by, resolved_at` | 136–137 |

---

## 27. api/src/core/billing/billing.service.ts

**Table:** `subscriptions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| INSERT | `tenant_id, plan_id, status, billing_cycle, started_at, trial_ends_at` | 30–38 |
| SELECT | `*` | 48–52 |
| UPDATE (extend trial) | `trial_ends_at, status, updated_at` | 166–171 |
| UPDATE (activate existing) | `plan_id, status, billing_cycle, current_period_start, current_period_end, updated_at` | 198–208 |
| INSERT (activate new) | `tenant_id, plan_id, status, billing_cycle, started_at, current_period_start, current_period_end` | 213–222 |
| UPDATE (cancel) | `status, cancelled_at, updated_at` | 259–264 |
| UPDATE (expire trial) | `status, suspended_at, updated_at` | 275–280 |
| UPDATE (expire grace) | `status, suspended_at, updated_at` | 289–294 |

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 103–107 |

**Table:** `branches`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (count only) | 122–126 |

**Table:** `plans`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` | 137–140, 148–151 |

---

## 28. api/src/core/billing/dunning/dunning.service.ts

**Table:** `subscriptions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, tenant_id, plan_id, status` | 25–28 |
| UPDATE | `status` (= 'active') | 189–191 |
| UPDATE | `status` (= 'past_due') | 222–224 |

**Table:** `dunning_attempts`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` (pending retries) | 50–52 |
| SELECT | `tenant_id, subscription_id` (exhausted) | 81–83 |
| SELECT | `attempt_number` | 103–107 |
| INSERT | `tenant_id, subscription_id, attempt_number, status, next_retry_at` | 127–133 |
| UPDATE | `status` (= 'succeeded') | 186–188 |
| UPDATE | `status, error_message` (= 'failed') | 202–205 |
| UPDATE | `status` (= 'exhausted') | 215–219 |

**Table:** `billing_customers`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `provider_customer_id` | 154–157 |

**Table:** `invoices`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id, amount_due, currency` | 165–169 |

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPDATE | `status` (= 'suspended') | 231–234 |

---

## 29. api/src/modules/subscriptions/subscriptions.service.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `name` | 49–51 |

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `email` | 56–60 |

---

## 30. api/src/core/backup/backup.service.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` | 80–83 |

**Table:** `users`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` | 96–98 |

**Table:** `orders`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` | 101–103 |

---

## 31. api/src/modules/superadmin/health/health.service.ts

**Table:** `tenants`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `id` (connectivity probe) | 46 |

---

## 32. api/src/modules/expenses/expense-templates.service.ts

**Table:** `expense_templates`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` | 15–19 |
| SELECT | `*` | 27–32 |
| INSERT | `tenant_id, name, default_amount, requires_photo, expiry_hours, is_active` | 40–49 |
| UPDATE | `...dto` (dynamic) | 62–65 |
| UPDATE (soft delete) | `deleted_at` | 76–79 |

---

## 33. api/src/modules/plans/plans.service.ts

**Table:** `plans`

| Operation | Columns | Lines |
|-----------|---------|-------|
| SELECT | `*` | 13–15 |
| SELECT | `*` | 22–25 |
| INSERT | `...dto, trial_days, is_active` | 34–39 |
| UPDATE | `...dto, updated_at` | 50–52 |
| UPDATE (deactivate) | `is_active, updated_at` | 61–63 |

---

## 34. api/src/database/seeds/permissions.seed.ts

**Table:** `permissions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPSERT | `key, resource, action, scope, description` | 96–99 |

**Table:** `role_permissions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPSERT | `role, permission_key, is_granted` | 108–110 |

---

## 35. api/src/seeds/permissions.seed.ts

**Table:** `permissions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPSERT | `key, resource, action, scope, description` | 126–129 |

**Table:** `role_permissions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPSERT | `role, permission_key, is_granted` | 138–141 |

---

## 36. api/src/core/billing/stripe-webhook.controller.ts

**Table:** `payments`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPDATE (payment failed) | `status, failure_reason, updated_at` | 97–102 |
| UPDATE (payment succeeded) | `status, updated_at` | 123–126 |

**Table:** `billing_invoices`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPDATE (payment failed) | `status, updated_at` | 105–108 |
| UPDATE (payment succeeded) | `status, paid_at, updated_at` | 128–133 |

**Table:** `subscriptions`

| Operation | Columns | Lines |
|-----------|---------|-------|
| UPDATE (subscription deleted) | `status, cancelled_at` | 147–151 |

---

## Summary

| Metric | Count |
|--------|-------|
| **Total repositories/services analyzed** | **36** |
| **Total distinct tables discovered** | **29** |
| **Total distinct columns discovered** | **~250** |

### Tables Discovered (29)

| # | Table |
|---|-------|
| 1 | `users` |
| 2 | `branches` |
| 3 | `categories` |
| 4 | `items` |
| 5 | `item_variants` |
| 6 | `orders` |
| 7 | `order_items` |
| 8 | `customers` |
| 9 | `shifts` |
| 10 | `expenses` |
| 11 | `expense_templates` |
| 12 | `tenants` |
| 13 | `tenant_feature_overrides` |
| 14 | `subscriptions` |
| 15 | `plans` |
| 16 | `plan_features` |
| 17 | `billing_customers` |
| 18 | `invoices` |
| 19 | `invoice_items` |
| 20 | `payments` |
| 21 | `audit_logs` |
| 22 | `notifications` |
| 23 | `device_sessions` |
| 24 | `refresh_tokens` |
| 25 | `role_permissions` |
| 26 | `permissions` |
| 27 | `features` |
| 28 | `dunning_attempts` |
| 29 | `billing_invoices` |
