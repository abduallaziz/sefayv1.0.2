import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queueApi, type CreateWashJobDto, type WashStatus } from '../api/queue.api'

export function useWashBoard(branchId: string, date?: string) {
  return useQuery({
    queryKey: ['queue', 'board', branchId, date ?? 'today'],
    queryFn: () => queueApi.getBoard(branchId, date),
    enabled: !!branchId,
    // Always poll: the board must not go stale even when realtime is connected
    // (realtime pushes through RealtimeProvider only make it faster).
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
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

export function useLinkWashOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, orderId }: { id: string; orderId: string }) => queueApi.linkOrder(id, orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
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
