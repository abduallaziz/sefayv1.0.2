import { apiClient } from '@/lib/api'

export type RewardTriggerType =
  | 'purchase_count'
  | 'spend_threshold'
  | 'product_category'
  | 'birthday'
  | 'campaign'
  | 'loyalty_points'

export type RewardType =
  | 'free_item'
  | 'percentage_discount'
  | 'fixed_discount'
  | 'coupon_reference'

export type RewardBranchScope = 'all' | 'specific'

export interface RewardDefinition {
  id: string
  name: string
  trigger_type: RewardTriggerType
  trigger_config: Record<string, unknown>
  reward_type: RewardType
  reward_config: Record<string, unknown>
  usage_conditions: Record<string, unknown> | null
  branch_scope: RewardBranchScope
  branch_id: string | null
  expiration_days: number | null
  is_active: boolean
  created_at: string
}

export interface RewardDefinitionInput {
  name: string
  trigger_type: RewardTriggerType
  trigger_config: Record<string, unknown>
  reward_type: RewardType
  reward_config: Record<string, unknown>
  usage_conditions?: Record<string, unknown>
  branch_scope: RewardBranchScope
  branch_id?: string
  expiration_days?: number
  is_active?: boolean
}

export const rewardsApi = {
  getAll: (): Promise<RewardDefinition[]> => apiClient.get('/reward-definitions'),

  getOne: (id: string): Promise<RewardDefinition> => apiClient.get(`/reward-definitions/${id}`),

  create: (data: RewardDefinitionInput): Promise<RewardDefinition> =>
    apiClient.post('/reward-definitions', data),

  update: (id: string, data: Partial<RewardDefinitionInput>): Promise<RewardDefinition> =>
    apiClient.patch(`/reward-definitions/${id}`, data),

  remove: (id: string): Promise<void> => apiClient.delete(`/reward-definitions/${id}`),
}

// --- Customer reward instances (suggestion surface — see
// api/src/modules/rewards/customer-rewards.controller.ts) ---

export type RewardInstanceStatus = 'locked' | 'unlocked' | 'redeemed' | 'expired'

export interface CustomerRewardInstance {
  id: string
  tenant_id: string
  customer_id: string
  reward_definition_id: string
  status: RewardInstanceStatus
  unlocked_at: string | null
  redeemed_at: string | null
  expires_at: string | null
  order_id: string | null
  /** fixed-amount rewards: unused balance; null/absent = the full definition amount */
  remaining_amount?: number | string | null
  reward_definitions: RewardDefinition | null
}

export const customerRewardsApi = {
  // Passing an empty/falsy status omits the query param entirely, which the
  // backend (CustomerRewardsController.findAvailable) treats as "no status
  // filter" — i.e. every instance regardless of lifecycle state. Passing a
  // real status ('unlocked', 'redeemed', 'expired', 'locked') filters to it.
  getForCustomer: (customerId: string, status?: string): Promise<CustomerRewardInstance[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    return apiClient.get(`/customers/${customerId}/rewards${qs}`)
  },
}
