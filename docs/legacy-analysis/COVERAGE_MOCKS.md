# COVERAGE_MOCKS.md
# Phase G — Complete Mock / Hardcoded Data Report
# All 24 files READ_VERIFIED — Source: Phases A–F

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Pure mock data files | 3 | HIGH — fake data in production |
| Features with USE_MOCK=true | 2 | HIGH — DB never queried |
| Inline hardcoded data arrays | 5 | HIGH — no backend connection |
| Missing POST to backend | 2 | CRITICAL — data never saved |
| Hardcoded business constants | 2 | MEDIUM — not configurable per tenant |
| Zero-API features (cosmetic saves) | 2 | MEDIUM — user action lost |
| Non-functional UI (empty handlers) | 1 | MEDIUM — feature unusable |
| Hardcoded auth/locale constants | 1 | HIGH — breaks Arabic users |
| Hardcoded UI theme (no prop) | 4 | LOW — cosmetic inconsistency |
| Missing type declaration | 1 | LOW — TS type-safety gap |
| **Total** | **24** | |

---

## Full File List — READ_VERIFIED

### GROUP A — Pure Mock Data Storage

| # | File | Lines | Status | Mock Content | Impact |
|---|------|-------|--------|-------------|--------|
| 1 | `web/src/features/orders/mock/orders.mock.ts` | 63 | READ_VERIFIED | 3 `Order` objects: ord-001 (completed/cash), ord-002 (pending/card), ord-003 (cancelled/split) | Orders page shows fake data permanently |
| 2 | `web/src/features/customers/mock/customers.mock.ts` | 94 | READ_VERIFIED | 5 customers + 3 order history + `CustomerStats{total:142,new_this_month:18,total_loyalty_points:24800}` | ⚠ `total_orders` in mock vs `orders_count` in type — field name inconsistency |
| 3 | `web/src/features/items/mock/items.mock.ts` | 76 | READ_VERIFIED | 4 items (قهوة سوداء/برجر/قص شعر/كابتشينو) + 3 categories | `category_name` flat string — backend returns nested object |

---

### GROUP B — Features with USE_MOCK=true / Returns Mock Directly

| # | File | Lines | Status | Mock Mechanism | Impact |
|---|------|-------|--------|---------------|--------|
| 4 | `web/src/features/items/hooks/useItems.ts` | 61 | READ_VERIFIED | **`USE_MOCK = true` (line 7)**. Hardcodes `'tenant-id'` string when mock disabled | ItemsPage.tsx imports this hook → always shows mock items |
| 5 | `web/src/features/orders/hooks/useOrders.ts` | 28 | READ_VERIFIED | **`queryFn: () => MOCK_ORDERS` (line 10)**. Comment: "استبدل بـ fetchOrders(filters) عند ربط API" | Orders list never comes from DB. Cancel mutation calls real API but cache stays mock |

---

### GROUP C — Inline Hardcoded Data Arrays

