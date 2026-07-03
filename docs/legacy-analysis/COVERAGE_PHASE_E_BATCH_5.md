# COVERAGE_PHASE_E_BATCH_5.md
# Phase E — web/src — Batch 5/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 6.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 54 / 168 = 32.1% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 40 | features/customers/hooks/useCustomers.ts | 41 | 41 | READ_VERIFIED | Via `customersApi`: getAll, getById, getHistory, getStats, create, update, delete | `customers`: invalidates `['customers']` on mutations | TanStack Query hooks. All mutations invalidate `['customers']` queryKey |
| 41 | features/customers/mock/customers.mock.ts | 94 | 94 | READ_VERIFIED | None | `customers`: `id,tenant_id,name,phone,email,loyalty_points,created_at,deleted_at,total_orders,total_spent` · `orders` (history): `id,created_at,total,status,payment_method,items_count` · `CustomerStats`: `total,new_this_month,total_loyalty_points` | Mock data only — confirms actual column names expected from API. Note: `total_orders` and `total_spent` present in mock. `CustomerStats.total_loyalty_points` expected |
| 42 | features/customers/pages/CustomersPage.tsx | 174 | 174 | READ_VERIFIED | Via hooks: getAll, getStats, create, update, delete | None direct | Full CRUD page. Client-side filter/sort via `useMemo`. Modals: form, details, delete. Sorting by: `created_at`, `name`, `loyalty_points`, `total_spent` |
| 43 | features/customers/types/customer.types.ts | 42 | 42 | READ_VERIFIED | None | `customers`: `id,tenant_id,name,phone,email,loyalty_points,created_at,deleted_at,orders_count?,total_spent?,avg_order?,last_order_at?` · `CreateCustomerDto`: `name,phone,email?` · `UpdateCustomerDto`: `name?,phone?,email?` | ⚠ Type uses `orders_count` (not `total_orders` as in mock). Inconsistency between types file and mock data |
| 44 | features/dashboard/components/DashboardHeader.tsx | 68 | 68 | READ_VERIFIED | None | None | Locale switcher (ar/en toggle). Notification bell (hardcoded count=3). Open shift indicator (always shows "open" — hardcoded). Search input (not wired to any API) |
| 45 | features/dashboard/components/DashboardLayout.tsx | 53 | 53 | READ_VERIFIED | None direct | None | Uses `useTenantAuth()` as auth guard. Returns null if not authenticated. Mobile sidebar overlay. Renders: DashboardSidebar + DashboardHeader + `children` |
| 46 | features/dashboard/components/DashboardSidebar.tsx | 104 | 104 | READ_VERIFIED | None direct | None | Renders `NAV_CONFIG` items. Each item checked for: `permission` (via `usePermission`), `feature` (via `useFeature`), `roles` (via `useRole`). Items hidden if guard fails. Branch selector (hardcoded "mainBranch"). Logout via `clearAuth()` only (no API call) |
| 47 | features/dashboard/config/nav.config.ts | 119 | 119 | READ_VERIFIED | None | None | **Permission/Feature gates per nav item:**  `pos` → `invoice.create.own` + feature:`pos` · `invoices` → `invoice.view.own` · `items` → `items.manage` · `shifts` → `shift.view.own` · `expenses` → `expense.request` · `users` → `users.manage` + roles:`[owner,manager]` · `reports` → `reports.view.branch` · `settings` → roles:`[owner]` |
| 48 | features/dashboard/expenses/page.tsx | 58 | 58 | READ_VERIFIED | Via `useExpenseStats()` | `expenses`: `pending,approved_today,total_today,expired` (stats shape) | Stats display: pending, approved_today, total_today (SAR), expired. Tabs: requests / templates |
| 49 | features/dashboard/expenses/api/expenses.api.ts | 54 | 54 | READ_VERIFIED | `GET /expenses`, `GET /expenses/templates`, `GET /expenses/stats`, `POST /expenses`, `PATCH /expenses/:id/approve`, `PATCH /expenses/:id/reject`, `POST /expenses/templates`, `PATCH /expenses/templates/:id`, `DELETE /expenses/templates/:id` | `expenses`: `id,template_id,template_name,requested_by,amount,note,photo_url,status,expires_at,created_at,resolved_at` · `expense_templates`: `id,name,default_amount,requires_photo,expiry_hours,is_active` | ⚠ `GET /expenses/templates` → should be `GET /expense-templates` (backend controller uses `/expense-templates` prefix). ⚠ `ExpenseStatsResult` expects: `pending,approved_today,total_today,expired` — but backend `getStats()` returns: `total_count,total_amount,approved_count,approved_amount,pending_count,pending_amount,rejected_count,rejected_amount` |
| 50 | features/dashboard/expenses/components/ExpenseRequestsList.tsx | 155 | 155 | READ_VERIFIED | Via `useExpenses()`, `useApproveExpense()`, `useRejectExpense()` | `expenses`: `id,template_name,requested_by,amount,note,status,expires_at` | Columns: type, requested_by, amount, note, expiry, status badge, approve/reject actions. Actions only shown for `status==='pending'`. Reject opens modal with reason textarea |
| 51 | features/dashboard/expenses/components/ExpenseTemplatesList.tsx | 180 | 180 | READ_VERIFIED | Via `useExpenseTemplates()`, `useCreateTemplate()`, `useUpdateTemplate()` | `expense_templates`: `id,name,default_amount,requires_photo,expiry_hours,is_active` | Columns: name, default_amount, requires_photo, expiry_hours, is_active, toggle button. Create template modal. Toggle active/inactive |
| 52 | features/dashboard/expenses/hooks/useExpenses.ts | 57 | 57 | READ_VERIFIED | Via `expensesApi`: getAll, getTemplates, getStats, create, approve, reject, createTemplate, updateTemplate, deleteTemplate | None direct | Query keys: `['expenses']`, `['expenses','templates']`, `['expenses','stats']`. 7 mutations total |
| 53 | features/dashboard/pages/DashboardOverview.tsx | 45 | 45 | READ_VERIFIED | None | None | **All data is hardcoded/mock** — no API calls. Stats: `2,480 SAR`, `34` invoices, `28` customers, `6h` shift. Sales chart and recent invoices show `"Coming soon"` placeholder |
| 54 | features/invoices/api/invoices.api.ts | 39 | 39 | READ_VERIFIED | `GET /invoices`, `GET /invoices/:id`, `POST /invoices`, `PATCH /invoices/:id/cancel` | `invoices/orders`: `id,status,subtotal,discount_amount,tax_amount,total,payment_method,created_at` · `CreateInvoiceDto`: `branch_id,shift_id,customer_id?,items[],payment_method,discount_amount?,tendered_amount?,notes?` | ⚠ `CreateInvoiceDto` includes `branch_id` and `shift_id` at top level. Backend `CreateInvoiceDto` gets these from headers (`x-branch-id`, `x-shift-id`), not from request body |

