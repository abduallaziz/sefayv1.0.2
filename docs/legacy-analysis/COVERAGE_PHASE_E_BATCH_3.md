# COVERAGE_PHASE_E_BATCH_3.md
# Phase E — web/src — Batch 3/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 4.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 8 |
| Files Read | 8 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 24 / 168 = 14.3% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 17 | app/[locale]/superadmin/layout.tsx | 27 | 27 | READ_VERIFIED | None direct | None | `'use client'` · Auth guard: reads `isAuthenticated` from `useAuthStore` · Redirects to `/{locale}/login` if not authenticated · Wraps `MainLayout` |
| 18 | app/[locale]/superadmin/loading.tsx | 24 | 24 | READ_VERIFIED | None | None | Loading skeleton UI — 4 cards + 2 content blocks + 1 full-width block. Colors: `bg-[#141720]` pulse animation |
| 19 | app/[locale]/superadmin/page.tsx | 59 | 59 | READ_VERIFIED | Via hooks: `useStats`, `useRevenue`, `useTenants` | Implied: `tenants`, `orders` (revenue), stats fields | `'use client'` · Uses `useActivateTenant`, `useDeactivateTenant`, `useExtendTrial`, `useStats`, `useRevenue`, `useTenants` · Renders: `SystemHealth`, `OverviewCards`, `AiInsights`, `RevenueChart`, `ActivityFeed`, `TenantsTable` · Fallback stats defined: `total_tenants, active_tenants, trial_tenants, suspended_tenants, mrr, arr, churn_rate, new_tenants_this_month` |
| 20 | app/[locale]/superadmin/auth-control/page.tsx | 122 | 122 | READ_VERIFIED | Via `useAuthControl` hook | `users`, `device_sessions` (implied) | `'use client'` · Two tabs: `users` + `sessions` · Tenant selector filter · Mutations: `resetPasswordMutation`, `changeRoleMutation`, `toggleActiveMutation`, `revokeSessionMutation`, `revokeAllMutation` · Delegates to `UsersSection` + `SessionsSection` |
| 21 | app/[locale]/superadmin/feature-flags/page.tsx | 4 | 4 | READ_VERIFIED | None direct | None | Shell → renders `FeatureFlagsPage` |
| 22 | app/[locale]/superadmin/reports/page.tsx | 2 | 2 | READ_VERIFIED | None direct | None | Shell → `export default ReportsAuditPage` (direct re-export) |
| 23 | app/[locale]/superadmin/settings/page.tsx | 4 | 4 | READ_VERIFIED | None direct | None | Shell → renders `SuperAdminSettingsPage` |
| 24 | app/[locale]/superadmin/subscriptions/page.tsx | 6 | 6 | READ_VERIFIED | None direct | None | Shell → renders `SubscriptionsPage` |

---

## Key Findings

### Auth Guard Pattern (file 17 — superadmin/layout.tsx)
- Uses **client-side auth guard** via `useAuthStore` + `useEffect`
- Hydration-safe: waits for `hydrated=true` before redirecting
- Not using Next.js middleware for auth — all client-side
- No role check — only checks `isAuthenticated` (superadmin role not verified at layout level)

### SuperAdmin Dashboard Page (file 19)
**Fallback stats shape** — confirmed field names expected from API:
```
total_tenants, active_tenants, trial_tenants, suspended_tenants,
mrr, arr, churn_rate, new_tenants_this_month
```
These fields are what the frontend expects from `GET /superadmin/stats`.

### Auth Control Page (file 20) — most complex in this batch
Mutations used (all via `useAuthControl` hook):
| Mutation | Action |
|----------|--------|
| `resetPasswordMutation` | `{ userId, newPassword }` |
| `changeRoleMutation` | `{ userId, role }` |
| `toggleActiveMutation` | `{ userId, is_active }` |
| `revokeSessionMutation` | `sessionId` |
| `revokeAllMutation` | `userId` |

### SuperAdmin Route Map (confirmed from code)

| Route | Component | Type |
|-------|-----------|------|
| `/{locale}/superadmin` | SuperAdminPage (inline) | Full page |
| `/{locale}/superadmin/auth-control` | AuthControlPage (inline) | Full page |
| `/{locale}/superadmin/feature-flags` | FeatureFlagsPage | Shell |
| `/{locale}/superadmin/reports` | ReportsAuditPage | Shell |
| `/{locale}/superadmin/settings` | SuperAdminSettingsPage | Shell |
| `/{locale}/superadmin/subscriptions` | SubscriptionsPage | Shell |

---

## ⛔ STOPPED — Awaiting confirmation for Batch 4 (files 25–32)
