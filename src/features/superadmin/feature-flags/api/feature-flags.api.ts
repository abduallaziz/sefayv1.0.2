import { apiClient } from '@/lib/api'
import type {
  Feature,
  PlanFeature,
  FeatureWithOverride,
  UpsertOverrideDto,
} from '../types/feature-flags.types'

export const featureFlagsApi = {
  getFeatures: (): Promise<Feature[]> =>
    apiClient.get('/superadmin/features'),

  getPlanFeatures: (planId: string): Promise<PlanFeature[]> =>
    apiClient.get(`/superadmin/plans/${planId}/features`),

  getTenantFeatures: (tenantId: string): Promise<FeatureWithOverride[]> =>
    apiClient.get(`/superadmin/tenants/${tenantId}/features`),

  upsertOverride: (data: UpsertOverrideDto): Promise<void> =>
    apiClient.patch(
      `/superadmin/tenants/${data.tenant_id}/features/${data.feature_key}`,
      {
        is_enabled: data.is_enabled,
        limit_value: data.limit_value,
        note: data.note,
      }
    ),

  resetOverride: (tenantId: string, featureKey: string): Promise<void> =>
    apiClient.delete(
      `/superadmin/tenants/${tenantId}/features/${featureKey}/override`
    ),
}