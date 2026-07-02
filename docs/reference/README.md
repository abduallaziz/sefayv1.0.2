# reference/ — Reference Material

This folder holds reference material for the Sefay ERP platform: glossaries of domain terms, data dictionaries, API references, integration guides, lookup tables, and other material that engineers and product stakeholders look up during development rather than read front-to-back.

---

## What Belongs Here

Reference material is **looked up, not read**. A document belongs in `reference/` when:

- It defines the authoritative meaning of domain terms used across the codebase, in `TASKS.md`, in `STATUS.md`, and in conversation (use a **glossary**).
- It catalogs the fields, types, and constraints of data entities in a format that is easier to scan than reading the database migration scripts (use a **data dictionary**).
- It documents the complete interface of an internal or external API in a format consumable by engineers integrating with it (use an **API reference**).
- It provides step-by-step instructions for integrating Sefay with a specific external system (use an **integration guide**).
- It provides structured lookup tables: status transitions, error codes, supported file formats, locales, currencies, country codes, or similar enumerated data (use a **lookup table**).

---

## What Does Not Belong Here

- Design rationale and architectural decisions (use `docs/architecture/` and `docs/decisions/`).
- Future initiative specifications (use `docs/future/`).
- Active implementation tasks (use `TASKS.md`).
- Cross-cutting technical specifications (use `docs/specifications/`).

---

## Current Documents

| Document | Description |
|---|---|
| *(No documents yet)* | *This folder is newly created. Reference documents will be added as the platform matures and the need for lookup material grows.* |

---

## Candidates for Reference Documents

The following reference documents would be valuable additions to this folder:

### Glossary

A glossary of domain terms used in the Sefay ERP, particularly terms from the Saudi/GCC business context that may not be self-evident to all engineers. Examples of terms to include:

- **Company / Tenant** — the distinction between the Sefay platform and a company using it.
- **Owner / Admin / Employee / Cashier** — the four roles and their colloquial meanings in practice.
- **Goods Receipt** — the physical receipt of purchased goods into a warehouse, creating a stock increase movement.
- **Transfer** — a movement of stock between two locations or warehouses within the same company.
- **Stock Count** — a physical inventory audit where counted quantities are compared against system quantities.
- **Adjustment** — a manual correction to a stock level with an explicit reason code.
- **Movement** — any event that changes a stock level (receipt, transfer, adjustment, sale, return). All movements are recorded in the immutable movements ledger.
- **ZATCA** — Zakat, Tax and Customs Authority (Saudi Arabia). Governs e-invoicing compliance requirements.
- **VAT** — Value Added Tax. The Saudi standard rate is 15%.
- **GS1** — the international organization that administers barcode standards (EAN-13, GS1-128, GS1 DataMatrix).
- **RLS** — Row-Level Security, the PostgreSQL mechanism used to enforce tenant isolation in Supabase.
- **StorageProvider** — the interface abstraction that decouples asset storage from any specific provider.
- **AIProvider** — the interface abstraction that decouples AI feature calls from any specific LLM provider.

### Data Dictionary

Field-level definitions for each core entity: type, constraints, whether nullable, what values are valid, and what the field means in business terms. Particularly useful for fields whose names are ambiguous or whose valid values are restricted enumerations (e.g. purchase order `status` values and the allowed transitions between them).

### API Reference (Internal)

A complete reference for all internal API endpoints: URL, method, request parameters, request body schema, response body schema, error codes, and authentication requirements. Generated from the route definitions or maintained manually.

### API Reference (Public — Future)

Once the public API is introduced (see [`docs/architecture/api-design.md`](../architecture/api-design.md#future-public-api--webhooks)), a public API reference document will be maintained here for external integrators.

### Integration Guide: ZATCA e-Invoicing

Step-by-step guidance for the ZATCA Phase 2 (integration phase) e-invoicing requirements: QR code generation, API submission, error handling, and testing against the ZATCA sandbox environment.

### Error Code Reference

A lookup table of all machine-readable error codes (`code` field in error responses) used across the API, with their meaning, typical cause, and recommended client handling.

### Supported Currencies and Locales

A lookup table of currencies and locales supported by Sefay, including their ISO codes, display symbols, decimal conventions, and right-to-left display considerations.
