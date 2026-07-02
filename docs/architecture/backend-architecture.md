# Backend Architecture

*Added: 2026-06-30*
*Note: The mewmd version of this document described Supabase as the "primary backend platform" with no custom application server. That description was incorrect. The actual V1.02 backend is a custom NestJS 11 application hosted on Railway. Supabase is used as the PostgreSQL database via its service-role client — Supabase Auth is NOT used in the backend. This document reflects the actual architecture.*

---

## Overview

The Sefay ERP backend is a **NestJS 11 + TypeScript** application hosted on Railway (project `apiv1.0.2`). It communicates with a Supabase PostgreSQL database via the Supabase service-role client. There is no Supabase Auth in the backend — authentication is handled via custom JWT tokens issued and validated by the NestJS application itself.

The frontend communicates with the backend through authenticated REST API calls to `/api/v1/...` endpoints. No Supabase SDK or Edge Functions are used in the API layer.

**Key infrastructure components:**
- NestJS 11 + TypeScript (strict mode)
- Supabase PostgreSQL (direct service-role client — no Supabase Auth)
- BullMQ + Redis (job queues: dunning, notifications, audit-cleanup, domain-events)
- Stripe / Mock Payment Provider (config-switched via `PAYMENT_PROVIDER` env)
- Resend (email delivery — silent mock mode if `RESEND_API_KEY` unset)
- Winston (structured logging)
- prom-client (Prometheus metrics)

---

## Request Pipeline

Every authenticated request passes through this exact guard order. **This sequence is non-negotiable and must never be changed:**

```
HTTP Request
  → ThrottlerGuard (APP_GUARD — global, rate limits 100/min)
  → IpMiddleware (extracts real IP from x-forwarded-for)
  → JwtAuthGuard (validates Bearer token → sets request.user)
  → TenantGuard (reads user.tenant_id from JWT → sets request.tenantContext)
  → PermissionGuard (@RequirePermission decorator → checks role_permissions table)
  → FeatureGuard (@RequireFeature decorator → resolves feature flags)
  → LoggingInterceptor + MetricsInterceptor + AuditInterceptor
  → Controller → Service → Repository
```

**Rules:**
- `TenantGuard` must never run before `JwtAuthGuard`.
- Do not register `TenantGuard` or `PermissionGuard` as `APP_GUARD`.
- Controllers call services only — no business logic in controllers.
- Services call repositories only — no direct Supabase access outside repositories.

---

## Tenant Isolation — ScopedRepository Pattern

Every DB query must be tenant-scoped. This is enforced by `ScopedRepository` (`core/tenant/scoped.repository.ts`):

- `scopedQuery()` automatically adds `.eq('tenant_id', tenant.tenantId).is('deleted_at', null)`
- `unscopedQuery()` for superadmin only — must be audited
- All UPDATE/DELETE must use double-lock: `.eq('id', id).eq('tenant_id', tenantId)`
- `TenantContext` always comes from JWT — never from request body or params

**Naming:** `tenant_id` is the canonical term used in the deployed schema and all code. `company_id` is a deprecated reference that appears only in some earlier draft architecture documents. Use `tenant_id` everywhere in code. See [`database-architecture.md`](./database-architecture.md) for column naming details.

---

## Service Layer Pattern

Application code does not call the Supabase SDK directly from controllers. All Supabase interactions are encapsulated in repository modules that extend `ScopedRepository`.

Service functions:
- Accept typed DTOs (never `any`)
- Apply all business policies, approval checks, and status workflow transitions
- Call repositories for database operations
- Map domain errors to appropriate HTTP codes
- Do not contain direct Supabase SDK calls

**Data ownership rules:**
- Each domain module owns its database tables exclusively.
- Cross-domain queries only through `shared/tenant-management` or `shared/analytics` modules.
- No direct cross-module table access.
- SuperAdmin is the only cross-domain consumer — only via `AnalyticsService`.
- Operational modules do not query each other's tables.

---

## Engines Layer

`src/engines/` contains framework-agnostic business logic shared between the API and future mobile client.

