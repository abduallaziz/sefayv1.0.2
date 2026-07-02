# SCHEMA_DECISION_MATRIX.md
# Final Schema Decision Matrix — Based on DDL_FINAL_AUDIT.md

---

## ✅ STATUS UPDATE — June 25, 2026
كل التضاربات الستة أدناه (A–F) **مُصلَحة فعليًا في الكود الحالي** — تم التحقق المباشر عبر قراءة الملفات المذكورة (لا اعتماد على هذه الوثيقة فقط)، وتأكدت أن جميعها أُصلحت ضمن commit `745ca84` ("fix: security & bug remediation - 80 issues closed"). راجع `STATUS.md §34` للتفاصيل الكاملة لكل بند ومكان التحقق بالكود.
**هذا يعني أن هذا الملف تاريخي/أرشيفي الآن** — يوثّق قرارات اتُّخذت ونُفِّذت، لا فجوات حالية. إذا ظهر تضارب schema جديد لاحقًا، أنشئ قسمًا جديدًا بدل تعديل الأقسام التالية.

---

## Conflicts Overview (محلولة بالكامل — أرشيفي)

| ID | Conflict | Severity | Tables Affected |
|----|----------|----------|----------------|
| A | `billing_invoices` vs `invoices` (table name mismatch) | CRITICAL | `billing_invoices`, `invoices` |
| B | `invoices.amount_due` vs `invoices.total_amount` (column name mismatch) | CRITICAL | `invoices` |
| C | `subscriptions.expires_at` — SELECTed, never written | HIGH | `subscriptions` |
| D | `subscriptions.max_users` / `max_branches` — SELECTed, never written | HIGH | `subscriptions` |
| E | `dunning_attempts.attempted_at` — filtered on, never written | MEDIUM | `dunning_attempts` |
| F | `subscriptions.grace_period_ends_at` — filtered on, never written | MEDIUM | `subscriptions` |

---

---

## CONFLICT A — Table Name: `billing_invoices` vs `invoices`

### Location

| File | Lines | Operation |
|------|-------|-----------|
| `api/src/core/billing/stripe-webhook.controller.ts` | 106 | `.from('billing_invoices')` — UPDATE on payment failed |
| `api/src/core/billing/stripe-webhook.controller.ts` | 130 | `.from('billing_invoices')` — UPDATE on payment succeeded |
| `api/src/core/billing/repositories/invoices.repository.ts` | 76–92 | INSERT into `invoices` |
| `api/src/core/billing/repositories/invoices.repository.ts` | 119–136 | UPDATE on `invoices` |

### Root Cause

Two different table names used for the same concept within the same billing subsystem. The billing repository creates and updates `invoices`. The Stripe webhook controller updates `billing_invoices`. These are two separate strings in two separate files pointing to what is architecturally one table.

---

### Solution 1 — Fix Code

| Attribute | Detail |
|-----------|--------|
| **What** | Change `.from('billing_invoices')` to `.from('invoices')` in `stripe-webhook.controller.ts` lines 106 and 130 |
| **Lines changed** | 2 |
| **Why it works** | `invoices` table already exists with all required columns: `id`, `status`, `paid_at`, `updated_at` — confirmed by billing repository INSERT |
| **Risk** | LOW — no new table, no schema change, no RLS changes required |
| **Side effects** | None. Stripe webhooks now correctly update the same table the billing service reads |

### Solution 2 — Fix DDL (Zero Code Changes)

| Attribute | Detail |
|-----------|--------|
| **What** | Create `billing_invoices` table with columns: `id`, `status`, `paid_at`, `updated_at` |
| **Why it does NOT work** | Stripe webhook updates `billing_invoices`. Billing service reads `invoices`. The two tables never sync. Invoice status confirmed by Stripe is invisible to the rest of the system. Creates permanent split-brain between payment state and invoice state. |
| **Risk** | CRITICAL — structurally wrong, not just a naming fix |
| **Side effects** | New table requires RLS policies in Supabase. PostgREST exposes it as a new endpoint. No existing code reads from `billing_invoices` — it becomes a data graveyard |

### Comparison

