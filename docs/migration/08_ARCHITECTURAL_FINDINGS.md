# Architectural Findings

Append-only. Structural/architectural observations that are not defects. Informational by default; only block execution if they directly conflict with an in-progress item's scope.

---

## AF-1 — `badge.tsx` vs `status-badge.tsx` duplication

Two components with overlapping purpose exist in `src/shared/ui/`. Only `status-badge.tsx` was migrated to `posCloud`/`posCloudDark` tokens (17 consumers, Matrix Item D3). `badge.tsx` (1 consumer) was left untouched by explicit prior user decision: reclassified as an Architectural Finding, not a Defect, "Deferred for architectural review. No consolidation work is authorized during the current migration."

Status: Open, deferred. Do not consolidate without a separate, explicit decision.

---

## AF-2 — `shared/ui/` vs `shared/components/ui/` parallel folders

Two UI folders exist. `shared/components/ui/` contains only `Pagination.tsx`, `RequiredMark.tsx`, `Skeleton.tsx`. Note: this `Skeleton.tsx` is a distinct component from `shared/ui/skeleton.tsx` — a naming collision across folders that could confuse future consumers or migration items (e.g. E5).

Status: Open, not yet assessed for consolidation. Flag again if E5 (skeleton.tsx migration) is started — confirm which Skeleton is meant before touching either.

---

## AF-3 — Sidebar structural positioning (fixed vs flex-flow) — RESOLVED

Sefay's `DashboardSidebar` originally used `position: fixed` + a manually-synchronized width offset on `<main>` (`lg:ms-[264px]`), diverging from pos-cloud's flex-flow (`position: static`) sidebar. Evaluated across 9 criteria (visual parity, responsiveness, RTL, mobile drawer, layout stability, scroll behavior, maintainability, architecture compatibility, regression risk) — resolved via Matrix Item C4: adopted `lg:sticky` flex-sibling positioning (removing the magic-number coupling) while explicitly preserving Sefay's sticky-header/independent-scroll behavior as Approved Product Decisions (`04_PRODUCT_DECISIONS.md` PD-3, PD-4, PD-5), not as a gap to close toward pos-cloud.

Status: Resolved (C4). No longer open.

---

## AF-4 — Inventory suite scope mismatch (pos-cloud 1 page vs. Sefay 10 pages)

pos-cloud's `dashboard/inventory/page.tsx` is a single mock page. Sefay's inventory domain spans 10 real sub-features: `inventory-dashboard`, `warehouses`, `locations`, `stock`, `movements`, `transfers`, `adjustments`, `stock-counts`, `purchase-orders`, `goods-receipts`, `inventory-reports`. There is no 1:1 visual reference for 9 of these 10 pages.

Status: Open. Requires a scoping decision before Matrix Item F11 can be executed — logged in `02_MIGRATION_MATRIX.md` and `05_MIGRATION_MANIFEST.md` as an open blocker, not yet escalated for a decision since F11 has not been started.

---

## AF-5 — `branches` page in pos-cloud has no valid Sefay counterpart

pos-cloud has a `dashboard/branches/page.tsx`. Building an equivalent in Sefay would require a real branch backend/store, which does not exist (PD-6/B6 ruling) and would violate the "no new architecture" rule. This is not a missing-feature gap — it's a prototype page with no legitimate migration target under current rules.

Status: Not applicable / will not be built. No action needed unless the underlying B6 decision is revisited by the user in a future, separate conversation.

---

## AF-6 — `modal.tsx` is dead code, duplicates `dialog.tsx`

`src/shared/ui/modal.tsx` exports a custom, non-Radix `Modal` component (controlled via `open`/`onClose` boolean prop, own `theme: 'superadmin' | 'dashboard'` branching, currently unmigrated/hardcoded hex colors). Confirmed **0 consumers** anywhere in `src/` (searched both the import path and `import { Modal }`). Its responsibility is already covered by `dialog.tsx` (`Dialog`/`DialogContent`/etc., Radix-based, migrated in D6).

