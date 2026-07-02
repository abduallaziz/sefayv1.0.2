# Security Architecture

*Added: 2026-06-30*

---

## Overview

Security in Sefay is layered: the database enforces tenant isolation and access policies independent of the application, the application layer enforces role-based authorization, and the frontend provides UX gating that improves usability but is not a security boundary. No single layer is relied upon alone. A failure or bypass in the application layer must not expose another tenant's data, because the database layer enforces isolation independently.

This document covers authentication, role-based authorization, Row-Level Security, API security, storage security, input validation, XSS and CSRF prevention, audit trail, compliance considerations, and future AI data-privacy requirements.

---

## Authentication

Authentication is handled by **Supabase Auth**. Users authenticate through the Supabase Auth flow (email/password or SSO as configured). On successful authentication, Supabase issues a **JWT** (JSON Web Token) that:

- Is signed with the Supabase project's JWT secret.
- Encodes the user's `sub` (user ID), `email`, and any custom claims (including `company_id` and `role`).
- Has a configurable expiry (default: 1 hour for access tokens, with a refresh token for renewal).

The JWT is included in all API requests via the `Authorization: Bearer <token>` header. Supabase evaluates this JWT for every database query to determine the identity of the caller and apply the appropriate RLS policies.

Sessions are managed by the Supabase client library. The frontend never stores the JWT in `localStorage` in a production deployment — Supabase's recommended approach uses `httpOnly` cookies for secure token storage.

---

## Authorization / Roles

Sefay defines four roles:

| Role | Description |
|---|---|
| **Owner** | The company's primary account holder. Has all permissions including those that affect the company's existence (factory reset, subscription management). There is exactly one Owner per company. |
| **Admin** | A company administrator. Has broad operational permissions across all modules but cannot perform Owner-only operations. |
| **Employee** | A standard operational user. Can perform day-to-day inventory and sales operations within their assigned scope. |
| **Cashier** | A restricted role intended for point-of-sale operations. Has access to sales and customer-facing workflows only. |

For the full capability matrix, see [`permission-system.md`](./permission-system.md).

---

## Row-Level Security

Row-Level Security (RLS) is the primary mechanism for multi-tenant data isolation in Supabase/PostgreSQL. Every table containing tenant data has RLS enabled with policies that enforce:

1. **Tenant isolation** — users can only read and write rows where `company_id` matches the `company_id` encoded in their JWT. A user from company A cannot access any row belonging to company B, regardless of what query they submit.
2. **Role-based write restrictions** (where applicable) — certain tables may have RLS policies that restrict write access to specific roles (e.g. only the Owner role can delete a company record).

RLS policies are the authoritative security boundary. Application-layer `WHERE company_id = ?` filters add defense-in-depth but are not the primary control. Even if a bug in the application layer omits the company_id filter from a query, the RLS policy prevents cross-tenant data leakage.

New tables must have RLS enabled by default before they are deployed. A table without RLS that contains tenant data is a security vulnerability.

---

## API Security

