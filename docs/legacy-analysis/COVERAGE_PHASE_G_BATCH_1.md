# COVERAGE_PHASE_G_BATCH_1.md
# Phase G — Mock / Hardcoded Data — Batch 1/2
# Source: Already READ_VERIFIED in Phases A–F. No re-read needed.

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| All Files Already | READ_VERIFIED (Phases A–F) |
| Skipped | 0 |
| Batch Coverage | 100% |

---

## File-by-File Report

---

### 1. `web/src/features/orders/mock/orders.mock.ts`
| Field | Value |
|-------|-------|
| Lines | 63 |
| Last Line | 63 |
| Status | READ_VERIFIED (Phase E Batch 6) |
| API Calls | None |
| Mock Data | 3 hardcoded `Order` objects: `ord-001` (completed/cash), `ord-002` (pending/card), `ord-003` (cancelled/split) |
| Columns | `id, tenant_id, branch_id, cashier_id, cashier_name, shift_id, status, subtotal, discount_amount, tax_amount, total, payment_method, items[], created_at, cancelled_at?, cancelled_by?` |
| Notes | Exported as `MOCK_ORDERS`. Used directly by `useOrders.ts` as queryFn return value instead of real API |

---

### 2. `web/src/features/customers/mock/customers.mock.ts`
| Field | Value |
|-------|-------|
| Lines | 94 |
| Last Line | 94 |
| Status | READ_VERIFIED (Phase E Batch 5) |
| API Calls | None |
| Mock Data | 5 customers + 3 order history entries + 1 `CustomerStats` object |
| Columns | `Customer`: id, tenant_id, name, phone, email, loyalty_points, created_at, deleted_at, total_orders, total_spent · `CustomerOrder`: id, created_at, total, status, payment_method, items_count · `CustomerStats`: total=142, new_this_month=18, total_loyalty_points=24800 |
| Notes | ⚠ Mock uses `total_orders` field; `customer.types.ts` defines `orders_count` — inconsistency within frontend |

---

### 3. `web/src/features/items/mock/items.mock.ts`
| Field | Value |
|-------|-------|
| Lines | 76 |
| Last Line | 76 |
| Status | READ_VERIFIED (Phase E Batch 6) |
| API Calls | None |
| Mock Data | 4 items (قهوة سوداء with 3 variants, برجر كلاسيك, قص شعر, كابتشينو) + 3 categories |
| Columns | `Item`: id, tenant_id, name, type, operation_type, price, category_id, category_name, has_inventory, has_variants, is_active, created_at, deleted_at, variants[] · `Category`: id, tenant_id, name, type, is_active |
| Notes | Used by `useItems.ts` (`USE_MOCK=true`). Mock contains `category_name` as flat string — backend returns nested object |

---

### 4. `web/src/features/items/hooks/useItems.ts`
| Field | Value |
|-------|-------|
| Lines | 61 |
| Last Line | 61 |
| Status | READ_VERIFIED (Phase E Batch 6) |
| API Calls | `itemsApi.getItems('tenant-id')` — only when `USE_MOCK=false` |
| Mock Data | **`USE_MOCK = true` (line 7)** — all hooks return mock data: `mockItems`, `mockCategories` |
| Notes | ⚠ Two hooks files for same feature: `use-items.ts` (no mock) vs `useItems.ts` (USE_MOCK=true). `ItemsPage.tsx` imports from `useItems.ts` → always mock. Also hardcodes `'tenant-id'` as string |

---

### 5. `web/src/features/orders/hooks/useOrders.ts`
| Field | Value |
|-------|-------|
| Lines | 28 |
| Last Line | 28 |
| Status | READ_VERIFIED (Phase E Batch 7) |
| API Calls | `cancelOrder()` only (real API) |
| Mock Data | **`queryFn: () => MOCK_ORDERS` (line 10)** — comment says "استبدل بـ fetchOrders(filters) عند ربط API" |
| Notes | `useOrders()` + `useOrder()` always return mock. `useCancelOrder()` calls real backend. After cancel mutation, `invalidateQueries(['orders'])` runs but cache still returns mock |

---

### 6. `web/src/features/pos/components/ItemGrid.tsx`
| Field | Value |
|-------|-------|
| Lines | 126 |
| Last Line | 126 |
| Status | READ_VERIFIED (Phase E Batch 7) |
| API Calls | **None** |
| Mock Data | **`MOCK_ITEMS` hardcoded inline (lines 10–19)**: 8 items (Espresso, Latte, Cappuccino, Croissant, Sandwich, Cheesecake, Haircut, Beard Trim) with prices and variants |
| Notes | No connection to `GET /items`. Categories hardcoded: all/drinks/food/services/other. Items never loaded from DB. Should call `useItems()` or equivalent |

---

### 7. `web/src/features/pos/page/POSPage.tsx`
| Field | Value |
|-------|-------|
| Lines | 58 |
| Last Line | 58 |
| Status | READ_VERIFIED (Phase E Batch 7) |
| API Calls | **None** |
| Mock Data | Invoice number: `INV-${Date.now().toString().slice(-6)}` (line 17) — client-generated |
| Notes | ⚠ **No `POST /invoices` ever called.** Payment confirmed → receipt shown → cart cleared. No backend record. TAX_RATE comes from `useCart.ts` (hardcoded 0.15) |

---

