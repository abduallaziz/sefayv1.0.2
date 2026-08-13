import { useQuery } from '@tanstack/react-query'
import { accountingApi, JournalEntriesQuery } from '../api/accounting.api'

export function useJournalEntries(query: JournalEntriesQuery, enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'journal-entries', query],
    queryFn: () => accountingApi.getJournalEntries(query),
    enabled,
  })
}

export function useJournalEntryDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'journal-entries', id],
    queryFn: () => accountingApi.getJournalEntry(id as string),
    enabled: enabled && !!id,
  })
}

// Accounts change rarely relative to journal entries — a longer staleTime
// avoids refetching the whole chart just to label a line's account_id
// every time the detail drawer opens.
export function useChartOfAccounts(enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'chart-of-accounts'],
    queryFn: () => accountingApi.getChartOfAccounts(),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useCogsReconciliation(query: JournalEntriesQuery, enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'cogs-reconciliation', query],
    queryFn: () => accountingApi.getCogsReconciliation(query),
    enabled,
  })
}
