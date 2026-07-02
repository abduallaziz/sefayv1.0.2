# Security Architecture

*Added: 2026-06-30*

---

## Overview

Security in Sefay is layered: the database enforces tenant isolation and access policies independent of the application, the application layer enforces role-based authorization, and the frontend provides UX gating that improves usability but is not a security boundary. No single layer is relied upon alone. A failure or bypass in the application layer must not expose another tenant's data, because the database layer enforces isolation independently.

This document covers authentication, role-based authorization, Row-Level Security, API security, storage security, input validation, XSS and CSRF prevention, audit trail, compliance considerations, and future AI data-privacy requirements.

---

## Authentication

Authentication is handled by a **custom NestJS JWT implementation** (not Supabase Auth). Users authenticate via `POST /api/v1/auth/login` or `POST /api/v1/auth/register`. On successful authentication, the NestJS application issues a JWT that:

- Is signed with `JWT_SECRET` (minimum 32 characters, configured in Railway environment variables).
- Encodes the user's `id`, `tenant_id`, `role`, `language`, and business activity context.
- **Access token expiry:** 15 minutes.
- **Refresh token expiry:** 7 days with Refresh Token Rotation.

The JWT is included in all API requests via the `Authorization: Bearer <token>` header. `JwtAuthGuard` validates this token for every request before any business logic executes.

