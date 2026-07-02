# Frontend Architecture

*Added: 2026-06-30*

---

## Overview

The Sefay ERP frontend is built on **Next.js 15** using the App Router *(note: an earlier version of this document stated 16.2.6 — the correct version per RUNBOOK.md is Next.js 15)*, **React 19**, **TypeScript** in strict mode, **Tailwind CSS v3** for styling, and **next-intl** for Arabic/English internationalization. It runs inside the `sefayv1.0.2` project and communicates with the NestJS backend (`apiv1.0.2`) via authenticated REST API calls to `/api/v1/...`.

The frontend is an ERP application, not a marketing site — it prioritizes data density, keyboard accessibility, and operational correctness over visual novelty. Component decisions are biased toward reuse and toward matching the established Sefay design language (`rounded-2xl`, `shadow-2xl`, brand color `#0C447C`, slate/gray dark-mode palette).

**State management:** TanStack Query (server state), Zustand (UI state), react-hook-form + zod (forms).

---

## Folder Structure

```
src/
├── app/
│   └── [locale]/          ← locale-prefixed App Router root
│       ├── layout.tsx
│       ├── page.tsx
│       └── (feature routes)
├── features/              ← one subfolder per business domain
│   ├── inventory/
│   ├── orders/
│   ├── customers/
│   ├── suppliers/
│   ├── products/
│   └── settings/
└── shared/
    ├── ui/                ← reusable, design-system UI primitives
    ├── utils/             ← pure utility functions (e.g. exportCsv.ts)
    ├── hooks/             ← shared React hooks
    ├── services/          ← shared API service functions
    ├── storage/           ← StorageProvider interface and adapters (Phase 11)
    └── types/             ← shared TypeScript types and interfaces
```

### `src/features/`

Each feature folder owns its components, hooks, API calls, and local types. Feature internals are private — one feature folder does not import from another feature folder's internals. Shared needs are promoted to `src/shared/`.

Pattern: `page.tsx` has no business logic. API calls live in `features/*/api/`. Server state → TanStack Query. UI state → Zustand. Forms → `react-hook-form` + `zod`. No `useState` for form fields.

### `src/shared/`

The shared layer contains everything used by more than one feature. It is a design system and utility library, not a dumping ground. A primitive is added to `src/shared/ui/` only when it is either (a) already used in two or more features, or (b) clearly destined to be reused and complex enough to warrant a canonical implementation from the start.

---

## Shared UI Components

The following shared UI components currently exist in `src/shared/ui/`:

### `StatusBadge` (`status-badge.tsx`)

A tone-based status badge replacing eight previously duplicated per-feature badge-color implementations. Accepts a `tone` prop (`neutral | info | success | warning | danger | brand`). Features provide only a small `status → tone` mapping; all rendering is centralized in this component. Used in Purchase Orders (list and detail views), Goods Receipts, Transfers, Stock Counts, Adjustments, Movements ledger, Stock Levels, and Inventory Reports.

### `EmptyState` (`empty-state.tsx`)

A shared empty-state display for list tables and data views. Supports multiple themes including an `inventory` theme (dashed border, brand-tinted icon circle). Used in all nine Inventory list tables and several non-Inventory list views.

### `ConfirmDialog` (`confirm-dialog.tsx`)

A portal-rendered confirmation/alert dialog with `role="alertdialog"`, `aria-modal`, `aria-labelledby`, ESC-to-close, body scroll-lock, and `danger`/`warning` variants. Used by all nine delete/cancel confirmation flows across the application (Locations, Warehouses, Purchase Orders, Goods Receipts, Transfers, Suppliers, Items, Customers, Orders).

### `SingleDatePicker` (`date-range-picker/SingleDatePicker.tsx`)

A single-date picker rendered through `createPortal` and positioned via `useFloatingPosition`. The popup is a full day/month/year-zoomable calendar grid. Accepts `value`, `onChange`, `placeholder`, `align`, and an additive `className` prop. **Always use this component for single-date fields — never a raw `<input type="date">`.**

### `DateRangePicker` (`date-range-picker/DateRangePicker.tsx`)

