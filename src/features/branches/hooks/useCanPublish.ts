'use client'

import { useBranchContext } from '@/core/branch/useBranchContext'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { useBranchIsolation } from './useBranchesAdmin'

/** "Publish to branches" is offered only to central users, with isolation ON and more than one branch. */
export function useCanPublishToBranches(): boolean {
  const { isCentral, availableBranches } = useBranchContext()
  const allowed = usePermission('branches.publish')
  const { data: isolation } = useBranchIsolation()
  return Boolean(allowed && isCentral && isolation?.enabled && availableBranches.length > 1)
}
