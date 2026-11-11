import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queueApi, type CreateWashJobDto, type WashStatus } from '../api/queue.api'
import { useRealtimeStatusStore } from '@/core/realtime/realtime-status.store'

export function useWashBoard(branchId: string, date?: string) {
  const realtimeConnected = useRealtimeStatusStore((s) => s.connected)
  return useQuery({
    queryKey: ['queue', 'board', branchId, date ?? 'today'],
    queryFn: () => queueApi.getBoard(branchId, date),
    enabled: !!branchId,
    // Fallback polling only - changes push through RealtimeProvider's
    // wash_jobs subscription, which invalidates the ['queue'] keys.
    refetchInterval: realtimeConnected ? false : 10000,
  })
}

export function useCreateWashJob(onError: (e: unknown) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWashJobDto) => queueApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
    onError,
  })
}

export function useChangeWashStatus(onError: (e: unknown) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<WashStatus, 'waiting'> }) =>
      queueApi.changeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
    onError,
  })
}

export function useAssignWashWorker(onError: (e: unknown) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, workerId }: { id: string; workerId: string | null }) =>
      queueApi.assign(id, workerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
    onError,
  })
}
