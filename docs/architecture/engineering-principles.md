# Engineering Principles

*Added: 2026-06-30*

---

## Overview

This document defines the engineering principles, code quality standards, testing pipeline, git workflow, and cross-cutting technical rules that apply to all development on the Sefay ERP platform. Every engineer contributing to the project is expected to be familiar with and to apply these principles consistently. Individual feature decisions should be traceable to these principles.

These principles are not aspirational guidelines — they are standing rules enforced through the verification pipeline described below. A change that violates them is not ready to merge.

---

## Core Engineering Principles

### Separation of Concerns

Each module, component, and service has a single, well-defined responsibility. UI rendering logic does not perform data fetching. Business logic does not directly reference UI primitives. Service functions do not contain routing or presentation logic. When a file grows ambiguous in its purpose, it is a signal that it needs to be split.

### Modular Architecture

The project is organized around features (`src/features/`) that own their internal implementation details, and a shared layer (`src/shared/`) that provides primitives reused across features. Features do not import from each other's internals. Cross-feature coordination happens through shared services, shared types, or navigation, never through direct component imports between feature folders.

### Reusable Services

Business logic that is needed by more than one feature lives in a shared service or utility, not duplicated in each feature. The history of shared components in this project — `StatusBadge`, `EmptyState`, `ConfirmDialog`, `SingleDatePicker`, `DateRangePicker`, `exportToCsv` — illustrates this rule in action: each was extracted from duplicate implementations found in multiple features and promoted to a single canonical location.

### Provider Abstraction

Infrastructure dependencies (storage, AI providers, external APIs) are accessed through interface-typed abstractions rather than SDK calls at call sites. This allows providers to be swapped without touching business logic. See [`storage-abstraction.md`](./storage-abstraction.md) and [`ai-architecture.md`](./ai-architecture.md) for current applications of this principle.

### Future Compatibility

Design choices are evaluated not just for today's requirements but for the planned evolution of the system described in `TASKS.md`. A decision that solves today's problem but forecloses a planned Phase 6 or Phase 11 capability is reconsidered before it is merged. The roadmap is not a constraint on creativity, but it is an input to every significant design decision.

---

## Code Quality Standards

### TypeScript Strict Mode

The project runs TypeScript in strict mode (`tsconfig.json`). Every file must compile clean under `tsc --noEmit` with no suppressions or `any` casts that are not explicitly justified in a comment. Type-level correctness is not optional.

### No Raw `<input type="date">`

All date fields in the application must use the shared `SingleDatePicker` or `DateRangePicker` components (`src/shared/ui/`). Raw `<input type="date">` elements are prohibited in application code because they render incorrectly in RTL contexts without an explicit `dir="ltr"` override, and that override must be managed centrally in the shared components, not at each call site. This rule was established after fixing the RTL rendering bug in `PurchaseOrderFormModal.tsx`, `MovementsFiltersBar.tsx`, and `GoodsReceiptLineItems.tsx`. The only permitted occurrences of `type="date"` in `src/` are inside the shared date-picker components themselves.

### Shared Components Over Duplication

Before writing a new component or utility, search for an existing shared primitive that can be extended. Before shipping a feature-specific component, evaluate whether it belongs in `src/shared/`. Duplication is a code smell that is tracked and eliminated as part of routine audits (see Phase 2 Inventory UX audit in `TASKS.md`).

### Zero Net-New Lint Regressions

Every change must be lint-clean or, where pre-existing lint issues exist in unrelated files, must not increase the count of lint errors or warnings. The baseline at the time of the Phase 2 audit was 95 problems (77 errors, 18 warnings). Any change that introduces new lint issues in files it touches must resolve them before merging.

---

## Testing and Verification Pipeline

Every change must pass the full verification pipeline before it is considered complete. The steps are sequential — a failure at any step stops the pipeline.

### Step 1 — TypeScript Compilation

```bash
tsc --noEmit
```

Must exit with zero errors. No exceptions.

### Step 2 — Lint Baseline Preservation

```bash
npm run lint
```

Must not introduce new lint problems in files touched by the change. The total problem count must not increase beyond the established baseline.

### Step 3 — Production Build

```bash
npm run build
```

Must complete successfully. A change that passes TypeScript and lint but fails the Next.js build pipeline is not ready.

### Step 4 — UI Verification (Playwright)

For changes that affect visual rendering — component redesigns, popup positioning, responsive layout, RTL/LTR behavior — Playwright screenshots are taken at the relevant breakpoints and locales to confirm correct behavior. Minimum viewports for responsive work: 320px (mobile portrait), 375px (mobile standard), 768px (tablet), 1280px (desktop). Both `ar` and `en` locales must be verified when a change affects direction-sensitive layout.

### Step 5 — Smoke Check