- All API endpoints (Next.js API routes, Server Actions, Supabase Edge Functions) require an authenticated JWT. Unauthenticated requests are rejected at the boundary with a `401 Unauthorized` response before any business logic executes.
- Role authorization is checked inside the endpoint before any state-changing operation. For example, the Company Factory Reset endpoint verifies that the caller holds the Owner role before proceeding — even though the frontend hides the button from non-Owner users.
- Tenant isolation in query parameters is implicit: the `company_id` is always read from the authenticated JWT, never from a client-supplied query parameter or request body. A client that supplies a different `company_id` in the request body is ignored at the service layer; the JWT-derived value is authoritative. See [`api-design.md`](./api-design.md#tenant-isolation).
- Sensitive operations (factory reset, user deletion, subscription changes) are subject to re-authentication (re-entry of the user's password) immediately before execution, as described in the Company Factory Reset flow in `TASKS.md`.

---

## Storage Security

All asset access is mediated through signed (time-limited) URLs. Assets are never served from public-permanent URLs in production.

- **Signed URLs are generated server-side only.** The client never receives storage credentials (access keys, service role keys, or presigned request parameters). The client receives only the resolved signed URL.
- **Default expiry:** 15 minutes for inline preview; 60 minutes for print/PDF download contexts.
- **Tenant-scoped paths:** every asset path is prefixed with the tenant's `company_id` (e.g. `acme-corp/branding/logo.png`). The `buildStoragePath()` helper enforces this; path construction is never done by inline string concatenation at call sites.
- **No cross-tenant URL construction:** because `company_id` is always read from the authenticated session (never from a client parameter) when generating signed URLs, a user from one tenant cannot construct a valid signed URL for another tenant's asset.

See [`storage-abstraction.md`](./storage-abstraction.md) for the full storage security design, including CDN-layer signing and the provider-switching invariant.

---

## Input Validation

Input is validated at two layers:

1. **Frontend (immediate feedback):** Form fields validate on blur or on submit, providing immediate user feedback without a round-trip. This is a UX feature only.
2. **Backend (authoritative gate):** Service functions and API routes perform schema validation (using TypeScript types and runtime checks) on all incoming data before any database operation. A request that passes frontend validation but fails backend validation is rejected cleanly. The backend is the only authoritative validation layer.

Specific validation rules:
- **VAT Number** (Phase 9, Company Information): validated against the Saudi VAT number format before storage.
- **Barcode format** (Phase 3): validated against the declared barcode type (EAN-13 check digit, GS1-128 AI structure, etc.) on import and scan resolution.
- **Quantity fields**: always validated as non-negative numbers; negative quantities must use signed adjustment records with explicit reason codes, not negative quantity values on standard fields.

---

## XSS and CSRF Prevention

- **XSS:** React's JSX rendering escapes all dynamic string values by default. The application does not use `dangerouslySetInnerHTML`. Content from user input or external sources (product names, customer names, descriptions) is rendered as text, not as HTML.
- **CSRF:** Next.js Server Actions include built-in CSRF protection via origin validation on cross-origin POST requests. API routes that accept state-changing requests from the browser must validate that the request originates from the expected origin, enforced by Next.js middleware or explicit `Origin` header checks.
- **Content Security Policy:** A strict CSP header should be configured in `next.config.ts` to restrict script sources to known origins. This is a planned hardening step, not yet confirmed as implemented.

---

## Audit Trail

Every significant state change on business entities creates an audit record. The audit trail is implemented as described in [`database-architecture.md`](./database-architecture.md#audit-trail-pattern):

- Stock-affecting events are recorded in the immutable `movements` ledger.
- Non-stock state transitions (approval events, user management actions, configuration changes) are recorded in audit log tables with `actor_id`, `action`, `old_value`, `new_value`, and `created_at`.
- Audit records are never deleted, even during a company factory reset. The history of the reset itself is retained for support and compliance purposes. (This is an open question noted in `TASKS.md` — the final decision must be made before the factory reset feature is implemented.)

---

## Compliance Considerations

### ZATCA (Saudi e-Invoicing)

Phase 9 (Company Branding and Information) and Phase 10 (Document and Print Designer) intersect with Saudi ZATCA (Zakat, Tax and Customs Authority) e-invoicing requirements:

- **QR Code on simplified tax invoices:** ZATCA Phase 2 specifies a regulated QR code payload encoding seller name, VAT number, invoice date, and VAT/total amounts. The QR code format and encoding are regulatory requirements, not design choices. Implementation must be validated against the current ZATCA technical specifications before shipping.
- **VAT Number validation:** the `vat_number` field in the company information model must be validated against the Saudi 15-digit format starting with "3" and ending with "3".
- **Invoice data retention:** ZATCA requires invoices to be retained for a minimum period. The soft-delete and retention policy in the storage abstraction layer (see [`storage-abstraction.md`](./storage-abstraction.md)) must account for this minimum retention period before allowing permanent deletion of invoice documents.

### GDPR Note

If Sefay is deployed for companies operating in or serving customers in the European Union, GDPR obligations apply to the personal data stored in the `customers`, `users`, and related tables. Key implications:

- A right-to-erasure request for a customer requires a defined policy for how customer records are handled when they appear on historical invoices (which may need to be retained for tax purposes). Pseudonymization of the customer reference on archived invoices is a common approach.
- Data processor agreements may be required between the tenant (data controller) and Sefay (data processor).
- These obligations are not yet implemented; they are noted here so they are not overlooked when the platform expands to EU-regulated markets.

---

## Future: AI Security and Data Privacy

When AI features are introduced (Phase 4 AI-assisted product creation, Phase 8 AI Inventory Assistant), a mandatory data-privacy review must occur before any tenant data is sent to an external LLM provider:

- **What data is sent:** only the minimum required for the AI task. For AI-assisted product creation, this is the scanned barcode and an optional product photo — not the full product catalogue or order history.
- **What is never auto-saved:** AI output (suggested product name, category, description) is always presented to the user for review and explicit confirmation before saving. The system never auto-saves AI suggestions.
- **Provider selection:** the choice of LLM provider (and the data processing terms of that provider's API) must be reviewed against Sefay's tenant agreements before the integration goes live.
- **Tenant data in prompts:** natural-language inventory queries (Phase 8) require sending context about the tenant's data to the LLM. The privacy review must define what context is permissible, and the `AIProvider` interface must include a data-minimization mechanism. See [`ai-architecture.md`](./ai-architecture.md).
