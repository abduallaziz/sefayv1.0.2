import { apiClient } from '@/lib/api'
import type { Plan, CreatePlanDto } from '../types/subscription.types'

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

  // ─── Subscriptions ────────────────────────────────────────────────────────
  // No superadmin subscriptions list endpoint in backend — not implemented yet
  cancelSubscription: (_id: string): Promise<void> => {
    // Backend: DELETE /subscriptions/cancel (tenant-scoped — not superadmin)
    // Superadmin cancel not available yet
    return Promise.reject(new Error('cancelSubscription: no superadmin endpoint available'))
  },

  manualPayment: (_data: unknown): Promise<void> => {
    // No manual payment endpoint in backend
    return Promise.reject(new Error('manualPayment: no endpoint available'))
  },
}