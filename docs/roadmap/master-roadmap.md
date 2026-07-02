# Sefay ERP — Master Long-Term Roadmap

*Added: 2026-06-30*
*Reviewed against: Odoo Enterprise · Microsoft Dynamics 365 BC · SAP Business One · Oracle NetSuite · ERPNext*

---

## Purpose

This document is the single authoritative reference for the complete long-term vision of the Sefay ERP platform. It captures all planned phases, future initiatives, future modules, platform services, infrastructure investments, and enterprise features — in one place, with explicit dependency mapping.

The **active implementation roadmap** (detailed specs per phase) lives in `TASKS.md`. The **current completion state** lives in `STATUS.md`. This document covers the full horizon beyond the currently active phases, organized so future implementation sessions have an agreed starting point rather than re-deriving requirements.

This document is intentionally stable. Its purpose is to stop the roadmap from expanding in every session. When a new capability is proposed, check here first. If it fits within a planned initiative, add it there. If it is genuinely new, add it here with full dependency mapping, then stop re-opening this document unless a new category is discovered.

---

## Documentation Governance

| File | Purpose |
|---|---|
| `STATUS.md` | Concise engineering log — current completion state only |
| `TASKS.md` | Implementation roadmap — detailed specs for active and planned phases |
| `docs/architecture/` | Current and planned system design |
| `docs/future/` | Detailed specifications for future initiatives (one file per initiative) |
| `docs/roadmap/` | Long-term roadmap research and dependency analysis (this file) |
| `docs/decisions/` | Architecture Decision Records |
| `docs/specifications/` | Cross-cutting technical specifications for shared components |

**Rule:** every future initiative has exactly one specification document in `docs/future/`. TASKS.md carries a brief summary and a reference to that document. This file carries the dependency map and sequencing rationale. Nothing is duplicated across all three.

---

## Part 1 — Confirmed Active Phases (2–11)

These phases are fully specified in `TASKS.md`. Do not modify their numbering or content here.

| Phase | Name | Status |
|---|---|---|
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

Phase dependency chain: `2 → 3 → 4 → 5 → 6` and `9 → 10 ← 3`, `11 → 9`, `4 → 8 ← 5`. Full dependency reasoning in `docs/roadmap/README.md`.

---

## Part 2 — Near-Term Cross-Cutting Infrastructure

These are platform investments that must be completed **before** or **alongside** future business modules. They enable multiple phases simultaneously and should not be bundled inside any single feature phase.

| Initiative | Why It Must Come First | Depends On | Unblocks |
|---|---|---|---|
| **Security Hardening: 2FA, CSP, Password Policy** | Security gap; 2FA via Supabase Auth is low-effort, high-impact | Phase 2 complete | All future phases |
| **Notification Center** | Every future module (CRM, HR, Alerts, Workflows) emits notifications; build once | Supabase Realtime | Phase 5 Alerts, Approval Workflows, CRM |
| **Background Job System** | Phase 5 (health scores), Phase 8 (AI), Phase 10 (PDF batch), email delivery all need async execution | Phase 11 | Phase 5, 8, 10, Email |
| **Email Delivery Service** (shared `EmailProvider` abstraction) | Phase 10 email templates, Smart Alerts, invoice delivery all require it | Background Job System | Phase 10, Phase 5, Invoicing |
| **Observability: Error Tracking & Performance Monitoring** | Production bugs are invisible without structured error tracking | None | All phases |
| **UOM & Conversion** (Unit of Measure) | Manufacturing, accurate inventory costing, and Phase 3 scanning all depend on UOM | Products data model | Phase 3, Manufacturing, Accounting |
| **Global Entity Search** (upgrade Phase 7 inventory search to platform-wide) | CRM, Document Finder, customer lookup all need unified search | Phase 7 baseline | CRM, Document platform |
| **Document Attachments** (add to Phase 11 scope) | QC inspection photos, procurement invoices, customer contracts need attachments | Phase 11 StorageProvider | QC, Procurement maturity, CRM, HR |
| **Bulk Data Import Tools** | New customer onboarding is blocked without product/customer/stock import | Phase 11 | Customer onboarding |
| **Custom Fields Platform** (generalize existing `CustomFieldsManager`) | CRM, HR, QC all need custom fields on core entities | Existing Customers implementation | CRM, HR, QC |
| **Tenant Audit Log** (add to Settings for Owner/Admin) | Enterprise trust signal; audit tables already exist — it's a UI gap | Existing audit tables | Compliance, enterprise sales |
| **Feature Flags: Formalized** (document and wire `useFeatureFlag` hook) | Feature flag UI exists; enforcement pattern is undocumented | Existing SuperAdmin UI | All gradual rollouts |
| **SaaS Licensing: Extended Plan Limits + Usage Metering** | Phase 8 (AI tokens), Phase 11 (storage), Phase 13 (API calls) all need enforced quotas | Phase 11, existing Subscriptions | Phase 8, Phase 13 |
| **Caching Strategy** | Phase 5 computed metrics must not recompute on every request | None | Phase 5, Phase 8 |

