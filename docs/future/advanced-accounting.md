# Advanced Accounting & Financial Management

**Status:** Draft Proposal (Non-Binding)
**Type:** Future Initiative
**Phase:** Independent (not part of the numbered inventory roadmap)
**Last Updated:** 2026-06-30
**Document Location:** docs/future/advanced-accounting.md

---

## Purpose

The Sefay ERP platform currently provides transactional modules for Sales, Inventory, and Purchasing. These modules record business events — invoices, purchase orders, goods receipts, stock adjustments — but do not produce the double-entry accounting records that professional business users and auditors require. There is no Chart of Accounts, no General Ledger, no period-based trial balance, and no mechanism to ensure that every financial event creates a balanced set of debit and credit entries.

This gap is significant. Businesses operating in Saudi Arabia and the GCC must comply with ZATCA e-invoicing regulations, maintain auditable financial records, and produce IFRS-aligned financial statements. Without a native accounting engine, Sefay cannot serve mid-market and enterprise customers who need a single, integrated ERP rather than a hybrid of Sefay plus an external accounting package.

This initiative specifies the full design and scope of a native, enterprise-grade accounting and financial management system embedded within Sefay. It is a long-term engineering proposal, not a commitment or a scheduled delivery. No code has been written for this initiative.

---

## Vision

A complete, scalable, enterprise-grade financial management platform embedded natively in the Sefay ERP — designed from the ground up for Saudi and GCC businesses, with ZATCA compliance as a first-class requirement, Arabic-first user experience, and full double-entry accounting integrity. The accounting engine is designed to be jurisdiction-extensible, supporting IFRS, GAAP, and regional frameworks without hardcoding any single standard. Every business event in the ERP — whether from Inventory, Sales, Purchasing, or future modules — flows through a centralized Posting Engine that produces immutable, balanced journal entries. Financial data is always auditable, always consistent, and always accessible to the right people through role-based financial workspaces.

---

## Goals

1. **Implement double-entry accounting integrity** — every financial transaction recorded in the system produces balanced journal entries (debits = credits) guaranteed at the database level.
2. **Build a centralized Posting Engine** — all ERP modules generate journal entries exclusively through a single, configurable Posting Engine; no module contains accounting journal logic directly.
3. **Achieve ZATCA Phase 1 and Phase 2 compliance** — produce ZATCA-compliant e-invoices and tax reports natively, without requiring third-party integration for core compliance.
4. **Deliver complete financial reporting** — Trial Balance, Balance Sheet, Income Statement, Cash Flow Statement, and supporting sub-ledger reports available in real time.
5. **Support multi-dimensional financial analysis** — flexible financial dimensions (cost centers, departments, projects, branches) with an extensible model that does not require schema changes to add new dimension types.
6. **Enable period-based financial control** — fiscal years, fiscal periods, period locking, and a formal financial closing workflow with dependency validation.
7. **Provide role-based financial workspaces** — dedicated interfaces for accountants, finance managers, CFOs, and auditors, each exposing the data and workflows relevant to their role.
8. **Maintain an immutable audit trail** — every financial record change is recorded in an append-only audit log; hard deletion of financial records is prohibited at the database level.
9. **Integrate seamlessly with existing ERP modules** — Inventory, Sales, and Purchasing transactions automatically produce journal entries via the Posting Engine upon document approval or posting.
10. **Lay the architectural foundation for future financial capabilities** — multi-currency, intercompany accounting, financial consolidation, and AI-powered financial insights are designed into the architecture from the start, even if delivered in later milestones.

---

## Business Value

| Value Point | Description |
|---|---|
| **Competitive differentiation** | Sefay becomes a full ERP capable of replacing both a transactional system and a separate accounting package, reducing customer software costs and integration complexity. |
| **ZATCA compliance** | Native ZATCA Phase 1 and Phase 2 e-invoicing compliance enables Sefay to serve Saudi businesses without requiring costly third-party tax software. |
| **Auditor-ready financial records** | An immutable audit trail and IFRS-aligned reporting means auditors can work directly within Sefay, reducing audit preparation time significantly. |
| **Mid-market and enterprise expansion** | Professional accounting features unlock mid-market and enterprise customer segments that currently require ERP-plus-accounting-software combinations. |
| **Reduced data fragmentation** | Embedding accounting natively eliminates the synchronization problems that arise when transactional data lives in one system and accounting data in another. |
| **Real-time financial visibility** | CFOs and finance managers gain real-time access to financial KPIs, period performance, and cash position without waiting for end-of-period reconciliation exports. |
| **Operational efficiency** | Automated posting rules, recurring journal templates, and structured closing workflows reduce manual accounting work and the error rate associated with manual journal entries. |
| **Regulatory extensibility** | The jurisdiction-extensible compliance framework allows Sefay to support GCC countries beyond Saudi Arabia (UAE VAT, Bahrain VAT, etc.) without architectural changes. |

---

## Scope

The following capabilities are in scope for this initiative:

- **Chart of Accounts** — hierarchical account structure, account types, account groups
- **General Ledger and Sub-Ledgers** — core ledger, accounts receivable sub-ledger, accounts payable sub-ledger
- **Journal Entry Management** — manual journals, system-generated journals, posting, reversal
- **Fiscal Year and Period Management** — fiscal calendar configuration, period locking, opening balances
- **Accounts Receivable and Accounts Payable** — invoice tracking, payment matching, aging reports
- **Cash and Bank Management** — bank accounts, receipts, payments, bank reconciliation
- **Tax Engine** — VAT, multiple tax rates, tax groups, ZATCA compliance (Phase 1 and Phase 2)
- **Financial Reporting** — Trial Balance, Balance Sheet, Income Statement, Cash Flow Statement, financial KPIs
- **Financial Dimensions** — cost centers, departments, projects, branches, profit centers, extensible dimension framework
- **Fixed Assets** — asset register, depreciation schedules, disposals, transfers
- **Inventory Costing** — average cost, FIFO, standard cost, landed cost, integration with Inventory module
- **Budget and Forecasting** — budget management, budget versions, budget vs. actual analysis, scenario planning
- **Treasury Management** — bank transfers, cash management, loans, guarantees, letters of credit
- **Centralized Posting Engine** — configurable posting rules, event-driven journal generation, idempotent posting, dry-run simulation, reverse posting
- **Workflow and Approval Engine** — multi-level approval workflows for financial documents
- **Reconciliation Center** — bank, customer, supplier, ledger, and inventory reconciliation workspaces
- **Audit and Compliance** — immutable audit trail, IFRS/GAAP/ZATCA/SAF-T/XBRL support
- **Advanced Finance** — revenue recognition, deferred revenue, accruals, deferrals, recurring journals, allocations
- **Enterprise Finance** — multi-currency, exchange rate revaluation, intercompany accounting, financial consolidation, multi-company, multi-ledger
- **Financial Workspaces** — role-based interfaces for accountants, finance managers, CFOs, and auditors
- **Financial Closing Center** — structured period-closing workflow with validation and dependency checking
- **Journal Import Center** — Excel/CSV import with preview, validation, mapping, and rollback
- **Accounting Templates** — reusable journal entry templates for recurring transactions
- **Financial API** — public and internal APIs, banking integrations, ZATCA API, webhooks
- **Financial Analytics** — executive dashboards, profitability analysis, cash flow analytics
- **AI Finance** — AI financial assistant, fraud detection, anomaly detection, journal suggestions

---

## Out of Scope

The following capabilities are explicitly deferred to separate future initiatives and are not part of this proposal:

| Deferred Capability | Rationale |
|---|---|
| **Payroll Module** | Payroll is a standalone HR-adjacent initiative with its own compliance requirements (GOSI, WPS). Payroll *posting* to accounting is in scope; the payroll calculation engine is not. |
| **Human Resources (HR) Module** | HR management, employee records, leave, and attendance are separate from accounting. |
| **CRM Module** | Customer relationship management is a separate product initiative. |
| **E-commerce Integrations** | Integration with Shopify, WooCommerce, or other e-commerce platforms is a separate integration initiative. |
| **Point of Sale (POS)** | POS is a separate module initiative with its own UX requirements. POS-to-accounting posting is handled by the Posting Engine once POS exists. |
| **Project Management Module** | Full project management (tasks, timelines, resource planning) is separate. Project cost tracking through financial dimensions is in scope. |
| **External Accounting Software Sync** | Synchronization with Xero, QuickBooks, or Odoo is explicitly not pursued — native accounting replaces this need. |
| **Banking System Integrations (real-time)** | Real-time bank feeds via open banking APIs are noted in the Financial API milestone but are a lower-priority future enhancement. |
| **Investment Portfolio Management** | Sophisticated investment management beyond basic treasury is out of scope. |
| **Insurance Module** | Insurance policy management and claims processing are separate. |

---

## Architecture Principles

### Scalability
The accounting engine is designed to handle millions of journal entries per fiscal year per company. Database design uses partitioning by fiscal year and company. Reporting queries use materialized views and read replicas to avoid impacting transactional performance.

### Extensibility
No accounting concept is hardcoded. Account types, dimension types, posting rules, tax rates, approval workflows, and compliance frameworks are all configurable. Adding a new financial dimension type, tax jurisdiction, or approval level requires configuration, not code changes.

### Maintainability
The accounting domain is implemented as a cohesive, internally consistent service layer. Business logic lives in services, not in database triggers or UI components. Services are independently testable. Financial rules are expressed as data (posting rule configurations) rather than imperative code wherever possible.

### Separation of Concerns
Business modules (Inventory, Sales, Purchasing) are responsible for their own business logic and events. They are not responsible for accounting. The Posting Engine is the single location where business events are translated into journal entries. This boundary is an architectural invariant, not a guideline.

### The Posting Engine Invariant
**Business modules MUST NEVER contain accounting journal logic directly.** When an inventory goods receipt is posted, the Inventory module raises a business event (`GoodsReceiptPosted`). The Posting Engine subscribes to that event, applies the configured posting rules, and generates the appropriate journal entries (debit Inventory Asset, credit Goods Receipt Clearing, etc.). This separation means:
- Posting rules can be changed without touching the Inventory module
- The accounting treatment of the same business event can differ by company, account group, or jurisdiction
- The Posting Engine can be tested in isolation
- Dry-run simulation is possible because the journal generation logic is centralized

### The Financial Dimensions Extensibility Model
Financial dimensions (cost center, department, project, branch) are not stored as columns on journal lines. They are stored as tags in a `transaction_dimension_tags` table that links any transaction to any number of dimension values. Adding a new dimension type (e.g., "Region") requires inserting a row into `financial_dimensions`, not a schema migration. This model supports unlimited future expansion without redesign.

### Double-Entry Integrity Guarantee
Every journal entry is subject to a database-level constraint: the sum of all debit amounts must equal the sum of all credit amounts. No application-level bug can create an unbalanced journal entry if this constraint is enforced at the database level. This is non-negotiable.

### Immutable Audit Trail
No financial record is ever hard-deleted. Corrections are made via compensating transactions (reverse posting). The audit trail is append-only. Database-level triggers prevent `DELETE` and direct `UPDATE` on financial core tables. All changes are routed through the service layer which records before/after state in the audit log.

### Modular Architecture
The accounting system is implemented as a distinct route group (`/accounting`) and service domain, loaded lazily and independently of the Inventory module. Shared UI components (StatusBadge, ConfirmDialog, DataTable, EmptyState) are reused from the shared component library. Accounting-specific components live in the accounting domain.

### Provider Abstraction
External integrations (storage for financial attachments, LLM provider for AI Finance, banking API providers) use the abstraction interfaces already defined in the architecture documents. The accounting module never calls Supabase Storage directly — it calls the `StorageProvider` interface. It never calls a specific LLM provider directly — it calls the AI provider abstraction.

### Future Compatibility
Design decisions anticipate multi-company, multi-currency, and multi-ledger from the beginning, even if these are delivered in later milestones. Adding a `company_id` foreign key to all financial tables from the start, for example, avoids a costly migration later.

---

## Implementation Milestones

### Milestone 1 — Accounting Foundation

**Goal:** Establish the core accounting data model and configuration layer that all subsequent milestones depend on.

**Key Features:**
- Chart of Accounts with hierarchical account structure (account groups, account types: Asset, Liability, Equity, Revenue, Expense, Contra)
- Account numbering scheme configuration (supports Saudi standard account numbering and custom schemes)
- General Ledger — the central record of all financial activity
- Sub-Ledger framework — accounts receivable sub-ledger, accounts payable sub-ledger (detail behind the control account)
- Fiscal Year configuration — define fiscal years, including non-calendar fiscal years
- Fiscal Period configuration — divide fiscal years into periods (monthly, quarterly, or custom)
- Opening Balances — import or manually enter opening balances for each account at the start of the first fiscal year or period
- Period Locking — lock closed periods to prevent unauthorized journal entries; period lock is enforced at the service and database levels
- Account status management (active, inactive, restricted)
- Account-level currency configuration (functional currency per account)

