import { apiClient } from '@/lib/api'

export type LateDeductionMode = 'fixed' | 'per_minute' | 'percentage_of_daily_rate'

export interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  branch_id?: string
  base_salary?: number | null
  grace_period_minutes?: number
  late_deduction_mode?: LateDeductionMode | null
  late_deduction_value?: number | null
  attendance_token?: string | null
  shift_pattern_id?: string | null
  custom_days_of_week?: number[] | null
  custom_shifts?: { start_time: string; end_time: string }[] | null
  custom_day_overrides?: { day: number; shifts: { start_time: string; end_time: string }[] }[] | null
  schedule_start_date?: string | null
  department?: string | null
  job_title?: string | null
  avatar_url?: string | null
  attendance_device_fingerprint?: string | null
  attendance_enabled?: boolean
  employee_number?: string | null
  phone?: string | null
  identity_number?: string | null
  manager_name?: string | null
  employment_type?: 'full_time' | 'part_time' | null
  join_date?: string | null
  city?: string | null
  address?: string | null
  gps_radius_meters?: number | null
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: string
  branch_id?: string
}

export interface CreateEmployeeDto {
  name: string
  employee_number?: string
  phone?: string
  email?: string
  identity_number?: string
  department?: string
  job_title?: string
  manager_name?: string
  employment_type?: 'full_time' | 'part_time'
  join_date?: string
  city?: string
  address?: string
  gps_radius_meters?: number
  enable_attendance?: boolean
}

export interface UpdateUserDto {
  name?: string
  is_active?: boolean
  branch_id?: string
  base_salary?: number | null
  grace_period_minutes?: number
  late_deduction_mode?: LateDeductionMode | null
  late_deduction_value?: number | null
  department?: string | null
  job_title?: string | null
  avatar_url?: string | null
  attendance_enabled?: boolean
  employee_number?: string | null
  phone?: string | null
  identity_number?: string | null
  manager_name?: string | null
  employment_type?: 'full_time' | 'part_time' | null
  join_date?: string | null
  city?: string | null
  address?: string | null
  gps_radius_meters?: number | null
  is_employee_profile?: boolean
}

export interface UpdateEmployeeDto {
  name?: string
  avatar_url?: string | null
  employee_number?: string | null
  phone?: string | null
  email?: string | null
  identity_number?: string | null
  department?: string | null
  job_title?: string | null
  manager_name?: string | null
  employment_type?: 'full_time' | 'part_time' | null
  join_date?: string | null
  city?: string | null
  address?: string | null
  gps_radius_meters?: number | null
  is_active?: boolean
  attendance_enabled?: boolean
  base_salary?: number | null
  grace_period_minutes?: number
  late_deduction_mode?: LateDeductionMode | null
  late_deduction_value?: number | null
}

export interface UserRoleAssignment {
  id: string
  role_id: string
  is_primary: boolean
  role: { id: string; name: string; description: string | null; is_system: boolean }
}

export interface PermissionOverride {
  permission_key: string
  action: 'GRANT' | 'DENY'
}

export interface LinkableUser {
  id: string
  name: string
  email: string
  role: string
}

export interface DuplicateCheckResult {
  email?: boolean
  phone?: boolean
  employee_number?: boolean
}

export interface HistoryEntry {
  id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  resource_type: string
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  created_at: string
}

export const usersApi = {
  getAll: (): Promise<User[]> =>
    apiClient.get('/users'),

  getOne: (id: string): Promise<User> =>
    apiClient.get(`/users/${id}`),

  create: (data: CreateUserDto): Promise<User> =>
    apiClient.post('/users', data),

  createEmployee: (data: CreateEmployeeDto): Promise<User & { attendance_token: string | null }> =>
    apiClient.post('/employees', data),

  update: (id: string, data: UpdateUserDto): Promise<User> =>
    apiClient.patch(`/users/${id}`, data),

  changeRole: (id: string, role: string): Promise<User> =>
    apiClient.patch(`/users/${id}/role`, { role }),

  getUserRoles: (id: string): Promise<UserRoleAssignment[]> =>
    apiClient.get(`/users/${id}/roles`),

  addUserRole: (id: string, roleId: string): Promise<{ user_id: string; role_id: string; role_name: string }> =>
    apiClient.post(`/users/${id}/roles`, { role_id: roleId }),

  removeUserRole: (id: string, roleId: string): Promise<{ user_id: string; role_id: string; removed: boolean }> =>
    apiClient.delete(`/users/${id}/roles/${roleId}`),

  getPermissionOverrides: (id: string): Promise<PermissionOverride[]> =>
    apiClient.get(`/users/${id}/permissions/overrides`),

  setPermissionOverride: (id: string, permissionKey: string, action: 'GRANT' | 'DENY'): Promise<{ user_id: string; permission_key: string; action: string }> =>
    apiClient.post(`/users/${id}/permissions/overrides`, { permission_key: permissionKey, action }),

  removePermissionOverride: (id: string, permissionKey: string): Promise<{ user_id: string; permission_key: string; removed: boolean }> =>
    apiClient.delete(`/users/${id}/permissions/overrides`, { data: { permission_key: permissionKey } }),

  resetPermissionOverrides: (id: string): Promise<{ user_id: string; reset: boolean }> =>
    apiClient.delete(`/users/${id}/permissions/overrides/reset-all`),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/users/${id}`),

  generateAttendanceLink: (id: string): Promise<{ id: string; attendance_token: string }> =>
    apiClient.post(`/users/${id}/attendance-link`, {}),

  unbindAttendanceDevice: (id: string): Promise<{ message: string }> =>
    apiClient.post(`/users/${id}/attendance-link/unbind-device`, {}),

  getEmployees: (): Promise<User[]> =>
    apiClient.get('/employees'),

  getLinkableUsers: (): Promise<LinkableUser[]> =>
    apiClient.get('/employees/linkable-users'),

  linkAsEmployee: (id: string): Promise<User> =>
    apiClient.post(`/employees/${id}/link`, {}),

  updateEmployee: (id: string, data: UpdateEmployeeDto): Promise<User> =>
    apiClient.patch(`/employees/${id}`, data),

  checkDuplicate: (fields: { email?: string; phone?: string; employee_number?: string; exclude_id?: string }): Promise<DuplicateCheckResult> => {
    const params = new URLSearchParams()
    if (fields.email) params.set('email', fields.email)
    if (fields.phone) params.set('phone', fields.phone)
    if (fields.employee_number) params.set('employee_number', fields.employee_number)
    if (fields.exclude_id) params.set('exclude_id', fields.exclude_id)
    return apiClient.get(`/employees/check-duplicate?${params.toString()}`)
  },

  getEmployeeHistory: (id: string): Promise<HistoryEntry[]> =>
    apiClient.get(`/employees/${id}/history`),
}