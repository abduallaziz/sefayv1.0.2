import { apiClient } from '@/lib/api'

export interface PosRegister {
  id: string
  tenant_id: string
  branch_id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export const posRegistersApi = {
  listByBranch: (branchId: string): Promise<PosRegister[]> =>
    apiClient.get(`/pos-registers?branch_id=${encodeURIComponent(branchId)}`),
  create: (data: { branch_id: string; name: string }): Promise<PosRegister> =>
    apiClient.post('/pos-registers', data),
  update: (id: string, data: { name?: string; is_active?: boolean }): Promise<PosRegister> =>
    apiClient.patch(`/pos-registers/${id}`, data),
  remove: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/pos-registers/${id}`),
}
