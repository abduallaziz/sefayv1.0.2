# API Design

*Added: 2026-06-30*
*Note: This document was originally written in the context of Next.js API routes and Supabase Edge Functions. The actual V1.02 API is a NestJS 11 application on Railway. All API routes are NestJS controllers under `/api/v1/`. There are no Supabase Edge Functions in the current implementation. The conventions in this document apply to the NestJS REST API surface.*

---

## Overview

This document defines the conventions governing all API surfaces in Sefay: request and response formats, versioning, error structures, authentication headers, pagination, filtering, sorting, tenant isolation, and rate limiting. These conventions apply to Next.js API routes, Server Actions, and Supabase Edge Functions alike.

Consistency across the API surface is important not only for the current frontend but for the planned future public API and webhook delivery system (see Future: Public API and Webhooks below). APIs that deviate from these conventions create maintenance debt and client integration problems.

---

## RESTful Conventions

Sefay uses REST conventions for API route design:

- **Resources are nouns, not verbs.** `/api/v1/purchase-orders` not `/api/v1/getPurchaseOrders`.
- **HTTP methods encode intent:** `GET` for reads, `POST` for creates, `PUT`/`PATCH` for updates (`PUT` replaces, `PATCH` updates partially), `DELETE` for deletions.
- **URLs use kebab-case.** Multi-word resource names use hyphens: `/api/v1/goods-receipts` not `/api/v1/goodsReceipts`.
- **Singular resource by ID:** `/api/v1/purchase-orders/{id}` for a specific record.
- **Nested resources for strong ownership:** `/api/v1/purchase-orders/{id}/lines` for the line items belonging to a purchase order.
- **Actions that don't map to CRUD:** use a sub-resource noun for state transitions, e.g. `/api/v1/purchase-orders/{id}/approval` (POST to approve, DELETE to revoke), not `/api/v1/approvePurchaseOrder`.

---

## Versioning Strategy

All API routes are versioned with a `/v1/` prefix in the path. This allows breaking changes to be introduced under `/v2/` without affecting existing clients.

Current version: **v1**.

Versioning applies to:
- Next.js API routes: `app/api/v1/...`
- Supabase Edge Functions: `functions/v1/...`

Server Actions (used for page-local mutations) are not versioned because they are internal to the Next.js application and are not consumed by external clients. If a Server Action evolves into a reusable API endpoint, it is promoted to a versioned route.

A version is deprecated by:
1. Announcing the deprecation date in the API changelog (to be maintained in `docs/reference/`).
2. Adding a `Deprecation` and `Sunset` header to all responses from the deprecated version.
3. Keeping the deprecated version operational until the Sunset date has passed and all known clients have migrated.

---

## Request/Response Format

All requests and responses use `Content-Type: application/json`.

### Request body (POST/PUT/PATCH)

```json
{
  "name": "Warehouse A",
  "location_id": "uuid-here",
  "capacity": 1000
}
```

- `tenant_id` is never included in the request body. It is derived from the authenticated session. See Tenant Isolation below.
- `id` is never included in the request body for create operations. It is assigned by the server.

### Response body (success)

Single resource:

```json
{
  "data": {
    "id": "uuid-here",
    "name": "Warehouse A",
    "tenant_id": "tenant-uuid",
    "created_at": "2026-06-30T08:00:00Z",
    "updated_at": "2026-06-30T08:00:00Z"
  }
}
```

List of resources:

```json
{
  "data": [ ... ],
  "meta": {
    "total": 142,
    "page": 1,
    "pageSize": 25,
    "totalPages": 6
  }
}
```

All timestamps are ISO 8601 UTC strings. All IDs are UUIDs.

---

## Error Format

All error responses use a consistent JSON structure:

```json
{
  "error": {
    "code": "PURCHASE_ORDER_ALREADY_POSTED",
    "message": "This purchase order has already been posted and cannot be modified.",
    "details": {
      "field": "status",
      "value": "posted"
    }
  }
}
```

- `code`: a machine-readable, uppercase, underscore-separated string identifying the error type. Clients use `code` for programmatic error handling, not `message`.
- `message`: a human-readable description of the error. May be localized in a future iteration.
- `details`: optional. Present when additional structured context helps the client (e.g. which field failed validation).

HTTP status codes used:

| Status | Use |
|---|---|
| `200 OK` | Successful read or update. |
| `201 Created` | Successful create. Response body contains the created resource. |
| `204 No Content` | Successful delete. No response body. |
| `400 Bad Request` | Input validation failure. `details` contains field-level error information. |
| `401 Unauthorized` | No valid authentication token. |
| `403 Forbidden` | Authenticated but not authorized for this operation. |
| `404 Not Found` | Resource does not exist or does not belong to the authenticated tenant. Both cases return 404 — the response does not distinguish between them to prevent information leakage. |
| `409 Conflict` | Business rule conflict (e.g. posting a receipt against a cancelled order). |
| `429 Too Many Requests` | Rate limit exceeded. `Retry-After` header present. |
| `500 Internal Server Error` | Unexpected server failure. No internal detail is included in the response body. |

