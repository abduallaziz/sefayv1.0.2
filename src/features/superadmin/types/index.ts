export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled'

export interface Tenant {
  id: string
  name: string
  business_type: string
  status: TenantStatus
  trial_ends_at: string | null
  created_at: string
  deleted_at: string | null
  users_count?: number
  branches_count?: number
  mrr?: number
}

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
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  started_at: string
  ends_at: string
  plan?: Plan
  tenant?: Tenant
}

export interface OverviewStats {
  total_tenants: number
  active_tenants: number
  trial_tenants: number
  suspended_tenants: number
  mrr: number
  arr: number
  churn_rate: number
  new_tenants_this_month: number
}

export interface RevenueData {
  month: string
  revenue: number
  tenants: number
}

export interface AuditLog {
  id: string
  tenant_id: string | null
  actor_id: string
  actor_role: string
  action: string
  resource_type: string
  resource_id: string
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  ip_address: string
  device: string
  created_at: string
}