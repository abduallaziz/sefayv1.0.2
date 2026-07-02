# MASTER_SCHEMA_SPEC.md
# Sefay V2 — Master Schema Specification
# Single Source of Truth for SQL_DDL_V2.sql
#
# Compiled from:
#   - DATABASE.md                    (documented schema intent)
#   - TABLE_USAGE_REPORT.md          (actual code usage)
#   - SCHEMA_GAPS.md                 (drift analysis)
#   - BUSINESS_RULES_DISCOVERY.md    (runtime behavior)
#
# Date: 2026-06-05
# Status: See bottom of file
#
# APPROACH: Fresh Supabase project from scratch.
# The legacy production database is disposable and is NOT used as a source of truth.
# All decisions are derived from: code analysis + DATABASE.md intent + business rules.
# No migration from existing DB. DDL creates the schema as if for the first time.

---

## SCOPE

This document defines the **final, authoritative schema** for Sefay V2.
The target is a **brand-new Supabase project**. No data migration. No legacy constraints.
Every conflict between DATABASE.md and code is resolved here with a decision and reason.
No SQL is generated here — this spec feeds into SQL_DDL_V2.sql.

---

## ACTIVE TABLES: 28

| # | Table | Domain | Source |
|---|---|---|---|
| 1 | tenants | Core | Documented + confirmed in code |
| 2 | users | Auth | Documented + confirmed in code |
| 3 | device_sessions | Auth | Documented + confirmed in code |
| 4 | refresh_tokens | Auth | Documented + confirmed in code |
| 5 | branches | Org | Documented + confirmed in code |
| 6 | plans | Billing | Documented + extended by code |
| 7 | subscriptions | Billing | Documented + extended by code |
| 8 | billing_customers | Billing | Code only — missing from DATABASE.md |
| 9 | billing_invoices | Billing | Code only — missing from DATABASE.md |
| 10 | billing_invoice_items | Billing | Code only — missing from DATABASE.md |
| 11 | payments | Billing | Partially documented — extended by code |
| 12 | dunning_attempts | Billing | Code only — missing from DATABASE.md |
| 13 | features | Feature Flags | Documented + confirmed in code |
| 14 | plan_features | Feature Flags | Documented + confirmed in code |
| 15 | tenant_feature_overrides | Feature Flags | Documented + confirmed in code |
| 16 | permissions | RBAC | Documented + confirmed in code |
| 17 | role_permissions | RBAC | Documented + confirmed in code |
| 18 | items | POS | Documented + confirmed in code |
| 19 | item_variants | POS | Documented + confirmed in code |
| 20 | categories | POS | Documented + confirmed in code |
| 21 | orders | POS | Documented + column drift resolved |
| 22 | order_items | POS | Documented + code bugs identified |
| 23 | customers | POS | Documented + column drift resolved |
| 24 | shifts | Workforce | Documented + undocumented columns added |
| 25 | expenses | Workforce | Documented + column drift resolved |
| 26 | expense_templates | Workforce | Documented + confirmed in code |
| 27 | audit_logs | Platform | Documented + confirmed in code |
| 28 | notifications | Platform | Documented + column drift resolved |

## EXCLUDED TABLES

| Table | Reason |
|---|---|
| `coupons` | Zero code usage. Feature not implemented. Exclude from V2. Preserve data snapshot before drop. |
| `vehicles` | Legacy. No code reference. Drop. |
| `workers` | Legacy. No code reference. Drop. |
| `availability` | Legacy. No code reference. Drop. |
| `queue` | Legacy. Project uses BullMQ/Redis. Drop. |
| `business_config` | Excluded — zero code references confirmed. No role in V2. (B-03 resolved) |

---

## TABLE SPECIFICATIONS

---

### TABLE: `tenants`

**Domain:** Core
**Purpose:** Root entity. Every tenant is an isolated business.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| name | text | NOT NULL | — | Business name |
| business_type | text | NULL | — | e.g. restaurant, retail, salon |
| status | text | NOT NULL | 'trial' | CHECK below |
| trial_ends_at | timestamptz | NULL | — | Set on registration |
| created_at | timestamptz | NOT NULL | now() | |
| deleted_at | timestamptz | NULL | — | Soft delete |

**status CHECK:** `('active', 'trial', 'suspended', 'cancelled')`

**Primary Key:** `id`

**Foreign Keys:** none

**Unique Constraints:** none

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_tenants_status | (status) | btree |
| idx_tenants_deleted_at | (deleted_at) | btree |
| idx_tenants_created_at | (created_at DESC) | btree |

---

### TABLE: `users`

**Domain:** Auth / Core
**Purpose:** All human actors in the system. One user belongs to exactly one tenant (except superadmin).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| email | text | NOT NULL | — | |
| password_hash | text | NOT NULL | — | bcrypt, salt rounds ≥ 12 |
| role | text | NOT NULL | — | CHECK below |
| name | text | NOT NULL | — | Display name |
| is_active | boolean | NOT NULL | true | |
| created_at | timestamptz | NOT NULL | now() | |
| deleted_at | timestamptz | NULL | — | Soft delete |

