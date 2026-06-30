# Permission System

*Added: 2026-06-30*

---

## Overview

Sefay uses a role-based access control (RBAC) model. Each user in a company is assigned one role. The role determines which features and operations the user can access. Permissions are enforced at two layers: the backend (authoritative) and the frontend (UX convenience). The frontend layer has a known gap described below.

---

## Current Roles

Four roles exist in the current system:

| Role | Description |
|---|---|
| **Owner** | The company's primary account holder. Exactly one per company. Has all permissions including irreversible and administrative operations (factory reset, subscription management). |
| **Admin** | A company administrator. Has broad operational access across all business modules. Cannot perform Owner-only operations. |
| **Employee** | A standard operational user. Can perform day-to-day inventory and sales work. Cannot access administrative configuration or sensitive financial operations. |
| **Cashier** | A restricted role for point-of-sale operations. Has access to sales and customer-facing workflows. Does not have access to inventory management, purchasing, or settings. |

---

## Role Capabilities Matrix

The following matrix summarizes current permissions. "Full" means create, read, update, and delete. "Read" means view only. "Own" means the user can perform the action on their own account/data only. A blank cell means no access.

| Feature / Operation | Owner | Admin | Employee | Cashier |
|---|---|---|---|---|
| **Inventory — Warehouses** | Full | Full | Read | — |
| **Inventory — Locations** | Full | Full | Read | — |
| **Inventory — Stock Levels** | Full | Full | Read | — |
| **Inventory — Movements Ledger** | Read | Read | Read | — |
| **Inventory — Purchase Orders** | Full | Full | Full | — |
| **Inventory — Goods Receipts** | Full | Full | Full | — |
| **Inventory — Transfers** | Full | Full | Full | — |
| **Inventory — Stock Counts** | Full | Full | Full | — |
| **Inventory — Adjustments** | Full | Full | Full | — |
| **Inventory — Reports** | Full | Full | Read | — |
| **Products — Catalogue** | Full | Full | Full | Read |
| **Products — Categories** | Full | Full | Full | — |
| **Sales — Orders** | Full | Full | Full | Full |
| **Sales — Invoices** | Full | Full | Read | Read |
| **Customers** | Full | Full | Full | Read |
| **Suppliers** | Full | Full | Full | — |
| **Settings — General** | Full | Read | — | — |
| **Settings — Users** | Full | Full | — | — |
| **Settings — Advanced / Factory Reset** | Owner only | — | — | — |
| **Barcode & Scanning (Phase 3)** | Full | Full | Full | — |
| **AI Features (Phase 4, 8)** | Full | Full | Full | — |
| **Document & Print Designer (Phase 10)** | Full | Full | Read | — |
| **Company Branding & Information (Phase 9)** | Full | Full | — | — |

*Note: Planned-phase rows reflect current design intent. They will be confirmed and updated when those phases are implemented.*

---

## Permission Enforcement

### Backend (Authoritative)

Role authorization is checked in service functions and API routes before any state-changing operation. The user's role is read from the JWT (injected as a custom claim by Supabase Auth at login time). The role check occurs in the service layer, not only at the HTTP routing layer, so that the same enforcement applies regardless of whether the call originates from the frontend, a Server Action, or an Edge Function.

For particularly sensitive operations:

- **Factory Reset** — checked at both the API route boundary and inside the service function. The Owner role check is explicit and hard-coded, not table-driven. A re-authentication step (password confirmation) is required immediately before execution. See `TASKS.md` Company Factory Reset.
- **Settings changes** — checked before writing to the company configuration. Admin can read settings; only Owner can modify them.

Row-Level Security in Supabase enforces `company_id` isolation independently of role checks. RLS does not yet enforce role-based restrictions at the row level for most tables — role enforcement is currently application-layer only. Adding role conditions to RLS policies is a future hardening step.

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

## Future: Granular Permissions and Custom Roles

The current four-role model covers the initial business requirements. As the platform matures, the following expansions are anticipated:

- **Granular permissions:** instead of (or in addition to) role-level access, individual permissions (e.g. "can approve purchase orders", "can post goods receipts") are assignable to users independently of their base role. This supports businesses where operational responsibility does not align with the four-role taxonomy.
- **Custom roles:** company Owners can define named custom roles with specific permission sets, in addition to the four built-in roles. This requires a `custom_roles` table and a many-to-many `role_permissions` table — a significant data model change that must be scoped as a standalone phase.
- **Branch/warehouse-scoped permissions:** for larger companies with multiple branches or warehouses, permissions may need to be scoped to a specific branch or warehouse (e.g. an employee can manage stock in Warehouse A but not Warehouse B). This is a further extension of the permission model, dependent on the branch model and the Warehouse Management phase (Phase 6).

---

## Factory Reset Permission

The Company Factory Reset (described in `TASKS.md`, deferred status) is Owner-only. No other role — including Admin — can trigger a factory reset.

Enforcement:

1. The Settings → Advanced Tools page is only rendered for the Owner role. Non-Owner users do not see this section.
2. The API endpoint for factory reset checks the Owner role explicitly and returns `403 Forbidden` for any other role, regardless of what the frontend shows.
3. A multi-step confirmation flow (warning modal → type `RESET MY COMPANY` → re-enter password) is required before the reset executes. The re-authentication step ensures that a stolen session token alone is insufficient to trigger a reset.

See `TASKS.md` Company Factory Reset for the full confirmation flow specification.