| Criterion | Solution 1 (Fix Code) | Solution 2 (Fix DDL) |
|-----------|----------------------|---------------------|
| Lines changed | 2 | 0 |
| Less risky | **YES** | NO |
| Zero Code Changes | NO | YES |
| Affects Supabase/PostgREST | NO | YES — new table, new RLS |
| Data consistency preserved | YES | NO — two tables diverge |
| Architecturally correct | YES | NO |

### Final Decision: **Solution 1 — Fix Code**

Rationale: Solution 2 is zero-code-change but architecturally destructive. It creates permanent data divergence between two tables that represent the same entity. The `invoices` table already has the exact columns the webhook needs. This is a two-line fix with no schema impact.

---

---

## CONFLICT B — Column Name: `invoices.amount_due` vs `invoices.total_amount`

### Location

| File | Line | Operation |
|------|------|-----------|
| `api/src/core/billing/dunning/dunning.service.ts` | 168 | `.select('id, amount_due, currency')` — reads non-existent column |
| `api/src/core/billing/dunning/dunning.service.ts` | ~179 | `invoice?.amount_due ?? 0` — uses the null result |
| `api/src/core/billing/repositories/invoices.repository.ts` | 81 | INSERT uses `total_amount` — the actual column name |

### Root Cause

The dunning service reads `amount_due` from the `invoices` table. The billing repository inserts the same value under the name `total_amount`. The `amount_due` column is never written anywhere. Every dunning retry therefore reads `null` and falls back to `0`, causing the payment provider to be charged $0 on every retry attempt.

---

### Solution 1 — Fix Code

| Attribute | Detail |
|-----------|--------|
| **What** | Change `.select('id, amount_due, currency')` to `.select('id, total_amount, currency')` on line 168. Change `invoice?.amount_due` to `invoice?.total_amount` on line ~179 |
| **Lines changed** | 2 |
| **Why it works** | `total_amount` is the confirmed column name, inserted by the billing repository on every invoice creation |
| **Risk** | LOW — `total_amount` is confirmed present and populated |
| **Side effects** | None. Dunning retries now charge the correct invoice amount |

### Solution 2 — Fix DDL (Zero Code Changes)

| Attribute | Detail |
|-----------|--------|
| **What** | Add `amount_due` as a generated column to `invoices` with expression `= total_amount` |
| **Why it is problematic** | Creates two columns representing identical data: `total_amount` (writeable) and `amount_due` (generated/read-only). All future reads of `invoices.*` return both columns. Any developer adding new invoice logic faces ambiguity about which column to use. |
| **Risk** | MEDIUM — PostgREST exposes generated columns but they are read-only. Future INSERTs that accidentally include `amount_due` in the payload will fail |
| **Side effects** | New column visible in all `SELECT *` from invoices. Requires schema migration. All existing invoice responses change shape |

### Comparison

| Criterion | Solution 1 (Fix Code) | Solution 2 (Fix DDL) |
|-----------|----------------------|---------------------|
| Lines changed | 2 | 0 |
| Less risky | **YES** | NO |
| Zero Code Changes | NO | YES |
| Affects Supabase/PostgREST | NO | YES — new column in all `invoices` responses |
| Creates redundant data | NO | YES — two columns, one value |
| Architecturally correct | YES | NO |

### Final Decision: **Solution 1 — Fix Code**

Rationale: `amount_due` and `total_amount` are the same value. The column was simply misnamed in one file. Adding a generated column creates permanent redundancy and changes the shape of every invoice API response. This is a two-line fix.

---

---

## CONFLICT C — Column Never Written: `subscriptions.expires_at`

### Location

| File | Line | Operation |
|------|------|-----------|
| `api/src/modules/tenants/repositories/tenants.repository.ts` | 44 | `SELECT expires_at` — column never inserted or updated anywhere |
| `api/src/core/billing/billing.service.ts` | 198–208 | UPDATE uses `current_period_end` — the semantically equivalent column |

### Root Cause

`tenants.repository.ts` selects `expires_at` from `subscriptions`. The billing service writes `current_period_end` for the same concept (when the paid period ends). No code in the project ever writes `expires_at` to the `subscriptions` table. The subscription profile endpoint therefore always returns `expires_at: null`.

