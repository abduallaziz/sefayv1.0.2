# FINAL_SCHEMA_RECOMMENDATION.md
# Sefay V2 — Final Schema Recommendation
# Generated: 2026-06-05
# Based on: Full database discovery from C:\Fp\api\src + C:\Fp\DATABASE.md

---

## Executive Summary

The current production database has significant drift from DATABASE.md. The code is the
more authoritative source on column names (since it runs against the actual database),
but DATABASE.md is authoritative on table intent.

This document is the single source of truth for V2 schema design.

---

## FINAL TABLE COUNT: 30

| # | Table | Domain | Status |
|---|---|---|---|
| 1 | tenants | Core | ✅ Keep (minor fixes) |
| 2 | users | Core | ✅ Keep (confirmed) |
| 3 | branches | Core | ✅ Keep (confirmed) |
| 4 | plans | Billing | ✅ Keep + add columns |
| 5 | subscriptions | Billing | ✅ Keep + expand schema |
| 6 | billing_customers | Billing | ✅ Add (missing from docs) |
| 7 | billing_invoices | Billing | ✅ Add/Rename (was `invoices`) |
| 8 | billing_invoice_items | Billing | ✅ Add (was `invoice_items`) |
| 9 | payments | Billing | ✅ Keep + expand schema |
| 10 | dunning_attempts | Billing | ✅ Add (missing from docs) |
| 11 | features | Feature Flags | ✅ Keep (confirmed) |
| 12 | plan_features | Feature Flags | ✅ Keep (confirmed) |
| 13 | tenant_feature_overrides | Feature Flags | ✅ Keep (confirmed) |
| 14 | permissions | Auth | ✅ Keep (confirmed) |
| 15 | role_permissions | Auth | ✅ Keep (confirmed) |
| 16 | device_sessions | Auth | ✅ Keep (confirmed) |
| 17 | refresh_tokens | Auth | ✅ Keep (confirmed) |
| 18 | items | POS | ✅ Keep (confirmed) |
| 19 | item_variants | POS | ✅ Keep + add deleted_at |
| 20 | categories | POS | ✅ Keep + add deleted_at |
| 21 | orders | POS | ✅ Keep + fix column names |
| 22 | order_items | POS | ✅ Keep (fix code bugs) |
| 23 | customers | POS | ✅ Keep + rename `name`→`full_name` |
| 24 | shifts | Workforce | ✅ Keep + add notes/deleted_at |
| 25 | expenses | Workforce | ✅ Keep + rename note→notes, add shift_id |
| 26 | expense_templates | Workforce | ✅ Keep (confirmed) |
| 27 | audit_logs | Platform | ✅ Keep (confirmed) |
| 28 | notifications | Platform | ✅ Keep + fix column names |
| 29 | coupons | POS | ⚠️ ARCHIVE (not implemented) |
| — | vehicles | Legacy | 🗑️ DROP |
| — | workers | Legacy | 🗑️ DROP |
| — | availability | Legacy | 🗑️ DROP |
| — | business_config | Unknown | 🔍 Investigate before drop |
| — | queue | Legacy | 🗑️ DROP (using BullMQ) |

---

## FINAL COLUMN COUNT: ~210

| Domain | Tables | Est. Columns |
|---|---|---|
| Core Auth | 5 | 42 |
| Tenant & Org | 2 | 14 |
| Billing | 6 | 68 |
| Feature Flags | 3 | 23 |
| POS / Ops | 6 | 52 |
| Workforce | 3 | 28 |
| Platform | 2 | 22 |
| **TOTAL** | **27 active** | **~249** |

---

## FINAL ENUMS: 11

| Enum Name | Values |
|---|---|
| `tenant_status` | active, trial, suspended, cancelled |
| `user_role` | owner, manager, cashier, worker, superadmin |
| `subscription_status` | trial, active, grace_period, past_due, suspended, cancelled, expired |
| `billing_cycle` | monthly, yearly |
| `payment_status` | pending, succeeded, failed, refunded |
| `dunning_status` | pending, failed, succeeded, exhausted |
| `invoice_status` | draft, open, paid, void, overdue, failed |
| `item_type` | product, service, custom |
| `item_operation_type` | sell, book, repair, rent |
| `order_status` | pending, completed, cancelled |
| `expense_status` | pending, approved, rejected, expired |

---

## FINAL FOREIGN KEYS: 50

*(See SCHEMA_INVENTORY.md for complete list)*

Key architectural relationships:
```
tenants ←── users ←── device_sessions ←── refresh_tokens
tenants ←── branches
tenants ←── subscriptions ──→ plans
tenants ←── billing_customers
subscriptions ←── billing_invoices ──→ billing_invoice_items
billing_invoices ←── payments
subscriptions ←── dunning_attempts
tenants ←── orders ──→ order_items
orders ──→ customers, branches, users, shifts
shifts ──→ expenses
expenses ──→ expense_templates
items ──→ item_variants
tenants ──→ tenant_feature_overrides ──→ features
plans ──→ plan_features ──→ features
```

---

## FINAL VIEWS: 0

No database views are needed or currently exist in the codebase.
All aggregations are done in-app (repositories/services).

---

## FINAL FUNCTIONS: 1 (to verify)

| Function | Status | Action |
|---|---|---|
| `process_recurring_expenses()` | ❓ UNKNOWN | Verify if still used before dropping |

**Blocker:** Check if any `cron.job` entries in PostgreSQL call this function.

---

## MIGRATION CHECKLIST

### PHASE 0 — Verify Blockers (BEFORE any migration)