---

## Authentication Headers

All authenticated requests include:

```
Authorization: Bearer <supabase-jwt>
```

The JWT is issued by Supabase Auth. All API routes validate the JWT before executing any logic. An invalid or expired JWT returns `401 Unauthorized`.

Server Actions validate the session through the Supabase server client, which reads the session from the `httpOnly` cookie set by Supabase Auth. No `Authorization` header is needed for Server Action calls from the browser.

---

## Pagination Pattern

Pagination is required for every endpoint that returns a list of resources that may grow unbounded. List endpoints that do not have pagination are considered incomplete until pagination is added.

**Known gap:** As identified in the Phase 2 Inventory UX audit, five Inventory list endpoints — Purchase Orders, Goods Receipts, Transfers, Stock Counts, and Adjustments — currently have no pagination plumbing at all (no `page`/`pageSize` fields in their types, hooks, or API layers). These must be remediated as a data-layer change before the list pages can scale to large datasets.

**Pagination convention:**

Query parameters:
- `page` (integer, 1-indexed, default: 1)
- `pageSize` (integer, default: 25, max: 100)

Response `meta` object:
```json
{
  "total": 142,
  "page": 1,
  "pageSize": 25,
  "totalPages": 6
}
```

Pagination is always server-side (the database returns only the requested page). Client-side pagination over a full dataset fetch is prohibited for lists that may grow large.

---

## Filtering and Sorting Conventions

### Filtering

Filter parameters are passed as query string parameters with the field name as the key:

```
GET /api/v1/purchase-orders?status=pending&supplier_id=uuid-here
```

Date range filters use `_from` and `_to` suffixes:

```
GET /api/v1/movements?created_at_from=2026-01-01&created_at_to=2026-06-30
```

Text search (for search fields) uses `q`:

```
GET /api/v1/products?q=laptop
```

### Sorting

Sorting uses `sort` (field name) and `order` (`asc` or `desc`):

```
GET /api/v1/movements?sort=created_at&order=desc
```

Multi-column sort is not supported in the initial implementation.

---

## Tenant Isolation

Tenant isolation is **always implicit from the authenticated session**. The `tenant_id` associated with the authenticated user's JWT is used to scope every database query. It is never passed as a query parameter, a path segment, or a request body field.

A client that supplies a `tenant_id` in the request body has it silently ignored. The service layer always uses the JWT-derived value.

This means that the same API route serves all tenants — the route does not need to know which tenant it is serving, because the service layer handles scoping automatically.

See [`security-architecture.md`](./security-architecture.md#api-security) for the security implications of this convention.

---

## Rate Limiting

Rate limiting is applied at the NestJS throttler middleware layer (two-tier, Redis-backed):

- **Global throttler:** 100 requests per 60 seconds per tenant (keyed by `tenant:{tenantId}`). *(Earlier drafts of this document stated 1000/min — the correct deployed limit is 100/60s.)*
- **Auth throttler:** 10 requests per 60 seconds per IP address — applied to `/auth/*` only via `@Throttle({ auth: { limit: 10, ttl: 60000 } })` on the Auth controller.
- **Edge Functions:** subject to Supabase Edge Function invocation limits per project tier.
- **AI provider calls:** rate-limited separately at the `AIProvider` layer to avoid exceeding the LLM provider's per-minute token limits. See [`ai-architecture.md`](./ai-architecture.md).

When a rate limit is exceeded, the response is:

```
HTTP 429 Too Many Requests
Retry-After: 30
```

The `Retry-After` header value is in seconds.

---

## Future: Public API and Webhooks

The current API surface is an internal API used exclusively by the Sefay frontend. Future plans (referenced in `docs/future/README.md`) include:

- **Public/external API:** a versioned, publicly documented API that third-party applications can use to integrate with Sefay data (read product catalogues, create purchase orders, query stock levels). This requires an API key management system separate from Supabase Auth JWTs, a stricter rate limiting tier for external callers, and a public API reference document in `docs/reference/`.
- **Webhooks:** event-driven notifications delivered to tenant-configured HTTP endpoints when significant events occur (e.g. a purchase order is approved, a stock level falls below reorder point, an invoice is created). Requires a webhook registry (tenant configures endpoint URLs and selects event types), a delivery queue with retry logic, and a delivery log for debugging.
- **Integration platform:** a broader initiative (see `docs/future/`) that may include pre-built integrations with e-commerce platforms, accounting software, and logistics providers, building on the public API and webhook foundation.

All future public API endpoints must follow the conventions in this document and must be versioned independently of the internal API to allow the internal API to evolve without breaking external integrations.
