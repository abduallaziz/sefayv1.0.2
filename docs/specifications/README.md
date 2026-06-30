# specifications/ — Cross-Cutting Technical Specifications

This folder holds technical specifications for shared components, APIs, subsystems, and patterns that cut across multiple features and modules within the Sefay ERP platform.

---

## What Belongs Here

A document belongs in `specifications/` when:

- It specifies a component, pattern, or subsystem that is **used by more than one feature module**.
- It is more detailed than an architecture document (which describes overall design) but is not a future initiative (which describes a not-yet-scheduled capability).
- It would be referenced by engineers implementing multiple different features, not just one.

Examples of what belongs here:
- The specification for a shared UI component (e.g. the complete behavior contract for the `ConfirmDialog` or the `useFloatingPosition` hook).
- The specification for a cross-cutting API pattern (e.g. exactly how pagination query parameters work, what filter naming conventions look like).
- The specification for a data pattern used across many tables (e.g. the exact structure and lifecycle of the audit trail).
- Integration contracts between subsystems (e.g. exactly how the `StorageProvider` integrates with the Document and Print Designer's template rendering pipeline).

---

## How `specifications/` Differs from the Other Folders

| Folder | Contents |
|---|---|
| `docs/architecture/` | Current and planned **overall system design** — describes the shape and principles of entire layers (frontend, backend, database, security). |
| `docs/future/` | Specifications for **future initiatives** that are not yet in active development — motivated proposals for whole new capability areas. |
| `docs/specifications/` | **Detailed technical specifications** for specific shared components, patterns, and subsystems that are currently in use or actively being built. |
| `docs/decisions/` | **Architecture Decision Records** — documents that capture a single significant decision, its context, and its consequences. |

The distinction between `specifications/` and `architecture/` is one of scope and detail. An architecture document describes the overall frontend design; a specification document describes exactly how a specific shared component within that frontend must behave. An architecture document may reference a specification document for the detailed contract.

---

## Current Documents

| Document | Description |
|---|---|
| *(No documents yet)* | *This folder is newly created. Specifications will be added as shared components and patterns are formalized.* |

---

## Candidates for Specification Documents

The following shared components and patterns are currently implemented in the codebase and are candidates for formal specification documents in this folder:

| Candidate | Notes |
|---|---|
| `useFloatingPosition` hook | Specifies the exact positioning algorithm, viewport clamping behavior, flip-above-trigger logic, and update timing. |
| `ConfirmDialog` component | Complete behavior contract: `danger`/`warning` variants, ESC-to-close semantics, scroll-lock behavior, loading state, `ReactNode` message slot. |
| `StatusBadge` component | Tone system definition, mapping convention between feature status values and tones, rendering contract. |
| Pagination query parameter contract | Exact parameter names, defaults, validation rules, and response `meta` shape for all list endpoints. |
| Audit trail pattern | Exact schema, insert rules, retention policy, and how movement rows relate to business event types. |
| CSV export pattern | The `exportToCsv` utility's API, column mapping conventions, and file naming rules. |

When any of these is formalized, create a new Markdown file in this folder using kebab-case naming (e.g. `use-floating-position.md`) and add it to the table above.
