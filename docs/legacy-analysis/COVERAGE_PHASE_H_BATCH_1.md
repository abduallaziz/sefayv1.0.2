# COVERAGE_PHASE_H_BATCH_1.md
# Phase H — Column / Schema Mismatches — Batch 1/2
# Tables: orders, order_items, customers, items, item_variants, invoices, billing

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Mismatches in Batch | 15 |
| Tables Affected | orders, order_items, customers, items, invoices, billing |
| Source | READ_VERIFIED files — Phases A–F. No re-read performed. |

---

## Mismatch-by-Mismatch Report

---

### H-001 — `orders.discount` vs `discount_amount`

| Field | Value |
|-------|-------|
| **Table** | `orders` |
| **Column in DB** | `discount` |
| **Column in Frontend** | `discount_amount` |
| **Backend File** | `api/src/modules/invoices/repositories/invoices.repository.ts` — line 24 |
| **Frontend File** | `web/src/features/orders/types/order.types.ts` — line 11 |
| **Backend Evidence** | `SELECT 'id, status, subtotal, discount, tax, total, ...'` — column named `discount` |
| **Frontend Evidence** | `discount_amount: number` in `Order` interface |
| **Also** | `web/src/features/invoices/api/invoices.api.ts` — `Invoice.discount_amount` (line 26) |
| **Impact** | Frontend reads `order.discount_amount` → always `undefined`. Discount never shown in OrderDetailsModal |

---

### H-002 — `order_items.qty` vs `quantity`

| Field | Value |
|-------|-------|
| **Table** | `order_items` |
| **Column in DB** | `qty` |
| **Column in Frontend** | `quantity` |
| **Backend File** | `api/src/modules/invoices/repositories/invoices.repository.ts` — line 68 |
| **Frontend File** | `web/src/features/orders/types/order.types.ts` — line 9 |
| **Backend Evidence** | `INSERT: { order_id, item_id, item_name, qty: item.quantity, price: item.unit_price }` |
| **Frontend Evidence** | `OrderItem.quantity: number` |
| **Impact** | Frontend expects `quantity` → reads `undefined` from DB. Items list in order shows blank qty |

---

### H-003 — `order_items.price` vs `unit_price`

| Field | Value |
|-------|-------|
| **Table** | `order_items` |
| **Column in DB** | `price` |
| **Column in Frontend** | `unit_price` |
| **Backend File** | `api/src/modules/invoices/repositories/invoices.repository.ts` — line 69 |
| **Frontend File** | `web/src/features/orders/types/order.types.ts` — line 10 |
| **Backend Evidence** | `price: item.unit_price` — stored as `price` in DB |
| **Frontend Evidence** | `OrderItem.unit_price: number` |
| **Impact** | Frontend unit price always `undefined`. Order total breakdown broken |

---

### H-004 — `order_items.total_price` — column not in DB

| Field | Value |
|-------|-------|
| **Table** | `order_items` |
| **Column in DB** | NOT PRESENT |
| **Column in Frontend** | `total_price` |
| **Backend File** | `api/src/modules/invoices/repositories/invoices.repository.ts` — lines 63–72 |
| **Frontend File** | `web/src/features/orders/types/order.types.ts` — line 11 |
| **Backend Evidence** | `insertItems()` only inserts: `order_id, item_id, item_name, qty, price` — no `total_price` |
| **Frontend Evidence** | `OrderItem.total_price: number` — displayed in OrderDetailsModal line 79 |
| **Impact** | `total_price` always `undefined`. Per-item total never shown |

---

### H-005 — `order_items.variant_id`, `variant_name` — not stored

| Field | Value |
|-------|-------|
| **Table** | `order_items` |
| **Column in DB** | NOT STORED |
| **Column in Frontend** | `variant_id?`, `variant_name?` |
| **Backend File** | `api/src/modules/invoices/repositories/invoices.repository.ts` — lines 63–72 |
| **Frontend File** | `web/src/features/orders/types/order.types.ts` — lines 7–8 |
| **Backend Evidence** | `insertItems()` maps: `order_id, item_id, item_name, qty, price` — variant fields silently dropped |
| **Frontend Note** | `invoices.service.ts` builds `variant_id`, `variant_name` (lines 75–77) but repo drops them |
| **Impact** | Variant information lost at DB level. OrderDetailsModal shows no variant name |

---

### H-006 — `orders.cashier_name`, `customer_name` — not in DB

