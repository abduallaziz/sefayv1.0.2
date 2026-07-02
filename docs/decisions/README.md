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
| *(No formal ADRs yet)* | *This folder is newly created. ADRs will be written as decisions are formally recorded.* |

---

## Decisions Already Made — Candidates for ADR Write-Ups

Several significant architectural decisions have already been made during the course of development. Their reasoning is currently embedded in `TASKS.md` completion notes and `STATUS.md` history. These should be extracted into formal ADRs:

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

**Reasoning captured in:** `TASKS.md` (Date-Range Picker follow-up, "reverted to full calendar-grid popup with portal positioning").

**Note:** this is closely related to the broader "Portal Rendering" ADR candidate above but is specifically about the date picker component's positioning mechanism and the `useFloatingPosition` hook design.

---

### Native `<input type="date">` Prohibition

**Decision:** Raw `<input type="date">` elements are prohibited in application code. All date fields must use `SingleDatePicker` or `DateRangePicker`.

**Reasoning captured in:** `TASKS.md` (RTL native date-input bug follow-up) and `docs/architecture/engineering-principles.md`.

**Why it matters:** the RTL rendering bug was found and fixed in shared components after appearing in three different feature files. The standing rule prevents it from reappearing in any future feature.
