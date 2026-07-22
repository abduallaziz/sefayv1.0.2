# COVERAGE_PHASE_E_BATCH_8.md
# Phase E — web/src — Batch 8/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 9.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 99 / 168 = 58.9% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 85 | features/shifts/components/CurrentShiftBanner.tsx | 63 | 63 | READ_VERIFIED | Via `useCurrentShift()` → `GET /shifts/current` | `shifts`: `id,opened_at,opening_cash,status` | Shows open/no-shift state. Buttons: open shift, view summary, close shift |
| 86 | features/shifts/components/OpenShiftModal.tsx | 62 | 62 | READ_VERIFIED | Via `useOpenShift()` → `POST /shifts/open` | `shifts`: `opening_cash,branch_id` | `react-hook-form`. `branch_id` injected from props (comes from `user.branchId` in ShiftsPage) |
| 87 | features/shifts/components/ShiftsList.tsx | 68 | 68 | READ_VERIFIED | Via `useShifts()` → `GET /shifts` | `shifts`: `id,cashier_name,cashier_id,opened_at,closed_at,opening_cash,status` | Shows history table. Falls back to `cashier_id` if `cashier_name` not available |
| 88 | features/shifts/components/ShiftSummaryModal.tsx | 71 | 71 | READ_VERIFIED | Via `useShiftSummary(id)` → `GET /shifts/:id/summary` | `ShiftSummary`: `total_invoices,total_sales,total_cash,total_card,total_expenses,expected_cash,discrepancy` | Reads from `shifts/types.ts` ShiftSummary interface |
| 89 | features/shifts/hooks/useShifts.ts | 40 | 40 | READ_VERIFIED | All via `shiftsApi`: getCurrent, getAll, getSummary, open, close | `shifts` (invalidates `['shifts']` + `['shifts','current']` on close) | 5 hooks clean — all use real API. `useCloseShift` invalidates both `all` and `current` queryKeys |
| 90 | features/shifts/pages/ShiftsPage.tsx | 47 | 47 | READ_VERIFIED | Via `useCurrentShift()` | None direct | ⚠ `branchId = user?.branchId ?? ''` — `branchId` comes from auth store. But `AuthUser` type has `branchId?` as optional. If not set after login, `OpenShiftModal` receives empty string `''` |
| 91 | features/superadmin/api/superadmin.api.ts | 10 | 10 | READ_VERIFIED | `GET /superadmin/stats`, `GET /superadmin/reports/revenue`, `GET /superadmin/audit` | `tenants` (stats), `orders` (revenue), `audit_logs` (audit) | ⚠ `getAuditLogs()` calls `GET /superadmin/audit` but backend route is `GET /superadmin/audit-logs` — path mismatch |
| 92 | features/superadmin/auth-control/api.ts | 24 | 24 | READ_VERIFIED | `GET /superadmin/tenants/options`, `GET /superadmin/tenants/:id/users`, `PATCH /superadmin/users/:id/reset-password`, `PATCH /superadmin/users/:id/role`, `PATCH /superadmin/users/:id/active`, `GET /superadmin/sessions`, `PATCH /superadmin/sessions/:id/revoke`, `PATCH /superadmin/users/:id/revoke-sessions` | `users`: `id,name,email,role,is_active` · `device_sessions`: `id,user_id,user_name,user_email,tenant_id,tenant_name,device_name,device_type,ip_address,last_active_at,is_revoked` | ⚠ All 8 endpoints are non-existent in the backend. None of these paths exist in `superadmin.controller.ts` or any other controller |
| 93 | features/superadmin/auth-control/hooks.ts | 61 | 61 | READ_VERIFIED | All 8 operations via `authControlApi` | None direct | 7 mutations + 3 nested query factories. All mutations depend on the non-existent API endpoints in file 92 |
| 94 | features/superadmin/auth-control/ResetPasswordDialog.tsx | 65 | 65 | READ_VERIFIED | Via parent callback → `authControlApi.resetPassword` | `users`: `id,name,email` | `react-hook-form` + `zod`. Password min 8 chars + confirm match validation |
| 95 | features/superadmin/auth-control/SessionsSection.tsx | 69 | 69 | READ_VERIFIED | Via `onRevoke(sessionId)` callback | `device_sessions`: `id,user_name,user_email,tenant_name,device_name,device_type,ip_address,last_active_at,is_revoked` | Uses `date-fns.formatDistanceToNow` for relative timestamps. Separates active/revoked sessions |
| 96 | features/superadmin/auth-control/types.ts | 27 | 27 | READ_VERIFIED | None | `users` (TenantUser): `id,name,email,role,is_active,created_at,deleted_at` · `device_sessions` (DeviceSession): `id,user_id,user_name,user_email,tenant_id,tenant_name,device_name,device_type,ip_address,last_active_at,is_revoked,created_at` · TenantOption: `id,name` | DeviceSession type has denormalized fields: `user_name`, `user_email`, `tenant_name` — not in actual DB schema |
| 97 | features/superadmin/auth-control/UsersSection.tsx | 80 | 80 | READ_VERIFIED | Via parent callbacks | `users`: `id,name,email,role,is_active` | Inline role dropdown, toggle active button, reset password + revoke all buttons per user |
| 98 | features/superadmin/components/activity-feed.tsx | 166 | 166 | READ_VERIFIED | **None — 100% mock/hardcoded** | None | Activity events are hardcoded `initialEvents` array + simulated new events every 5s via `setInterval`. Not connected to `audit_logs` table. Supports filter by severity/category |
| 99 | features/superadmin/components/ai-insights.tsx | 169 | 169 | READ_VERIFIED | **None — 100% static data** | None | 5 hardcoded AI insights (churn/growth/risk/anomaly/security). No real ML/AI backend. Refresh button is cosmetic only (simulates 1.2s animation). Confidence bars are static values |

