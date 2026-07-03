# SCHEMA_INVENTORY.md
# Sefay V2 — Complete Schema Inventory
# Generated: 2026-06-05
# Source: Code analysis + DATABASE.md (conflicts resolved per code + business logic)

---

## FINAL COUNTS

| Metric | Count |
|---|---|
| **Total Tables** | **30** |
| **Total Columns** | **~210** |
| **ENUMs** | **11** |
| **Foreign Keys** | **34** |
| **Indexes (recommended)** | **24** |
| **Views** | **0** |
| **Functions (database-level)** | **1** (process_recurring_expenses — verify if still used) |

---

## DOMAIN GROUPS

| Domain | Tables |
|---|---|
| Core Auth | users, device_sessions, refresh_tokens |
| Tenant & Organization | tenants, branches |
| Billing & Subscriptions | plans, subscriptions, billing_customers, billing_invoices, billing_invoice_items, payments, dunning_attempts |
| Feature Flags | features, plan_features, tenant_feature_overrides |
| Permissions | permissions, role_permissions |
| POS / Operations | items, item_variants, categories, orders, order_items, customers |
| Workforce | shifts, expenses, expense_templates |
| Platform | audit_logs, notifications |
| DEAD/ARCHIVE | coupons |

---

## COMPLETE TABLE DEFINITIONS

---

### `tenants`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| name | text | NOT NULL | |
| business_type | text | | e.g. restaurant, retail |
| status | text | NOT NULL, CHECK status IN ('active','trial','suspended','cancelled') | |
| trial_ends_at | timestamptz | | |
| created_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | soft delete |

**FKs:** none
**Indexes:** status, deleted_at, created_at

---

### `users`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| email | text | NOT NULL | |
| password_hash | text | NOT NULL | |
| role | text | NOT NULL, CHECK IN ('owner','manager','cashier','worker','superadmin') | |
| name | text | NOT NULL | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | soft delete |

**FKs:** tenant_id → tenants.id
**Indexes:** tenant_id, email, role, deleted_at

---

### `branches`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| name | text | NOT NULL | |
| address | text | | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | soft delete |

**FKs:** tenant_id → tenants.id
**Indexes:** tenant_id, deleted_at

---

### `plans`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| name | text | NOT NULL | |
| description | text | | |
| price_monthly | numeric(10,2) | NOT NULL | |
| price_yearly | numeric(10,2) | NOT NULL | |
| max_users | integer | NOT NULL | -1 = unlimited |
| max_branches | integer | NOT NULL | -1 = unlimited |
| trial_days | integer | NOT NULL, default 14 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |

**FKs:** none (system table)
**Indexes:** is_active, price_monthly

---

### `subscriptions`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| plan_id | uuid | FK → plans.id, NOT NULL | |
| status | text | NOT NULL, CHECK status IN (...) | see enum below |
| billing_cycle | text | NOT NULL, CHECK IN ('monthly','yearly'), default 'monthly' | |
| started_at | timestamptz | NOT NULL, default now() | |
| trial_ends_at | timestamptz | | null if not trial |
| current_period_start | timestamptz | | |
| current_period_end | timestamptz | | |
| cancelled_at | timestamptz | | |
| suspended_at | timestamptz | | |
| grace_period_ends_at | timestamptz | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |

**Status ENUM:** `trial | active | grace_period | past_due | suspended | cancelled | expired`

**FKs:** tenant_id → tenants.id, plan_id → plans.id
**Indexes:** tenant_id, status, started_at

---

### `billing_customers`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| provider | text | NOT NULL | mock, stripe, moyasar, tap |
| provider_customer_id | text | NOT NULL | Stripe customer ID |
| email | text | NOT NULL | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |

**FKs:** tenant_id → tenants.id
**Indexes:** (tenant_id, provider) UNIQUE

---

### `billing_invoices`
*(Previously named `invoices` in code — rename for clarity)*
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| subscription_id | uuid | FK → subscriptions.id, nullable | |
| invoice_number | text | NOT NULL | INV-XXXX-YEAR-SEQ |
| currency | text | NOT NULL, default 'SAR' | |
| subtotal | numeric(12,2) | NOT NULL | |
| tax_amount | numeric(12,2) | NOT NULL, default 0 | |
| discount_amount | numeric(12,2) | NOT NULL, default 0 | |
| total_amount | numeric(12,2) | NOT NULL | |
| amount_due | numeric(12,2) | | used by dunning |
| status | text | NOT NULL | see enum below |
| period_start | timestamptz | | |
| period_end | timestamptz | | |
| issued_at | timestamptz | | |
| due_at | timestamptz | | |
| paid_at | timestamptz | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |

