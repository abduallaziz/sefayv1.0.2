# BUSINESS_RULES_DISCOVERY.md
# Sefay V2 — Business Rules Discovered from Code
# Generated: 2026-06-05 | Source: C:\Fp\api\src analysis

---

## Overview

These business rules were discovered by analyzing actual code behavior, not documentation.
Each rule implies a schema constraint or business invariant that V2 must preserve.

---

## 1. SUBSCRIPTION LIFECYCLE

**Source:** `billing.service.ts`, `billing.types.ts`

### State Machine:
```
[signup] → trial
trial → active (on paid subscription)
trial → suspended (if trial_ends_at < now, hourly cron)
active → grace_period (on payment failure → dunning)
active → cancelled (manual cancel)
grace_period → suspended (if grace_period_ends_at < now)
past_due → active (on dunning success)
any → suspended (after dunning exhausted + grace period)
```

### Schema Implications:
- `subscriptions.status` must support: `trial | active | grace_period | past_due | suspended | cancelled | expired`
- `subscriptions` needs: `billing_cycle`, `trial_ends_at`, `current_period_start`, `current_period_end`, `suspended_at`, `grace_period_ends_at`, `updated_at`
- Plans must have `trial_days` to initialize trial period end

---

## 2. DUNNING ENGINE

**Source:** `dunning.service.ts`, `dunning.constants.ts`

### Rules:
- Maximum 3 dunning attempts per subscription
- Retry intervals: defined in `DUNNING_RETRY_INTERVALS_HOURS` array
- After max attempts: mark `exhausted`, start 3-day grace period (`DUNNING_GRACE_PERIOD_DAYS = 3`)
- After grace period expires: suspend tenant
- On dunning success: restore subscription to `active`

### Schema Implications:
- `dunning_attempts` must exist with: `tenant_id`, `subscription_id`, `attempt_number`, `status`, `next_retry_at`, `attempted_at`, `error_message`
- Status: `pending | failed | succeeded | exhausted`
- Unique index recommended on: `(subscription_id, attempt_number)`

---

## 3. FEATURE FLAG RESOLUTION (3-LAYER PRIORITY)

**Source:** `feature-flags.service.ts`

### Resolution Order (highest priority first):
1. `tenant_feature_overrides` — per-tenant override (superadmin set)
2. `plan_features` — plan-level default
3. `features` — global default

### Schema Implications:
- All three tables must exist simultaneously
- `tenant_feature_overrides` uses `is_enabled = null` to mean "inherit from plan"
- `plan_features.feature_key` + `features.key` must stay in sync
- `tenant_feature_overrides` conflict key: `(tenant_id, feature_key)` — UNIQUE required

---

## 4. AUTHENTICATION TOKEN LIFECYCLE

**Source:** `auth.service.ts`

### Rules:
- Login: creates `device_sessions` record + `refresh_tokens` record
- Refresh: marks old token `is_used=true` + creates new `refresh_tokens` record
- Token reuse detection: if `is_used=true` token is presented → immediately revoke entire session
- Logout: marks session `is_revoked=true` + all refresh tokens `is_used=true`

### Schema Implications:
- `refresh_tokens.is_used` cannot be nullable — must default `false`
- `device_sessions.is_revoked` cannot be nullable — must default `false`
- Index on `refresh_tokens.token_hash` — used in every auth lookup
- Index on `device_sessions.user_id + is_revoked` — used for session checks

---

## 5. EXPENSE APPROVAL WORKFLOW

**Source:** `expenses.service.ts`, `expense.engine.ts`, `approval.engine.ts`

### Rules:
- Expenses expire after `expense_templates.expiry_hours` (or 24h default)
- Cannot approve an expired expense
- On rejection: appends reason to `notes` field as `"... | Rejected: {reason}"`
- Status flow: `pending → approved | rejected | expired`
- Only `pending` expenses can be approved or rejected

