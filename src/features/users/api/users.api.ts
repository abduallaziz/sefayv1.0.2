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
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: string
  branch_id?: string
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
}

export const usersApi = {
  getAll: (): Promise<User[]> =>
    apiClient.get('/users'),

  getOne: (id: string): Promise<User> =>
    apiClient.get(`/users/${id}`),

  create: (data: CreateUserDto): Promise<User> =>
    apiClient.post('/users', data),

  update: (id: string, data: UpdateUserDto): Promise<User> =>
    apiClient.patch(`/users/${id}`, data),

  changeRole: (id: string, role: string): Promise<User> =>
    apiClient.patch(`/users/${id}/role`, { role }),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/users/${id}`),

  generateAttendanceLink: (id: string): Promise<{ id: string; attendance_token: string }> =>
    apiClient.post(`/users/${id}/attendance-link`, {}),

  unbindAttendanceDevice: (id: string): Promise<{ message: string }> =>
    apiClient.post(`/users/${id}/attendance-link/unbind-device`, {}),
}