**role CHECK:** `('owner', 'manager', 'cashier', 'worker', 'superadmin')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |

**Unique Constraints:**
| Name | Columns | Notes |
|---|---|---|
| uq_users_tenant_email | (tenant_id, email) | One email per tenant |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_users_tenant_id | (tenant_id) | btree |
| idx_users_role | (role) | btree |
| idx_users_deleted_at | (deleted_at) | btree |

---

### TABLE: `device_sessions`

**Domain:** Auth
**Purpose:** Tracks active login sessions per device. Enables per-device revocation.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | — | FK → users.id |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| device_name | text | NULL | — | e.g. "Chrome on Windows" |
| device_type | text | NOT NULL | 'web' | CHECK ('web', 'mobile') |
| ip_address | text | NULL | — | |
| user_agent | text | NULL | — | |
| last_active_at | timestamptz | NULL | — | Updated on every refresh |
| is_revoked | boolean | NOT NULL | false | |
| created_at | timestamptz | NOT NULL | now() | |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| user_id | users.id | CASCADE |
| tenant_id | tenants.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_device_sessions_user_id | (user_id) | btree |
| idx_device_sessions_user_revoked | (user_id, is_revoked) | btree |

---

### TABLE: `refresh_tokens`

**Domain:** Auth
**Purpose:** Rotating refresh tokens. Single-use. Theft detection via `is_used` replay check.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | — | FK → users.id |
| session_id | uuid | NOT NULL | — | FK → device_sessions.id |
| token_hash | text | NOT NULL | — | SHA-256 of raw token |
| expires_at | timestamptz | NOT NULL | — | 7 days from issuance |
| is_used | boolean | NOT NULL | false | True = consumed or invalidated |
| created_at | timestamptz | NOT NULL | now() | |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| user_id | users.id | CASCADE |
| session_id | device_sessions.id | CASCADE |

**Unique Constraints:**
| Name | Columns |
|---|---|
| uq_refresh_tokens_token_hash | (token_hash) |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_refresh_tokens_hash | (token_hash) | btree (covered by unique) |
| idx_refresh_tokens_session | (session_id) | btree |

---

### TABLE: `branches`

**Domain:** Org
**Purpose:** Physical or logical business locations within a tenant.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| name | text | NOT NULL | — | |
| address | text | NULL | — | |
| is_active | boolean | NOT NULL | true | |
| created_at | timestamptz | NOT NULL | now() | |
| deleted_at | timestamptz | NULL | — | Soft delete |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_branches_tenant_id | (tenant_id) | btree |
| idx_branches_tenant_active | (tenant_id, is_active) | btree |

---

### TABLE: `plans`

**Domain:** Billing
**Purpose:** Subscription plan definitions. System-level, not tenant-scoped.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| name | text | NOT NULL | — | e.g. Starter, Growth, Enterprise |
| description | text | NULL | — | ⚠️ Added — not in DATABASE.md |
| price_monthly | numeric(10,2) | NOT NULL | — | |
| price_yearly | numeric(10,2) | NOT NULL | — | |
| max_users | integer | NOT NULL | — | -1 = unlimited |
| max_branches | integer | NOT NULL | — | -1 = unlimited |
| trial_days | integer | NOT NULL | 14 | ⚠️ Added — not in DATABASE.md |
| is_active | boolean | NOT NULL | true | |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NULL | — | ⚠️ Added — not in DATABASE.md |

**Primary Key:** `id`

**Foreign Keys:** none

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_plans_is_active | (is_active) | btree |
| idx_plans_price_monthly | (price_monthly ASC) | btree |

---

### TABLE: `subscriptions`

**Domain:** Billing
**Purpose:** A tenant's active billing relationship. Tracks lifecycle from trial through cancellation.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| plan_id | uuid | NOT NULL | — | FK → plans.id |
| status | text | NOT NULL | 'trial' | CHECK below |
| billing_cycle | text | NOT NULL | 'monthly' | CHECK ('monthly', 'yearly') ⚠️ not in DATABASE.md |
| started_at | timestamptz | NOT NULL | now() | |
| trial_ends_at | timestamptz | NULL | — | ⚠️ not in DATABASE.md |
| current_period_start | timestamptz | NULL | — | ⚠️ not in DATABASE.md |
| current_period_end | timestamptz | NULL | — | ⚠️ not in DATABASE.md (DATABASE.md had `ends_at`) |
| cancelled_at | timestamptz | NULL | — | |
| suspended_at | timestamptz | NULL | — | ⚠️ not in DATABASE.md |
| grace_period_ends_at | timestamptz | NULL | — | ⚠️ not in DATABASE.md |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NULL | — | ⚠️ not in DATABASE.md |

**status CHECK:** `('trial', 'active', 'grace_period', 'past_due', 'suspended', 'cancelled', 'expired')`

**Note:** DATABASE.md had `ends_at` — this is replaced by `current_period_end` which is what the code uses throughout.

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| plan_id | plans.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_subscriptions_tenant_id | (tenant_id) | btree |
| idx_subscriptions_tenant_status | (tenant_id, status) | btree |
| idx_subscriptions_status | (status) | btree |
| idx_subscriptions_trial_ends | (trial_ends_at) | btree |
| idx_subscriptions_period_end | (current_period_end) | btree |

---

### TABLE: `billing_customers`

**Domain:** Billing
**Purpose:** Links a tenant to their payment provider customer record (e.g. Stripe Customer ID).
**Note:** Missing from DATABASE.md entirely. Discovered from code.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| provider | text | NOT NULL | — | 'mock', 'stripe', 'moyasar', 'tap' |
| provider_customer_id | text | NOT NULL | — | External ID (e.g. cus_xxxx) |
| email | text | NOT NULL | — | Billing email at time of creation |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NULL | — | |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |

**Unique Constraints:**
| Name | Columns | Notes |
|---|---|---|
| uq_billing_customers_tenant_provider | (tenant_id, provider) | One customer ID per provider per tenant |

---

### TABLE: `billing_invoices`

**Domain:** Billing
**Purpose:** Subscription billing invoices (charges to tenant for plan). Completely distinct from `orders` (POS receipts).
**Note:** Code currently uses `.from('invoices')` in billing repository but `.from('billing_invoices')` in stripe webhook. V2 canonical name is `billing_invoices`. All code must be updated accordingly.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| subscription_id | uuid | NULL | — | FK → subscriptions.id |
| invoice_number | text | NOT NULL | — | Format: INV-{prefix}-{year}-{seq} |
| currency | text | NOT NULL | 'SAR' | ISO 4217 |
| subtotal | numeric(12,2) | NOT NULL | 0 | |
| tax_amount | numeric(12,2) | NOT NULL | 0 | |
| discount_amount | numeric(12,2) | NOT NULL | 0 | |
| total_amount | numeric(12,2) | NOT NULL | 0 | |
| amount_due | numeric(12,2) | NULL | — | Used by dunning for retry |
| status | text | NOT NULL | 'draft' | CHECK below |
| period_start | timestamptz | NULL | — | Billing period covered |
| period_end | timestamptz | NULL | — | Billing period covered |
| issued_at | timestamptz | NULL | — | |
| due_at | timestamptz | NULL | — | |
| paid_at | timestamptz | NULL | — | |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NULL | — | |

**status CHECK:** `('draft', 'open', 'paid', 'void', 'overdue', 'failed')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| subscription_id | subscriptions.id | SET NULL |

