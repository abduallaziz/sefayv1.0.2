# Status

High-level project state. Detailed specs and engineering history live in `TASKS.md` and `docs/`.

> **Documentation:** Architecture docs → `docs/architecture/` · Future initiatives → `docs/future/` · Roadmap planning → `docs/roadmap/`

---

## Current Phase

**Phase 2 — Inventory UX Production-Readiness** (In Progress)

Core Inventory modules are functional. UX consistency work is ongoing. Live end-to-end workflow verification requires backend credentials (SUPABASE_URL / SERVICE_ROLE_KEY) not available in the current environment.

---

## Recently Completed

| What | PR | Notes |
| --- | --- | --- |
| Date-Range Picker — full calendar-grid redesign + portal positioning | — | Both `SingleDatePicker` and `DateRangePicker` rewritten to portal-rendered calendar grid via `useFloatingPosition`. Mobile overflow fixed. Full history in TASKS.md. |
| RTL native date-input fix + raw `<input type="date">` removal | — | All 4 raw date inputs replaced with shared pickers. `dir="ltr"` fix centralized in components. |
| Shared `StatusBadge` | #16 | Replaces 8 per-feature badge implementations across Inventory. |
| Shared `EmptyState` | #18 | Wired into all 9 Inventory list tables. |
| Shared `ConfirmDialog` — Inventory | #20 | All Inventory delete/cancel dialogs. |
| Shared `ConfirmDialog` — App-wide | #22 | Extended to Suppliers, Items, Customers, Orders. 9 dialogs total. |
| Documentation system (`docs/`) | #27+ | Architecture docs, future initiative specs, roadmap and decision records. |

---

## Active Work

| Area | Status |
| --- | --- |
| Phase 2 Inventory UX — form-modal consolidation | Next milestone (7 create/edit modals) |
| Phase 2 Inventory UX — pagination for 5 modules | Planned (data-layer change required) |
| Documentation foundation | In progress |

---

## Architecture State

| Layer | Current State |
| --- | --- |
| Frontend | Next.js 16.2.6 (App Router), React 19, TypeScript strict, Tailwind CSS, next-intl (ar/en) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Shared UI | StatusBadge, EmptyState, ConfirmDialog, SingleDatePicker, DateRangePicker, useFloatingPosition |
| Storage | Supabase Storage (direct) — StorageProvider abstraction planned (Phase 11) |
| Accounting | Not yet started — see `docs/future/advanced-accounting.md` |

→ Full architecture details: `docs/architecture/`

---

## Roadmap Summary

### Active Phases

| Phase | Name | Status |
| --- | --- | --- |
| 2 | Inventory UX Production-Readiness | In Progress |
| 3 | Barcode & Scanning | Planned |
| 4 | Smart Product Creation | Planned |
| 5 | Inventory Intelligence | Planned |
| 6 | Warehouse Management | Planned |
| 7 | Productivity | Planned |
| 8 | AI Features | Planned |
| 9 | Company Branding & Information | Planned |
| 10 | Document & Print Designer | Planned |
| 11 | Storage Abstraction | Planned |

### Future Initiatives (post Phase 11)

| Initiative | Category | Spec |
| --- | --- | --- |
| Advanced Accounting & Financial Management | Business Module | `docs/future/advanced-accounting.md` |
| SaaS Licensing Platform (extended) | Platform Service | `docs/future/saas-licensing-platform.md` |
| Marketplace & Extension Platform | Platform Service | `docs/future/marketplace-extension-platform.md` |
| Public API & Developer Platform | Platform Service | `docs/future/` — spec pending |
| Webhook Delivery System | Platform Service | `docs/future/` — spec pending |
| Notification Center | Infrastructure | `docs/future/` — spec pending |
| Approval Workflow Engine | Platform Service | `docs/future/` — spec pending |
| CRM | Business Module | `docs/future/` — spec pending |
| HR & Payroll | Business Module | `docs/future/` — spec pending |
| Manufacturing & MRP | Business Module | `docs/future/` — spec pending |
| Payment Gateway Integration | Integration | `docs/future/` — spec pending |
| E-commerce Integration | Integration | `docs/future/` — spec pending |
| WhatsApp Business Integration | Integration | `docs/future/` — spec pending |
| ZATCA Phase 2 Integration | Compliance | `docs/future/` — spec pending |
| PWA / Mobile App | Mobile | `docs/future/` — spec pending |
| Custom Report Builder | Analytics | `docs/future/` — spec pending |
| 2FA, SSO & Security Hardening | Security | `docs/future/` — spec pending |
| Multi-Branch Management | Platform | `docs/future/` — spec pending |
| Multi-Company & Consolidation | Enterprise | `docs/future/` — spec pending |
| Granular Permissions & Custom Roles | Platform | `docs/future/` — spec pending |
| Pricing Engine & Discount Management | Commerce | `docs/future/` — spec pending |
| UOM & Conversion | Commerce | `docs/future/` — spec pending |
| Data Import & Migration Tools | Platform | `docs/future/` — spec pending |
| Quality Control | Business Module | `docs/future/` — spec pending |
| Project Management | Business Module | `docs/future/` — spec pending |
| Collaboration & Activity Feed | Platform | `docs/future/` — spec pending |
| Subscription & Recurring Billing | Business Module | `docs/future/` — spec pending |
| White-Labeling & Reseller Program | Enterprise | `docs/future/` — spec pending |
| Executive KPI Dashboard | Analytics | `docs/future/` — spec pending |
| Field Service & Maintenance | Business Module | `docs/future/` — spec pending |
| Fleet Management | Business Module | `docs/future/` — spec pending |

→ **Master Roadmap (dependency map + implementation sequence):** `docs/roadmap/master-roadmap.md`
→ **Phase specs:** `TASKS.md` · **Initiative specs:** `docs/future/`

---

## Deferred

| Feature | Notes |
| --- | --- |
| Company Factory Reset | Owner-only, multi-step, transactional wipe. Full spec in TASKS.md. |
