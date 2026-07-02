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
  owner_name?: string
  owner_email?: string
  subscription_plan?: string
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

// Backend returns camelCase from getGlobalStats()
export interface GlobalStats {
  totalTenants: number
  totalUsers: number
  totalOrders: number
  totalRevenue: number
}

// Analytics summary from /superadmin/analytics/summary
export interface AnalyticsSummary {
  mrr: number
  arr: number
  totalTenants: number
  activeTenants: number
  trialTenants: number
  churnRate: number
  growthRate: number
  newTenantsThisMonth: number
}

export interface MRRHistoryPoint {
  month: string
  mrr: number
}

export interface ChurnData {
  churnRate: number
  churned: number
  startingCount: number
  monthly: { month: string; churned: number; rate: number }[]
}

export interface GrowthData {
  growthRate: number
  newTenants: number
  monthly: { month: string; new: number; cumulative: number }[]
}

export interface RevenueByPlanItem {
  planName: string
  tenantCount: number
  mrr: number
  percentage: number
}

export interface AuditLog {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  resource: string
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditLogsResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}

// Legacy — kept for backward compat with existing components
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