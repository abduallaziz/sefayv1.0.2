# Permission System

*Added: 2026-06-30. Updated: 2026-07-08 — see the "Tenant-Aware Permission Customization" section below; it changes several statements in the original version of this doc (marked inline).*

---

## Overview

Sefay uses a role-based access control (RBAC) model. Each user in a company is assigned one role. The role determines which features and operations the user can access. Permissions are enforced at two layers: the backend (authoritative) and the frontend (UX convenience). The frontend layer has a known gap described below.

Permission strings follow the format `resource.action.scope`.

The single authoritative **global default** permissions seed file is `src/database/seeds/permissions.seed.ts`. This file seeds the `permissions` and `role_permissions` tables on every deploy. It is idempotent (upsert). See STATUS.md §40.

**As of 2026-07-08, this is no longer the whole picture** — `role_permissions` is the permanent global fallback, but a tenant can now override individual permission grants for their own roles via `tenant_role_permissions`. See "Tenant-Aware Permission Customization" below before assuming a role's effective permissions match this seed file exactly for any given tenant.

---

## Current Roles

Current roles, verified directly against the `add(role, keys)` calls in `src/database/seeds/permissions.seed.ts` **plus** the `roles` table seeded by migration 059 (7 roles, ~55 permission keys total as of 2026-07-08 — the seed file and the `roles`/`permissions` tables, not any architecture document, are authoritative; both counts drift over time, don't hardcode them elsewhere):

| Role | Description |
|---|---|
| **superadmin** | Platform operator. Cross-tenant access via shared analytics/tenant-management modules, plus platform-level `superadmin.*` permissions (queue view/manage, health view, backup view). **Protected** — cannot be edited or deleted, including by an owner, via the Access Control admin UI (see below). |
| **owner** | The company's primary account holder. Exactly one per company. Broadest tenant-scoped grant: full invoice/expense/shift/user/branch/item/customer/expense-record/report/settings/inventory/purchasing access, including `settings.manage` and `purchasing.approve`. **Protected** — same restriction as superadmin, to prevent an owner locking themselves out. |
| **manager** | Company-level administrator. Same operational breadth as owner across inventory/purchasing/customers/items, but `users.view` only (not `manage`), `settings.view` only (not `manage`), and no `expense.approve`/`expense.reject` or `reports.view.all` (branch-scoped reporting only). Editable — an owner can customize its permissions per-tenant. |
| **inventory_clerk** | Inventory and purchasing operations: `inventory.view`, `.adjust`, `.transfer`, `.count`, `.reserve`, plus `purchasing.view`, `.manage`, `.receive`. **Does not** hold `inventory.adjust.approve` or `purchasing.approve` — cannot approve adjustments or purchase orders, only create/process them. Also has `items.view`. Editable. |
| **cashier** | Point-of-sale and customer-facing operations: invoice create/view (own), expense requests, shift open/close/view (own), `items.view`, `customers.view`/`manage`, `inventory.view`/`reserve`. No purchasing or settings access. Editable. |
| **worker** | Minimal read access: `invoice.view.own`, `shift.view.own`, `items.view`, `inventory.view`. No write permissions on any resource. Editable. |
| **none** | Added migration 057 (2026-07-03-ish, HR employee-profile work). An Employee Core profile with no system login/dashboard access at all — zero permission grants by design (no `role_permissions` rows exist for it). Editable in principle, though there's nothing to grant it in practice today. |

*There is no `accountant` or `viewer` role, and no role literally named `inventory` — both appeared in an earlier draft of this document but do not exist in the seed file or the database. `inventory_clerk` is the correct, current name (an earlier draft of this document incorrectly reversed this and called `inventory_clerk` deprecated in favor of `inventory` — that was backwards).*

---

## Role Capabilities Matrix

The following matrix is rebuilt directly from the `add(role, keys)` grants in `permissions.seed.ts` for the five business-facing roles (superadmin is platform-level and out of scope here). "Full" means create, read, update, and delete. "Read" means view only. A blank cell (`—`) means no access.

**Important caveat on granularity:** the backend permission model is coarser than this table's rows suggest. Several rows below (Warehouses / Locations / Stock Levels / Movements Ledger / Reports) are all gated by the *same* `inventory.view` / `inventory.manage` permission keys — the backend does not distinguish between them individually. Where a row's access differs from its neighbors, that distinction is a **frontend UI convention**, not a separately enforced backend permission. Treat this table as an accurate summary of current grants, not as proof that each row is independently permission-gated.

| Feature / Operation | Owner | Manager | Inventory Clerk | Cashier | Worker |
|---|---|---|---|---|---|
| **Inventory — Warehouses** | Full | Full | Read | Read | Read |
| **Inventory — Locations** | Full | Full | Read | Read | Read |
| **Inventory — Stock Levels** | Full | Full | Adjust (no manage) | Read + Reserve | Read |
| **Inventory — Movements Ledger** | Read | Read | Read | Read | Read |
| **Inventory — Purchase Orders** | Full | Full | Manage (no approve) | — | — |
| **Inventory — Goods Receipts** | Full | Full | Full (receive) | — | — |
| **Inventory — Transfers** | Full | Full | Full | — | — |
| **Inventory — Stock Counts** | Full | Full | Full | — | — |
| **Inventory — Adjustments** | Full | Full | Create only (no approve) | — | — |
| **Reports (general)** | Full (all) | Read (branch only) | — | — | — |
| **Products — Catalogue** | Full | Full | Read | Read | Read |
| **Products — Categories** | Full | Full | — | — | — |
| **Sales — POS Orders/Invoices (flat)** | Full | Full | — | Full | Read (own) |
| **Sales — Invoices (own/branch/all + cancel)** | Full (incl. cancel) | Read + Create (no cancel) | — | Read + Create (own) | Read (own) |
| **Customers** | Full | Full | — | Full | — |
| **Suppliers** | Full | Full | Manage (no approve — same `purchasing.manage` key as POs) | — | — |
| **Settings — General** | Full | Read | — | — | — |
| **Settings — Users** | Full | Read | — | — | — |
| **Settings — Advanced / Factory Reset** | Owner only (hardcoded, not permission-key based) | — | — | — | — |
| **POS — `invoice.create.own`** | Yes | Yes | — | Yes | No (worker lacks this key) |
| **POS — pos-config (`GET /tenant/pos-config`)** | Yes | Yes | — | Yes | No |

*Note: `expense.*` (approval workflow: request/approve/reject) and `shift.*` (open/close/view) exist as separate permission resources not shown above — owner and manager hold `expense.approve`/`expense.reject`, cashier holds `expense.request` only, worker holds none. All five roles except inventory_clerk hold some `shift.view.own`; only owner/manager can `shift.open`/`shift.close`.*

*Note: rows below (Barcode & Scanning, AI Features, Document & Print Designer, Company Branding) describe **planned, unimplemented phases** with no corresponding permission keys in the seed file yet — they reflect design intent only and were not verified against code, since there is no code to verify against.*

| Feature / Operation (planned) | Owner | Manager | Inventory Clerk | Cashier | Worker |
|---|---|---|---|---|---|
| **Barcode & Scanning (Phase 3)** | Full | Full | Full | — | Full |
| **AI Features (Phase 4, 8)** | Full | Full | Full | — | — |
| **Document & Print Designer (Phase 10)** | Full | Full | Read | — | — |
| **Company Branding & Information (Phase 9)** | Full | Full | — | — | — |

---

## Permission Enforcement

### Backend (Authoritative)

Role authorization is checked by `PermissionGuard` (via the `@RequirePermission` decorator) in the NestJS request pipeline. The user's role is read from the JWT (set by the custom NestJS auth system at login time). The role check occurs before any business logic executes in the request handler.

**As of 2026-07-08**, the actual grant lookup (`PermissionsService.hasPermission(role, key, tenantId)`) checks `tenant_role_permissions` first (if the current tenant has customized that role) and falls back to the global `role_permissions` table otherwise — see "Tenant-Aware Permission Customization" below. `PermissionGuard` itself is otherwise unchanged: same decorator, same bypass order (superadmin, then the internal QA/demo tenant), same `ForbiddenException` on denial.

For particularly sensitive operations:

- **Factory Reset** — checked at both the API route boundary and inside the service function. The Owner role check is explicit and hard-coded, not table-driven. A re-authentication step (password confirmation) is required immediately before execution. See `TASKS.md` Company Factory Reset.
- **Settings changes** — checked before writing to the company configuration. Manager can read settings; only Owner can modify them.
- **POS cashier access** — `GET /tenant/pos-config` requires `invoice.create.own` permission only (cashier-accessible). Returns `{tax_rate, customer_capture_enabled}` — a lightweight endpoint designed specifically for cashier use cases.

The `role_permissions` table is seeded by `src/database/seeds/permissions.seed.ts` which runs on every deploy and is idempotent.

### Frontend (UX Convenience)

The frontend uses the user's role to conditionally render navigation items, action buttons, and form sections. This improves usability by not surfacing options the user cannot use, but it is **not a security boundary**. A user who can reach an API endpoint directly (e.g. through the browser developer tools or a script) is still subject to the backend role check.

---

## Known Gap: Buttons Not Visually Disabled for Insufficient Permissions

As identified in the Phase 2 Inventory UX audit (`TASKS.md`):

> No disabled/locked visual state for action buttons when the current user lacks permission (buttons are only gated by data-completeness, not role).

Specifically, action buttons (Edit, Delete, Approve, Post) in Inventory list tables are currently hidden or shown based on the data state of the row (e.g. a "Post" button is hidden if the record is already posted), but they do not visually reflect whether the current user's role permits the action. A Cashier viewing a Purchase Orders list (if they could navigate there) would see the same action buttons as an Owner.

The fix requires:

1. A `useCurrentUserRole()` hook (or equivalent) that returns the authenticated user's role.
2. A `hasPermission(role, feature, action)` utility that looks up the capability matrix.
3. Button components that accept a `disabled` state and render a visually distinct locked state with an appropriate tooltip explaining why the action is unavailable.

This is a tracked but not yet implemented improvement.

---

## Factory Reset Permission

The Company Factory Reset (described in `TASKS.md`, deferred status) is Owner-only. No other role — including Manager — can trigger a factory reset.

Enforcement:

1. The Settings → Advanced Tools page is only rendered for the Owner role. Non-Owner users do not see this section.
2. The API endpoint for factory reset checks the Owner role explicitly and returns `403 Forbidden` for any other role, regardless of what the frontend shows.
3. A multi-step confirmation flow (warning modal → type `RESET MY COMPANY` → re-enter password) is required before the reset executes. The re-authentication step ensures that a stolen session token alone is insufficient to trigger a reset.

See `TASKS.md` Company Factory Reset for the full confirmation flow specification.

---

## Tenant-Aware Permission Customization (Access Control System) — Added 2026-07-08

**This section supersedes most of the old "Future: Granular Permissions and Custom Roles" section below, which described this as entirely unbuilt. Kept for history at the bottom of this doc; do not treat it as current.**

The role model above (7 fixed roles, `role_permissions` as the global default) is now customizable **per tenant, per permission** — an owner can flip individual permission keys on/off for an editable role without affecting any other tenant on the platform and without having to redefine the whole role.

### Data model (additive, apiv1.0.2)

- `roles` — the 7 roles above as real rows (`tenant_id IS NULL`, `is_system = true`). The `roles` table also supports tenant-owned custom roles (`tenant_id` set, `is_system = false`) structurally, but **no UI or API exists yet to create one** — see "Still Future" below.
- `tenant_role_permissions` — `(tenant_id, role_id, permission_key, is_granted)`. A row here overrides the global grant for that one key for that tenant+role; absence of a row means "follow the global default." This is a **per-key merge, not a role replacement** — an owner can override one permission without re-specifying the other 40+.
- `permission_groups` — a curated, stable set of categories (`employees`, `attendance`, `expenses`, `payroll`, `reports`, `inventory`, `purchasing`, `sales`, `settings`, `platform`) that `permissions.group_id` points into, so the admin UI never hardcodes categories. Note: `payroll` currently only contains `hr.manage` as a stand-in — this is documented as a temporary/imprecise mapping pending a real `payroll.view/manage/export/approve` permission split.

### API — `/access-control/*` (apiv1.0.2)

`GET /permission-groups`, `GET /permissions`, `GET /roles`, `GET /roles/:id/permissions`, `PATCH`/`DELETE /roles/:id/permissions/:key`, `POST /roles/:id/reset`. Gated by a **hardcoded** owner/superadmin check (`AccessControlAdminGuard`), deliberately not `@RequirePermission()` — "who can manage permissions" must never itself be a customizable permission, or a compromised/misconfigured tenant could escalate. `owner` and `superadmin` roles can never be edited via this API, even by that tenant's own owner (self-lockout prevention). Platform-only permissions (`resource = 'superadmin'`) can never be granted to a tenant role, and are simply absent from a non-superadmin caller's API response (not filtered client-side). Every change writes a real before/after entry to `audit_logs` (not just an action string). Full design/safety rationale: apiv1.0.2 STATUS.md §68.

### Frontend — `/dashboard/settings/access-control` (sefayv1.0.2)

A real split-view page (roles list + selected role's detail on one screen, switching via component state, not page navigation) — reachable from Settings, owner/superadmin only. Protected roles render read-only with a lock badge rather than being hidden entirely. Groups/roles/permissions are rendered entirely from the API responses above, never hardcoded. "Reset to default" deletes the override row(s), it never rewrites a value that happens to match the current global default (important: this means resetting correctly re-inherits *future* global-default changes too).

### Still Future (not built — this part of the old section below is still accurate)

- Creating brand-new custom roles (the "دور جديد" button in the shipped UI is present but intentionally disabled, labeled "coming soon" — no backend support yet).
- Multiple roles per user (`user_roles` — schema was reviewed/approved conceptually but no table exists).
- Branch/department/warehouse-scoped permissions (an "access scope" layer — approved architecture exists, not implemented).
- Per-user allow/deny exceptions overriding their role.
- Approval-limit / business-rule policies (e.g. "can approve purchase orders under 5,000 SAR").
- Time-boxed temporary access.

---

## Future: Granular Permissions and Custom Roles *(historical — see the section above for what's actually implemented as of 2026-07-08)*

The current role model covers the initial business requirements. As the platform matures, the following expansions are anticipated:

- **Granular permissions:** instead of (or in addition to) role-level access, individual permissions (e.g. "can approve purchase orders", "can post goods receipts") are assignable to users independently of their base role. This supports businesses where operational responsibility does not align with the role taxonomy.
- **Custom roles:** company Owners can define named custom roles with specific permission sets, in addition to the built-in roles. This requires a `custom_roles` table and a many-to-many `role_permissions` table — a significant data model change that must be scoped as a standalone phase.
- **Branch/warehouse-scoped permissions:** for larger companies with multiple branches or warehouses, permissions may need to be scoped to a specific branch or warehouse (e.g. an employee can manage stock in Warehouse A but not Warehouse B). This is a further extension of the permission model, dependent on the branch model and the Warehouse Management phase (Phase 6).
