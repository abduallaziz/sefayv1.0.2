# COVERAGE_PHASE_B.md
# Phase B — api/src/modules

---

## Summary

| Metric | Value |
|--------|-------|
| Files Found | 109 |
| Files Read | 109 |
| Files Skipped | 0 |
| Coverage % | **100%** |

---

## Files Read — Full List with Status, Tables, and Columns

---

### MODULE: auth (6 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 1 | auth/auth.controller.ts | 59 | READ_VERIFIED | none (delegates to service) | — |
| 2 | auth/auth.module.ts | 11 | READ_VERIFIED | none | — |
| 3 | auth/auth.service.ts | 333 | READ_VERIFIED | `users`, `role_permissions`, `subscriptions`, `plan_features`, `tenant_feature_overrides`, `device_sessions`, `refresh_tokens` | users: `id,email,password_hash,role,tenant_id,is_active,name` · device_sessions: `user_id,tenant_id,device_name,device_type,ip_address,user_agent,last_active_at,is_revoked` · refresh_tokens: `user_id,session_id,token_hash,expires_at,is_used` · role_permissions: `permission_key,is_granted` · subscriptions: `plan_id` · plan_features: `feature_key` · tenant_feature_overrides: `feature_key,is_enabled` |
| 4 | auth/dto/login.dto.ts | 10 | READ_VERIFIED | none | Fields: `email,password,device_name` |
| 5 | auth/dto/refresh.dto.ts | 5 | READ_VERIFIED | none | Fields: `refresh_token` |
| 6 | auth/dto/revoke-session.dto.ts | 5 | READ_VERIFIED | none | Fields: `session_id` |

---

### MODULE: branches (6 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 7 | branches/branches.controller.ts | 62 | READ_VERIFIED | none (delegates to service) | Permissions: `branches.view`, `branches.manage` |
| 8 | branches/branches.module.ts | 12 | READ_VERIFIED | none | Imports: BillingModule |
| 9 | branches/branches.repository.ts | 78 | READ_VERIFIED | `branches` | `id,name,address,is_active,created_at,tenant_id,deleted_at` · INSERT: `tenant_id,name,address,is_active` · UPDATE soft-delete: `deleted_at,is_active` |
| 10 | branches/branches.service.ts | 45 | READ_VERIFIED | none (delegates to repo + BillingService.checkBranchLimit) | Guard: cannot delete last active branch |
| 11 | branches/dto/create-branch.dto.ts | 10 | READ_VERIFIED | none | Fields: `name(required),address(optional)` |
| 12 | branches/dto/update-branch.dto.ts | 14 | READ_VERIFIED | none | Fields: `name?,address?,is_active?` |

---

### MODULE: customers (7 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 13 | customers/customers.controller.ts | 48 | READ_VERIFIED | none | Endpoints: GET stats, GET /, GET :id, POST, PATCH :id, DELETE :id, GET :id/history |
| 14 | customers/customers.module.ts | 10 | READ_VERIFIED | none | — |
| 15 | customers/customers.repository.ts | 130 | READ_VERIFIED | `customers`, `orders` | customers: `id,full_name,phone,email,loyalty_points,is_active,created_at,tenant_id,updated_at,deleted_at` · orders: `id,total,payment_method,status,created_at,customer_id` |
| 16 | customers/customers.service.ts | 49 | READ_VERIFIED | none (delegates) | Phone uniqueness check per tenant |
| 17 | customers/dto/create-customer.dto.ts | 16 | READ_VERIFIED | none | Fields: `full_name,phone,email?,notes?` |
| 18 | customers/dto/customer-query.dto.ts | 18 | READ_VERIFIED | none | Fields: `search?,page?,limit?` |
| 19 | customers/dto/update-customer.dto.ts | 21 | READ_VERIFIED | none | Fields: `full_name?,phone?,email?,notes?,is_active?` |

---

