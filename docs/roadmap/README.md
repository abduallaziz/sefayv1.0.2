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
| `master-roadmap.md` | The single authoritative long-term vision for the Sefay ERP platform. Covers all planned phases, future initiatives, platform services, infrastructure investments, enterprise features, and the complete dependency map. This is the stable reference that prevents the roadmap from re-expanding in every session. |

---

## Phase Dependency Summary

> ⚠️ **Numbering disclaimer (added 2026-07-03):** the "Phase" numbers below are `master-roadmap.md`'s own roadmap-only numbering for future business features that are **not yet scheduled into `TASKS.md`**. They do not correspond to `TASKS.md`'s actual phase headers (which are `PHASE A`–`D`, then `9`–`15`, meaning different things — e.g. `TASKS.md`'s real `PHASE 11` is Mobile POS, not Storage Abstraction, and its real `PHASE 15` is Storage Infrastructure & Abstraction). See the disclaimer in `master-roadmap.md` Part 1 for the full explanation. This table describes dependency relationships *among these planned roadmap items*, not a current `TASKS.md` state.

| Roadmap Item | Depends On (same roadmap-only numbering) |
|---|---|
| Barcode & Scanning | Inventory UX Production-Readiness |
| Smart Product Creation | Barcode & Scanning (Unknown Barcode Assistant is the trigger surface) |
| Inventory Intelligence | Inventory UX (movements ledger data quality), Barcode & Scanning (barcode data enriching the product model) |
| Warehouse Management | Inventory Intelligence (on-hand/reserved/available split as the data model foundation for reservation management) |
| Productivity | Inventory UX (stable foundation to build quick actions and bulk actions on top of) |
| AI Features | Smart Product Creation (shared LLM provider integration established), Inventory Intelligence (computed metrics consumed by AI recommendations) |
| Company Branding & Information | Storage Abstraction (StorageProvider abstraction must be in place before first binary asset uploads) |
| Document & Print Designer | Company Branding (company information fields as template variables), Barcode & Scanning (barcode/QR rendering for label templates) |
| Storage Abstraction | Must land alongside or before Company Branding |

This summary is maintained here as a quick-reference for the roadmap's own sequencing. The authoritative *implemented and scheduled* phase reasoning is in `TASKS.md`, under its own separate numbering.
