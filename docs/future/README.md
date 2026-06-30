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
| `advanced-accounting.md` | Full specification for native double-entry accounting, ZATCA compliance, financial reporting, and the Posting Engine |
| `saas-licensing-platform.md` | SaaS licensing infrastructure: extended plan limits, usage metering, tenant self-service billing portal, coupons, subscription analytics. Documents what already exists in the SuperAdmin layer and what is still missing. |
| `marketplace-extension-platform.md` | Marketplace & Extension Platform: installable modules, integrations, themes, report/document templates, AI plugins. Extension SDK, manifest format, developer portal, governance model. |

---

## Planned Initiative Documents (To Be Created)

The following initiatives are confirmed in `docs/roadmap/master-roadmap.md` but do not yet have standalone specification documents. Each needs a `docs/future/` document written before implementation begins.

| Initiative | Referenced In |
|---|---|
| Advanced Accounting (full spec exists) | `docs/future/advanced-accounting.md` ✓ |
| SaaS Licensing Platform (full spec exists) | `docs/future/saas-licensing-platform.md` ✓ |
| Marketplace & Extension Platform (full spec exists) | `docs/future/marketplace-extension-platform.md` ✓ |
| Public API & Developer Platform | `docs/architecture/api-design.md`, `docs/roadmap/master-roadmap.md` |
| Webhook Delivery System | `docs/architecture/api-design.md`, `docs/roadmap/master-roadmap.md` |
| Notification Center | `docs/roadmap/master-roadmap.md` |
| Approval Workflow Engine | `docs/roadmap/master-roadmap.md` |
| Automation Rules Engine | `docs/roadmap/master-roadmap.md` |
| Task & Reminder System | `docs/roadmap/master-roadmap.md` |
| CRM Module | `docs/roadmap/master-roadmap.md` |
| HR & Payroll Module | `docs/future/advanced-accounting.md` (payroll posting scope), `docs/roadmap/master-roadmap.md` |
| Manufacturing & MRP Module | `docs/roadmap/master-roadmap.md` |
| Quality Control Module | `docs/roadmap/master-roadmap.md` |
| Project Management Module | `docs/roadmap/master-roadmap.md` |
| Field Service & Maintenance | `docs/roadmap/master-roadmap.md` |
| Subscription & Recurring Billing | `docs/roadmap/master-roadmap.md` |
| Multi-Branch Management | `docs/architecture/permission-system.md`, `docs/roadmap/master-roadmap.md` |
| Fleet Management | `docs/roadmap/master-roadmap.md` |
| Payment Gateway Integration | `docs/roadmap/master-roadmap.md` |
| E-commerce Integration Platform | `docs/roadmap/master-roadmap.md` |
| WhatsApp Business Integration | `docs/roadmap/master-roadmap.md` |
| ZATCA Phase 2 Integration | `docs/architecture/security-architecture.md`, `docs/roadmap/master-roadmap.md` |
| Accounting Software Bridge (QuickBooks/Xero) | `docs/roadmap/master-roadmap.md` |
| Progressive Web App (PWA) | `docs/roadmap/master-roadmap.md` |
| Native Mobile App (React Native) | `docs/roadmap/master-roadmap.md` |
| Custom Report Builder | `docs/roadmap/master-roadmap.md` |
| Executive KPI Dashboard | `docs/roadmap/master-roadmap.md` |
| Sales Analytics | `docs/roadmap/master-roadmap.md` |
| 2FA, SSO & Password Policy | `docs/architecture/security-architecture.md`, `docs/roadmap/master-roadmap.md` |
| Granular Permissions & Custom Roles | `docs/architecture/permission-system.md`, `docs/roadmap/master-roadmap.md` |
| Multi-Company & Financial Consolidation | `docs/architecture/tenant-architecture.md`, `docs/roadmap/master-roadmap.md` |
| White-Labeling & Reseller Program | `docs/roadmap/master-roadmap.md` |
| Tenant Sandbox Environment | `docs/roadmap/master-roadmap.md` |
| Data Privacy & GDPR Compliance Tools | `docs/architecture/security-architecture.md`, `docs/roadmap/master-roadmap.md` |
| Pricing Engine & Discount Management | `docs/roadmap/master-roadmap.md` |
| UOM & Conversion | `docs/roadmap/master-roadmap.md` |
| Data Import & Migration Tools | `docs/roadmap/master-roadmap.md` |
| Collaboration & Activity Feed | `docs/roadmap/master-roadmap.md` |
| Calendar & Scheduling | `docs/roadmap/master-roadmap.md` |
| AI Copilot Platform (cross-module, voice, anomaly detection) | `docs/architecture/ai-architecture.md`, `docs/roadmap/master-roadmap.md` |

When any of these initiatives is ready to be specified, create a new document in this folder using the template above and add it to the table in this README.
