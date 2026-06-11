import { apiClient } from '@/lib/api'

export interface TenantProfile {
  id: string
  name: string
  business_type: string
  status: string
  created_at: string
}

export interface TenantSubscription {
  plan_name: string
  status: string
  ends_at: string | null
  interval: string
}

export interface TenantUsage {
  users: { current: number; max: number }
  branches: { current: number; max: number }
}

export interface UpdateProfileDto {
  name?: string
  business_type?: string
}

export const settingsApi = {
  getProfile: (): Promise<TenantProfile> =>
    apiClient.get('/tenant/profile'),

  updateProfile: (data: UpdateProfileDto): Promise<TenantProfile> =>
    apiClient.patch('/tenant/profile', data),

  getSubscription: (): Promise<TenantSubscription> =>
    apiClient.get('/tenant/subscription'),

  getUsage: (): Promise<TenantUsage> =>
    apiClient.get('/tenant/usage'),
}