---

### Solution 1 — Fix Code

| Attribute | Detail |
|-----------|--------|
| **What** | In `tenants.repository.ts` line 44, replace `expires_at` with `current_period_end` in the SELECT string |
| **Lines changed** | 1 (same line as CONFLICT D — can be fixed together) |
| **Why it works** | `current_period_end` is the column actually written by the billing service for the same semantic concept |
| **Risk** | LOW — read-only change to SELECT, no writes affected |
| **Side effects** | `TenantsController` subscription response field changes name from `expires_at` to `current_period_end`. Frontend must be verified if it consumes this field |

### Solution 2 — Fix DDL (Zero Code Changes)

| Attribute | Detail |
|-----------|--------|
| **What** | Add `expires_at` column to `subscriptions` table. Add a trigger that sets `expires_at = current_period_end` on every INSERT/UPDATE |
| **Risk** | MEDIUM — creates denormalized data. If `current_period_end` is ever updated without the trigger firing, `expires_at` silently drifts. Two columns, one truth |
| **Side effects** | New column in `subscriptions`. PostgREST exposes it. Trigger required to keep in sync with `current_period_end` |

### Comparison

| Criterion | Solution 1 (Fix Code) | Solution 2 (Fix DDL) |
|-----------|----------------------|---------------------|
| Lines changed | 1 | 0 |
| Less risky | **YES** | NO |
| Zero Code Changes | NO | YES |
| Affects Supabase/PostgREST | NO | YES — new column, trigger |
| Creates two sources of truth | NO | YES |
| Frontend impact | Possible field rename | None |

### Final Decision: **Solution 1 — Fix Code**

Rationale: `expires_at` and `current_period_end` represent the same moment. Adding a redundant column requires a trigger and creates permanent sync risk. The field rename in the API response is a known, bounded side effect. Fix C and D in the same single-line edit.

---

---

## CONFLICT D — Columns Never Written: `subscriptions.max_users` / `subscriptions.max_branches`

### Location

| File | Line | Operation |
|------|------|-----------|
| `api/src/modules/tenants/repositories/tenants.repository.ts` | 44 | `SELECT max_users, max_branches` from `subscriptions` — never written |
| `api/src/core/billing/billing.service.ts` | 87–95 | `getPlanLimits()` reads `plans.max_users`, `plans.max_branches` — correct source |

### Root Cause

`tenants.repository.ts` attempts to read `max_users` and `max_branches` from the `subscriptions` table. These values belong to and are correctly read from the `plans` table by the billing service. No INSERT or UPDATE in the codebase ever writes these columns to `subscriptions`. The subscription profile endpoint returns `max_users: null, max_branches: null` always.

---

### Solution 1 — Fix Code

| Attribute | Detail |
|-----------|--------|
| **What** | Remove `max_users, max_branches` from the `subscriptions` SELECT on `tenants.repository.ts` line 44. If these values must appear in the tenant subscription response, join to `plans` in the same query |
| **Lines changed** | 1 (same line as CONFLICT C) |
| **Risk** | LOW for removal. If a join to `plans` is added, LOW-MEDIUM |
| **Side effects** | Subscription response no longer includes `max_users`/`max_branches` unless the query is extended with a `plans` join |

### Solution 2 — Fix DDL (Zero Code Changes)

