# COVERAGE_PHASE_E_BATCH_7.md
# Phase E — web/src — Batch 7/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 8.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 84 / 168 = 50.0% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 70 | features/orders/components/OrderFilters.tsx | 63 | 63 | READ_VERIFIED | None direct | None | Filter controls: search (text), status (completed/pending/cancelled), payment_method (cash/card/split), date_from, date_to |
| 71 | features/orders/components/OrdersTable.tsx | 76 | 76 | READ_VERIFIED | None direct | `orders`: `id,cashier_name,customer_name,total,payment_method,status,created_at` | Shows ID last-6-chars as invoice number. Read-only view, click → details modal |
| 72 | features/orders/hooks/useOrders.ts | 28 | 28 | READ_VERIFIED | **Calls `cancelOrder` from `orders.api.ts`** (PATCH /invoices/:id/cancel). **`useOrders` + `useOrder` use `MOCK_ORDERS` directly** | `orders` (invalidates on cancel) | **`USE_MOCK` hardcoded via `MOCK_ORDERS`** — queryFn returns mock data directly. Comment: "استبدل بـ fetchOrders(filters) عند ربط API" |
| 73 | features/orders/mock/orders.mock.ts | 63 | 63 | READ_VERIFIED | None | `orders`: `id,tenant_id,branch_id,cashier_id,cashier_name,customer_name,shift_id,status,subtotal,discount_amount,tax_amount,total,payment_method,items[],created_at,cancelled_at?,cancelled_by?` · `order_items`: `id,item_id,item_name,quantity,unit_price,total_price` | Confirms full `Order` type with nested items. 3 mock orders (completed/pending/cancelled) |
| 74 | features/orders/pages/OrdersPage.tsx | 101 | 101 | READ_VERIFIED | Via `useOrders()` (mock) + `useCancelOrder()` (real API) | None direct | Client-side filter of mock data. Stats bar: total, completed, pending, cancelled, revenue. Filter fields: status, payment_method, search, date range |
| 75 | features/orders/types/order.types.ts | 44 | 44 | READ_VERIFIED | None | `orders`: `id,tenant_id,branch_id,cashier_id,cashier_name,customer_id?,customer_name?,shift_id,status,subtotal,discount_amount,tax_amount,total,payment_method,notes?,items[],created_at,cancelled_at?,cancelled_by?` · `order_items`: `id,item_id,item_name,variant_id?,variant_name?,quantity,unit_price,total_price` | Full Order type definition. `CancelOrderPayload`: `{ reason? }` |
| 76 | features/pos/components/CartPanel.tsx | 161 | 161 | READ_VERIFIED | None | None | Cart UI — quantity +/−, remove item, discount section (percentage/fixed + coupon code input), totals (subtotal/discount/tax/total), checkout button |
| 77 | features/pos/components/ItemGrid.tsx | 126 | 126 | READ_VERIFIED | **None — 100% hardcoded mock items** | None | **`MOCK_ITEMS` hardcoded inline (8 items)**. No API call. Category filter: all/drinks/food/services/other. Search by name_ar/name. Variant picker modal inline |
| 78 | features/pos/components/PaymentModal.tsx | 130 | 130 | READ_VERIFIED | None direct | None | Payment method selector (cash/card/split). Cash: shows change. Split: cash amount input, calculates card remainder. Card: static message. Confirm button disabled until valid |
| 79 | features/pos/components/ReceiptModal.tsx | 84 | 84 | READ_VERIFIED | None | None | Receipt display after successful payment. Shows: items, subtotal, discount, tax 15% (hardcoded label), total, payment method, change. Print button (no actual print logic). New Order button clears cart |
| 80 | features/pos/hooks/useCart.ts | 88 | 88 | READ_VERIFIED | None | None | Pure client-side cart state. `TAX_RATE = 0.15` (hardcoded). Functions: addItem, removeItem, updateQty, applyDiscount (percentage/fixed), clearCart. CartItem id = `${item.id}_${variant.id}` for variants |
| 81 | features/pos/page/POSPage.tsx | 58 | 58 | READ_VERIFIED | **None — no API calls** | None | Renders ItemGrid + CartPanel side by side. PaymentModal + ReceiptModal. Invoice number = `INV-${Date.now().slice(-6)}` — **client-generated, not from backend**. No POST to `/invoices` |
| 82 | features/shifts/types.ts | 31 | 31 | READ_VERIFIED | None | `shifts`: `id,tenant_id,branch_id,cashier_id,cashier_name?,status,opening_cash,closing_cash,expected_cash,discrepancy,opened_at,closed_at` · `OpenShiftDto`: `opening_cash,branch_id` · `CloseShiftDto`: `closing_cash` | Core type definitions for shifts feature |
| 83 | features/shifts/api/shifts.api.ts | 14 | 14 | READ_VERIFIED | `GET /shifts/current`, `GET /shifts`, `GET /shifts/:id/summary`, `POST /shifts/open`, `POST /shifts/:id/close` | `shifts`: open/close/summary | Uses `apiClient`. 5 endpoints. All use correct backend paths |
| 84 | features/shifts/components/CloseShiftModal.tsx | 64 | 64 | READ_VERIFIED | Via parent callback (closes shift) | `shifts`: `closing_cash` | Modal with closing_cash input. Shows shift info. Validation: closing_cash > 0 |

---

## Key Findings

### ⚠ POS Page makes NO API calls (file 81)
`POSPage.tsx` is entirely client-side:
- Items loaded from `MOCK_ITEMS` hardcoded in `ItemGrid.tsx` (line 10–19)
- Payment confirmation does NOT call `POST /invoices`
- Invoice number generated client-side: `INV-${Date.now().slice(-6)}`
- No shift_id attached to the "invoice" (there is no invoice created)
- Cart state is in-memory only (lost on page refresh)

### ⚠ Orders page uses mock data (file 72)
`useOrders` + `useOrder` return `MOCK_ORDERS` directly. Only `cancelOrder` mutation calls the real API. After cancel mutation succeeds, `invalidateQueries(['orders'])` is called — but since `useOrders` returns mock data, the UI doesn't actually refresh from the backend.

### Order Type Has More Fields Than Backend Returns (files 73, 75)
Frontend `Order` type includes: `cashier_name`, `customer_name`, `shift_id`, `discount_amount`, `cancelled_at`, `cancelled_by`, `items[]` (nested).

Backend `InvoicesRepository.findAll()` returns: `id, status, subtotal, discount, tax, total, payment_method, notes, created_at, cashier_id, customer_id, branch_id` — **no nested items, no names, different column name: `discount` not `discount_amount`**.

### TAX_RATE Hardcoded at 15% (file 80)
`useCart.ts` line 4: `const TAX_RATE = 0.15` — hardcoded. Not configurable per tenant.

### shifts.api.ts is Clean (file 83)
Only module in orders/shifts area where API calls are properly wired via `apiClient` with correct paths matching backend controllers. No mock data.

### Shift Close uses POST not PATCH (file 83)
`shiftsApi.close()` uses `apiClient.post('/shifts/:id/close', dto)`.
Backend `ShiftsController` uses `@Post(':id/close')` — matches correctly.

---

## ⛔ STOPPED — Awaiting confirmation for Batch 8 (files 85–92)
