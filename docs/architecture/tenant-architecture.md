# Tenant Architecture

*Added: 2026-06-30*
*Note on naming: `tenant_id` / `tenants` table is the canonical naming used in the V1.02 deployed schema and all code. The term `company_id` / `companies` appeared in some earlier draft architecture documents and is deprecated — it should not be used in code or new documentation.*

---

## Overview

Sefay is a multi-tenant SaaS ERP. All tenants share a single Supabase (PostgreSQL) database. Tenant isolation is achieved through `tenant_id` scoping: every table that contains tenant-owned business data has a `tenant_id` column, and Supabase Row-Level Security (RLS) policies enforce that authenticated users can only access rows belonging to their own tenant.

This is a **shared-database, shared-schema** multi-tenancy model. There is no database-per-tenant or schema-per-tenant arrangement. Isolation is enforced entirely through column-level scoping and database-enforced access policies.

---

## Tenant Isolation Rules

These rules are non-negotiable. Violating any of them is a security vulnerability.

1. **Every table containing tenant data has a `tenant_id` column** referencing the `tenants` table. No exceptions. A table without `tenant_id` either contains global reference data (e.g. currency codes) or is a cross-tenant system table.

2. **RLS is enabled on every tenant data table.** The RLS policy for each table permits read and write only where `tenant_id` matches the `tenant_id` derived from the authenticated user's JWT.

3. **The `tenant_id` used in service queries is always derived from the authenticated session** (the JWT). It is never supplied by the client in a query parameter or request body.

4. **Application-layer `WHERE tenant_id = ?` filters are defense-in-depth**, not the primary isolation mechanism. The database enforces isolation regardless of application behavior.

5. **New tables must have RLS enabled before deployment.** A new table without RLS that stores tenant data is a security vulnerability and must not be deployed to production.

6. **`tenant_id` values are stable UUIDs assigned at tenant creation** and are never reused, even after a factory reset. A factory reset wipes business data but does not change the tenant's `id`.

---

## Tenant Provisioning Flow

When a new company signs up for Sefay, the following steps occur:

1. **Authentication record created** — a NestJS auth record is created for the Owner (Supabase Auth is not used).
2. **Tenant record created** — a new row is inserted into the `tenants` table, generating a new `tenant_id` UUID. Default settings are applied (currency, tax rate, language).
3. **Owner user record created** — a new row is inserted into the `users` table with the Owner role, linked to the new `tenant_id`.
4. **Default configuration** — any required default data (e.g. a default warehouse, system-level settings) is seeded for the new tenant.
5. **Onboarding wizard triggered** — the Owner is presented with an onboarding wizard to configure their first branch, warehouse, and (optionally) additional users.

The provisioning flow must run inside a transaction. If any step fails, the entire provisioning is rolled back — no partially-provisioned tenant record is left in the database.

---

## Tenant Settings

The current `SettingsPage` exposes the following company-level configuration fields:

| Setting | Description |
|---|---|
| Company Name | The name displayed in the application shell and on documents. |
| Currency | The currency used for all monetary values and document displays. |
| Tax Rate | The default VAT/tax rate applied to sales and purchase documents. |
| Customer-Capture Toggle | Controls whether customer information is collected at the point of sale. |

These settings are stored on the `tenants` table. Changes made through the Settings page are Owner-restricted (Admin can view, not modify — see [`permission-system.md`](./permission-system.md)).

---

## Future Tenant Settings (Phase 9)

Phase 9 (Company Branding and Information) significantly expands the tenant configuration model. The new fields, none of which currently exist in the `SettingsPage` or (as far as verified from the frontend) the backend `tenants`/profile model, include:

**Branding assets:**
- Company Logo (primary)
- Secondary Logo
- Company Stamp
- Manager Signature image
- Accountant Signature image
- QR Code (for ZATCA compliance — payload format is regulatory, see [`security-architecture.md`](./security-architecture.md#compliance-considerations))
- Watermark image

**Company information:**
- Legal Name
- Trade Name
- VAT Number
- Commercial Registration number
- Tax Registration number
- Address, Phone, Email, Website
- IBAN, SWIFT
- Social media links

All branding asset fields reference stored file paths managed through the `StorageProvider` interface (see [`storage-abstraction.md`](./storage-abstraction.md)). The Phase 11 Storage Abstraction must be in place before Phase 9's asset upload flows are built.

---

## Cross-Tenant Data Isolation Guarantee

Sefay provides the following explicit isolation guarantee:

> No authenticated user can read, write, or infer the existence of data belonging to any company other than their own, through any application surface or API endpoint.

This guarantee is upheld by:
- RLS policies that use the JWT-derived `tenant_id` as the isolation key.
- Tenant-scoped storage paths (`tenant_id/` prefix on all asset paths).
- 404 responses (not 403) for resources that exist but belong to a different tenant — preventing enumeration attacks.
- Signed URLs that encode the tenant-scoped path and cannot be used for cross-tenant asset access.

Any code change that could affect this guarantee — new tables, new API endpoints, new storage paths — must be reviewed against these four controls before merging.

---

## Factory Reset

The Company Factory Reset is a planned feature (deferred status, see `TASKS.md`) that resets a tenant's business data to a brand-new state while preserving the Owner account, company record, subscription, and base settings.

**What the factory reset preserves:**
- `tenants` row (the tenant's record)
- Owner's `users` row
- Subscription and plan records
- Base system settings (language, currency, timezone)

**What the factory reset wipes:**
- All users except the Owner
- All branches, warehouses, and locations
- All products and categories
- All customers and suppliers
- All inventory: levels, movements, reservations, counts, adjustments, transfers, goods receipts
- All sales and purchases
- All accounting records

**Isolation invariant during reset:** the factory reset is scoped strictly to the requesting tenant's `tenant_id`. It cannot affect any other tenant's data. The reset runs inside a single database transaction; any failure triggers a full rollback.

**Open question before implementation:** whether audit/history logs of the reset itself should be retained even though all other data is wiped. This must be decided before the feature is implemented.

For the complete specification including the multi-step confirmation flow, see `TASKS.md` Company Factory Reset.

---

## Storage Isolation

Every file asset stored on behalf of a tenant is namespaced by the tenant's `tenant_id` at the path level. Cross-tenant path collisions are structurally impossible because the `buildStoragePath()` helper always prefixes with `tenant_id`.

Signed URLs for asset access are generated server-side using the authenticated tenant's session. A user cannot request a signed URL for another tenant's asset path, because the `tenant_id` prefix is always derived from the authenticated session, not from a client parameter.

See [`storage-abstraction.md`](./storage-abstraction.md) for the complete storage architecture, including the signed URL policy and the provider-switching model.

---

## Future: Multi-Company and Financial Consolidation

As noted in the Advanced Accounting initiative (see `docs/future/README.md` when that document is created), some enterprise customers operate multiple legal entities and need to consolidate financial reporting across them. This is not a current requirement and is not part of any active phase.

When it is addressed, it will require:
- A concept of a "parent" company or group that spans multiple `tenant_id` tenants.
- A consolidated reporting layer that can aggregate across multiple tenants with appropriate cross-tenant read permission.
- Clear governance of which users can access consolidated views (likely a new super-admin role scoped to the company group).

This is a significant architecture change and will be scoped as a standalone initiative with its own ADR when the requirement is confirmed.
