# architecture/ — System Design Documents

This folder contains living documents describing the current and planned design of the Sefay ERP platform. These documents describe how things work today and how they are expected to evolve.

---

## Documents

| Document | Description |
|---|---|
| [`backend-architecture.md`](./backend-architecture.md) | NestJS application server, request pipeline, guard order, engines layer, BullMQ queues, metrics, and observability. |
| [`frontend-architecture.md`](./frontend-architecture.md) | Next.js App Router, folder structure, shared UI components, portal rendering, RTL/LTR handling, and responsive design. |
| [`database-architecture.md`](./database-architecture.md) | PostgreSQL schema design, multi-tenant scoping, entity catalogue, migration strategy, and V2 schema specification. |
| [`security-architecture.md`](./security-architecture.md) | Authentication, authorization, Row-Level Security, API security, storage security, audit trail, and compliance notes. |
| [`engineering-principles.md`](./engineering-principles.md) | Code quality, shared-component rules, testing pipeline, Git workflow, security principles, accessibility, and i18n. |
| [`permission-system.md`](./permission-system.md) | RBAC roles, capability matrix, enforcement layers, known gaps, and future granular permission expansion. |
| [`tenant-architecture.md`](./tenant-architecture.md) | Multi-tenancy model, isolation rules, provisioning flow, tenant settings, storage isolation, and factory reset design. |
| [`storage-abstraction.md`](./storage-abstraction.md) | `StorageProvider` interface, provider adapters (Supabase, S3, MinIO, Local), signed URLs, asset versioning, and soft delete. |
| [`api-design.md`](./api-design.md) | RESTful conventions, versioning strategy, request/response format, error format, pagination, filtering, sorting, and rate limiting. |
| [`ai-architecture.md`](./ai-architecture.md) | Shared `AIProvider` interface, data privacy rules, Phase 4 product-creation AI, Phase 8 inventory assistant, natural language query architecture. |
| [`design-system.md`](./design-system.md) | Brand color, typography, CSS variable system, component token standards, topbar/sidebar styles, and design rules. |
| [`workflows.md`](./workflows.md) | Cross-module business workflows: billing/dunning, notification, feature flag resolution, approval, and POS invoice flow. |