**Unique Constraints:**
| Name | Columns | Notes |
|---|---|---|
| uq_billing_invoices_number_tenant | (tenant_id, invoice_number) | Per-tenant unique invoice number |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_billing_invoices_tenant | (tenant_id) | btree |
| idx_billing_invoices_tenant_status | (tenant_id, status) | btree |
| idx_billing_invoices_subscription | (subscription_id) | btree |
| idx_billing_invoices_created_at | (created_at DESC) | btree |

---

### TABLE: `billing_invoice_items`

**Domain:** Billing
**Purpose:** Line items on a billing invoice (plan name, price breakdown). Not to be confused with `order_items` (POS line items).
**Note:** Missing from DATABASE.md entirely.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| invoice_id | uuid | NOT NULL | — | FK → billing_invoices.id |
| description | text | NOT NULL | — | e.g. "Growth Plan — Monthly" |
| quantity | integer | NOT NULL | 1 | |
| unit_price | numeric(12,2) | NOT NULL | 0 | |
| amount | numeric(12,2) | NOT NULL | 0 | quantity × unit_price |
| metadata_json | jsonb | NULL | — | Arbitrary billing metadata |
| created_at | timestamptz | NOT NULL | now() | |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| invoice_id | billing_invoices.id | CASCADE |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_billing_invoice_items_invoice | (invoice_id) | btree |

---

### TABLE: `payments`

**Domain:** Billing
**Purpose:** Individual payment attempts against a billing invoice.
**Note:** DATABASE.md had a simplified version. Code uses this richer schema.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| invoice_id | uuid | NOT NULL | — | FK → billing_invoices.id |
| provider | text | NOT NULL | — | 'mock', 'stripe', 'moyasar', 'tap' |
| provider_payment_id | text | NULL | — | e.g. Stripe PaymentIntent ID |
| amount | numeric(12,2) | NOT NULL | — | |
| currency | text | NOT NULL | 'SAR' | |
| status | text | NOT NULL | 'pending' | CHECK below |
| paid_at | timestamptz | NULL | — | |
| failure_reason | text | NULL | — | Payment error message |
| metadata_json | jsonb | NULL | — | Provider-specific data |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NULL | — | |

**status CHECK:** `('pending', 'succeeded', 'failed', 'refunded')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| invoice_id | billing_invoices.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_payments_tenant_id | (tenant_id) | btree |
| idx_payments_invoice_id | (invoice_id) | btree |
| idx_payments_provider_payment_id | (provider_payment_id) | btree |
| idx_payments_status | (status) | btree |

---

### TABLE: `dunning_attempts`

**Domain:** Billing
**Purpose:** Tracks failed payment retry attempts per subscription. Drives the dunning state machine.
**Note:** Missing from DATABASE.md entirely.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| subscription_id | uuid | NOT NULL | — | FK → subscriptions.id |
| billing_invoice_id | uuid | NULL | — | FK → billing_invoices.id |
| attempt_number | integer | NOT NULL | — | 1-based counter |
| status | text | NOT NULL | 'pending' | CHECK below |
| next_retry_at | timestamptz | NULL | — | Scheduled retry time |
| attempted_at | timestamptz | NULL | — | When attempt was executed |
| error_message | text | NULL | — | Failure reason from provider |
| created_at | timestamptz | NOT NULL | now() | |

**status CHECK:** `('pending', 'failed', 'succeeded', 'exhausted')`

**Business rule:** Max 3 attempts. After exhausted + 3 days grace → tenant suspended.

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| subscription_id | subscriptions.id | RESTRICT |
| billing_invoice_id | billing_invoices.id | SET NULL |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_dunning_subscription_id | (subscription_id) | btree |
| idx_dunning_status_retry | (status, next_retry_at) | btree |
| idx_dunning_attempted_at | (attempted_at) | btree |

---

### TABLE: `features`

**Domain:** Feature Flags
**Purpose:** Global feature catalog. System-level, not tenant-scoped.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| key | text | NOT NULL | — | e.g. 'pos', 'inventory', 'shifts' |
| name | text | NOT NULL | — | Display name |
| description | text | NULL | — | |
| category | text | NOT NULL | — | CHECK below |
| is_enabled | boolean | NOT NULL | true | Global default |
| created_at | timestamptz | NOT NULL | now() | |

**category CHECK:** `('core', 'advanced', 'premium')`

**Known feature keys (from seed):** `pos`, `inventory`, `expenses`, `shifts`, `customers`, `coupons`, `appointments`, `analytics`, `multi_branch`, `reports_export`

**Primary Key:** `id`

**Unique Constraints:**
| Name | Columns |
|---|---|
| uq_features_key | (key) |

**Foreign Keys:** none

---

### TABLE: `plan_features`

**Domain:** Feature Flags
**Purpose:** Which features are included in each plan, with optional limits.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| plan_id | uuid | NOT NULL | — | FK → plans.id |
| feature_key | text | NOT NULL | — | FK → features.key |
| is_enabled | boolean | NOT NULL | — | |
| limit_value | integer | NULL | — | e.g. max_branches=3, null=no limit |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| plan_id | plans.id | CASCADE |
| feature_key | features.key | CASCADE |

**Unique Constraints:**
| Name | Columns |
|---|---|
| uq_plan_features_plan_feature | (plan_id, feature_key) |

---

### TABLE: `tenant_feature_overrides`

**Domain:** Feature Flags
**Purpose:** Per-tenant overrides of plan defaults. Set by superadmin only.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| feature_key | text | NOT NULL | — | FK → features.key |
| is_enabled | boolean | NULL | — | NULL = inherit from plan |
| limit_value | integer | NULL | — | NULL = inherit from plan |
| overridden_by | uuid | NOT NULL | — | FK → users.id (superadmin) |
| overridden_at | timestamptz | NOT NULL | now() | |
| note | text | NULL | — | Reason for override |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | CASCADE |
| feature_key | features.key | CASCADE |
| overridden_by | users.id | RESTRICT |

**Unique Constraints:**
| Name | Columns |
|---|---|
| uq_tenant_feature_overrides_key | (tenant_id, feature_key) |

---

### TABLE: `permissions`

**Domain:** RBAC
**Purpose:** Catalog of all permission keys in the system. Seeded, not runtime-created.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| key | text | NOT NULL | — | e.g. 'invoice.create.own' |
| resource | text | NOT NULL | — | e.g. 'invoice' |
| action | text | NOT NULL | — | e.g. 'create' |
| scope | text | NOT NULL | — | 'own', 'branch', 'all' |
| description | text | NULL | — | |

**Primary Key:** `id`

**Unique Constraints:**
| Name | Columns |
|---|---|
| uq_permissions_key | (key) |

**Foreign Keys:** none

---

### TABLE: `role_permissions`

**Domain:** RBAC
**Purpose:** Maps roles to their granted permissions. Seeded, not runtime-created.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| role | text | NOT NULL | — | CHECK ('owner','manager','cashier','worker','superadmin') |
| permission_key | text | NOT NULL | — | FK → permissions.key |
| is_granted | boolean | NOT NULL | — | Always true in current seed |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| permission_key | permissions.key | CASCADE |

**Unique Constraints:**
| Name | Columns |
|---|---|
| uq_role_permissions_role_key | (role, permission_key) |

---

### TABLE: `items`

**Domain:** POS
**Purpose:** Products and services offered by a tenant.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| category_id | uuid | NULL | — | FK → categories.id |
| name | text | NOT NULL | — | |
| type | text | NOT NULL | — | CHECK below |
| operation_type | text | NOT NULL | — | CHECK below |
| price | numeric(10,2) | NOT NULL | 0 | Base price |
| has_inventory | boolean | NOT NULL | false | |
| has_variants | boolean | NOT NULL | false | |
| is_active | boolean | NOT NULL | true | |
| created_at | timestamptz | NOT NULL | now() | |
| deleted_at | timestamptz | NULL | — | Soft delete |

**type CHECK:** `('product', 'service', 'custom')`
**operation_type CHECK:** `('sell', 'book', 'repair', 'rent')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| category_id | categories.id | SET NULL |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_items_tenant_id | (tenant_id) | btree |
| idx_items_tenant_active | (tenant_id, is_active) | btree |