---

## Key Findings

### ⚠ CRITICAL: auth-control/api.ts — All 8 Endpoints Non-Existent (file 92)

The entire Auth Control feature calls endpoints that don't exist in the backend:

| Frontend Endpoint | Backend Status |
|-------------------|---------------|
| `GET /superadmin/tenants/options` | ❌ NOT FOUND |
| `GET /superadmin/tenants/:id/users` | ❌ NOT FOUND |
| `PATCH /superadmin/users/:id/reset-password` | ❌ NOT FOUND |
| `PATCH /superadmin/users/:id/role` | ❌ NOT FOUND |
| `PATCH /superadmin/users/:id/active` | ❌ NOT FOUND |
| `GET /superadmin/sessions` | ❌ NOT FOUND |
| `PATCH /superadmin/sessions/:id/revoke` | ❌ NOT FOUND |
| `PATCH /superadmin/users/:id/revoke-sessions` | ❌ NOT FOUND |

Closest backend endpoints exist in `modules/auth/auth.service.ts` and `modules/users/users.service.ts` but under different paths.

### ⚠ CRITICAL: superadmin.api.ts audit path mismatch (file 91)
Frontend: `GET /superadmin/audit`
Backend: `GET /superadmin/audit-logs` (from `AuditLogsController`)

### ⚠ branchId not populated after login (file 90)
`ShiftsPage` uses `user?.branchId ?? ''` to pass to `OpenShiftModal`.
`AuthUser` type (auth.store.ts) has `branchId?: string` — optional, never set by login response.
Login API response (`users` table) has `tenant_id` but no `branch_id`.
Result: `OpenShiftModal` always receives empty string as `branchId`. Backend will reject the open-shift request.

### activity-feed.tsx & ai-insights.tsx — Pure UI Mock (files 98–99)
Both components are entirely decorative:
- `activity-feed` simulates live events with `setInterval` every 5s — no real `audit_logs` data
- `ai-insights` shows hardcoded static insights — no AI backend connected
- Both use `framer-motion` for animations only

### Shifts Feature is the Only Fully Wired Feature (files 85–89)
All shift operations (`GET /shifts/current`, `GET /shifts`, `GET /shifts/:id/summary`, `POST /shifts/open`, `POST /shifts/:id/close`) use real `apiClient` with correct paths matching the backend. No mock data.

### DeviceSession Has Denormalized Fields Not in DB Schema (file 96)
Frontend expects `user_name`, `user_email`, `tenant_name` on each session record.
Backend `device_sessions` table only stores: `user_id`, `tenant_id`, `device_name`, `device_type`, `ip_address`, `user_agent`, `last_active_at`, `is_revoked`.
The display names require JOINs to `users` and `tenants` tables — not currently returned by any backend endpoint.

---

## ⛔ STOPPED — Awaiting confirmation for Batch 9 (files 100–107)
