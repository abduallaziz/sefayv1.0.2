export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled';

export interface Tenant {
  id: string;
  name: string;
  business_type: string;
  status: TenantStatus;
  trial_ends_at: string | null;
  created_at: string;
  deleted_at: string | null;
  owner_name?: string;
  owner_email?: string;
  branches_count?: number;
  users_count?: number;
  subscription_plan?: string;
}