---

### TABLE: `item_variants`

**Domain:** POS
**Purpose:** Size/color/option variants of an item. Inherit item's base price plus adjustment.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| item_id | uuid | NOT NULL | — | FK → items.id |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| name | text | NOT NULL | — | e.g. 'Large', 'Red' |
| price_adjustment | numeric(10,2) | NOT NULL | 0 | Added to item base price |
| sku | text | NULL | — | Stock keeping unit |
| stock_quantity | integer | NOT NULL | 0 | |
| is_active | boolean | NOT NULL | true | |
| deleted_at | timestamptz | NULL | — | Soft delete. ⚠️ Add — missing from DATABASE.md. Code only uses is_active=false today (inconsistency). |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| item_id | items.id | CASCADE |
| tenant_id | tenants.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_item_variants_item_id | (item_id) | btree |
| idx_item_variants_tenant_active | (tenant_id, is_active) | btree |

---

### TABLE: `categories`

**Domain:** POS
**Purpose:** Item / expense classification. Tenant-scoped.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| name | text | NOT NULL | — | |
| type | text | NOT NULL | — | CHECK below |
| is_active | boolean | NOT NULL | true | |
| created_at | timestamptz | NOT NULL | now() | |
| deleted_at | timestamptz | NULL | — | ⚠️ Add — ScopedRepository filters on deleted_at but column not in DATABASE.md |

**type CHECK:** `('product', 'service', 'expense')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_categories_tenant_type | (tenant_id, type) | btree |

---

### TABLE: `orders`

**Domain:** POS
**Purpose:** POS transaction records. This is the business "invoice" (receipt at point-of-sale). NOT to be confused with `billing_invoices` (subscription charges).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| branch_id | uuid | NOT NULL | — | FK → branches.id |
| cashier_id | uuid | NOT NULL | — | FK → users.id |
| customer_id | uuid | NULL | — | FK → customers.id |
| shift_id | uuid | NOT NULL | — | FK → shifts.id. Added via migration C0. |
| status | text | NOT NULL | 'pending' | CHECK below |
| subtotal | numeric(10,2) | NOT NULL | 0 | |
| discount | numeric(10,2) | NOT NULL | 0 | ⚠️ See CONFLICT C-02 |
| tax | numeric(10,2) | NOT NULL | 0 | ⚠️ See CONFLICT C-03 |
| total | numeric(10,2) | NOT NULL | 0 | |
| payment_method | text | NULL | — | CHECK below |
| notes | text | NULL | — | |
| created_at | timestamptz | NOT NULL | now() | |
| cancelled_at | timestamptz | NULL | — | Set when status='cancelled' |
| cancelled_by | uuid | NULL | — | FK → users.id |

**status CHECK:** `('pending', 'completed', 'cancelled')`
**payment_method CHECK:** `('cash', 'card', 'split')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| branch_id | branches.id | RESTRICT |
| cashier_id | users.id | RESTRICT |
| customer_id | customers.id | SET NULL |
| shift_id | shifts.id | RESTRICT |
| cancelled_by | users.id | SET NULL |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_orders_tenant_id | (tenant_id) | btree |
| idx_orders_tenant_status | (tenant_id, status) | btree |
| idx_orders_tenant_created | (tenant_id, created_at DESC) | btree |
| idx_orders_branch_id | (branch_id) | btree |
| idx_orders_shift_id | (shift_id) | btree |
| idx_orders_customer_id | (customer_id) | btree |

---

### TABLE: `order_items`