### MODULE: expenses (10 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 20 | expenses/expense-templates.controller.ts | 58 | READ_VERIFIED | none | Endpoints: CRUD for expense templates |
| 21 | expenses/expense-templates.service.ts | 71 | READ_VERIFIED | `expense_templates` | `id,name,default_amount,requires_photo,expiry_hours,is_active,tenant_id,deleted_at` |
| 22 | expenses/expenses.controller.ts | 84 | READ_VERIFIED | none | Audit: `expense.request`, `expense.approve`, `expense.reject` |
| 23 | expenses/expenses.module.ts | 26 | READ_VERIFIED | none | Imports: ExpenseEngineModule, ApprovalEngineModule |
| 24 | expenses/expenses.scheduler.ts | 15 | READ_VERIFIED | none | CRON every hour → expireStaleExpenses() |
| 25 | expenses/expenses.service.ts | 202 | READ_VERIFIED | `expenses`, `expense_templates` | expenses: `status,amount,branch_id,expires_at,approved_by,resolved_at,notes,tenant_id,deleted_at` · expense_templates: `expiry_hours,requires_photo,default_amount,name` · JOIN: `users!requested_by(id,name,role)`, `users!approved_by(id,name,role)` |
| 26 | expenses/dto/create-expense-template.dto.ts | 19 | READ_VERIFIED | none | Fields: `name,expiry_hours,default_amount?,requires_photo?` |
| 27 | expenses/dto/create-expense.dto.ts | 19 | READ_VERIFIED | none | Fields: `branch_id,amount,template_id?,note?,photo_url?` |
| 28 | expenses/dto/query-expenses.dto.ts | 15 | READ_VERIFIED | none | Fields: `branch_id?,status?(pending/approved/rejected/expired),from?,to?` |
| 29 | expenses/dto/reject-expense.dto.ts | 6 | READ_VERIFIED | none | Fields: `reason(required)` |
| 30 | expenses/dto/update-expense-template.dto.ts | 8 | READ_VERIFIED | none | Extends CreateExpenseTemplateDto + `is_active?` |

---

### MODULE: invoices (5 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 31 | invoices/invoices.controller.ts | 78 | READ_VERIFIED | none | Headers used: `x-branch-id`, `x-shift-id` · Permissions: `invoice.create`, `invoice.view`, `invoice.cancel` |
| 32 | invoices/invoices.module.ts | 16 | READ_VERIFIED | none | Imports: PosEngineModule, PaymentEngineModule |
| 33 | invoices/invoices.service.ts | 133 | READ_VERIFIED | `orders`, `order_items` (via repo) | Delegates to PosEngine.buildInvoice + PaymentEngine + repo.insertItems |
| 34 | invoices/dto/cancel-invoice.dto.ts | 6 | READ_VERIFIED | none | Fields: `reason?` |
| 35 | invoices/dto/create-invoice.dto.ts | 74 | READ_VERIFIED | none | Fields: `items[],discount?,customer_id?,payment_method(cash/card/split),cash_tendered?,cash_amount?,card_amount?,notes?,tax_rate?` |
| 36 | invoices/repositories/invoices.repository.ts | 80 | READ_VERIFIED | `orders`, `order_items` | orders: `id,status,subtotal,discount,tax,total,payment_method,notes,created_at,cashier_id,customer_id,branch_id,tenant_id` · order_items: `order_id,item_id,item_name,qty,price` |

---

