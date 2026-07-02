# SCHEMA_GAPS.md
# Sefay V2 — Schema Drift & Gap Analysis
# Generated: 2026-06-05 | DATABASE.md vs Actual Code

---

## GAP CATEGORIES

| Category | Count |
|---|---|
| Tables in code but NOT in DATABASE.md | 5 |
| Tables in DATABASE.md but NOT in code | 1 |
| Column name conflicts (code vs docs) | 8 |
| Undocumented columns used in code | 14 |
| Status enum drift | 3 |
| Missing foreign keys in docs | 6 |
| Naming bugs in code | 2 |

---

## 1. TABLES NOT IN DATABASE.MD (but used in code)

### `billing_customers`
- **Where used:** `billing-customers.repository.ts`, `dunning.service.ts`
- **Actual columns:** `id`, `tenant_id`, `provider`, `provider_customer_id`, `email`, `created_at`, `updated_at`
- **Impact:** Without this table, billing cannot attach Stripe customer IDs to tenants
- **Action:** ADD to DATABASE.md, ADD to V2 schema

### `invoices` (billing invoices)
- **Where used:** `core/billing/repositories/invoices.repository.ts`, `dunning.service.ts`
- **Actual columns:** `id`, `tenant_id`, `subscription_id`, `invoice_number`, `currency`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `status`, `period_start`, `period_end`, `issued_at`, `due_at`, `paid_at`, `created_at`, `updated_at`
- **Confusion:** Exists alongside `orders` table — the business "invoice" (receipt) is `orders`, the billing "invoice" (subscription charge) is this table
- **Action:** ADD as `billing_invoices` to DATABASE.md (rename to avoid `orders`/`invoices` confusion)

### `invoice_items` (billing line items)
- **Where used:** `core/billing/repositories/invoices.repository.ts`
- **Actual columns:** `id`, `invoice_id`, `description`, `quantity`, `unit_price`, `amount`, `metadata_json`, `created_at`
- **Note:** Completely different from `order_items` — these are subscription plan line items
- **Action:** ADD as `billing_invoice_items` to DATABASE.md

### `dunning_attempts`
- **Where used:** `dunning.service.ts`
- **Actual columns:** `id`, `tenant_id`, `subscription_id`, `attempt_number`, `status`, `next_retry_at`, `attempted_at`, `error_message`, `billing_invoice_id`
- **Status values:** `pending | failed | succeeded | exhausted`
- **Action:** ADD to DATABASE.md

### `billing_invoices` (stripe webhook reference)
- **Where used:** `stripe-webhook.controller.ts` ONLY
- **Assessment:** This appears to be a BUG — the webhook uses `.from('billing_invoices')` while all other billing code uses `.from('invoices')`
- **Action:** FIX the webhook code to use `invoices` table name (or rename `invoices` → `billing_invoices` consistently)

---

## 2. TABLES IN DATABASE.MD BUT NOT IN CODE

### `coupons`
- **Status:** Documented in DATABASE.md — zero usage in all TypeScript files
- **Assessment:** Either never implemented or removed from code
- **Action:** DEAD TABLE — archive or remove from V2 schema (preserve data if needed)

---

## 3. CRITICAL COLUMN NAME CONFLICTS

### 3.1 `customers.name` vs `customers.full_name`
| Source | Column Name |
|---|---|
| DATABASE.md | `name` |
| Code (all queries) | `full_name` |

**Assessment:** Code is consistent in using `full_name` across all files. DATABASE.md is wrong.
**Resolution:** Rename to `full_name` in V2 schema. Also add `updated_at` and `is_active`.

---

### 3.2 `orders.discount_amount` vs `orders.discount`
| Source | Column Name |
|---|---|
| DATABASE.md | `discount_amount` |
| Code (all queries) | `discount` |

**Assessment:** Code is consistent. DATABASE.md is wrong.
**Resolution:** Use `discount` in V2 schema.

---

### 3.3 `orders.tax_amount` vs `orders.tax`
| Source | Column Name |
|---|---|
| DATABASE.md | `tax_amount` |
| Code (all queries) | `tax` |

**Assessment:** Code is consistent. DATABASE.md is wrong.
**Resolution:** Use `tax` in V2 schema.

