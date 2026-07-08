import { apiClient } from '@/lib/api'

export interface LoyaltyTier {
  id: string
  name: string
  min_lifetime_points: number
  points_multiplier: number
  sort_order: number
  created_at: string
}

export interface LoyaltyTierInput {
  name: string
  min_lifetime_points: number
  points_multiplier: number
  sort_order?: number
}

export const loyaltyTiersApi = {
  getAll: (): Promise<LoyaltyTier[]> => apiClient.get('/loyalty-tiers'),

  create: (data: LoyaltyTierInput): Promise<LoyaltyTier> => apiClient.post('/loyalty-tiers', data),

  update: (id: string, data: Partial<LoyaltyTierInput>): Promise<LoyaltyTier> =>
    apiClient.patch(`/loyalty-tiers/${id}`, data),

  remove: (id: string): Promise<void> => apiClient.delete(`/loyalty-tiers/${id}`),
}