**Engines are pure TypeScript services — no HTTP, no NestJS imports, no DB access.** They receive data and return results. Controllers must not call engines directly — only Services do.

### Engine Inventory

| Engine | Path | Responsibilities |
|---|---|---|
| **POS Engine** | `src/engines/pos-engine/` | `buildInvoice()`, `calculateSubtotal()`, `applyDiscount()`, `applyTax()`, `calculateTotal()`, `validateInventory()`, `finalizeInvoice()` |
| **Pricing Engine** | `src/engines/pricing-engine/` | `getItemPrice()`, `applyPricingRule()`, `getBranchPrice()`, `getTimeBasedPrice()` |
| **Expense Engine** | `src/engines/expense-engine/` | `createExpenseRequest()`, `approveExpense()`, `rejectExpense()`, `checkExpiry()`, `archiveExpiredRequests()`, `getExpenseSummary()` |
| **Shift Engine** | `src/engines/shift-engine/` | `openShift()`, `closeShift()`, `getCurrentShift()`, `validateNoDoubleShift()`, `calculateShiftSummary()`, `reconcileCash()` |
| **Discount Engine** | `src/engines/discount-engine/` | `validateCoupon()`, `applyCouponDiscount()`, `applyManualDiscount()` |
| **Payment Engine** | `src/engines/payment-engine/` | Payment method processing |
| **Approval Engine** | `src/engines/approval-engine/` | Approval workflow lifecycle |
| **Inventory Engine** | `src/modules/inventory/` | Delegates to PostgreSQL RPC functions (see [`../inventory.md`](../inventory.md)) |
| **Analytics Engine** | `src/modules/shared/analytics/` | Platform-wide analytics (SuperAdmin only) |
| **Printing Engine** | Planned Phase 10 | Document/print designer |

---

## API Design Principles

The conventions governing request/response formats, versioning, error shapes, pagination, filtering, sorting, and tenant isolation are described in detail in [`api-design.md`](./api-design.md).

Key principles:
- Tenant isolation is always implicit from the authenticated session's JWT-derived `tenant_id`. It is never passed as a query parameter or request body field.
- Pagination is required for any endpoint that returns a list that may grow unbounded.
- Error responses follow a consistent structure with a machine-readable `code` and a human-readable `message`.
- All routes are versioned under `/api/v1/`.

---

## Database

PostgreSQL hosted on Supabase, accessed via the Supabase service-role client. The schema, entity catalogue, multi-tenant scoping model, migration strategy, and V2 schema specification are documented in [`database-architecture.md`](./database-architecture.md).

**38 migrations** applied (001–038). Custom TypeScript migration runner (`api/src/database/migrate.ts`) via Supabase Management API.

The Inventory & Purchasing Core uses PostgreSQL RPC functions (PL/pgSQL, `019_inventory_rpc_functions.sql`) as the sole atomicity boundary for all stock mutation operations. See [`../inventory.md`](../inventory.md).

---

## Authentication and Authorization

**Authentication:** Custom JWT issued and validated by the NestJS application. `JwtAuthGuard` validates the Bearer token. Access tokens expire in 15 minutes; refresh tokens rotate with 7-day expiry.

**Note:** Supabase Auth is NOT used. The Supabase client is used only for direct PostgreSQL access.

**Authorization:** Role-based access control (RBAC) with `resource.action.scope` permission strings. The full role/permission system is documented in [`permission-system.md`](./permission-system.md).

**Passport is NOT used.** Authentication is implemented directly with `jsonwebtoken.verify()` inside `JwtAuthGuard`. The previously-existing `JwtStrategy` (Passport) was dead code and has been removed (`jwt.strategy.ts` deleted, `PassportModule` removed from `auth.module.ts`).