---

### 3.4 `order_items.quantity` vs `order_items.qty`
| Source | Column Name |
|---|---|
| DATABASE.md | `quantity` |
| Code (insert) | `qty` |

**Assessment:** CODE IS INCONSISTENT with DATABASE.md. The Supabase table likely has `quantity` as the actual column (since DATABASE.md was written from Supabase schema). Code is probably buggy here.
**Resolution:** Keep `quantity` (DATABASE.md is correct). Fix code in `invoices.repository.ts`.

---

### 3.5 `order_items.unit_price` vs `order_items.price`
| Source | Column Name |
|---|---|
| DATABASE.md | `unit_price` |
| Code (insert) | `price` |

**Assessment:** Same as above — code likely has a bug.
**Resolution:** Keep `unit_price` (DATABASE.md is correct). Fix code in `invoices.repository.ts`.

---

### 3.6 `notifications.subject` vs `notifications.title`
| Source | Column Name |
|---|---|
| DATABASE.md | `subject` |
| Code (insert + read) | `title` |

**Assessment:** Code is consistent in using `title`. DATABASE.md is outdated.
**Resolution:** Use `title` in V2 schema. Also rename `metadata` → `data` and add `is_read`.

---

### 3.7 `notifications.metadata` vs `notifications.data`
| Source | Column Name |
|---|---|
| DATABASE.md | `metadata (jsonb)` |
| Code (insert) | `data` |

**Resolution:** Use `data` in V2 schema (consistent with code).

---

### 3.8 `expenses.note` vs `expenses.notes`
| Source | Column Name |
|---|---|
| DATABASE.md | `note` |
| Code (insert) | `note` |
| Code (select/update) | `notes` |

**Assessment:** CODE IS INCONSISTENT WITH ITSELF — inserts use `note`, selects use `notes`. This is a bug.
**Resolution:** Standardize to `notes` (plural) for consistency with shifts and other tables. Fix insert in `expense.engine`.

---

## 4. UNDOCUMENTED COLUMNS (used in code, missing from DATABASE.md)

| Table | Column | Type | Used For |
|---|---|---|---|
| `customers` | `full_name` | text | Replaces `name` |
| `customers` | `is_active` | boolean | Status flag |
| `customers` | `updated_at` | timestamptz | Change tracking |
| `shifts` | `notes` | text | Open/close notes |
| `shifts` | `deleted_at` | timestamptz | Soft delete |
| `subscriptions` | `billing_cycle` | enum(monthly/yearly) | Billing frequency |
| `subscriptions` | `trial_ends_at` | timestamptz | Trial expiry |
| `subscriptions` | `current_period_start` | timestamptz | Active period start |
| `subscriptions` | `current_period_end` | timestamptz | Active period end |
| `subscriptions` | `updated_at` | timestamptz | Change tracking |
| `subscriptions` | `suspended_at` | timestamptz | Suspension timestamp |
| `subscriptions` | `grace_period_ends_at` | timestamptz | Grace period end |
| `plans` | `trial_days` | integer | Default trial duration |
| `plans` | `description` | text | Plan description |
| `plans` | `updated_at` | timestamptz | Change tracking |

---

## 5. STATUS ENUM DRIFT

### `subscriptions.status`
| DATABASE.md | Code (billing.types.ts) |
|---|---|
| `active` | `active` ✅ |
| `cancelled` | `cancelled` ✅ |
| `expired` | `expired` ✅ |
| `trial` | `trial` ✅ |
| ❌ missing | `grace_period` |
| ❌ missing | `suspended` |
| ❌ missing | `past_due` |

**Resolution:** Use full code enum in V2: `trial | active | grace_period | past_due | suspended | cancelled | expired`

---

### `payments.status`
| DATABASE.md | Code |
|---|---|
| (none documented) | `pending | succeeded | failed | refunded` |

---

### `dunning_attempts.status`
| DATABASE.md | Code |
|---|---|
| (not documented) | `pending | failed | succeeded | exhausted` |

---

## 6. MISSING FOREIGN KEYS IN DATABASE.MD

