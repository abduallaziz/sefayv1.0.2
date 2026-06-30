# Database Architecture

*Added: 2026-06-30*

---

## Overview

The Sefay ERP database runs on **PostgreSQL** hosted on **Supabase** (project `apiv1.0.2`). All tenants share a single database instance. Tenant isolation is achieved through `company_id` scoping on every data table, enforced by Supabase Row-Level Security (RLS) policies at the database level. See [`security-architecture.md`](./security-architecture.md) and [`tenant-architecture.md`](./tenant-architecture.md) for the isolation and security models.

This document covers the multi-tenant data model, the core entity catalogue, planned schema additions, the available/reserved/on-hand stock split, the audit trail pattern, migration strategy, and index guidance.

---

## Multi-Tenant Data Model

The fundamental rule: **every table that contains tenant-owned business data has a `company_id` column that references the `companies` table**. There are no exceptions. A table without a `company_id` either contains global reference data (e.g. currency codes) or is a cross-tenant administrative table.

RLS policies enforce that a query from an authenticated session can only touch rows where `company_id` matches the `company_id` associated with the authenticated user's session. Application-layer `WHERE company_id = ?` filters are a secondary defense, not the primary control. The database enforces isolation regardless of what the application layer does.

All `company_id` values are stable UUIDs assigned at company creation. They are never reused after a factory reset.

---

## Core Entities

The following entities form the current data model. Entities marked `[planned]` have been designed and scoped in `TASKS.md` but have not yet been confirmed as present in the deployed schema.

### Identity and Access

| Entity | Description |
|---|---|
| `companies` | The top-level tenant entity. One row per registered company. Holds name, currency, tax rate, customer-capture toggle, and plan/subscription references. |
| `users` | Application users. Each user belongs to one company via `company_id`. Supabase Auth manages the authentication record; this table extends it with role and profile data. |
| `roles` | Role definitions: Owner, Admin, Employee, Cashier. See [`permission-system.md`](./permission-system.md) for the capability matrix. |

### Product Catalogue

| Entity | Description |
|---|---|
| `products` | The master product catalogue for a tenant. Includes name, category, unit, price, and currently a single barcode column. |
| `product_barcodes` | **[planned — Phase 3]** One-to-many barcode relationship per product, replacing the single `barcode` column. See schema proposal below. |
| `categories` | Product categories, tenant-scoped. |

### Warehouse and Location

| Entity | Description |
|---|---|
| `warehouses` | Physical or logical warehouses belonging to a company. |
| `locations` | Named positions within a warehouse (shelf, bin, zone, etc.). Each location belongs to one warehouse via `warehouse_id`. |

### Inventory

| Entity | Description |
|---|---|
| `stock_levels` | Current stock quantity per product per location. One row per (`company_id`, `product_id`, `location_id`) combination. Currently tracks a single `quantity` figure. Phase 6 will split this into `on_hand`, `reserved`, and (derived) `available`. |
| `movements` | The immutable stock movement ledger. Every quantity change — receipt, transfer, adjustment, sale, return — creates one or more movement rows. Used by the Movements ledger view and as the source of truth for audit/snapshot reconstruction. |
| `stock_counts` | Header records for stock-count sessions (partial or full). |
| `stock_count_lines` | Per-product/per-location counted quantity within a stock count session. |
| `adjustments` | Stock adjustment records with reason and quantity delta. Create corresponding `movements` rows on posting. |

### Procurement

| Entity | Description |
|---|---|
| `purchase_orders` | Purchase order header records (supplier, order date, status). |
| `purchase_order_lines` | Line items on a purchase order (product, quantity ordered, unit price). |
| `goods_receipts` | Goods receipt header records linked to a purchase order. |
| `goods_receipt_lines` | Per-line receipt details including received quantity, expiry dates, and serial tracking fields. |

### Transfers

| Entity | Description |
|---|---|
| `transfers` | Inter-location or inter-warehouse transfer header records. |
| `transfer_lines` | Line items on a transfer (product, quantity, source location, destination location). |

### Sales and Customer Management

| Entity | Description |
|---|---|
| `customers` | Customer records, tenant-scoped. |
| `orders` | Sales order header records (customer, date, status). |
| `order_lines` | Line items on a sales order. |
| `invoices` | Invoice records linked to orders. |

### Supplier Management

| Entity | Description |
|---|---|
| `suppliers` | Supplier records, tenant-scoped. |

---

## Proposed `product_barcodes` Table Schema

*Source: Phase 3 planning in `TASKS.md`.*

The current `products` table has a single `barcode` column. Phase 3 (Barcode and Scanning) requires a one-to-many barcode relationship per product to support case/pallet/unit barcodes, legacy codes, and replacement codes on the same SKU.

Proposed schema:

```sql
CREATE TABLE product_barcodes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  ON product_barcodes (company_id, barcode);
```

**Migration note:** When this table is introduced, the existing `barcode` column on `products` should be migrated into `product_barcodes` with `is_primary = true` and then removed (or deprecated) from `products`. This migration must be performed inside a transaction to prevent a gap where a product has neither a `barcode` column nor a `product_barcodes` row.

**Open question before implementation:** confirm with the apiv1.0.2 backend whether the existing `barcode` column carries a unique constraint per company, and whether any RLS policy or trigger depends on it directly.

---

## Available vs Reserved vs On-Hand Split

*Source: Phase 6 planning in `TASKS.md`.*

The current `stock_levels` table tracks a single quantity figure per product/location. Phase 6 (Warehouse Management) requires splitting this into three tracked quantities:

| Field | Meaning |
|---|---|
| `on_hand` | Physical units present at the location, regardless of commitments. |
| `reserved` | Units committed to in-flight orders or transfers that have not yet been fulfilled. |
| `available` | `on_hand - reserved` — units that can be sold or transferred without overselling committed stock. This is always a derived value, never stored independently. |

This split is the foundational prerequisite for Phase 6's Reservation Management feature. Without it, the system cannot prevent overselling stock that is already committed to a pending order.

The migration from a single `quantity` column to `on_hand` + `reserved` requires:

1. Renaming or replacing the `quantity` column with `on_hand` (default: current `quantity` value).
2. Adding a `reserved` column (default: 0 for all existing rows).
3. Updating all consumers of `stock_levels` to use `available` (= `on_hand - reserved`) where they currently display raw `quantity`.
4. Adding reservation records for any in-flight orders at the time of migration.

This is a data-model change that affects every Inventory module. It must be scoped as a standalone migration, not bundled with a feature change.

---

## Audit Trail Pattern

Every table that supports significant state transitions (purchase orders, goods receipts, transfers, stock counts, adjustments) maintains an audit trail. The audit trail is implemented through one or both of:

1. **`movements` ledger** — for stock-affecting events, the movements table provides a permanent, immutable ledger. Rows are never updated or deleted. A compensating transaction (a new movement row with the opposite sign and a reason of `adjustment` or `reversal`) is used for corrections.
2. **`_audit` shadow tables or Supabase audit extension** — for non-stock state transitions (e.g. who approved a purchase order, when a transfer was dispatched), an audit log is maintained either as a separate `*_audit` table with `actor_id`, `action`, `old_value`, `new_value`, and `created_at` columns, or through the Supabase pg_audit extension.

The audit trail is immutable. Soft deletes (`deleted_at` timestamp) are used in preference to hard deletes for all tenant business data.

---

## Migration Strategy

- All schema changes are applied through migration scripts (located in the apiv1.0.2 backend's `src/database/migrate.ts` path as referenced in `TASKS.md`).
- Migrations are applied sequentially. Each migration is a single transaction where possible. Multi-step migrations that cannot be atomic (e.g. backfilling a new column in a large table) use a staged approach: add column nullable → backfill → add not-null constraint.
- Destructive changes (column drops, table drops) are always preceded by a deprecation migration that retains the column/table with a `_deprecated` suffix or a comment, deployed to production before the removal migration.
- The migration scripts are hard-wired to the `apiv1.0.2` Supabase project and require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ACCESS_TOKEN` environment variables. There is no local-Postgres fallback path at this time.

---

## Indexes and Performance

The following index patterns are standard and should be applied to every relevant table:

- **Tenant lookup index** — `CREATE INDEX ON <table> (company_id)` — required on every multi-tenant table to support efficient RLS policy evaluation.
- **Common filter indexes** — columns frequently used in `WHERE` clauses (e.g. `status`, `created_at`, `product_id`, `location_id`) should be indexed. Composite indexes are preferred over multiple single-column indexes when filter columns are always used together.
- **Movements ledger** — the `movements` table grows without bound (it is an immutable append-only ledger). It requires a compound index on `(company_id, product_id, location_id, created_at)` to support the per-product timeline query (Phase 5) and point-in-time reconstruction queries (Phase 5 Inventory Snapshot by Date).
- **Barcode lookup** — as noted in the `product_barcodes` schema above, `(company_id, barcode)` must be indexed for sub-millisecond scan resolution.

---

## Future: Financial Tables

Phase 10 (Document and Print Designer) and the future Advanced Accounting initiative (referenced in [`../future/README.md`](../future/README.md)) will introduce financial tables: journal entries, operating accounts, ledger postings, and payment records. These are out of scope for current phases. When introduced, they must follow the same `company_id` scoping, RLS, and audit trail patterns described in this document. See `docs/future/advanced-accounting.md` when that document is created.
