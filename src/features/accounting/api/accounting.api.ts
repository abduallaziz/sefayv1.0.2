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

export const accountingApi = {
  getCommandCenter: () => apiClient.get<CommandCenterSummary>('/accounting/command-center'),
  getFiscalPeriods: () => apiClient.get<FiscalPeriod[]>('/accounting/fiscal-periods'),
}
