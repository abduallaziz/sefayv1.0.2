# API Reference — Sefay

*Added: 2026-07-02. Rebuilt 2026-07-02 by direct inspection of all 39 controller files in `C:\Fp\api\src\modules` and `C:\Fp\api\src\core` — every row below is read from the actual `@Controller`/`@Get`/`@Post`/`@Patch`/`@Delete`/`@RequirePermission` decorators, not the prior draft (which had systematic errors — see note at the end).*

Base URL: `https://<railway-app>.up.railway.app` (global prefix `/api/v1` — omitted from paths below for brevity)

All requests (except `/auth/login` and `/auth/register`) require:
```
Authorization: Bearer <jwt>      ← issued by the custom NestJS auth system, not Supabase Auth
```

`tenant_id` is derived from the JWT, never from a header or client parameter — there is no `X-Tenant-ID` header in the current implementation.

---

## Auth — `/auth`

> Rate limit: **10 requests / 60 s per IP** (auth throttler)

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/auth/login` | no permission check |
| POST | `/auth/register` | no permission check |
| POST | `/auth/refresh` | no permission check |
| POST | `/auth/logout` | no permission check (JwtAuthGuard only) |
| GET | `/auth/me` | no permission check (JwtAuthGuard only) |
| GET | `/auth/sessions` | no permission check (JwtAuthGuard only) |
| POST | `/auth/revoke-session` | no permission check (JwtAuthGuard only) |

---

## Users — `/users`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/users` | `users.view` |
| GET | `/users/:id` | `users.view` |
| POST | `/users` | `users.manage` |
| PATCH | `/users/:id` | `users.manage` |
| PATCH | `/users/:id/role` | `users.manage` |
| DELETE | `/users/:id` | `users.manage` |

---

## Branches — `/branches`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/branches` | `branches.view` |
| GET | `/branches/:id` | `branches.view` |
| POST | `/branches` | `branches.manage` |
| PATCH | `/branches/:id` | `branches.manage` |
| DELETE | `/branches/:id` | `branches.manage` |

---

## Items — `/items` and Categories — `/categories`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/items` | `items.view` |
| GET | `/items/:id` | `items.view` |
| POST | `/items` | `items.manage` |
| PATCH | `/items/:id` | `items.manage` |
| DELETE | `/items/:id` | `items.manage` |
| GET | `/items/:itemId/variants` | `items.view` |
| POST | `/items/:itemId/variants` | `items.manage` |
| PATCH | `/items/:itemId/variants/:variantId` | `items.manage` |
| DELETE | `/items/:itemId/variants/:variantId` | `items.manage` |
| GET | `/categories` | `items.view` |
| GET | `/categories/:id` | `items.view` |
| POST | `/categories` | `items.manage` |
| PATCH | `/categories/:id` | `items.manage` |
| DELETE | `/categories/:id` | `items.manage` |

---

## Invoices — `/invoices`

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/invoices` | `invoice.create` |
| GET | `/invoices` | `invoice.view` |
| GET | `/invoices/:id` | `invoice.view` |
| PATCH | `/invoices/:id/cancel` | `invoice.cancel` |

### Query Params — GET `/invoices`
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `per_page` | number | Results per page (default: 50, max: 100) |
| `branch_id` | UUID | Filter by branch |
| `status` | string | `pending`, `completed`, `cancelled` |
| `date_from` | ISO date | From date |
| `date_to` | ISO date | To date |

---

## Customers — `/customers`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/customers/stats` | `customers.view` |
| GET | `/customers` | `customers.view` |
| GET | `/customers/:id` | `customers.view` |
| GET | `/customers/:id/history` | `customers.view` |
| POST | `/customers` | `customers.manage` |
| PATCH | `/customers/:id` | `customers.manage` |
| DELETE | `/customers/:id` | `customers.manage` |

*There is no `GET /customers/:id/stats` — per-customer stats (`orders_count`, `total_spent`, `avg_order`, `last_order_at`) are returned as part of `GET /customers/:id/history`, not a separate endpoint. `GET /customers/stats` (no id) is a tenant-wide stats endpoint, unrelated to a single customer.*