| Attribute | Detail |
|-----------|--------|
| **What** | Add `max_users` and `max_branches` to `subscriptions` table. Populate via trigger from `plans` on subscription INSERT/UPDATE |
| **Risk** | HIGH — denormalized plan limits in subscriptions. If an admin changes plan limits (e.g., upgrades a plan's `max_users`), all existing subscriptions on that plan silently retain the old limit. Limits diverge from plan definition |
| **Side effects** | New columns in `subscriptions`. Trigger required. PostgREST exposes them. Semantically wrong: limits belong to the plan, not the subscription record |

### Comparison

| Criterion | Solution 1 (Fix Code) | Solution 2 (Fix DDL) |
|-----------|----------------------|---------------------|
| Lines changed | 1 | 0 |
| Less risky | **YES** | NO |
| Zero Code Changes | NO | YES |
| Affects Supabase/PostgREST | NO | YES — new columns, trigger |
| Architecturally correct | YES | NO — limits belong to plans |
| Plan limit changes propagate | YES (live from plans) | NO (snapshot at subscription creation) |

### Final Decision: **Solution 1 — Fix Code**

Rationale: Plan limits belong to the `plans` table. Copying them into `subscriptions` creates a snapshot that cannot reflect plan changes. This is architecturally wrong regardless of the convenience. Remove from the SELECT; fetch limits from `plans` when needed. This shares the same line-44 fix with CONFLICT C — both resolved in one edit.

---

---

## CONFLICT E — Column Filtered But Never Written: `dunning_attempts.attempted_at`

### Location

| File | Line | Operation |
|------|------|-----------|
| `api/src/core/billing/dunning/dunning.service.ts` | 82 | `.lte('attempted_at', graceCutoff)` — filter on `attempted_at` |
| `api/src/core/billing/dunning/dunning.service.ts` | 127–133 | INSERT into `dunning_attempts` — `attempted_at` NOT included |

### Root Cause

`suspendExpiredGracePeriods()` filters `dunning_attempts` by `attempted_at <= graceCutoff` to find exhausted attempts that have passed the grace window. However, the INSERT that creates dunning attempts never writes `attempted_at`. If the column exists in schema but has no default, it is always NULL and the filter `.lte('attempted_at', ...)` returns no rows — the grace period suspension never fires.

---

### Solution 1 — Fix Code

| Attribute | Detail |
|-----------|--------|
| **What** | Add `attempted_at: new Date().toISOString()` to the INSERT payload in `dunning.service.ts` line ~128 |
| **Lines changed** | 1 |
| **Risk** | LOW — adding an explicit timestamp to an existing INSERT |
| **Side effects** | None. `attempted_at` now correctly records when each attempt was logged |

### Solution 2 — Fix DDL (Zero Code Changes)

| Attribute | Detail |
|-----------|--------|
| **What** | Set `DEFAULT NOW()` on `attempted_at` column in `dunning_attempts` table |
| **Risk** | LOW — a column default is a non-breaking, backward-compatible schema change |
| **Side effects** | All future INSERTs automatically populate `attempted_at` without any code change. PostgREST: no API shape change since `attempted_at` already exists in the table |

### Comparison

| Criterion | Solution 1 (Fix Code) | Solution 2 (Fix DDL) |
|-----------|----------------------|---------------------|
| Lines changed | 1 | 0 |
| Less risky | EQUAL | EQUAL |
| Zero Code Changes | NO | **YES** |
| Affects Supabase/PostgREST | NO | Minimal — column default only, no shape change |
| Semantically correct | YES | YES |
| Works for existing rows | NO (past rows still NULL) | NO (past rows still NULL) |

### Final Decision: **Solution 2 — Fix DDL**

Rationale: This is the one case where a DDL fix is genuinely superior. Adding `DEFAULT NOW()` to a column is a non-breaking, zero-risk schema change. It requires zero code changes and is semantically correct — the database records when each row was inserted. Solution 1 also works but adds unnecessary boilerplate to a service that should not need to manually set a timestamp the database can handle automatically.

---

---

## CONFLICT F — Column Filtered But Never Written: `subscriptions.grace_period_ends_at`

### Location

| File | Line | Operation |
|------|------|-----------|
| `api/src/core/billing/billing.service.ts` | 290 | `.lt('grace_period_ends_at', now)` — filter in `handleSubscriptionExpiry` cron |
| `api/src/core/billing/billing.service.ts` | (all) | No INSERT or UPDATE ever sets `grace_period_ends_at` |
| `api/src/core/billing/billing.service.ts` | (all) | No code ever assigns `status = GRACE_PERIOD` to any subscription |

### Root Cause

`handleSubscriptionExpiry()` has a branch that expires GRACE_PERIOD subscriptions by filtering on `grace_period_ends_at`. However:

1. No code ever transitions a subscription TO `GRACE_PERIOD` status
2. No code ever writes `grace_period_ends_at`

The entire GRACE_PERIOD expiry branch is dead code. The filter `.lt('grace_period_ends_at', now)` never matches any row because the filter column is never populated and the status value is never assigned.

---

### Solution 1 — Fix Code

| Attribute | Detail |
|-----------|--------|
| **What** | Remove the GRACE_PERIOD expiry block (lines 288–300) from `billing.service.ts` `handleSubscriptionExpiry()`. The block updates subscriptions with `status = GRACE_PERIOD` that will never exist |
| **Lines changed** | ~12 (deletion of dead code block) |
| **Risk** | LOW — removing code that provably never executes |
| **Side effects** | None. The `graceError` log line disappears. The GRACE_PERIOD flow remains unimplemented (as it already is) |
| **Alternative** | If GRACE_PERIOD is a planned feature: add the full flow (assign GRACE_PERIOD status on payment failure, set `grace_period_ends_at = NOW() + N days`). That is a feature implementation, not a bug fix |

### Solution 2 — Fix DDL (Zero Code Changes)

| Attribute | Detail |
|-----------|--------|
| **What** | Add `DEFAULT NOW() + INTERVAL '7 days'` to `grace_period_ends_at` column |
| **Why it does NOT work** | The filter never fires because no row ever has `status = GRACE_PERIOD`. Even if `grace_period_ends_at` has a default value, no subscription is ever placed in GRACE_PERIOD status. The entire UPDATE would still match 0 rows |
| **Risk** | LOW (schema change) but INEFFECTIVE — does not resolve the dead code problem |
| **Side effects** | All new subscriptions get a `grace_period_ends_at` set to creation time + 7 days even though they are not in grace period status. Semantically incorrect |

### Comparison

| Criterion | Solution 1 (Fix Code) | Solution 2 (Fix DDL) |
|-----------|----------------------|---------------------|
| Lines changed | ~12 | 0 |
| Less risky | **YES** | NEUTRAL (DDL change doesn't fix the bug) |
| Zero Code Changes | NO | YES (but ineffective) |
| Affects Supabase/PostgREST | NO | Minimal — column default only |
| Actually resolves the issue | **YES** | **NO** |
| Dead code removed | YES | NO |

### Final Decision: **Solution 1 — Fix Code (remove dead code block)**

Rationale: Solution 2 cannot fix this conflict because the bug is not the missing column default — it is that the GRACE_PERIOD status is never assigned. A DDL change is powerless here. The correct action is to remove the dead code block. If GRACE_PERIOD is a future planned feature, the block should be replaced with a `// TODO: implement grace period transition logic` comment, not left as a silently-failing cron branch.

---

---

## Final Summary Table

| ID | Conflict | Final Decision | Lines Changed | Supabase Schema Impact |
|----|----------|---------------|--------------|----------------------|
| A | `billing_invoices` vs `invoices` | Fix Code | **2** | None |
| B | `amount_due` vs `total_amount` | Fix Code | **2** | None |
| C | `subscriptions.expires_at` never written | Fix Code | **1** (shared with D) | None |
| D | `subscriptions.max_users/max_branches` never written | Fix Code | **1** (shared with C) | None |
| E | `dunning_attempts.attempted_at` never written | Fix DDL | **0** | Add `DEFAULT NOW()` to `attempted_at` |
| F | `subscriptions.grace_period_ends_at` dead code | Fix Code | **~12** | None |

**Total code lines to change: ~17**
**Total DDL changes: 1 (a single column default)**

---

## Zero Code Changes Assessment

| Conflict | Can Zero Code Changes solve it? | Why |
|----------|---------------------------------|-----|
| A | NO | Creating `billing_invoices` causes permanent data divergence |
| B | NO | A generated column adds redundancy and changes API response shape |
| C | NO | Adding `expires_at` to schema denormalizes `current_period_end` |
| D | NO | Adding limits to subscriptions creates a snapshot that diverges from plan changes |
| E | **YES** | `DEFAULT NOW()` is a clean, correct, non-breaking schema fix |
| F | NO | DDL cannot fix a dead-code path that never assigns the required status |

**Verdict: Zero Code Changes is only viable for Conflict E. For all others, code changes are the correct and lower-risk solution.**

---

*Matrix derived from DDL_FINAL_AUDIT.md — no SQL generated, no DDL generated, no files modified.*