A date range picker rendered through `createPortal`. The popup is a two-pane layout (presets sidebar + calendar grid) that stacks vertically below the `sm` breakpoint. Accepts `value` (`DateRange`), `onChange`, and `placeholder`. The `align` prop is kept for backward compatibility but is no longer used for positioning (portal positioning makes it unnecessary). Five consumers: `OrderFilters`, `ReportsPage`, `DashboardOverview`, `ReportsAuditPage`, `revenue-chart`.

### `useFloatingPosition` (`date-range-picker/useFloatingPosition.ts`)

A shared React hook that computes `fixed` viewport coordinates (`top`/`left`) for a popup element based on its trigger element's `getBoundingClientRect()`. Clamps the popup within the viewport and flips it above the trigger when there is insufficient room below. Created to fix two bugs that existed with inline-positioned popups: (1) clipping inside scrollable modal bodies (`overflow-hidden`/`overflow-y-auto` ancestors), and (2) RTL/LTR offset class math pushing the panel off-screen. z-index set to 9999.

### `modal.tsx` / `dialog.tsx`

Existing but not yet wired up as a shared form-modal wrapper. The next planned milestone (from the Phase 2 Inventory audit) is to consolidate the seven near-identical create/edit form modals in Inventory into a shared wrapper using these primitives.

### `RequiredMark`

A small shared indicator for required form fields, displaying an asterisk or similar visual. Added to all Inventory create/edit forms during the Phase 2 audit to make required fields visible before submission, not only after a failed submit.

---

## Routing and Locale

The application uses the Next.js App Router with a `[locale]` dynamic segment at the root of every route:

```
app/[locale]/...
```

Supported locales: `ar` (Arabic, RTL), `en` (English, LTR). The `next-intl` library handles locale detection, routing, and the `useTranslations()` hook used in every component that renders user-visible strings.

Translation messages live in:
```
messages/ar.json
messages/en.json
```

