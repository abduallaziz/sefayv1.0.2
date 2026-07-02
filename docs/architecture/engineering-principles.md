# Engineering Principles

*Added: 2026-06-30*

---

## Overview

This document records the engineering principles, standing rules, and code quality standards that apply to all work on the Sefay ERP platform. These are not aspirational goals — they are enforced rules. When a rule is established after discovering a bug or pattern, it is recorded here along with the date and context so that future engineers understand why the rule exists.

---

## Separation of Concerns

Responsibilities are divided across distinct layers with strictly enforced boundaries:

- **Controllers** handle HTTP: accept requests, delegate to services, return responses. No business logic.
- **Services** own business rules, orchestrate operations, call repositories.
- **Repositories** own all database access. All queries extend `ScopedRepository` for automatic tenant isolation.
- **Engines** are pure TypeScript — no DB, no NestJS, no HTTP. They receive data and return results. Designed to run from both the API and a future mobile client.
- **Frontend features** own their components, hooks, and API calls. Feature internals do not cross module boundaries.
- **Shared modules** are promoted only when a component is used in two or more features or is clearly destined for reuse.

---

## Modular Architecture

The backend is a **Modular Monolith** — modules are well-isolated but deployed as one service. This is an intentional choice: no microservices until scaling requirements prove the need. (See ADR record in `docs/decisions/README.md`.)

- No microservices before proven scaling requirement.
- No Redis / no materialized views before the query volume warrants it.
- No NestJS rewrites of stable, working modules.
- Module boundaries are enforced at the repository level: one module may not query another module's tables directly.

---

## Reusable Services and Provider Abstraction

Shared services follow a provider-abstraction pattern, making infrastructure choices swappable:

- **Payment:** `PaymentProvider` interface → `StripePaymentProvider` / `MockPaymentProvider`. Switched via `PAYMENT_PROVIDER` env.
- **Storage:** `StorageProvider` interface (Phase 11) → `SupabaseStorageAdapter` / `S3StorageAdapter` / `MinIOStorageAdapter` / `LocalStorageAdapter`. Switched via configuration.
- **AI:** `AIProvider` interface (Phase 4) → provider adapters. Switched via configuration.
- **Email:** Resend email service. Silent mock mode if `RESEND_API_KEY` is unset.

Every new infrastructure dependency should be wrapped behind a provider interface. No SDK-specific code in business logic.

---

## TypeScript Strict Mode

TypeScript strict mode is enabled in both the API (`api/`) and web (`web/`) projects.

- No `any` — in either project. TypeScript strict, no exceptions.
- All controller methods require explicit DTO classes.
- All service functions have typed parameters and return types.
- No implicit `any` from missing type annotations.
- `noEmit` compilation (`tsc --noEmit`) must pass with zero errors before merge.

---

## No Raw `<input type="date">`

**Established:** June 26, 2026 (STATUS.md §48), after fixing an RTL bug caused by the browser's native date input rendering incorrectly in Arabic context.

Raw `<input type="date">` is **prohibited** in all application code. Always use:

- `SingleDatePicker` (from `src/shared/ui/date-range-picker/SingleDatePicker.tsx`) for single-date fields.
- `DateRangePicker` (from `src/shared/ui/date-range-picker/DateRangePicker.tsx`) for date range fields.

**Why this rule exists:** The browser's native date input does not provide consistent RTL/LTR rendering across browsers. The custom `SingleDatePicker` and `DateRangePicker` components render through `createPortal` with `useFloatingPosition`, providing consistent cross-browser RTL/LTR behavior and correct viewport positioning in scrollable containers.

Code review must reject any PR that introduces a raw `<input type="date">`.

---

## Shared Components Over Duplication

When a UI pattern is needed in more than one feature, a shared component is built. Duplication of implementation logic across feature modules is not permitted.

Current shared components that replaced per-feature duplication:
- `StatusBadge` — replaced 8 per-feature badge implementations.
- `ConfirmDialog` — replaced per-feature confirmation modal patterns.
- `EmptyState` — replaced inline plain-text empty states.
- `SingleDatePicker` / `DateRangePicker` / `useFloatingPosition` — replaced raw `<input type="date">` and inline popup positioning.

When adding a shared component:
1. Add it to `src/shared/ui/` with a `kebab-case.tsx` filename.
2. Add it to the shared UI component list in [`frontend-architecture.md`](./frontend-architecture.md).
3. Update all existing feature implementations to use the new shared component.

---

## Zero Net-New Lint Regressions

Every change must leave the lint and TypeScript error counts equal to or better than before. Specifically:
- `tsc --noEmit` must pass with zero errors.
- `npm run lint` must pass with no new errors or warnings introduced.
- If lint errors exist in the codebase before your change, you are not required to fix all of them — but you must not add new ones.

---

## Testing Pipeline

Before any merge, the full verification pipeline must pass:

1. `tsc --noEmit` — TypeScript compilation check (zero errors)
2. `npm run lint` — ESLint (no new regressions)
3. `npm run build` — production build must succeed
4. Playwright screenshots — visual regression check on key pages
5. Smoke check — key API endpoints verified

**API-specific test commands:**
```bash
npm run test        # Jest unit tests
npm run test:watch  # Jest watch mode
npm run test:cov    # With coverage report
npm run test:e2e    # E2E tests
```

---

## Documentation Sync

Documentation must stay synchronized with the codebase:

- If a design was considered and rejected, note why in the relevant `TASKS.md` entry or in a new ADR in `docs/decisions/`.
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

**GitHub Actions CI:** TypeScript build check runs on push. Auto-deploy on push to `main` for both Railway (API) and Vercel (Frontend).

---

## Security Principles

- Authentication is enforced at the API boundary. Frontend gating (hiding buttons, navigation guards) is a UX convenience only — it is not a security control.
- Every database operation that touches tenant data must be scoped by `tenant_id`. Row-Level Security policies in Supabase enforce this at the database layer. See [`security-architecture.md`](./security-architecture.md).
- Signed URLs for asset access are generated server-side only. The client never receives storage credentials. Default expiry: 15 minutes for previews, 60 minutes for print/download contexts.
- Tenant data is not sent to external AI providers without an explicit data-privacy review. See [`ai-architecture.md`](./ai-architecture.md).
- Input validation is performed on both the frontend (immediate user feedback) and the backend (the authoritative gate). Frontend validation is never the sole line of defense.
- Financial records are immutable. No hard deletes, no mutations after creation. Reverse transactions only.
- All audit-required operations use the `@Audit()` decorator.
- The guard pipeline order (`JwtAuthGuard → TenantGuard → PermissionGuard → FeatureGuard`) is non-negotiable.

---

## Performance Principles

- List tables that may grow large (Stock Levels, Movements, Purchase Orders) require server-side pagination. The current known gap — five Inventory modules lacking pagination entirely — is tracked in `TASKS.md` Phase 2 remaining items.
- Expensive derived computations (inventory health scores, ABC analysis, snapshot reconstructions) are performed server-side and cached, not computed inline per render.
- Portal-rendered popups (`createPortal`) use `useFloatingPosition` for viewport-aware positioning to avoid layout reflows caused by incorrect size assumptions in scrollable containers.
- Image assets (company logos, stamps, signatures) are stored in original resolution and served through optimized variants via the `StorageProvider` interface.
- No N+1 queries: cross-module data lookups use parallel queries where possible (e.g. usage computation = 3 parallel queries by design).

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
- The supported locales are `ar` and `en`. The routing pattern is `app/[locale]/`.
- Pluralization must use `next-intl`'s plural form support, not string concatenation (e.g. `"1 items"` is incorrect).
- **Backend I18n:** `I18nService` is used for all user-facing text in the backend (notifications, emails, error messages). Language resolution chain: `user.language → tenant.defaultLanguage → system default 'en'`.
- **I18N is mandatory:** no user-facing text is hardcoded anywhere. This applies to both frontend and backend.

---

## Working Rules (Language)

- Arabic is the conversation language (Claude agent communication).
- English is the code language (all code, variable names, comments, documentation files).
- Full files are always provided — never partial snippets.
- Windows full paths for all file references: `C:\Fp\api\src\...`, never relative paths.
- Filesystem first: create folders → files → install packages → write code.
- No assumptions: if a DTO, enum, module, or provider is needed, create it in the same task.

---

## Mandatory Rules Summary (From CLAUDE.md)

1. **Full files always** — never send partial snippets. Every modified file must be complete and final.
2. **Windows full paths** — `C:\Fp\api\src\...`, never relative paths.
3. **Filesystem first** — create folders → files → install packages → write code.
4. **No assumptions** — if a DTO, enum, module, or provider is needed, create it in the same task.
5. **Guard order** — `JwtAuthGuard → TenantGuard → PermissionGuard → FeatureGuard`. Never register tenant/permission guards as `APP_GUARD`.
6. **Tenant isolation** — every query must have `tenant_id`. Use `ScopedRepository`. Double-lock updates.
7. **No `any`** — TypeScript strict, no `any` in either project.
8. **No business logic in controllers** — controllers call services only.
9. **No direct Supabase outside repositories** — all DB access goes through repositories.
10. **Engines are pure** — no DB, no NestJS, no HTTP in engines.
11. **Financial records immutable** — no hard delete, no mutation after creation.
12. **Audit required** — use `@Audit()` decorator on sensitive operations.
13. **I18n mandatory** — no user-facing text hardcoded. All through `I18nService`.
14. **Soft delete** — `deleted_at` pattern on all sensitive tables. ScopedRepository filters it automatically.
15. **`x-branch-id` header is temporary** — Phase A only. Phase B requires validated branch ownership.