## Customer Field Definitions — `/customer-field-definitions`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/customer-field-definitions` | `customers.view` |
| POST | `/customer-field-definitions` | `customers.manage` |
| PATCH | `/customer-field-definitions/:id` | `customers.manage` |
| DELETE | `/customer-field-definitions/:id` | `customers.manage` |

---

## Expenses — `/expenses`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/expenses/stats` | no permission check |
| GET | `/expenses` | no permission check |
| GET | `/expenses/:id` | no permission check |
| POST | `/expenses` | no permission check (`@Audit('expense.request')` only) |
| PATCH | `/expenses/:id/approve` | no permission check (`@Audit('expense.approve')` only) |
| PATCH | `/expenses/:id/reject` | no permission check (`@Audit('expense.reject')` only) |
| PATCH | `/expenses/:id/cancel` | no permission check (`@Audit('expense.cancel')` only) |

> ⚠️ **Known gap:** `ExpensesController` has `PermissionGuard` applied at the class level but no `@RequirePermission` decorator on any individual route — every route above is reachable by any authenticated user of the tenant regardless of role, including expense approval/rejection. Every comparable CRUD controller in this API (branches, items, customers, etc.) has per-route `@RequirePermission`; this one does not. Flagged for a follow-up fix, not yet remediated as of this writing.

### Query Params — GET `/expenses`
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `per_page` | number | Results per page (default: 50, max: 100) |
| `branch_id` | UUID | Filter by branch |
| `status` | string | `pending`, `approved`, `rejected`, `expired` |
| `from` | ISO date | From date |
| `to` | ISO date | To date |

## Expense Categories — `/expense-categories`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/expense-categories` | `expenses.view` |
| POST | `/expense-categories` | `expenses.manage` |
| PATCH | `/expense-categories/:id` | `expenses.manage` |
| DELETE | `/expense-categories/:id` | `expenses.manage` |

## Expense Templates — `/expense-templates`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/expense-templates` | `expenses.view` |
| POST | `/expense-templates` | `expenses.manage` |
| PATCH | `/expense-templates/:id` | `expenses.manage` |
| DELETE | `/expense-templates/:id` | `expenses.manage` |

---

## Inventory — `/inventory/*`

### Warehouses — `/inventory/warehouses`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/warehouses` | `inventory.view` |
| GET | `/inventory/warehouses/:id` | `inventory.view` |
| POST | `/inventory/warehouses` | `inventory.manage` |
| PATCH | `/inventory/warehouses/:id` | `inventory.manage` |
| DELETE | `/inventory/warehouses/:id` | `inventory.manage` |

### Locations — `/inventory/warehouses/:warehouseId/locations`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/warehouses/:warehouseId/locations` | `inventory.view` |
| GET | `/inventory/warehouses/:warehouseId/locations/:id` | `inventory.view` |
| POST | `/inventory/warehouses/:warehouseId/locations` | `inventory.manage` |
| PATCH | `/inventory/warehouses/:warehouseId/locations/:id` | `inventory.manage` |
| DELETE | `/inventory/warehouses/:warehouseId/locations/:id` | `inventory.manage` |

### Reorder Points — `/inventory/reorder-points`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/reorder-points` | `inventory.view` |
| GET | `/inventory/reorder-points/below-minimum` | `inventory.view` |
| GET | `/inventory/reorder-points/:id` | `inventory.view` |
| POST | `/inventory/reorder-points` | `inventory.manage` |
| PATCH | `/inventory/reorder-points/:id` | `inventory.manage` |
| DELETE | `/inventory/reorder-points/:id` | `inventory.manage` |

### Reservations — `/inventory/reservations`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/reservations` | `inventory.view` |
| GET | `/inventory/reservations/:id` | `inventory.view` |
| POST | `/inventory/reservations` | `inventory.reserve` |
| POST | `/inventory/reservations/:id/release` | `inventory.reserve` |

### Analytics & Reports — `/inventory/analytics`, `/inventory/reports`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/analytics/dashboard` | `inventory.view` |
| GET | `/inventory/reports/overview` | `inventory.view` |