---

## Part 3 — Future Initiatives

Each initiative below has a detailed specification document in `docs/future/`. The descriptions here are summaries only.

### Platform Services

#### SaaS Licensing & Subscription Platform (extended)
*Spec: `docs/future/saas-licensing-platform.md`*

The SuperAdmin subscription management layer already exists (Plans, Subscriptions, Feature Entitlements). What is missing: extended plan limits (warehouses, storage, AI tokens, API calls), usage metering infrastructure, tenant self-service billing portal, coupon/promotion system, and subscription analytics dashboard.

**Dependencies:** Phase 11 (storage quota integration), Phase 8 (AI token quota enforcement), Phase 13 (API call quota enforcement).

---

#### Marketplace & Extension Platform
*Spec: `docs/future/marketplace-extension-platform.md`*

A governed ecosystem where third-party developers publish installable extensions (modules, integrations, themes, report templates, document templates, AI plugins). Includes the Extension API, extension manifest format, tenant extension registry, marketplace catalogue, developer portal, and governance model.

**Dependencies:** Phase 10 (Document Templates integration), Phase 13 (Public API forms the Extension SDK foundation), Custom Report Builder, Custom Fields Platform.

**Why it matters:** transforms Sefay from a product into a platform. Enables distribution through partners without direct sales effort.

---

#### Public API & Developer Platform
*Spec: `docs/future/` — document to be created*

A publicly documented, versioned REST API with API key authentication, OpenAPI/Swagger docs, a developer portal with sandbox access, Zapier/Make connectors, and webhook management UI for tenants. The `api-design.md` doc describes the internal API conventions that this initiative publishes externally.

**Dependencies:** Existing versioned internal API (already follows v1 conventions), Webhook Delivery System (below), SaaS Licensing (API call quotas).

---

#### Webhook Delivery System
*Spec: `docs/future/` — document to be created*

Event-driven webhook delivery: tenants register HTTP endpoint URLs and subscribe to event types (order created, stock below threshold, invoice posted). Delivered reliably with HMAC signing, retry logic, dead-letter queues, and a delivery log UI.

**Dependencies:** Background Job System (retry queuing).
**Required by:** E-commerce Integration, Payment Gateways, WhatsApp Integration, ZATCA.

---

#### Notification Center
*Spec: `docs/future/` — document to be created*

A centralized in-app notification inbox with per-user preferences, real-time badge counts, and email digest. Platform infrastructure consumed by every module that generates alerts — Smart Alerts (Phase 5), Approval Workflows, CRM activities, HR events.

**Dependencies:** Supabase Realtime (available, not yet used).

---

#### Approval Workflow Engine
*Spec: `docs/future/` — document to be created*

A generic, configurable approval engine: define multi-level approval chains for any document type (purchase orders above a threshold, leave requests, expense claims). Rules-based: "if PO amount > SAR 50,000, require CFO approval after manager approval."

**Dependencies:** Notification Center (approval requests trigger notifications).
**Required by:** CRM (deal approvals), HR (leave requests), Advanced Accounting (financial document approvals).

---

#### Automation Rules Engine
*Spec: `docs/future/` — document to be created*