### 8. `web/src/features/pos/hooks/useCart.ts`
| Field | Value |
|-------|-------|
| Lines | 88 |
| Last Line | 88 |
| Status | READ_VERIFIED (Phase E Batch 7) |
| API Calls | None |
| Mock Data | **`const TAX_RATE = 0.15` (line 4)** — hardcoded, not from tenant config |
| Notes | Tax rate should come from tenant settings or plan config. Cart state is in-memory only — lost on page refresh |

---

### 9. `web/src/features/dashboard/pages/DashboardOverview.tsx`
| Field | Value |
|-------|-------|
| Lines | 45 |
| Last Line | 45 |
| Status | READ_VERIFIED (Phase E Batch 5) |
| API Calls | **None** |
| Mock Data | All 4 stat cards hardcoded: `'2,480 SAR'`, `'34'`, `'28'`, `'6h'`. Changes: `+12`, `+5`, `+3`, `0`. Charts: `"Coming soon"` placeholder |
| Notes | The main dashboard page has zero live data. `user?.name` is the only dynamic value shown |

---

### 10. `web/src/features/superadmin/reports/ReportsAuditPage.tsx`
| Field | Value |
|-------|-------|
| Lines | 262 |
| Last Line | 262 |
| Status | READ_VERIFIED (Phase E Batch 10) |
| API Calls | **None** |
| Mock Data | `revenueData` (6 months, lines 16–23), `tenantsByPlan` (4 plan types + counts, lines 25–30), `topTenants` (5 hardcoded tenants, lines 32–38), stat card values all hardcoded: `$19,400`, `$232,800`, `252`, `0.9%` |
| Notes | Export button is cosmetic (setTimeout 1500ms then loading=false). Churn trend chart data inline. Full Reports section shows no real data from backend |

---

### 11. `web/src/features/superadmin/reports/components/AuditLogViewer.tsx`
| Field | Value |
|-------|-------|
| Lines | 216 |
| Last Line | 216 |
| Status | READ_VERIFIED (Phase E Batch 10) |
| API Calls | **None** |
| Mock Data | `mockLogs` (lines 34–45): 10 hardcoded audit entries with actors, actions, IPs, timestamps |
| Notes | ⚠ Does NOT call `GET /superadmin/audit-logs` despite backend endpoint existing. Refresh button is cosmetic (setTimeout 800ms). Filters work on mock data only |

---

### 12. `web/src/features/superadmin/components/activity-feed.tsx`
| Field | Value |
|-------|-------|
| Lines | 166 |
| Last Line | 166 |
| Status | READ_VERIFIED (Phase E Batch 8) |
| API Calls | **None** |
| Mock Data | `initialEvents` (8 hardcoded events, lines 40–49) + `newEventTemplates` (3 templates for simulation, lines 51–55). New events auto-injected every 5s via `setInterval` |
| Notes | Simulates real-time audit feed. No connection to `audit_logs` table. Categories: tenant/billing/security/system/ai/growth |

---

### 13. `web/src/features/superadmin/components/ai-insights.tsx`
| Field | Value |
|-------|-------|
| Lines | 169 |
| Last Line | 169 |
| Status | READ_VERIFIED (Phase E Batch 8) |
| API Calls | **None** |
| Mock Data | `insights` array (lines 34–40): 5 hardcoded insights — churn(87%), growth(+18%), payment failure risk(22%), security anomaly(3x), API anomaly(8x). All with hardcoded `confidence` values |
| Notes | Refresh button: `setRefreshing(true); setTimeout(() => setRefreshing(false), 1200)` — cosmetic only. No AI/ML backend |

---

### 14. `web/src/features/superadmin/components/system-health.tsx`
| Field | Value |
|-------|-------|
| Lines | 136 |
| Last Line | 136 |
| Status | READ_VERIFIED (Phase E Batch 9) |
| API Calls | **None** |
| Mock Data | `mockServices` (lines 26–33): api(98ms/healthy), database(12ms/healthy), queue(1.2k/warning), ai(340ms/healthy), storage(2.1TB/healthy), payments(↑22%/critical) |
| Notes | ⚠ Does NOT call `GET /superadmin/health` despite it existing in backend and returning real data. Live clock is the only real-time element |

---

### 15. `web/src/features/superadmin/feature-flags/FeatureFlagsPage.tsx`
| Field | Value |
|-------|-------|
| Lines | 69 |
| Last Line | 69 |
| Status | READ_VERIFIED (Phase E Batch 9) |
| API Calls | None direct |
| Mock Data | `MOCK_TENANTS` (lines 8–12): 3 hardcoded tenants — مطعم الأصالة, كافيه ليمون, ورشة الخليج |
| Notes | Tenant list should be loaded from `GET /superadmin/tenants`. Also all feature-flag API endpoints are non-existent (see Section 1.7) |

---

## Batch 1 Summary

| Category | Count | Impact |
|----------|-------|--------|
| Pure mock data files | 3 | orders.mock, customers.mock, items.mock |
| Features using USE_MOCK=true | 2 | useItems.ts, useOrders.ts |
| Features with inline hardcoded data | 7 | ItemGrid, DashboardOverview, ReportsAuditPage, AuditLogViewer, ActivityFeed, AiInsights, SystemHealth |
| Real-time simulation (no backend) | 2 | activity-feed, ai-insights |
| Missing POST to backend | 2 | POSPage (no invoice save), useOrders (cancel-only) |
| Hardcoded business constants | 1 | useCart (TAX_RATE=0.15) |
| Tenant list hardcoded | 1 | FeatureFlagsPage |

---

## ⛔ STOPPED — Awaiting confirmation for Batch 2 (9 files: hardcoded UX/cosmetic)