### Stock — `/inventory/stock`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/stock/levels` | `inventory.view` |
| GET | `/inventory/stock/levels/enriched` | `inventory.view` |
| GET | `/inventory/stock/movements/ledger` | `inventory.view` |
| GET | `/inventory/stock/movements` | `inventory.view` |

### Adjustments — `/inventory/adjustments`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/adjustments` | `inventory.view` |
| GET | `/inventory/adjustments/:id` | `inventory.view` |
| POST | `/inventory/adjustments` | `inventory.adjust` |
| POST | `/inventory/adjustments/:id/approve` | `inventory.adjust.approve` |
| POST | `/inventory/adjustments/:id/reject` | `inventory.adjust.approve` |
| POST | `/inventory/adjustments/:id/post` | `inventory.adjust` |

### Counts — `/inventory/counts`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/counts` | `inventory.view` |
| GET | `/inventory/counts/:id` | `inventory.view` |
| POST | `/inventory/counts` | `inventory.count` |
| PATCH | `/inventory/counts/:id/items/:itemId` | `inventory.count` |
| POST | `/inventory/counts/:id/finalize` | `inventory.count` |

### Transfers — `/inventory/transfers`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/transfers` | `inventory.view` |
| GET | `/inventory/transfers/:id` | `inventory.view` |
| POST | `/inventory/transfers` | `inventory.transfer` |
| POST | `/inventory/transfers/:id/dispatch` | `inventory.transfer` |
| POST | `/inventory/transfers/:id/receive` | `inventory.transfer` |
| POST | `/inventory/transfers/:id/cancel` | `inventory.transfer` |

---

## Purchasing — `/purchasing/*`

### Suppliers — `/purchasing/suppliers`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/purchasing/suppliers` | `purchasing.view` |
| GET | `/purchasing/suppliers/:id` | `purchasing.view` |
| GET | `/purchasing/suppliers/:id/profile-stats` | `purchasing.view` |
| POST | `/purchasing/suppliers` | `purchasing.manage` |
| PATCH | `/purchasing/suppliers/:id` | `purchasing.manage` |
| DELETE | `/purchasing/suppliers/:id` | `purchasing.manage` |

### Purchase Orders — `/purchasing/purchase-orders`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/purchasing/purchase-orders` | `purchasing.view` |
| GET | `/purchasing/purchase-orders/:id` | `purchasing.view` |
| POST | `/purchasing/purchase-orders` | `purchasing.manage` |
| PATCH | `/purchasing/purchase-orders/:id` | `purchasing.manage` |
| POST | `/purchasing/purchase-orders/:id/submit` | `purchasing.manage` |
| POST | `/purchasing/purchase-orders/:id/approve` | `purchasing.approve` |
| POST | `/purchasing/purchase-orders/:id/cancel` | `purchasing.manage` |
| DELETE | `/purchasing/purchase-orders/:id` | `purchasing.manage` |

### Goods Receipts — `/purchasing/goods-receipts`
| Method | Endpoint | Permission |
|---|---|---|
| GET | `/purchasing/goods-receipts` | `purchasing.view` |
| GET | `/purchasing/goods-receipts/:id` | `purchasing.view` |
| POST | `/purchasing/goods-receipts` | `purchasing.receive` |
| POST | `/purchasing/goods-receipts/:id/post` | `purchasing.receive` |
| POST | `/purchasing/goods-receipts/:id/cancel` | `purchasing.receive` |

---

## Shifts — `/shifts`

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/shifts/open` | `shift.open` |
| POST | `/shifts/:id/close` | `shift.close` |
| GET | `/shifts` | `shift.view.branch` |
| GET | `/shifts/current` | `shift.view.own` |
| GET | `/shifts/:id/summary` | `shift.view.own` |

---

## Reports — `/reports`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/reports/revenue` | `reports.view.branch` |
| GET | `/reports/shifts` | `reports.view.branch` |
| GET | `/reports/expenses` | `reports.view.branch` |
| GET | `/reports/payments` | `reports.view.branch` |
| GET | `/reports/top-items` | `reports.view.branch` |
| GET | `/reports/recent-activity` | `reports.view.branch` |
| GET | `/reports/sparklines` | `reports.view.branch` |

