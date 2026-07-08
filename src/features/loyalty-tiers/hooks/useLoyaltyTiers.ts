import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loyaltyTiersApi, LoyaltyTierInput } from '../api/loyalty-tiers.api'

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: () => loyaltyTiersApi.getAll(),
  })
}

export function useCreateLoyaltyTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LoyaltyTierInput) => loyaltyTiersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-tiers'] }),
  })
}

export function useUpdateLoyaltyTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LoyaltyTierInput> }) =>
      loyaltyTiersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-tiers'] }),
  })
}

export function useDeleteLoyaltyTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => loyaltyTiersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-tiers'] }),
  })
}