### MODULE: items (10 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 37 | items/categories.controller.ts | 57 | READ_VERIFIED | none | Permissions: `items.view`, `items.manage` |
| 38 | items/categories.service.ts | 27 | READ_VERIFIED | none (delegates to CategoriesRepository) | — |
| 39 | items/items.controller.ts | 92 | READ_VERIFIED | none | CRUD items + variants · Permissions: `items.view`, `items.manage` |
| 40 | items/items.module.ts | 30 | READ_VERIFIED | none | Manual factory injection for ScopedRepository child |
| 41 | items/items.service.ts | 51 | READ_VERIFIED | none (delegates) | Verifies item belongs to tenant before variant ops |
| 42 | items/dto/create-category.dto.ts | 13 | READ_VERIFIED | none | Fields: `name,type(product/service/expense)` |
| 43 | items/dto/create-item.dto.ts | 42 | READ_VERIFIED | none | Fields: `name,type,operation_type,price,category_id?,has_inventory?,has_variants?` · Enums: ItemType, OperationType |
| 44 | items/dto/create-variant.dto.ts | 23 | READ_VERIFIED | none | Fields: `name,price_adjustment?,sku?,stock_quantity?` |
| 45 | items/dto/update-category.dto.ts | 8 | READ_VERIFIED | none | Extends CreateCategoryDto + `is_active?` |
| 46 | items/dto/update-item.dto.ts | 8 | READ_VERIFIED | none | Extends CreateItemDto + `is_active?` |
| 47 | items/dto/update-variant.dto.ts | 8 | READ_VERIFIED | none | Extends CreateVariantDto + `is_active?` |
| 48 | items/repositories/categories.repository.ts | 61 | READ_VERIFIED | `categories` | `id,name,type,is_active,created_at,tenant_id,deleted_at` · INSERT: `...payload,tenant_id,is_active` · soft-delete: `is_active=false` |
| 49 | items/repositories/items.repository.ts | 109 | READ_VERIFIED | `items`, `item_variants` | items: `id,name,type,operation_type,price,has_inventory,has_variants,is_active,created_at,tenant_id,deleted_at` · item_variants: `id,name,price_adjustment,sku,stock_quantity,is_active,item_id,tenant_id` · JOIN: `categories(id,name,type)`, `item_variants(...)` |

---

### MODULE: notifications (2 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 50 | notifications/notifications.controller.ts | 66 | READ_VERIFIED | `notifications` (via NotificationsRepository) | `is_read,read_at` · queries by `user_id,tenant_id` |
| 51 | notifications/notifications.module.ts | 8 | READ_VERIFIED | none | Imports: NotificationModule (core) |

---

### MODULE: payments (4 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 52 | payments/payments.controller.ts | 57 | READ_VERIFIED | none | Endpoints: GET payment history, GET invoices, GET invoices/:id, GET invoices/:id/payments |
| 53 | payments/payments.module.ts | 10 | READ_VERIFIED | none | Imports: BillingModule |
| 54 | payments/payments.service.ts | 64 | READ_VERIFIED | `payments`, `invoices` (via BillingModule repos) | Delegates to BillingInvoiceService + PaymentsRepository + InvoicesRepository |
| 55 | payments/dto/query-payments.dto.ts | 15 | READ_VERIFIED | none | Fields: `page?,limit?` |

---

### MODULE: plans (4 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 56 | plans/plans.controller.ts | 40 | READ_VERIFIED | none | `@SkipTenant()` — no tenant context needed · CRUD plans |
| 57 | plans/plans.module.ts | 9 | READ_VERIFIED | none | — |
| 58 | plans/plans.service.ts | 58 | READ_VERIFIED | `plans` | `id,name,description,price_monthly,price_yearly,max_users,max_branches,trial_days,is_active,updated_at` |
| 59 | plans/dto/create-plan.dto.ts | 27 | READ_VERIFIED | none | Fields: `name,price_monthly,price_yearly,max_users,max_branches,description?,trial_days?,is_active?` |

---

