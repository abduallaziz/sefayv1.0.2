import { apiClient } from '@/lib/api'

export interface AttendanceRecord {
  id: string
  user_id: string
  user_name: string | null
  branch_id: string | null
  check_in_at: string
  check_out_at: string | null
  hours_worked: number | null
}

export interface WorkSchedule {
  id: string
  user_id: string
  user_name: string | null
  branch_id: string | null
  scheduled_date: string
  start_time: string
  end_time: string
  notes: string | null
  created_at: string
}

export interface CreateScheduleDto {
  user_id: string
  branch_id?: string
  scheduled_date: string
  start_time: string
  end_time: string
  notes?: string
}

export const hrApi = {
  checkIn: (branchId?: string): Promise<AttendanceRecord> =>
    apiClient.post('/attendance/check-in', branchId ? { branch_id: branchId } : {}),

  checkOut: (): Promise<AttendanceRecord> =>
    apiClient.post('/attendance/check-out', {}),

  getMyAttendance: (from?: string, to?: string): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    return apiClient.get(`/attendance/me${qs ? `?${qs}` : ''}`)
  },

  getAllAttendance: (filters?: { userId?: string; branchId?: string; from?: string; to?: string }): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams()
    if (filters?.userId) params.set('user_id', filters.userId)
    if (filters?.branchId) params.set('branch_id', filters.branchId)
    if (filters?.from) params.set('from', filters.from)
    if (filters?.to) params.set('to', filters.to)
    const qs = params.toString()
    return apiClient.get(`/attendance${qs ? `?${qs}` : ''}`)
  },

  getSchedules: (filters?: { userId?: string; from?: string; to?: string }): Promise<WorkSchedule[]> => {
    const params = new URLSearchParams()
    if (filters?.userId) params.set('user_id', filters.userId)
    if (filters?.from) params.set('from', filters.from)
    if (filters?.to) params.set('to', filters.to)
    const qs = params.toString()
    return apiClient.get(`/schedules${qs ? `?${qs}` : ''}`)
  },

  createSchedule: (dto: CreateScheduleDto): Promise<WorkSchedule> =>
    apiClient.post('/schedules', dto),

  deleteSchedule: (id: string): Promise<void> =>
    apiClient.delete(`/schedules/${id}`),
}