| Field | Value |
|-------|-------|
| **Table** | `orders` |
| **Columns in DB** | `cashier_id`, `customer_id` |
| **Columns in Frontend** | `cashier_name: string`, `customer_name?: string` |
| **Backend File** | `api/src/modules/invoices/repositories/invoices.repository.ts` — lines 23–25 |
| **Frontend File** | `web/src/features/orders/types/order.types.ts` — lines 4, 6 |
| **Backend Evidence** | SELECT includes `cashier_id, customer_id` — returns IDs only, no JOIN to names |
| **Impact** | OrdersTable shows `cashier_name` → `undefined`. CustomerDetailsModal can't resolve names |

---

### H-007 — `customers.orders_count` vs `total_orders`

| Field | Value |
|-------|-------|
| **Table** | `customers` (frontend-only inconsistency) |
| **File 1** | `web/src/features/customers/types/customer.types.ts` — line 10 |
| **File 2** | `web/src/features/customers/mock/customers.mock.ts` — line 14 |
| **Evidence** | `customer.types.ts` defines `orders_count?: number` · `customers.mock.ts` provides `total_orders: 12` |
| **Also** | `CustomersTable.tsx` renders `customer.total_orders ?? 0` (line 91) and `CustomerDetailsModal.tsx` renders `customer.total_orders ?? 0` (line 71) |
| **Impact** | Components use `total_orders` but type declares `orders_count`. TypeScript allows this (optional field) but value always `undefined` from real API which returns neither |

---

### H-008 — `customers.total_spent` — computed, not a DB column

| Field | Value |
|-------|-------|
| **Table** | `customers` |
| **DB Column** | NOT IN `customers` table |
| **Frontend Expects** | `total_spent?: number` — displayed in CustomersTable (line 98), CustomerDetailsModal (line 79) |
| **Backend File** | `api/src/modules/customers/customers.repository.ts` — lines 129–146 |
| **Backend Evidence** | `getStats()` computes `total_spent` in-memory from orders query — NOT returned by `findAll()` or `findById()` |
| **Impact** | CustomersTable always shows `(0).toLocaleString()` for spent column. Stats only available via `GET /customers/:id/history` (different endpoint) |

---

### H-009 — `items.category_name` — not a flat DB column

| Field | Value |
|-------|-------|
| **Table** | `items` |
| **DB Column** | `category_id` (FK) + JOIN returns `categories{id, name, type}` as nested object |
| **Frontend Expects** | `category_name?: string` — flat string (item.types.ts line 24, ItemsTable.tsx line 55) |
| **Backend File** | `api/src/modules/items/repositories/items.repository.ts` — lines 18–22 |
| **Backend Evidence** | `SELECT ... categories(id, name, type)` — returns nested object `{ categories: { id, name, type } }` |
| **Impact** | `item.category_name` always `undefined` from API. Category column in ItemsTable always `'—'` |

---

### H-010 — `items.CreateItemDto` missing `operation_type`

| Field | Value |
|-------|-------|
| **Table** | `items` |
| **Backend DTO** | `api/src/modules/items/dto/create-item.dto.ts` — line 34: `@IsEnum(OperationType) operation_type: OperationType` — **required** |
| **Frontend DTO** | `web/src/features/items/api/items.api.ts` — `CreateItemDto` lines 14–21: `operation_type` **absent** |
| **Frontend Form** | `web/src/features/items/components/ItemFormModal.tsx` — line 14: includes `operation_type` in `schema` — present in form |
| **Impact** | Frontend form collects `operation_type` but the API DTO definition doesn't include it. On `POST /items`, field may be stripped by whitelist validation or cause TS type error. Backend rejects with 400 if `operation_type` missing |

---

### H-011 — `invoices.amount_due` vs `total_amount`

| Field | Value |
|-------|-------|
| **Table** | `invoices` |
| **Column in DB** | `total_amount` (inserted by billing repository) |
| **Column read by Dunning** | `amount_due` (read by dunning service) |
| **Backend File 1** | `api/src/core/billing/repositories/invoices.repository.ts` — line 86: INSERT `total_amount` |
| **Backend File 2** | `api/src/core/billing/dunning/dunning.service.ts` — line 167: SELECT `id, amount_due, currency` |
| **Also Backend File 2** | Line 178: `amount: invoice?.amount_due ?? 0` → used as payment charge amount |
| **Impact** | Dunning always charges $0 / `null`. Subscription recovery never works. Confirmed CONFLICT B in DDL_FINAL_AUDIT.md |

---

### H-012 — `billing_invoices` vs `invoices` (table name conflict)