**Architecture Notes:**
- `chart_of_accounts` table is the master reference for all posting rules and journal entries
- Account hierarchy stored as `parent_account_id` adjacency list for simplicity, with a materialized path for efficient tree queries
- `fiscal_years` and `fiscal_periods` are prerequisites for any journal entry — a journal entry must reference a valid open period
- Opening balance entries are represented as regular journal entries with a special `entry_type = 'opening_balance'` flag, not as a separate table — this preserves the double-entry model
- Period lock status is a column on `fiscal_periods`; the Posting Engine checks period status before accepting any journal entry

**Dependencies:** None — this is the foundational milestone.

**Estimated Complexity:** High

---

### Milestone 2 — Financial Operations

**Goal:** Implement the core financial transaction workflows: accounts receivable, accounts payable, payments, receipts, and bank account management.

**Key Features:**
- Accounts Receivable — customer invoices, credit notes, customer statements, aging reports (30/60/90/120+ days)
- Accounts Payable — supplier invoices, supplier credit notes, supplier statements, aging reports
- Payments — outgoing payment recording, payment allocation against supplier invoices
- Receipts — incoming payment recording, receipt allocation against customer invoices
- Cash Management — petty cash funds, cash registers, cash transfer between accounts
- Bank Account Management — define and manage company bank accounts (IBAN, bank name, currency, account type)
- Payment Methods — configure payment methods (bank transfer, cheque, cash, SADAD, STC Pay, credit card)
- Payment Terms — standard payment term configurations (Net 30, Net 60, 2/10 Net 30, etc.)
- Partial payments and advance payments
- Write-off functionality for uncollectible receivables

**Architecture Notes:**
- Accounts Receivable and Payable are sub-ledger implementations — each customer and supplier has their own sub-ledger that rolls up to the AR/AP control account in the General Ledger
- All payment and receipt transactions flow through the Posting Engine (Milestone 10) to generate the corresponding journal entries
- Bank account records link to a Chart of Accounts entry so that bank transactions automatically post to the correct GL account
- Payment allocation (matching payments to invoices) is stored in a separate `payment_allocations` table to support partial payments and re-allocation

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine)

**Estimated Complexity:** High

---

### Milestone 3 — Tax Engine

**Goal:** Build a flexible, jurisdiction-aware tax calculation engine with ZATCA compliance as the primary requirement.

**Key Features:**
- VAT calculation — standard rate (15% Saudi VAT), zero-rated, exempt, out-of-scope
- Multiple tax rates — support for different rates on different goods/services categories
- Tax Groups — group multiple taxes that apply together to a transaction line
- Tax Rules — configurable rules determining which tax applies based on document type, party type, item category, and jurisdiction
- Tax Reports — VAT return reports (VAT 301 format), input VAT summary, output VAT summary
- Tax Exemptions — manage tax exemption certificates for customers/suppliers
- Saudi ZATCA Focus:
  - ZATCA Phase 1: QR-code-stamped PDF invoices compliant with ZATCA format requirements
  - ZATCA Phase 2: cryptographic signing, UUID stamping, integration readiness with ZATCA clearance/reporting API
  - Simplified Tax Invoice vs. Standard Tax Invoice distinction
  - Credit note and debit note ZATCA compliance
- Regional Tax Support — architecture supports adding UAE VAT, Bahrain VAT, or other GCC jurisdictions by adding tax rule configurations, not code

**Architecture Notes:**
- Tax engine is a stateless calculation service — given a document and its lines, it returns a tax breakdown; it does not store state itself
- Tax results are stored on the document at calculation time (snapshot approach) to protect historical records from tax rate changes
- ZATCA Phase 2 cryptographic signing uses a certificate chain; private key management follows the security architecture (HSM-compatible key storage, never stored in application environment variables in plaintext)
- Tax posting to the GL uses the Posting Engine — the tax engine produces tax amounts; the Posting Engine generates the journal entries for the VAT liability account

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine)

**Estimated Complexity:** Very High

---

### Milestone 4 — Financial Reporting

**Goal:** Deliver the core financial statements and supporting reports required by management, auditors, and regulatory bodies.

**Key Features:**
- Trial Balance — debit and credit balances per account for any period range; comparative periods
- Balance Sheet — assets, liabilities, and equity as of a given date; comparative periods
- Income Statement (Profit & Loss) — revenues, cost of goods sold, gross profit, operating expenses, EBITDA, net profit; comparative periods
- Cash Flow Statement — operating, investing, and financing activities; direct and indirect methods
- Statement of Changes in Equity
- General Ledger report — full transaction detail per account, per period
- Sub-Ledger reports — AR aging, AP aging, customer statement, supplier statement
- Financial KPIs — current ratio, quick ratio, debt-to-equity, gross margin, net margin, return on assets, days sales outstanding, days payable outstanding
- Scheduled Reports — configure reports to run automatically at period end and be delivered by email or stored to a configured location
- Export — PDF (ZATCA-compliant invoice format where applicable), Excel, CSV
- Report filtering by company, period, cost center, department, project, or any financial dimension

**Architecture Notes:**
- Trial Balance query runs against materialized views refreshed at configurable intervals (or on-demand for real-time) — direct aggregate queries on `journal_lines` at large scale are too slow for interactive use
- Balance Sheet and Income Statement are derived from the Trial Balance by applying account classification rules from the Chart of Accounts
- Cash Flow Statement (indirect method) starts from net income and applies adjustments from a configurable adjustment mapping; direct method reads from bank/cash account transactions
- PDF generation uses the Document & Print Designer infrastructure (Phase 10) for template-based rendering
- All reports are period-aware and respect period locks — reporting on locked periods shows finalized data

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 2 (Financial Operations)

**Estimated Complexity:** High

---

### Milestone 5 — Cost Centers & Financial Dimensions

**Goal:** Implement a flexible, extensible financial dimensions framework that enables multi-dimensional financial analysis without requiring schema changes to add new dimension types.

**Key Features:**
- Cost Centers — assign revenues and expenses to organizational cost units
- Departments — department-level financial tracking and reporting
- Projects — project-based cost and revenue tracking; project profitability reports
- Branches — track financial performance by physical or logical branch location
- Profit Centers — define profit responsibility centers separate from cost centers
- Financial Dimensions as a generic framework — any of the above are instances of the same dimension model
- Dimension-tag data model — journal lines are tagged with dimension values rather than having dedicated dimension columns
- Unlimited future dimension types without schema redesign — adding "Region" or "Product Line" as a dimension type is a configuration operation
- Dimension-filtered reporting — all financial reports can be filtered by any combination of dimension values
- Dimension validation rules — optionally require certain dimensions on journal entries for specific account types
- Dimension hierarchies — organize cost centers in a tree (e.g., "Region > Branch > Department")

**Architecture Notes:**
- The dimension-tag model uses three tables: `financial_dimensions` (dimension type definitions), `dimension_values` (individual values per type), and `transaction_dimension_tags` (many-to-many link between journal lines and dimension values)
- This avoids the anti-pattern of adding columns (`cost_center_id`, `department_id`, `project_id`) to `journal_lines`, which would require a migration for every new dimension type
- Reporting queries join `transaction_dimension_tags` to filter by dimension — indexes on `(journal_line_id, dimension_id, dimension_value_id)` are critical for performance
- Dimension validation rules are stored in a `dimension_validation_rules` table referencing account type or specific accounts; the Posting Engine checks these rules before committing journal entries

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine)

**Estimated Complexity:** Medium

---

### Milestone 6 — Fixed Assets

**Goal:** Implement a complete fixed asset lifecycle management system integrated with the accounting engine.

**Key Features:**
- Asset Register — comprehensive record of all fixed assets (name, category, acquisition date, cost, location, serial number, custodian)
- Asset Categories — define categories (Buildings, Machinery, Vehicles, IT Equipment, Furniture) with default depreciation method and useful life
- Depreciation Methods:
  - Straight-line: equal periodic depreciation over the useful life
  - Declining balance: accelerated depreciation at a fixed percentage of book value
  - Units of production: depreciation based on actual usage (optional)
- Depreciation schedules — generated automatically upon asset creation, visible in full before approval
- Depreciation runs — periodic (monthly/quarterly/annual) automated depreciation posting via the Posting Engine
- Asset Transfers — transfer assets between departments, branches, or cost centers (with GL posting of accumulated depreciation adjustments)
- Asset Disposal — record sale, write-off, or scrapping of assets; calculate gain/loss on disposal; post disposal journal entries
- Asset Maintenance — maintenance history log (does not affect accounting, supports asset management)
- Asset Categories linked to GL accounts — each category maps to an asset account, an accumulated depreciation account, and a depreciation expense account
- Asset revaluation — optional upward/downward revaluation with corresponding GL entries (IFRS compliant)
- Asset impairment — record impairment charges

**Architecture Notes:**
- Depreciation is calculated and posted exclusively through the Posting Engine; no depreciation logic exists in the Fixed Assets module directly
- Asset acquisition posting: debit Asset Account, credit Accounts Payable or Cash
- Depreciation posting: debit Depreciation Expense, credit Accumulated Depreciation
- Disposal posting: debit Accumulated Depreciation, debit/credit Gain/Loss on Disposal, credit Asset Account
- `asset_depreciation_schedules` table stores the full schedule at creation; actual depreciation runs update `actual_posted` flag per schedule line

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine), Milestone 5 (Financial Dimensions for department/cost center allocation)

**Estimated Complexity:** High

---

### Milestone 7 — Inventory Costing

**Goal:** Integrate inventory valuation into the accounting engine and implement configurable costing methods with automatic GL posting for all inventory movements.

**Key Features:**
- Cost Methods:
  - Weighted Average Cost (WAC) — most common in Saudi ERP deployments
  - First-In First-Out (FIFO) — required for some product categories
  - Standard Cost — manufacturing and process industry support; variance analysis
- Landed Cost — allocate additional costs (freight, customs, insurance) to the cost of received inventory; distribute across items by quantity, weight, or value
- Inventory Valuation Report — value of on-hand inventory by cost method, by location, by item category
- Cost Adjustments — record price corrections for historical receipts; post adjustment journal entries
- Inventory Write-Down — record obsolescence or damage write-down; post to Inventory Write-Down expense account
- Integration with Inventory module (Phase 3–6 roadmap):
  - Goods Receipt → debit Inventory Asset, credit Goods Receipt Clearing
  - Goods Issue/COGS → debit Cost of Goods Sold, credit Inventory Asset
  - Inventory Adjustment → debit/credit Inventory Adjustment account
  - Transfer between locations → internal journal entries if locations have different cost centers
- Cost Layer Management (FIFO) — maintain cost layers per lot/batch; consume in acquisition order

**Architecture Notes:**
- This milestone has the most critical integration point with the existing Inventory roadmap (Phases 3–6); it must be coordinated with those phases
- The Inventory module raises business events (e.g., `GoodsReceiptPosted`, `SalesDeliveryConfirmed`); the Posting Engine consumes these events and applies inventory costing logic to generate journal entries
- Costing method is configurable per item category, not system-wide — this allows different costing methods for finished goods vs. raw materials vs. merchandise
- Standard cost variances (purchase price variance, usage variance) are posted to dedicated variance GL accounts

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine), Phase 3–6 Inventory Roadmap (external dependency)

**Estimated Complexity:** Very High

---

### Milestone 8 — Budget & Forecasting

**Goal:** Implement a structured budget management system with multi-version support, budget vs. actual analysis, and scenario-based forecasting.

**Key Features:**
- Budget Management — define budgets by fiscal year, fiscal period, account, and financial dimension
- Budget Versions — maintain multiple versions of the same budget (Initial, Revised Q1, Revised Q2, Final) with version history and comparison
- Budget vs. Actual — real-time comparison of budgeted amounts against actual journal entries; variance reporting (amount and percentage)
- Budget Approval Workflow — budgets go through an approval process before becoming the active version (uses Milestone 11 Workflow Engine)
- Budget Copying — copy and adjust previous year's budget as the starting point for the new year
- Forecasting — rolling forecasts that combine actuals for completed periods with projections for future periods
- Cash Flow Forecast — project cash inflows and outflows by period based on outstanding AR, AP, and budget projections
- Scenario Planning — maintain named scenarios (Optimistic, Base, Pessimistic) as distinct budget versions
- Budget Alerts — notify budget owners when actuals approach or exceed budget thresholds
- Department/Cost Center Budgets — dimension-level budgets for granular control
- Capital Expenditure Budget — separate capex budget tracking against Fixed Assets (Milestone 6)

