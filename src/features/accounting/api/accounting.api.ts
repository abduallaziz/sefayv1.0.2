import { apiClient } from '@/lib/api'

// Accounting UI Phase 1, Step 1 — Command Center only. Response shape
// matches AccountingRepository.getCommandCenterSummary() (Accounting
// Backend Phase 1) field-for-field — no value here is computed
// client-side beyond simple formatting.
export interface CommandCenterSummary {
  revenue: number
  cashAndBank: number
  accountsReceivable: number
  taxLiability: number
  cogs: number
  grossProfit: number
  reconciliationExceptions: number
  tenantsWithAccountingOwner: number
  totalBranches: number
  branchesAssigned: number
}

export interface FiscalPeriod {
  id: string
  fiscal_year_id: string
  period_number: number
  start_date: string
  end_date: string
  status: 'open' | 'closed'
}

// Step 2 — Journal Entries. Field set matches AccountingRepository's
// JOURNAL_ENTRY_SELECT exactly (confirmed against the live deployed API,
// not just the source) — no debit/credit/branch/account field exists on
// the list row today, only on the detail response below. The list UI
// deliberately shows only what this type actually carries.
export interface JournalEntry {
  id: string
  reference: string | null
  description: string | null
  source_module: string
  source_entity_type: string
  source_entity_id: string
  status: 'draft' | 'posted' | 'reversed'
  posting_date: string
  fiscal_period_id: string | null
  reversal_of_id: string | null
  requires_cogs_reconciliation: boolean
  created_by: string | null
  created_at: string
  posted_at: string | null
  reversed_at: string | null
}

export interface JournalLine {
  id: string
  line_number: number
  account_id: string
  debit_amount: number
  credit_amount: number
  description: string | null
}

// order/priceOverrideAudits/reversalEntry are only populated by the API
// when the entry is sales-sourced (source_module 'sales', source_entity_type
// 'order') — null/[] otherwise, matching AccountingRepository.findJournalEntryDetail
// exactly. No order_items array exists here; order is aggregate totals only.
export interface JournalEntryOrderSummary {
  id: string
  branch_id: string | null
  payment_method: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  cash_amount: number | null
  card_amount: number | null
  customer_id: string | null
  status: string
}

export interface JournalEntryPriceOverrideAudit {
  id: string
  order_item_id: string
  official_unit_price: number
  approved_unit_price: number
  difference_amount: number
  difference_percent: number
  direction: string
  reason: string | null
}

export interface JournalEntryReversalRef {
  id: string
  status: string
  created_at: string
}

export interface JournalEntryDetail extends JournalEntry {
  lines: JournalLine[]
  order: JournalEntryOrderSummary | null
  priceOverrideAudits: JournalEntryPriceOverrideAudit[]
  reversalEntry: JournalEntryReversalRef | null
}

export interface PagedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface JournalEntriesQuery {
  page?: number
  per_page?: number
  date_from?: string
  date_to?: string
  fiscal_period_id?: string
  branch_id?: string
  account_id?: string
  source_module?: string
  status?: 'draft' | 'posted' | 'reversed'
  amount_min?: number
  amount_max?: number
  created_by?: string
}

export interface Account {
  id: string
  parent_account_id: string | null
  code: string
  name: string
  account_type: string
  normal_balance: string
  is_posting_account: boolean
  is_active: boolean
  roleCodes: string[]
}

function toQueryString<T extends object>(query: T): string {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

// Step 4 — Price Override Audit. Field set matches AccountingRepository's
// findPriceOverrideAudits()/findPriceOverrideAuditDetail() exactly (confirmed
// against both source and the live deployed API). Every reference field
// (branch_id, order_id, order_item_id, actor_id, actor_role_id, item_id) is
// a raw UUID with no server-side join — resolved client-side via the
// existing branches/users/items/roles hooks, same pattern as Step 2/3's
// account/fiscal-period labeling. actor_role_name_snapshot is the one
// exception: already a plain string captured at action time, no join needed.
export interface PriceOverrideAudit {
  id: string
  branch_id: string
  order_id: string
  order_item_id: string
  actor_id: string
  actor_role_id: string
  actor_role_name_snapshot: string
  item_id: string
  official_unit_price: number
  approved_unit_price: number
  difference_amount: number
  difference_percent: number
  direction: 'discount' | 'increase'
  reason: string | null
  created_at: string
}

// journalEntry here is {id, status, posting_date} only — no `reference`
// string (confirmed live). The Detail sheet resolves a human reference by
// calling the existing GET /accounting/journal-entries/:id on demand, not
// by inventing a field that doesn't exist on this response.
export interface PriceOverrideAuditDetail extends PriceOverrideAudit {
  tenant_id: string
  effective_policy_snapshot: Record<string, unknown> | null
  journalEntry: { id: string; status: string; posting_date: string } | null
}

// No `amount` or `policy` filter exists in the backend DTO at all (confirmed
// against PriceOverrideAuditQueryDto) — only difference_percent_min/max.
// Deliberately not included here; do not add client-side params the API
// silently ignores.
export interface PriceOverrideAuditQuery {
  page?: number
  per_page?: number
  date_from?: string
  date_to?: string
  branch_id?: string
  order_id?: string
  item_id?: string
  actor_id?: string
  actor_role_id?: string
  direction?: 'discount' | 'increase'
  difference_percent_min?: number
  difference_percent_max?: number
  reason?: string
}

export const accountingApi = {
  getCommandCenter: () => apiClient.get<CommandCenterSummary>('/accounting/command-center'),
  getFiscalPeriods: () => apiClient.get<FiscalPeriod[]>('/accounting/fiscal-periods'),
  getJournalEntries: (query: JournalEntriesQuery) =>
    apiClient.get<PagedResult<JournalEntry>>(`/accounting/journal-entries${toQueryString(query)}`),
  getJournalEntry: (id: string) =>
    apiClient.get<JournalEntryDetail>(`/accounting/journal-entries/${id}`),
  getChartOfAccounts: () => apiClient.get<Account[]>('/accounting/chart-of-accounts'),
  // Step 3 — COGS Reconciliation. Same PagedResult<JournalEntry> shape as
  // getJournalEntries: AccountingService.listCogsReconciliation() calls the
  // identical findJournalEntries() repository method, just server-side
  // pre-filtered to source_module='sales' + requires_cogs_reconciliation=true
  // (confirmed against both source and the live deployed API — no
  // COGS-specific field exists anywhere in this response).
  getCogsReconciliation: (query: JournalEntriesQuery) =>
    apiClient.get<PagedResult<JournalEntry>>(`/accounting/cogs-reconciliation${toQueryString(query)}`),
  getPriceOverrideAudits: (query: PriceOverrideAuditQuery) =>
    apiClient.get<PagedResult<PriceOverrideAudit>>(`/accounting/price-override-audit${toQueryString(query)}`),
  getPriceOverrideAudit: (id: string) =>
    apiClient.get<PriceOverrideAuditDetail>(`/accounting/price-override-audit/${id}`),
}
