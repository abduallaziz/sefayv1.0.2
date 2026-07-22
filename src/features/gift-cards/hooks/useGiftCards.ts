import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { giftCardsApi, GiftCardInput } from '../api/gift-cards.api'

export function useGiftCards() {
  return useQuery({
    queryKey: ['gift-cards'],
    queryFn: () => giftCardsApi.getAll(),
  })
}

export function useCreateGiftCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GiftCardInput) => giftCardsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gift-cards'] }),
  })
}

export function useUpdateGiftCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ is_active: boolean; expires_at: string }> }) =>
      giftCardsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gift-cards'] }),
  })
}

export function useDeleteGiftCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => giftCardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gift-cards'] }),
  })
}
