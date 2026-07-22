# COVERAGE_PHASE_D_BATCH_1.md
# Phase D — Batch 1/1
# api/src/database + api/src/seeds

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 6 |
| Files Read | 6 |
| Files Skipped | 0 |
| Coverage % | **100%** |

---

## File-by-File Report

---

### 1. database/README.md

| Field | Value |
|-------|-------|
| Lines | 15 |
| Last Line | 15 |
| Status | READ_VERIFIED |
| Tables Found | None (documentation only) |
| Columns Found | None |
| Supabase Queries | None |

**Content extracted (line 16–18):**
Migration history table shows `C0_add_shift_id_to_orders.sql` status = `⬜ Pending` as of 2026-05-28.

**Rules documented (lines 4–6):**
- No hard delete on `orders`, `shifts`, `expenses`
- Migrations run manually via Supabase SQL Editor
- Each migration must have a rollback script

---

### 2. database/migrations/C0_add_shift_id_to_orders.sql

| Field | Value |
|-------|-------|
| Lines | 1 |
| Last Line | 1 |
| Status | READ_VERIFIED |
| Tables Found | `orders` (implied by filename) |
| Columns Found | `shift_id` (implied by filename) |
| Supabase Queries | None |

⚠️ **CRITICAL FINDING:** File content is **blank** (1 line = empty/whitespace only).
The migration that adds `shift_id` to `orders` has **never been written**. The filename and README list it as `⬜ Pending`, but the file itself is empty. Yet `shifts.repository.ts` line 100 queries `orders` using `.eq('shift_id', shiftId)`. This column **may not exist** in the live database.

---

### 3. database/migrations/C0_rollback_shift_id_from_orders.sql

| Field | Value |
|-------|-------|
| Lines | 1 |
| Last Line | 1 |
| Status | READ_VERIFIED |
| Tables Found | `orders` (implied by filename) |
| Columns Found | `shift_id` (implied by filename) |
| Supabase Queries | None |

⚠️ **CRITICAL FINDING:** File content is also **blank** (1 line = empty/whitespace only).
Both the migration and its rollback are empty files. Neither has been implemented.

---

### 4. database/seeds/generate-token.ts

| Field | Value |
|-------|-------|
| Lines | 31 |
| Last Line | 31 |
| Status | READ_VERIFIED |
| Tables Found | None — no DB queries |
| Columns Found | None |
| Supabase Queries | None |

**Purpose:** Dev utility — generates test JWT tokens using `jsonwebtoken` and `JWT_SECRET` from `.env`.

**JWT payload fields used (lines 9–18 / 21–30):**

| Field | Value (cashier) | Value (owner) |
|-------|----------------|---------------|
| `sub` | `'test-cashier-id'` | `'test-owner-id'` |
| `email` | `'cashier@test.com'` | `'owner@test.com'` |
| `role` | `'cashier'` | `'owner'` |
| `tenant_id` | `'test-tenant-id'` | `'test-tenant-id'` |
| `session_id` | `'test-session-id'` | `'test-session-id'` |

Run via: `npm run gen:tokens`

---

### 5. database/seeds/permissions.seed.ts

| Field | Value |
|-------|-------|
| Lines | 96 |
| Last Line | 96 (call to `seed()`) |
| Status | READ_VERIFIED |
| Tables Found | `permissions`, `role_permissions` |
| Columns Found | See below |
| Supabase Queries | 2 UPSERT operations |

**Table: `permissions`**
- Operation: UPSERT (lines 97–99), onConflict: `key`
- Columns: `key`, `resource`, `action`, `scope`, `description`
- Records seeded: **22 permission keys** (invoice, expense, shift, users, items, branches, reports, settings)

**Table: `role_permissions`**
- Operation: UPSERT (lines 108–110), onConflict: `role,permission_key`
- Columns: `role`, `permission_key`, `is_granted`
- Roles covered: `owner`, `manager`, `cashier`, `worker`

⚠️ **DIFFERENCE vs seeds/permissions.seed.ts:** This older version does **NOT** include:
- `superadmin` role permissions
- `analytics.view.all`, `audit.view.all`
- `superadmin.queue.*`, `superadmin.health.view`, `superadmin.backup.view`
- `invoice.view` and `items.view` permissions (only `manage`)
- `branches.view` permission

Run via: `npm run seed:permissions` (resolves to `database/seeds/permissions.seed.ts`)

---

### 6. seeds/permissions.seed.ts

| Field | Value |
|-------|-------|
| Lines | 120 |
| Last Line | 120 (call to `seed()`) |
| Status | READ_VERIFIED |
| Tables Found | `permissions`, `role_permissions` |
| Columns Found | See below |
| Supabase Queries | 2 UPSERT operations |

**Table: `permissions`**
- Operation: UPSERT (lines 127–129), onConflict: `key`
- Columns: `key`, `resource`, `action`, `scope`, `description`
- Records seeded: **30 permission keys** (adds analytics, audit, superadmin queue/health/backup)

**Table: `role_permissions`**
- Operation: UPSERT (lines 138–141), onConflict: `role,permission_key`
- Columns: `role`, `permission_key`, `is_granted`
- Roles covered: `owner`, `manager`, `cashier`, `worker`, **`superadmin`** (line 122)

**`env` path difference:**
- `database/seeds/permissions.seed.ts` line 5: `path.resolve(__dirname, '../../../.env')` → 3 levels up
- `seeds/permissions.seed.ts` line 5: `path.resolve(__dirname, '../../.env')` → 2 levels up ← correct for `src/seeds/`

---

## Cross-File Analysis

### ⚠️ CRITICAL: Two Permission Seed Files Exist

| Attribute | database/seeds/permissions.seed.ts | seeds/permissions.seed.ts |
|-----------|-------------------------------------|--------------------------|
| Permissions count | 22 | 30 |
| Has superadmin role | ❌ No | ✅ Yes |
| Has analytics perms | ❌ No | ✅ Yes |
| Has audit perms | ❌ No | ✅ Yes |
| Has queue perms | ❌ No | ✅ Yes |
| npm script points to | ✅ `database/seeds/` (package.json) | ❌ Not directly referenced |
| .env path | `../../../.env` (3 up) | `../../.env` (2 up) ← correct |

**Risk:** `npm run seed:permissions` runs the **older incomplete version** (`database/seeds/`). The superadmin role will have no permissions after running this script. The correct script is `seeds/permissions.seed.ts`.

### ⚠️ CRITICAL: Empty Migration Files

Both SQL migration files are blank:
- `C0_add_shift_id_to_orders.sql` — 1 blank line
- `C0_rollback_shift_id_from_orders.sql` — 1 blank line

But `shifts.repository.ts` line 100 actively queries `.eq('shift_id', shiftId)` on `orders`. If `shift_id` column was never added to `orders`, this query silently returns empty results — no error thrown.

---

## Unique Tables Discovered in Phase D

| Table | Operation | File | Line |
|-------|-----------|------|------|
| `permissions` | UPSERT | database/seeds/permissions.seed.ts | 97–99 |
| `permissions` | UPSERT | seeds/permissions.seed.ts | 127–129 |
| `role_permissions` | UPSERT | database/seeds/permissions.seed.ts | 108–110 |
| `role_permissions` | UPSERT | seeds/permissions.seed.ts | 138–141 |

**Columns confirmed by seeds:**

`permissions`: `key` (PK, onConflict), `resource`, `action`, `scope`, `description`

`role_permissions`: `role` + `permission_key` (composite PK, onConflict), `is_granted`
