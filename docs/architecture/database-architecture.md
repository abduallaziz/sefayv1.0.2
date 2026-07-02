# Database Architecture

*Added: 2026-06-30*
*Note on naming: `tenant_id` / `tenants` table is the canonical naming used in the V1.02 deployed schema and all code. The term `company_id` / `companies` appeared in some earlier draft architecture documents and is deprecated — it should not be used in code or new documentation. When reading older docs, treat `company_id` as equivalent to `tenant_id`.*

---

## Overview

The Sefay ERP database runs on **PostgreSQL** hosted on **Supabase** (project `apiv1.0.2`). All tenants share a single database instance. Tenant isolation is achieved through `tenant_id` scoping on every data table, enforced exclusively in the application layer (RLS is currently disabled — see Multi-Tenant Data Model section below).

**38 migrations** have been applied as of the current state (001 through 038). The custom TypeScript migration runner is at `api/src/database/migrate.ts`, executing against the Supabase Management API.

See [`security-architecture.md`](./security-architecture.md) and [`tenant-architecture.md`](./tenant-architecture.md) for the isolation and security models.

---

## V2 Schema Specification Summary

*Source: oldmd/MASTER_SCHEMA_SPEC.md (authoritative V2 schema, dated 2026-06-05)*

**28 active V2 tables.** 6 tables excluded from V2: `coupons`, `vehicles`, `workers`, `availability`, `queue`, `business_config`.

### Key Column Naming Decisions (V2)

| Table | Column | Correct Name | Notes |
|---|---|---|---|
| `customers` | name | `full_name` | not `name` |
| `orders` | discount | `discount` | not `discount_amount` |
| `orders` | tax | `tax` | not `tax_amount` |
| `notifications` | subject | `title` | not `subject` |
| `notifications` | metadata | `data` | not `metadata` |
| `billing_invoices` | — | `billing_invoices` | not `invoices` (billing table) |
| `order_items` | quantity/price | `qty`/`unit_price` | confirmed column names |
| `expenses` | note | `notes` | plural |

### Enum Domains (V2 Rule)

All enum domains are **text + CHECK constraints**, not PostgreSQL ENUM types. This avoids the `ALTER TYPE ... ADD VALUE` migration pain.

**Subscription status** — 7 allowed values: `trial`, `active`, `grace_period`, `past_due`, `suspended`, `cancelled`, `expired`.

### Resolved Conflicts (SCHEMA_DECISION_MATRIX.md)

All 6 schema conflicts (A–F) were resolved in commit `745ca84` ("fix: security & bug remediation - 80 issues closed") on June 25, 2026. The SCHEMA_DECISION_MATRIX.md is now archival.

| Conflict | Resolution |
|---|---|
| A: `billing_invoices` vs `invoices` | Fix code — use `billing_invoices` |
| B: `amount_due` vs `total_amount` | Fix code — use `total_amount` |
| C: `subscriptions.expires_at` | Fix code — shared line with D |
| D: `subscriptions.max_users/max_branches` | Fix code — shared line with C |
| E: `dunning_attempts.attempted_at` | Fix DDL — add `DEFAULT NOW()` |
| F: `grace_period_ends_at` dead code | Fix code — remove ~12 lines |

### Code Fixes Applied (F-01 through F-06)

| Fix | Description |
|---|---|
| F-01 | `billing_invoices` naming in stripe-webhook controller |
| F-02 | `amount_due` → `total_amount` |
| F-03 | `subscriptions.expires_at` field reference |
| F-04 | `subscriptions.max_users`/`max_branches` field references |
| F-05 | `dunning_attempts.attempted_at` DEFAULT NOW() |
| F-06 | Remove `grace_period_ends_at` dead code |

### No DB Functions, Views, or Triggers in V2

The V2 schema has no PostgreSQL functions, views, or triggers — **except** for the Inventory RPC functions in `019_inventory_rpc_functions.sql` which are the sole atomicity boundary for stock mutations. These are explicitly excluded from the "no DB functions" rule.

---

## Multi-Tenant Data Model

The fundamental rule: **every table that contains tenant-owned business data has a `tenant_id` column** that references the `tenants` table. There are no exceptions. A table without a `tenant_id` either contains global reference data (e.g. currency codes) or is a cross-tenant administrative table.

