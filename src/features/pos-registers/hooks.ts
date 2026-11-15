'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { posRegistersApi } from './api'

const key = (branchId: string) => ['pos-registers', branchId] as const

export function useRegisters(branchId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: key(branchId ?? ''),
    queryFn: () => posRegistersApi.listByBranch(branchId as string),
    enabled: enabled && !!branchId,
    staleTime: 30_000,
  })
}

export function useRegisterMutations(branchId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: key(branchId) })
  return {
    create: useMutation({ mutationFn: posRegistersApi.create, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, ...data }: { id: string; name?: string; is_active?: boolean }) =>
        posRegistersApi.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: posRegistersApi.remove, onSuccess: invalidate }),
  }
}