Both files must be updated in the same commit whenever a new translation key is introduced. See [engineering-principles.md](./engineering-principles.md#internationalization).

---

## State Management

Sefay currently uses TanStack Query for server state and Zustand for UI state. There is no additional global state store. Component state is colocated with the component that owns it, and lifted to the nearest common ancestor when shared between siblings.

If a phase introduces a cross-feature need for shared server state — for example, the AI Inventory Assistant (Phase 8) maintaining a chat session visible across navigation — a scoped solution will be introduced at that time, documented in an ADR.

---

## Portal Rendering

Modals, confirmation dialogs, and date picker popups are rendered through `createPortal(..., document.body)`. This is an architectural decision, not a per-component choice. The motivation:

1. **Overflow clipping** — many list and form pages use `overflow-hidden` or `overflow-y-auto` on container elements. Inline-positioned popups and modals rendered inside these containers are clipped by the ancestor's overflow boundary. Portal rendering escapes that boundary entirely.
2. **Stacking context** — inline positioning creates z-index battles between sibling elements and creates implicit stacking contexts from `transform`, `filter`, and `will-change` properties on ancestors. Portal rendering to `document.body` avoids all of these.
3. **RTL positioning** — the `useFloatingPosition` hook computes absolute screen-space coordinates from `getBoundingClientRect()`, which are direction-agnostic. Inline RTL/LTR offset class math (switching between `left-0` and `right-0`) was the source of off-screen positioning bugs that are now eliminated.

This decision is recorded as a candidate ADR in [`docs/decisions/README.md`](../decisions/README.md).

---

## RTL/LTR Handling

- The HTML `dir` attribute is set at the `<html>` element level based on the current locale (RTL for `ar`, LTR for `en`). All layout primitives (flex direction, text alignment, icon mirroring, padding/margin) respond to this automatically via Tailwind's RTL variant support.
- `useFloatingPosition` is direction-agnostic — it uses `getBoundingClientRect()` screen-space coordinates, not CSS direction-relative offsets.
- The internal segments of date inputs (day/month/year) always render `dir="ltr"` regardless of the page direction, because date segment ordering is locale-independent. This override is applied inside `SingleDatePicker.tsx` and `DateRangePicker.tsx`.
- Known pre-existing cosmetic issue: the year-range header in the calendar grid reverses its bounds display under `dir="rtl"` due to bidi reordering of two adjacent JSX text nodes. Fix: wrap in `<bdi>` elements or use a pre-formatted string. Tracked but not yet resolved.

---

## Responsive Design

Tailwind CSS breakpoints in use:

| Breakpoint | Min Width | Use |
|---|---|---|
| `sm` | 640px | Mobile/tablet boundary for stacking vs. side-by-side layouts |
| `md` | 768px | Secondary layout shift point |
| `lg` | 1024px | Full desktop layout |

Known inconsistency: some list tables switch to card view at `sm:`, others at `md:`. Standardizing on one breakpoint per table type is a tracked item in the Phase 2 Inventory audit remaining work.

`DateRangePicker`'s popup (presets sidebar + calendar) stacks vertically below `sm` and shifts to side-by-side layout at `sm` and above. The popup is capped at `max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto` to prevent viewport overflow on narrow screens, verified at 320px, 375px, and 768px via Playwright.

---

## Component Design Rules

1. **Never use a raw `<input type="date">`** in application code. Always use `SingleDatePicker` or `DateRangePicker`. See [engineering-principles.md](./engineering-principles.md#no-raw-input-typedate) for the full rule and rationale.
2. **Always use `StatusBadge`** for status/state display. Do not implement per-feature badge-color logic.
3. **Always use `ConfirmDialog`** for delete/cancel/destructive-action confirmations. Do not implement per-feature confirmation modals.
4. **Always use `EmptyState`** for empty list states. Do not use inline plain-text empty messages.
5. **All user-visible strings must use `useTranslations()`** from `next-intl`. Hard-coded strings are not permitted.
6. **Required form fields must use `RequiredMark`** to indicate required status visually before submission.
7. **Modals and popups must use `createPortal`** to avoid overflow clipping and stacking context issues.

---

## Dark Mode

The application supports full dark mode (implemented in §33). The dark mode pattern uses Tailwind's `dark:` variant. 29 files were updated during the dark mode full fix session. The dark mode color palette uses slate/gray tones against the brand navy.

Key dark mode rules:
- SuperAdmin pages use a dark navy theme by default.
- Tenant application pages use a Tailwind-driven dark mode toggled by the user.
- All new components must include `dark:` variant classes where applicable.
- The settings namespace was added specifically to support dark mode toggle persistence.

---

## SuperAdmin UI

SuperAdmin pages (`app/[locale]/superadmin/`) use a distinct dark navy theme regardless of the user's dark/light preference. SuperAdmin views include: tenant management, subscriptions, queue management, health dashboard, and metrics.

---

## Future Architecture Considerations

The following architectural changes are anticipated by the planned roadmap but have not yet been implemented:

- **Shared form-modal wrapper** — the seven near-identical create/edit form modals in Inventory (Warehouse, Location, Adjustment, Purchase Order, Transfer, Goods Receipt, Stock Count) should be unified under a shared wrapper using the existing `modal.tsx`/`dialog.tsx` primitives. This is the next planned milestone from the Phase 2 audit.
- **Column manager primitive** — Phase 7 (Productivity) plans a shared column-show/hide/reorder configuration component for large tables (Stock Levels, Movements ledger). This should live in `src/shared/ui/` and not be built per-table.
- **AI Assistant panel** — Phase 8 (AI Features) plans a docked AI chat panel, likely following the pattern of `command-palette.tsx`. It will require a scoped React Context for its session state.
- **Server-side pagination** — five Inventory list pages (Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments) currently have no pagination plumbing. Adding it requires data-layer changes (new `page`/`pageSize` fields in types, hooks, and API functions), not only UI.
- **StorageProvider integration** — Phase 11 establishes `src/shared/storage/StorageProvider.ts`. Frontend consumers (image upload in Phase 9 Company Branding) will use a server action or API route that internally calls the provider — the frontend never calls storage SDK methods directly.