### Schema Implications:
- `expenses.expires_at` is required (not optional)
- `expenses.notes` must be text (not `note`) — supports concatenation
- `expenses.resolved_at` tracks approval/rejection timestamp
- `expenses.deleted_at` should exist for soft delete

---

## 6. SHIFT → POS ORDER RELATIONSHIP

**Source:** `shifts.repository.ts`, `invoices.repository.ts`

### Rules:
- Each order (POS transaction) must be linked to a `shift_id`
- Shift expenses are linked via `expenses.shift_id` (but this column is NOT in DATABASE.md!)
- Shift revenue = sum of `orders.total` WHERE `shift_id = X AND status = 'completed'`
- Shift expenses = sum of `expenses.amount` WHERE `shift_id = X`
- Shift discrepancy = `closing_cash - expected_cash`

### Schema Implications:
- `orders.shift_id` FK → `shifts.id` (added via migration C0_add_shift_id_to_orders.sql)
- `expenses.shift_id` FK → `shifts.id` — **currently missing from DATABASE.md and possibly the actual DB**
- `shifts.deleted_at` must exist (code filters it)
- `shifts.notes` must exist (code inserts it)

---

## 7. TENANT ISOLATION PATTERN

**Source:** `scoped.repository.ts`

### Rules (hardcoded in ScopedRepository):
- Every `scopedQuery()` call auto-adds: `.eq('tenant_id', tenantId)` AND `.is('deleted_at', null)`
- `unscopedQuery()` only filters `deleted_at`, no tenant filter (superadmin only)
- Child repositories may call `supabase.from()` directly for joins to non-tenant tables

### Schema Implications:
- ALL business tables must have `tenant_id` column
- ALL business tables must have `deleted_at` column (or stop using ScopedRepository)
- Exception: system tables (`features`, `plans`, `permissions`, `role_permissions`)

---

## 8. MULTI-TENANT BILLING ISOLATION

**Source:** `billing.service.ts`, `billing-invoice.service.ts`

### Rules:
- Each tenant has at most ONE active/trial subscription at a time
- Multiple subscriptions can exist (history), but only one is active
- `billing_customers.provider` distinguishes between Stripe, Mock, etc.
- Invoice number format: `INV-{tenantPrefix4chars}-{year}-{sequence4digits}`

### Schema Implications:
- No UNIQUE constraint on `subscriptions(tenant_id, status)` — multiple cancelled/expired OK
- `billing_customers` needs UNIQUE on `(tenant_id, provider)` to prevent duplicates
- `invoices.invoice_number` must be UNIQUE per tenant

---

## 9. ORDER SNAPSHOT PATTERN

**Source:** `invoices.repository.ts`, DATABASE.md

### Rule:
- When creating an order, item `name` and price are snapshot-copied to `order_items`
- This preserves historical record even if item is later modified

### Schema Implications:
- `order_items.item_name` — snapshot of item name at time of sale
- `order_items.unit_price` — snapshot of price at time of sale
- `order_items.variant_name` — snapshot if variant was selected
- These fields must NOT be foreign-key-cascaded to `items` for display

---

## 10. SOFT DELETE UNIVERSAL CONTRACT

**Source:** All repositories

### Rule:
- `deleted_at IS NULL` = record is active
- `deleted_at IS NOT NULL` = record is soft-deleted
- Hard deletes are never used on business data
- Only `audit_logs` have hard deletes (cleanup after N days)

### Exceptions found:
- `item_variants`: soft delete via `is_active=false` only (no `deleted_at`)
- `categories`: soft delete via `is_active=false` only (no `deleted_at`, but ScopedRepo filters `deleted_at`)

---

## 11. NOTIFICATION DELIVERY RULES

**Source:** `inapp.channel.ts`, `notifications.repository.ts`

### Rules:
- InApp channel inserts to `notifications` table directly
- Email channel sends via Resend API (no DB insert needed)
- Notifications are marked as read per-user with timestamp
- Unread count is queried separately for badge display

