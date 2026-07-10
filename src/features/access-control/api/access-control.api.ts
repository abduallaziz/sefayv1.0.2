import { apiClient } from '@/lib/api'

export interface PermissionGroup {
  id: string
  code: string
  name_ar: string
  name_en: string
  sort_order: number
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
  group_id: string | null
  group_code: string | null
}

export interface RoleSummary {
  id: string
  name: string
  description: string | null
  is_system: boolean
  user_count: number
  permission_count: number
  customized_permission_count: number
  created_at: string
  updated_at: string
}

export interface ResolvedPermission {
  permission_key: string
  group_code: string | null
  description: string | null
  granted: boolean
  source: 'global' | 'tenant_override'
}

export const accessControlApi = {
  getPermissionGroups: (): Promise<PermissionGroup[]> =>
    apiClient.get('/access-control/permission-groups'),

  getPermissions: (): Promise<Permission[]> =>
    apiClient.get('/access-control/permissions'),

  getRoles: (): Promise<RoleSummary[]> =>
    apiClient.get('/access-control/roles'),

  getRolePermissions: (roleId: string): Promise<ResolvedPermission[]> =>
    apiClient.get(`/access-control/roles/${roleId}/permissions`),

  updatePermission: (roleId: string, permissionKey: string, isGranted: boolean): Promise<ResolvedPermission> =>
    apiClient.patch(`/access-control/roles/${roleId}/permissions/${permissionKey}`, { is_granted: isGranted }),

  resetPermission: (roleId: string, permissionKey: string): Promise<ResolvedPermission> =>
    apiClient.delete(`/access-control/roles/${roleId}/permissions/${permissionKey}`),

  resetRole: (roleId: string): Promise<{ role_id: string; reset_count: number }> =>
    apiClient.post(`/access-control/roles/${roleId}/reset`, {}),

  createRole: (input: { name: string; description?: string }): Promise<RoleSummary> =>
    apiClient.post('/access-control/roles', input),

  deleteRole: (roleId: string): Promise<{ role_id: string; deleted: boolean }> =>
    apiClient.delete(`/access-control/roles/${roleId}`),
}