### MODULE: reports (4 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 60 | reports/reports.controller.ts | 91 | READ_VERIFIED | none | Supports Excel export via ExcelJS · Permissions: `reports.view.branch` |
| 61 | reports/reports.module.ts | 10 | READ_VERIFIED | none | — |
| 62 | reports/reports.service.ts | 232 | READ_VERIFIED | `orders`, `shifts`, `expenses` | orders: `id,total,subtotal,discount,tax,payment_method,created_at,branch_id,cashier_id` · shifts: `id,cashier_id,branch_id,status,opening_cash,closing_cash,expected_cash,discrepancy,opened_at,closed_at` · expenses: `id,amount,status,notes,created_at,branch_id,template_id,requested_by,approved_by,resolved_at` |
| 63 | reports/dto/report-query.dto.ts | 28 | READ_VERIFIED | none | Fields: `period(today/week/month/custom)?,from?,to?,branch_id?,format(json/excel)?` |

---

### MODULE: shared/analytics (4 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 64 | shared/analytics/analytics.module.ts | 8 | READ_VERIFIED | none | — |
| 65 | shared/analytics/analytics.service.ts | 89 | READ_VERIFIED | none (delegates to PlatformAnalyticsRepository) | Facade: MRR, ARR, churn, growth, funnel, cohort, revenueByPlan, usage |
| 66 | shared/analytics/platform-analytics.repository.ts | 308 | READ_VERIFIED | `tenants`, `users`, `orders`, `subscriptions`, `plans`, `expenses`, `shifts` | tenants: `id,name,created_at,status` · orders: `total,created_at,status,tenant_id` · subscriptions: `plan_id,started_at,ends_at,cancelled_at,status,tenant_id` + JOIN `plans!inner(price_monthly,name)` · expenses: count · shifts: count |
| 67 | shared/analytics/dto/analytics-query.dto.ts | 19 | READ_VERIFIED | none | `period(30d/90d/6m/12m/ytd)?,from?,to?` |

---

### MODULE: shared/tenant-management (4 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 68 | shared/tenant-management/tenant-management.module.ts | 9 | READ_VERIFIED | none | — |
| 69 | shared/tenant-management/tenant-management.repository.ts | 145 | READ_VERIFIED | `tenants`, `users`, `branches`, `orders`, `tenant_feature_overrides`, `subscriptions`, `plans` | tenants: `id,name,status,deleted_at` · tenant_feature_overrides: `tenant_id,feature_key,is_enabled,limit_value,overridden_by,overridden_at,note` · subscriptions: `*, plans(*)`, UPDATE: `ends_at,status` |
| 70 | shared/tenant-management/services/feature.service.ts | 19 | READ_VERIFIED | none (delegates to TenantManagementRepository) | Wraps getFeatureOverrides + upsertFeatureOverride |
| 71 | shared/tenant-management/services/lifecycle.service.ts | 31 | READ_VERIFIED | none (delegates) | activate→status='active' · deactivate→status='suspended' · extendTrial · softDelete |

---

### MODULE: shifts (7 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 72 | shifts/shifts.controller.ts | 76 | READ_VERIFIED | none | Permissions: `shift.open`, `shift.close`, `shift.view.branch`, `shift.view.own` |
| 73 | shifts/shifts.module.ts | 13 | READ_VERIFIED | none | Imports: ShiftEngineModule |
| 74 | shifts/shifts.repository.ts | 117 | READ_VERIFIED | `shifts`, `orders`, `expenses` | shifts: `id,status,opening_cash,closing_cash,discrepancy,expected_cash,opened_at,closed_at,cashier_id,branch_id,tenant_id,deleted_at` · orders (shift invoices): `total,payment_method,shift_id` · expenses (shift): `amount,status,shift_id` |
| 75 | shifts/shifts.service.ts | 112 | READ_VERIFIED | none (delegates + AuditService + ShiftEngine) | Validates no double shift · builds summary via ShiftEngine |
| 76 | shifts/dto/close-shift.dto.ts | 9 | READ_VERIFIED | none | Fields: `closing_cash,notes?` |
| 77 | shifts/dto/open-shift.dto.ts | 11 | READ_VERIFIED | none | Fields: `branch_id,opening_cash,notes?` |

---