**Architecture Notes:**
- `budget_headers` stores the budget metadata (fiscal year, version, status, approval)
- `budget_lines` stores the budgeted amount per account per period; indexed on `(budget_header_id, account_id, period_id, dimension_value_id)` for fast comparison queries
- Budget vs. actual query joins `budget_lines` against the materialized trial balance view — this avoids re-aggregating journal_lines at query time
- Budget enforcement (hard stop vs. warning vs. no enforcement) is configurable per account group

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 4 (Financial Reporting), Milestone 5 (Financial Dimensions), Milestone 11 (Workflow Engine)

**Estimated Complexity:** Medium

---

### Milestone 9 — Treasury Management

**Goal:** Implement treasury functions including bank reconciliation, inter-bank transfers, cash position management, and financial instruments tracking.

**Key Features:**
- Bank Reconciliation — match bank statement transactions against GL entries; identify unreconciled items; produce reconciliation report
- Bank Statement Import — import bank statements in MT940, CAMT.053, or CSV format; automatic matching against GL entries
- Bank Transfers — record and post inter-bank transfers with proper GL entries; handle in-transit amounts
- Cash Management — cash position dashboard by bank account and currency; projected cash position
- Loans — record loan drawdowns, scheduled repayments, interest accruals; amortization schedule
- Investments — track short-term investments (treasury bills, time deposits); interest income accrual
- Bank Guarantees — record bank guarantees issued and received; track expiry dates; set reminder alerts
- Letters of Credit — record LCs for import/export; track utilization and expiry
- Cash Flow Actual vs. Forecast — compare actual cash movements to the Cash Flow Forecast from Milestone 8

**Architecture Notes:**
- Bank reconciliation is a matching algorithm: it compares `bank_statement_lines` (imported from the bank) against `journal_lines` on bank accounts; matches are stored in a `bank_reconciliation_matches` table
- Reconciliation status is stored per statement line and per GL line independently — a GL line can be unreconciled even after the bank statement period has passed
- Loan amortization schedules are generated at loan creation (similar to asset depreciation schedules); actual interest accrual entries are posted by the Posting Engine on schedule

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 2 (Financial Operations), Milestone 10 (Posting Engine)

**Estimated Complexity:** High

---

### Milestone 10 — Accounting Posting Engine

**Goal:** Build the central, configurable, event-driven engine that translates every business event in the ERP into balanced, immutable, auditable journal entries — the most critical architectural component of the entire accounting initiative.

**Key Features:**

**Centralized Posting Engine:**
Every ERP module generates journal entries exclusively through this engine. No module (Inventory, Sales, Purchasing, Payroll, Fixed Assets) contains journal creation logic directly. This is a hard architectural constraint enforced by code review and, where possible, by type-system boundaries.

**Posting Rules:**
Configurable mapping rules stored in the database that define:
- **Trigger Event** — which business event triggers posting (e.g., `SalesInvoicePosted`, `GoodsReceiptApproved`, `PaymentConfirmed`)
- **Condition** — optional conditions on the event payload (e.g., "only if item category is 'Inventory'", "only if payment method is 'Bank Transfer'")
- **Journal Entry Template** — the set of debit and credit lines to generate, with configurable account resolution (account lookup by type, by document party, by item category)
- **Dimension Tagging Rules** — which financial dimensions to apply to each generated journal line

**Journal Generator:**
- Deterministic — the same event with the same payload always produces the same journal entries
- Idempotent — posting the same event twice does not create duplicate journal entries (enforced via `source_document_id` + `source_event_type` unique constraint on `journal_entries`)
- Transactional — the entire journal entry (all lines) is written in a single database transaction; partial writes are impossible

**Automatic Posting:**
- Journal entries are created automatically when triggering events occur (document approval, goods receipt confirmation, payment posting)
- Asynchronous posting option: for high-volume events (e.g., bulk inventory adjustments), posting can be queued and processed asynchronously without blocking the user

**Posting Simulation (Dry Run):**
- Before any document is posted, the Posting Engine can be called in dry-run mode
- Returns the exact journal entries that would be created, without committing them
- UI presents the preview to the user before final confirmation

**Reverse Posting:**
- Reversing a financial document creates explicit compensating journal entries (debit ↔ credit swapped) with a reference to the original entry
- Hard deletion of journal entries is never permitted
- Reverse posting is an atomic operation: original entry is marked `reversed = true`, compensating entry is created in the same transaction

**Accounting Mapping:**
- The mapping between document types and account types is fully configurable in the Posting Rules table
- Example: "Sales Invoice" maps to "Accounts Receivable (AR Control)" on the debit side and "Revenue" on the credit side; the specific account number within AR Control is resolved by looking up the customer's assigned AR account
- Account resolution hierarchy: specific account on the document → party-level default account → account type default → system-level fallback

**Architecture Invariant:**
Business modules raise events. The Posting Engine consumes events. Journal entries are never created outside the Posting Engine.

```
[Sales Module]          → raises: SalesInvoicePosted { invoice_id, amount, tax, customer_id, ... }
[Inventory Module]      → raises: GoodsReceiptPosted { receipt_id, lines: [{ item_id, qty, unit_cost }] }
[Purchasing Module]     → raises: SupplierInvoicePosted { invoice_id, amount, supplier_id, ... }
                                    ↓
                        [Posting Engine]
                        1. Match event to Posting Rules
                        2. Resolve accounts (Chart of Accounts lookup)
                        3. Resolve dimensions (dimension rules)
                        4. Generate journal entry lines
                        5. Validate balance (Σdebits = Σcredits)
                        6. Check period open
                        7. Write journal_entries + journal_lines atomically
                        8. Emit: JournalEntryCreated event
```

**Architecture Notes:**
- Posting Rules are stored in `posting_rules` (header) and `posting_rule_lines` (line template per rule); this data-driven approach allows adding new posting rules without code changes
- The Posting Engine is a pure service function: `postingEngine.post(event: BusinessEvent): Promise<JournalEntry>` — no side effects beyond the journal entry write and the `JournalEntryCreated` event
- Account resolution is a pluggable resolver chain: `[DocumentSpecificAccountResolver, PartyDefaultAccountResolver, AccountTypeDefaultResolver, SystemFallbackResolver]`
- Idempotency key: `(source_document_type, source_document_id, source_event_type)` — unique constraint prevents duplicate entries
- Posting Engine exposes a simulation endpoint used by the UI's dry-run preview feature

**Dependencies:** Milestone 1 (Accounting Foundation)

**Estimated Complexity:** Very High

---

### Milestone 11 — Workflow & Approval Engine

**Goal:** Build a generic, reusable workflow and approval engine for financial documents, designed to be extensible to other ERP domains beyond finance.

**Key Features:**
- Financial Workflows — configurable approval workflows for journal entries, payment requests, budget approvals, and asset acquisitions
- Multi-Level Approvals — define sequential or parallel approval stages
- Approval Matrix — route approvals based on document type, amount threshold, department, cost center, or any financial dimension
- Approval Matrix Examples:
  - Journal entries > SAR 50,000 require Finance Manager approval
  - Capital expenditures > SAR 100,000 require CFO approval
  - Intercompany journal entries require both originating and receiving company finance manager approval
- Notifications — in-app and email notifications for pending approvals, approvals granted, and rejections
- Escalation — automatically escalate overdue approvals to the next level after a configurable time period
- Delegation — users can delegate their approval authority to a substitute during absence, with a defined delegation period
- Approval Comments — approvers can add comments at each stage; comments are part of the audit trail
- Rejection and Recall — approvers can reject a document with a required reason; document originators can recall a document before it reaches final approval
- Audit Trail Integration — every approval action is written to the immutable audit trail (Milestone 13)

**Architecture Notes:**
- The Workflow Engine is designed as a generic engine, not a finance-specific one — it operates on "documents" with "states" and "transitions", where the specifics of what document type is involved are a configuration concern
- Workflow definitions are stored as state machine configurations: `workflow_definitions` (name, document_type, initial_state), `workflow_states` (state name, terminal flag), `workflow_transitions` (from_state, to_state, required_role, amount_threshold)
- The engine is reusable beyond finance: Purchasing (PO approval), HR (leave approval), and other future modules can use the same engine
- Approval decisions trigger business events that the Posting Engine may consume (e.g., `JournalEntryApproved` triggers posting)

**Dependencies:** Milestone 1 (Accounting Foundation)

**Estimated Complexity:** High

---

### Milestone 12 — Reconciliation Center

**Goal:** Provide a unified reconciliation workspace that gives accountants a single interface to resolve discrepancies across all reconciliation types.

**Key Features:**
- Bank Reconciliation — enhanced version of the bank reconciliation in Milestone 9; interactive matching UI with drag-and-drop matching, automatic matching suggestions, and batch match confirmation
- Customer Reconciliation — match customer payments and credit notes against outstanding invoices; identify and resolve disputes; produce customer balance confirmation letters
- Supplier Reconciliation — match supplier payments and debit notes against outstanding supplier invoices; reconcile Sefay records against supplier statements
- Ledger Reconciliation — reconcile sub-ledger balances against control account balances (AR sub-ledger total = AR control account balance); automated daily check
- Inventory Reconciliation — reconcile physical inventory count results against the GL inventory asset account; post adjustment entries for variances
- Reconciliation Dashboard — consolidated view of all open reconciliation items across all types; status indicators, overdue alerts, reconciliation completion percentages
- Automated Matching Rules — configure rules for automatic matching (e.g., match by reference number, by amount, by date range)
- Unreconciled Item Aging — track how long items have been unreconciled; escalate items older than configurable thresholds

**Architecture Notes:**
- Reconciliation is a read-heavy, comparison-heavy workload; queries should run against dedicated read replica or materialized views
- Reconciliation matches are stored as a separate `reconciliation_matches` table rather than mutating the original transaction records — this preserves the immutability of journal entries while recording the reconciliation relationship
- The Reconciliation Center's matching algorithm is pluggable — new matching strategies (exact match, fuzzy match by amount ±tolerance, reference pattern match) can be added without changing the reconciliation framework

**Dependencies:** Milestone 2 (Financial Operations), Milestone 9 (Treasury Management), Milestone 7 (Inventory Costing)

**Estimated Complexity:** High

---

### Milestone 13 — Audit & Compliance

**Goal:** Implement an immutable audit trail and a compliance framework that supports multiple accounting standards and jurisdictions without hardcoding any single standard.

**Key Features:**

**Audit Trail:**
- Immutable, append-only record of every change to every financial record
- Before/after state recorded for every update
- User identity, timestamp (UTC), IP address, session ID, and action type recorded for every audit event
- Database-level enforcement: triggers prevent `DELETE` on financial core tables; direct `UPDATE` without routing through the service layer is blocked by Row Level Security policies that revoke direct table write access from the application database user
- Audit log is stored in a separate `audit_log` table that is never exposed to direct modification by application code
- Audit log search: query audit log by user, date range, document type, document ID, or action type

**Journal Versioning:**
- Every journal entry retains its full history: when it was created, when it was reversed, which user performed each action
- Version history is queryable from the UI for auditors

**Compliance Frameworks:**
- IFRS — account classification, financial statement presentation, disclosure requirements (partially automated)
- GAAP — alternative presentation option for multinational companies operating under US GAAP
- ZATCA Phase 1 — QR-code-stamped invoices, correct invoice format, Arabic field requirements
- ZATCA Phase 2 — cryptographic signing, UUID, clearance API integration, reporting API integration
- SAF-T (Standard Audit File for Tax) — export financial data in SAF-T format for tax authority requests (relevant for GCC countries implementing SAF-T)
- XBRL — export financial statements in XBRL format for regulatory reporting (preparatory support)

**Compliance Framework Design:**
- Compliance frameworks are implemented as configurable rule sets, not hardcoded logic
- Adding a new jurisdiction (e.g., UAE Federal Tax Authority requirements) requires adding a compliance rule configuration, not modifying core code
- Compliance checks run as a validation layer before period close (Milestone 17 Financial Closing Center)

**Architecture Notes:**
- Audit log table uses a UUID primary key and is partitioned by month for performance on large audit histories
- ZATCA Phase 2 cryptographic signing requires integration with a PKI service; private keys are never stored in the application database; key management follows the Security Architecture document
- SAF-T export is a bulk data extraction job triggered on demand; it runs asynchronously and delivers the result as a downloadable file via the StorageProvider

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 3 (Tax Engine for ZATCA)

**Estimated Complexity:** Very High

---

### Milestone 14 — Advanced Finance

**Goal:** Implement sophisticated accounting treatments required by IFRS and professional financial management: revenue recognition, deferred items, accruals, and cost allocations.

**Key Features:**
- Revenue Recognition — configurable revenue recognition rules (point in time vs. over time); recognize revenue when performance obligations are met; IFRS 15 compliance
- Deferred Revenue — automatically create deferred revenue liability on invoice; recognize revenue ratably over the service period via scheduled journal entries
- Accruals — record estimated expense or revenue before the actual transaction; reverse accrual automatically at the start of the next period
- Deferrals — defer expense or revenue recognition to future periods; amortize over the deferral period
- Recurring Journals — define journal entry templates that repeat on a schedule (monthly rent, depreciation accrual, insurance amortization); the Posting Engine executes these on schedule
- Allocations — allocate shared costs (e.g., building overhead) across multiple cost centers, departments, or projects according to configurable allocation keys (headcount, floor area, revenue percentage)
- Cost Allocation Methods:
  - Fixed percentage allocation
  - Variable allocation (recalculated each period based on current drivers)
  - Sequential allocation (allocate one pool, then the result feeds the next pool)