- [ ] Check if `process_recurring_expenses()` function exists and is called by `cron.job`
- [ ] Check `cron.job` table for active entries
- [ ] Verify legacy tables (`vehicles`, `workers`, `availability`, `business_config`, `queue`) have no active references
- [ ] Confirm `coupons` table has no critical data needed (or take snapshot)

---

### PHASE 1 — Critical Bug Fixes (code changes, no migration needed)

- [ ] Fix `stripe-webhook.controller.ts`: `.from('billing_invoices')` → `.from('billing_invoices')` (rename table first, or fix to match)
- [ ] Fix `invoices.repository.ts` (modules/invoices): insert `order_items` using `quantity` not `qty`, `unit_price` not `price`
- [ ] Standardize `expenses` code: change `note` → `notes` in all insert/update operations

---

### PHASE 2 — Column Renames (require migration + code update)

- [ ] `customers.name` → `customers.full_name`
  - Migration: `ALTER TABLE customers RENAME COLUMN name TO full_name;`
  - Code: Already uses `full_name` — no code changes needed

- [ ] `orders.discount_amount` → `orders.discount` (if actual DB has `discount_amount`)
  - Migration: `ALTER TABLE orders RENAME COLUMN discount_amount TO discount;`
  - Code: Already uses `discount` — no code changes needed

- [ ] `orders.tax_amount` → `orders.tax` (if actual DB has `tax_amount`)
  - Migration: `ALTER TABLE orders RENAME COLUMN tax_amount TO tax;`
  - Code: Already uses `tax` — no code changes needed

- [ ] `notifications.subject` → `notifications.title`
  - Migration: `ALTER TABLE notifications RENAME COLUMN subject TO title;`

- [ ] `notifications.metadata` → `notifications.data`
  - Migration: `ALTER TABLE notifications RENAME COLUMN metadata TO data;`

- [ ] `expenses.note` → `expenses.notes`
  - Migration: `ALTER TABLE expenses RENAME COLUMN note TO notes;`

---

### PHASE 3 — Add Missing Columns (non-breaking)

- [ ] `subscriptions`: ADD `billing_cycle`, `trial_ends_at`, `current_period_start`, `current_period_end`, `updated_at`, `suspended_at`, `grace_period_ends_at`
- [ ] `plans`: ADD `trial_days`, `description`, `updated_at`
- [ ] `customers`: ADD `is_active`, `updated_at`
- [ ] `shifts`: ADD `notes`, `deleted_at`
- [ ] `item_variants`: ADD `deleted_at`
- [ ] `categories`: ADD `deleted_at`
- [ ] `notifications`: ADD `is_read` (default false)
- [ ] `expenses`: ADD `shift_id` (nullable FK → shifts.id)

---

### PHASE 4 — Add Missing Tables (new tables)

- [ ] CREATE `billing_customers`
- [ ] CREATE `billing_invoices` (or rename existing `invoices` if it exists)
- [ ] CREATE `billing_invoice_items`
- [ ] CREATE `dunning_attempts`

---

### PHASE 5 — Cleanup Legacy Tables

- [ ] DROP `vehicles` (after confirming no references)
- [ ] DROP `workers` (after confirming no references)
- [ ] DROP `availability` (after confirming no references)
- [ ] DROP `queue` (after confirming no references — project uses BullMQ)
- [ ] DECIDE on `business_config` (investigate first)
- [ ] DECIDE on `coupons` (archive data if needed, then drop or implement)

---

### PHASE 6 — Add Indexes

- [ ] Add all indexes from SCHEMA_INVENTORY.md recommendations
- [ ] Add UNIQUE constraints:
  - `billing_customers(tenant_id, provider)`
  - `tenant_feature_overrides(tenant_id, feature_key)`
  - `plan_features(plan_id, feature_key)`
  - `role_permissions(role, permission_key)`
  - `refresh_tokens(token_hash)`
  - `users(tenant_id, email)`

---

## CRITICAL DECISIONS NEEDED FROM OWNER

| # | Decision | Options | Impact |
|---|---|---|---|
| 1 | Rename billing invoices table? | Keep as `invoices` OR rename to `billing_invoices` | Affects all billing code |
| 2 | Keep `coupons` for V2? | Implement OR archive | Feature decision |
| 3 | `process_recurring_expenses()` function | Keep OR drop | Need to check cron.job first |
| 4 | `business_config` table | Keep OR drop | Need to investigate |
| 5 | Confirmed: `orders` = POS receipts? | Yes (rename was just for clarity) | No action needed |

---

## RISK MATRIX

| Risk | Severity | Likelihood | Migration Mitigation |
|---|---|---|---|
| `order_items` bug (qty/price) | CRITICAL | CONFIRMED | Fix code in Phase 1 |
| `billing_invoices` webhook bug | CRITICAL | CONFIRMED | Fix code + rename in Phase 1 |
| `customers.name` vs `full_name` | HIGH | HIGH | Migration + verify live data |
| `subscriptions` missing columns | HIGH | HIGH | Add columns carefully |
| Legacy tables with data | MEDIUM | MEDIUM | Take snapshots before drop |
| `expenses.shift_id` missing | MEDIUM | HIGH | Add column + FK |

---

## NEXT STEP

Once all 5 discovery documents are reviewed and decisions made:

→ Generate `SQL_DDL_V2.sql`

The DDL will include:
- Full CREATE TABLE statements for all 29 active tables
- All ENUM type definitions
- All FOREIGN KEY constraints
- All INDEX definitions
- All UNIQUE constraints
- Migration scripts for column renames
- Seed data for permissions, role_permissions, features, plan_features

**Do NOT generate SQL_DDL_V2.sql until:**
1. Blockers from Phase 0 are cleared
2. Column rename decisions are confirmed
3. Table naming (invoices vs billing_invoices) is decided
