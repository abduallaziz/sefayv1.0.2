import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hrApi, CreateScheduleDto, BulkCreateScheduleDto, CreateEmployeeGeofenceDto, CreateShiftPatternDto, UpdateShiftPatternDto, AssignScheduleDto } from '../api/hr.api'

export function useMyAttendance(from?: string, to?: string) {
  return useQuery({
    queryKey: ['attendance', 'me', from, to],
    queryFn: () => hrApi.getMyAttendance(from, to),
  })
}

export function useAllAttendance(filters?: { userId?: string; branchId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['attendance', 'all', filters],
    queryFn: () => hrApi.getAllAttendance(filters),
  })
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (branchId?: string) => hrApi.checkIn(branchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export function useCheckOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => hrApi.checkOut(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export function useSchedules(filters?: { userId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['schedules', filters],
    queryFn: () => hrApi.getSchedules(filters),
  })
}

export function useCreateSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateScheduleDto) => hrApi.createSchedule(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })
}

export function useDeleteSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hrApi.deleteSchedule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })
}

export function useBulkCreateSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: BulkCreateScheduleDto) => hrApi.bulkCreateSchedule(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })
}

export function useShiftPatterns() {
  return useQuery({
    queryKey: ['shift-patterns'],
    queryFn: () => hrApi.getShiftPatterns(),
  })
}

export function useCreateShiftPattern() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateShiftPatternDto) => hrApi.createShiftPattern(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-patterns'] }),
  })
}

export function useUpdateShiftPattern() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateShiftPatternDto }) => hrApi.updateShiftPattern(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-patterns'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteShiftPattern() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hrApi.deleteShiftPattern(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-patterns'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useAssignSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: AssignScheduleDto) => hrApi.assignSchedule(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useExceptions(filters?: { userId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['attendance-exceptions', filters],
    queryFn: () => hrApi.getExceptions(filters),
  })
}

export function useCreateException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { user_id: string; date_from: string; date_to: string; reason: string }) => hrApi.createException(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-exceptions'] }),
  })
}

export function useEmployeeGeofences(userId: string) {
  return useQuery({
    queryKey: ['employee-geofences', userId],
    queryFn: () => hrApi.getEmployeeGeofences(userId),
    enabled: !!userId,
  })
}

export function useCreateEmployeeGeofence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateEmployeeGeofenceDto) => hrApi.createEmployeeGeofence(dto),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['employee-geofences', variables.user_id] }),
  })
}

export function useDeleteEmployeeGeofence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hrApi.deleteEmployeeGeofence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-geofences'] }),
  })
}