**Status ENUM:** `draft | open | paid | void | overdue | failed`

**FKs:** tenant_id → tenants.id, subscription_id → subscriptions.id
**Indexes:** tenant_id, status, created_at
**UNIQUE:** invoice_number per tenant

---

### `billing_invoice_items`
*(Previously named `invoice_items` in billing code)*
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| invoice_id | uuid | FK → billing_invoices.id, NOT NULL | |
| description | text | NOT NULL | |
| quantity | integer | NOT NULL | |
| unit_price | numeric(12,2) | NOT NULL | |
| amount | numeric(12,2) | NOT NULL | |
| metadata_json | jsonb | | |
| created_at | timestamptz | NOT NULL, default now() | |

**FKs:** invoice_id → billing_invoices.id
**Indexes:** invoice_id

---

### `payments`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| invoice_id | uuid | FK → billing_invoices.id, NOT NULL | |
| provider | text | NOT NULL | mock, stripe, etc. |
| provider_payment_id | text | | Stripe payment intent ID |
| amount | numeric(12,2) | NOT NULL | |
| currency | text | NOT NULL, default 'SAR' | |
| status | text | NOT NULL | see enum below |
| paid_at | timestamptz | | |
| failure_reason | text | | |
| metadata_json | jsonb | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |

**Status ENUM:** `pending | succeeded | failed | refunded`

**FKs:** tenant_id → tenants.id, invoice_id → billing_invoices.id
**Indexes:** tenant_id, invoice_id, status, provider_payment_id

---

### `dunning_attempts`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| subscription_id | uuid | FK → subscriptions.id, NOT NULL | |
| billing_invoice_id | uuid | FK → billing_invoices.id, nullable | |
| attempt_number | integer | NOT NULL | 1-based |
| status | text | NOT NULL | see enum below |
| next_retry_at | timestamptz | | |
| attempted_at | timestamptz | | |
| error_message | text | | |
| created_at | timestamptz | NOT NULL, default now() | |

**Status ENUM:** `pending | failed | succeeded | exhausted`

**FKs:** tenant_id → tenants.id, subscription_id → subscriptions.id
**Indexes:** subscription_id, status, next_retry_at, attempted_at

---

### `features`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| key | text | NOT NULL, UNIQUE | e.g. pos, inventory |
| name | text | NOT NULL | |
| description | text | | |
| category | text | NOT NULL, CHECK IN ('core','advanced','premium') | |
| is_enabled | boolean | NOT NULL, default true | global default |
| created_at | timestamptz | NOT NULL, default now() | |

**FKs:** none (system table)
**Indexes:** key (UNIQUE)

---

### `plan_features`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| plan_id | uuid | FK → plans.id, NOT NULL | |
| feature_key | text | FK → features.key, NOT NULL | |
| is_enabled | boolean | NOT NULL | |
| limit_value | integer | | null = no limit |

**FKs:** plan_id → plans.id, feature_key → features.key
**UNIQUE:** (plan_id, feature_key)

---

### `tenant_feature_overrides`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| feature_key | text | FK → features.key, NOT NULL | |
| is_enabled | boolean | | null = inherit from plan |
| limit_value | integer | | null = inherit from plan |
| overridden_by | uuid | FK → users.id, NOT NULL | superadmin |
| overridden_at | timestamptz | NOT NULL, default now() | |
| note | text | | reason for override |

**FKs:** tenant_id → tenants.id, feature_key → features.key, overridden_by → users.id
**UNIQUE:** (tenant_id, feature_key)

---

### `permissions`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| key | text | NOT NULL, UNIQUE | e.g. invoice.create.own |
| resource | text | NOT NULL | e.g. invoice |
| action | text | NOT NULL | e.g. create |
| scope | text | NOT NULL | own, branch, all |
| description | text | | |

**FKs:** none (system table)

---

### `role_permissions`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| role | text | NOT NULL, CHECK IN ('owner','manager','cashier','worker','superadmin') | |
| permission_key | text | FK → permissions.key, NOT NULL | |
| is_granted | boolean | NOT NULL | |

**FKs:** permission_key → permissions.key
**UNIQUE:** (role, permission_key)

---

