import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Persists only a Central user's UI choice of "current working branch" —
// mirrors the existing zustand+persist(localStorage) convention already used
// by core/tenant/stores/tenant.store.ts for this kind of session preference.
// Branch-restricted users never read or write this: their current branch is
// always their fixed assignment (see useBranchContext.ts), never a stored
// choice.
interface BranchContextState {
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void
}

export const useBranchContextStore = create<BranchContextState>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
    }),
    { name: 'sefay-branch-context' },
  ),
)