A no-code rules engine where tenants define "when X event occurs, if Y condition is met, do Z action" — without requiring developer involvement. Actions include: send notification, assign task, update field, trigger webhook, create record.

**Dependencies:** Notification Center, Webhook System, Task System.
**Required by:** CRM (automated follow-up), HR (automated onboarding tasks).

---

#### Task & Reminder System
*Spec: `docs/future/` — document to be created*

Internal task assignment to users with due dates and record linkage ("follow up with supplier on PO #123 by Thursday"), a personal task inbox, and recurring task support.

**Dependencies:** Notification Center (task assignment triggers notification).
**Required by:** CRM (follow-up activities), HR (onboarding checklists), Field Service.

---

### Business Modules

#### Advanced Accounting & Financial Management
*Spec: `docs/future/advanced-accounting.md`*

Full double-entry accounting: Chart of Accounts, General Ledger, Journal Entries, AP/AR, Cash & Bank, Tax Engine (ZATCA Phase 1 + 2), Financial Reporting (Trial Balance, Balance Sheet, P&L, Cash Flow), Financial Dimensions, Fixed Assets, Inventory Costing, Budget & Forecasting, Treasury Management, Centralized Posting Engine, Workflow & Approvals, Reconciliation, Audit & Compliance (IFRS/GAAP/ZATCA/SAF-T/XBRL), multi-currency, intercompany accounting, financial consolidation, AI Finance.

**Dependencies:** UOM & Conversion (for accurate inventory costing), Notification Center (period-closing notifications), Approval Workflow Engine (financial document approvals).
**Required by:** CRM (revenue tracking), HR (payroll posting), Manufacturing (production costing), Subscription Billing, ZATCA integration.

---

#### CRM (Customer Relationship Management)
*Spec: `docs/future/` — document to be created*

Lead and opportunity tracking, sales pipeline, follow-up activities, customer communication history, sales rep performance, deal forecasting. Builds on the existing Customers module.

**Dependencies:** Advanced Accounting (revenue tracking), Pricing Engine (price quotes), Notification Center (activity reminders), Task System.

---

#### HR & Payroll
*Spec: `docs/future/` — document to be created*

Employee records, org chart, departments, leave management, attendance tracking, payroll calculation with GOSI (General Organization for Social Insurance) and WPS (Wage Protection System) compliance for Saudi Arabia. Payroll posting to accounting via the Posting Engine.

**Dependencies:** Advanced Accounting (payroll journal entries via Posting Engine), Approval Workflow Engine (leave request approvals), Multi-Branch Management (branch-level HR), Notification Center (leave approval notifications).

---

#### Manufacturing & MRP
*Spec: `docs/future/` — document to be created*

Bill of Materials, Work Orders, Production Planning, Material Requirements Planning (MRP), routing, capacity planning, shop floor control, production costing.

**Dependencies:** Phase 5 (Inventory Intelligence — demand data), Phase 6 (Warehouse Management), Advanced Accounting (Inventory Costing via Posting Engine), Pricing Engine (BOM cost-based pricing), UOM & Conversion.

---

#### Quality Control
*Spec: `docs/future/` — document to be created*

Inspection checklists, quality hold states on stock, non-conformance reports (NCR), supplier quality ratings, incoming inspection integrated with Goods Receipts, quarantine location support.

**Dependencies:** Phase 6 (Warehouse Management — quarantine zones), Phase 3 (Barcode Scanning — item identification during inspection), Advanced Accounting (write-off of rejected goods), Document Attachments (inspection photos).

---

#### Project Management
*Spec: `docs/future/` — document to be created*

Projects, tasks, milestones, time tracking, project-based costing, resource allocation, project P&L.

**Dependencies:** CRM (projects linked to customers/deals), Advanced Accounting (project cost centers via financial dimensions), HR (resource allocation).

---

#### Field Service & Maintenance
*Spec: `docs/future/` — document to be created*

Service orders, technician dispatch, maintenance schedules, asset tracking, SLA management, field team mobile app.

**Dependencies:** CRM (customer service requests), Project Management (work orders as projects), Mobile App (technician field access), Phase 6 Inventory (spare parts).

---

#### Subscription & Recurring Billing
*Spec: `docs/future/` — document to be created*

