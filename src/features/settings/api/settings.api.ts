import { apiClient } from '@/lib/api'

export interface PrinterSettings {
  paper_width?: '58mm' | '80mm'
  auto_print?: boolean
  printer_name?: string
}

export interface NotificationPreferences {
  subscription_expired?: boolean
  payment_failed?: boolean
  payment_success?: boolean
}

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
  logo_url: string | null
  tax_number: string | null
  invoice_footer: string | null
  printer_settings: PrinterSettings
  notification_preferences: NotificationPreferences
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
  logo_url?: string
  tax_number?: string
  invoice_footer?: string
  printer_settings?: PrinterSettings
  notification_preferences?: NotificationPreferences
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