**Domain:** POS
**Purpose:** Line items within a POS order. Uses snapshot pricing — item name and price are copied at sale time.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| order_id | uuid | NOT NULL | — | FK → orders.id |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| item_id | uuid | NULL | — | FK → items.id. Nullable for soft-deleted items. |
| item_name | text | NOT NULL | — | Snapshot of item name at sale time |
| variant_id | uuid | NULL | — | FK → item_variants.id |
| variant_name | text | NULL | — | Snapshot if variant selected |
| quantity | integer | NOT NULL | 1 | ⚠️ See CONFLICT C-04 |
| unit_price | numeric(10,2) | NOT NULL | 0 | ⚠️ See CONFLICT C-05. Snapshot of price. |
| total_price | numeric(10,2) | NOT NULL | 0 | quantity × unit_price |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| order_id | orders.id | CASCADE |
| tenant_id | tenants.id | RESTRICT |
| item_id | items.id | SET NULL |
| variant_id | item_variants.id | SET NULL |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_order_items_order_id | (order_id) | btree |
| idx_order_items_tenant_id | (tenant_id) | btree |

---

### TABLE: `customers`

**Domain:** POS
**Purpose:** Customer records for loyalty and order history.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| full_name | text | NOT NULL | — | ⚠️ See CONFLICT C-01 |
| phone | text | NULL | — | |
| email | text | NULL | — | |
| loyalty_points | integer | NOT NULL | 0 | |
| is_active | boolean | NOT NULL | true | ⚠️ Add — used in code, missing from DATABASE.md |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NULL | — | ⚠️ Add — used in code (update sets updated_at) |
| deleted_at | timestamptz | NULL | — | Soft delete |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_customers_tenant_id | (tenant_id) | btree |
| idx_customers_tenant_phone | (tenant_id, phone) | btree |
| idx_customers_deleted_at | (deleted_at) | btree |

---

### TABLE: `shifts`

**Domain:** Workforce / POS
**Purpose:** Cashier work shifts. All orders must be linked to an open shift. Controls cash reconciliation.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| branch_id | uuid | NOT NULL | — | FK → branches.id |
| cashier_id | uuid | NOT NULL | — | FK → users.id |
| status | text | NOT NULL | 'open' | CHECK ('open', 'closed') |
| opening_cash | numeric(10,2) | NOT NULL | 0 | Cash in drawer at open |
| closing_cash | numeric(10,2) | NULL | — | Cash counted at close |
| expected_cash | numeric(10,2) | NULL | — | Calculated at close |
| discrepancy | numeric(10,2) | NULL | — | closing_cash − expected_cash |
| notes | text | NULL | — | ⚠️ Add — used in code (shift open/close notes). Not in DATABASE.md. |
| opened_at | timestamptz | NOT NULL | now() | |
| closed_at | timestamptz | NULL | — | |
| deleted_at | timestamptz | NULL | — | ⚠️ Add — ScopedRepository filters on this. Not in DATABASE.md. |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| branch_id | branches.id | RESTRICT |
| cashier_id | users.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_shifts_tenant_branch | (tenant_id, branch_id) | btree |
| idx_shifts_tenant_status | (tenant_id, status) | btree |
| idx_shifts_opened_at | (opened_at DESC) | btree |
| idx_shifts_cashier_id | (cashier_id) | btree |

---

### TABLE: `expenses`

**Domain:** Workforce
**Purpose:** Employee expense requests requiring manager approval.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| branch_id | uuid | NOT NULL | — | FK → branches.id |
| shift_id | uuid | NULL | — | FK → shifts.id. ⚠️ Add — code queries this but column missing from DATABASE.md |
| template_id | uuid | NULL | — | FK → expense_templates.id |
| requested_by | uuid | NOT NULL | — | FK → users.id |
| approved_by | uuid | NULL | — | FK → users.id |
| amount | numeric(10,2) | NOT NULL | 0 | |
| notes | text | NULL | — | ⚠️ See CONFLICT C-06. Standardized to `notes`. |
| photo_url | text | NULL | — | |
| status | text | NOT NULL | 'pending' | CHECK below |
| expires_at | timestamptz | NOT NULL | — | Set from template.expiry_hours |
| created_at | timestamptz | NOT NULL | now() | |
| resolved_at | timestamptz | NULL | — | Approval/rejection timestamp |
| deleted_at | timestamptz | NULL | — | Soft delete |

**status CHECK:** `('pending', 'approved', 'rejected', 'expired')`

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |
| branch_id | branches.id | RESTRICT |
| shift_id | shifts.id | SET NULL |
| template_id | expense_templates.id | SET NULL |
| requested_by | users.id | RESTRICT |
| approved_by | users.id | SET NULL |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_expenses_tenant_id | (tenant_id) | btree |
| idx_expenses_tenant_status | (tenant_id, status) | btree |
| idx_expenses_tenant_created | (tenant_id, created_at DESC) | btree |
| idx_expenses_expires_at | (expires_at) WHERE status = 'pending' | partial btree |

---

### TABLE: `expense_templates`

**Domain:** Workforce
**Purpose:** Reusable expense request templates. Control expiry time and photo requirements.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NOT NULL | — | FK → tenants.id |
| name | text | NOT NULL | — | |
| default_amount | numeric(10,2) | NULL | — | Pre-fill if set |
| requires_photo | boolean | NOT NULL | false | |
| expiry_hours | integer | NOT NULL | — | Hours until pending expense auto-expires |
| is_active | boolean | NOT NULL | true | |
| created_at | timestamptz | NOT NULL | now() | |
| deleted_at | timestamptz | NULL | — | Soft delete |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| tenant_id | tenants.id | RESTRICT |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_expense_templates_tenant | (tenant_id) | btree |

---

### TABLE: `audit_logs`

**Domain:** Platform
**Purpose:** Immutable audit trail of all sensitive mutations. Written by AuditService. Hard-deleted after retention period.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NULL | — | NULL = superadmin system action. No FK (intentional — allows cross-tenant audit) |
| actor_id | uuid | NOT NULL | — | FK → users.id |
| actor_role | text | NOT NULL | — | Denormalized role at time of action |
| action | text | NOT NULL | — | e.g. 'auth.login', 'invoice.cancel' |
| resource_type | text | NOT NULL | — | e.g. 'auth', 'invoice', 'shift' |
| resource_id | text | NULL | — | ID of affected resource |
| before_data | jsonb | NULL | — | State before mutation |
| after_data | jsonb | NULL | — | State after mutation |
| ip_address | text | NULL | — | |
| device | text | NULL | — | User agent |
| created_at | timestamptz | NOT NULL | now() | Indexed for cleanup |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| actor_id | users.id | RESTRICT |

