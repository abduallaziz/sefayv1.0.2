# ZERO_CODE_CHANGE_REPORT.md
# Sefay V2 — Minimum Code Change Analysis
# Source: Direct code reading of C:\Fp\api\src (every relevant file)
# Generated: 2026-06-05

---

## METHOD

Every table column was verified against actual INSERT, UPDATE, SELECT statements
in TypeScript files. No assumptions. No documentation. Code only.

---

## FINDING 1 — invoice_counters / get_next_invoice_number

**Status: Does NOT exist. Not needed.**

Invoice number generation is pure JavaScript inside `billing/repositories/invoices.repository.ts`:

```typescript
async generateInvoiceNumber(tenantId: string): Promise<string> {
  const { count } = await this.supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0');
  const year = new Date().getFullYear();
  const prefix = tenantId.slice(0, 4).toUpperCase();
  return `INV-${prefix}-${year}-${seq}`;
}
```

No DB function. No `invoice_counters` table. ✅ Confirmed absent from codebase.

---

## FINDING 2 — Billing invoice table naming

**Status: Code uses `invoices` (9 times). `billing_invoices` is the webhook bug (2 times).**

| File | Table name used | Count |
|---|---|---|
| `core/billing/repositories/invoices.repository.ts` | `invoices` | 7 |
| `core/billing/dunning/dunning.service.ts` | `invoices` | 1 |
| `core/billing/repositories/invoices.repository.ts` | `invoice_items` | 2 |
| `core/billing/stripe-webhook.controller.ts` | `billing_invoices` | **2 ← BUG** |

**Decision: Table = `invoices` and `invoice_items`**

The DDL (SQL_DDL_V2.sql) is updated accordingly.

---

## FINDING 3 — expenses.note vs expenses.notes

**Status: NOT a problem. expense.engine.ts already uses `notes` correctly.**

The actual `expense.engine.ts` file output:
```typescript
return {
  tenant_id: data.tenantId,
  branch_id: data.branchId,
  requested_by: data.requestedBy,
  template_id: data.templateId ?? null,
  title: title ?? '',      ← NEW COLUMN (undocumented)
  amount: data.amount,
  notes: data.note ?? null, ← 'notes' plural — CORRECT
  photo_url: data.photoUrl ?? null,
  status: 'pending',
  expires_at: expiresAt.toISOString(),
};
```

**`expense.engine.ts` uses `notes` not `note`. Earlier analysis was wrong.**

BUT: `expenses` table is MISSING column `title`. The engine inserts it. This is a new discovery.

---

## FINDING 4 — order_items: qty vs quantity, price vs unit_price

**Status: The INSERT path uses `qty` and `price`.**

Chain: `invoices.service.ts` builds items with `quantity`/`unit_price`, then passes to:

```typescript
// modules/invoices/repositories/invoices.repository.ts
async insertItems(items: Record<string, unknown>[]) {
  const mapped = items.map((item) => ({
    order_id: item.order_id,
    item_id: item.item_id,
    item_name: item.item_name,
    qty: item.quantity,      ← column name is qty
    price: item.unit_price,  ← column name is price
  }));
  const { error } = await this.supabase.from('order_items').insert(mapped);
}
```

**DB column must be `qty` and `price` for zero code changes.**

Also discovered: the service builds `{tenant_id, variant_id, variant_name, total_price}` in the orderItems array, but `insertItems()` silently discards them. These 4 columns must be **NULLABLE** in the DB (or absent).

---

## FINDING 5 — orders.shift_id is NOT inserted

**Status: `shift_id` is received as parameter but never passed to repo.create().**

```typescript
// invoices.service.ts
async create(tenant, dto, cashierId, actorRole, branchId, shiftId, ip, device) {
  const invoice = await this.repo.create(tenant, {
    branch_id: branchId,
    cashier_id: cashierId,
    // ... shift_id is NOT here — it's silently dropped
  });
}
```

However, `shifts.repository.ts` queries orders by `shift_id`:
```typescript
.from('orders').select('total, payment_method').eq('shift_id', shiftId)
```

**`orders.shift_id` must be NULLABLE in DB. NOT NULL would break every order creation.**

---

## FINDING 6 — subscriptions has 4 undocumented columns

**Status: 4 additional columns are READ from subscriptions by different files.**

