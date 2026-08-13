import { useQuery } from '@tanstack/react-query'
import { accountingApi } from '../api/accounting.api'

export function useCommandCenter(enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'command-center'],
    queryFn: () => accountingApi.getCommandCenter(),
    enabled,
  })
}

export function useFiscalPeriods(enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'fiscal-periods'],
    queryFn: () => accountingApi.getFiscalPeriods(),
    enabled,
  })
}