### MODULE: subscriptions (4 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 78 | subscriptions/subscriptions.controller.ts | 42 | READ_VERIFIED | none | Endpoints: GET current, POST upgrade, DELETE cancel |
| 79 | subscriptions/subscriptions.module.ts | 10 | READ_VERIFIED | none | Imports: BillingModule |
| 80 | subscriptions/subscriptions.service.ts | 55 | READ_VERIFIED | `tenants`, `users` (direct), delegates billing to BillingService | tenants: `name` · users: `email` (owner role) |
| 81 | subscriptions/dto/create-subscription.dto.ts | 9 | READ_VERIFIED | none | Fields: `plan_id(UUID),billing_cycle?(monthly/yearly)` |

---

### MODULE: superadmin (16 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 82 | superadmin/superadmin.controller.ts | 79 | READ_VERIFIED | none | Endpoints: stats, revenue, tenants CRUD, feature-overrides |
| 83 | superadmin/superadmin.module.ts | 21 | READ_VERIFIED | none | Imports: TenantManagementModule, AnalyticsModule, QueueModule |
| 84 | superadmin/superadmin.service.ts | 75 | READ_VERIFIED | none (delegates to shared repos/services) | Facade: findAll/findOne/activate/deactivate/extendTrial/softDelete/featureOverrides |
| 85 | superadmin/controllers/analytics.controller.ts | 61 | READ_VERIFIED | none | Permission: `analytics.view.all` · All analytics endpoints |
| 86 | superadmin/controllers/audit-logs.controller.ts | 49 | READ_VERIFIED | none | Permission: `audit.view.all` · Supports export: excel + csv |
| 87 | superadmin/controllers/queues.controller.ts | 93 | READ_VERIFIED | none | Permissions: `superadmin.queue.view`, `superadmin.queue.manage` · pause/resume/retry/clean |
| 88 | superadmin/dto/audit-query.dto.ts | 33 | READ_VERIFIED | none | Fields: `actor_id?,action?,resource_type?,tenant_id?,from?,to?,page?,limit?` |
| 89 | superadmin/dto/queue-jobs.dto.ts | 40 | READ_VERIFIED | none | Fields: `status?(all/waiting/active/completed/failed/delayed),page?,limit?` · CleanQueueDto: `status?,grace?` |
| 90 | superadmin/dto/superadmin-extend-trial.dto.ts | 6 | READ_VERIFIED | none | Fields: `days(min 1)` |
| 91 | superadmin/dto/superadmin-feature-override.dto.ts | 12 | READ_VERIFIED | none | Fields: `is_enabled?,limit_value?,note?` |
| 92 | superadmin/dto/superadmin-query.dto.ts | 15 | READ_VERIFIED | none | Fields: `page?,limit?,search?,status?(active/trial/suspended/cancelled)` |
| 93 | superadmin/guards/superadmin.guard.ts | 17 | READ_VERIFIED | none | Checks `user.role === 'superadmin'` strictly |
| 94 | superadmin/health/health.controller.ts | 31 | READ_VERIFIED | none | Permission: `superadmin.health.view` · GET health/db/redis/queues |
| 95 | superadmin/health/health.service.ts | 129 | READ_VERIFIED | `tenants` (probe only) | SELECT id LIMIT 1 from tenants as DB connectivity check |
| 96 | superadmin/repositories/audit-logs.repository.ts | 82 | READ_VERIFIED | `audit_logs` | `id,tenant_id,actor_id,actor_role,action,resource_type,resource_id,before_data,after_data,ip_address,device,created_at` · max 10,000 rows for export |
| 97 | superadmin/services/audit-logs.service.ts | 80 | READ_VERIFIED | none (delegates) | Exports to Excel (ExcelJS) or CSV |

---