*There is no `GET /reports/inventory` — inventory reporting lives under `/inventory/reports/overview` and `/inventory/analytics/dashboard` instead (see Inventory section above).*

---

## Notifications — `/notifications`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/notifications` | no permission check (JwtAuthGuard + TenantGuard only) |
| PATCH | `/notifications/:id/read` | no permission check |
| PATCH | `/notifications/read-all` | no permission check |

---

## Payments — `/payments`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/payments` | no permission check (JwtAuthGuard + TenantGuard only) |
| GET | `/payments/invoices` | no permission check |
| GET | `/payments/invoices/:id` | no permission check |
| GET | `/payments/invoices/:id/payments` | no permission check |

---

## Plans — `/plans`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/plans` | no permission check (JwtAuthGuard only, `@SkipTenant`) |
| GET | `/plans/:id` | no permission check |
| POST | `/plans` | no permission check |
| PATCH | `/plans/:id` | no permission check |
| DELETE | `/plans/:id` | no permission check |

## Subscriptions — `/subscriptions`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/subscriptions/current` | no permission check (JwtAuthGuard only) |
| POST | `/subscriptions/upgrade` | no permission check |
| DELETE | `/subscriptions/cancel` | no permission check |

---

## Tenant — `/tenant`

*The controller's actual base path is singular `/tenant`, not `/tenants`.*

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/tenant/profile` | `settings.view` |
| PATCH | `/tenant/profile` | `settings.manage` |
| GET | `/tenant/subscription` | `settings.view` |
| GET | `/tenant/usage` | `settings.view` |
| GET | `/tenant/pos-config` | `invoice.create.own` |

---

## Superadmin — `/superadmin/*`

> Requires `role: superadmin`. `X-Tenant-ID` header does not exist in this system — superadmin cross-tenant access is enforced by role, not by a tenant-override header.

### Core — `/superadmin`
*Guards: `JwtAuthGuard, SuperAdminGuard` only — no `PermissionGuard`/`@RequirePermission` on this controller.*

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/superadmin/stats` | no permission check |
| GET | `/superadmin/reports/revenue` | no permission check |
| GET | `/superadmin/features` | no permission check |
| GET | `/superadmin/tenants` | no permission check |
| GET | `/superadmin/tenants/:id` | no permission check |
| PATCH | `/superadmin/tenants/:id/activate` | no permission check |
| PATCH | `/superadmin/tenants/:id/deactivate` | no permission check |
| PATCH | `/superadmin/tenants/:id/extend-trial` | no permission check |
| DELETE | `/superadmin/tenants/:id` | no permission check |
| GET | `/superadmin/tenants/:id/features` | no permission check |
| GET | `/superadmin/tenants/:id/feature-overrides` | no permission check |
| PATCH | `/superadmin/tenants/:id/features/:featureKey` | no permission check |
| PATCH | `/superadmin/tenants/:id/feature-overrides/:featureKey` | no permission check |

### Analytics — `/superadmin/analytics`
*Class-level permission: `analytics.view.all`.*

| Method | Endpoint |
|---|---|
| GET | `/superadmin/analytics/summary` |
| GET | `/superadmin/analytics/mrr` |
| GET | `/superadmin/analytics/arr` |
| GET | `/superadmin/analytics/mrr/history` |
| GET | `/superadmin/analytics/churn` |
| GET | `/superadmin/analytics/growth` |
| GET | `/superadmin/analytics/funnel` |
| GET | `/superadmin/analytics/cohort` |
| GET | `/superadmin/analytics/revenue-by-plan` |
| GET | `/superadmin/analytics/usage` |

*There is no plain `/superadmin/analytics/revenue` — the endpoint is `revenue-by-plan`.*

### Audit Logs — `/superadmin/audit-logs`
*Class-level permission: `audit.view.all`.*

| Method | Endpoint |
|---|---|
| GET | `/superadmin/audit-logs` |
| GET | `/superadmin/audit-logs/export` |
| GET | `/superadmin/audit-logs/:id` |

### Queues — `/superadmin/queues`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/superadmin/queues` | `superadmin.queue.view` |
| GET | `/superadmin/queues/:name/jobs` | `superadmin.queue.view` |
| GET | `/superadmin/queues/:name/jobs/:jobId` | `superadmin.queue.view` |
| POST | `/superadmin/queues/:name/pause` | `superadmin.queue.manage` |
| POST | `/superadmin/queues/:name/resume` | `superadmin.queue.manage` |
| POST | `/superadmin/queues/:name/jobs/:jobId/retry` | `superadmin.queue.manage` |
| POST | `/superadmin/queues/:name/clean` | `superadmin.queue.manage` |

### Health (protected) — `/superadmin/health`
*Class-level permission: `superadmin.health.view`.*

| Method | Endpoint |
|---|---|
| GET | `/superadmin/health` |
| GET | `/superadmin/health/db` |
| GET | `/superadmin/health/redis` |
| GET | `/superadmin/health/queues` |

### Backup — `/superadmin/backup`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/superadmin/backup/status` | `superadmin.backup.view` |

---

## Public / Internal Endpoints (no tenant context)

| Method | Endpoint | Guard | Notes |
|---|---|---|---|
| GET | `/health` | none | Fully open health check |
| GET | `/metrics` | none (`@Public()`) | Prometheus metrics scrape endpoint |
| POST | `/webhooks/stripe` | none | Protected by manual Stripe signature verification in code, not a NestJS guard |
| GET | `/internal/ai-usage` | JwtAuthGuard only | AI usage statistics |
| GET | `/internal/ai-usage?tenant_id=X` | JwtAuthGuard only | Filter by specific tenant |
| GET | `/internal/perf-metrics` | JwtAuthGuard only | Performance tracking metrics |

---

## Pagination

Most list endpoints accept pagination query parameters:

```
?page=1&per_page=50
```

Response format:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "perPage": 50
}
```

Default: `page=1`, `per_page=50`, max `per_page=100`.

---

## Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

| Code | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Invalid or expired token |
| 403 | Insufficient permission |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting

| Throttler | Limit | Window | Applies To |
|---|---|---|---|
| `global` | 100 req | 60 s | All endpoints, keyed by `tenant:{tenantId}` |
| `auth` | 10 req | 60 s | `/auth/*` only, keyed by IP address |

Storage: Redis (persists across restarts).

---

## Guard Pipeline

Every authenticated, tenant-scoped request passes through:

```
JwtAuthGuard → TenantGuard → PermissionGuard
```

`FeatureGuard` exists as a class (`core/feature-flags/feature.guard.ts`) but is **not currently applied** to any controller in `src/modules` — there is no `@UseGuards(...FeatureGuard)` or equivalent anywhere in the codebase as of this writing. Treat it as unused/dead code for now rather than an active part of the pipeline, despite being described as mandatory in some architecture documents.

See [`architecture/security-architecture.md`](../architecture/security-architecture.md) for full details.

---

## Note on this document's history

An earlier draft of this file (dated 2026-07-02, sourced from `API.md`) contained systematic inaccuracies beyond isolated typos:
- Several resources (`users`, `branches`, `items`, `invoices`, `customers`) were documented with `.create`/`.update`/`.delete` permission suffixes that don't exist — the real permission model uses only `.view`/`.manage` (or resource-specific verbs like `.adjust`, `.approve`, `.receive`) per `permissions.seed.ts`.
- `POST /auth/sessions/revoke` doesn't exist; the real route is `POST /auth/revoke-session`.
- `GET /customers/:id/stats` doesn't exist as a standalone endpoint.
- `GET /reports/inventory` doesn't exist.
- 15+ real endpoints (all of `purchasing/*`, `inventory/warehouses|locations|reorder-points|reservations|analytics|reports`, `customer-field-definitions`, `expense-categories`, `expense-templates`, `/tenant/*`, `/superadmin/queues`) were missing entirely.

This version was rebuilt from direct inspection of all 39 controller files to correct these issues.
