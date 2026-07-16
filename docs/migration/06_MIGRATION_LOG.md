# Migration Log

Append-only. Each completed Matrix item gets one entry, per the format defined in `03_EXECUTION_PROTOCOL.md`.

---

## Historical entries (C1–C4, D1–D6) — reconstructed summary

The detailed per-item Migration Log entries for C1, C2, C3, C4, and D1–D6 were originally produced in conversation during the v1 planning phase and were lost to context-window truncation before this file existed. Their outcomes are confirmed accurate by direct code inspection (see `01_ARCHITECTURAL_AUDIT.md`), and their summary is recorded in `05_MIGRATION_MANIFEST.md`'s Completed Items table. Full narrative detail (exact Visual Diff Summary wording, exact Design Consistency Check per property) for these historical items is not recoverable and will not be reconstructed from memory, per explicit instruction. Going forward, every new item's full entry is appended below at completion time, so this gap does not recur.

---

(New entries appended below as items complete.)

---

## E1 — input.tsx

Date: 2026-07-16
Files Changed: `src/shared/ui/input.tsx` (className string only)

Behavior Change Assessment: No logic changed. API preserved exactly — `forwardRef`, `InputProps` shape, `type`/`className`/`...props` passthrough, `ref`, `displayName`. File-input support, disabled treatment, placeholder behavior, focus-visible behavior, and full-width behavior all retained.

Design Consistency Check: No standalone Input component exists in pos-cloud. Derived from the established `posCloud`/`posCloudDark` token conventions already used in D1–D6, matching `SelectTrigger`'s field styling as the closest existing migrated form-field primitive. Border, background, text/placeholder, radius (`rounded`, not `rounded-lg`), focus ring (`ring-posCloud-primary/40`), and disabled treatment — all Exact Match to Button/Select conventions.

Consumer Count: 6 before / 6 after (unchanged) — TenantsFilters.tsx, ExtendTrialDialog.tsx, PlanFormDialog.tsx, ManualPaymentDialog.tsx, SubscriptionsPage.tsx, ResetPasswordDialog.tsx. Below the 10-consumer Manual QA trigger.

Visual Diff Summary: Hardcoded hex (`#1e2130`, `#141720`, `#64748b`, focus ring `#6366f1`) and `slate-*` utilities → `posCloud`/`posCloudDark` tokens, focus ring changed to the system's actual primary blue. Animation Change: none (`transition-colors` retained).

Validation: tsc clean; eslint 1 pre-existing error (empty `InputProps` interface, line 4, verified untouched — see DEF-5); next build all 47 routes compiled; dev server runtime clean, no new console errors (login page, the only publicly-reachable page, renders with no regression; the 6 real consumers are superadmin-only/auth-gated and not directly screenshotted).

Defects/Findings discovered: DEF-5 (pre-existing, logged, not fixed).

---

## E2 — modal.tsx — Skipped (Dead Component)

Date: 2026-07-16
Files Changed: none.

Consumer Count: 0 — confirmed dead code (searched import path and `import { Modal }` across all of `src/`, no matches).

Finding: Duplicates `dialog.tsx`'s purpose (already migrated, Radix-based). Logged as AF-6, deletion candidate. Not styled, not deleted per explicit user decision — deletion/consolidation deferred to a future architectural cleanup task after the migration completes.

---

## E3 — confirm-dialog.tsx

Date: 2026-07-16
Files Changed: `src/shared/ui/confirm-dialog.tsx`

Behavior Change Assessment: No logic changed. Full API preserved — all props, ESC-key handling, scroll lock, `createPortal`, accessibility attributes (`role="alertdialog"`, `aria-modal`, `aria-labelledby`), disabled-during-loading behavior all untouched.

Design Consistency Check: No confirm/cancel dialog exists in pos-cloud (no such business flow in mock data). Derived from established `posCloud`/`posCloudDark` tokens per the permanent E1 rule — overlay opacity matched to Dialog's `bg-black/60` convention, surface/border/text tokens matched to Dialog/Button conventions, danger/warning variant colors sourced from the same token family as StatusBadge's danger/warning tones (D3) instead of raw `red-*`/`amber-*`.

Consumer Count: 13 before / 13 after (unchanged) — AccessControlPage.tsx, EmployeeDetailPage.tsx, UsersPage.tsx, EmployeesPage.tsx, DeleteWarehouseModal.tsx, CancelTransferModal.tsx, DeleteSupplierModal.tsx, CancelPurchaseOrderModal.tsx, CancelOrderModal.tsx, DeleteLocationModal.tsx, DeleteItemModal.tsx, CancelGoodsReceiptModal.tsx, DeleteCustomerModal.tsx. Exceeds 10-consumer Manual QA threshold — flagged, not blocking.