**Note:** `tenant_id` is intentionally not a FK. Superadmin logs have null `tenant_id`. Keeping as plain column allows full-system audit.

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_audit_logs_tenant_id | (tenant_id) | btree |
| idx_audit_logs_actor_id | (actor_id) | btree |
| idx_audit_logs_action | (action) | btree |
| idx_audit_logs_created_at | (created_at DESC) | btree |
| idx_audit_logs_tenant_created | (tenant_id, created_at DESC) | btree |

---

### TABLE: `notifications`

**Domain:** Platform
**Purpose:** In-app notification records. Email notifications are sent via Resend and not stored.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tenant_id | uuid | NULL | — | NULL = system notification |
| user_id | uuid | NOT NULL | — | FK → users.id |
| type | text | NOT NULL | — | e.g. 'expense_approved' |
| title | text | NOT NULL | — | ⚠️ See CONFLICT C-07. Code uses `title`, not `subject`. |
| body | text | NOT NULL | — | |
| data | jsonb | NULL | — | ⚠️ See CONFLICT C-08. Code uses `data`, not `metadata`. |
| channel | text | NOT NULL | — | CHECK ('in_app', 'email') |
| is_read | boolean | NOT NULL | false | ⚠️ Add — used in code. Not in DATABASE.md. |
| read_at | timestamptz | NULL | — | |
| created_at | timestamptz | NOT NULL | now() | |

**Primary Key:** `id`

**Foreign Keys:**
| Column | References | On Delete |
|---|---|---|
| user_id | users.id | CASCADE |

**Indexes:**
| Name | Columns | Type |
|---|---|---|
| idx_notifications_user_tenant | (user_id, tenant_id) | btree |
| idx_notifications_user_unread | (user_id, tenant_id, is_read) WHERE is_read = false | partial btree |
| idx_notifications_created_at | (created_at DESC) | btree |

---

## CONFLICTS

All conflicts between DATABASE.md and code are resolved here.
Each resolution is the binding decision for SQL_DDL_V2.sql.

---

### CONFLICT C-01 — `customers` column name: `name` vs `full_name`

| Source | Value |
|---|---|
| DATABASE.md | `name` |
| Code (all files consistently) | `full_name` |

**Decision: `full_name`**

**Reason:** Code is the authoritative source. Every query across `customers.repository.ts`, DTOs, and API responses consistently uses `full_name`. DATABASE.md documents `name` — a discrepancy that indicates DATABASE.md was written independently of the actual implementation. Fresh DB uses `full_name`.

**Code action required:** None — code already uses `full_name`.
**DB action required:** None — fresh DB creates this column as `full_name`.

---

### CONFLICT C-02 — `orders` column name: `discount_amount` vs `discount`

| Source | Value |
|---|---|
| DATABASE.md | `discount_amount` |
| Code (all files: reports, invoices repo, analytics) | `discount` |

**Decision: `discount`**

**Reason:** Code is consistent across all files. Multiple independent files (`reports.service.ts`, `invoices.repository.ts`, `platform-analytics.repository.ts`) use `discount`. DATABASE.md uses the longer form. Fresh DB uses `discount`.

**Code action required:** None.
**DB action required:** None — fresh DB creates this column as `discount`.

---

### CONFLICT C-03 — `orders` column name: `tax_amount` vs `tax`

| Source | Value |
|---|---|
| DATABASE.md | `tax_amount` |
| Code (all files: reports, invoices repo) | `tax` |

**Decision: `tax`**

**Reason:** Same as C-02. Code is consistent across all read and write paths. DATABASE.md is the outlier. Fresh DB uses `tax`.

**Code action required:** None.
**DB action required:** None — fresh DB creates this column as `tax`.

---

### CONFLICT C-04 — `order_items` column name: `quantity` vs `qty`

| Source | Value |
|---|---|
| DATABASE.md | `quantity` |
| Code (insert in invoices.repository.ts) | `qty` |

**Decision: `quantity`**

**Reason:** This is a **code bug**, not a schema decision. DATABASE.md uses `quantity` — the standard full-word form. The code insert in `invoices.repository.ts` `insertItems()` maps `qty: item.quantity` which is wrong. All evidence (DATABASE.md, snapshot pattern, `billing_invoice_items.quantity` naming) points to `quantity`. The schema is correct; the code must be fixed.

**Code action required:** Fix `modules/invoices/repositories/invoices.repository.ts` `insertItems()` — change `qty:` → `quantity:`.
**DB action required:** None — fresh DB creates this column as `quantity`.

---

### CONFLICT C-05 — `order_items` column name: `unit_price` vs `price`

| Source | Value |
|---|---|
| DATABASE.md | `unit_price` |
| Code (insert in invoices.repository.ts) | `price` |

**Decision: `unit_price`**

**Reason:** Same as C-04. Code bug. `unit_price` is the correct, unambiguous name — consistent with `total_price` in the same table, `billing_invoice_items.unit_price`, and DATABASE.md. Schema is correct; the code must be fixed.

**Code action required:** Fix `modules/invoices/repositories/invoices.repository.ts` `insertItems()` — change `price:` → `unit_price:`.
**DB action required:** None — fresh DB creates this column as `unit_price`.

---

### CONFLICT C-06 — `expenses` column name: `note` vs `notes`

| Source | Value |
|---|---|
| DATABASE.md | `note` |
| Code — insert (expense.engine) | `note` |
| Code — select/update (reports, expenses.service reject) | `notes` |

**Decision: `notes`**

**Reason:** The code is inconsistent with itself — inserts use `note` but selects and updates use `notes`. `notes` (plural) is consistent with `shifts.notes` and `orders.notes` in this codebase. Fresh DB uses `notes`. The insert path in `expense.engine.ts` is the bug.

**Code action required:** Fix `engines/expense-engine/expense.engine.ts` — change `note:` → `notes:` in `buildExpenseRequest()` output.
**DB action required:** None — fresh DB creates this column as `notes`.

---

### CONFLICT C-07 — `notifications` column name: `subject` vs `title`

| Source | Value |
|---|---|
| DATABASE.md | `subject` |
| Code (insert + read consistently) | `title` |

**Decision: `title`**

