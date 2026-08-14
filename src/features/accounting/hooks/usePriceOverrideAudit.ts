import { useQuery } from '@tanstack/react-query'
import { accountingApi, PriceOverrideAuditQuery } from '../api/accounting.api'

export function usePriceOverrideAudits(query: PriceOverrideAuditQuery, enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'price-override-audit', query],
    queryFn: () => accountingApi.getPriceOverrideAudits(query),
    enabled,
  })
}

export function usePriceOverrideAuditDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'price-override-audit', id],
    queryFn: () => accountingApi.getPriceOverrideAudit(id as string),
    enabled: enabled && !!id,
  })
}
