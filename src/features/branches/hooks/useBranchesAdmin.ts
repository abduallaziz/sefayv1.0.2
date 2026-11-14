import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { branchesApi, CreateBranchDto, UpdateBranchDto } from '../api/branches.api'

const KEY = ['branches', 'admin'] as const

export const useBranchesAdmin = () =>
  useQuery({
    queryKey: KEY,
    queryFn: branchesApi.getAll,
  })

export const useCreateBranch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBranchDto) => branchesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      // The shared app-wide branch list (src/shared/hooks/useBranches.ts,
      // consumed by many unrelated features) reads from the same backend
      // list — keep it in sync too so a newly created branch shows up
      // everywhere immediately, without touching that hook's own contract.
      qc.invalidateQueries({ queryKey: ['branches'] })
      // A new branch is created together with its default warehouse (API),
      // so refresh the warehouses list or the card shows "not set" until reload.
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      qc.invalidateQueries({ queryKey: ['tenant', 'usage'] })
    },
  })
}

export const useUpdateBranch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBranchDto }) => branchesApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['branches'] })
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      qc.invalidateQueries({ queryKey: ['tenant', 'usage'] })
    },
  })
}

export const useDeleteBranch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['branches'] })
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      qc.invalidateQueries({ queryKey: ['tenant', 'usage'] })
    },
  })
}