**Reason:** Code is the authoritative source. Every insert and read in `inapp.channel.ts` and `notifications.repository.ts` uses `title`. DATABASE.md's `subject` reflects email terminology, not the in-app storage model. Fresh DB uses `title`.

**Code action required:** None — code already uses `title`.
**DB action required:** None — fresh DB creates this column as `title`.

---

### CONFLICT C-08 — `notifications` column name: `metadata` vs `data`

| Source | Value |
|---|---|
| DATABASE.md | `metadata (jsonb)` |
| Code (insert consistently) | `data` |

**Decision: `data`**

**Reason:** Code is the authoritative source. `data` is a cleaner, more idiomatic name for arbitrary notification payload. Fresh DB uses `data`.

**Code action required:** None.
**DB action required:** None — fresh DB creates this column as `data`.

---

### CONFLICT C-09 — `notifications` missing `is_read` column

| Source | Value |
|---|---|
| DATABASE.md | Has `read_at` but NOT `is_read` |
| Code (select, update, count) | Uses `is_read` boolean throughout |

**Decision: ADD `is_read boolean NOT NULL DEFAULT false`**

**Reason:** `is_read` is essential for the unread count query (called on every page load by `notifications.repository.ts`). `read_at` alone requires `WHERE read_at IS NULL` which is slower than an indexed boolean. Keep both: `is_read` for fast boolean checks, `read_at` for timestamp tracking.

**Code action required:** None — code already uses `is_read`.
**DB action required:** None — fresh DB includes this column from the start.

---

### CONFLICT C-10 — `subscriptions.status` enum: partial vs full

| DATABASE.md values | Code values (billing.types.ts) |
|---|---|
| active | active |
| cancelled | cancelled |
| expired | expired |
| trial | trial |
| ❌ missing | grace_period |
| ❌ missing | suspended |
| ❌ missing | past_due |

**Decision: Full code enum — `trial, active, grace_period, past_due, suspended, cancelled, expired`**

**Reason:** `grace_period` and `suspended` are critical states in the dunning state machine (`billing.service.ts` CRON). `past_due` triggers the dunning process in `dunning.service.ts`. DATABASE.md was written before the billing engine was implemented. Fresh DB uses the complete enum from day one.

**Code action required:** None.
**DB action required:** None — fresh DB CHECK constraint includes all 7 values.

---

### CONFLICT C-11 — `subscriptions` missing columns

| Column | DATABASE.md | Code |
|---|---|---|
| billing_cycle | ❌ missing | ✅ used (insert + read) |
| trial_ends_at | ❌ missing | ✅ used (read + update) |
| current_period_start | ❌ missing | ✅ used (insert + update) |
| current_period_end | ❌ missing | ✅ used (insert + update + cron check) |
| updated_at | ❌ missing | ✅ used (update operations) |
| suspended_at | ❌ missing | ✅ used (CRON marks suspended state) |
| grace_period_ends_at | ❌ missing | ✅ used (isSubscriptionActive check) |
| ends_at | ✅ in DATABASE.md | ❌ not used in code |

**Decision:** Include all 7 columns from code. Exclude `ends_at` (DATABASE.md only, never used in code — replaced by `current_period_end`).

**Reason:** Every column from code is actively read or written by `billing.service.ts` or `dunning.service.ts`. `ends_at` in DATABASE.md was an early draft name for what became `current_period_end` in the implementation. Fresh DB uses the fully implemented schema.

---

### CONFLICT C-12 — Billing invoice table naming: `invoices` vs `billing_invoices`

| Location | Table name used |
|---|---|
| `core/billing/repositories/invoices.repository.ts` | `.from('invoices')` |
| `stripe-webhook.controller.ts` | `.from('billing_invoices')` |
| DATABASE.md | Not documented at all |

**Decision: `billing_invoices`**

**Reason:** The name `invoices` conflicts with the business term "invoice" which POS users see for receipts (stored in `orders`). `billing_invoices` makes the separation unambiguous. The stripe webhook already uses `billing_invoices` — the billing repository file used `invoices` only because it pre-dated the naming decision. Fresh DB uses `billing_invoices` from the start.

**Code action required:** Update `core/billing/repositories/invoices.repository.ts` — change all `.from('invoices')` → `.from('billing_invoices')`. Update `dunning.service.ts` similarly.
**DB action required:** None — fresh DB creates this table as `billing_invoices`.

---

### CONFLICT C-13 — `billing_invoice_items` table naming: `invoice_items`

| Location | Table name used |
|---|---|
| `core/billing/repositories/invoices.repository.ts` | `.from('invoice_items')` |
| DATABASE.md | Not documented at all |

**Decision: `billing_invoice_items`**

**Reason:** `invoice_items` is ambiguous alongside `order_items`. `billing_invoice_items` is explicit and consistent with its parent table `billing_invoices`. Fresh DB uses this name from the start.

**Code action required:** Update `.from('invoice_items')` → `.from('billing_invoice_items')` in `core/billing/repositories/invoices.repository.ts`.
**DB action required:** None — fresh DB creates this table as `billing_invoice_items`.

---

## VIEWS: NONE

No database views are specified for V2. All data aggregation occurs in application code.

---

## DATABASE FUNCTIONS

| Function | Decision | Reason |
|---|---|---|
| `process_recurring_expenses()` | ✅ NOT INCLUDED | Expense expiry is handled entirely by the NestJS scheduler (`expenses.scheduler.ts`) via `expireStaleExpenses()`. No code in the entire codebase calls `.rpc('process_recurring_expenses')`. This was a legacy DB-level function from the old project. Fresh DB does not include it. |

**No database-level functions, triggers, or stored procedures are required for V2.**
All business logic runs in application code (NestJS services and schedulers).

---

## ENUMS SUMMARY