Visual Diff Summary: Overlay `/50`→`/60`; raw Tailwind palette (`red-*`, `amber-*`, `slate-*`, `gray-*`) → `posCloud`/`posCloudDark` tokens throughout. Animation Change: none (`animate-in fade-in zoom-in-95 duration-150` retained).

Validation: tsc clean; eslint clean; next build all 47 routes compiled; dev server runtime clean, no regression (13 real consumers are auth-gated feature pages, not directly screenshotted).

Defects/Findings discovered: none new.

---

## E4 — separator.tsx — Skipped (Dead Component)

Date: 2026-07-16
Files Changed: none.

Consumer Count: 0 — confirmed dead code (searched import path and `import { Separator }` across all of `src/`, no matches; no naming-variant duplicate found).

Finding: Logged as AF-7, deletion candidate. Not styled, not deleted — deferred to the future architectural cleanup task alongside AF-6.

---

## E5 — Skeleton (corrected scope)

Date: 2026-07-16
Files Changed: `src/shared/components/ui/Skeleton.tsx` (the real, live Skeleton — `shared/ui/skeleton.tsx`, the Matrix's originally-scoped file, was confirmed dead code, 0 consumers, and left untouched).

Scope correction: AF-2's two-folder split caused the Matrix to scope E5 against the wrong file. Discovered during pre-implementation consumer count: `shared/ui/skeleton.tsx` has 0 consumers; `shared/components/ui/Skeleton.tsx` has 18. Logged as AF-8. Corrected in-flight and migrated the real file, since it's the actual visual-parity gap.

Behavior Change Assessment: No logic changed. `Skeleton`, `KpiCardSkeleton`, `TableSkeleton`, `CardListSkeleton`, `PageHeaderSkeleton` all retain identical props/structure — only color classes changed.

Design Consistency Check: No dedicated skeleton/loading-state component exists in pos-cloud (no loading states with mock data). Derived from established `posCloud`/`posCloudDark` tokens — surface/border matched to Card/Dialog conventions, base skeleton fill matched to the border-token family (a muted, low-contrast fill consistent with the rest of the palette) rather than raw `slate-200`/`gray-800`/`gray-900`.

Consumer Count: 18 before / 18 after (unchanged) — WarehousesPage, TransfersPage, TransferDetailPage, SupplierDetailPage, SuppliersPage, StockPage, StockCountsPage, StockCountDetailPage, PurchaseOrdersPage, PurchaseOrderDetailPage, MovementsPage, LocationsPage, InventoryReportsPage, InventoryDashboardPage, GoodsReceiptsPage, GoodsReceiptDetailPage, AdjustmentsPage, AdjustmentDetailPage. Exceeds 10-consumer Manual QA threshold — flagged, not blocking.

Visual Diff Summary: `bg-slate-200/70 dark:bg-gray-800` (base fill) and `bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800` (card wrappers) → `posCloud`/`posCloudDark` tokens throughout. Animation Change: none (`animate-pulse` retained).

Validation: tsc clean; eslint clean; next build all 47 routes compiled; dev server runtime clean.

Defects/Findings discovered: AF-8 (scope correction, resolved in-flight).

---

## E6 — number-input.tsx — No Action Required

Date: 2026-07-16
Files Changed: none.

Finding: Component has zero baked-in color classes — fully unopinionated, `className` passed through from each of its 4 consumers. Re-verified the D6-era note that flagged this as possibly needing work; confirmed still true, nothing to tokenize. The numeral-forcing logic (`lang="en"`, `dir="ltr"`, regex-gated onChange — tied to the permanent "English numerals everywhere" rule) was read and confirmed untouched, not modified.

---

## E7 — stat-card.tsx — Skipped (Dead Component)

Date: 2026-07-16
Files Changed: none.

Consumer Count: 0 — confirmed dead code (searched import path and named-import across all of `src/`, no matches). Also uses a third, pre-migration legacy token namespace (`brand-light`, `semantic-*-bg`, `surface-card`, `content-*`), confirming DEF-4's "dead-token classes" observation.

Finding: This resolves the "requires re-confirmation" blocker previously logged for E7 — there is no active deferral decision to reconfirm, since the component has no consumers to affect. Reclassified DEF-4 as superseded; logged as AF-9, deletion candidate. Not styled, not deleted — deferred to the future architectural cleanup task alongside AF-6/AF-7/AF-8.

---

## E-Series Complete

All 7 items (E1–E7) resolved: E1 (Done), E2 (Skipped, dead), E3 (Done), E4 (Skipped, dead), E5 (Done, scope-corrected), E6 (No Action Required), E7 (Skipped, dead). Checkpoint 3 is complete.

---

## F1 — POS Page — Size Assessment and Breakdown

Date: 2026-07-16
Files Changed: none (planning only).

F1 was assessed before implementation: 6 files, 1,181 lines, 6 independent visual areas (page shell, item grid, cart panel, payment modal, receipt modal, customer picker modal), 3 of which have no pos-cloud reference at all. Confirmed each sub-component has exactly 1 consumer (`POSPage.tsx`). Split into F1.1–F1.6 per user approval. Execution order set to F1.1 → F1.2 → F1.3 → F1.4 → F1.5 → F1.6 (shell first, so remaining sections build on the final layout).

---

## F1.1 — POS Page Shell

Date: 2026-07-16
Files Changed: `src/features/pos/page/POSPage.tsx` (layout/className only)

Behavior Change Assessment: No logic changed. `mobileTab` state, checkout flow (`handleCheckoutClick`, `handleConfirmPayment`, `handleNewOrder`), all `useQuery` data fetching (branches, currentShift, posConfig), `useCart` hook usage, all modal trigger conditions (`showPayment`, `showCustomerPicker`, `receipt`) — all untouched. Only layout/spacing/color classes changed.

Design Consistency Check: Compared against pos-cloud's outer layout (`flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-start`). Spacing (`gap-4`→`gap-5`, `p-4`→`p-4 sm:p-6`), cart panel radius (`rounded-xl`→`rounded-2xl`) and padding (`p-4`→`p-5`) and width (`w-80`→`w-[340px]`) all matched to pos-cloud exactly. Colors converted from hardcoded hex/gray palette to `posCloud`/`posCloudDark` tokens. Mobile tab bar: no pos-cloud equivalent exists (pos-cloud stacks content vertically instead of tabbing) — Sefay's tabbed mobile UX is an existing capability, kept per rule 4, restyled with the same token language. Page's fixed-height/internal-scroll structure (vs. pos-cloud's page-level scroll) kept as a Product Decision continuity — extension of the already-approved PD-3/PD-4 precedent to this page, not a new decision.

