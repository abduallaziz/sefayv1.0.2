import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kitchenApi } from '../api/kitchen.api'
import { useRealtimeStatusStore } from '@/core/realtime/realtime-status.store'

export function useKitchenOrders(branchId?: string) {
  const realtimeConnected = useRealtimeStatusStore((s) => s.connected)
  return useQuery({
    queryKey: ['kitchen', 'orders', branchId],
    queryFn: () => kitchenApi.getActiveOrders(branchId),
    // Fallback polling only — new/changed items push via RealtimeProvider's
    // order_items subscription, invalidating this same query key instantly.
    refetchInterval: realtimeConnected ? false : 10000,
  })
}

export function useUpdateKitchenItemStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) => kitchenApi.updateItemStatus(itemId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen'] }),
  })
}
