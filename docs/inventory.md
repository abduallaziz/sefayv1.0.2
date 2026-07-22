# Inventory & Purchasing

Enterprise inventory management for the Sefay multi-tenant POS/ERP platform.

---

## Architecture

- **NestJS** owns orchestration: controllers, DTOs/validation, RBAC (`@RequirePermission`), business policies (approval thresholds, status workflows), error mapping, and API contracts.
- **PostgreSQL RPC functions** (PL/pgSQL, migration `019_inventory_rpc_functions.sql`) are the sole atomicity boundary for every operation that mutates quantity or cost: stock movements, FIFO/average cost layer consumption, reservations, goods receipts, two-phase warehouse transfers, stock count finalization, and inventory adjustments. Each RPC call is one Postgres transaction; concurrent mutations are serialized with `SELECT ... FOR UPDATE` (or `FOR UPDATE SKIP LOCKED` for multi-worker claiming).
- **`stock_movements`** is an immutable, append-only ledger. DB triggers block `UPDATE`/`DELETE` outright. `stock_levels` is the current-quantity projection derived from it; `cost_layers` carries FIFO layers (or a single rolling average layer for `costing_method = 'average'` items).
- **Outbox pattern**: every mutating RPC inserts into `domain_events_outbox` via `_emit_domain_event()` inside the same transaction. A Cron scheduler (`OutboxRelayScheduler`, `src/core/outbox/`) claims pending/failed rows with `fn_claim_outbox_events` (`FOR UPDATE SKIP LOCKED`, safe under horizontal worker scaling) and enqueues them onto a dedicated BullMQ queue (`domain-events`); `OutboxProcessor` relays each event and marks it processed/failed with retry tracking.

---

## Legacy `stock_quantity`

`item_variants.stock_quantity` (and `items.cost_price`) predate this module and are now frozen historical snapshots:

- Migration `023_legacy_stock_migration.sql` backfilled any existing positive `stock_quantity` into `stock_levels`/`stock_movements`/`cost_layers` (via the same `fn_apply_stock_movement`/`fn_add_cost_layer` RPCs a real goods receipt uses), seeding a per-tenant "Main Warehouse" where none existed.
- DB triggers on `item_variants` reject any future `INSERT`/`UPDATE` that changes `stock_quantity`'s value — the column can never be written again, by any code path.
- `CreateVariantDto` no longer accepts `stock_quantity`; the field is gone from the API surface entirely.

All stock now flows exclusively through Inventory/Purchasing RPCs.

---

## Modules

- `src/modules/inventory/` — warehouses, locations, reorder points, stock levels/movements (read), reservations, adjustments, transfers, stock counts.
- `src/modules/purchasing/` — suppliers, purchase orders, goods receipts (posting a receipt calls `fn_post_goods_receipt`, which applies stock movements and cost layers atomically).
- `src/core/outbox/` — the relay worker described above.

---

## RBAC

Permissions are namespaced `inventory.*` / `purchasing.*` and seeded in `src/database/seeds/permissions.seed.ts`.

| Role | Inventory Access | Purchasing Access |
|---|---|---|
| `superadmin` | Full | Full |
| `owner` | Full | Full |
| `manager` | Full | Full |
| `inventory_clerk` | view, adjust, transfer, count, reserve | manage, receive (but NOT approve) |
| `cashier` | view, reserve | — |
| `worker` | view | — |

The `inventory_clerk` role was introduced with the Inventory & Purchasing Core module. It is a new role that did not exist in the V1.02 phase.

---

## Frontend

`sefayv1.0.2/src/features/{suppliers,warehouses,purchase-orders,goods-receipts,stock,adjustments}` consume only the endpoints defined by the inventory and purchasing modules. No remaining calls go into legacy item-stock fields. Sidebar nav and approve-action gating mirror the backend permission matrix above.

---

## Key RPC Functions (019_inventory_rpc_functions.sql)

| Function | Purpose |
|---|---|
| `fn_apply_stock_movement` | Atomic stock movement: updates `stock_levels`, inserts `stock_movements`, updates `cost_layers` |
| `fn_add_cost_layer` | Adds a FIFO cost layer for a received batch |
| `fn_post_goods_receipt` | Applies all goods receipt lines atomically (calls `fn_apply_stock_movement` per line) |
| `fn_reserve_stock` | Creates a reservation record and decrements available qty atomically |
| `fn_release_reservation` | Cancels a reservation and restores available qty |
| `fn_finalize_stock_count` | Posts adjustments for all counted lines vs system quantities |
| `fn_claim_outbox_events` | Claims pending outbox rows for relay worker (`FOR UPDATE SKIP LOCKED`) |
| `_emit_domain_event` | Internal helper called inside other RPCs to insert outbox event in same transaction |

---

## Immutability Guarantees

The inventory ledger is protected by database-level immutability:

- `stock_movements` rows cannot be updated or deleted (triggers block it).
- `cost_layers` rows cannot be modified once a consumption has been recorded against them.
- `domain_events_outbox` rows transition forward only (pending → claimed → processed/failed).

These guarantees hold regardless of what application code does. The database enforces them unconditionally.
