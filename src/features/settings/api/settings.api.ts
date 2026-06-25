import { apiClient } from '@/lib/api'

export interface TenantProfile {
  id: string
  name: string
  business_type: string
  status: string
  created_at: string
  currency_code: string
  currency_symbol: string
  tax_rate: number
  customer_capture_enabled: boolean
  name_field_enabled: boolean
}

export interface TenantSubscription {
  plan_name: string
  status: string
  current_period_end: string | null
  billing_cycle: string
  max_users: number
  max_branches: number
}

export interface TenantUsage {
  users: { used: number; limit: number | null }
  branches: { used: number; limit: number | null }
  invoices_this_month: { used: number; limit: number | null }
}

export interface UpdateProfileDto {
  name?: string
  business_type?: string
  currency_code?: string
  currency_symbol?: string
  tax_rate?: number
  customer_capture_enabled?: boolean
  name_field_enabled?: boolean
}

export const settingsApi = {
  getProfile: (): Promise<TenantProfile> =>
    apiClient.get('/tenant/profile'),

  updateProfile: (data: UpdateProfileDto): Promise<TenantProfile> =>
    apiClient.patch('/tenant/profile', data),

  getSubscription: (): Promise<{ tenant_status: string; trial_ends_at: string | null; subscription: TenantSubscription | null }> =>
    apiClient.get('/tenant/subscription'),

  getUsage: (): Promise<TenantUsage> =>
    apiClient.get('/tenant/usage'),
}