| Column | File reading it | Operation |
|---|---|---|
| `ends_at` | `tenant-management.repository.ts` | READ + WRITE (`extendTrial`) |
| `expires_at` | `tenants.repository.ts` | READ (explicit SELECT) |
| `max_users` | `tenants.repository.ts` | READ (explicit SELECT) |
| `max_branches` | `tenants.repository.ts` | READ (explicit SELECT) |

If `expires_at` doesn't exist in DB and the code does `.select('..., expires_at, ...')`, PostgREST returns HTTP 400. **Must create the column.**

Same for `ends_at`, `max_users`, `max_branches`.

Note: `ends_at` and `expires_at` are conceptually the same thing (when subscription ends) but used by different files with different names. Both columns must exist.

Note: `max_users` and `max_branches` on subscriptions appear to be denormalized copies of plan limits. They are read by `tenants.service.ts` but `billing.service.ts` reads the same values from `plans` table. Two different patterns in the codebase.

---

## FINAL MANDATORY CODE CHANGES

### Can the system run after creating the new DB with ZERO code changes?

**Answer: No. Exactly 1 file needs 2 line changes.**

| # | File | Line | Current | Fix |
|---|---|---|---|---|
| 1 | `api/src/core/billing/stripe-webhook.controller.ts` | 106 | `.from('billing_invoices')` | `.from('invoices')` |
| 2 | `api/src/core/billing/stripe-webhook.controller.ts` | 128 | `.from('billing_invoices')` | `.from('invoices')` |

**That is the complete and total list of mandatory code changes.**

Everything else is handled by the schema design.

---

## CHANGES FROM MASTER_SCHEMA_SPEC.md TO FINAL DDL

| Table | Change | Reason |
|---|---|---|
| `billing_invoices` | → renamed to `invoices` | Code uses `invoices` 9:2 |
| `billing_invoice_items` | → renamed to `invoice_items` | Code uses `invoice_items` |
| `order_items.quantity` | → `qty` | Repository inserts `qty` |
| `order_items.unit_price` | → `price` | Repository inserts `price` |
| `order_items.tenant_id` | → NULL (was NOT NULL) | Repository doesn't insert it |
| `order_items.variant_id` | → NULL | Repository doesn't insert it |
| `order_items.variant_name` | → NULL | Repository doesn't insert it |
| `order_items.total_price` | → NULL | Repository doesn't insert it |
| `orders.shift_id` | → NULL (was NOT NULL) | Service doesn't insert it |
| `expenses` | ADD `title text NOT NULL DEFAULT ''` | Engine outputs it |
| `subscriptions` | ADD `ends_at timestamptz NULL` | tenant-management reads/writes |
| `subscriptions` | ADD `expires_at timestamptz NULL` | tenants.repository reads explicitly |
| `subscriptions` | ADD `max_users integer NULL` | tenants.repository reads explicitly |
| `subscriptions` | ADD `max_branches integer NULL` | tenants.repository reads explicitly |

---

## VERIFICATION: Are there any other tables in code not in the 28?

Based on complete grep of all `.from('...')` across entire `api/src`:

| Table name | In schema? |
|---|---|
| tenants | ✅ |
| users | ✅ |
| branches | ✅ |
| items | ✅ |
| item_variants | ✅ |
| categories | ✅ |
| orders | ✅ |
| order_items | ✅ |
| customers | ✅ |
| shifts | ✅ |
| expenses | ✅ |
| expense_templates | ✅ |
| subscriptions | ✅ |
| plans | ✅ |
| features | ✅ |
| plan_features | ✅ |
| tenant_feature_overrides | ✅ |
| permissions | ✅ |
| role_permissions | ✅ |
| device_sessions | ✅ |
| refresh_tokens | ✅ |
| audit_logs | ✅ |
| notifications | ✅ |
| billing_customers | ✅ |
| invoices | ✅ (was billing_invoices) |
| invoice_items | ✅ (was billing_invoice_items) |
| payments | ✅ |
| dunning_attempts | ✅ |

**Total: 28 tables. No table used in code is missing from schema. ✅**

---

## STATUS

```
╔═══════════════════════════════════════════════════════╗
║  MANDATORY CODE CHANGES: 1 FILE / 2 LINES             ║
║  → stripe-webhook.controller.ts:106,128               ║
║    billing_invoices → invoices                        ║
║                                                       ║
║  ALL OTHER CODE: ZERO CHANGES NEEDED                  ║
║                                                       ║
║  SQL_DDL_V2.sql: REGENERATED with corrections         ║
╚═══════════════════════════════════════════════════════╝
```