### `device_sessions`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK → users.id, NOT NULL | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| device_name | text | | |
| device_type | text | CHECK IN ('web','mobile'), default 'web' | |
| ip_address | text | | |
| user_agent | text | | |
| last_active_at | timestamptz | | |
| is_revoked | boolean | NOT NULL, default false | |
| created_at | timestamptz | NOT NULL, default now() | |

**FKs:** user_id → users.id, tenant_id → tenants.id
**Indexes:** user_id, is_revoked

---

### `refresh_tokens`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK → users.id, NOT NULL | |
| session_id | uuid | FK → device_sessions.id, NOT NULL | |
| token_hash | text | NOT NULL, UNIQUE | SHA-256 of raw token |
| expires_at | timestamptz | NOT NULL | |
| is_used | boolean | NOT NULL, default false | |
| created_at | timestamptz | NOT NULL, default now() | |

**FKs:** user_id → users.id, session_id → device_sessions.id
**Indexes:** token_hash (UNIQUE), user_id, is_used

---

### `items`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| category_id | uuid | FK → categories.id, nullable | |
| name | text | NOT NULL | |
| type | text | CHECK IN ('product','service','custom') | |
| operation_type | text | CHECK IN ('sell','book','repair','rent') | |
| price | numeric(10,2) | NOT NULL | |
| has_inventory | boolean | NOT NULL, default false | |
| has_variants | boolean | NOT NULL, default false | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | soft delete |

**FKs:** tenant_id → tenants.id, category_id → categories.id
**Indexes:** tenant_id, is_active, deleted_at

---

### `item_variants`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| item_id | uuid | FK → items.id, NOT NULL | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| name | text | NOT NULL | |
| price_adjustment | numeric(10,2) | NOT NULL, default 0 | |
| sku | text | | |
| stock_quantity | integer | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| deleted_at | timestamptz | | add for consistency |

**FKs:** item_id → items.id, tenant_id → tenants.id
**Indexes:** item_id, tenant_id, is_active

---

### `categories`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| name | text | NOT NULL | |
| type | text | CHECK IN ('product','service','expense') | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | add for ScopedRepo compatibility |

**FKs:** tenant_id → tenants.id
**Indexes:** tenant_id, type, is_active

---

### `orders`
*(Business "invoice" — POS receipt)*
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| branch_id | uuid | FK → branches.id, NOT NULL | |
| cashier_id | uuid | FK → users.id, NOT NULL | |
| customer_id | uuid | FK → customers.id, nullable | |
| shift_id | uuid | FK → shifts.id, NOT NULL | added via migration |
| status | text | NOT NULL, CHECK IN ('pending','completed','cancelled') | |
| subtotal | numeric(10,2) | NOT NULL | |
| discount | numeric(10,2) | NOT NULL, default 0 | code uses `discount` NOT `discount_amount` |
| tax | numeric(10,2) | NOT NULL, default 0 | code uses `tax` NOT `tax_amount` |
| total | numeric(10,2) | NOT NULL | |
| payment_method | text | CHECK IN ('cash','card','split') | |
| notes | text | | |
| created_at | timestamptz | NOT NULL, default now() | |
| cancelled_at | timestamptz | | set when status=cancelled |
| cancelled_by | uuid | FK → users.id, nullable | |

**FKs:** tenant_id, branch_id, cashier_id, customer_id, shift_id, cancelled_by
**Indexes:** tenant_id, branch_id, shift_id, status, created_at

---

### `order_items`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| order_id | uuid | FK → orders.id, NOT NULL | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| item_id | uuid | FK → items.id, nullable | nullable for deleted items |
| item_name | text | NOT NULL | snapshot |
| variant_id | uuid | FK → item_variants.id, nullable | |
| variant_name | text | | snapshot |
| quantity | integer | NOT NULL | ⚠️ code inserts as `qty` — BUG |
| unit_price | numeric(10,2) | NOT NULL | ⚠️ code inserts as `price` — BUG |
| total_price | numeric(10,2) | NOT NULL | |

**FKs:** order_id, tenant_id, item_id, variant_id
**Indexes:** order_id, tenant_id

---

### `customers`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| full_name | text | NOT NULL | code uses `full_name` not `name` |
| phone | text | | |
| email | text | | |
| loyalty_points | integer | NOT NULL, default 0 | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | | |
| deleted_at | timestamptz | | soft delete |

**FKs:** tenant_id → tenants.id
**Indexes:** tenant_id, phone, deleted_at

---