**Current V1.02 isolation model:** Row-Level Security (RLS) is **disabled** on all tables. The Supabase client is initialized with the `service_role` key (which bypasses RLS). Tenant isolation is enforced entirely in the application layer: every query built via `ScopedRepository` adds an explicit `.eq('tenant_id', tenantId)` filter. This means the application layer is the **sole** isolation boundary — there is no database-level backstop. See [security-architecture.md](./security-architecture.md#row-level-security) for the security implications and future hardening plan.

All `tenant_id` values are stable UUIDs assigned at tenant creation. They are never reused after a factory reset.

---

## Core Entities

The following entities form the current data model. Entities marked `[planned]` have been designed and scoped in `TASKS.md` but have not yet been confirmed as present in the deployed schema.

### Identity and Access

| Entity | Description |
|---|---|
| `tenants` | The top-level tenant entity. One row per registered company. Holds name, currency, tax rate, customer-capture toggle, activity (one of 37 granular business types), and plan/subscription references. |
| `users` | Application users. Each user belongs to one tenant via `tenant_id`. Authentication is handled by the custom NestJS JWT system; this table extends it with role and profile data. |
| `permissions` | Granular permission definitions (resource.action.scope format). |
| `role_permissions` | Mapping of roles to permissions. Seeded by `src/database/seeds/permissions.seed.ts`. |

### Product Catalogue

| Entity | Description |
|---|---|
| `items` | The master product catalogue for a tenant. Includes name, category, unit, price, and a `barcode` column. |
| `item_variants` | Product variants (size, color, etc.) for items. `stock_quantity` column is frozen historical (see Inventory section). |
| `categories` | Product categories, tenant-scoped. |
| `product_barcodes` | **[planned — Phase 3]** One-to-many barcode relationship per product, replacing the single `barcode` column. |

### Warehouse and Location

| Entity | Description |
|---|---|
| `warehouses` | Physical or logical warehouses belonging to a tenant. |
| `locations` | Named positions within a warehouse (shelf, bin, zone, etc.). Each location belongs to one warehouse via `warehouse_id`. |

### Inventory (V2 — Inventory & Purchasing Core)

| Entity | Description |
|---|---|
| `stock_levels` | Current stock quantity per product per location. Managed exclusively by PostgreSQL RPC functions. |
| `stock_movements` | The immutable stock movement ledger. Every quantity change creates rows here. Triggers block `UPDATE`/`DELETE`. |
| `cost_layers` | FIFO cost layers (or rolling average for `costing_method = 'average'` items). |
| `reservations` | Stock reservation records for in-flight orders. |
| `stock_counts` | Header records for stock-count sessions. |
| `stock_count_lines` | Per-product/per-location counted quantities within a stock count session. |
| `adjustments` | Stock adjustment records with reason and quantity delta. |
| `transfers` | Inter-location or inter-warehouse transfer header records. |
| `transfer_lines` | Line items on a transfer. |
| `domain_events_outbox` | Outbox pattern table for domain events. Rows transition forward only (pending → claimed → processed/failed). |

### Procurement

| Entity | Description |
|---|---|
| `purchase_orders` | Purchase order header records (supplier, date, status). |
| `purchase_order_lines` | Line items on a purchase order. Foreign keys to `item_id` and `variant_id` use `ON DELETE SET NULL` (migration 007). |
| `goods_receipts` | Goods receipt header records linked to a purchase order. |
| `goods_receipt_lines` | Per-line receipt details including received quantity, expiry dates, and serial tracking fields. |
| `suppliers` | Supplier records, tenant-scoped. |

### Sales and Customer Management

| Entity | Description |
|---|---|
| `customers` | Customer records, tenant-scoped. `full_name` column (not `name`). |
| `customer_field_definitions` | Dynamic customer field definitions per tenant (migration 008-010). Built-in fields (`full_name`, `phone`) cannot be deleted, only disabled. Custom fields are per-tenant. |
| `orders` | Sales order header records. `discount` column (not `discount_amount`), `tax` column (not `tax_amount`). |
| `order_items` | Line items on a sales order. `qty` and `unit_price` column names. Foreign keys use `ON DELETE SET NULL` for `item_id` and `variant_id`. |
| `invoices` | Invoice records linked to orders. |

### Billing and Subscriptions

| Entity | Description |
|---|---|
| `subscriptions` | Tenant subscription records with status, plan, trial/expiry dates. |
| `billing_invoices` | Billing invoice records (not the same as `invoices` for POS sales). |
| `dunning_attempts` | Payment retry attempt records for the dunning engine. `attempted_at` has `DEFAULT NOW()`. |

### Other

| Entity | Description |
|---|---|
| `notifications` | In-app notification records. `title` column (not `subject`), `data` column (not `metadata`). |
| `expenses` | Expense records with approval workflow. `notes` column (plural). |
| `expense_templates` | Recurring expense template definitions. |
| `shifts` | Shift records (open/close) with cash reconciliation data. |
| `branches` | Branch records per tenant. |
| `audit_logs` | Audit log records from `@Audit()` decorator. |
| `features` | Global feature definitions. |
| `plan_features` | Per-plan feature enablement and limits. |
| `tenant_feature_overrides` | Per-tenant feature override table for SuperAdmin use. |

---

## Inventory Legacy Migration (023_legacy_stock_migration.sql)

`item_variants.stock_quantity` (and `items.cost_price`) predate the Inventory & Purchasing Core and are now frozen:

- Migration `023_legacy_stock_migration.sql` backfilled any existing positive `stock_quantity` into `stock_levels`/`stock_movements`/`cost_layers` via the same RPCs a real goods receipt uses.
- DB triggers on `item_variants` reject any future `INSERT`/`UPDATE` that changes `stock_quantity` — the column can never be written again.
- `CreateVariantDto` no longer accepts `stock_quantity`; the field is gone from the API surface entirely.

---

## Proposed `product_barcodes` Table Schema (Phase 3)

The current `items` table has a single `barcode` column. Phase 3 requires a one-to-many barcode relationship per product to support case/pallet/unit barcodes, legacy codes, and replacement codes on the same SKU.

Proposed schema:

```sql
CREATE TABLE product_barcodes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  barcode       text NOT NULL,
  type          text NOT NULL,      -- e.g. 'EAN13', 'Code128', 'QR', 'GS1-128', 'UPC'
  is_primary    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One primary barcode per product
CREATE UNIQUE INDEX product_barcodes_primary_idx
  ON product_barcodes (product_id)
  WHERE is_primary = true;

-- Fast lookup by barcode within a tenant
CREATE INDEX product_barcodes_lookup_idx
  ON product_barcodes (tenant_id, barcode);
```

---

## Available vs Reserved vs On-Hand Split (Phase 6)

The current `stock_levels` table tracks a single quantity figure per product/location. Phase 6 (Warehouse Management) requires splitting this into three tracked quantities:

| Field | Meaning |
|---|---|
| `on_hand` | Physical units present at the location, regardless of commitments. |
| `reserved` | Units committed to in-flight orders or transfers that have not yet been fulfilled. |
| `available` | `on_hand - reserved` — units that can be sold or transferred without overselling. Always derived, never stored independently. |

This split is the foundational prerequisite for Phase 6's Reservation Management feature.

---

## Audit Trail Pattern

Every table that supports significant state transitions maintains an audit trail via one or both of:

1. **`stock_movements` ledger** — for stock-affecting events. Immutable, append-only. Rows are never updated or deleted. Compensating transactions (new movement row with opposite sign) are used for corrections.
2. **`audit_logs` table** — for non-stock state transitions (approval events, user management, configuration changes). Contains `actor_id`, `action`, `old_value`, `new_value`, `tenant_id`, `ip_address`, `device`, `created_at`.

The `@Audit()` decorator on service methods triggers `AuditInterceptor` which captures before/after state and inserts into `audit_logs`.

Audit records are never deleted, even during a company factory reset. Soft deletes (`deleted_at` timestamp) are used in preference to hard deletes for all tenant business data. `ScopedRepository.scopedQuery()` automatically filters `deleted_at IS NULL`.

---

## Migration Strategy

- All schema changes are applied through numbered SQL migration files (`001_`, `002_`, ...) executed by the custom TypeScript runner (`api/src/database/migrate.ts`) via the Supabase Management API.
- The runner records which migrations have been applied and skips already-applied ones (idempotent).
- Migrations are numbered sequentially. Each migration is a single transaction where possible.
- Destructive changes (column drops, table drops) are always preceded by a deprecation migration that retains the column/table, deployed to production before the removal migration.
- The migration runner requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` environment variables.

**38 migrations applied (001–038):**
- `001`–`018`: Core schema (tenants, users, auth, billing, POS modules, feature flags, RBAC, notifications, audit)
- `019_inventory_rpc_functions.sql`: PostgreSQL RPC functions for atomic inventory operations
- `020`–`022`: Inventory, purchasing, outbox tables
- `023_legacy_stock_migration.sql`: Migration of legacy `item_variants.stock_quantity`
- `024`–`032`: Customer custom fields, activity tracking, payment method expansion, additional modules
- `033`–`036`: Additional tables (expense_templates, warehouse_locations, inventory management tables, field definitions)
- `037_query_performance_indexes.sql`: Performance indexes — see Migration 037 section below
- `038_analytics_aggregate_rpcs.sql`: Analytics RPC functions — see Migration 038 section below

---

## Indexes and Performance

Standard index patterns applied to every relevant table:

- **Tenant lookup index** — `CREATE INDEX ON <table> (tenant_id)` — required on every multi-tenant table for efficient RLS policy evaluation.
- **Common filter indexes** — `status`, `created_at`, `product_id`, `location_id` — composite indexes preferred when columns are always used together.
- **Movements ledger** — compound index on `(tenant_id, product_id, location_id, created_at)` for per-product timeline and point-in-time reconstruction queries.
- **Barcode lookup** — `(tenant_id, barcode)` indexed for sub-millisecond scan resolution.

---

## Migration 037 — Performance Indexes *(added this session)*

```sql
-- Invoices
idx_orders_tenant_status_customer  ON orders(tenant_id, status, customer_id) WHERE deleted_at IS NULL
idx_orders_tenant_branch_created   ON orders(tenant_id, branch_id, created_at DESC) WHERE deleted_at IS NULL
idx_order_items_item               ON order_items(item_id)

-- Customers (GIN trigram for LIKE search)
idx_customers_fullname_trgm        USING GIN (full_name gin_trgm_ops) WHERE deleted_at IS NULL
idx_customers_phone_trgm           USING GIN (phone gin_trgm_ops) WHERE deleted_at IS NULL AND phone IS NOT NULL

-- Auth sessions
idx_sessions_user_all              ON device_sessions(user_id, created_at DESC)
idx_tokens_session_used            ON refresh_tokens(session_id, is_used) WHERE is_used = false

-- Stock
idx_stock_levels_tenant_warehouse  ON stock_levels(tenant_id, warehouse_id)
idx_stock_levels_tenant_item       ON stock_levels(tenant_id, item_id)
idx_stock_movements_tenant_occurred ON stock_movements(tenant_id, occurred_at DESC)
idx_stock_movements_tenant_warehouse_occurred ON stock_movements(tenant_id, warehouse_id, occurred_at DESC)
```

## Migration 038 — Analytics RPC Functions *(added this session)*

```sql
-- Total revenue of all completed orders (cross-tenant, superadmin use)
sum_completed_orders_revenue() → NUMERIC

-- Per-tenant usage statistics in a date range
get_tenant_usage_analytics(p_from, p_to) → TABLE(...)

-- Total spent by a specific customer
customer_order_aggregates(p_tenant_id, p_customer_id) → TABLE(total_spent)
```

**Total migrations:** 038 (001–038, no gaps).

---

## Additional Tables *(confirmed from DATABASE.md — this session)*

| Table | Domain | Notes |
|---|---|---|
| `expense_templates` | Expenses | Recurring expense templates |
| `warehouse_locations` | Inventory | Locations inside a warehouse |
| `inventory_adjustments` | Inventory | Stock adjustment records |
| `inventory_transfers` | Inventory | Inter-warehouse transfers |
| `inventory_counts` | Inventory | Stock count sessions |
| `inventory_count_items` | Inventory | Line items per count session |
| `purchase_order_items` | Purchasing | Line items per purchase order |
| `field_definitions` | Customers | Custom field schema definitions |
| `customer_fields` | Customers | Custom field values per customer |
| `reorder_points` | Inventory | Per-item reorder thresholds |
| `outbox_events` | System | Outbox pattern event queue |

---

## Future: Financial Tables

The future Advanced Accounting initiative will introduce financial tables: journal entries, operating accounts, ledger postings, and payment records. These are out of scope for current phases. When introduced, they must follow the same `tenant_id` scoping, RLS, and audit trail patterns described in this document.

**Posting Engine invariant:** Business modules raise domain events; Posting Engine consumes those events and creates journal entries. Journal entries are never created outside the Posting Engine. This invariant is critical for maintaining double-entry accounting integrity.

**Financial Dimensions:** A dimension-tag model (`transaction_dimension_tags`) provides unlimited dimension types without schema changes.

See `docs/future/advanced-accounting.md` for the full specification.