Note: this is **customer-facing** recurring billing (e.g. a tenant selling subscription services), distinct from Sefay's own SaaS Licensing Platform. Subscription contracts, recurring invoice generation, proration, dunning management, subscription lifecycle (trial → active → cancelled).

**Dependencies:** Advanced Accounting (revenue recognition, deferred revenue), Phase 10 (recurring invoice templates), Payment Gateway Integration (automatic collection).

---

#### Multi-Branch Management
*Spec: `docs/future/` — document to be created*

A dedicated Branch module with branch-level P&L, inter-branch stock transfers, branch-specific settings, branch-scoped user access, and branch performance reporting.

**Note:** "branches" appear as an entity in the factory reset spec and the permission system doc but no Branch module exists. This is a prerequisite for branch-scoped permissions (Phase 6+), branch-level P&L, and the multi-company model.

**Dependencies:** Phase 6 (Warehouse Management — inter-branch warehouse model), Advanced Accounting (branch cost centers as financial dimensions), Granular Permissions (branch-scoped access control).

---

#### Fleet Management
*Spec: `docs/future/` — document to be created*

Vehicle records, maintenance schedules, fuel tracking, driver assignment, mileage logs, vehicle cost allocation to cost centers.

**Dependencies:** HR (drivers as employees), Advanced Accounting (vehicle cost centers), Field Service (technician vehicles).

---

### Integration Initiatives

#### Payment Gateway Integration
*Spec: `docs/future/` — document to be created*

Two sub-tracks: (1) POS terminal integration — Mada, STC Pay, in-person payment collection; (2) online payment links — tenants send customers a payment URL for invoice settlement. Covers: Mada, STC Pay, Tamara (BNPL), Tabby (BNPL), Moyasar, Stripe.

**Dependencies:** Phase 10 (invoice document generation), Advanced Accounting (payment posting via Posting Engine), Webhook System (payment event notifications).

---

#### E-commerce Integration Platform
*Spec: `docs/future/` — document to be created*

Bidirectional connectors to Salla, Zid (Saudi-specific), Shopify, WooCommerce. Sync: products, inventory levels, orders, customers, and returns.

**Dependencies:** Public API & Webhook System (order ingestion from external platforms), Pricing Engine (price list sync), Payment Gateway (payment reconciliation).

---

#### WhatsApp Business Integration
*Spec: `docs/future/` — document to be created*

Send invoices, receipts, purchase order acknowledgments, delivery notifications, and low-stock alerts via WhatsApp Business API. Significant Saudi/GCC market differentiator.

**Dependencies:** Phase 10 (document generation for PDF attachments), Webhook System (events triggering WhatsApp messages), Notification Center (routing logic).

---

#### ZATCA Phase 2 Integration
*Spec: `docs/future/` — document to be created*

Direct API integration with the Saudi Zakat, Tax and Customs Authority for Phase 2 (integration phase) e-invoicing: cryptographic signing of invoices, clearance/reporting submission, compliance certificate management, and ongoing compliance reporting.

**Dependencies:** Advanced Accounting (invoice data, VAT calculation), Phase 10 (document generation), Phase 9 (VAT number — already planned).

---

#### Accounting Software Bridge (QuickBooks / Xero)
*Spec: `docs/future/` — document to be created*

Interim bridge for tenants who continue using QuickBooks Online or Xero alongside Sefay during the period before Sefay's own Advanced Accounting is available and mature. Chart of accounts mapping, journal entry export, invoice sync.

**Note:** this initiative should be deprecated and retired once Advanced Accounting is production-stable and customers have migrated.

