import { apiClient } from '@/lib/api'
import type { Plan, CreatePlanDto, Subscription, ManualPaymentDto } from '../types/subscription.types'

export const subscriptionsApi = {
  // ─── Plans (endpoint: /plans — not /superadmin/plans) ────────────────────
  getPlans: (): Promise<Plan[]> =>
    apiClient.get('/plans'),

  createPlan: (data: CreatePlanDto): Promise<Plan> =>
    apiClient.post('/plans', data),

  updatePlan: (id: string, data: Partial<CreatePlanDto>): Promise<Plan> =>
    apiClient.patch(`/plans/${id}`, data),

  togglePlan: (id: string, is_active: boolean): Promise<Plan> =>
    apiClient.patch(`/plans/${id}`, { is_active }),

  // ─── Subscriptions (superadmin) ────────────────────────────────────────────
  getSubscriptions: (filters?: { status?: string; search?: string }): Promise<Subscription[]> => {
    const query = new URLSearchParams()
    if (filters?.status) query.append('status', filters.status)
    if (filters?.search) query.append('search', filters.search)
    const qs = query.toString()
    return apiClient.get(`/superadmin/subscriptions${qs ? `?${qs}` : ''}`)
  },

  cancelSubscription: (id: string): Promise<void> =>
    apiClient.delete(`/superadmin/subscriptions/${id}/cancel`),

  manualPayment: (data: ManualPaymentDto): Promise<void> =>
    apiClient.post('/superadmin/subscriptions/manual-payment', data),
}