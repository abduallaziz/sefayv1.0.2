import { apiClient } from '@/lib/api'
import type {
  Plan,
  Subscription,
  CreatePlanDto,
  ManualPaymentDto,
} from '../types/subscription.types'

export const subscriptionsApi = {
  getSubscriptions: (params?: { status?: string; search?: string }): Promise<Subscription[]> => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.search) query.append('search', params.search)
    return apiClient.get(`/superadmin/subscriptions?${query.toString()}`)
  },

  getPlans: (): Promise<Plan[]> =>
    apiClient.get('/superadmin/plans'),

  createPlan: (data: CreatePlanDto): Promise<Plan> =>
    apiClient.post('/superadmin/plans', data),

  updatePlan: (id: string, data: Partial<CreatePlanDto>): Promise<Plan> =>
    apiClient.patch(`/superadmin/plans/${id}`, data),

  togglePlan: (id: string, is_active: boolean): Promise<void> =>
    apiClient.patch(`/superadmin/plans/${id}`, { is_active }),

  cancelSubscription: (id: string): Promise<void> =>
    apiClient.patch(`/superadmin/subscriptions/${id}/cancel`, {}),

  manualPayment: (data: ManualPaymentDto): Promise<void> =>
    apiClient.post('/superadmin/subscriptions/manual-payment', data),
}