| Table | FK Column | References | Notes |
|---|---|---|---|
| `billing_customers` | `tenant_id` | `tenants.id` | Not documented |
| `invoices` (billing) | `subscription_id` | `subscriptions.id` | Not documented |
| `invoice_items` | `invoice_id` | `invoices.id` | Not documented |
| `dunning_attempts` | `subscription_id` | `subscriptions.id` | Not documented |
| `dunning_attempts` | `tenant_id` | `tenants.id` | Not documented |
| `subscriptions` | FK to plans via `plan_id` | `plans.id` | Documented ✅ |

---

## 7. NAMING BUGS IN CODE (not schema issues — code fixes needed)

### Bug 1: `billing_invoices` in stripe webhook
**File:** `stripe-webhook.controller.ts` lines 106, 128
**Code:** `.from('billing_invoices')`
**Should be:** `.from('invoices')` (or whatever the billing invoice table is named in V2)
**Risk:** Stripe payment events will fail silently — status updates go to a non-existent table

### Bug 2: `order_items` insert uses wrong column names
**File:** `invoices.repository.ts` line 65-68
**Code inserts:** `qty` and `price`
**Actual columns:** `quantity` and `unit_price`
**Risk:** All order item inserts will fail at database level with column not found error

---

## 8. SOFT DELETE INCONSISTENCIES

| Table | Soft Delete Method | Documented |
|---|---|---|
| tenants | `deleted_at` + `status='cancelled'` | ✅ |
| users | `deleted_at` + `is_active=false` | ✅ |
| branches | `deleted_at` + `is_active=false` | ✅ |
| items | `deleted_at` + `is_active=false` | ✅ |
| item_variants | `is_active=false` ONLY | ⚠️ no `deleted_at` |
| categories | `is_active=false` ONLY | ⚠️ no `deleted_at` but ScopedRepo filters `deleted_at` |
| customers | `deleted_at` only | ✅ |
| expenses | `deleted_at` (filter only, not set on delete) | ⚠️ |
| expense_templates | `deleted_at` | ✅ |
| shifts | `deleted_at` (filter only) | ⚠️ missing from docs |

**Resolution:** Standardize — all business tables must have `deleted_at`. Remove `is_active` as primary soft-delete mechanism.

---

## 9. LEGACY TABLES (database only, not in code or DATABASE.md)

From `ملاحظات.txt`:

| Table | Status | Action |
|---|---|---|
| `vehicles` | LEGACY — 0 code references | Archive/Drop |
| `workers` | LEGACY — 0 code references | Archive/Drop |
| `availability` | LEGACY — 0 code references | Archive/Drop |
| `business_config` | UNKNOWN — 0 code references | Investigate |
| `queue` | LEGACY — project uses BullMQ | Archive/Drop |

**Blockers to resolve first (from ملاحظات.txt):**
1. Check if `process_recurring_expenses()` PostgreSQL function is still used
2. Check if `cron.job` table entries are active

---

## 10. SCHEMA NAMING INCONSISTENCIES

| Inconsistency | Tables Affected |
|---|---|
| Business "invoice" = `orders` table | orders, order_items |
| Billing "invoice" = `invoices` table | invoices, invoice_items |
| This dual naming creates confusion | Throughout codebase |
| **Recommendation:** Rename `orders` → `pos_orders` or keep `orders`, rename billing `invoices` → `billing_invoices` | Both |

---

## Priority Resolution Order

| Priority | Gap | Action |
|---|---|---|
| P0 🔴 | `billing_invoices` naming bug in webhook | Fix code immediately |
| P0 🔴 | `order_items` qty/price column bug | Fix code immediately |
| P1 🟠 | Add missing tables to DATABASE.md | Document billing_customers, invoices, invoice_items, dunning_attempts |
| P1 🟠 | `subscriptions` column drift | Expand DATABASE.md schema |
| P2 🟡 | `customers.name` → `full_name` | Migration + update DATABASE.md |
| P2 🟡 | `notifications` column drift | Migration + update DATABASE.md |
| P2 🟡 | `expenses.note` → `notes` | Migration + update DATABASE.md |
| P3 🟢 | Remove/archive legacy tables | After confirming blockers |
| P3 🟢 | `coupons` dead table decision | Archive or implement |