---

## Key Findings

### ⚠ CRITICAL: Expenses API Mismatch (file 49)
**Frontend calls:** `GET /expenses/templates`
**Backend route:** `GET /expense-templates` (controller prefix is `/expense-templates`, not `/expenses/templates`)
All template reads in the frontend will return 404.

### ⚠ CRITICAL: Expense Stats Shape Mismatch (file 49)
Frontend expects from `GET /expenses/stats`:
```ts
{ pending: number, approved_today: number, total_today: number, expired: number }
```
Backend `ExpensesService.getStats()` returns:
```ts
{ total_count, total_amount, approved_count, approved_amount, pending_count, pending_amount, rejected_count, rejected_amount }
```
Fields `approved_today`, `total_today`, `expired` are **not returned by the backend**.

### ⚠ CRITICAL: Invoice CreateDto — body vs headers (file 54)
Frontend sends `branch_id` and `shift_id` in the **request body**.
Backend reads `branch_id` from `x-branch-id` header and `shift_id` from `x-shift-id` header.
Invoice creation will fail silently — backend will receive `branch_id=undefined`, `shift_id=undefined`.

### ⚠ Type Inconsistency — Customer (files 41 vs 43)
- `customer.types.ts` (file 43): uses `orders_count`
- `customers.mock.ts` (file 41): uses `total_orders`
Both also differ on: mock has `total_spent` as top-level; type has `total_spent` as optional

### Dashboard Overview is 100% Mock (file 53)
`DashboardOverview.tsx` has no API calls — all stats hardcoded. Charts show "Coming soon".

### NAV_CONFIG Permission Gates (file 47)
Confirmed permissions required per nav item:
| Route | Permission | Feature |
|-------|-----------|---------|
| `/dashboard/pos` | `invoice.create.own` | `pos` |
| `/dashboard/orders` | `invoice.view.own` | — |
| `/dashboard/items` | `items.manage` | — |
| `/dashboard/shifts` | `shift.view.own` | — |
| `/dashboard/expenses` | `expense.request` | — |
| `/dashboard/users` | `users.manage` | roles: owner, manager |
| `/dashboard/reports` | `reports.view.branch` | — |
| `/dashboard/settings` | — | roles: owner |

---

## ⛔ STOPPED — Awaiting confirmation for Batch 6 (files 55–62)