### MODULE: tenants (5 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 98 | tenants/tenants.controller.ts | 43 | READ_VERIFIED | none | Owner-facing only. Permissions: `settings.view`, `settings.manage` · GET profile/subscription/usage |
| 99 | tenants/tenants.module.ts | 15 | READ_VERIFIED | none | Comment in file: "No admin tooling. tenant_id always from JWT" |
| 100 | tenants/tenants.service.ts | 51 | READ_VERIFIED | none (delegates to TenantsRepository) | getUsage returns max_users/max_branches from subscription |
| 101 | tenants/dto/update-tenant-profile.dto.ts | 19 | READ_VERIFIED | none | Fields: `name?,business_type?(restaurant/cafe/retail/service/workshop/other)` |
| 102 | tenants/repositories/tenants.repository.ts | 84 | READ_VERIFIED | `tenants`, `subscriptions`, `users`, `branches`, `orders` | tenants: `id,name,business_type,status,trial_ends_at,created_at` · subscriptions: `id,status,plan_id,started_at,expires_at,cancelled_at,trial_ends_at,max_users,max_branches,billing_cycle,current_period_start,current_period_end` · users: count · branches: count · orders: count (this month) |

---

### MODULE: users (7 files)

| # | File | Lines | Status | Tables Used | Key Columns |
|---|------|-------|--------|-------------|-------------|
| 103 | users/users.controller.ts | 67 | READ_VERIFIED | none | CRUD + PATCH :id/role · Permissions: `users.view`, `users.manage` |
| 104 | users/users.module.ts | 14 | READ_VERIFIED | none | Imports: AuditModule, PermissionsModule, BillingModule |
| 105 | users/users.repository.ts | 61 | READ_VERIFIED | `users` | `id,email,name,role,is_active,created_at,tenant_id,deleted_at,password_hash` · ScopedRepository |
| 106 | users/users.service.ts | 117 | READ_VERIFIED | `users` (via repo) | bcrypt hash (rounds=12) · BillingService.checkUserLimit before create · AuditService on create/update/changeRole/delete |
| 107 | users/dto/change-role.dto.ts | 6 | READ_VERIFIED | none | Fields: `role(UserRole enum)` |
| 108 | users/dto/create-user.dto.ts | 17 | READ_VERIFIED | none | Fields: `email,password(min8),name,role(UserRole),branch_id?` |
| 109 | users/dto/update-user.dto.ts | 20 | READ_VERIFIED | none | Fields: `name?,password?,role?,is_active?,branch_id?` · Note: role change via PATCH :id/role endpoint only |

---

## Mathematical Proof

```
Files found in api/src/modules:  109
Batches used:                      14
Files per batch (max):              8
Files in batches 1-14:            109
Files Skipped:                      0
READ_VERIFIED:                    109

Coverage = 109/109 = 100% ✅
```

---

## Unique Tables Discovered in Phase B

| Table | Modules |
|-------|---------|
| `users` | auth, users, customers (orders join), tenant-management, analytics, branches, tenants, subscriptions |
| `device_sessions` | auth |
| `refresh_tokens` | auth |
| `role_permissions` | auth |
| `subscriptions` | auth, tenant-management, tenants, analytics, billing (via modules) |
| `plan_features` | auth |
| `tenant_feature_overrides` | auth, tenant-management, feature-flags |
| `branches` | branches, tenant-management, tenants |
| `customers` | customers |
| `orders` | invoices, customers, shifts, reports, analytics, tenant-management, tenants |
| `order_items` | invoices |
| `expenses` | expenses, reports, analytics, shifts |
| `expense_templates` | expenses |
| `items` | items |
| `item_variants` | items |
| `categories` | items |
| `shifts` | shifts, analytics |
| `notifications` | notifications |
| `payments` | payments |
| `invoices` | payments (billing) |
| `plans` | plans, analytics, tenant-management |
| `tenants` | tenant-management, analytics, subscriptions, health |
| `audit_logs` | superadmin |

---

## ⛔ PHASE B COMPLETE — AWAITING CONFIRMATION BEFORE PHASE C