| Field | Value |
|-------|-------|
| **Issue** | Two different table names used for the same billing invoice concept |
| **Table A** | `invoices` — used by `api/src/core/billing/repositories/invoices.repository.ts` (all CRUD) |
| **Table B** | `billing_invoices` — used by `api/src/core/billing/stripe-webhook.controller.ts` lines 106, 130 |
| **Backend File A** | `invoices.repository.ts` line 77: `this.supabase.from('invoices')` |
| **Backend File B** | `stripe-webhook.controller.ts` line 106: `this.supabase.from('billing_invoices')` |
| **Impact** | Stripe webhook updates `billing_invoices` (may not exist). Invoice status never updated on payment events. Confirmed CONFLICT A in DDL_FINAL_AUDIT.md |

---

### H-013 — `subscriptions.expires_at` — never written

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Column** | `expires_at` |
| **Read By** | `api/src/modules/tenants/repositories/tenants.repository.ts` — line 44 |
| **Written By** | **Nobody** — no INSERT or UPDATE sets `expires_at` |
| **Closest Column** | `current_period_end` (written by billing.service.ts lines 205, 222) |
| **Impact** | `TenantsController` subscription response always shows `expires_at: null`. Tenant cannot see when subscription ends |

---

### H-014 — `subscriptions.max_users`, `max_branches` — never written

| Field | Value |
|-------|-------|
| **Table** | `subscriptions` |
| **Columns** | `max_users`, `max_branches` |
| **Read By** | `api/src/modules/tenants/repositories/tenants.repository.ts` — line 44 |
| **Written By** | **Nobody** — plan limits only exist in `plans` table (plans.max_users, plans.max_branches) |
| **Backend Evidence** | `api/src/core/billing/billing.service.ts` lines 91–95: reads limits from `getPlanById()` → `plans` table |
| **Impact** | `TenantsService.getUsage()` shows `max_users: null`, `max_branches: null`. Usage limits never enforced via subscription record |

---

### H-015 — `POST /invoices` — `branch_id` + `shift_id` body vs headers

| Field | Value |
|-------|-------|
| **Table** | `orders` (via invoice creation) |
| **Frontend File** | `web/src/features/invoices/api/invoices.api.ts` — `CreateInvoiceDto` lines 10–11 |
| **Frontend Evidence** | Sends `{ branch_id: string, shift_id: string, ... }` in request **body** |
| **Backend File** | `api/src/modules/invoices/invoices.controller.ts` — lines 36–37 |
| **Backend Evidence** | Reads `branchId = req.headers['x-branch-id']` and `shiftId = req.headers['x-shift-id']` from **headers** |
| **Impact** | Backend receives `branch_id=undefined`, `shift_id=undefined`. Invoice saved with null branch_id / shift_id. Shift reconciliation (shift total sales) completely broken |

---

## Batch 1 Summary

| ID | Table | Column | Type | Severity |
|----|-------|--------|------|----------|
| H-001 | orders | `discount` vs `discount_amount` | Name mismatch | HIGH |
| H-002 | order_items | `qty` vs `quantity` | Name mismatch | HIGH |
| H-003 | order_items | `price` vs `unit_price` | Name mismatch | HIGH |
| H-004 | order_items | `total_price` — not in DB | Missing column | MEDIUM |
| H-005 | order_items | `variant_id`, `variant_name` dropped | Missing columns | MEDIUM |
| H-006 | orders | `cashier_name`, `customer_name` — not in DB | Missing join | HIGH |
| H-007 | customers | `orders_count` vs `total_orders` | Name mismatch (frontend internal) | LOW |
| H-008 | customers | `total_spent` — not in customers table | Computed, not stored | MEDIUM |
| H-009 | items | `category_name` — nested vs flat | Shape mismatch | MEDIUM |
| H-010 | items | `operation_type` — missing from API DTO | Missing required field | HIGH |
| H-011 | invoices | `amount_due` vs `total_amount` | Name mismatch | CRITICAL |
| H-012 | billing_invoices vs invoices | Table name conflict | Table mismatch | CRITICAL |
| H-013 | subscriptions | `expires_at` — never written | Column never populated | HIGH |
| H-014 | subscriptions | `max_users`, `max_branches` — never written | Columns never populated | HIGH |
| H-015 | orders | `branch_id`, `shift_id` body vs headers | Wrong transport | CRITICAL |

---

## ⛔ STOPPED — Awaiting confirmation for Batch 2 (mismatches 16–22: subscriptions, tenants, device_sessions, dunning, enums)
