import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kitchenApi } from '../api/kitchen.api'

export function useKitchenOrders(branchId?: string) {
  return useQuery({
    queryKey: ['kitchen', 'orders', branchId],
    queryFn: () => kitchenApi.getActiveOrders(branchId),
    refetchInterval: 10000,
  })
}

export function useUpdateKitchenItemStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) => kitchenApi.updateItemStatus(itemId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen'] }),
  })
}
