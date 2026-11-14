import { apiClient } from '@/lib/api'

// Branch Management — Branch System Step 1 (Owner-approved). Uses the
// existing `/branches` backend CRUD exactly as it already exists — no
// backend change accompanies this feature. Deliberately excludes
// `default_warehouse_id`/geofence fields from the create/edit form (out of
// this step's scope) even though the backend accepts them on update.
// Exact shape returned by the backend's SELECT list (branches.repository.ts)
// — no tenant_id/deleted_at/updated_at are selected, so they aren't typed
// here either.
export interface BranchRecord {
  id: string
  name: string
  address: string | null
  is_active: boolean
  is_main?: boolean
  created_at: string
  default_warehouse_id: string | null
  geofence_lat: number | null
  geofence_lng: number | null
  geofence_radius_m: number | null
}

export interface CreateBranchDto {
  name: string
  address?: string
  /** Branch isolation only: copy the main branch's setup (categories, expense lookups, shift patterns...) */
  copy_setup_from_main?: boolean
}

export interface UpdateBranchDto {
  name?: string
  address?: string
  is_active?: boolean
}

export interface BranchIsolation {
  enabled: boolean
  main_branch_id: string | null
}

export type PublishMode = 'copy_new' | 'update_existing'

export interface PublishTypeInfo {
  type: string
  group: string
  label_ar: string
  label_en: string
  supported: boolean
  reason?: string
}

export interface PublishTargetResult {
  branch_id: string
  branch_name: string
  created: number
  updated: number
  skipped: number
  failed: number
  errors: { source_id: string; message: string }[]
}

export interface PublishResult {
  entity_type: string
  mode: PublishMode
  source_count: number
  results: PublishTargetResult[]
}

export interface PublishRequest {
  entity_type: string
  source_ids: string[]
  target_branch_ids: string[] | 'all'
  mode: PublishMode
}

export const branchesApi = {
  publishTypes: () => apiClient.get<PublishTypeInfo[]>('/branches/publish/types'),
  publish: (dto: PublishRequest) => apiClient.post<PublishResult>('/branches/publish', dto),
  getIsolation: () => apiClient.get<BranchIsolation>('/branches/isolation/status'),
  setIsolation: (enabled: boolean) => apiClient.put<BranchIsolation>('/branches/isolation/status', { enabled }),
  setMain: (id: string) => apiClient.patch<BranchRecord>(`/branches/${id}/main`, {}),
  getAll: () => apiClient.get<BranchRecord[]>('/branches'),
  getOne: (id: string) => apiClient.get<BranchRecord>(`/branches/${id}`),
  create: (dto: CreateBranchDto) => apiClient.post<BranchRecord>('/branches', dto),
  update: (id: string, dto: UpdateBranchDto) => apiClient.patch<BranchRecord>(`/branches/${id}`, dto),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/branches/${id}`),
}
