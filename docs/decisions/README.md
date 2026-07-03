# decisions/ — Architecture Decision Records

This folder holds Architecture Decision Records (ADRs) for the Sefay ERP platform. Each ADR documents one significant technical decision: the context that prompted it, the options that were considered, the decision that was made, and the consequences — both positive and negative — of that decision.

---

## What Is an ADR?

An Architecture Decision Record is a short document that answers the question: "Why does the system work this way?"

ADRs are not design documents. They do not describe how something is built — the architecture documents in `docs/architecture/` do that. ADRs describe why it was built that way, specifically when the decision was non-obvious or when alternatives were seriously considered and rejected.

Without ADRs, engineers who join later (or return to a part of the system after months away) have no record of why key choices were made. They may re-examine the same alternatives, arrive at the same or worse conclusions, and potentially reverse decisions that had good reasons behind them.

---

## ADR Format

Each ADR is a single Markdown file named `NNN-short-title.md` (e.g. `001-portal-rendering-for-popups.md`). The number is assigned sequentially. The format:

```markdown
# ADR-NNN: [Decision Title]

*Date: YYYY-MM-DD*
*Status: Accepted | Superseded by ADR-NNN | Deprecated*

## Context

[What situation, constraint, or problem prompted this decision?]

## Options Considered

### Option A: [Name]
[Description. Pros. Cons.]

### Option B: [Name]
[Description. Pros. Cons.]

### Option C: [Name] (if applicable)
[Description. Pros. Cons.]

## Decision

[Which option was chosen and why.]

## Consequences

### Positive
[What the decision enables or improves.]

### Negative / Trade-offs
[What the decision costs or forecloses.]

### Risks
[What could go wrong, and what would trigger revisiting this decision.]
```

---

## ADR Lifecycle

- **Proposed** — the ADR is being drafted; the decision has not yet been made or has been made but not yet formally recorded.
- **Accepted** — the decision has been made and is in effect.
- **Superseded** — the decision has been replaced by a later ADR. The original ADR is never deleted; it is marked `Superseded by ADR-NNN` and the superseding ADR is linked.
- **Deprecated** — the decision is no longer relevant (e.g. the feature it governed was removed), but the record is preserved for historical context.

ADRs are never deleted, amended retroactively, or overwritten. Corrections and updates are recorded as new ADRs.

---

## Current Documents

| Document | Description |
|---|---|
| *(No formal ADR files yet)* | *ADRs will be written as decisions are formally recorded. See the candidates list below.* |

---

## Historical Decisions (ADR-001 through ADR-020)

The following decisions were recorded in oldmd/DECISIONS.md before the ADR folder system was established. They are preserved here as a historical record. They should be extracted into individual ADR files in this folder when time permits.

### ADR-001 — Separate Projects

**Choice:** Three separate projects (api / web / pos_m)
**Reason:** Each project has independent deployment, different tech stack, and future team separation.
**Rejected:** Single monorepo.

### ADR-002 — Progressive Refactor

**Choice:** Gradual migration from V1.01 → V1.02
**Reason:** Preserves business logic, DB knowledge, and operational experience.
**Rejected:** Complete rewrite from scratch.

### ADR-003 — TenantContext Pattern

**Choice:** `TenantContext` class injected into every request.
**Reason:** Guarantees tenant isolation in every query automatically.
**Rejected:** Manual `tenant_id` passing in every function.

### ADR-004 — Permission System

**Choice:** `resource.action.scope` (not role-based only)
**Reason:** Greater flexibility, granular control, supports custom permissions.
**Example:** `invoice.cancel.branch` instead of `isManager()`

### ADR-005 — Feature Flags Architecture

**Choice:** 3 tables (`features` + `plan_features` + `tenant_feature_overrides`)
**Reason:** SuperAdmin can change features without code changes.
**Rejected:** Hardcoded feature checks.

### ADR-006 — JWT Strategy

**Choice:** Access token (15 min) + Refresh Token Rotation (7 days)
**Reason:** Better security than long-lived tokens.
**Rejected:** Single long-lived JWT.

### ADR-007 — Audit Engine

**Choice:** `@Audit()` decorator + `AuditInterceptor`
**Reason:** Does not require modifying every service — works automatically.
**Record contains:** before + after + actor + ip + device + timestamp.

### ADR-008 — Mobile Offline-First

**Choice:** SQLite local DB + Sync Engine
**Reason:** POS must work without internet.
**Rejected:** Online-only POS.

### ADR-009 — State Management (web)

**Choice:** Zustand (UI state) + TanStack Query (server state)
**Reason:** Clear separation between UI state and server state.
**Rejected:** Redux, Context for data.

### ADR-010 — Forms (web)

**Choice:** react-hook-form + zod
**Reason:** Performance + type safety + unified validation.
**Rejected:** `useState` for forms.

### ADR-011 — API Architecture (web)

**Choice:** All API calls in `features/*/api/` only.
**Reason:** Clear separation, easier testing, no duplication.
**Rejected:** Direct fetch in components.

### ADR-012 — i18n (web)

**Choice:** next-intl
**Reason:** Built-in Next.js App Router + Server Components integration.
**Rejected:** react-i18next.

### ADR-013 — SuperAdmin Theme (Updated June 25, 2026)

**Original choice (now rejected):** Fixed dark navy — "SuperAdmin is you only — no need for light/dark toggle."
**New decision:** A real Light/Dark toggle matching the tenant dashboard 100% (same `useThemeStore` mechanism + `dark:` class).
**Reason:** Explicit user request — two alternative approaches were rejected (Chrome-only, permanent dark lock) before the correct full implementation. The original dark colors (bg `#0f1117`, sidebar `#141720`, border `#1e2130`) were preserved as `dark:` variant values — not deleted, only a light mode peer was added to all 29 files. See STATUS.md §41.

