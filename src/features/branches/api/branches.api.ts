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
  created_at: string
  default_warehouse_id: string | null
  geofence_lat: number | null
  geofence_lng: number | null
  geofence_radius_m: number | null
}

export interface CreateBranchDto {
  name: string
  address?: string
}

export interface UpdateBranchDto {
  name?: string
  address?: string
  is_active?: boolean
}

export const branchesApi = {
  getAll: () => apiClient.get<BranchRecord[]>('/branches'),
  getOne: (id: string) => apiClient.get<BranchRecord>(`/branches/${id}`),
  create: (dto: CreateBranchDto) => apiClient.post<BranchRecord>('/branches', dto),
  update: (id: string, dto: UpdateBranchDto) => apiClient.patch<BranchRecord>(`/branches/${id}`, dto),
}