Consumer Count: 1 before / 1 after (route file) — unchanged.

Visual Diff Summary: Mobile tab active/inactive colors, badge color, gap/padding spacing values, cart panel radius/padding/width — all converted to match pos-cloud's exact values where a reference exists, tokenized where it doesn't (mobile tabs). Animation Change: none (`transition-colors` retained).

Validation: tsc clean; eslint 5 pre-existing errors (all `@typescript-eslint/no-explicit-any` on data-fetching/error-handling lines untouched by this edit — lines 32, 38, 54, 86, 92, verified against pre-edit content); next build all 47 routes compiled; dev server runtime clean.

Defects/Findings discovered: none new (DEF-6 logged separately).

Deployed to production: commit `f3c9b50`, https://sefayv1-0-2.vercel.app/. User visual review found F1.1's visible impact minimal — expected, since the shell change doesn't touch the two components rendering ~100% of the page's visible content (`ItemGrid.tsx`, `CartPanel.tsx`). Confirmed by user as F1.1 having achieved exactly its intended (limited) scope; approved to proceed.

---

## F1.2 — Item Grid

Date: 2026-07-16
Files Changed: `src/features/pos/components/ItemGrid.tsx`

Behavior Change Assessment: No logic changed. Search/category filtering (`filtered`), `handleItemClick`, `VariantModal` open/close and its own add-to-cart logic, all `useItems`/`useCategories`/`useItemVariants` data fetching — all untouched. Only layout/classes changed (added a `Search` icon import for the search field, no logic import).

Design Consistency Check: Compared against pos-cloud lines 183–236. Search field: wrapped in a bordered/surfaced container with an inline `Search` icon (previously a bare input), matching pos-cloud exactly. Category chips: `rounded-lg px-4 py-2` (was `rounded-lg px-3 py-1`), active `bg-posCloud-primary`, inactive `bg-posCloud-surface border` (was borderless `bg-gray-100`) — Exact Match. Product grid: `gap-4` + `xl:grid-cols-4` breakpoint added (was `gap-3`, capped at `sm:grid-cols-3`) — Exact Match. Product cards: `rounded-2xl` (was `rounded-xl`), added `shadow-[0_1px_2px_rgba(15,23,42,0.04)]` and `hover:-translate-y-0.5 hover:border-primary/40` (was `hover:shadow-sm active:scale-95`), text alignment `text-center` (was `text-right`) — Exact Match to pos-cloud's card treatment. Sefay-only badges (`service` type tag, `has_variants` "multiple" tag — not present in pos-cloud) kept per rule 4, restyled with `posCloud` tokens instead of hardcoded hex.