Authorization is enforced at two layers:
1. **Application layer** — `PermissionGuard` checks `role_permissions` table before any state-changing operation. Service layer performs additional checks for sensitive operations.
2. **Application layer (defense-in-depth)** — `ScopedRepository` adds `.eq('tenant_id', tenantId)` to every query. **RLS is currently disabled** — see [`security-architecture.md`](./security-architecture.md#row-level-security) for details.

Frontend navigation guards and hidden UI elements are UX conveniences only. They are not security controls. See [`security-architecture.md`](./security-architecture.md).

---

## Feature Flag Resolution Chain

`FeatureFlagsService.resolveFeature(tenantId, featureKey)` checks in this order:
1. `tenant_feature_overrides` table (per-tenant override, nullable = use next)
2. `plan_features` table via tenant's active subscription → plan_id
3. `features` table (global default)

Three tables are involved: `features` → `plan_features` → `tenant_feature_overrides`. SuperAdmin can override per-tenant without code changes.

---

## Billing and Dunning Flow

`BillingService` (core) → `BillingInvoiceService` → `InvoicesRepository` + `PaymentsRepository`

Payment retry flow: `DunningScheduler` (cron every 30 min) → `DunningService.retryPendingAttempts()` → reads `dunning_attempts` table → calls `PaymentProvider.createPayment()`. Max 3 attempts, grace period 3 days, then tenant is suspended.

Payment provider is config-driven: `PAYMENT_PROVIDER=stripe` uses `StripePaymentProvider`; default `mock` uses `MockPaymentProvider`. Both implement `PaymentProvider` interface. The platform is currently in mock payment mode.

---

## Notification System

`NotificationService.notify()` → queues job to BullMQ (`notifications` queue) → `NotificationProcessor` → resolves channel (`email` or `in_app`) from `ChannelRegistry` → `EmailChannel` (Resend) or `InAppChannel` (writes to `notifications` table).

All notification text goes through `I18nService` — never hardcode user-facing strings. Language resolution chain: `user.language → tenant.defaultLanguage → 'en'`.

---

## Queue Infrastructure

Five BullMQ queues with prefix `sefay`:

| Queue | Purpose | Concurrency |
|---|---|---|
| `sefay:ai` | AI job processing (AiProcessor) | 3 (capped — does not compete with other queues) |
| `sefay:dunning` | Payment retry jobs (DunningScheduler, every 30 min) | default |
| `sefay:notifications` | Outbound notification delivery | default |
| `sefay:audit-cleanup` | Periodic audit log retention | default |
| `sefay:domain-events` | Outbox relay for inventory/purchasing events (OutboxRelayScheduler) | default |

**AI queue rules:** Every AI job payload must include `tenant_id` (enforced at TypeScript level by `AiJobData` type). `AiProcessor` records start / complete / fail via `AiUsageTrackingService`. Redis writes are fire-and-forget and do not block job completion.

Redis is a **required** runtime dependency. The API will not boot without it. All queues are registered in `QueueModule`. `QueueRegistry` maps queue names to Queue instances for the SuperAdmin queue management UI.

---

## Storage

File and asset storage is provided by Supabase Storage. Starting with Phase 11 (Storage Abstraction), all storage access will be mediated through the `StorageProvider` interface, making the underlying provider swappable without touching application code.

The full storage architecture — the `StorageProvider` interface, provider adapters, tenant-aware paths, signed URL policies, image optimization, versioning, soft delete, and zero-downtime provider migration — is documented in [`storage-abstraction.md`](./storage-abstraction.md).

Key rule: the frontend never accesses storage directly. All uploads and signed-URL generation are performed server-side. The client receives only the resulting URL.

---

## Error Handling

Errors are handled at the service layer boundary. Raw database/SDK errors are never propagated to the frontend. Service functions catch errors, log them with sufficient context, and throw domain-specific errors that the controller maps to HTTP responses.

| Error Type | HTTP Status |
|---|---|
| Validation failure | 400 (with field-level detail in `details`) |
| Unauthenticated | 401 |
| Unauthorized (wrong role) | 403 |
| Not found or belongs to another tenant | 404 (both return 404 — no information leakage) |
| Business rule conflict | 409 |
| Rate limit exceeded | 429 |
| Unexpected server error | 500 (no internal detail in response body) |

---

## Metrics and Observability

- Prometheus metrics exposed at `GET /api/v1/metrics` (public, no auth)
- `MetricsInterceptor` records every HTTP request duration and count
- `BusinessCollector` refreshes `sefay_active_tenants_total` gauge every 5 minutes from DB
- Structured Winston logs: JSON in production, colored dev format locally
- `AsyncContextService` propagates `requestId`/`correlationId` across async operations via `AsyncLocalStorage`
- System health: `GET /api/v1/superadmin/health` (SuperAdmin auth required)

Every significant operation logs: operation name, entity type, `tenant_id`, `user_id`, entity `id`, and outcome (success or error with code/message on failure). Logs never include PII beyond user ID.

---

## Mandatory Code Rules

1. **No `any`** — TypeScript strict mode in both api and web projects.
2. **No business logic in controllers** — controllers call services only.
3. **No direct Supabase outside repositories** — all DB access goes through `ScopedRepository`.
4. **Engines are pure** — no DB, no NestJS, no HTTP in engines.
5. **Financial records immutable** — no hard delete, no mutation after creation. Reverse transactions only.
6. **Audit required** — `@Audit()` decorator on sensitive operations.
7. **I18n mandatory** — no user-facing text hardcoded. All through `I18nService`.
8. **Soft delete** — `deleted_at` pattern on all sensitive tables. `ScopedRepository` filters automatically.
9. **DTOs required** — every controller method has explicit DTO classes. No plain object parameters.
10. **Guard order mandatory** — `JwtAuthGuard → TenantGuard → PermissionGuard → FeatureGuard`. Never register `TenantGuard` or `PermissionGuard` as `APP_GUARD`.

---

## AI Usage Tracking

`AiUsageTrackingService` (`core/ai-usage/`) records statistics for every AI job in Redis:

```
ai_usage:tenants                          — SET: all tracked tenants
ai_usage:tenant:<id>:jobs                 — SET: job types for this tenant
ai_usage:tenant:<id>:job:<type>           — HASH: count, failCount, totalDurationMs, tokens
```

Writes are fire-and-forget (non-blocking). The module exposes an internal endpoint: `GET /internal/ai-usage?tenant_id=X` for superadmin diagnostics. This module is `@Global()`.

---

## Performance Tracking

`PerfTrackingService` (`core/perf/`) measures request duration per endpoint and stores metrics in Redis under `perf:*`. Uses `SCAN` instead of `KEYS` to avoid blocking. This module is `@Global()`.

---

## Outbox Pattern

Critical domain events are first written to the `outbox_events` table **in the same database transaction** as the business data. A separate `OutboxRelayScheduler` claims events atomically (`fn_claim_outbox_events` RPC), then publishes them to the `sefay:domain-events` BullMQ queue. This guarantees no event is lost if the queue connection fails at the moment of write.

---

## Global Modules

The following modules are `@Global()` and available everywhere without explicit imports:

| Module | Path |
|---|---|
| `RedisCacheModule` | `core/cache/` |
| `CoreAuthModule` | `core/auth/` |
| `MetricsModule` | `core/metrics/` |
| `PerfTrackingModule` | `core/perf/` |
| `AiUsageTrackingModule` | `core/ai-usage/` |
| `LoggerModule` | `core/logger/` |

---

## Future Considerations

- **Phase 13 Manufacturing (deferred)** — Production/manufacturing workflow. Plan at `C:\Users\GAMER2026\.claude\plans\greedy-discovering-patterson.md`. Deferred pending core platform maturity.
- **Posting Engine invariant** — Business modules raise events; Posting Engine consumes events; journal entries are never created outside the Posting Engine. Required for Advanced Accounting (see `docs/future/advanced-accounting.md`).
- **Financial Dimensions** — dimension-tag model (`transaction_dimension_tags`) — unlimited dimension types without schema changes.
- **AI provider integration** — Phase 4 and Phase 8 require a server-side LLM integration. All AI HTTP calls must be server-side (never from the browser). See [`ai-architecture.md`](./ai-architecture.md).
- **Webhooks / Public API** — Phase 10 Document and Print Designer and future integration scenarios may require a versioned public API surface and webhook delivery. See [`api-design.md`](./api-design.md#future-public-api--webhooks).
- **Realtime** — Supabase Realtime is available but not yet used. Phase 5 Smart Alerts and Phase 8 AI Inventory Assistant are the most likely first consumers.