### ADR-014 — Database

**Choice:** Supabase PostgreSQL
**Reason:** Already present in V1.01, RLS, realtime, integrated storage.
**Rejected:** Changing the database in V1.02.

### ADR-015 — Soft Delete

**Choice:** Soft delete for all sensitive data.
**Reason:** Audit trail + recovery + regulatory compliance.
**Implementation:** `deleted_at` column in every important table.

### ADR-016 — Multi-tenancy and Isolation Strategy

**Choice:** Shared DB + `tenant_id` on every query.
**Reason:** `ScopedRepository` applies isolation automatically — no manual filtering in every service.
**Rejected:** Separate DB per tenant (high cost at this stage).

### ADR-017 — Data Ownership

**Choice:** All business entities linked to `tenant_id`.
**Reason:** No shared business data between tenants — each tenant sees only their own data.
**Implementation:** Every table has `tenant_id` as mandatory FK.

### ADR-018 — API Versioning

**Choice:** `/api/v1` global prefix.
**Reason:** Enables future backward compatibility when adding `/api/v2`.
**Rejected:** Versioning without prefix (makes migration harder later).

### ADR-019 — Staging Environment Deletion (June 25, 2026)

**Choice:** Delete the `sefay-api-staging-production` service entirely (git branch + CI workflow + Railway service).
**Reason:** Phase 9F audit revealed it was effectively abandoned (branch 16 days behind `main`) **and was sharing the same production Supabase DB** — it was never a real isolation environment, only a risk with no actual benefit.
**Rejected:** Separating it to an independent Supabase project — rejected because it was not actively used, not worth the investment; if staging is needed in the future, it must start from a fully separate DB project from day one.
**See:** STATUS.md §35 and RUNBOOK.md.

### ADR-020 — Multiple Payment Methods Without Real Integration (June 25, 2026)

**Choice:** Expand `orders.payment_method` column (DB + DTO) to accept `mada/visa/mastercard/stc_pay/apple_pay/tab` as label values only, without building any real payment gateway integration (Moyasar/Tap) or modifying the cashier UI.
**Reason:** Explicit user request — "deferred but prepare for future integration." Reports (`by_payment_method`) are already dynamic and accept the new values without any additional code — confirmed by live production testing.
**Rejected:** Pre-building a `PaymentProvider` interface for Moyasar/Tap — rejected as premature abstraction before knowing the actual shape of each gateway's API.

---

## Decisions Already Made — Candidates for ADR Write-Ups (mewmd era)

Several significant architectural decisions have been made during recent development whose reasoning is currently embedded in `TASKS.md` and `STATUS.md`. These should be extracted into formal ADRs:

### Portal Rendering for Date Pickers and Modals

**Decision:** All popups, modals, and date pickers are rendered through `createPortal(..., document.body)` rather than inline in the component tree.

**Reasoning captured in:** `TASKS.md` (Date-Range Picker Redesign follow-up, reverted to full calendar-grid popup with portal positioning).

**Key alternatives considered:** inline absolute/fixed positioning using CSS direction-relative offsets (`left-0`/`right-0` for LTR/RTL), which was the prior approach before the portal rewrite.

**Why it matters:** this decision affects every popup and modal in the application. Understanding why portals were adopted (overflow clipping in scrollable containers, stacking context conflicts, RTL offset bugs) prevents future engineers from introducing inline-positioned popups that re-introduce those bugs.

---

### `StorageProvider` Abstraction Before Phase 9

**Decision:** A `StorageProvider` interface and adapter layer (Phase 11) must be established before or alongside Phase 9 (Company Branding), not after, to prevent the accumulation of direct Supabase Storage SDK calls that would need to be refactored later.

**Reasoning captured in:** `TASKS.md` Phase 11 ("Why now" section).

**Key trade-off:** Phase 11 requires engineering time before Phase 9 produces user-visible value. The cost of not doing it first is higher long-term.

---

### Shared LLM Provider (Not Per-Feature)

**Decision:** A single shared `AIProvider` interface and adapter is established for the platform. Phase 4 and Phase 8 both use it — they do not implement their own LLM integrations.

**Reasoning captured in:** `TASKS.md` Phase 4 (AI-assisted Product Creation) and Phase 8 (AI Features), which both note "shares its provider/config plumbing."

**Key trade-off:** requires up-front interface design before either AI feature is built. Prevents provider fragmentation and privacy-rule inconsistency across features.

---

### `createPortal` vs Inline Positioning for Date Picker Popups

**Decision:** `createPortal` was chosen over inline positioning after the inline approach produced two confirmed bugs: (1) popup clipping inside `overflow-hidden`/`overflow-y-auto` container ancestors; (2) RTL/LTR `left-0`/`right-0` offset class math pushing the panel off-screen.

**Reasoning captured in:** `TASKS.md` (Date-Range Picker follow-up) and STATUS.md §48.

---

### Native `<input type="date">` Prohibition

**Decision:** Raw `<input type="date">` elements are prohibited in application code. All date fields must use `SingleDatePicker` or `DateRangePicker`.

**Reasoning captured in:** `TASKS.md` (RTL native date-input bug follow-up) and `docs/architecture/engineering-principles.md`.

**Why it matters:** the RTL rendering bug was found and fixed in shared components after appearing in three different feature files. The standing rule prevents it from reappearing in any future feature.
