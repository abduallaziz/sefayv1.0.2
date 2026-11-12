import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rewardsApi, RewardDefinitionInput } from '../api/rewards.api'
import { customerRewardsApi, type CustomerRewardInstance } from '../api/rewards.api'

export function useRewardDefinitions() {
  return useQuery({
    queryKey: ['reward-definitions'],
    queryFn: () => rewardsApi.getAll(),
  })
}

export function useCreateRewardDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RewardDefinitionInput) => rewardsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-definitions'] }),
  })
}

export function useUpdateRewardDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RewardDefinitionInput> }) =>
      rewardsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-definitions'] }),
  })
}

export function useDeleteRewardDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rewardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-definitions'] }),
  })
}

// Suggestion surface for a given customer — never mutates anything, see
// api/src/modules/rewards/customer-rewards.controller.ts. Defaults to
// 'unlocked' (available-to-redeem) status, same default the backend uses
// when no ?status filter is given.
export function useCustomerRewards(customerId: string | undefined, status: string = 'unlocked') {
  return useQuery({
    queryKey: ['customer-rewards', customerId, status],
    queryFn: () => customerRewardsApi.getForCustomer(customerId as string, status),
    enabled: !!customerId,
    // A reward is earned by the sale that just finished, so the list must never be
    // served from cache: fetch it fresh every time a customer is picked.
    staleTime: 0,
    gcTime: 0,
  })
}

// The backend endpoint always applies a single status filter (defaulting to
// 'unlocked' when none is given — see CustomerRewardsController.findAvailable)
// — there is no "all statuses" query. To show a customer's full reward
// history (available/redeemed/expired) in one panel, this fans out one
// request per status and merges the results client-side, newest-unlocked
// first per status bucket (same ordering findByCustomer already returns).
const HISTORY_STATUSES = ['unlocked', 'redeemed', 'expired'] as const

export function useCustomerRewardsHistory(customerId: string | undefined) {
  const results = useQueries({
    queries: HISTORY_STATUSES.map((status) => ({
      queryKey: ['customer-rewards', customerId, status],
      queryFn: () => customerRewardsApi.getForCustomer(customerId as string, status),
      enabled: !!customerId,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const data: CustomerRewardInstance[] = results.flatMap((r) => r.data ?? [])

  return { data, isLoading }
}
