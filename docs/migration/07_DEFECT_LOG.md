# Defect Log

Append-only. Format: severity, component, reproduction, scope, status.

---

## DEF-1 — Login error message doesn't distinguish 429 (rate limit) from 401 (invalid credentials)

- Severity: Low (UX clarity, not a functional break)
- Component: Login page error display, consuming `/api/v1/auth/login` response
- Reproduction: Trigger a `429 Too Many Requests` response from the login endpoint (e.g. via repeated requests) → the login form displays the same generic message as an actual invalid-credentials `401`: "البريد الإلكتروني أو كلمة المرور غير صحيحة".
- Scope: Pre-existing UI defect, unrelated to the visual migration. Backend/auth error-handling logic — out of scope for presentation-layer Matrix items.
- Status: Deferred. Not to be fixed as part of the migration.

---

## DEF-2 — Local-dev-only 429 on `/api/v1/auth/refresh` and `/api/v1/auth/login`

- Severity: Medium (blocks local manual testing, does not affect production)
- Component: `AuthProvider` (`src/core/auth/auth.provider.tsx`) — fires `POST /auth/refresh` unconditionally on every mount.
- Reproduction: Run `next dev` (React StrictMode double-invokes effects in dev only), repeatedly reload/navigate — `/api/v1/*` is rewritten to the live production API (`next.config.ts`, no separate local backend), so dev-mode's doubled refresh calls plus repeated manual reloads concentrate enough requests against what is very likely an IP-keyed production rate limiter to trip a 429.
- Scope: Local Development / Engineering issue. Confirmed production-unaffected by user. Explicitly classified as outside Migration scope — not to be spent further migration time on.
- Status: Logged, deferred, not to be fixed during the migration.

---

## DEF-3 — `react-hooks/set-state-in-effect` ESLint errors in `DashboardSidebar.tsx` (pre-existing, verified)

- Severity: Low (lint-level, not a runtime bug observed)
- Component: `src/features/dashboard/components/DashboardSidebar.tsx`, the two `useEffect` blocks syncing `inventoryExpanded` state from `localStorage` and from `inventoryGroupActive`.
- Reproduction: `npx eslint src/features/dashboard/components/DashboardSidebar.tsx` — 2 errors at the `setInventoryExpanded(...)` calls inside effect bodies.
- Scope: Verified pre-existing — no git repository exists in this project, so verification was done by diffing the exact line content against a Read-tool snapshot captured before the C2 edit; the flagged lines are byte-identical before and after. Confirmed unrelated to any migration change (C2, C3, C4 all only touched styling/positioning classes, never this logic).
- Status: Deferred, not fixed (out of scope — logic untouched by design).

---

## DEF-4 — `stat-card.tsx` dead-token classes

- Severity: Low
- Component: `src/shared/ui/stat-card.tsx`
- Reproduction: (as previously logged in v1 planning, not independently re-verified in this v2 audit — re-verify before acting on this entry)
- Scope: Previously explicitly deferred by user decision during Matrix Item A1 ("Do not expand A1. Do not modify stat-card.tsx"). That decision predates this v2 documentation reset and should be re-confirmed with the user before E7 execution, not assumed to still apply verbatim.
- Status: **SUPERSEDED** — Matrix Item E7 confirmed `stat-card.tsx` has 0 consumers (dead code, not a runtime defect). Reclassified as AF-9 (deletion candidate) in `08_ARCHITECTURAL_FINDINGS.md`. No re-confirmation was needed since there is no active deferral affecting live code.

---

## DEF-5 — `input.tsx` empty `InputProps` interface (pre-existing, verified)

- Severity: Low (lint-level, not a runtime bug)
- Component: `src/shared/ui/input.tsx`, line 4: `export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}`
- Reproduction: `npx eslint src/shared/ui/input.tsx` → `@typescript-eslint/no-empty-object-type` error at line 4.
- Scope: Verified pre-existing — Matrix Item E1 only modified the `className` string (a different line); the interface declaration itself was captured via Read before the edit and is byte-identical after.
- Status: Deferred, not fixed (out of scope for E1's presentation-only change).

---

## DEF-6 — `POSPage.tsx` `no-explicit-any` errors (pre-existing, verified)

- Severity: Low (lint-level, not a runtime bug observed)
- Component: `src/features/pos/page/POSPage.tsx`, lines 32, 38, 54 (`apiClient.get(...) as any`), 86 (`catch (error: any)`), 92 (`(order as any)`)
- Reproduction: `npx eslint src/features/pos/page/POSPage.tsx` → 5 `@typescript-eslint/no-explicit-any` errors.
- Scope: Verified pre-existing — Matrix Item F1.1 only modified layout/className strings in the JSX return; all 5 flagged lines are in data-fetching/error-handling code untouched by the edit, confirmed against pre-edit content captured via Read.
- Status: Deferred, not fixed (out of scope for F1.1's presentation-only change).