For changes that affect interactive behavior (date pickers, modals, filters, forms), a `next dev` smoke check confirms that the relevant pages render and interactive flows complete without console errors.

---

## Documentation Standards

Every significant engineering decision made during implementation must be recorded. This means:

- If a design was considered and rejected, note why in the relevant `TASKS.md` entry or in a new ADR in [`docs/decisions/`](../decisions/README.md).
- If a shared component is created, update the relevant architecture document.
- If a standing rule is established (such as the no-raw-date-input rule above), record it here and in the relevant architecture document.
- If a phase is completed, update `STATUS.md` and ensure `TASKS.md` reflects the final as-built state, not only the original plan.

The full Documentation Policy is described in [`docs/README.md`](../README.md#documentation-policy).

---

## Git Workflow

1. **Feature branch** — all work is done on a named branch off the main branch. Branch names are descriptive of the task (e.g. `phase2-inventory-ux-audit`, `date-picker-portal-fix`).
2. **Verify** — run the full verification pipeline (TypeScript, lint, build, Playwright, smoke check) on the branch before requesting a merge.
3. **Merge no-ff** — branches are merged with `--no-ff` to preserve branch history in the commit graph. Squash merges lose the intermediate commit context that is useful for debugging.
4. **Push** — push the merged result to the remote. Do not force-push to shared branches.
5. **PR description** — pull request descriptions reference the relevant `TASKS.md` section, list what was changed, and confirm which verification steps were run and passed.

---

## Security Principles

- Authentication is enforced at the API boundary. Frontend gating (hiding buttons, navigation guards) is a UX convenience only — it is not a security control.
- Every database operation that touches tenant data must be scoped by `company_id`. Row-Level Security policies in Supabase enforce this at the database layer. See [`security-architecture.md`](./security-architecture.md).
- Signed URLs for asset access are generated server-side only. The client never receives storage credentials. Default expiry: 15 minutes for previews, 60 minutes for print/download contexts.
- Tenant data is not sent to external AI providers without an explicit data-privacy review. See [`ai-architecture.md`](./ai-architecture.md).
- Input validation is performed on both the frontend (immediate user feedback) and the backend (the authoritative gate). Frontend validation is never the sole line of defense.

---

## Performance Principles

- List tables that may grow large (Stock Levels, Movements, Purchase Orders) require server-side pagination. The current known gap — five Inventory modules lacking pagination entirely — is tracked in `TASKS.md` Phase 2 remaining items.
- Expensive derived computations (inventory health scores, ABC analysis, snapshot reconstructions) are performed server-side and cached, not computed inline per render.
- Portal-rendered popups (`createPortal`) use `useFloatingPosition` for viewport-aware positioning to avoid layout reflows caused by incorrect size assumptions in scrollable containers.
- Image assets (company logos, stamps, signatures) are stored in original resolution and served through optimized variants via the `StorageProvider` interface. See [`storage-abstraction.md`](./storage-abstraction.md).

---

## Accessibility Principles

- All confirmation dialogs use `role="alertdialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the dialog title. ESC closes the dialog unless an async operation is in progress.
- Interactive elements (buttons, form fields) have visible focus indicators.
- Form fields use `<label>` elements with explicit `htmlFor` associations, not proximity-based implicit association.
- Required fields carry a visual indicator (the shared `RequiredMark` component) in addition to validation messages, so required status is visible before a failed submit.

### RTL/LTR

- The application supports both Arabic (`ar`, `dir="rtl"`) and English (`en`, `dir="ltr"`) via `next-intl`. Layout, spacing, icon mirroring, and text alignment must be verified in both directions for every visual change.
- Date inputs within shared components carry an explicit `dir="ltr"` override on the input element itself, because date segment ordering (day/month/year) is locale-independent even when the surrounding UI is RTL. This override is managed in `SingleDatePicker.tsx` and `DateRangePicker.tsx` — not at call sites.
- The known pre-existing cosmetic issue with the year-range header reversing bounds under `dir="rtl"` (two separate JSX text nodes subject to bidi reordering) should be resolved using `<bdi>` wrapping or a pre-formatted string before the date pickers are considered fully RTL-complete.

---

## Internationalization

- The application uses `next-intl` for all user-visible strings. Hard-coded English (or Arabic) strings in component JSX are not permitted.
- Translation keys are added to both `messages/en.json` and `messages/ar.json` in the same commit. A key that exists in one locale file but not the other is a bug.
- The supported locales are `ar` and `en`. The routing pattern is `app/[locale]/`. See [`frontend-architecture.md`](./frontend-architecture.md) for the routing detail.
- Pluralization must use `next-intl`'s plural form support, not string concatenation (e.g. `"1 items"` is incorrect; the singular/plural distinction must be handled through the translation system).