**Dependencies:** Public API (the bridge consumes Sefay's public API to pull transaction data).

---

### Mobile

#### Progressive Web App (PWA)
*Spec: `docs/future/` — document to be created*

Service worker registration, web app manifest, install-to-homescreen, push notification support, and selective offline caching for read-only data (current stock levels, product catalogue). The offline strategy must be defined as a platform-level architecture decision before Phase 3 builds any per-feature offline capability.

**Dependencies:** Notification Center (push notifications channel), Phase 3 (offline scan mode is the first offline use case).

---

#### Native Mobile App (React Native)
*Spec: `docs/future/` — document to be created*

iOS and Android native app sharing business logic with the web frontend. Initial screens: barcode scanning (Phase 3), stock counting, POS payment collection, delivery confirmation, and field service technician flows.

**Dependencies:** PWA (validates the offline architecture and use cases before committing to native), Phase 3 (scanner), Phase 6 (warehouse mobile workflows), Payment Gateways (mobile POS payment).

---

### Reporting & Analytics

#### Custom Report Builder
*Spec: `docs/future/` — document to be created*

A drag-and-drop report builder for business users: select entities, choose fields, apply filters, group by dimensions, sort, and save as a named report. No SQL knowledge required. Scheduled report delivery via email. BI tool export connectors (Power BI, Tableau, Google Looker Studio).

**Dependencies:** Advanced Accounting (financial data fields), CRM, HR, Manufacturing (entity data availability), Background Job System (scheduled delivery), Email Delivery Service.

---

#### Executive KPI Dashboard
*Spec: `docs/future/` — document to be created*

A top-level configurable dashboard combining financial KPIs (revenue, gross margin, cash position, receivables/payables) with operational KPIs (inventory value, stock health, open orders, active shifts). Replaces the current inventory-only dashboard for company owners.

**Dependencies:** Advanced Accounting (financial KPIs), Phase 5 (inventory intelligence KPIs), Supabase Realtime (live refresh).

---

#### Sales Analytics
*Spec: `docs/future/` — document to be created*

Revenue by product, category, customer, sales rep, region, and time period. Cohort analysis (repeat customers), basket analysis (frequently bought together), return rate tracking, profitability per order.

**Dependencies:** Advanced Accounting (revenue and COGS data), Phase 5 (inventory data), Custom Report Builder (flexible ad-hoc analysis layer).

---

### Security Initiatives

#### 2FA, SSO & Password Policy
*Spec: `docs/future/` — document to be created*

Two-factor authentication (TOTP via Supabase Auth's built-in support), Single Sign-On (SAML 2.0, OAuth 2.0 — Azure AD, Google Workspace, Okta), enforced password complexity and expiry policies, IP whitelisting, session timeout configuration.

**Dependencies:** None — Supabase Auth supports TOTP natively.
**Note:** 2FA is the highest-priority security item; it should be implemented as near-term work, not deferred.

---

#### Granular Permissions & Custom Roles
*Spec: `docs/future/` — document to be created*

Beyond the current four hardcoded roles (Owner, Admin, Employee, Cashier): individual permissions assignable independently of role ("can approve purchase orders" without being Admin), company-defined custom roles, and branch/warehouse-scoped permissions.

**Dependencies:** Multi-Branch Management (branch-scoped permissions require the branch model), Approval Workflow Engine (approver roles are the most common custom role use case).

---

### Enterprise Features

#### Multi-Company & Financial Consolidation
*Spec: `docs/future/` — document to be created*

A parent company that owns multiple legal entities (subsidiaries) with inter-company transactions, elimination journals, and consolidated financial reporting across subsidiaries.

**Dependencies:** Advanced Accounting (must be complete and stable before consolidation is built), Multi-Branch Management (branches are the simpler step before multi-entity).
**Note:** significant architecture change — requires a "company group" concept above the existing `companies` table. Must be scoped as a standalone ADR before implementation.

---

#### White-Labeling & Reseller Program
*Spec: `docs/future/` — document to be created*

Allow reseller partners to brand Sefay under their own product identity: custom logo, custom domain with automatic SSL, custom color scheme, custom login page. Enables distribution through partners without direct sales effort.

**Dependencies:** Phase 9 (branding assets infrastructure), SaaS Licensing (reseller pricing tiers and commission tracking), Custom Domain (Vercel Domains API).

---

#### Tenant Sandbox Environment
*Spec: `docs/future/` — document to be created*

A sandboxed copy of a tenant's environment (data + configuration) for safely testing new features, training new employees, or trialing configurations without risk to production data.

**Dependencies:** Data Import & Migration Tools (seeding sandbox from production data), SaaS Licensing (sandbox is a plan entitlement, not available on all tiers).

---

#### Data Privacy & GDPR Compliance Tools
*Spec: `docs/future/` — document to be created*

Structured mechanism for tenants to export all their company data (full data dump for portability), and for complying with right-to-erasure requests (anonymize customer PII on historical invoices while preserving invoice records for tax retention). The security architecture doc notes GDPR obligations but marks them as not yet implemented.

**Dependencies:** Background Job System (large data export is async), Phase 11 Storage Abstraction (asset export), Advanced Accounting (invoice retention policy alignment).

---

### Pricing & Commerce (Platform Layer)

#### Pricing Engine & Discount Management
*Spec: `docs/future/` — document to be created*

Multiple price lists (retail, wholesale, VIP), customer-group pricing, date-effective promotional pricing, quantity-break pricing (buy 10+ at 5% discount), and configurable discount rules (percentage off, fixed off, buy-X-get-Y, bundle pricing).

**Dependencies:** Customer module (price lists assigned to customer groups), Product Catalogue.
**Required by:** CRM (price quotes), POS (promotional pricing), E-commerce Integration (price list sync).

---

#### UOM & Conversion (Unit of Measure)
*Spec: `docs/future/` — document to be created*

Multiple units per product (buy in cartons, sell in units, weigh in kilograms), configurable conversion factors, and UOM-based pricing.

**Dependencies:** Products data model (data model change — additive, not destructive).
**Required by:** Phase 3 (scanning needs to know which unit is being scanned), Manufacturing (BOM quantities), Advanced Accounting (inventory costing is unit-dependent).

---

#### Data Import & Migration Tools
*Spec: `docs/future/` — document to be created*

CSV/Excel import for products, customers, suppliers, and opening stock balances. Import preview, row-by-row validation errors, and full rollback on failure. Opening balance import for new accounting periods. Tools for migrating data from other ERPs (SAP B1, Odoo, custom spreadsheets).

**Dependencies:** Phase 11 (file upload via StorageProvider for large imports), Background Job System (large imports are processed asynchronously).

---

#### Collaboration & Activity Feed
*Spec: `docs/future/` — document to be created*

Per-record comment threads, @mention of team members with notification delivery, activity timeline per document (who created, approved, edited and when, what changed), system-generated events interleaved with human comments. Equivalent to Odoo's "chatter."

**Dependencies:** Notification Center (mentions trigger notifications), Document Attachments (attach files to comments).

---

#### Calendar & Scheduling
*Spec: `docs/future/` — document to be created*

A shared calendar showing scheduled deliveries, purchase order deadlines, shift schedules, stock count sessions, and task due dates. Operational planning view across all modules.

**Dependencies:** Task & Reminder System, Shifts module (already exists), Purchase Orders, Deliveries.

---

## Part 4 — Recommended Implementation Sequence

The following grouping reflects dependency order. Items within a group can be parallelized; groups must be sequential.

### Group A — Platform Foundation (complete before new business modules)
1. Security Hardening: 2FA, CSP, Password Policy
2. Observability: Error Tracking
3. Feature Flags: Formalized
4. SaaS Licensing: Extended Plan Limits + Usage Metering (extend existing implementation)
5. UOM & Conversion
6. Notification Center
7. Background Job System
8. Email Delivery Service
9. Document Attachments (add to Phase 11 scope)
10. Tenant Audit Log (add to Settings)
11. Bulk Data Import Tools
12. Custom Fields Platform
13. Caching Strategy

### Group B — Core Platform (after Phase 11 complete)
14. Advanced Accounting & Financial Management
15. Webhook Delivery System
16. Public API & Developer Platform
17. Pricing Engine & Discount Management
18. Multi-Branch Management

### Group C — Commerce & Compliance
19. Payment Gateway Integration
20. ZATCA Phase 2 Integration
21. Approval Workflow Engine
22. Task & Reminder System
23. Collaboration & Activity Feed

### Group D — Market Expansion
24. CRM
25. E-commerce Integration Platform
26. WhatsApp Business Integration
27. Progressive Web App (PWA)
28. Sales Analytics

### Group E — HR & Operations
29. HR & Payroll
30. Quality Control
31. Manufacturing & MRP
32. Logistics & Shipping
33. Subscription & Recurring Billing

### Group F — Intelligence & Analytics
34. Executive KPI Dashboard
35. Custom Report Builder
36. AI Demand Forecasting (enhancement to Phase 5)
37. AI Document Processing / OCR (enhancement to Phase 8)
38. AI Anomaly Detection (enhancement to Phase 8)

### Group G — Mobile
39. Native Mobile App (React Native)
40. Tablet POS (Mobile-Optimized)

### Group H — Enterprise
41. Granular Permissions & Custom Roles
42. 2FA / SSO (SSO portion — enterprise tier feature)
43. Data Privacy & GDPR Compliance Tools
44. White-Labeling & Reseller Program
45. Tenant Sandbox Environment
46. Multi-Company & Financial Consolidation

### Group I — Ecosystem
47. Marketplace & Extension Platform
48. Accounting Software Bridge (interim, deprecated after Group B.14 matures)

### Group J — Advanced Services
49. Project Management
50. Field Service & Maintenance
51. Fleet Management
52. Calendar & Scheduling

---

## Part 5 — Dependency Map Summary

| Initiative | Blocked By (must complete first) |
|---|---|
| Advanced Accounting | UOM, Notification Center, Approval Workflow Engine |
| CRM | Advanced Accounting, Pricing Engine, Notification Center, Task System |
| HR & Payroll | Advanced Accounting, Approval Workflow, Multi-Branch, Notification Center |
| Manufacturing & MRP | Phase 5, Phase 6, Advanced Accounting, Pricing Engine, UOM |
| Quality Control | Phase 6, Phase 3, Advanced Accounting, Document Attachments |
| Payment Gateways | Phase 10, Advanced Accounting, Webhook System |
| E-commerce Integration | Public API, Webhook System, Pricing Engine, Payment Gateways |
| WhatsApp Integration | Phase 10, Webhook System, Notification Center |
| ZATCA Phase 2 | Advanced Accounting, Phase 10, Phase 9 |
| PWA | Notification Center, Phase 3 |
| Native Mobile App | PWA (validates offline arch), Phase 3, Phase 6, Payment Gateways |
| Custom Report Builder | Advanced Accounting, CRM, HR, Background Job System, Email Service |
| Executive Dashboard | Advanced Accounting, Phase 5 |
| Multi-Company | Advanced Accounting (complete + stable), Multi-Branch |
| White-Labeling | Phase 9, SaaS Licensing, Custom Domain |
| Marketplace | Phase 10, Public API, Custom Report Builder, Custom Fields Platform |
| Granular Permissions | Multi-Branch, Approval Workflow Engine |
| Tenant Sandbox | Data Import Tools, SaaS Licensing |
| Data Privacy Tools | Background Job System, Phase 11, Advanced Accounting |
| Subscription Billing | Advanced Accounting, Phase 10, Payment Gateways |
| Project Management | CRM, Advanced Accounting, HR |
| Field Service | CRM, Project Management, Mobile App |
| Fleet Management | HR, Advanced Accounting |
| Automation Rules Engine | Notification Center, Webhook System, Task System |

---

## Part 6 — What This Roadmap Does Not Cover

The following are **explicitly out of scope** for the Sefay ERP platform as currently envisioned:

| Excluded Capability | Rationale |
|---|---|
| **Payroll calculation engine** | Payroll *posting* to accounting is in scope (via Posting Engine); the payroll calculation engine is HR module scope, itself a future initiative |
| **e-Commerce storefront** | Sefay integrates with e-commerce platforms; it does not provide one |
| **Generic CMS / website builder** | Not an ERP function |
| **IoT device management** | Beyond Barcode/QR scanning hardware; full IoT is a different product category |
| **Blockchain / distributed ledger** | No business requirement identified |
| **Cryptocurrency payments** | Not a requirement for the Saudi/GCC market at this time |

---

*This document is stable. The roadmap does not need to be re-opened unless a new top-level capability category is discovered that does not fit within any existing initiative. Refinements and sub-feature additions belong inside the relevant `docs/future/` document, not here.*
