import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kitchenApi } from '../api/kitchen.api'

export function useKitchenOrders(branchId?: string, enabled = true) {
  return useQuery({
    queryKey: ['kitchen', 'orders', branchId],
    queryFn: () => kitchenApi.getActiveOrders(branchId),
    enabled,
    // The kitchen must never show a stale board: poll every 10s even when realtime is
    // connected (realtime pushes only speed it up), and refetch when the tab regains focus.
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  })
}

export function useUpdateKitchenItemStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) => kitchenApi.updateItemStatus(itemId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen'] }),
  })
}
