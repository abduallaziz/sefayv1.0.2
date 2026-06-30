# roadmap/ — Roadmap Planning Documents

This folder holds deeper roadmap research, planning documents, phase dependency analysis, sequencing rationale, and effort-sizing notes for the Sefay ERP platform.

---

## The Active Roadmap Lives Elsewhere

The **current active roadmap** is maintained in two files at the project root:

- **`TASKS.md`** — detailed specifications for each planned phase, including acceptance criteria, open questions, and implementation notes. This is the primary reference for what to build and how.
- **`STATUS.md`** — a concise table of the current completion status for each feature and phase. This is the primary reference for where things stand right now.

This `roadmap/` folder does **not** replace or duplicate those files. It extends them with research and analysis that is too detailed or too long-lived to live inside `TASKS.md` comfortably.

---

## What Belongs Here

A document belongs in `roadmap/` when:

- It provides **dependency analysis** between phases — explaining why phases must be sequenced in a particular order and what the consequences of reordering would be.
- It provides **effort sizing or scope estimation** for a phase or group of phases.
- It provides **alternatives analysis** for how a phase could be approached, where the chosen approach is recorded in an ADR in `docs/decisions/` and the supporting research lives here.
- It provides **market or product context** for a roadmap decision — e.g. why a particular capability is higher priority than alternatives given the GCC/Saudi market context.
- It documents **retrospective notes** from a completed phase — what was harder or easier than expected, what should be done differently in subsequent phases.

---

## What Does Not Belong Here

- Phase specifications (use `TASKS.md`).
- Current status (use `STATUS.md`).
- Architecture of what was built (use `docs/architecture/`).
- Future initiative specifications (use `docs/future/`).

---

## Current Documents

| Document | Description |
|---|---|
| *(No documents yet)* | *This folder is newly created. Planning documents will be added as phases are analyzed and retrospected.* |

---

## Phase Dependency Summary

For reference, the current phase ordering in `TASKS.md` and the key dependency relationships between them:

| Phase | Depends On |
|---|---|
| Phase 3 — Barcode & Scanning | Phase 2 (Inventory UX production-readiness foundation) |
| Phase 4 — Smart Product Creation | Phase 3 (Unknown Barcode Assistant is the trigger surface) |
| Phase 5 — Inventory Intelligence | Phase 2 (Movements ledger data quality), Phase 3 (barcode data enriching the product model) |
| Phase 6 — Warehouse Management | Phase 5 (on-hand/reserved/available split as the data model foundation for reservation management) |
| Phase 7 — Productivity | Phase 2 (stable Inventory UX to build quick actions and bulk actions on top of) |
| Phase 8 — AI Features | Phase 4 (shared LLM provider integration established), Phase 5 (computed metrics consumed by AI recommendations) |
| Phase 9 — Company Branding & Information | Phase 11 (StorageProvider abstraction must be in place before first binary asset uploads) |
| Phase 10 — Document & Print Designer | Phase 9 (company information fields as template variables), Phase 3 (barcode/QR rendering for label templates) |
| Phase 11 — Storage Abstraction | Must land alongside or before Phase 9 |

This summary is maintained here as a quick-reference. The authoritative dependency reasoning for each phase is in `TASKS.md`.
