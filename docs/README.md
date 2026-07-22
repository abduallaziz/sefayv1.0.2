# docs/ — Sefay ERP Documentation System

This folder is the single authoritative home for all technical documentation for the Sefay ERP platform. It is designed to scale alongside the codebase: new documents are added as features are planned, decisions are made, and architecture evolves. The folder is not a snapshot — it is a living system.

---

## Overview

Every significant technical decision, architectural pattern, planned initiative, and cross-cutting specification for Sefay is recorded here. The goal is to ensure that:

- Any engineer joining the project can understand the current and planned design without reading all source code.
- Reasoning for past decisions is preserved and never lost.
- Future planning documents are written before implementation begins, not after.
- Documents remain synchronized with the codebase as it evolves.

This folder is referenced from `TASKS.md` and `STATUS.md` for deeper context on individual features. It does not replace those files — it extends them.

---

## Platform Summary

**Sefay** is a multi-tenant SaaS POS/ERP platform targeting Arabic-speaking businesses in the GCC/Saudi market. It enables small-to-medium businesses across 37 granular activity types (retail, restaurants, services, healthcare, fashion, electronics, home goods, beauty) to manage sales, inventory, expenses, shifts, customers, and subscriptions from a single platform.

**Infrastructure:**
- API: NestJS + TypeScript on Railway
- Frontend: Next.js (15/16.x) + Tailwind v3 on Vercel
- Database: Supabase PostgreSQL (32+ migrations, direct client — no Supabase Auth in backend)
- Queue: BullMQ + Redis
- Payments: Stripe (production) + Mock Provider (development)
- Email: Resend (optional — mock fallback if RESEND_API_KEY unset)

**Multi-tenancy:** Shared database + `tenant_id` isolation via ScopedRepository pattern.

**Auth:** JWT 15min access token + Refresh Token Rotation 7d, RBAC `resource.action.scope`.

---

## Folder Structure

```
docs/
├── README.md                    ← this file
├── architecture/                ← current and planned system design
├── future/                      ← future initiative specifications
├── specifications/              ← cross-cutting technical specifications
├── roadmap/                     ← deeper roadmap research and planning
├── decisions/                   ← Architecture Decision Records (ADRs)
├── reference/                   ← glossary, data dictionaries, lookup tables
└── legacy-analysis/             ← historical audit and coverage documents from V1.02
```

### `architecture/`

Living documents describing the current (and planned) design of the system — frontend, backend, database, security, storage, AI, API conventions, permissions, and multi-tenancy. These documents describe how things work today and how they are expected to evolve. See [`architecture/README.md`](./architecture/README.md).

### `future/`

Standalone specification documents for future engineering initiatives that do not yet have an active implementation phase. Each document follows a standard template: motivation, proposed design, open questions, and implementation order. These are engineering proposals, not commitments. See [`future/README.md`](./future/README.md).

### `specifications/`

Technical specifications for shared components, APIs, and subsystems that cut across multiple features and modules. Distinct from `future/` (which covers whole initiatives) and `architecture/` (which describes the overall design). See [`specifications/README.md`](./specifications/README.md).

### `roadmap/`

Deeper roadmap research and planning documents, including phase dependency analysis, sequencing rationale, and effort sizing notes. The high-level roadmap lives in `TASKS.md`; the current state of in-progress work lives in `STATUS.md`. This folder holds the deeper research that informs those files. See [`roadmap/README.md`](./roadmap/README.md).

### `decisions/`

Architecture Decision Records (ADRs). Each ADR documents one significant technical decision with its full context: the problem, the options considered, the decision made, and its consequences. ADRs are never deleted or amended retroactively — corrections are added as new ADRs. See [`decisions/README.md`](./decisions/README.md).

### `reference/`

Reference material: glossary of domain terms, data dictionaries, API references, integration guides, and lookup tables. See [`reference/README.md`](./reference/README.md).

### `legacy-analysis/`

Historical audit and coverage documents generated during V1.02 schema analysis and zero-code-change evaluation. These documents are preserved as-is for archaeological context. They describe the state of the codebase at a specific point in time (2026-06-05) and should not be used as a current reference for schema or code correctness. See [`legacy-analysis/`](./legacy-analysis/).

---

## Documentation Policy

These rules apply to every document in this folder without exception.

### Never Delete History

History is only appended, never removed. If a design was superseded, note what replaced it and why, then keep the original text. Future engineers need to understand why the current approach was chosen over what came before.

### Always Append

When a document needs to be updated, add a dated section or a note rather than overwriting the original content. The full evolution of a design decision should be readable in one document without needing git blame.

### Preserve Reasoning

A document that records only the outcome without the reasoning is nearly useless. Always capture: what problem was being solved, what alternatives were considered, and why this specific approach was chosen.

### Use References Instead of Copying

When a concept described in one document is needed in another, link to the source document with an explicit section anchor. Do not copy and paste — copies drift and become contradictory. The canonical definition lives in one place.

### Keep Synchronized

When source code, `TASKS.md`, or `STATUS.md` changes in a way that affects a document in this folder, the document must be updated in the same session (or at minimum in the same pull request). A document that describes a state that no longer exists is actively harmful.

---

## How to Add Documentation

1. Identify the appropriate subfolder using the descriptions above.
2. Create a new Markdown file using the naming convention `kebab-case.md`.
3. Begin with an `# H1` title and an Overview section that explains what the document covers and why it exists.
4. Add a dated `## Added YYYY-MM-DD` header to mark when the document was first written.
5. Add the file to the `README.md` of its containing subfolder.
6. If the document is relevant to a task in `TASKS.md`, add a reference line at the bottom of that task's entry: `See: docs/<path>`.

---

## How to Reference Docs from TASKS.md and STATUS.md

When a task or status entry has a deeper specification or architecture document:

```markdown
<!-- In TASKS.md -->
### Phase 11 — Storage Abstraction
...
See: [docs/architecture/storage-abstraction.md](./docs/architecture/storage-abstraction.md)

<!-- In STATUS.md -->
| Phase 11 — Storage Abstraction | Planned | See: docs/architecture/storage-abstraction.md |
```

Use relative paths from the project root so links resolve correctly in both GitHub and local editors. Do not use absolute filesystem paths.
