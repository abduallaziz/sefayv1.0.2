import { apiClient } from '@/lib/api'

export interface Entitlements {
  enforced: boolean
  phase: 'trial' | 'active' | 'grace' | 'locked' | 'none'
  locked: boolean
  days_left: number | null
  show_countdown: boolean
  ends_at: string | null
  status: string | null
  billing_cycle: 'monthly' | 'yearly' | null
  plan: { id: string; name: string } | null
  limits: { max_users: number; max_branches: number; max_pos: number }
  features: string[]
}

export interface RenewPlan {
  id: string
  name: string
  description?: string | null
  price_monthly: number
  price_yearly: number
  max_users: number
  max_branches: number
  is_active: boolean
}

export const subscriptionGateApi = {
  getEntitlements: (): Promise<Entitlements> => apiClient.get('/subscriptions/entitlements'),
  getPlans: (): Promise<RenewPlan[]> => apiClient.get('/plans'),
  renew: (planId: string, cycle: 'monthly' | 'yearly') =>
    apiClient.post('/subscriptions/upgrade', { plan_id: planId, billing_cycle: cycle }),
  devExpire: () => apiClient.post('/subscriptions/dev-expire', {}),
}
