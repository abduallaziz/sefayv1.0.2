import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountingApi, AssignBranchAccountingOwnerPayload } from '../api/accounting.api'

export function useAccountingOwners(enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'owners'],
    queryFn: () => accountingApi.getAccountingOwners(),
    enabled,
  })
}

export function useBranchAssignments(enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'branch-assignments'],
    queryFn: () => accountingApi.getBranchAssignments(),
    enabled,
  })
}

export function useAssignBranchAccountingOwner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssignBranchAccountingOwnerPayload) =>
      accountingApi.assignBranchAccountingOwner(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'branch-assignments'] })
      // Command Center's readiness card reads branchesAssigned — keep it
      // in sync with a new assignment without a manual refresh.
      qc.invalidateQueries({ queryKey: ['accounting', 'command-center'] })
    },
  })
}