### Schema Implications:
- `notifications.is_read` boolean default `false` — required for unread count queries
- `notifications.read_at` nullable timestamp — required for read tracking
- `notifications.channel` enum: `in_app | email` (from code)
- Index on `(user_id, tenant_id, is_read)` for unread count queries

---

## 12. PLAN LIMIT ENFORCEMENT

**Source:** `billing.service.ts`

### Rules:
- `max_users = -1` means UNLIMITED
- `max_branches = -1` means UNLIMITED
- User limit checked before creating new users
- Branch limit checked before creating new branches

### Schema Implications:
- `plans.max_users` and `plans.max_branches` must allow `-1` as unlimited sentinel
- Limits can be overridden per-tenant via `tenant_feature_overrides.limit_value`

---

## 13. AUDIT LOG RETENTION

**Source:** `audit-cleanup.processor.ts`

### Rule:
- Audit logs are auto-deleted after N days (retention period)
- Cleanup runs as a BullMQ queue job

### Schema Implications:
- `audit_logs.created_at` must be indexed for efficient range-delete queries
- No `deleted_at` on audit_logs — hard deletes are intentional

---

## 14. PAYMENT PROVIDER ABSTRACTION

**Source:** `billing.types.ts`, `payment-provider.interface.ts`

### Rules:
- Provider name enum: `mock | stripe | moyasar | tap`
- `billing_customers.provider` distinguishes which payment provider
- `payments.provider` tracks which provider processed the payment
- Currently only `mock` and `stripe` are implemented

### Schema Implications:
- Provider fields must be `text` or `varchar` (not hard enum) to allow adding `moyasar`, `tap` later
- `billing_customers` unique constraint: `(tenant_id, provider)`

---

## 15. DISCOVERED FEATURES CATALOG

**Source:** `features.seed.ts`

| Feature Key | Category | Default |
|---|---|---|
| `pos` | core | enabled |
| `inventory` | core | enabled |
| `expenses` | core | enabled |
| `shifts` | core | enabled |
| `customers` | core | enabled |
| `coupons` | advanced | enabled |
| `appointments` | advanced | disabled |
| `analytics` | premium | disabled |
| `multi_branch` | advanced | enabled |
| `reports_export` | advanced | disabled |

### Schema Implications:
- `features.category` enum: `core | advanced | premium`
- `features.is_enabled` is the global default; per-plan and per-tenant can override

---

## 16. STRIPE WEBHOOK NAMING BUG (CRITICAL)

**Source:** `stripe-webhook.controller.ts`

### Bug Found:
```typescript
// Line 106 & 128 — uses wrong table name
.from('billing_invoices')
// Should be:
.from('invoices')
```

### Impact:
- All Stripe webhook payment events (payment_intent.succeeded, payment_intent.payment_failed) update a non-existent table
- Billing invoice status never updated from Stripe events
- **This is a silent data bug** — no error thrown but no data written

### Resolution:
- Either: Fix code to use `invoices` table name
- Or: Rename the billing invoices table to `billing_invoices` consistently throughout all code

---

## 17. MISSING SHIFT_ID ON EXPENSES

**Source:** `shifts.repository.ts` method `getShiftExpenses()`

```typescript
async getShiftExpenses(shiftId: string, tenantId: string) {
  const { data } = await this.supabase
    .from('expenses')
    .select('amount, status')
    .eq('shift_id', shiftId)  // ← queries shift_id on expenses
    .eq('tenant_id', tenantId);
}
```

### Database Implication:
- `expenses` table must have a `shift_id` column FK → `shifts.id`
- This column is **NOT in DATABASE.md** and likely **NOT in the actual database**
- This means `getShiftExpenses()` currently returns empty data for every call

### Resolution:
- ADD `shift_id nullable FK → shifts.id` to `expenses` table in V2 schema