### `shifts`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| branch_id | uuid | FK → branches.id, NOT NULL | |
| cashier_id | uuid | FK → users.id, NOT NULL | |
| status | text | NOT NULL, CHECK IN ('open','closed') | |
| opening_cash | numeric(10,2) | NOT NULL | |
| closing_cash | numeric(10,2) | | null until closed |
| expected_cash | numeric(10,2) | | calculated at close |
| discrepancy | numeric(10,2) | | closing_cash - expected_cash |
| notes | text | | ⚠️ not in DATABASE.md — add |
| opened_at | timestamptz | NOT NULL, default now() | |
| closed_at | timestamptz | | null until closed |
| deleted_at | timestamptz | | ⚠️ not in DATABASE.md — add |

**FKs:** tenant_id, branch_id, cashier_id
**Indexes:** tenant_id, branch_id, status, opened_at, deleted_at

---

### `expenses`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| branch_id | uuid | FK → branches.id, NOT NULL | |
| shift_id | uuid | FK → shifts.id, nullable | ⚠️ MISSING — needed for shift expense calc |
| template_id | uuid | FK → expense_templates.id, nullable | |
| requested_by | uuid | FK → users.id, NOT NULL | |
| approved_by | uuid | FK → users.id, nullable | |
| amount | numeric(10,2) | NOT NULL | |
| notes | text | | ⚠️ DATABASE.md uses `note` — rename to `notes` |
| photo_url | text | | |
| status | text | NOT NULL, CHECK IN ('pending','approved','rejected','expired') | |
| expires_at | timestamptz | NOT NULL | |
| created_at | timestamptz | NOT NULL, default now() | |
| resolved_at | timestamptz | | |
| deleted_at | timestamptz | | soft delete |

**FKs:** tenant_id, branch_id, shift_id, template_id, requested_by, approved_by
**Indexes:** tenant_id, branch_id, status, created_at, deleted_at

---

### `expense_templates`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | FK → tenants.id, NOT NULL | |
| name | text | NOT NULL | |
| default_amount | numeric(10,2) | | |
| requires_photo | boolean | NOT NULL, default false | |
| expiry_hours | integer | NOT NULL | |
| is_active | boolean | NOT NULL, default true | |
| created_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | |

**FKs:** tenant_id → tenants.id
**Indexes:** tenant_id, deleted_at

---

### `audit_logs`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | nullable | null = superadmin action |
| actor_id | uuid | FK → users.id, NOT NULL | |
| actor_role | text | NOT NULL | |
| action | text | NOT NULL | e.g. auth.login, invoice.cancel |
| resource_type | text | NOT NULL | e.g. auth, invoice |
| resource_id | text | | |
| before_data | jsonb | | |
| after_data | jsonb | | |
| ip_address | text | | |
| device | text | | |
| created_at | timestamptz | NOT NULL, default now() | |

**FKs:** actor_id → users.id (no FK on tenant_id — allows superadmin logs)
**Indexes:** tenant_id, actor_id, action, created_at

---

### `notifications`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| tenant_id | uuid | nullable | |
| user_id | uuid | FK → users.id, NOT NULL | |
| type | text | NOT NULL | |
| title | text | NOT NULL | ⚠️ DATABASE.md uses `subject` — rename to `title` |
| body | text | NOT NULL | |
| data | jsonb | | ⚠️ DATABASE.md uses `metadata` — rename to `data` |
| channel | text | NOT NULL | in_app, email |
| is_read | boolean | NOT NULL, default false | ⚠️ missing from DATABASE.md |
| read_at | timestamptz | | |
| created_at | timestamptz | NOT NULL, default now() | |

**FKs:** user_id → users.id
**Indexes:** (user_id, tenant_id, is_read), created_at

---

### `coupons` ← DEAD TABLE (archive decision needed)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| tenant_id | uuid | FK → tenants.id | |
| code | text | UNIQUE | |
| type | text | percentage, fixed | |
| value | numeric | | |
| max_uses | integer | | |
| used_count | integer | default 0 | |
| starts_at | timestamptz | | |
| expires_at | timestamptz | | |
| is_active | boolean | | |

**Decision needed:** Archive or implement properly in V2.

---

## ENUM SUMMARY

