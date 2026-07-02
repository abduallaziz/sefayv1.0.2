# API Reference — Sefay

*Added: 2026-07-02. Source: API.md from V1.02 hardening session.*

Base URL: `https://your-domain.com`

All requests (except `/auth/login` and `/auth/register`) require:
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_uuid>      ← required for non-superadmin
```

---

## Auth — `/auth`

> Rate limit: **10 requests / 60 s per IP** (auth throttler)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Sign in |
| POST | `/auth/register` | Register new account |
| POST | `/auth/refresh` | Renew access token from cookie |
| POST | `/auth/logout` | Sign out + delete cookie |
| GET | `/auth/sessions` | List active sessions |
| POST | `/auth/sessions/revoke` | Revoke a specific session |

### POST `/auth/login`
```json
// Body
{ "email": "user@example.com", "password": "..." }

// Response 200
{
  "access_token": "eyJ...",
  "user": { "id": "...", "email": "...", "role": "owner", "tenant_id": "..." }
}
// + Sets httpOnly cookie: sefay_refresh
```

---

## Users — `/users`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/users` | `users.view` |
| GET | `/users/:id` | `users.view` |
| POST | `/users` | `users.create` |
| PATCH | `/users/:id` | `users.update` |
| DELETE | `/users/:id` | `users.delete` |

---

## Branches — `/branches`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/branches` | `branches.view` |
| POST | `/branches` | `branches.create` |
| PATCH | `/branches/:id` | `branches.update` |
| DELETE | `/branches/:id` | `branches.delete` |

---

## Items — `/items`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/items` | `items.view` |
| GET | `/items/:id` | `items.view` |
| POST | `/items` | `items.create` |
| PATCH | `/items/:id` | `items.update` |
| DELETE | `/items/:id` | `items.delete` |

---

## Invoices — `/invoices`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/invoices` | `invoices.view` |
| GET | `/invoices/:id` | `invoices.view` |
| POST | `/invoices` | `invoices.create` |
| POST | `/invoices/:id/cancel` | `invoices.cancel` |

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
| GET | `/customers` | `customers.view` |
| GET | `/customers/:id` | `customers.view` |
| GET | `/customers/:id/stats` | `customers.view` |
| POST | `/customers` | `customers.create` |
| PATCH | `/customers/:id` | `customers.update` |
| DELETE | `/customers/:id` | `customers.delete` |

### GET `/customers/:id/stats`
```json
{
  "orders_count": 12,
  "total_spent": 4500.00,
  "avg_order": 375,
  "last_order_at": "2025-06-15T10:30:00Z"
}
```

---

## Expenses — `/expenses`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/expenses/stats` | `expenses.view` |
| GET | `/expenses` | `expenses.view` |
| GET | `/expenses/:id` | `expenses.view` |
| POST | `/expenses` | `expenses.create` |
| PATCH | `/expenses/:id/approve` | `expenses.approve` |
| PATCH | `/expenses/:id/reject` | `expenses.approve` |

### Query Params — GET `/expenses`
| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `per_page` | number | Results per page (default: 50, max: 100) |
| `branch_id` | UUID | Filter by branch |
| `status` | string | `pending`, `approved`, `rejected`, `expired` |
| `from` | ISO date | From date |
| `to` | ISO date | To date |

---

## Inventory — `/inventory`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/inventory/stock` | `inventory.view` |
| GET | `/inventory/adjustments` | `inventory.view` |
| POST | `/inventory/adjustments` | `inventory.adjust` |
| GET | `/inventory/transfers` | `inventory.view` |
| POST | `/inventory/transfers` | `inventory.transfer` |
| GET | `/inventory/counts` | `inventory.view` |
| POST | `/inventory/counts` | `inventory.count` |

---

## Purchasing — `/purchasing`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/purchasing/orders` | `purchasing.view` |
| GET | `/purchasing/orders/:id` | `purchasing.view` |
| POST | `/purchasing/orders` | `purchasing.create` |
| PATCH | `/purchasing/orders/:id/receive` | `purchasing.receive` |
| DELETE | `/purchasing/orders/:id` | `purchasing.delete` |

---

## Shifts — `/shifts`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/shifts` | `shifts.view` |
| GET | `/shifts/active` | `shifts.view` |
| POST | `/shifts/open` | `shifts.manage` |
| POST | `/shifts/:id/close` | `shifts.manage` |

---

## Reports — `/reports`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/reports/revenue` | `reports.view` |
| GET | `/reports/expenses` | `reports.view` |
| GET | `/reports/inventory` | `reports.view` |

---

## Notifications — `/notifications`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Current user's notifications |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all as read |

---

## Payments — `/payments`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/payments` | Payment list |
| POST | `/payments` | Record a payment |

---

## Plans & Subscriptions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/plans` | Plan list |
| GET | `/subscriptions/current` | Current subscription |

---

## Superadmin — `/superadmin`

> Requires `role: superadmin`. `X-Tenant-ID` header not required.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/superadmin/analytics` | Platform statistics |
| GET | `/superadmin/analytics/usage` | Per-tenant usage |
| GET | `/superadmin/analytics/revenue` | Revenue report |
| GET | `/superadmin/analytics/mrr` | MRR |
| GET | `/superadmin/analytics/cohort` | Cohort analysis |
| GET | `/superadmin/tenants` | Tenant list |
| GET | `/superadmin/audit-logs` | Audit log |
| GET | `/superadmin/health` | System health |

---

## Internal — `/internal`

> Internal use only.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/internal/ai-usage` | AI usage statistics |
| GET | `/internal/ai-usage?tenant_id=X` | Filter by specific tenant |

---

## Pagination

All list endpoints accept `PaginationDto`:

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

Default: `page=1`, `perPage=50`, max `perPage=100`.

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

Every authenticated request passes through:

```
JwtAuthGuard → TenantGuard → PermissionGuard → FeatureGuard
```

See [`architecture/security-architecture.md`](../architecture/security-architecture.md) for full details.
