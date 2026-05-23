export type PlanInterval = 'monthly' | 'yearly'

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'cancelled'
  | 'expired'
  | 'suspended'

export interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_branches: number
  is_active: boolean
}

export interface Subscription {
  id: string
  tenant_id: string
  tenant_name: string
  plan_id: string
  plan_name: string
  status: SubscriptionStatus
  interval: PlanInterval
  started_at: string
  ends_at: string
  cancelled_at: string | null
  amount_paid: number
}

export interface CreatePlanDto {
  name: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_branches: number
}

export interface ManualPaymentDto {
  tenant_id: string
  plan_id: string
  interval: PlanInterval
  amount: number
  note?: string
}