| Enum | Table.Column | Values |
|---|---|---|
| tenant_status | tenants.status | active, trial, suspended, cancelled |
| user_role | users.role / role_permissions.role | owner, manager, cashier, worker, superadmin |
| device_type | device_sessions.device_type | web, mobile |
| subscription_status | subscriptions.status | trial, active, grace_period, past_due, suspended, cancelled, expired |
| billing_cycle | subscriptions.billing_cycle | monthly, yearly |
| billing_invoice_status | billing_invoices.status | draft, open, paid, void, overdue, failed |
| payment_status | payments.status | pending, succeeded, failed, refunded |
| dunning_status | dunning_attempts.status | pending, failed, succeeded, exhausted |
| item_type | items.type | product, service, custom |
| item_operation_type | items.operation_type | sell, book, repair, rent |
| order_status | orders.status | pending, completed, cancelled |
| expense_status | expenses.status | pending, approved, rejected, expired |
| category_type | categories.type | product, service, expense |
| feature_category | features.category | core, advanced, premium |
| payment_method | orders.payment_method | cash, card, split |

**Total ENUMs: 15**

**Implementation note:** All enums are implemented as `text` columns with `CHECK` constraints, not PostgreSQL `ENUM` types. Reason: text + CHECK is easier to ALTER in future (add values without table rewrite), compatible with all Supabase/PostgREST tooling, and avoids `ALTER TYPE` complexity.

---

## SOFT DELETE CONTRACT

**Standard:** All tenant business data uses `deleted_at timestamptz NULL`.
`deleted_at IS NULL` = active. `deleted_at IS NOT NULL` = soft-deleted.

| Table | Has `deleted_at` | Notes |
|---|---|---|
| tenants | ✅ | Also sets status='cancelled' |
| users | ✅ | Also sets is_active=false |
| branches | ✅ | Also sets is_active=false |
| items | ✅ | Also sets is_active=false |
| item_variants | ✅ | Added in V2 (was is_active only) |
| categories | ✅ | Added in V2 (ScopedRepo needs it) |
| orders | ❌ | Cancelled via status field — no soft delete |
| order_items | ❌ | Cascades from orders |
| customers | ✅ | |
| shifts | ✅ | Added in V2 |
| expenses | ✅ | |
| expense_templates | ✅ | |
| audit_logs | ❌ | Hard delete by retention job |
| notifications | ❌ | Read/unread state, no delete |
| billing tables | ❌ | Immutable financial records |
| auth tables | ❌ | Revocation via is_revoked/is_used |

---

## TENANT ISOLATION CONTRACT

Every table in the POS / Workforce domain has `tenant_id NOT NULL`.
The `ScopedRepository` base class automatically appends `.eq('tenant_id', tenantId)` and `.is('deleted_at', null)` to all queries.

**Exceptions (no tenant_id):**
- `plans` — system-level, shared
- `features` — system-level, shared
- `permissions` — system-level, shared
- `role_permissions` — system-level, shared
- `audit_logs` — tenant_id is nullable (superadmin logs)
- `notifications` — tenant_id is nullable (system notifications)

---

## CODE FIXES REQUIRED (must be applied before connecting code to fresh DB)

These are application code bugs discovered during schema analysis. The schema is correct.
The code must be updated to match the schema before the API can run against the new DB.

| # | File | Current (wrong) | Fixed (correct) | Conflict |
|---|---|---|---|---|
| F-01 | `api/src/core/billing/repositories/invoices.repository.ts` | `.from('invoices')` | `.from('billing_invoices')` | C-12 |
| F-02 | `api/src/core/billing/dunning/dunning.service.ts` | `.from('invoices')` | `.from('billing_invoices')` | C-12 |
| F-03 | `api/src/core/billing/repositories/invoices.repository.ts` | `.from('invoice_items')` | `.from('billing_invoice_items')` | C-13 |
| F-04 | `api/src/modules/invoices/repositories/invoices.repository.ts` | `qty: item.quantity` | `quantity: item.quantity` | C-04 |
| F-05 | `api/src/modules/invoices/repositories/invoices.repository.ts` | `price: item.unit_price` | `unit_price: item.unit_price` | C-05 |
| F-06 | `api/src/engines/expense-engine/expense.engine.ts` | `note: ...` | `notes: ...` | C-06 |

**Note:** `stripe-webhook.controller.ts` already uses `.from('billing_invoices')` — no change needed there.

---

## STATUS

---

### ✅ READY FOR DDL

**All schema decisions are final. The fresh Supabase DB has no legacy constraints.**

---

### Blocker Resolution Summary

| Blocker | Original Concern | Resolution |
|---|---|---|
| B-01 | Production column names unverifiable | **DROPPED** — fresh DB. No existing schema to verify against. Decisions made from code + DATABASE.md analysis. |
| B-02 | `process_recurring_expenses()` function status | **RESOLVED** — Not applicable. Fresh DB contains no legacy functions. Expense expiry is handled 100% in application code (`expenses.scheduler.ts`). No DB function will be created. |
| B-03 | `business_config` table purpose unknown | **RESOLVED** — Not applicable. Fresh DB excludes `business_config`. Zero code references confirm it has no role in V2. |

---

### What This Spec Authorises

The following are confirmed and ready to be expressed as SQL DDL:

- **28 tables** with full column specs, types, nullability, defaults
- **13 conflicts** resolved with explicit decisions and reasons
- **15 enum domains** implemented as `text + CHECK` constraints
- **6 code bugs** identified (F-01 through F-06) — schema is correct, code must be fixed
- **0 database functions** — all logic in application layer
- **0 views** — all aggregation in application code
- **0 triggers** — application enforces all business rules

---

### Prerequisites Before Running DDL

The DDL file can be generated and executed now. Before connecting the API, apply the 6 code fixes:

| Fix | File | Change |
|---|---|---|
| F-01 | `core/billing/repositories/invoices.repository.ts` | `'invoices'` → `'billing_invoices'` |
| F-02 | `core/billing/dunning/dunning.service.ts` | `'invoices'` → `'billing_invoices'` |
| F-03 | `core/billing/repositories/invoices.repository.ts` | `'invoice_items'` → `'billing_invoice_items'` |
| F-04 | `modules/invoices/repositories/invoices.repository.ts` | `qty:` → `quantity:` |
| F-05 | `modules/invoices/repositories/invoices.repository.ts` | `price:` → `unit_price:` |
| F-06 | `engines/expense-engine/expense.engine.ts` | `note:` → `notes:` |

---

### Next Step

→ **Generate `SQL_DDL_V2.sql`** using this spec as the sole source of truth.
