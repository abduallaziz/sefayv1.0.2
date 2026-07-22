# COVERAGE_PHASE_D.md
# Phase D — api/src/database + api/src/seeds
# ✅ COMPLETE

---

## Final Summary

| Metric | Value |
|--------|-------|
| Files Found | 6 |
| Files Read | 6 |
| Files Skipped | 0 |
| Coverage % | **100%** |

---

## Complete File List — READ_VERIFIED

| # | File | Lines | Last Line | Status | Tables Found | Supabase Queries |
|---|------|-------|-----------|--------|-------------|-----------------|
| 1 | database/README.md | 15 | 15 | READ_VERIFIED | None | None |
| 2 | database/migrations/C0_add_shift_id_to_orders.sql | 1 | 1 | READ_VERIFIED | `orders` (implied) | None — **FILE IS BLANK** |
| 3 | database/migrations/C0_rollback_shift_id_from_orders.sql | 1 | 1 | READ_VERIFIED | `orders` (implied) | None — **FILE IS BLANK** |
| 4 | database/seeds/generate-token.ts | 31 | 31 | READ_VERIFIED | None | None |
| 5 | database/seeds/permissions.seed.ts | 96 | 96 | READ_VERIFIED | `permissions`, `role_permissions` | 2 UPSERT — **INCOMPLETE: 22 perms, no superadmin** |
| 6 | seeds/permissions.seed.ts | 120 | 120 | READ_VERIFIED | `permissions`, `role_permissions` | 2 UPSERT — **COMPLETE: 30 perms, superadmin included** |

---

## Critical Findings (from actual code only)

### FINDING 1 — Empty Migration Files
**Severity: HIGH**

| File | Line | Content |
|------|------|---------|
| database/migrations/C0_add_shift_id_to_orders.sql | 1 | blank |
| database/migrations/C0_rollback_shift_id_from_orders.sql | 1 | blank |

`shifts.repository.ts` line 100 queries `.eq('shift_id', shiftId)` on `orders` table.
README.md line 16 marks migration as `⬜ Pending`.
**`shift_id` column may not exist in live `orders` table.**
All shift-invoice linking queries return empty silently if column is absent.

---

### FINDING 2 — Wrong Seed File Wired to npm Script
**Severity: HIGH**

`package.json` script `seed:permissions` → `database/seeds/permissions.seed.ts` (96 lines, **22 permissions, no superadmin**).

The complete version is `seeds/permissions.seed.ts` (120 lines, **30 permissions, superadmin included**).

Running `npm run seed:permissions` in production will:
- Seed only 22 permissions
- **Leave superadmin role with zero permissions**
- SuperAdmin endpoints remain accessible via `SuperAdminGuard` (role check) but `PermissionGuard` will deny all `analytics.view.all`, `audit.view.all`, `superadmin.queue.*` etc.

---

### FINDING 3 — Duplicate Seed Files
**Severity: MEDIUM**

Two permission seed files exist with diverging content:

| Attribute | database/seeds/permissions.seed.ts | seeds/permissions.seed.ts |
|-----------|-------------------------------------|--------------------------|
| Permission count | 22 | 30 |
| superadmin role | ❌ | ✅ |
| .env path resolution | `../../../.env` (3 up) | `../../.env` (2 up) |
| npm run seed:permissions | ✅ (wired) | ❌ (not wired) |

---

### FINDING 4 — generate-token.ts is Dev-Only Utility
**Severity: INFO**

`database/seeds/generate-token.ts` generates test JWT tokens with hardcoded test IDs (`test-cashier-id`, `test-tenant-id`). No DB queries. No production risk. Dev-only script run via `npm run gen:tokens`.

---

## Columns Confirmed in Phase D Seeds

### Table: `permissions`
| Column | Type | Source |
|--------|------|--------|
| `key` | string (PK, onConflict) | seeds lines 14–67 |
| `resource` | string | seeds lines 14–67 |
| `action` | string | seeds lines 14–67 |
| `scope` | string | seeds lines 14–67 |
| `description` | string | seeds lines 14–67 |

### Table: `role_permissions`
| Column | Type | Source |
|--------|------|--------|
| `role` | string (composite PK) | seeds lines 54–85 |
| `permission_key` | string (composite PK) | seeds lines 54–85 |
| `is_granted` | boolean | seeds lines 54–85 |

---

## Mathematical Proof

```
Files found in api/src/database : 5
Files found in api/src/seeds    : 1
Total                           : 6
Files READ_VERIFIED             : 6
Files Skipped                   : 0

Coverage = 6/6 = 100% ✅
```

---

## ⛔ PHASE D COMPLETE — STOPPED. Awaiting confirmation before any next Phase.