Known content gap (not a styling gap): pos-cloud's product cards display a photo. Sefay's real `Item` type (`item.types.ts`) has no `image_url` field — confirmed via direct inspection of the type and the API-backed `useItems` hook. The `POSItem.image_url?: string` field in the POS-local type is unused/unpopulated. Images were not added, since doing so would require inventing backend functionality (placeholder or fabricated image data), which is explicitly out of scope. Card structure otherwise matches pos-cloud exactly, minus the image slot.

Button evaluation (requested by user, applies to F1.3 not F1.2): confirmed `shared/ui/button.tsx`'s `Button` can fully replace `CartPanel.tsx`'s raw checkout `<button>` with zero behavior change (`onClick`/`disabled` semantics identical, `size="lg"` + className override reproduces the exact `h-12` sizing). Will be applied during F1.3.

Consumer Count: 1 before / 1 after (`POSPage.tsx`) — unchanged.

Visual Diff Summary: Search field gained a bordered container + icon; category chips gained padding/border changes; product cards gained rounded-2xl radius, shadow, lift-on-hover, and center-aligned text; all colors converted from hardcoded hex/`gray-*` to `posCloud`/`posCloudDark` tokens. Animation Change: `active:scale-95` (tap-down) replaced by pos-cloud's `hover:-translate-y-0.5` (lift-on-hover) — a real interaction-pattern change matching pos-cloud exactly, not just a color change.

Validation: tsc clean; eslint 2 pre-existing errors (`t: any` prop, `v: any` in variants map — both untouched by this edit, verified against pre-edit content); next build all 47 routes compiled; dev server runtime clean.

Defects/Findings discovered: none new.

Not deployed after F1.2 per user instruction — reviewed together with F1.3.

---

## F1.3 — Cart Panel

Date: 2026-07-16
Files Changed: `src/features/pos/components/CartPanel.tsx`

Behavior Change Assessment: No logic changed. `handleApplyCoupon` (real `/coupons/validate` API call via `couponsApi.validate`), `onUpdateQty`, `onRemoveItem`, `onClearCoupon`, `onClearCustomer`, `onCheckout` — all untouched. The raw checkout `<button>` was replaced with the shared `Button` primitive (`shared/ui/button.tsx`, migrated in D1) — `onClick={onCheckout}` and `disabled={cart.items.length === 0}` preserved exactly, `size="lg"` + `className="w-full h-12"` reproduces the prior sizing. Confirmed zero behavior change before implementation, per user's explicit evaluation request in F1.2.

Design Consistency Check: Compared against pos-cloud lines 239–432. Cart line items: `rounded-xl bg-background` (was `rounded-lg bg-gray-50`) — Exact Match. Qty buttons: bordered (`border border-posCloud-border`) instead of filled gray background — Exact Match to pos-cloud's bordered qty-button style. Coupon input/apply button: `bg-posCloud-primary-light` apply button (was solid `bg-[#0C447C]`) — Exact Match to pos-cloud's `bg-primary-light` coupon-apply treatment. Totals block: `text-xs` line items + `text-base font-extrabold` total (was `text-sm` + `font-bold`) — Exact Match. Checkout button: now the shared `Button` primitive, matching pos-cloud's use of its own shared `Button` component structurally (both use a design-system button instead of a raw one) — Exact Match in approach.

Sefay production features kept, restyled only: coupon apply/remove flow (real API validation — not in pos-cloud, which has no equivalent), customer info display (`customerCaptureEnabled`/`selectedCustomer` — not in pos-cloud). Both retained per rule 4, now using `posCloud`/`posCloudDark` tokens.

Consumer Count: 1 before / 1 after (`POSPage.tsx`) — unchanged.

Visual Diff Summary: Cart line radius/background, qty button style (filled→bordered), coupon apply button color, totals typography weight/size, checkout button now componentized via shared `Button` instead of a duplicate raw `<button>` with its own hardcoded styling. Animation Change: none (`transition-colors` retained; `Button`'s own `transition-colors` inherited).

Validation: tsc clean; eslint 1 pre-existing error (`catch (e: any)` in `handleApplyCoupon`, untouched by this edit, verified against pre-edit content); next build all 47 routes compiled; dev server runtime clean.

Defects/Findings discovered: none new.

F1.2 + F1.3 together represent the POS page's primary visual transformation, reviewed together per user instruction rather than deploying after F1.2 alone.
