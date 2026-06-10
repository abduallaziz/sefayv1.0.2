export type BillingCycle = 'monthly' | 'yearly'  // H-016 FIX: was PlanInterval

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'cancelled'
  | 'expired'
  | 'suspended'
  | 'grace_period'

export interface Plan {
  id: string
  name: string
  description?: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_branches: number
  trial_days: number
  is_active: boolean
}

export interface Subscription {
  id: string
  tenant_id: string
  tenant_name?: string         // H-017: not in DB — populated by backend join if available
  plan_id: string
  plan_name?: string           // H-018: not in DB — populated by backend join if available
  status: SubscriptionStatus
  billing_cycle: BillingCycle  // H-016 FIX: was interval
  started_at: string
  current_period_end: string | null
  cancelled_at: string | null
  trial_ends_at: string | null
  amount_paid?: number         // H-019: from payments table — optional
}

export interface CreatePlanDto {
  name: string
  description?: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_branches: number
  trial_days?: number
}

export interface ManualPaymentDto {
  tenant_id: string
  plan_id: string
  billing_cycle: BillingCycle  // H-016 FIX: was interval
  amount: number
  note?: string
}