**Session invalidation note:** If `JWT_SECRET` is changed or rotated, all active sessions across all tenants are immediately invalidated. Every user is logged out and must log in again. See [RUNBOOK.md](../RUNBOOK.md#111-jwtsecret-rotation) for rotation procedure.

Sessions are managed by the frontend via TanStack Query and token refresh logic.

> ⚠️ **Known Bug (C-05 — audit July 2026):** The current frontend (`auth.store.ts` with Zustand `persist`) stores **both** `accessToken` and `refreshToken` in `localStorage`. This contradicts the intended design and is a confirmed security risk — any XSS anywhere in the app can steal the full session including the 7-day refresh token. **Required fix:** refresh token must move to an httpOnly cookie; access token must stay in Zustand memory only (not persisted to localStorage).

**Intended design:** access token in Zustand memory only (never persisted). Refresh token in httpOnly cookie (`sefay_refresh`) — never accessible to JavaScript.

---

## Authorization / Roles

Sefay defines the following roles (plus `superadmin` for platform operations):

| Role | Description |
|---|---|
| **Owner** | The company's primary account holder. Has all permissions including those that affect the company's existence (factory reset, subscription management). There is exactly one Owner per company. |
| **manager** | Company-level admin. Broad operational access across all business modules. Cannot perform Owner-only operations. |
| **cashier** | Restricted to point-of-sale operations. Access to sales and customer-facing workflows only. |
| **inventory** | Inventory management. Can view/adjust/transfer/count/reserve stock; can manage and receive purchase orders but cannot approve them. |
| **accountant** | Read access to financial reports and accounts. Cannot perform write operations on most business data. |
| **viewer** | Read-only access across the platform. |
| **superadmin** | Platform operator. Cross-tenant access. Only via shared analytics/tenant-management modules. |

*Note: Earlier versions of this document used the role names `Admin`, `Employee`, and `inventory_clerk`. These map to `manager`, `cashier/viewer`, and `inventory` respectively in the current SECURITY.md. The `role_permissions` table is the authoritative source — see `src/database/seeds/permissions.seed.ts`.*

For the full capability matrix, see [`permission-system.md`](./permission-system.md).

---

## Guard Pipeline

The exact guard order is non-negotiable:

```
JwtAuthGuard → TenantGuard → PermissionGuard → FeatureGuard
```

- `TenantGuard` reads `tenant_id` from the validated JWT and sets `request.tenantContext`.
- `PermissionGuard` checks the `role_permissions` table using the `@RequirePermission` decorator.
- `FeatureGuard` resolves feature flags using the three-table resolution chain.
- `TenantGuard` and `PermissionGuard` must never be registered as `APP_GUARD`.

---

## Row-Level Security

**Current V1.02 state:** RLS is **disabled** on all tenant data tables. The Supabase client uses the `service_role` key, which bypasses RLS entirely. Tenant isolation is enforced exclusively in the application layer via `ScopedRepository`, which adds `.eq('tenant_id', tenantId)` to every query.

This is a **deliberate design decision** for the current stage (small tenant count, controlled codebase). The application layer is the sole isolation boundary. A bug that omits the `tenant_id` filter in a repository method would be a direct data leak with no database backstop.

**Hardening intent:** RLS policies should be enabled on all tenant data tables before the platform scales beyond a controlled environment. Enabling RLS requires switching from `service_role` to an anon/user-scoped client, or using RLS with `service_role` and explicit `SET LOCAL role` per-request. This is a planned hardening step, not yet implemented.

**Mitigation until RLS is enabled:**
- All DB access goes through `ScopedRepository` — direct Supabase calls outside repositories are prohibited.
- Code review must verify every new repository method includes the `tenant_id` filter.
- `unscopedQuery()` is available superadmin-only and must be explicitly audited on each use.

---

## API Security

- All API endpoints require an authenticated JWT. Unauthenticated requests are rejected at the boundary with a `401 Unauthorized` response before any business logic executes.
- **Rate limiting (two-tier):**
  - `global` throttler: 100 req / 60 s — applied to all endpoints, keyed by `tenant:{tenantId}`.
  - `auth` throttler: 10 req / 60 s — applied to `/auth/*` only, keyed by IP address. Configured via `@Throttle({ auth: { limit: 10, ttl: 60000 } })` on the Auth controller. Storage: Redis (persists across restarts).
- Role authorization is checked inside the service layer before any state-changing operation. For example, the Company Factory Reset endpoint verifies that the caller holds the Owner role before proceeding — even if the frontend hides the button from non-Owner users.
- Tenant isolation in queries is implicit: the `tenant_id` is always read from the authenticated JWT, never from a client-supplied query parameter or request body. A client that supplies a `tenant_id` in the request body is silently ignored at the service layer; the JWT-derived value is authoritative.
- Sensitive operations (factory reset, user deletion, subscription changes) require re-authentication (re-entry of the user's password) immediately before execution.
- All UPDATE/DELETE operations use a double-lock pattern: `.eq('id', id).eq('tenant_id', tenantId)` — ensuring a row can never be mutated by a tenant who does not own it, even if the application-layer scoping fails.

---

## Storage Security

All asset access is mediated through signed (time-limited) URLs. Assets are never served from public-permanent URLs in production.

- **Signed URLs are generated server-side only.** The client never receives storage credentials (access keys, service role keys, or presigned request parameters). The client receives only the resolved signed URL.
- **Default expiry:** 15 minutes for inline preview; 60 minutes for print/PDF download contexts.
- **Tenant-scoped paths:** every asset path is prefixed with the tenant's `tenant_id` (e.g. `{tenant_id}/branding/logo.png`). The `buildStoragePath()` helper enforces this; path construction is never done by inline string concatenation at call sites.
- **No cross-tenant URL construction:** because `tenant_id` is always read from the authenticated session (never from a client parameter) when generating signed URLs, a user from one tenant cannot construct a valid signed URL for another tenant's asset.

See [`storage-abstraction.md`](./storage-abstraction.md) for the full storage security design, including CDN-layer signing and the provider-switching invariant.

---

## Input Validation

Input is validated at two layers:

1. **Frontend (immediate feedback):** Form fields validate on blur or on submit, providing immediate user feedback without a round-trip. This is a UX feature only.
2. **Backend (authoritative gate):** DTOs with class-validator decorators validate all incoming data before any database operation. A request that passes frontend validation but fails backend DTO validation is rejected cleanly with a 400 response. The backend is the only authoritative validation layer.

Specific validation rules:
- **VAT Number** (Phase 9, Company Information): validated against the Saudi 15-digit format starting with "3" and ending with "3" before storage.
- **Barcode format** (Phase 3): validated against the declared barcode type (EAN-13 check digit, GS1-128 AI structure, etc.) on import and scan resolution.
- **Quantity fields**: always validated as non-negative numbers; negative quantities must use signed adjustment records with explicit reason codes, not negative quantity values on standard fields.
- **Phone validation**: validated during registration (`POST /auth/register`).
- **Startup validation**: Joi-based env var validation (`env.validation.ts`) refuses to boot if required variables are missing or malformed.

---

## XSS and CSRF Prevention

- **XSS:** React's JSX rendering escapes all dynamic string values by default. The application does not use `dangerouslySetInnerHTML`. Content from user input or external sources (product names, customer names, descriptions) is rendered as text, not as HTML.
- **CSRF:** The NestJS backend validates the `Origin` header and CORS configuration restricts requests to the configured `FRONTEND_URL`. The Supabase client library's session management uses secure patterns.
- **Content Security Policy:** A strict CSP header should be configured in `next.config.ts` to restrict script sources to known origins. This is a planned hardening step, not yet confirmed as implemented.

---

## Audit Trail

Every significant state change on business entities creates an audit record:

- Stock-affecting events are recorded in the immutable `stock_movements` ledger (triggers block `UPDATE`/`DELETE` outright).
- Non-stock state transitions (approval events, user management actions, configuration changes) are recorded in audit log tables with `actor_id`, `action`, `old_value`, `new_value`, and `created_at`.
- `@Audit()` decorator is required on sensitive operations. See rules.md for the required list.
- Audit records are never deleted, even during a company factory reset. The history of the reset itself is retained for support and compliance purposes. (The final decision on this point must be made before the factory reset feature is implemented — it is an open question in `TASKS.md`.)
- The `audit-cleanup` BullMQ queue handles periodic audit log retention according to the configured retention window.

---

## Compliance Considerations

### ZATCA (Saudi e-Invoicing)

Phase 9 (Company Branding and Information) and Phase 10 (Document and Print Designer) intersect with Saudi ZATCA (Zakat, Tax and Customs Authority) e-invoicing requirements:

- **QR Code on simplified tax invoices:** ZATCA Phase 2 specifies a regulated QR code payload encoding seller name, VAT number, invoice date, and VAT/total amounts. The QR code format and encoding are regulatory requirements, not design choices. Implementation must be validated against the current ZATCA technical specifications before shipping.
- **VAT Number validation:** the `vat_number` field in the company information model must be validated against the Saudi 15-digit format starting with "3" and ending with "3".
- **Invoice data retention:** ZATCA requires invoices to be retained for a minimum period. The soft-delete and retention policy in the storage abstraction layer must account for this minimum retention period before allowing permanent deletion of invoice documents.

### GDPR Note

If Sefay is deployed for companies operating in or serving customers in the European Union, GDPR obligations apply to the personal data stored in the `customers`, `users`, and related tables. Key implications:

- A right-to-erasure request for a customer requires a defined policy for how customer records are handled when they appear on historical invoices (which may need to be retained for tax purposes). Pseudonymization of the customer reference on archived invoices is a common approach.
- Data processor agreements may be required between the tenant (data controller) and Sefay (data processor).
- These obligations are not yet implemented; they are noted here so they are not overlooked when the platform expands to EU-regulated markets.

---

## Session Security

- Every `device_session` is linked to both `user_id` and `tenant_id`.
- `revokeSession()` enforces `.eq('tenant_id', tenantId)` for non-superadmin callers — a user cannot revoke a session belonging to a different tenant even if they know the session UUID. *(Fix applied: previously only `session_id` was checked — any authenticated user knowing a UUID could revoke another tenant's session.)*
- Superadmin can revoke any session cross-tenant.
- `refresh_tokens` are single-use (rotation on every refresh).
- Refresh tokens are stored in an httpOnly cookie (`sefay_refresh`), never in localStorage or memory accessible to JavaScript.

---

## Financial Record Immutability

Financial records (invoices, payments, stock movements, cost layers, domain events) are immutable:
- No hard deletes on financial records.
- No mutations after creation.
- Corrections are implemented as reverse transactions (a new record that offsets the original), never as overwrites.
- `stock_movements` has database-level immutability enforced by triggers.
- This is enforced by architecture and code rule — see [backend-architecture.md](./backend-architecture.md#mandatory-code-rules).

---

## Owner Self-Service Security

The Owner role has access to operations that affect the company's existence (factory reset, subscription management). Rules:
- Owner identity is validated from the JWT — never from request body or params.
- The Company Factory Reset requires a multi-step confirmation flow: warning modal → type `RESET MY COMPANY` → re-enter password.
- A stolen session token alone is insufficient to trigger a factory reset.
- Owner self-service operations are scoped by `tenant_id` from JWT at all times.

---

## Future: AI Security and Data Privacy

When AI features are introduced (Phase 4 AI-assisted product creation, Phase 8 AI Inventory Assistant), a mandatory data-privacy review must occur before any tenant data is sent to an external LLM provider:

- **What data is sent:** only the minimum required for the AI task. For AI-assisted product creation, this is the scanned barcode and an optional product photo — not the full product catalogue or order history.
- **What is never auto-saved:** AI output (suggested product name, category, description) is always presented to the user for review and explicit confirmation before saving. The system never auto-saves AI suggestions.
- **Provider selection:** the choice of LLM provider (and the data processing terms of that provider's API) must be reviewed against Sefay's tenant agreements before the integration goes live.
- **Tenant data in prompts:** natural-language inventory queries (Phase 8) require sending context about the tenant's data to the LLM. The privacy review must define what context is permissible, and the `AIProvider` interface must include a data-minimization mechanism. See [`ai-architecture.md`](./ai-architecture.md).
