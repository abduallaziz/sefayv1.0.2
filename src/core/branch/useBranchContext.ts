'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useBranches, useBranchById, type Branch } from '@/shared/hooks/useBranches'
import { useBranchContextStore } from './stores/branch-context.store'

export type BranchFallbackReason =
  | null
  | 'no-selection'
  | 'previous-branch-invalid'
  | 'no-active-branches'

export interface BranchContextValue {
  /** The resolved branch object for `currentBranchId`, if known. May be an
   * inactive branch (restricted users only — see `currentBranchInactive`). */
  currentBranch: Branch | null
  currentBranchId: string | null
  /** Branches the user may switch to. Central: every active tenant branch.
   * Branch-restricted: their own branch if active, otherwise empty — they
   * are never offered a choice, per the approved model. */
  availableBranches: Branch[]
  /** No-op for branch-restricted users — they cannot switch. */
  setCurrentBranch: (branchId: string) => void
  isCentral: boolean
  /** True when `currentBranchId` is set but that branch is not active (or no
   * longer found) — surfaced explicitly rather than silently swapped out. */
  currentBranchInactive: boolean
  /** Set only when a Central user's current branch was NOT their own explicit
   * live choice this session — i.e. the safe fallback rule was applied. */
  fallbackReason: BranchFallbackReason
  isLoading: boolean
}

// The single shared frontend answer to "which branch is the user currently
// viewing/operating in?" — Branch System Step 3. Composes existing pieces
// (auth store for the user's own assignment, useBranches() for the
// tenant-scoped active branch list, a small zustand+persist store for a
// Central user's UI choice) rather than introducing a new state-management
// pattern, mirroring how usePermission()/useCurrencyDisplay() are thin
// derived hooks over existing stores in this codebase.
//
// This is a frontend UX concern only. It does not implement Branch
// Authorization — the backend does not yet enforce per-user branch scope
// (see STATUS.md, "Branch Authorization — Confirmed Platform-Wide Gap").
// A branch-restricted user's `availableBranches` is narrowed here purely so
// the UI never *offers* another branch; nothing here is a security boundary.
export function useBranchContext(): BranchContextValue {
  const user = useAuthStore((s) => s.user)
  const isCentral = user ? user.branchId == null : true

  const { data: activeBranches = [], isLoading: branchesLoading } = useBranches()
  const selectedBranchId = useBranchContextStore((s) => s.selectedBranchId)
  const setSelectedBranchId = useBranchContextStore((s) => s.setSelectedBranchId)

  // Only fetched for a restricted user, and only so their assignment stays
  // readable even if it has since gone inactive (mirrors the same fix
  // applied to EmployeeDetailPage's BranchSection in Step 2's UX fix).
  const restrictedBranchId = !isCentral ? (user?.branchId ?? undefined) : undefined
  const { data: restrictedBranch, isLoading: restrictedLoading } = useBranchById(restrictedBranchId)

  return useMemo(() => {
    if (!isCentral) {
      const assignedId = user?.branchId ?? null
      const isActive = restrictedBranch?.is_active === true
      return {
        currentBranch: restrictedBranch ?? null,
        currentBranchId: assignedId,
        availableBranches: restrictedBranch && isActive ? [restrictedBranch] : [],
        // Branch-restricted users can never switch — enforced here as a
        // guaranteed no-op, not just by omitting UI.
        setCurrentBranch: () => {},
        isCentral: false,
        currentBranchInactive: !!assignedId && !!restrictedBranch && !isActive,
        fallbackReason: null,
        isLoading: restrictedLoading,
      }
    }

    let currentBranchId: string | null
    let fallbackReason: BranchFallbackReason = null

    if (selectedBranchId && activeBranches.some((b) => b.id === selectedBranchId)) {
      currentBranchId = selectedBranchId
    } else if (activeBranches.length > 0) {
      currentBranchId = activeBranches[0].id
      fallbackReason = selectedBranchId ? 'previous-branch-invalid' : 'no-selection'
    } else {
      currentBranchId = null
      fallbackReason = 'no-active-branches'
    }

    return {
      currentBranch: activeBranches.find((b) => b.id === currentBranchId) ?? null,
      currentBranchId,
      availableBranches: activeBranches,
      setCurrentBranch: (branchId: string) => setSelectedBranchId(branchId),
      isCentral: true,
      currentBranchInactive: false,
      fallbackReason,
      isLoading: branchesLoading,
    }
  }, [
    isCentral,
    user?.branchId,
    restrictedBranch,
    restrictedLoading,
    activeBranches,
    branchesLoading,
    selectedBranchId,
    setSelectedBranchId,
  ])
}
