# COVERAGE_PHASE_E_BATCH_6.md
# Phase E — web/src — Batch 6/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 7.

---

## Important Note on File Path Discrepancy

The 15 paths provided by the user did **not match** the actual files in the project. Verification result:

| Provided Path | Exists? |
|---------------|---------|
| features/dashboard/pages/ExpensesPage.tsx | ❌ NOT FOUND |
| features/dashboard/pages/ItemsPage.tsx | ❌ NOT FOUND |
| features/dashboard/pages/OrdersPage.tsx | ❌ NOT FOUND |
| features/dashboard/pages/POSPage.tsx | ❌ NOT FOUND |
| features/dashboard/pages/ShiftsPage.tsx | ❌ NOT FOUND |
| features/superadmin/tenants/tenants.api.ts | ❌ NOT FOUND |
| features/superadmin/tenants/TenantsPage.tsx | ✅ EXISTS (#131) |
| features/superadmin/tenants/CustomerFilters.tsx | ❌ NOT FOUND |
| features/superadmin/tenants/CustomerFormModal.tsx | ❌ NOT FOUND |
| features/superadmin/tenants/CustomersTable.tsx | ❌ NOT FOUND |
| features/superadmin/tenants/DeleteCustomerModal.tsx | ❌ NOT FOUND |
| features/superadmin/auth-control/authControl.api.ts | ❌ NOT FOUND (actual: `auth-control/api.ts`) |
| features/superadmin/auth-control/AuthControlPage.tsx | ❌ NOT FOUND (inline in page.tsx batch 3) |
| features/superadmin/reports/reports.api.ts | ❌ NOT FOUND |
| features/superadmin/reports/ReportsAuditPage.tsx | ✅ EXISTS (#118) |

**Action taken:** Read the actual files **#55–69** from the original PowerShell inventory to maintain correct sequential coverage.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 69 / 168 = 41.1% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 55 | features/invoices/hooks/use-invoices.ts | 25 | 25 | READ_VERIFIED | Via `invoicesApi`: getAll, create, cancel | `orders` (invalidates `['invoices']`) | 3 hooks: `useInvoices(params?)`, `useCreateInvoice`, `useCancelInvoice`. staleTime: 60s |
| 56 | features/items/ItemsPage.tsx | 112 | 112 | READ_VERIFIED | Via `useItems()`, mutations | `items`, `categories` | Full CRUD page. Filters: search, type, category_id, is_active. 4 modals: form, variants, delete. `USE_MOCK=true` in `useItems.ts` so this calls mock data |
| 57 | features/items/api/items.api.ts | 26 | 26 | READ_VERIFIED | `GET /items`, `GET /items/:id`, `POST /items`, `PATCH /items/:id`, `DELETE /items/:id` | `items`: `id,name,type,price,category_id,has_inventory,has_variants,is_active` · `CreateItemDto`: `name,type,price,category_id?,has_inventory?,has_variants?` | ⚠ Missing `operation_type` in `CreateItemDto` — required by backend but absent here. No categories endpoint defined |
| 58 | features/items/components/DeleteItemModal.tsx | 50 | 50 | READ_VERIFIED | None direct | `items`: `name` | Standard delete confirm. Shows `item.name` in message |
| 59 | features/items/components/ItemFilters.tsx | 58 | 58 | READ_VERIFIED | None direct | None | Filters: search, type (product/service/custom), category_id (from list), is_active |
| 60 | features/items/components/ItemFormModal.tsx | 147 | 147 | READ_VERIFIED | None direct | `items`: `name,type,operation_type,price,category_id,has_inventory,has_variants` | `react-hook-form` + `zod`. Includes `operation_type` field (sell/book/repair/rent). Create + edit mode |
| 61 | features/items/components/ItemsTable.tsx | 99 | 99 | READ_VERIFIED | None direct | `items`: `id,name,type,category_name,price,has_variants,is_active,variants[]` | ⚠ Renders `item.category_name` — not in `items.api.ts` Item type (missing field). Table columns: name, type, category, price, variants, status, actions |
| 62 | features/items/components/VariantsModal.tsx | 100 | 100 | READ_VERIFIED | None direct (delegates to parent callbacks) | `item_variants`: `id,name,price_adjustment,sku,stock_quantity,is_active` | Shows existing variants + add new form. Fields: `name,price_adjustment,sku,stock_quantity` |
| 63 | features/items/hooks/use-items.ts | 32 | 32 | READ_VERIFIED | Via `itemsApi`: getAll, create, update, delete | `items` (invalidates) | Thin wrappers. staleTime: 2min. Uses `itemsApi` from `items.api.ts` |
| 64 | features/items/hooks/useItems.ts | 61 | 61 | READ_VERIFIED | Via `itemsApi`: getItems, getCategories, createItem, updateItem, deleteItem, createVariant, deleteVariant | `items`, `categories` | `USE_MOCK = true` (line 7) — **all calls return mock data**. Also calls `itemsApi.getItems('tenant-id')` hardcoding tenant-id. Different API method names than `items.api.ts` (`getItems` vs `getAll`) — two incompatible api clients |
| 65 | features/items/mock/items.mock.ts | 76 | 76 | READ_VERIFIED | None | `items`: `id,tenant_id,name,type,operation_type,price,category_id,category_name,has_inventory,has_variants,is_active,created_at,deleted_at,variants[]` · `item_variants`: `id,item_id,tenant_id,name,price_adjustment,sku,stock_quantity,is_active` · `categories`: `id,tenant_id,name,type,is_active` | Confirms full column set including `category_name` (denormalized join), `operation_type`, `deleted_at` |
| 66 | features/items/types/item.types.ts | 59 | 59 | READ_VERIFIED | None | `items`: `id,tenant_id,name,type,operation_type,price,category_id,category_name?,has_inventory,has_variants,is_active,created_at,deleted_at,variants?[]` · `item_variants`: `id,item_id,tenant_id,name,price_adjustment,sku,stock_quantity,is_active` · `categories`: `id,tenant_id,name,type,is_active` · `CreateItemDTO`: `name,type,operation_type,price,category_id?,has_inventory,has_variants` | Source of truth for frontend Item type |
| 67 | features/orders/api/orders.api.ts | 41 | 41 | READ_VERIFIED | `GET /invoices`, `GET /invoices/:id`, `PATCH /invoices/:id/cancel` | `orders/invoices`: `id,status,payment_method,total,subtotal,discount_amount,tax_amount,created_at,cashier_name,customer_name,items[],notes` | ⚠ Uses **direct `fetch()`** with `localStorage.getItem('access_token')` — NOT using `apiClient`. Inconsistent with other feature APIs. Reads token from localStorage but auth store does NOT persist accessToken to localStorage |
| 68 | features/orders/components/CancelOrderModal.tsx | 64 | 64 | READ_VERIFIED | None direct | `orders`: `id,total` (display only) | Cancel modal with optional reason textarea. Calls `onConfirm(order.id, reason)` |
| 69 | features/orders/components/OrderDetailsModal.tsx | 116 | 116 | READ_VERIFIED | None direct | `orders`: `id,status,payment_method,cashier_name,customer_name,created_at,items[],subtotal,discount_amount,tax_amount,total,notes` · `order_items`: `id,item_name,variant_name,total_price,quantity,unit_price` | Full order detail view with line items. Cancel button shown if `status !== 'cancelled'` |

---

## Key Findings

### ⚠ CRITICAL: Token Access Bug (file 67 — orders.api.ts)
```ts
const token = typeof window !== 'undefined'
  ? localStorage.getItem('access_token')
  : null;
```
Auth store (`auth.store.ts`) explicitly **does NOT persist `accessToken`** to localStorage:
```ts
partialize: (state) => ({
  user: state.user,
  refreshToken: state.refreshToken,
  isAuthenticated: state.isAuthenticated,
  // accessToken لا يُحفظ — يتجدد عبر refresh
})
```
`localStorage.getItem('access_token')` will always return `null`. All orders API calls will be **unauthenticated** (401).

### ⚠ Two Incompatible items hooks (files 63 vs 64)
| Hook File | Mock? | API Method Names |
|-----------|-------|-----------------|
| `use-items.ts` (#63) | No mock | `getAll`, `create`, `update`, `delete` |
| `useItems.ts` (#64) | `USE_MOCK=true` | `getItems`, `createItem`, `updateItem`, `deleteItem`, `createVariant`, `deleteVariant` |

`ItemsPage.tsx` (file #56) imports from `useItems.ts` (#64) → always returns mock data.

### ⚠ Missing `operation_type` in items.api.ts CreateItemDto (file 57)
Frontend `CreateItemDto` in `items.api.ts` has no `operation_type` field.
Backend requires `operation_type` (enum: sell/book/repair/rent). Item creation will fail validation.

### ⚠ `category_name` denormalized in frontend type (file 66)
Frontend `Item` type has `category_name?` (from backend join). Backend's `items.repository.ts` does JOIN `categories(id,name,type)` in `findAll()` — so this field is available but as a nested object, not a flat string. Frontend flattens it.

### Order Columns Confirmed from Frontend (files 68–69)
`Order` object expected by frontend:
```
id, status, payment_method, total, subtotal, discount_amount, tax_amount,
created_at, cashier_name, customer_name (optional), notes,
items: [ { id, item_name, variant_name, total_price, quantity, unit_price } ]
```
Note: `cashier_name` and `customer_name` are resolved names — not IDs. Backend `InvoicesRepository.findAll()` only returns `cashier_id` and `customer_id`, not names.

---

## ⛔ STOPPED — Awaiting confirmation for Batch 7 (files 70–77)
