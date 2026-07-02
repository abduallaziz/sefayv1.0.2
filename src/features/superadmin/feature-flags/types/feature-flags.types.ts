export type FeatureCategory = 'core' | 'advanced' | 'premium'

export interface Feature {
  id: string
  key: string
  name: string
  description: string
  category: FeatureCategory
  is_enabled: boolean
}

export interface PlanFeature {
  plan_id: string
  feature_key: string
  is_enabled: boolean
  limit_value: number | null
}

export interface TenantFeatureOverride {
  id: string
  tenant_id: string
  feature_key: string
  is_enabled: boolean | null
  limit_value: number | null
  overridden_by: string
  overridden_at: string
  note: string | null
}

export interface FeatureWithOverride extends Feature {
  plan_default: boolean
  plan_limit: number | null
  tenant_override: TenantFeatureOverride | null
  effective_enabled: boolean
  effective_limit: number | null
}

export interface UpsertOverrideDto {
  tenant_id: string
  feature_key: string
  is_enabled: boolean | null
  limit_value: number | null
  note?: string
}