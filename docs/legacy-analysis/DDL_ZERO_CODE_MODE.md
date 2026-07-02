# DDL_ZERO_CODE_MODE.md
# Sefay V2 — Zero TypeScript Code Changes Mode
# Constraint: ZERO modifications to any .ts file allowed.
# Goal: Build DB that runs 100% with code as-is.
# Generated: 2026-06-05

---

## THE ONLY NAMING CONFLICT

The codebase has exactly ONE internal naming split:

| Table concept | Files using it | Count |
|---|---|---|
| Billing invoices | `core/billing/repositories/invoices.repository.ts` (lines 44,77,120,133,149,161) | 6 |
| Billing invoices | `core/billing/dunning/dunning.service.ts` (line 166) | 1 |
| Billing invoices | `core/billing/stripe-webhook.controller.ts` (lines 106, 128) | 2 |

- 7 references call it: **`invoices`**
- 2 references call it: **`billing_invoices`**

### Solution: PostgreSQL Updatable VIEW

Create the real table as `invoices`.
Create `billing_invoices` as a simple updatable VIEW over `invoices`.

```
TABLE invoices (real data lives here)
    ↑
    └── VIEW billing_invoices = SELECT * FROM invoices
```

In PostgreSQL, a simple view (`SELECT * FROM one_table`) is automatically updatable.
PostgREST (Supabase) exposes views as REST endpoints identical to tables.
`INSERT`, `UPDATE`, `DELETE` through the view pass directly to the underlying table.

**Result: Both `.from('invoices')` and `.from('billing_invoices')` hit the same data.**

---

## FINAL TABLE NAMES (from code — not renamed, not corrected)

| # | Table Name | Source |
|---|---|---|
| 1 | tenants | code |
| 2 | users | code |
| 3 | device_sessions | code |
| 4 | refresh_tokens | code |
| 5 | branches | code |
| 6 | plans | code |
| 7 | subscriptions | code |
| 8 | billing_customers | code |
| 9 | **invoices** | code (7/9 references) |
| 9b | **billing_invoices** | VIEW over invoices (2/9 references) |
| 10 | invoice_items | code |
| 11 | payments | code |
| 12 | dunning_attempts | code |
| 13 | features | code |
| 14 | plan_features | code |
| 15 | tenant_feature_overrides | code |
| 16 | permissions | code |
| 17 | role_permissions | code |
| 18 | items | code |
| 19 | item_variants | code |
| 20 | categories | code |
| 21 | orders | code |
| 22 | order_items | code |
| 23 | customers | code |
| 24 | shifts | code |
| 25 | expenses | code |
| 26 | expense_templates | code |
| 27 | audit_logs | code |
| 28 | notifications | code |

---

## FINAL COLUMN NAMES (from code — conflicts resolved by code usage)

### Tables where DATABASE.md and code disagreed — code wins:

| Table | Column | DATABASE.md | Code | Decision |
|---|---|---|---|---|
| customers | `full_name` | `name` | `full_name` (every query) | `full_name` ✅ |
| orders | `discount` | `discount_amount` | `discount` (every query) | `discount` ✅ |
| orders | `tax` | `tax_amount` | `tax` (every query) | `tax` ✅ |
| order_items | `qty` | `quantity` | `qty` (insertItems mapping) | `qty` ✅ |
| order_items | `price` | `unit_price` | `price` (insertItems mapping) | `price` ✅ |
| expenses | `notes` | `note` | `notes` (select/update) | `notes` ✅ |
| expenses | `title` | missing | engine outputs it | `title` ✅ |
| notifications | `title` | `subject` | `title` (insert+read) | `title` ✅ |
| notifications | `data` | `metadata` | `data` (insert) | `data` ✅ |
| notifications | `is_read` | missing | bool read/update | `is_read` ✅ |

### Subscriptions — 4 extra columns vs DATABASE.md:

| Column | Code file | Operation |
|---|---|---|
| `ends_at` | `tenant-management.repository.ts:147,152` | READ + WRITE |
| `expires_at` | `tenants.repository.ts:44` | READ (explicit SELECT) |
| `max_users` | `tenants.repository.ts:47` | READ (explicit SELECT) |
| `max_branches` | `tenants.repository.ts:48` | READ (explicit SELECT) |

All 4 columns must exist. Explicit SELECT returns HTTP 400 if column missing.

---

## NULLABLE CONSTRAINTS — based on INSERT paths

Columns that must be NULL (code never inserts them):

| Table | Column | Reason |
|---|---|---|
| orders | shift_id NULL | invoices.service.ts:59-70 — shiftId param dropped, never passed to INSERT |
| orders | cancelled_at NULL | cancel() only sets status='cancelled', never sets this |
| orders | cancelled_by NULL | cancel() receives param but never updates this column |
| order_items | tenant_id NULL | insertItems() drops it from mapped object |
| order_items | variant_id NULL | insertItems() drops it from mapped object |
| order_items | variant_name NULL | insertItems() drops it from mapped object |
| order_items | total_price NULL | insertItems() drops it from mapped object |

---

## MANDATORY DDL CHANGE FROM SQL_DDL_V2.sql

**Add the VIEW after the `invoices` table:**

```sql
CREATE VIEW billing_invoices AS SELECT * FROM invoices;
```

This is a DDL addition, not a table rename. No TypeScript change needed.

---

## CODE CHANGES REQUIRED AFTER THIS DDL

**Zero. None. 0.**

With the `billing_invoices` view in place:
- `stripe-webhook.controller.ts:106,128` — writes to `billing_invoices` → hits `invoices` table ✅
- All billing repository code — reads/writes `invoices` table directly ✅
- Same underlying data, zero TypeScript modification needed

---

## FINAL ANSWER

| Question | Answer |
|---|---|
| TypeScript files to modify | **0** |
| DDL changes from SQL_DDL_V2.sql | **Add 1 VIEW** |
| Tables in schema | **28 real + 1 view** |
| Code changes = 0? | **YES** |
