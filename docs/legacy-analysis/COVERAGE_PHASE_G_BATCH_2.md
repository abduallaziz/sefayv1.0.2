# COVERAGE_PHASE_G_BATCH_2.md
# Phase G — Mock / Hardcoded Data — Batch 2/2
# Source: Already READ_VERIFIED in Phases E–F. No re-read needed.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 9 |
| All Files Already | READ_VERIFIED (Phase E Batch 12–13 + Phase F) |
| Files Skipped | 0 |
| Batch Coverage | 100% |

---

## File-by-File Report

---

### 16. `web/src/shared/ui/separator.tsx`

| Field | Value |
|-------|-------|
| Lines | 28 |
| Last Line | 28 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | `bg-[#1e2130]` hardcoded (line 23) — dark-only, no `theme` prop |
| Notes | Used in both superadmin (dark) and dashboard (light) contexts. In dashboard light theme, separator would appear as a dark line against white background |

---

### 17. `web/src/shared/ui/skeleton.tsx`

| Field | Value |
|-------|-------|
| Lines | 45 |
| Last Line | 45 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | Theme colors hardcoded per variant: `superadmin → bg-[#1e2436]`, `dashboard → bg-[#f1f5f9]` (lines 13–14). Default theme = `'dashboard'` |
| Notes | Correctly supports `theme` prop unlike separator/tabs/tooltip. Presets: `StatCardSkeleton`, `TableRowSkeleton` |

---

### 18. `web/src/shared/ui/stat-card.tsx`

| Field | Value |
|-------|-------|
| Lines | 93 |
| Last Line | 93 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | All colors hardcoded in `variantStyles` object (lines 15–30) and `iconBg` object (lines 32–38). Default theme = `'dashboard'`. TrendingUp/Down icons based on `change` value |
| Notes | Correctly supports `theme` prop. Used in DashboardOverview (with hardcoded values), ExpensesPage (with live stats query). No mock data — pure presentation |

---

### 19. `web/src/shared/ui/switch.tsx`

| Field | Value |
|-------|-------|
| Lines | 21 |
| Last Line | 21 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | Colors hardcoded: checked=`bg-[#6366f1]`, unchecked=`bg-[#1e2130]`, focus=`ring-[#6366f1]` (lines 10–11). No `theme` prop |
| Notes | Used in `SuperAdminSettingsPage` (NotificationsTab toggles). Since settings page has no API calls, switch state is never persisted |

---

### 20. `web/src/shared/ui/tabs.tsx`

| Field | Value |
|-------|-------|
| Lines | 37 |
| Last Line | 37 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | `TabsList: bg-[#141720] border-[#1e2130]` (line 14), `TabsTrigger active: bg-[#1a1f2e] text-white` (line 26). No `theme` prop |
| Notes | ⚠ Hardcoded dark theme. Used in `ExpensesPage` (expenses/templates tabs) — dashboard feature. Against light `bg-[#f8fafc]` dashboard background it will appear mismatched |

---

### 21. `web/src/shared/ui/tooltip.tsx`

| Field | Value |
|-------|-------|
| Lines | 27 |
| Last Line | 27 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | `TooltipContent: bg-[#1a1f2e] border-[#1e2130] text-white` (line 24). `delayDuration=200` (line 7). No `theme` prop |
| Notes | Dark-only tooltip. If used in dashboard light context (e.g., over light card), dark tooltip may still be acceptable per design, but no theme flexibility |

---

### 22. `web/src/types/i18n.ts`

| Field | Value |
|-------|-------|
| Lines | 19 |
| Last Line | 19 |
| Status | READ_VERIFIED (Phase E Batch 13) |
| API Calls | None |
| Mock / Hardcoded | Type imports 7 namespaces: `common, shell, superadmin, dashboard, orders, pos, expenses` — all hardcoded as imports from `messages/en/*.json` |
| Notes | ⚠ Missing `items` namespace (line 8): `i18n/request.ts` loads `items` at runtime but it is NOT in the TypeScript `Messages` type. `useTranslations('items')` has no type-safety. Also missing: `customers` (legacy) |

---

### 23. `web/src/features/superadmin/components/command-palette.tsx`

| Field | Value |
|-------|-------|
| Lines | 302 |
| Last Line | 302 |
| Status | READ_VERIFIED (Phase E Batch 9) |
| API Calls | **None** |
| Mock / Hardcoded | **All 20 command handlers are `() => {}`** (lines 51–71). Categories: Navigation (4), Tenants (4), Billing (3), Infrastructure (3), AI (3), Security (3). Danger levels: safe/warning/danger |
| Notes | ⚠ Full keyboard-navigable command palette with confirmation modals for dangerous actions — all non-functional. `handler: () => {}` means every command silently does nothing. Shortcut keys (G+O, G+T, G+B, G+A) registered but no routing |

---

### 24. `web/src/features/auth/hooks/use-auth.ts`

| Field | Value |
|-------|-------|
| Lines | 40 |
| Last Line | 40 |
| Status | READ_VERIFIED (Phase E Batch 4) |
| API Calls | Via `authApi.login`, `authApi.logout` |
| Mock / Hardcoded | **Locale hardcoded as `'en'` in redirect (line 29)**: `router.push(isSuperAdmin ? '/en/superadmin' : '/en/dashboard')` |
| Notes | ⚠ After successful login, always redirects to `/en/*` regardless of current locale. Arabic users (`/ar/*`) are forced to English path. Contrast with `LoginPage.tsx` which uses `/${locale}/` correctly (line 52–56). The hook is less correct than the page it supports |

---

## Batch 2 Summary

| # | File | Hardcoded Value | Impact |
|---|------|----------------|--------|
| 16 | separator.tsx | `bg-[#1e2130]` dark-only | Mismatched in light theme |
| 17 | skeleton.tsx | Colors per theme (correct) | No issue — theme-aware |
| 18 | stat-card.tsx | All colors per theme (correct) | No issue — theme-aware |
| 19 | switch.tsx | Indigo/dark colors, no theme prop | Switch always dark |
| 20 | tabs.tsx | Dark `bg-[#141720]`, no theme prop | Tabs dark in light dashboard |
| 21 | tooltip.tsx | Dark `bg-[#1a1f2e]`, no theme prop | Tooltip always dark |
| 22 | types/i18n.ts | 7 namespaces typed, `items` missing | No TS autocomplete for items translations |
| 23 | command-palette.tsx | All 20 `handler: () => {}` | Full palette non-functional |
| 24 | use-auth.ts | Locale `'en'` hardcoded in redirect | Arabic users → broken after login |

---

## ⛔ PHASE G — ALL BATCHES COMPLETE
## Total Files Documented: 24 (Batch 1: 15 + Batch 2: 9)
## Awaiting confirmation before consolidating into COVERAGE_MOCKS.md
