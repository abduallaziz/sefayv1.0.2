import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hrApi, CreateScheduleDto } from '../api/hr.api'

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