- Allocation Journals — allocation runs produce journal entries that are auditable and reversible like any other journal entry

**Architecture Notes:**
- Recurring journals are managed by a scheduler that runs at period start; the Posting Engine executes the journal template with current period dates
- Revenue recognition schedules are stored similarly to asset depreciation schedules — generated at contract/invoice creation, updated as recognition events occur
- Allocations run as a batch job after period end; allocation results are journal entries posted through the Posting Engine, not side-effect updates to original entries

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine), Milestone 5 (Financial Dimensions)

**Estimated Complexity:** Very High

---

### Milestone 15 — Enterprise Finance

**Goal:** Extend the accounting engine to support multi-currency transactions, exchange rate management, intercompany accounting, and financial consolidation across multiple legal entities.

**Key Features:**
- Multi-Currency:
  - Functional currency per company (SAR for Saudi entities)
  - Transaction currency on any document
  - Exchange rate tables — daily, monthly average, period-end rates; manual and automatically fetched rates
  - Foreign currency revaluation — revalue open AR, AP, and bank balances at period-end exchange rates; post foreign exchange gain/loss
  - Realized and unrealized FX gain/loss tracking and reporting
- Intercompany Accounting:
  - Record transactions between legal entities within the same group
  - Automatic creation of intercompany payable/receivable on both sides of the transaction
  - Intercompany reconciliation — match intercompany balances and flag discrepancies
  - Intercompany elimination journals for consolidation
- Financial Consolidation:
  - Consolidate financial statements across multiple legal entities
  - Eliminate intercompany transactions and balances
  - Minority interest calculation
  - Currency translation adjustment (CTA) for subsidiaries reporting in non-functional currency
- Multi-Company — full data isolation between companies; shared chart of accounts (optional group chart of accounts with local extensions)
- Multi-Ledger — maintain multiple accounting ledgers per company (e.g., statutory ledger + management ledger with different accounting treatments)

**Architecture Notes:**
- `company_id` on every financial table (established from Milestone 1) is the foundation for multi-company; no retroactive migration needed
- Exchange rate storage: `exchange_rates` table with `(from_currency, to_currency, rate_type, effective_date, rate)` — queried by date proximity for any historical transaction
- Intercompany transactions require a `intercompany_partner_company_id` field on documents; the Posting Engine generates journal entries in both the originating and receiving company's ledger in a distributed transaction (or a saga pattern if cross-database)
- Consolidation runs as a batch job; consolidation journal entries are stored in a separate consolidation ledger that is not mixed with statutory ledger entries
- This milestone depends on the multi-company model described in `docs/architecture/tenant-architecture.md`

**Dependencies:** Milestone 1, Milestone 10, Milestone 2, docs/architecture/tenant-architecture.md

**Estimated Complexity:** Very High

---

### Milestone 16 — Financial Workspace

**Goal:** Deliver role-based financial workspaces that give each financial persona a tailored, productive interface surfacing the data, tasks, and tools most relevant to their role.

**Key Features:**

**Accountant Workspace:**
- Pending journal entries awaiting approval
- Unposted transactions requiring action
- Bank reconciliation outstanding items
- Recent journal entries with quick drill-down
- Period status (open/closed) indicator
- Quick access: New Journal Entry, New Payment, New Receipt, Import Journals

**Finance Manager Workspace:**
- Pending approvals across all document types
- Budget vs. actual summary by department
- Cash position by bank account
- Overdue AR and AP aging summaries
- Financial KPI tiles (gross margin, net margin, DSO, DPO)
- Period-close progress (from Milestone 17 Closing Center)
- Quick access: Approval Queue, Budget Dashboard, Cash Flow

**CFO Workspace:**
- Executive financial summary — P&L, balance sheet key metrics, cash position
- Trend analysis — revenue, expense, and profit trend lines (last 12 months)
- Entity comparison — performance across companies/branches (multi-company)
- Financial risk indicators — overdue AR, covenant compliance, working capital ratio
- Forecast vs. actual summary
- Quick access: Consolidated Reports, Scenario Planning, Financial Analytics

**Auditor Workspace:**
- Read-only access to all financial records
- Audit trail search and export
- Journal entry detail with full posting history
- Period-close documentation access
- Compliance check results
- Financial statement export (PDF, Excel)
- Document-level comment and query submission

**Architecture Notes:**
- Each workspace is a role-gated route group; RLS policies enforce the read-only nature of the Auditor workspace at the database level
- Workspace layouts are implemented as configurable dashboard grids — layout configuration is stored per user, per role, allowing personalization within role constraints
- KPI tiles and summary widgets are backed by materialized views; workspaces load with pre-aggregated data, not live aggregate queries
- Workspace navigation is period-aware — the currently selected fiscal period is a global context variable accessible throughout the workspace

**Dependencies:** Milestone 4 (Financial Reporting), Milestone 8 (Budget), Milestone 13 (Audit & Compliance)

**Estimated Complexity:** Medium

---

### Milestone 17 — Financial Closing Center

**Goal:** Implement a centralized, structured period-closing workflow that ensures all required steps are completed and validated before a fiscal period can be locked.

**Key Features:**
- Closing Checklist — configurable list of tasks required before period close (e.g., "All bank accounts reconciled", "Depreciation run completed", "Accruals posted", "AR aging reviewed")
- Closing Task Assignment — assign closing tasks to specific users with due dates
- Validation Rules — automated pre-close checks run before the period lock is permitted:
  - Trial balance balances (Σdebits = Σcredits)
  - No unposted transactions in the period
  - All bank accounts reconciled for the period
  - Depreciation run completed
  - Required sub-ledger reconciliations completed
  - No workflow items pending approval for documents in the period
- Dependency Validation — period cannot be locked if any prerequisite step is incomplete; dependencies are explicit and enforced by the Closing Center, not by convention
- Period Lock — once all validation rules pass and the checklist is complete, the Finance Manager or CFO can lock the period; the lock is recorded with user identity and timestamp
- Reopen Process — reopening a locked period requires explicit authorization (CFO or system admin), mandatory reason entry, and is recorded in the audit trail
- Closing Dashboard — visual progress indicator showing which closing tasks are complete, in progress, or blocked; traffic-light status per task
- Closing Notes — free-text notes attached to the period close record for auditor reference
- Multi-Entity Coordination — for multi-company deployments, track closing progress per entity and at the group level

**Architecture Notes:**
- Closing checklist definitions are stored in `closing_checklist_templates`; instances per period are created in `closing_period_checklists`
- Automated validation rules are stored as executable rule definitions — new validation rules can be added without code changes for rules that can be expressed as SQL queries or named service checks
- The period lock status on `fiscal_periods` is the authoritative gate checked by the Posting Engine before accepting any journal entry; the Closing Center's lock action is what sets this status
- Reopen audit entries are written to both the `audit_log` and as a special `journal_entry` record type (informational, non-posting)

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 4 (Reporting), Milestone 9 (Treasury/Bank Reconciliation), Milestone 6 (Fixed Assets/Depreciation), Milestone 13 (Audit)

**Estimated Complexity:** Medium

---

### Milestone 18 — Journal Import Center

**Goal:** Provide a robust, user-friendly bulk journal entry import capability with preview, validation, field mapping, and full rollback support.

**Key Features:**
- Excel Import — upload `.xlsx` files with journal entry data; support common column layouts
- CSV Import — upload `.csv` files; configurable delimiter and encoding
- Import Template Download — provide downloadable Excel/CSV templates with the correct column structure and data validation rules
- Field Mapping — interactive column mapping UI: user maps source file columns to system fields (account code, description, debit, credit, date, cost center, etc.)
- Saved Mapping Profiles — save column mapping configurations for reuse (e.g., "Payroll Import Format", "ERP Migration Format")
- Preview — show a preview of the parsed and mapped journal entries before import; display all detected errors and warnings
- Validation — check each line for:
  - Valid account codes (exist in Chart of Accounts, account is active and not locked)
  - Balanced entry (Σdebits = Σcredits per journal entry)
  - Open period (date falls in an open fiscal period)
  - Required dimensions present (if dimension validation rules require them)
  - No duplicate entries (idempotency check)
- Import Modes — "All or nothing" (fail the entire import if any line has an error) or "Skip invalid" (import valid entries, log skipped entries)
- Import History — record of all import operations: who imported, when, file name, number of entries created, number of errors, final status
- Rollback — each import batch is tagged with an `import_batch_id`; a complete import can be reversed by reverse-posting all journal entries in the batch
- Integration with Import Center Pattern — follows the same UX and technical pattern as the Smart Import Center initiative (if that initiative is implemented)

**Architecture Notes:**
- File parsing runs server-side; never parse untrusted financial data in the browser
- Large files (thousands of journal entries) are processed as background jobs; the UI shows progress and notifies on completion
- Validation errors are returned as a structured error report that can be downloaded as a corrected template
- The import service calls the Posting Engine for each journal entry — it does not bypass the Posting Engine to write journal entries directly

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine)

**Estimated Complexity:** Medium

---

### Milestone 19 — Accounting Templates

**Goal:** Provide a library of reusable, configurable journal entry templates for recurring accounting transactions to reduce manual data entry and human error.

