# Backend Architecture

*Added: 2026-06-30*

---

## Overview

The Sefay ERP backend is built on **Supabase** (project `apiv1.0.2`) as the primary backend platform. Supabase provides the PostgreSQL database, authentication (Supabase Auth + JWT), Row-Level Security policies, Realtime subscriptions, Storage, and Edge Functions under one managed service. The frontend communicates with the backend primarily through the Supabase JavaScript client and, where needed, through Next.js API routes or Server Actions.

The backend does not use a custom application server. All application-level business logic that cannot live on the database (via PostgreSQL functions, triggers, or RLS policies) runs either in Supabase Edge Functions or in Next.js Server Actions, depending on the nature of the operation.

---

## Service Layer Pattern

Application code does not call the Supabase SDK directly from UI components or pages. All Supabase interactions are encapsulated in service modules (`src/shared/services/` for cross-feature concerns, `src/features/<name>/services/` for feature-specific logic).

The benefits of this pattern:

- Supabase-specific SDK details are isolated to one layer. If the SDK changes or the provider changes, only the service layer is updated.
- Service functions can be tested independently of the UI.
- Consistent error handling and logging can be applied at the service boundary.
- The tenant isolation rule (always scope queries by `company_id`) is enforced in one place per entity, not at every call site.

Service functions are plain TypeScript async functions. They accept typed parameters, perform the Supabase operation, apply error handling, and return typed results. They do not return raw Supabase response objects to their callers.

---

## API Design Principles

The conventions governing request/response formats, versioning, error shapes, pagination, filtering, sorting, and tenant isolation are described in detail in [`api-design.md`](./api-design.md). All backend API surfaces — whether implemented as Next.js API routes, Server Actions, or Edge Functions — follow those conventions.

Key principles:

- Tenant isolation is always implicit from the authenticated session's `company_id`. It is never passed as a query parameter.
- Pagination is required for any endpoint that returns a list that may grow unbounded.
- Error responses follow a consistent structure with a machine-readable `code` and a human-readable `message`.

---

## Database

The database is PostgreSQL hosted on Supabase. The schema, entity catalogue, multi-tenant scoping model, audit trail pattern, migration strategy, and index guidance are documented in [`database-architecture.md`](./database-architecture.md).

The key constraint: every table that contains tenant-owned data has a `company_id` column. Row-Level Security policies on those tables enforce that authenticated users can only read and write rows belonging to their own company. No application-layer filter is a substitute for this database-layer enforcement.

---

## Authentication and Authorization

Authentication is handled by **Supabase Auth** using JWTs. Users authenticate through the Supabase Auth flow; the resulting JWT is included in all API requests and is used by Supabase to evaluate RLS policies.

Authorization (what authenticated users are permitted to do) is governed by the role system described in [`permission-system.md`](./permission-system.md). The four current roles are Owner, Admin, Employee, and Cashier.

Authorization is enforced at two layers:

1. **Database layer** — RLS policies enforce `company_id` isolation and may enforce role-based access for particularly sensitive operations.
2. **Application layer** — Service functions and Server Actions check the user's role before executing sensitive mutations (e.g. Company Factory Reset is Owner-only and must be role-checked in the service layer, not only hidden from the frontend).

Frontend navigation guards and hidden UI elements are UX conveniences only. They are not security controls. See [`security-architecture.md`](./security-architecture.md).

---

## Storage

File and asset storage is currently provided by **Supabase Storage**. Starting with Phase 11 (Storage Abstraction), all storage access will be mediated through the `StorageProvider` interface, making the underlying provider swappable without touching application code.

The full storage architecture — the `StorageProvider` interface, provider adapters, tenant-aware paths, signed URL policies, image optimization, versioning, soft delete, and zero-downtime provider migration — is documented in [`storage-abstraction.md`](./storage-abstraction.md).

Key rule: the frontend never accesses storage directly. All uploads and signed-URL generation are performed server-side (API route or Server Action). The client receives only the resulting URL.

---

## Multi-Tenancy

Sefay is a multi-tenant SaaS. All tenants share a single Supabase database. Tenant isolation is achieved through `company_id` scoping on every data table and enforced through Supabase RLS policies. There is no database-per-tenant or schema-per-tenant model at this time.

The complete multi-tenancy design — isolation rules, provisioning flow, tenant settings, storage isolation, and future multi-company considerations — is documented in [`tenant-architecture.md`](./tenant-architecture.md).

---

## Error Handling

Errors are handled at the service layer boundary. Raw Supabase error objects are never propagated to the UI. Instead, service functions catch errors, log them with sufficient context for debugging (see Logging and Observability below), and return typed error results or throw domain-specific errors.

The error response format for API routes is defined in [`api-design.md`](./api-design.md#error-format). Consistent error shapes allow the frontend to handle error states uniformly across all features.

Categories of errors handled explicitly:

- **Validation errors** — input does not meet required shape or constraints (returned as 400 with field-level detail).
- **Authorization errors** — authenticated user lacks permission for the operation (returned as 403).
- **Not found errors** — the requested entity does not exist or does not belong to the requesting tenant (returned as 404; the response does not distinguish between "does not exist" and "exists but belongs to another tenant" — both appear as 404 to prevent information leakage).
- **Conflict errors** — the operation cannot be completed due to a business rule conflict (e.g. posting a goods receipt against an already-posted purchase order line) — returned as 409 with a domain-specific `code`.
- **Server errors** — unexpected failures logged and returned as 500 without internal detail in the response body.

---

## Logging and Observability

Structured logging is applied at service layer boundaries. Every significant operation (create, update, delete, state transition) logs at minimum:

- The operation name and entity type.
- The `company_id` of the acting tenant.
- The `user_id` of the actor.
- The entity `id` being operated on.
- The outcome (success or error, with error code/message on failure).

Logs should not include personally identifiable information (PII) beyond user ID, and should not include full request bodies that may contain sensitive business data.

Supabase Edge Functions emit logs to the Supabase dashboard. For Edge Functions or Server Actions that perform multi-step operations (e.g. Company Factory Reset), each step is logged individually so that a failure can be diagnosed without replaying the entire operation.

---

## Future Considerations

- **Edge Functions for compute-heavy operations** — Phase 5's inventory health score computation, ABC analysis, and point-in-time stock reconstruction are candidates for Supabase Edge Functions rather than in-request computation, since they operate over potentially large datasets.
- **Webhooks / Public API** — Phase 10's Document and Print Designer and future integration scenarios may require a versioned public API surface and webhook delivery. See [`api-design.md`](./api-design.md#future-public-api--webhooks) and [`../future/README.md`](../future/README.md).
- **AI provider integration** — Phase 4 and Phase 8 require a server-side LLM integration. The design of that integration — the `AIProvider` interface, data privacy rules, and shared provider configuration — is documented in [`ai-architecture.md`](./ai-architecture.md). The actual HTTP calls to LLM providers must be made server-side (Edge Function or Server Action) and never from the browser.
- **Realtime subscriptions** — Supabase Realtime is available but not yet used. Phase 5 Smart Alerts and the AI Inventory Assistant (Phase 8) are the most likely first consumers — alerts pushed to the client without polling, and assistant responses streamed rather than returned in a single round-trip.