Discovered during Matrix Item E2 pre-implementation consumer count.

**Deletion candidate.** Do not style, do not delete now — deletion or consolidation with `dialog.tsx` is deferred to an explicit architectural cleanup task after the UI migration is complete, per user decision.

Status: Open, logged as a deletion candidate. E2 marked Skipped (Dead Component) in `05_MIGRATION_MANIFEST.md` and `02_MIGRATION_MATRIX.md`.

---

## AF-7 — `separator.tsx` is dead code

`src/shared/ui/separator.tsx` exports a Radix-based `Separator` component (horizontal/vertical, currently hardcoded `bg-[#1e2130]`). Confirmed **0 consumers** anywhere in `src/` (searched both the import path and `import { Separator }`). No naming-variant duplicate found nearby.

Discovered during Matrix Item E4 pre-implementation consumer count.

**Deletion candidate.** Not styled, not deleted — deferred to the same future architectural cleanup task as AF-6.

Status: Open, logged as a deletion candidate. E4 marked Skipped (Dead Component).

---

## AF-8 — `shared/ui/skeleton.tsx` is dead code; the real live Skeleton is in the sibling folder

`src/shared/ui/skeleton.tsx` (the file the Matrix originally scoped as E5) has **0 consumers**. The actual live Skeleton primitive — `Skeleton`, `KpiCardSkeleton`, `TableSkeleton`, `CardListSkeleton`, `PageHeaderSkeleton` — lives in `src/shared/components/ui/Skeleton.tsx`, with **18 consumers** across the inventory-suite pages (WarehousesPage, TransfersPage, TransferDetailPage, SupplierDetailPage, SuppliersPage, StockPage, StockCountsPage, StockCountDetailPage, PurchaseOrdersPage, PurchaseOrderDetailPage, MovementsPage, LocationsPage, InventoryReportsPage, InventoryDashboardPage, GoodsReceiptsPage, GoodsReceiptDetailPage, AdjustmentsPage, AdjustmentDetailPage).

This confirms AF-2's two-folder split caused a real scope error: the Matrix's primitive inventory (built by listing `shared/ui/*` only) missed that this component's live implementation is in the sibling folder. **E5 was corrected in-flight**: the dead `shared/ui/skeleton.tsx` was left untouched (logged here), and `shared/components/ui/Skeleton.tsx` was migrated instead, since it's the actual visual-parity gap.

**Action needed for AF-2**: when AF-2 is eventually resolved (folder consolidation), confirm no other Matrix items have the same mis-scoping (i.e., double-check `shared/ui/*` items against `shared/components/ui/*` for name collisions before assuming a "dead" `shared/ui/*` file has no live counterpart elsewhere).

Status: Open (AF-2 still unresolved), E5 corrected and completed against the right file. `shared/ui/skeleton.tsx` logged as an additional deletion candidate for the future cleanup task.

---

## AF-9 — `stat-card.tsx` is dead code (supersedes DEF-4)

`src/shared/ui/stat-card.tsx` (E7) has **0 consumers**, confirmed via import-path and named-import search. Also uses a third, pre-migration legacy token namespace (`brand-light`, `semantic-success-bg`, `surface-card`, `content-*`) — none `posCloud`/`posCloudDark` — confirming DEF-4's "dead-token classes" observation was accurate, but reclassifying it: dead code producing no runtime behavior is not a Defect, it's a deletion candidate.

Discovered during Matrix Item E7 pre-implementation consumer count — this also resolves the "requires re-confirmation" blocker that was previously logged against E7, since there is no longer an active deferral decision to reconfirm (the component has no consumers to affect).

**Deletion candidate.** Not styled, not deleted — deferred to the same future architectural cleanup task as AF-6/AF-7/AF-8.

Status: Open, logged as a deletion candidate. E7 marked Skipped (Dead Component). DEF-4 superseded — see `07_DEFECT_LOG.md`.
