import { apiClient } from '@/lib/api'

export interface GiftCard {
  id: string
  code: string
  initial_balance: number
  current_balance: number
  customer_id: string | null
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface GiftCardInput {
  code?: string
  initial_balance: number
  customer_id?: string
  expires_at?: string
}

export interface GiftCardValidation {
  code: string
  current_balance: number
}

export const giftCardsApi = {
  getAll: (): Promise<GiftCard[]> => apiClient.get('/gift-cards'),

  create: (data: GiftCardInput): Promise<GiftCard> => apiClient.post('/gift-cards', data),

  update: (id: string, data: Partial<{ is_active: boolean; expires_at: string }>): Promise<GiftCard> =>
    apiClient.patch(`/gift-cards/${id}`, data),

  remove: (id: string): Promise<void> => apiClient.delete(`/gift-cards/${id}`),

  // Preview-only — does not redeem/decrement the balance. Throws if the code is
  // invalid/inactive/expired/has insufficient balance, same errors as checkout itself.
  validate: (code: string, amount: number): Promise<GiftCardValidation> =>
    apiClient.post('/gift-cards/validate', { code, amount }),
}