**Key Features:**
- Template Library — system-provided templates for common recurring entries:
  - Payroll posting (salary expense, GOSI contribution, net pay payable)
  - Monthly rent expense
  - Utilities expense accrual
  - Insurance premium amortization
  - Depreciation accrual (for monthly depreciation booking outside the Fixed Assets module's automated run)
  - Interest expense accrual
  - Deferred revenue recognition
  - Prepaid expense amortization
- Custom Templates — users can create their own templates from any existing journal entry
- Template Parameters — templates support variable fields (amount, date, description, cost center) that are filled in at the time of use
- Template-to-Journal — applying a template creates a draft journal entry pre-filled with the template's account lines; the user reviews, adjusts if needed, and approves
- Recurring Schedule — attach a recurring schedule to a template (monthly on the last day, quarterly on the 15th) for automated draft creation; the created draft still requires human review and approval before posting
- Template Versioning — track changes to templates over time; understand which version of a template was used for any given journal entry
- Template Approval — changes to templates can be subject to a workflow approval to prevent unauthorized modifications to standard accounting treatments

**Architecture Notes:**
- Templates are stored as structured data (account line items with configurable amount expressions), not as code
- The template engine resolves parameter expressions at instantiation time — e.g., `{amount} * 0.115` for a GOSI contribution line based on the gross salary amount parameter
- Recurring schedule execution is handled by the same scheduler used by Milestone 14 (Advanced Finance) recurring journals

**Dependencies:** Milestone 1 (Accounting Foundation), Milestone 10 (Posting Engine), Milestone 11 (Workflow Engine)

**Estimated Complexity:** Low

---

### Milestone 20 — Financial API

**Goal:** Expose a comprehensive, well-documented API layer for financial data and operations, enabling banking integrations, payroll system integrations, government reporting integrations, and third-party developer access.

**Key Features:**

**Public API:**
- RESTful API for financial data access (accounts, journal entries, financial reports, budgets, assets)
- OAuth 2.0 / API key authentication for external systems
- Rate limiting and quota management per API client
- API versioning to support backward compatibility
- Webhook subscriptions — notify external systems of financial events (invoice posted, payment received, journal entry approved)
- Comprehensive API documentation (OpenAPI 3.0 specification)

**Internal API:**
- Internal service-to-service API used by other Sefay modules to raise events consumed by the Posting Engine
- Type-safe event schema definitions shared across modules

**Banking Integrations:**
- Open Banking API connectivity — connect to bank account data via standardized open banking APIs (where available in Saudi Arabia/GCC)
- Bank Feed — automatic daily import of bank transactions for bank reconciliation
- Payment initiation — initiate outgoing payments directly from Sefay via banking API (subject to bank partnership agreements)

**Payroll Integrations:**
- API endpoint to receive payroll journal data from external payroll systems
- Structured payroll posting schema: salary lines, deduction lines, GOSI lines, net pay lines
- Idempotent payroll import (re-submitting the same payroll period does not create duplicate entries)

**Government Integrations:**
- ZATCA e-invoicing API — submit invoices to ZATCA clearance and reporting APIs (Phase 2)
- ZATCA VAT return — submit VAT return data in required format
- GAZT/ZAKAT portal integration (future, as regulatory APIs become available)

**Webhooks:**
- Configurable webhook endpoints per event type
- Webhook delivery with retry logic and delivery log
- Webhook signature verification for receiving systems

**Architecture Notes:**
- The Financial API does not bypass the Posting Engine or service layer — it calls the same services used by the UI
- API responses for financial data always include the `company_id` context; cross-company data access is not permitted via the API without explicit multi-company authorization
- ZATCA API integration uses the cryptographic signing infrastructure from Milestone 13 (Audit & Compliance)

**Dependencies:** Milestone 10 (Posting Engine), Milestone 3 (Tax Engine/ZATCA), Milestone 13 (Audit & Compliance)

**Estimated Complexity:** Very High

---

### Milestone 21 — Financial Analytics

**Goal:** Deliver an executive-level financial analytics layer with rich visualizations, drill-down capabilities, and financial performance metrics beyond standard reports.

**Key Features:**
- Executive Financial Dashboard — high-level financial summary: revenue, gross profit, net profit, cash position, AR/AP balances, key ratios; configurable date range and entity scope
- Profitability Analysis:
  - Profitability by product line, customer segment, project, branch, cost center
  - Contribution margin analysis
  - Gross margin trend by period
- Financial KPI Library — pre-built KPIs with configurable thresholds and trend indicators:
  - Liquidity: Current Ratio, Quick Ratio, Cash Ratio
  - Efficiency: DSO, DPO, Inventory Turnover, Asset Turnover
  - Leverage: Debt-to-Equity, Interest Coverage
  - Profitability: Gross Margin, EBITDA Margin, Net Margin, ROA, ROE
- Cash Flow Analytics — visualize cash inflows and outflows by category; cash burn rate; cash runway projection
- Financial Performance Metrics — period-over-period comparison; year-to-date vs. prior year; budget vs. actual vs. forecast in a single chart
- Drill-Down — click any metric to drill from summary → report → individual transaction
- Custom Charts — finance users can configure custom metric combinations
- Report Scheduling from Analytics — schedule any analytics view to be delivered by email

**Architecture Notes:**
- Analytics queries are served from a dedicated analytics read replica or materialized view layer — never from the transactional database
- KPI calculations are pre-computed on a schedule (hourly, daily) and stored in a `financial_kpi_snapshots` table; real-time calculation is available on demand but carries a performance cost
- Drill-down navigation uses a consistent URL parameter scheme so that any analytics view can be bookmarked and shared

**Dependencies:** Milestone 4 (Financial Reporting), Milestone 5 (Financial Dimensions), Milestone 8 (Budget & Forecasting), Milestone 16 (Financial Workspace)

**Estimated Complexity:** High

---

### Milestone 22 — AI Finance

**Goal:** Embed AI-powered financial intelligence into the accounting system to assist accountants, detect anomalies, provide insights, and accelerate routine financial tasks.

**Key Features:**
- AI Financial Assistant — natural language interface for financial queries: "What was our gross margin last quarter compared to Q3 last year?", "Show me all journal entries posted by user X in October", "Which cost centers exceeded their budget this month?"
- Financial Insights — AI-generated narrative summaries of financial performance at period close: "Revenue grew 12% month-over-month, driven primarily by the Riyadh branch. Operating expenses increased by 8%, with the largest variance in marketing spend."
- Fraud Detection — AI model monitors journal entries for anomalous patterns: unusual posting times, unusual amounts, unusual account combinations, round-number entries, entries with no business description
- Anomaly Detection — flag statistical outliers in financial data: unusual expense spikes, accounts with unexpected activity, journal entries that deviate from historical patterns for the account
- Cash Flow Forecasting (AI-enhanced) — use historical cash flow patterns and outstanding AR/AP data to produce AI-enhanced cash flow forecasts beyond the rule-based forecast in Milestone 8
- Journal Suggestions — when a user begins typing a journal entry, suggest account codes, amounts, and dimension tags based on historical patterns for similar entries
- AI Financial Copilot — embedded assistant in the Accountant and Finance Manager workspaces; answers questions, explains variances, suggests actions, and helps with reconciliation decisions

**Architecture Notes:**
- All LLM calls use the AI provider abstraction layer defined in `docs/architecture/ai-architecture.md` — the AI Finance milestone never calls a specific LLM provider API directly
- Financial data sent to LLM providers is anonymized or summarized where possible; full transaction details are handled by local embedding/retrieval, with only summaries sent to external models
- Fraud and anomaly detection models can be implemented as SQL-based statistical rules, dedicated ML models, or LLM-based pattern recognition — the choice is an implementation detail deferred to the implementation phase
- Journal suggestion uses a vector similarity search against historical journal entries; the embedding model and vector store are managed through the AI architecture abstraction

**Dependencies:** Milestone 10 (Posting Engine), Milestone 4 (Reporting), Milestone 21 (Financial Analytics), docs/architecture/ai-architecture.md

**Estimated Complexity:** Very High

---

## Functional Requirements Summary

| Category | Key Requirements |
|---|---|
| **Accounting Foundation** | Double-entry integrity enforced at DB level; fiscal period management; opening balances; period locking |
| **Financial Operations** | Full AR/AP lifecycle; payment matching; aging reports; cash management |
| **Tax Engine** | ZATCA Phase 1 and 2; multiple tax rates; tax groups; exempt/zero-rated; regional extensibility |
| **Financial Reporting** | Trial Balance, Balance Sheet, P&L, Cash Flow; period-comparative; export PDF/Excel/CSV |
| **Financial Dimensions** | Dimension-tag model; unlimited dimension types; dimension-filtered reporting; dimension hierarchies |
| **Fixed Assets** | Asset register; straight-line and declining balance depreciation; disposal; transfer; revaluation |
| **Inventory Costing** | WAC, FIFO, Standard Cost; landed cost; inventory valuation; integration with Inventory module |
| **Budget & Forecasting** | Multi-version budgets; budget vs. actual; rolling forecasts; scenario planning; budget alerts |
| **Treasury** | Bank reconciliation; bank transfers; loans; guarantees; cash position; LC management |
| **Posting Engine** | Centralized; configurable rules; idempotent; dry-run; reverse posting; event-driven |
| **Workflow & Approvals** | Multi-level; approval matrix; escalation; delegation; generic (reusable beyond finance) |
| **Reconciliation** | Bank, customer, supplier, ledger, inventory reconciliation; automated matching rules |
| **Audit & Compliance** | Immutable audit trail; IFRS, GAAP, ZATCA, SAF-T, XBRL; jurisdiction-extensible |
| **Advanced Finance** | Revenue recognition (IFRS 15); deferred items; accruals; recurring journals; cost allocations |
| **Enterprise Finance** | Multi-currency; FX revaluation; intercompany; financial consolidation; multi-ledger |
| **Financial Workspaces** | Role-based (Accountant, Finance Manager, CFO, Auditor); dashboard tiles; period-aware |
| **Closing Center** | Structured checklist; automated validation; dependency enforcement; audit-recorded lock/reopen |
| **Journal Import** | Excel/CSV; field mapping; preview; validation; rollback; import history |
| **Accounting Templates** | System and custom templates; parameters; recurring schedules; template versioning |
| **Financial API** | Public REST API; webhooks; banking; payroll; ZATCA API; OpenAPI documentation |
| **Financial Analytics** | Executive dashboard; profitability analysis; KPI library; drill-down; cash flow analytics |
| **AI Finance** | Natural language queries; anomaly detection; fraud detection; journal suggestions; AI copilot |

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Trial Balance Query Time** | < 2 seconds for any single company, single period |
| **Journal Entry Creation Throughput** | > 1,000 journal entries per minute through the Posting Engine under load |
| **Financial Report Generation** | Balance Sheet and P&L < 5 seconds for a full fiscal year at < 500,000 journal entries |
| **Audit Trail Write Latency** | < 100ms additional latency per financial write operation due to audit logging |
| **API Response Time (P95)** | < 500ms for all standard API endpoints |
| **Uptime** | 99.9% uptime for all accounting services during business hours |
| **Data Integrity** | Zero tolerance for unbalanced journal entries (enforced by DB constraint, not application code) |
| **Localization** | Full Arabic (RTL) support across all accounting screens; number columns remain LTR |
| **Accessibility** | WCAG 2.1 AA compliance for all financial UI components |
| **Security** | All financial data access governed by RLS; no financial data accessible outside tenant boundaries |
| **Backup and Recovery** | RPO < 1 hour; RTO < 4 hours for accounting data |
| **ZATCA Compliance** | 100% of issued invoices meet ZATCA format requirements at the time of submission |

---

## Suggested Database Design

The following is a high-level description of the core tables. Column lists are indicative, not exhaustive.

### Core Accounting Tables

```sql
-- Chart of Accounts
chart_of_accounts (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  account_code VARCHAR(20) NOT NULL,
  account_name_ar TEXT NOT NULL,
  account_name_en TEXT NOT NULL,
  account_type ENUM('asset','liability','equity','revenue','expense','contra') NOT NULL,
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  materialized_path TEXT NOT NULL,  -- e.g. '1.1.1.' for fast tree queries
  is_active BOOLEAN DEFAULT TRUE,
  allow_direct_posting BOOLEAN DEFAULT TRUE,  -- false for group/header accounts
  currency_code CHAR(3) DEFAULT 'SAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, account_code)
)

-- Fiscal Years
fiscal_years (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('open','closed') DEFAULT 'open',
  locked_at TIMESTAMPTZ,
  locked_by_user_id UUID REFERENCES users(id)
)

-- Fiscal Periods
fiscal_periods (
  id UUID PRIMARY KEY,
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  period_number INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('open','closing','closed') DEFAULT 'open',
  locked_at TIMESTAMPTZ,
  locked_by_user_id UUID REFERENCES users(id),
  UNIQUE(fiscal_year_id, period_number)
)

-- Journal Entries (header)
journal_entries (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
  entry_date DATE NOT NULL,
  entry_number VARCHAR(30) NOT NULL,  -- formatted, e.g. JE-2026-001234
  entry_type ENUM('manual','system','opening_balance','reversal','import') NOT NULL,
  source_document_type VARCHAR(50),   -- e.g. 'sales_invoice', 'goods_receipt'
  source_document_id UUID,
  source_event_type VARCHAR(100),
  description_ar TEXT,
  description_en TEXT,
  status ENUM('draft','pending_approval','approved','posted','reversed') DEFAULT 'draft',
  reversed_by_entry_id UUID REFERENCES journal_entries(id),
  import_batch_id UUID,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  posted_at TIMESTAMPTZ,
  posted_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, entry_number),
  UNIQUE(company_id, source_document_type, source_document_id, source_event_type)  -- idempotency
)

-- Journal Lines (debit/credit entries)
journal_lines (
  id UUID PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  line_number INT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  debit_amount NUMERIC(18,4) DEFAULT 0,
  credit_amount NUMERIC(18,4) DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'SAR',
  exchange_rate NUMERIC(12,6) DEFAULT 1,
  debit_amount_functional NUMERIC(18,4),  -- amount in company functional currency
  credit_amount_functional NUMERIC(18,4),
  CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CHECK (NOT (debit_amount > 0 AND credit_amount > 0))  -- a line is either debit or credit, not both
)

-- DB-level balance check enforced via trigger or deferred constraint on journal_entry_id:
-- SUM(debit_amount_functional) = SUM(credit_amount_functional) per journal_entry_id
```

### Financial Dimensions Tables

```sql
-- Dimension Type Definitions
financial_dimensions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  dimension_code VARCHAR(30) NOT NULL,  -- e.g. 'cost_center', 'department', 'project'
  dimension_name_ar TEXT NOT NULL,
  dimension_name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(company_id, dimension_code)
)

-- Dimension Values
dimension_values (
  id UUID PRIMARY KEY,
  dimension_id UUID NOT NULL REFERENCES financial_dimensions(id),
  value_code VARCHAR(30) NOT NULL,
  value_name_ar TEXT NOT NULL,
  value_name_en TEXT NOT NULL,
  parent_value_id UUID REFERENCES dimension_values(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(dimension_id, value_code)
)

-- Many-to-many: journal lines tagged with dimension values
transaction_dimension_tags (
  id UUID PRIMARY KEY,
  journal_line_id UUID NOT NULL REFERENCES journal_lines(id),
  dimension_id UUID NOT NULL REFERENCES financial_dimensions(id),
  dimension_value_id UUID NOT NULL REFERENCES dimension_values(id),
  UNIQUE(journal_line_id, dimension_id)  -- one value per dimension per line
)
```

### Bank and Treasury Tables

```sql
bank_accounts (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  bank_name_ar TEXT NOT NULL,
  bank_name_en TEXT,
  account_number VARCHAR(50),
  iban VARCHAR(34),
  currency_code CHAR(3) NOT NULL,
  gl_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE
)

bank_transactions (
  id UUID PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount NUMERIC(18,4) NOT NULL,  -- positive = credit to bank account, negative = debit
  currency_code CHAR(3) NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  reconciliation_status ENUM('unreconciled','reconciled','excluded') DEFAULT 'unreconciled',
  source ENUM('manual','import','bank_feed') NOT NULL
)
```

### Budget Tables

```sql
budget_headers (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),
  version_name VARCHAR(50) NOT NULL,
  version_number INT NOT NULL,
  status ENUM('draft','pending_approval','approved','active','archived') DEFAULT 'draft',
  is_active_version BOOLEAN DEFAULT FALSE
)

budget_lines (
  id UUID PRIMARY KEY,
  budget_header_id UUID NOT NULL REFERENCES budget_headers(id),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
  dimension_value_id UUID REFERENCES dimension_values(id),
  budgeted_amount NUMERIC(18,4) NOT NULL DEFAULT 0
)
```

### Fixed Assets Tables

```sql
assets (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  asset_code VARCHAR(30) NOT NULL,
  asset_name_ar TEXT NOT NULL,
  asset_name_en TEXT,
  category_id UUID NOT NULL REFERENCES asset_categories(id),
  acquisition_date DATE NOT NULL,
  acquisition_cost NUMERIC(18,4) NOT NULL,
  useful_life_months INT NOT NULL,
  depreciation_method ENUM('straight_line','declining_balance','units_of_production') NOT NULL,
  salvage_value NUMERIC(18,4) DEFAULT 0,
  asset_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  accumulated_dep_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  dep_expense_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  status ENUM('active','disposed','transferred','impaired') DEFAULT 'active'
)

asset_depreciation_schedules (
  id UUID PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id),
  fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
  scheduled_depreciation NUMERIC(18,4) NOT NULL,
  accumulated_depreciation NUMERIC(18,4) NOT NULL,
  book_value NUMERIC(18,4) NOT NULL,
  is_posted BOOLEAN DEFAULT FALSE,
  journal_entry_id UUID REFERENCES journal_entries(id)
)
```

### Posting Engine Tables

```sql
posting_rules (
  id UUID PRIMARY KEY,
  company_id UUID,  -- NULL = system-wide rule
  rule_code VARCHAR(50) NOT NULL,
  rule_name_ar TEXT NOT NULL,
  trigger_event_type VARCHAR(100) NOT NULL,
  condition_expression JSONB,  -- optional filter condition on the event payload
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 100
)

posting_rule_lines (
  id UUID PRIMARY KEY,
  posting_rule_id UUID NOT NULL REFERENCES posting_rules(id),
  line_number INT NOT NULL,
  entry_type ENUM('debit','credit') NOT NULL,
  account_resolution_type ENUM('fixed_account','account_type_lookup','party_default','expression') NOT NULL,
  fixed_account_id UUID REFERENCES chart_of_accounts(id),
  account_type_lookup VARCHAR(50),
  amount_expression TEXT NOT NULL,  -- e.g. 'event.amount', 'event.tax_amount', 'event.subtotal'
  description_template_ar TEXT,
  description_template_en TEXT,
  dimension_tag_rules JSONB  -- rules for which dimensions to apply
)
```

---

## Suggested Backend Design

### Service Layer Architecture

The accounting domain follows the same service layer pattern established in the existing codebase. Each service is a class with injected dependencies (repository, event emitter, other services). Services are never called directly from route handlers — route handlers validate input and delegate to services.

```
AccountingService
  ├── createJournalEntry(dto)
  ├── postJournalEntry(entryId, userId)
  ├── reverseJournalEntry(entryId, reason, userId)
  ├── getGeneralLedger(filters)
  └── getTrialBalance(companyId, periodId)

PostingEngineService  [THE CENTRAL SERVICE]
  ├── post(event: BusinessEvent): Promise<JournalEntry>
  ├── simulate(event: BusinessEvent): Promise<JournalEntryPreview>
  ├── resolveAccounts(rule, event): AccountResolution[]
  └── validateBalance(lines: JournalLine[]): ValidationResult

TaxEngineService
  ├── calculateTax(document: TaxableDocument): TaxCalculationResult
  ├── getTaxRate(itemCategory, partyType, transactionDate): TaxRate
  └── generateZATCAInvoice(invoice): ZATCAInvoicePayload

BudgetService
  ├── createBudget(dto)
  ├── getBudgetVsActual(budgetHeaderId, periodId)
  └── checkBudgetAvailability(accountId, periodId, amount)

ReconciliationService
  ├── getBankReconciliation(bankAccountId, periodId)
  ├── matchBankTransaction(bankTransactionId, journalLineId)
  └── getCustomerReconciliation(customerId)

FinancialReportingService
  ├── getTrialBalance(companyId, fromPeriod, toPeriod)
  ├── getBalanceSheet(companyId, asOfDate)
  ├── getIncomeStatement(companyId, fromDate, toDate)
  └── getCashFlowStatement(companyId, fromDate, toDate)

AuditService
  ├── logChange(entityType, entityId, action, before, after, userId)
  ├── getAuditLog(filters)
  └── exportAuditLog(filters): Promise<StorageFile>

FixedAssetService
  ├── registerAsset(dto)
  ├── runDepreciation(companyId, periodId)
  └── disposeAsset(assetId, disposalDto)
```

### Event-Driven Posting Pattern

Business modules emit domain events. The Posting Engine subscribes to these events and processes them:

```typescript
// In the Sales module (example)
await eventEmitter.emit('SalesInvoicePosted', {
  invoice_id: invoice.id,
  company_id: invoice.company_id,
  customer_id: invoice.customer_id,
  invoice_date: invoice.invoice_date,
  subtotal: invoice.subtotal,
  tax_amount: invoice.tax_amount,
  total: invoice.total,
  fiscal_period_id: resolvedPeriod.id,
});

// In the Posting Engine (subscriber)
eventEmitter.on('SalesInvoicePosted', async (event) => {
  await postingEngineService.post(event);
});
```

The event payload is strongly typed via a shared schema. The Posting Engine resolves the applicable posting rules for the event type, resolves accounts, generates journal lines, validates balance, and writes the journal entry atomically.

### Materialized Views for Reporting

```sql
-- Materialized view for Trial Balance (refreshed hourly or on demand)
CREATE MATERIALIZED VIEW mv_trial_balance AS
SELECT
  je.company_id,
  je.fiscal_period_id,
  jl.account_id,
  coa.account_code,
  coa.account_name_ar,
  coa.account_name_en,
  coa.account_type,
  SUM(jl.debit_amount_functional)  AS total_debit,
  SUM(jl.credit_amount_functional) AS total_credit,
  SUM(jl.debit_amount_functional) - SUM(jl.credit_amount_functional) AS net_balance
FROM journal_lines jl
JOIN journal_entries je ON jl.journal_entry_id = je.id
JOIN chart_of_accounts coa ON jl.account_id = coa.id
WHERE je.status = 'posted'
GROUP BY je.company_id, je.fiscal_period_id, jl.account_id, coa.account_code, coa.account_name_ar, coa.account_name_en, coa.account_type;

CREATE UNIQUE INDEX ON mv_trial_balance (company_id, fiscal_period_id, account_id);
```

---

## Suggested Frontend Design

### Route Structure

```
app/
  [locale]/
    (protected)/
      accounting/                      ← accounting route group (lazy loaded)
        layout.tsx                     ← accounting shell with period selector + workspace nav
        page.tsx                       ← redirect to role-appropriate workspace
        workspace/
          accountant/page.tsx
          finance-manager/page.tsx
          cfo/page.tsx
          auditor/page.tsx
        chart-of-accounts/
          page.tsx                     ← account list
          [id]/page.tsx                ← account detail + sub-ledger
        journals/
          page.tsx                     ← journal entry list
          new/page.tsx                 ← journal entry form
          [id]/page.tsx                ← journal entry detail + lines
          import/page.tsx              ← journal import center
        periods/
          page.tsx                     ← fiscal years and periods
          closing/page.tsx             ← financial closing center
        reports/
          trial-balance/page.tsx
          balance-sheet/page.tsx
          income-statement/page.tsx
          cash-flow/page.tsx
          general-ledger/page.tsx
        payables/
          page.tsx
          [id]/page.tsx
        receivables/
          page.tsx
          [id]/page.tsx
        bank/
          page.tsx
          [id]/
            page.tsx
            reconciliation/page.tsx
        assets/
          page.tsx
          [id]/page.tsx
        budget/
          page.tsx
          [id]/page.tsx
        tax/
          page.tsx
          returns/page.tsx
        analytics/page.tsx
        settings/
          posting-rules/page.tsx
          accounts-mapping/page.tsx
          templates/page.tsx
```

### Design Principles

- **Accounting is a separate route group** from Inventory (`/inventory`) and other modules, loaded lazily to keep initial bundle size small
- **Period selector in the accounting layout shell** — the currently selected fiscal period is a layout-level context; all pages within the accounting group are period-aware
- **Workspace-based entry point** — users land on their role-appropriate workspace, not a generic dashboard
- **Shared component reuse** — `StatusBadge`, `ConfirmDialog`, `DataTable`, `EmptyState`, date pickers, amount formatters, and pagination controls are shared from the existing component library
- **Accounting-specific components** — journal entry form, account tree selector, trial balance grid, period lock indicator, reconciliation match panel live in an `accounting/components/` directory
- **Arabic-first** — all labels, field names, and descriptions are Arabic-primary with English secondary; RTL layout is default; numeric columns (amounts, account codes) use LTR direction within the RTL context
- **Drill-down navigation** — every summary number is a link; clicking a balance in the trial balance navigates to the General Ledger filtered for that account and period

---

## Suggested APIs

### Core API Endpoint Groups

| Group | Base Path | Key Endpoints |
|---|---|---|
| **Chart of Accounts** | `/api/v1/accounts` | GET /accounts, POST /accounts, GET /accounts/:id, PATCH /accounts/:id |
| **Journal Entries** | `/api/v1/journals` | GET /journals, POST /journals, GET /journals/:id, POST /journals/:id/post, POST /journals/:id/reverse |
| **Journal Lines** | `/api/v1/journals/:id/lines` | GET /lines, POST /lines (bulk) |
| **Fiscal Periods** | `/api/v1/periods` | GET /periods, POST /periods, PATCH /periods/:id/lock, PATCH /periods/:id/reopen |
| **Financial Reports** | `/api/v1/reports` | GET /reports/trial-balance, GET /reports/balance-sheet, GET /reports/income-statement, GET /reports/cash-flow, GET /reports/general-ledger |
| **Budgets** | `/api/v1/budgets` | GET /budgets, POST /budgets, GET /budgets/:id/vs-actual |
| **Fixed Assets** | `/api/v1/assets` | GET /assets, POST /assets, GET /assets/:id, POST /assets/:id/dispose, POST /assets/depreciation-run |
| **Posting Rules** | `/api/v1/posting-rules` | GET /posting-rules, POST /posting-rules, POST /posting-rules/simulate |
| **Reconciliation** | `/api/v1/reconciliation` | GET /reconciliation/bank/:bankAccountId, POST /reconciliation/match, DELETE /reconciliation/match/:id |
| **Tax** | `/api/v1/tax` | POST /tax/calculate, GET /tax/rates, GET /tax/returns/:periodId |
| **Bank Accounts** | `/api/v1/bank-accounts` | GET /bank-accounts, POST /bank-accounts, POST /bank-accounts/:id/import-statement |
| **Financial Dimensions** | `/api/v1/dimensions` | GET /dimensions, POST /dimensions, GET /dimensions/:id/values, POST /dimensions/:id/values |
| **Audit Log** | `/api/v1/audit` | GET /audit (search), GET /audit/export |
| **Posting Engine** | `/api/v1/posting` | POST /posting/simulate, POST /posting/post |
| **Webhooks** | `/api/v1/webhooks` | GET /webhooks, POST /webhooks, DELETE /webhooks/:id |

All endpoints require authentication and are scoped to the authenticated user's company. Response format follows the existing Sefay API response schema (`{ data, meta, errors }`).

---

## Suggested UI/UX

### Role-Based Workspaces

Each financial persona receives a workspace optimized for their daily tasks:

- **Accountant Workspace** — task-oriented; shows what needs to be done today (pending postings, unreconciled items, closing tasks); dense, keyboard-navigable data tables for high-volume transaction work
- **Finance Manager Workspace** — oversight-oriented; approval queue prominently displayed; budget vs. actual summary; period close progress; drill-down into department-level performance
- **CFO Workspace** — insight-oriented; high-level KPI tiles; trend charts; entity-level comparison; minimal interaction required; designed for scanning, not data entry
- **Auditor Workspace** — read-only, investigation-oriented; full access to all data; audit trail search; document-level drill-down; export-centric

### Key UX Patterns

- **Period-Aware Navigation** — the fiscal period selector is always visible in the accounting shell header; changing the period updates all visible data without a full page reload
- **Drill-Down Everywhere** — every financial number is a hyperlink; clicking a balance in the Balance Sheet → navigates to the Trial Balance → navigates to the General Ledger → navigates to the Journal Entry → shows all journal lines
- **Posting Simulation Preview** — before posting any document, the system shows a "Journal Preview" panel with the exact debit and credit entries that will be created; user must confirm before committing
- **Period Lock Indicator** — a prominent lock icon appears in the UI whenever the selected period is locked; all write actions are disabled with a clear tooltip explaining the period is closed
- **Arabic-First Amounts** — currency amounts use the SAR/currency symbol; thousands separator and decimal separator follow the locale setting; the amount column is always LTR-aligned even in RTL layout
- **Keyboard Navigation** — journal entry form supports Tab navigation through account, description, debit, and credit fields; Enter creates the next line; journal entry can be posted with a keyboard shortcut
- **Reconciliation Match Panel** — split-screen reconciliation interface: bank statement lines on the left, GL entries on the right; drag-and-drop matching with visual confirmation of balanced matches
- **Closing Center Progress** — visual checklist with green/amber/red status indicators; blocking items shown with clear explanations; one-click navigation to resolve each blocking item

---

## Security Considerations

### Row-Level Security (RLS)
All accounting tables have RLS policies enforced at the Supabase/PostgreSQL level. The `company_id` column on every table is the primary isolation boundary. Users can only access data belonging to their company. Auditors have read-only RLS policies that grant SELECT but deny INSERT/UPDATE/DELETE.

### Role-Based Access Control
| Role | Permissions |
|---|---|
| Accountant | Create/edit journal entries (draft); view all accounting data; run reconciliation |
| Finance Manager | All Accountant permissions; approve journal entries; lock/reopen periods (subject to CFO authorization); manage posting rules |
| CFO | All Finance Manager permissions; final period lock authority; inter-company approvals; financial consolidation access |
| Auditor | Read-only access to all financial data and audit trail; no write permissions |
| System Admin | Configuration access (fiscal years, chart of accounts setup); not a financial role |

### Period Lock Enforcement
Period lock is enforced server-side by the Posting Engine service — it checks `fiscal_periods.status` before accepting any journal entry. The period lock cannot be bypassed by a client-side request or a direct API call that skips the service layer, because the RLS policy on `journal_entries` also enforces that the referenced `fiscal_period_id` must have `status = 'open'`.

### Immutable Audit Trail
Database-level triggers fire on any DELETE or UPDATE attempt on `journal_entries` and `journal_lines`, blocking the operation and writing a security event to the audit log. Application code does not have a direct `DELETE` grant on these tables — all operations go through stored procedures or the service layer which enforces immutability.

### ZATCA Digital Signatures
ZATCA Phase 2 requires cryptographic signing of e-invoices with a ZATCA-issued certificate. Private keys are managed through a key management service (KMS), never stored in the application database or environment variables. Signing operations are performed server-side in a secure context. The implementation follows the ZATCA technical specifications for PKI and cryptographic algorithms.

### Financial Data Encryption
Sensitive financial data (bank account numbers, IBAN) is encrypted at rest using column-level encryption where supported by the database. Application-level encryption is applied to highly sensitive fields before storage.

---

## Performance Considerations

### Journal Entry Volume
A mid-market company may generate 500,000 to 2,000,000 journal lines per fiscal year. All queries that aggregate journal_lines must use indexed paths:

```sql
-- Critical indexes on journal_lines
CREATE INDEX idx_jl_entry_id       ON journal_lines(journal_entry_id);
CREATE INDEX idx_jl_account_id     ON journal_lines(account_id);
CREATE INDEX idx_jl_account_period ON journal_lines(account_id, fiscal_period_id);  -- via join to journal_entries

-- Critical indexes on journal_entries
CREATE INDEX idx_je_company_period ON journal_entries(company_id, fiscal_period_id);
CREATE INDEX idx_je_source         ON journal_entries(source_document_type, source_document_id);
CREATE INDEX idx_je_status         ON journal_entries(company_id, status);
```

### Materialized Views
The Trial Balance materialized view (`mv_trial_balance`) is the foundation for all financial reports. It is refreshed:
- Automatically after any journal entry is posted (via a `NOTIFY`/listener pattern or a short-delay background job)
- On-demand via a manual refresh API endpoint for real-time accuracy when needed
- On a scheduled refresh every 15 minutes for background accuracy

Balance Sheet and Income Statement queries aggregate from `mv_trial_balance` — they never scan `journal_lines` directly.

### N+1 Prevention
- General Ledger queries fetch journal lines with account data in a single JOIN, not in a loop
- Approval workflow queries fetch the full approval chain in a single query, not per-document
- Workspace KPI tiles are backed by separate pre-aggregated snapshot records, not live aggregations on page load

### Async Posting
For high-volume posting scenarios (end-of-period depreciation run posting thousands of asset entries, bulk inventory adjustment posting), the Posting Engine supports an async mode: business events are queued in a job queue; the Posting Engine processes them in the background; the UI shows a progress indicator. This prevents long-running synchronous requests that would timeout.

---

## Scalability Considerations

### Table Partitioning
`journal_entries` and `journal_lines` are partitioned by `(company_id, fiscal_year_id)`. This ensures that large enterprises with many years of data do not experience query performance degradation. Partition pruning means that queries scoped to a single fiscal year only scan the relevant partition.

```sql
-- Range partitioning by fiscal year (example)
CREATE TABLE journal_entries (
  ...
) PARTITION BY LIST (fiscal_year_id);
-- Each fiscal year creates a new partition at year creation time
```

### Read Replicas
- All reporting queries, workspace KPI queries, and reconciliation queries are routed to a read replica
- Write operations (journal entry creation, posting, period lock) always go to the primary
- The Supabase client is configured with separate read and write connection strings

### Connection Pooling
High-volume posting scenarios use PgBouncer (Supabase's built-in connection pooler) to prevent connection exhaustion. The Posting Engine uses transaction-mode pooling for its posting operations.

### Multi-Tenant Scaling
As the number of tenants grows, the `company_id` column on every table combined with RLS ensures that data isolation is maintained without separate databases per tenant. For very large enterprise customers with extreme volume requirements, a dedicated database deployment option can be considered without changing the application's data model.

---

## Storage Considerations

### Financial Attachments
Financial documents carry attachments: invoice scans, receipt images, bank statement PDFs, audit evidence files. All file storage operations use the `StorageProvider` interface defined in `docs/architecture/storage-abstraction.md`. The accounting module never calls Supabase Storage directly. This ensures that:

- Switching from Supabase Storage to S3, Azure Blob, or another provider requires no changes in the accounting module
- File access control is enforced through the StorageProvider's access policy layer
- File metadata (file name, size, mime type, storage key) is stored in a `financial_attachments` table that references the financial document and the StorageProvider file key

### Attachment Retention Policy
Financial attachments are subject to retention policies (Saudi law requires retaining financial records for a minimum of 10 years). The `financial_attachments` table includes a `retain_until` date that the StorageProvider respects when evaluating deletion requests — retained files cannot be deleted even if the parent record is logically deleted.

### Export File Storage
Large report exports (SAF-T files, bulk journal exports, XBRL exports) are generated asynchronously and stored via the StorageProvider with a time-limited access URL delivered to the requesting user. These temporary export files have a 24-hour expiry and are automatically cleaned up.

---

## Migration Strategy

### New Installations
For new Sefay installations, the accounting module is set up through a guided onboarding wizard:
1. Define the company's functional currency and fiscal year start month
2. Import or build the Chart of Accounts (system provides Saudi standard account templates)
3. Configure Posting Rules (system provides default rules for standard document types)
4. Set up Financial Dimensions (default: Cost Center, Department)
5. Enter opening balances for balance sheet accounts
6. Configure fiscal years and periods for the current year

### Existing Sefay Installations
For installations that already have Sales, Purchasing, and Inventory data:
1. Complete the new installation setup steps above
2. Run the **Retrospective Posting Migration Wizard**:
   - Select the date range for historical data migration
   - The wizard identifies all posted Sales Invoices, Supplier Invoices, Goods Receipts, and Payments
   - The Posting Engine simulates journal entries for each historical document using the configured Posting Rules
   - The user reviews and approves the simulation results
   - Upon approval, the Posting Engine creates historical journal entries tagged with `entry_type = 'migration'` and the source document reference
3. Verify that the resulting Trial Balance matches independently maintained accounting records
4. Lock historical periods once migration is confirmed

### Chart of Accounts Migration
If a customer has an existing Chart of Accounts from another system, an import tool accepts Excel format with the standard columns (code, name_ar, name_en, account_type, parent_code). The import validates the hierarchy and reports errors before creating any accounts.

---

## Integration Points

| Integration | Description |
|---|---|
| **Phase 3–6 Inventory Module** | The Inventory module raises `GoodsReceiptPosted`, `GoodsIssuePosted`, `InventoryAdjustmentPosted` events. The Posting Engine consumes these and generates COGS/Inventory Asset journal entries. This is the most critical cross-module integration. |
| **Sales Module** | Sales Invoice approval raises `SalesInvoicePosted`; the Posting Engine generates AR debit and Revenue credit entries. Sales payment recording raises `SalesPaymentPosted`; the Posting Engine generates Cash/Bank debit and AR credit entries. |
| **Purchasing/PO Module** | Supplier Invoice approval raises `SupplierInvoicePosted`; the Posting Engine generates Expense/Asset debit and AP credit entries. |
| **Phase 9 Company Information** | Company legal name (Arabic and English), VAT registration number, CR number, and address are required fields on ZATCA-compliant invoices. The accounting module reads this data from the Company Information module. |
| **Phase 10 Document & Print Designer** | Financial document templates (invoices, payment receipts, financial statements) are rendered using the Document & Print Designer's template engine. The accounting module provides the data; the designer provides the layout. |
| **docs/architecture/ai-architecture.md** | The AI Finance milestone (Milestone 22) uses the AI provider abstraction layer for all LLM calls. The accounting module does not select or configure LLM providers directly. |
| **docs/architecture/storage-abstraction.md** | All file storage operations (attachments, exports) use the StorageProvider interface. |
| **docs/architecture/tenant-architecture.md** | The multi-company model (Milestone 15) depends on the tenant architecture for company data isolation, company switching, and consolidated reporting permissions. |
| **docs/architecture/security-architecture.md** | RLS policies, role definitions, and authentication patterns follow the security architecture. ZATCA PKI key management follows the key management section of the security architecture. |

---

## Dependencies

### Internal Dependencies (within Sefay)

| Dependency | Why Required |
|---|---|
| **Chart of Accounts** (Milestone 1) | Must exist before any posting rule, journal entry, or financial report |
| **Fiscal Years & Periods** (Milestone 1) | Every journal entry must reference a valid open period |
| **Posting Engine** (Milestone 10) | Must be complete before any ERP module integration produces journal entries |
| **Tax Engine** (Milestone 3) | Must be complete before ZATCA-compliant invoices can be generated |
| **Company Information** (Phase 9) | Legal and VAT registration data required for financial document headers |
| **User & Role Management** | Financial role assignments (Accountant, Finance Manager, CFO, Auditor) must be available in the user management system |
| **Multi-Company Architecture** (tenant-architecture.md) | Required before Milestone 15 (Enterprise Finance) can be implemented |

### External Dependencies

| Dependency | Description |
|---|---|
| **ZATCA PKI Certificate** | A ZATCA-issued cryptographic certificate is required for Phase 2 e-invoicing; this is a regulatory prerequisite, not a technical one |
| **ZATCA API Access** | ZATCA clearance and reporting API credentials and sandbox access are required for Phase 2 integration testing |
| **Exchange Rate Data Source** | A source for daily foreign exchange rates (e.g., Saudi Central Bank API, or a commercial FX data provider) is required for Milestone 15 multi-currency |
| **Banking API Provider** | Open banking API access requires agreements with Saudi banks or an open banking aggregator; this is a business development dependency, not a technical one |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Posting Engine bypass** | Medium | Critical | Enforce the invariant through code review, architecture tests (detect imports of PostingEngineService in non-accounting modules), and team training |
| **ZATCA Phase 2 specification changes** | High | High | Design the ZATCA integration as a pluggable compliance module; isolate ZATCA-specific code behind an interface so changes require only that module to change |
| **Double-entry integrity bugs** | Low | Critical | Enforce balance constraint at the database level (trigger or deferred constraint); never rely solely on application-level validation |
| **Period-lock race conditions** | Medium | High | Use database-level locks (SELECT FOR UPDATE on fiscal_period row) when checking period status during posting; optimistic locking alone is insufficient |
| **Reporting performance on large datasets** | High | High | Implement materialized views from Milestone 1; never defer this to "when it becomes a problem" — journal_lines grows indefinitely |
| **Migration of historical data** | Medium | Medium | The Retrospective Posting Migration Wizard must be thoroughly tested with real customer data before production deployment; offer a manual opening balance alternative |
| **Multi-currency rounding errors** | Medium | High | Define and document the rounding algorithm (round-half-up, number of decimal places) and enforce it consistently across all currency conversion operations |
| **Intercompany reconciliation complexity** | High | Medium | Design intercompany matching as an automated process from the start; manual intercompany reconciliation at scale is operationally unsustainable |
| **AI Finance data privacy** | Medium | High | Ensure that PII and sensitive financial data is not sent to external LLM APIs; use summarization and anonymization before any external AI call |

---

## Trade-offs

### Shared Database vs. Separate Accounting Database

| Option | Pros | Cons |
|---|---|---|
| **Shared Supabase database** (selected) | No synchronization complexity; ACID transactions across accounting and business modules; lower operational overhead | Accounting and transactional workloads compete for resources; mitigation: read replicas + materialized views |
| **Separate accounting database** | Isolated performance; separate scaling | Data synchronization complexity; cross-database transactions require saga pattern; higher operational cost |

**Decision:** Shared database with read replicas and materialized views. This is sufficient for mid-market scale and avoids distributed transaction complexity.

### Synchronous vs. Asynchronous Posting

| Option | Pros | Cons |
|---|---|---|
| **Synchronous posting** (default) | Journal entry exists before the user sees the success response; simpler error handling; no eventual consistency lag | Adds latency to document posting; high-volume scenarios may timeout |
| **Asynchronous posting** (for bulk operations) | Non-blocking for high-volume scenarios; better user experience for batch operations | Eventual consistency; user must poll or wait for notification; more complex error handling and retry logic |

**Decision:** Synchronous posting by default for interactive operations (single document posting). Asynchronous posting for bulk operations (depreciation runs, batch imports, batch inventory adjustments).

### Built-in vs. External Accounting Engine

| Option | Pros | Cons |
|---|---|---|
| **Build native** (selected) | Full data ownership; Arabic-first UX; ZATCA integration control; no vendor lock-in; deep ERP integration | Significant engineering investment; accounting is complex domain |
| **Integrate Xero/QuickBooks API** | Faster to market; proven accounting engine | Vendor dependency; Arabic/ZATCA support varies; data synchronization complexity; ongoing API costs; limited customization |

**Decision:** Build native. The depth of integration required (real-time posting from every ERP module, Arabic-first UX, ZATCA compliance, multi-company) makes a native engine the only viable long-term choice.

---

## Alternative Designs

### Alternative: Account Code as Natural Key
Using the account code (e.g., "1001") as the primary key for `chart_of_accounts` instead of a UUID. Rejected because account codes can change, and a UUID as the primary key insulates all references from account code renaming. Account code is a unique constraint, not the primary key.

### Alternative: Hardcoded Financial Dimensions
Storing cost center, department, and project as direct foreign key columns on `journal_lines`. Rejected because it requires schema migration for every new dimension type, and many businesses need custom dimensions. The dimension-tag model is more complex but far more extensible.

### Alternative: Event Sourcing for Journal Entries
Implementing the journal entry ledger as an event-sourced system where the current balance is always derived from replaying the event stream. Rejected for this initiative due to complexity of query patterns; traditional double-entry bookkeeping with materialized views is a well-understood, proven approach that is simpler to implement and maintain.

### Alternative: Separate Posting Engine Microservice
Implementing the Posting Engine as a separate deployed service (separate API, separate database). Rejected at this stage — the added operational complexity (inter-service communication, distributed transactions, separate deployment) is not justified for the target scale. The Posting Engine is a service within the same application, not a separately deployed microservice.

### Alternative: Period Balance Snapshots Instead of Materialized Views
Storing running balance snapshots on the account record at period close, and using these for reporting. Rejected because it complicates period reopening (must recalculate affected snapshots) and does not help with intra-period reporting. Materialized views of journal line aggregates are more flexible.

---

## Open Questions

1. **Which ZATCA phase to target first?** ZATCA Phase 1 (QR code on PDF) is technically simpler and already required. Phase 2 (clearance/reporting API with cryptographic signing) is more complex but required for most Saudi businesses above the revenue threshold. Should both be in scope from the start, or Phase 1 first with Phase 2 as a follow-on?

2. **IFRS alongside GAAP from day one?** The compliance framework is designed to support both, but building and testing GAAP presentation rules adds scope. Should GAAP be deferred to a later enhancement, given that Saudi businesses are IFRS-based?

3. **Approval workflow engine: shared or finance-only?** Milestone 11 proposes a generic workflow engine reusable beyond finance. Should this engine be built as a shared platform service from the start (adding scope but avoiding future duplication), or as a finance-only implementation that is later generalized?

4. **Default costing method?** Weighted Average Cost (WAC) is most common in Saudi mid-market ERP deployments. FIFO is required for certain regulated industries. Should WAC be the system default with FIFO as a configurable option, or should customers choose at initial setup with no system default?

5. **Multi-currency from which milestone?** Multi-currency is in Milestone 15 (Enterprise Finance). However, some Milestone 2 (Financial Operations) design decisions (e.g., whether bank accounts can have non-SAR currencies) need to anticipate multi-currency even if the full feature is delivered later. The exact compatibility boundary needs to be defined.

6. **SAF-T format target?** SAF-T has multiple national variants (OECD, Portugal PT-SAF-T, etc.). Which variant is the target for the GCC market? The OECD standard may be the safest starting point.

7. **Consolidation for holding companies — which milestone?** Financial consolidation is in Milestone 15 but is very complex. Should it be a sub-milestone of Milestone 15 or a separate Milestone 23?

8. **AI Finance models — cloud LLM vs. local models?** For anomaly detection and fraud detection, a statistical model (no external API) may be preferable to sending financial data to an external LLM. This decision affects both the privacy posture and the operational cost model.

---

## Future Enhancements

These capabilities are beyond the scope of this initiative but are worth noting for future planning:

- **Financial Consolidation for Holding Companies** — full group consolidation with minority interest, intercompany elimination at scale (if Milestone 15 consolidation proves insufficient for complex group structures)
- **ZATCA Phase 2 Extended Integration** — full clearance mode, credit note API, real-time invoice status polling; as ZATCA's API matures, additional integration points will be required
- **Open Banking Feeds** — real-time bank transaction feeds via Saudi Open Banking APIs; eliminates manual bank statement imports
- **AI-Generated Management Accounts** — using the AI Finance infrastructure, automatically generate narrative management accounts (monthly commentary on financial results) for non-finance executives
- **Transfer Pricing Module** — for multinational companies, documentation and calculation support for transfer pricing compliance
- **Treasury Automation** — automatic cash sweeping between accounts, automatic FX hedging recommendations
- **Financial Data API for BI Tools** — a read-only data feed compatible with Power BI, Tableau, and other BI tools; different from the Financial API in Milestone 20 (which is transactional)
- **Zakat Calculation Module** — Saudi-specific Zakat calculation (business tax distinct from VAT) with GAZT filing support
- **Payroll Module Integration** — when a Payroll module is built as a separate initiative, the accounting integration (payroll journal posting) is straightforward given the Posting Engine architecture
- **Financial Workflow Mobile App** — mobile-optimized approval interface for Finance Managers and CFOs to approve financial documents on the go

---

## Implementation Order

The recommended sequencing prioritizes foundation before capability:

```
Priority 1 (Foundation — nothing else is possible without these):
  Milestone 1  → Accounting Foundation
  Milestone 10 → Posting Engine

Priority 2 (Core Operations — needed for basic accounting functionality):
  Milestone 3  → Tax Engine (ZATCA compliance cannot wait)
  Milestone 2  → Financial Operations (AR/AP/Payments)
  Milestone 4  → Financial Reporting

Priority 3 (Financial Management — enables professional accounting use):
  Milestone 5  → Cost Centers & Financial Dimensions
  Milestone 11 → Workflow & Approval Engine
  Milestone 17 → Financial Closing Center
  Milestone 13 → Audit & Compliance

Priority 4 (Advanced Accounting — expands capability for mid-market):
  Milestone 6  → Fixed Assets
  Milestone 7  → Inventory Costing        ← coordinate with Inventory Roadmap Phases 3-6
  Milestone 8  → Budget & Forecasting
  Milestone 9  → Treasury Management
  Milestone 12 → Reconciliation Center

Priority 5 (Sophisticated Finance — enterprise-grade capabilities):
  Milestone 14 → Advanced Finance
  Milestone 15 → Enterprise Finance
  Milestone 18 → Journal Import Center
  Milestone 19 → Accounting Templates

Priority 6 (Workspaces and Experience — productivity and role-specific UX):
  Milestone 16 → Financial Workspace
  Milestone 20 → Financial API

Priority 7 (Intelligence — analytics and AI):
  Milestone 21 → Financial Analytics
  Milestone 22 → AI Finance
```

Milestones within the same priority level can be developed in parallel where team capacity allows. Dependencies between milestones (as noted in each milestone's "Dependencies" section) must be respected regardless of parallelism.

---

## Success Criteria

The following measurable criteria define success for this initiative:

| # | Criterion | Measurement |
|---|---|---|
| 1 | **Double-entry integrity** | Trial Balance balances to zero (Σdebits = Σcredits) for every company, every period, 100% of the time — enforced by DB constraint, verified by automated test suite |
| 2 | **Posting Engine coverage** | Every inventory movement, every sales invoice, every supplier invoice, and every payment creates a corresponding journal entry via the Posting Engine, with zero direct journal writes from business modules |
| 3 | **ZATCA Phase 1 compliance** | 100% of issued invoices pass ZATCA format validation (QR code, Arabic fields, VAT number, required invoice fields) without manual intervention |
| 4 | **Financial report accuracy** | Balance Sheet totals (Assets = Liabilities + Equity) hold true for every reporting date; verified by automated reconciliation check |
| 5 | **Period lock enforcement** | Zero journal entries accepted for a locked period — enforced and verified by automated test |
| 6 | **Audit trail completeness** | Every financial record change produces an audit log entry; verified by automated test that attempts changes and checks audit log |
| 7 | **Trial Balance performance** | Trial Balance for a single company, single period loads in under 2 seconds for up to 1 million journal lines |
| 8 | **Bank reconciliation automation** | Automatic matching rules reconcile at least 70% of bank statement lines without manual intervention (based on reference number and amount matching) |
| 9 | **User adoption (Accountant Workspace)** | Accountants can complete the daily accounting workflow (post invoices, record payments, run reconciliation) entirely within Sefay without requiring a separate accounting tool |
| 10 | **Closing Center reliability** | Period close completes successfully with zero post-close journal entry errors (unintended postings to closed period) for 100% of closing cycles in production |

---

## References

- `docs/architecture/database-architecture.md` — Database design patterns, migration conventions, and indexing standards used across the Sefay platform
- `docs/architecture/storage-abstraction.md` — StorageProvider interface definition; financial attachments and export files must use this interface
- `docs/architecture/ai-architecture.md` — AI provider abstraction layer; Milestone 22 (AI Finance) integrates with this layer
- `docs/architecture/tenant-architecture.md` — Multi-company and multi-tenant model; Milestone 15 (Enterprise Finance) depends on this architecture
- `docs/architecture/security-architecture.md` — RLS policies, role management, key management; security implementation for accounting follows this document
- `TASKS.md` — Phase 9 (Company Information): provides VAT registration number, CR number, and legal name fields required on financial documents; Phase 10 (Document & Print Designer): provides the template engine used for financial document rendering
- **ZATCA e-Invoicing Technical Specifications** (external) — official ZATCA developer portal documentation for Phase 1 and Phase 2 e-invoicing requirements; authoritative source for all ZATCA-related implementation decisions
- **IFRS Standards** (external) — International Financial Reporting Standards; primary accounting framework for Sefay's target market
- **Saudi VAT Law and Implementing Regulations** (external) — General Authority of Zakat and Tax; authoritative source for VAT rules in Saudi Arabia

---

## Notes

This document is a long-term engineering proposal for the Sefay ERP platform. It represents a vision for what the accounting and financial management capabilities of Sefay could become. It is a planning and alignment tool, not a commitment.

The following caveats apply:

- **No code has been written** for any part of this initiative. This document is specification only.
- **Priorities may change.** The milestone ordering reflects a considered recommendation, not a binding schedule. Business priorities, team capacity, and customer demand may all cause the actual implementation order to differ from what is described here.
- **Technical decisions may change.** The database schema, service design, and architectural patterns described are proposals. The engineering team implementing this initiative should review and refine all technical decisions before implementation begins.
- **Milestone scope may change.** As implementation proceeds, some milestones may be split, merged, or rescoped based on actual complexity discovered during development.
- **This document should be updated** as decisions are made, milestones are refined, and the initiative moves closer to implementation. The `Last Updated` date at the top of this document should reflect the most recent substantive revision.
- **External regulatory requirements** (ZATCA specifications, Saudi VAT law) are subject to change by the relevant authorities. The compliance framework in this initiative is designed to accommodate such changes, but the implementation team must monitor regulatory developments and update the technical implementation accordingly.