| Enum | Values | Table |
|---|---|---|
| tenant.status | active, trial, suspended, cancelled | tenants |
| user.role | owner, manager, cashier, worker, superadmin | users |
| subscription.status | trial, active, grace_period, past_due, suspended, cancelled, expired | subscriptions |
| subscription.billing_cycle | monthly, yearly | subscriptions |
| plan.feature_category | core, advanced, premium | features |
| payment.status | pending, succeeded, failed, refunded | payments |
| dunning.status | pending, failed, succeeded, exhausted | dunning_attempts |
| item.type | product, service, custom | items |
| item.operation_type | sell, book, repair, rent | items |
| order.status | pending, completed, cancelled | orders |
| expense.status | pending, approved, rejected, expired | expenses |

---

## INDEX RECOMMENDATIONS

| Table | Index | Type |
|---|---|---|
| tenants | (status, deleted_at) | composite |
| users | (tenant_id, email) | composite unique |
| users | (role, deleted_at) | composite |
| refresh_tokens | (token_hash) | unique |
| device_sessions | (user_id, is_revoked) | composite |
| orders | (tenant_id, branch_id, status, created_at) | composite |
| orders | (shift_id, tenant_id) | composite |
| audit_logs | (tenant_id, created_at) | composite |
| audit_logs | (actor_id, action) | composite |
| subscriptions | (tenant_id, status) | composite |
| dunning_attempts | (subscription_id, status) | composite |
| dunning_attempts | (status, next_retry_at) | composite |
| billing_invoices | (tenant_id, status) | composite |
| payments | (invoice_id) | simple |
| tenant_feature_overrides | (tenant_id, feature_key) | unique |
| plan_features | (plan_id, feature_key) | unique |
| billing_customers | (tenant_id, provider) | unique |
| notifications | (user_id, tenant_id, is_read) | composite |
| expenses | (tenant_id, status, expires_at) | composite |
| shifts | (tenant_id, branch_id, status) | composite |

---

## FOREIGN KEYS SUMMARY (30 total)

| From | Column | To | Notes |
|---|---|---|---|
| users | tenant_id | tenants.id | |
| branches | tenant_id | tenants.id | |
| items | tenant_id | tenants.id | |
| items | category_id | categories.id | nullable |
| item_variants | item_id | items.id | |
| item_variants | tenant_id | tenants.id | |
| categories | tenant_id | tenants.id | |
| orders | tenant_id | tenants.id | |
| orders | branch_id | branches.id | |
| orders | cashier_id | users.id | |
| orders | customer_id | customers.id | nullable |
| orders | shift_id | shifts.id | |
| orders | cancelled_by | users.id | nullable |
| order_items | order_id | orders.id | |
| order_items | tenant_id | tenants.id | |
| order_items | item_id | items.id | nullable |
| order_items | variant_id | item_variants.id | nullable |
| customers | tenant_id | tenants.id | |
| shifts | tenant_id | tenants.id | |
| shifts | branch_id | branches.id | |
| shifts | cashier_id | users.id | |
| expenses | tenant_id | tenants.id | |
| expenses | branch_id | branches.id | |
| expenses | shift_id | shifts.id | nullable — ADD THIS |
| expenses | template_id | expense_templates.id | nullable |
| expenses | requested_by | users.id | |
| expenses | approved_by | users.id | nullable |
| expense_templates | tenant_id | tenants.id | |
| subscriptions | tenant_id | tenants.id | |
| subscriptions | plan_id | plans.id | |
| billing_customers | tenant_id | tenants.id | |
| billing_invoices | tenant_id | tenants.id | |
| billing_invoices | subscription_id | subscriptions.id | nullable |
| billing_invoice_items | invoice_id | billing_invoices.id | |
| payments | tenant_id | tenants.id | |
| payments | invoice_id | billing_invoices.id | |
| dunning_attempts | tenant_id | tenants.id | |
| dunning_attempts | subscription_id | subscriptions.id | |
| dunning_attempts | billing_invoice_id | billing_invoices.id | nullable |
| plan_features | plan_id | plans.id | |
| plan_features | feature_key | features.key | |
| tenant_feature_overrides | tenant_id | tenants.id | |
| tenant_feature_overrides | feature_key | features.key | |
| tenant_feature_overrides | overridden_by | users.id | |
| device_sessions | user_id | users.id | |
| device_sessions | tenant_id | tenants.id | |
| refresh_tokens | user_id | users.id | |
| refresh_tokens | session_id | device_sessions.id | |
| permissions | (none) | — | system table |
| role_permissions | permission_key | permissions.key | |
| audit_logs | actor_id | users.id | |
| notifications | user_id | users.id | |
