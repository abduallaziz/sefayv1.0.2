# future/ — Future Initiative Specifications

This folder holds specification documents for future engineering initiatives: capabilities that are envisioned for the Sefay platform but are not yet in active development and do not have a confirmed implementation phase in `TASKS.md`.

---

## What Belongs Here

A document belongs in `future/` when:

- The initiative represents a significant capability area that requires its own dedicated specification.
- It is not yet assigned to an active implementation phase in `TASKS.md`.
- It is complex enough that thinking through it now (motivation, proposed design, open questions, dependencies) will save substantial time when it is eventually scoped.

Documents in this folder are **engineering proposals, not implementation commitments**. They represent the current best thinking about a future initiative, but they may change significantly — or be abandoned entirely — as requirements evolve. They should never be treated as approved specifications until they have been reviewed, a phase has been assigned in `TASKS.md`, and implementation has begun.

---

## What Does Not Belong Here

- Active phases (use `TASKS.md`).
- Current system design (use `docs/architecture/`).
- Cross-cutting technical specifications for existing subsystems (use `docs/specifications/`).
- Reference material (use `docs/reference/`).

---

## Document Template

Each future initiative document follows this standard structure:

```markdown
# [Initiative Name]

*Status: Proposed — not yet scheduled*
*Added: YYYY-MM-DD*

## Overview and Motivation

[Why does this initiative matter? What problem does it solve?]

## Proposed Design

[High-level technical approach. Not a complete spec — enough to evaluate feasibility and dependencies.]

## Dependencies

[What must exist before this initiative can begin? Reference other phases, architecture docs, or ADRs.]

## Open Questions

[Unresolved design decisions that must be answered before implementation begins.]

## Implementation Order

[Suggested sequencing of sub-tasks within the initiative, if known.]

## References

[Links to related TASKS.md phases, architecture docs, or ADRs.]
```

---

## Current Documents

| Document | Description |
|---|---|
| *(No documents yet)* | *This folder is newly created. Documents will be added as future initiatives are specified.* |

---

## Candidates for Future Documents

The following initiatives are referenced in `TASKS.md` and `docs/architecture/` as future considerations but do not yet have standalone specification documents in this folder. They are noted here so they are not lost:

| Initiative | Referenced In |
|---|---|
| Advanced Accounting (journal entries, ledger, financial consolidation, AI finance) | `docs/architecture/database-architecture.md`, `docs/architecture/ai-architecture.md`, `docs/architecture/tenant-architecture.md` |
| Integration Platform (public API, webhooks, third-party e-commerce/ERP connectors) | `docs/architecture/api-design.md` |
| Template Marketplace (Phase 10 follow-on — community/Sefay-provided document templates) | `TASKS.md` Phase 10 |
| AI Copilot Platform (cross-module AI assistant, voice input, anomaly detection) | `docs/architecture/ai-architecture.md` |
| Multi-Company / Financial Consolidation | `docs/architecture/tenant-architecture.md` |

When any of these initiatives is ready to be specified, create a new document in this folder using the template above and add it to the table in this README.