| # | File | Lines | Status | Hardcoded Data | Impact |
|---|------|-------|--------|---------------|--------|
| 6 | `web/src/features/pos/components/ItemGrid.tsx` | 126 | READ_VERIFIED | **`MOCK_ITEMS` (lines 10–19)**: Espresso(12), Latte(18), Cappuccino(16), Croissant(14), Sandwich(22), Cheesecake(20), Haircut(50), Beard Trim(30) + 2 with variants | POS never calls `GET /items`; items not from tenant catalog |
| 7 | `web/src/features/dashboard/pages/DashboardOverview.tsx` | 45 | READ_VERIFIED | All 4 stat cards hardcoded: `'2,480 SAR'`, `'34'`, `'28'`, `'6h'`. Changes: +12%, +5%, +3%, 0%. Charts: "Coming soon" | Main dashboard page has zero live data |
| 8 | `web/src/features/superadmin/reports/ReportsAuditPage.tsx` | 262 | READ_VERIFIED | `revenueData` (6 months: Jan–Jun MRR/ARR/churn), `tenantsByPlan` (Basic:142/Pro:87/Enterprise:23/Trial:61), `topTenants` (5 hardcoded businesses with MRR). Stat values: $19,400 / $232,800 / 252 / 0.9% | Full Reports section shows no real DB data |
| 9 | `web/src/features/superadmin/reports/components/AuditLogViewer.tsx` | 216 | READ_VERIFIED | `mockLogs` (lines 34–45): 10 audit entries with actors, actions, IPs, timestamps. Does NOT call `GET /superadmin/audit-logs` | Audit section has no real data despite backend endpoint existing |
| 10 | `web/src/features/superadmin/components/activity-feed.tsx` | 166 | READ_VERIFIED | `initialEvents` (8 events) + `newEventTemplates` (3). Auto-injects new events via `setInterval(5000)` | Simulates real-time feed from `audit_logs` — no backend connection |
| 11 | `web/src/features/superadmin/components/ai-insights.tsx` | 169 | READ_VERIFIED | `insights` (5 objects): churn(87%), growth(+18%), payment risk(22%), security anomaly(3x), API anomaly(8x) with hardcoded `confidence` values | No AI/ML backend; refresh button cosmetic (setTimeout 1200ms) |
| 12 | `web/src/features/superadmin/components/system-health.tsx` | 136 | READ_VERIFIED | `mockServices` (6 entries): api(98ms/healthy), db(12ms/healthy), queue(1.2k/**warning**), ai(340ms/healthy), storage(2.1TB/healthy), payments(↑22%/**critical**) | Does NOT call `GET /superadmin/health` — real endpoint exists and works |
| 13 | `web/src/features/superadmin/feature-flags/FeatureFlagsPage.tsx` | 69 | READ_VERIFIED | `MOCK_TENANTS` (lines 8–12): مطعم الأصالة, كافيه ليمون, ورشة الخليج | Tenant list not loaded from `GET /superadmin/tenants` |

---

### GROUP D — Missing Backend Saves (Critical)

| # | File | Lines | Status | Issue | Impact |
|---|------|-------|--------|-------|--------|
| 14 | `web/src/features/pos/page/POSPage.tsx` | 58 | READ_VERIFIED | Invoice number: `INV-${Date.now().toString().slice(-6)}` (line 17). **No `POST /invoices` ever called** | POS transactions never saved to DB — invoices lost on page refresh |
| 15 | `web/src/features/pos/hooks/useCart.ts` | 88 | READ_VERIFIED | **`const TAX_RATE = 0.15` (line 4)** hardcoded | Tax rate not configurable per tenant; always 15% regardless of plan or region |

---

### GROUP E — Hardcoded UI Theme (No `theme` Prop)

| # | File | Lines | Status | Hardcoded Colors | Impact |
|---|------|-------|--------|----------------|--------|
| 16 | `web/src/shared/ui/separator.tsx` | 28 | READ_VERIFIED | `bg-[#1e2130]` (line 23) | Dark separator in light dashboard context |
| 17 | `web/src/shared/ui/skeleton.tsx` | 45 | READ_VERIFIED | Colors per `theme` prop (correct). `StatCardSkeleton`, `TableRowSkeleton` presets | ✅ No issue — theme-aware |
| 18 | `web/src/shared/ui/stat-card.tsx` | 93 | READ_VERIFIED | All variant colors per `theme` prop (correct) | ✅ No issue — theme-aware |
| 19 | `web/src/shared/ui/switch.tsx` | 21 | READ_VERIFIED | Checked `bg-[#6366f1]`, unchecked `bg-[#1e2130]`; no `theme` prop | Switch always dark; used in settings page (zero API calls) |
| 20 | `web/src/shared/ui/tabs.tsx` | 37 | READ_VERIFIED | `bg-[#141720]`, active `bg-[#1a1f2e]`; no `theme` prop | Dark tabs in ExpensesPage (dashboard feature) |
| 21 | `web/src/shared/ui/tooltip.tsx` | 27 | READ_VERIFIED | `bg-[#1a1f2e] border-[#1e2130] text-white`; no `theme` prop | Tooltip always dark |

---

### GROUP F — Zero-API / Cosmetic Features

| # | File | Lines | Status | Issue | Impact |
|---|------|-------|--------|-------|--------|
| 22 | `web/src/types/i18n.ts` | 19 | READ_VERIFIED | 7 namespaces typed; **`items` namespace missing** (loaded at runtime but not in `Messages` type) | `useTranslations('items')` has no TypeScript type-safety or autocompletion |
| 23 | `web/src/features/superadmin/components/command-palette.tsx` | 302 | READ_VERIFIED | **All 20 command handlers: `() => {}`** (lines 51–71). Categories: Navigation/Tenants/Billing/Infrastructure/AI/Security. Keyboard navigation fully functional — execution non-functional | Full command palette UI built but does nothing. Dangerous actions (Suspend Tenant, Delete Tenant, Force Logout) silently no-op |
| 24 | `web/src/features/auth/hooks/use-auth.ts` | 40 | READ_VERIFIED | **`router.push('/en/superadmin')` and `router.push('/en/dashboard')` (line 29)** — locale `'en'` hardcoded | Arabic users (`/ar/...`) redirected to `/en/` after login. Breaks RTL session. `LoginPage.tsx` correctly uses `/${locale}/` but `useLogin` hook doesn't |

---

## Critical Findings by Priority

### 🔴 CRITICAL — Data Never Saved

| File | Issue |
|------|-------|
| `pos/page/POSPage.tsx` | POS transactions never POST to backend — invoices lost |
| `orders/hooks/useOrders.ts` | Orders page only shows mock; cancel calls real API on ghost data |

### 🔴 HIGH — Features Completely Non-Functional

| File | Issue |
|------|-------|
| `items/hooks/useItems.ts` | USE_MOCK=true — items always from mock file |
| `pos/components/ItemGrid.tsx` | Products hardcoded — not from tenant catalog |
| `reports/components/AuditLogViewer.tsx` | Ignores `GET /superadmin/audit-logs` |
| `components/system-health.tsx` | Ignores `GET /superadmin/health` |
| `superadmin/components/command-palette.tsx` | All 20 actions are no-ops |
| `auth/hooks/use-auth.ts` | Breaks Arabic users after login |

### 🟡 MEDIUM — Hardcoded Business Logic

| File | Issue |
|------|-------|
| `pos/hooks/useCart.ts` | TAX_RATE=0.15 — not per-tenant |
| `dashboard/pages/DashboardOverview.tsx` | All stats hardcoded |
| `reports/ReportsAuditPage.tsx` | All charts hardcoded |
| `components/activity-feed.tsx` | Real-time simulation, no audit_logs |
| `components/ai-insights.tsx` | 5 hardcoded insights |
| `feature-flags/FeatureFlagsPage.tsx` | MOCK_TENANTS |

### 🟢 LOW — UI / Theming Constants

| File | Issue |
|------|-------|
| `shared/ui/separator.tsx` | Dark-only |
| `shared/ui/tabs.tsx` | Dark-only |
| `shared/ui/tooltip.tsx` | Dark-only |
| `shared/ui/switch.tsx` | Dark-only |
| `types/i18n.ts` | Missing `items` namespace type |

---

## Phase G — Final Coverage

| Batch | Files | Status |
|-------|-------|--------|
| Batch 1 (files 1–15) | 15 | ✅ COMPLETE |
| Batch 2 (files 16–24) | 9 | ✅ COMPLETE |
| **Total** | **24** | **✅ 100%** |

---

*All findings extracted from actual code — no assumptions. Source: Phases A–F READ_VERIFIED data.*
