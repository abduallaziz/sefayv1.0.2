# architecture/ — Living Architecture Documents

This folder holds living architecture documents for the Sefay ERP platform. Each document describes the current design of a system layer and how it is expected to evolve. These are not static snapshots — they are updated as the system changes.

Architecture documents describe how the system works today and what principles guide its future development. They do not contain implementation-specific code, but may include TypeScript interface definitions where the interface itself is the architecture contract.

For implementation planning and feature-level acceptance criteria, see `TASKS.md`. For current completion status, see `STATUS.md`. For future initiative specifications not yet in active development, see [`../future/`](../future/README.md).

---

## Documents in This Folder

| Document | Description |
|---|---|
| [engineering-principles.md](./engineering-principles.md) | Core engineering principles, code quality standards, testing pipeline, git workflow, security, performance, accessibility, and internationalization rules that apply across all development on the platform. |
| [frontend-architecture.md](./frontend-architecture.md) | Next.js 16.2.6 App Router + React 19 frontend design: folder structure, shared UI components, routing, state management, portal rendering, RTL/LTR handling, responsive design, and component rules. |
| [backend-architecture.md](./backend-architecture.md) | Backend design: Supabase as primary provider, service layer pattern, API design, authentication, storage, multi-tenancy, error handling, logging, and future considerations. |
| [database-architecture.md](./database-architecture.md) | Supabase/PostgreSQL data model: multi-tenant scoping, core entity catalogue, proposed schema additions (product_barcodes), available/reserved/on-hand split, audit trail, migration strategy, and indexes. |
| [security-architecture.md](./security-architecture.md) | Authentication (Supabase Auth/JWT), role-based authorization, Row-Level Security, API security, storage security, input validation, XSS/CSRF prevention, audit trail, and compliance considerations. |
| [storage-abstraction.md](./storage-abstraction.md) | The `StorageProvider` interface: provider adapters (Supabase, S3, MinIO, Local), tenant-aware paths, signed URLs, image optimization, asset versioning, soft delete, and zero-downtime provider migration. |
| [ai-architecture.md](./ai-architecture.md) | Shared LLM provider integration design: AIProvider interface, data privacy rules, planned AI features (Phase 4 and Phase 8), natural language query architecture, and future AI copilot platform direction. |
| [api-design.md](./api-design.md) | RESTful conventions, versioning, request/response and error formats, authentication headers, pagination, filtering/sorting, tenant isolation, rate limiting, and future public API/webhook considerations. |
| [permission-system.md](./permission-system.md) | Current roles (Owner, Admin, Employee, Cashier), role capability matrix, frontend and backend enforcement, known gaps from the Phase 2 audit, factory reset permission, and future granular permission model. |
| [tenant-architecture.md](./tenant-architecture.md) | Single-database multi-tenancy via `company_id`, tenant isolation rules, provisioning flow, current and planned tenant settings, factory reset, storage isolation, and future multi-company financial consolidation. |
