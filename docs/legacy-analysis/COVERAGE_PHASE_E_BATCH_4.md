# COVERAGE_PHASE_E_BATCH_4.md
# Phase E — web/src — Batch 4/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 5.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 39 / 168 = 23.2% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 25 | app/[locale]/superadmin/tenants/page.tsx | 4 | 4 | READ_VERIFIED | None direct | None | Shell → `TenantsPage` from `features/superadmin/tenants/TenantsPage` |
| 26 | core/providers.tsx | 18 | 18 | READ_VERIFIED | None | None | `QueryClientProvider` wrapper. `staleTime: 60s`, `retry: 1`. Root TanStack Query setup |
| 27 | core/auth/auth.provider.tsx | 62 | 62 | READ_VERIFIED | `POST /auth/refresh` (direct fetch line 21), `GET /auth/me` (direct fetch line 38) | `users`: `id,email,name,role,tenant_id,session_id,permissions,features` | Auto-refresh on mount. Uses `NEXT_PUBLIC_API_URL` env. Calls `setAuth` with full user shape on success. Clears auth on failure |
| 28 | core/auth/hooks/useTenantAuth.ts | 24 | 24 | READ_VERIFIED | None direct | None | Auth guard hook. Redirects to login if !isAuthenticated. Redirects superadmin → `/superadmin`. Hydration-safe via `useState(false)` |
| 29 | core/auth/stores/auth.store.ts | 52 | 52 | READ_VERIFIED | None | None | Zustand + `persist`. Storage key: `sefay-auth`. Persisted: `user, refreshToken, isAuthenticated`. **NOT persisted**: `accessToken` (refreshed on mount). `AuthUser` shape: `id,name,email,role,tenantId,sessionId,branchId?,permissions[],features[]` |
| 30 | core/permissions/hooks/usePermission.ts | 13 | 13 | READ_VERIFIED | None | None | 3 hooks: `usePermission(perm)→bool`, `useFeature(key)→bool`, `useRole()→UserRole`. Read from `auth.store` in-memory permissions/features arrays |
| 31 | features/auth/api/auth.api.ts | 43 | 43 | READ_VERIFIED | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh` | `users`: `id,email,name,role,tenant_id,session_id,permissions[],features[]` | `LoginDto`: `email,password,device_name`. `LoginResponse`: access_token, refresh_token, user object. `MeResponse`: same user fields |
| 32 | features/auth/hooks/use-auth.ts | 40 | 40 | READ_VERIFIED | Via `authApi.login`, `authApi.logout` | None direct | `useLogin` mutation → `setAuth` → redirects: superadmin→`/en/superadmin`, others→`/en/dashboard`. ⚠ Hardcoded locale `'en'` |
| 33 | features/auth/pages/LoginPage.tsx | 117 | 117 | READ_VERIFIED | `POST /auth/login` (via `authApi.login`) | `users`: `id,name,email,role,tenant_id,session_id,permissions,features` | `react-hook-form` + `zod`. Schema: `email(email)`, `password(min6)`. Sends `device_name: 'Web Browser'` hardcoded. Redirect after login: superadmin→`/${locale}/superadmin`, others→`/${locale}/dashboard` |
| 34 | features/customers/api/customers.api.ts | 43 | 43 | READ_VERIFIED | `GET /customers`, `GET /customers/:id`, `GET /customers/:id/history`, `GET /customers/stats`, `POST /customers`, `PATCH /customers/:id`, `DELETE /customers/:id`, `PATCH /customers/:id/points` | `customers`: see types | 8 endpoints total. Note: `PATCH /customers/:id/points` sends `{ points, reason }` — this endpoint not found in API backend |
| 35 | features/customers/components/CustomerDetailsModal.tsx | 131 | 131 | READ_VERIFIED | Via `useCustomerHistory(customer.id)` | `customers`: `id,name,phone,email,created_at,loyalty_points,total_orders,total_spent` · `orders` (history): `id,total,created_at,items_count,status` | Shows contact info + 3 stats (orders, spent, points) + order history list |
| 36 | features/customers/components/CustomerFilters.tsx | 49 | 49 | READ_VERIFIED | None | None | Filter/sort bar. Sort options: `created_at`, `name`, `loyalty_points`, `total_spent`. Order: `asc`/`desc` |
| 37 | features/customers/components/CustomerFormModal.tsx | 132 | 132 | READ_VERIFIED | None direct (delegates to parent) | `customers`: `name(min2)`, `phone(min9)`, `email(optional)` | `react-hook-form` + `zod`. Create + edit mode. `CreateCustomerDto`: `name,phone,email?` |
| 38 | features/customers/components/CustomersTable.tsx | 134 | 134 | READ_VERIFIED | None direct | `customers`: `id,name,phone,email,created_at,loyalty_points,total_orders,total_spent` | Table columns: customer, contact, orders, spent, points, actions (view/edit/delete) |
| 39 | features/customers/components/DeleteCustomerModal.tsx | 52 | 52 | READ_VERIFIED | None direct | `customers`: `name` | Confirm delete modal. Shows customer name in message |

---

## Key Findings

### Auth Flow (confirmed from code)
Complete auth flow reconstructed from files 27–33:

```
1. App loads → AuthProvider mounts (file 27)
2. If refreshToken in storage → POST /auth/refresh
3. If OK → GET /auth/me → setAuth(user, accessToken, refreshToken)
4. If fail → clearAuth()
5. Login page (file 33) → POST /auth/login with device_name='Web Browser'
6. On success → setAuth → redirect based on role
   - superadmin → /{locale}/superadmin
   - others     → /{locale}/dashboard
```

### Zustand Auth Store Persistence (file 29)
- Key: `sefay-auth` (localStorage)
- Persisted: `user`, `refreshToken`, `isAuthenticated`
- **NOT persisted**: `accessToken` — always refreshed on page load
- `branchId` is optional in `AuthUser` type — not set by login flow (future feature)

### ⚠ Hardcoded Locale Bug (file 32 — use-auth.ts line 29)
```ts
router.push(isSuperAdmin ? '/en/superadmin' : '/en/dashboard');
```
Always redirects to `/en/` regardless of current locale. Will break Arabic locale users after login.

### ⚠ Undocumented API Endpoint (file 34 — customers.api.ts line 46)
```ts
adjustPoints: async (id, points, reason) =>
  apiClient.patch(`/customers/${id}/points`, { points, reason })
```
`PATCH /customers/:id/points` not found in `api/src/modules/customers/` — endpoint does not exist in the backend.

### Customer Fields Used by Frontend (files 35, 38)
Frontend expects these fields on `Customer` object:
- `id`, `name`, `phone`, `email`, `created_at`, `loyalty_points`
- `total_orders` (computed — not in DB column)
- `total_spent` (computed — not in DB column)

---

## ⛔ STOPPED — Awaiting confirmation for Batch 5 (files 40–47)
