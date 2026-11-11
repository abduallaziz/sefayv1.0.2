import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

// Used by branch-assignment selectors (Employee Wizard, Employee Detail,
// Create User) — only active branches can actually be assigned, so only
// active branches are offered. Branch Management's own admin list
// (useBranchesAdmin) intentionally does not use this: administering
// branches requires seeing inactive ones too.
export function useBranches() {
  return useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => apiClient.get<Branch[]>('/branches?active_only=true'),
    staleTime: 5 * 60_000,
  });
}

// For assignment editors that must keep an existing (possibly now-inactive)
// assignment readable without offering it as a new selectable target — see
// useBranches() above for why the main list is active-only.
export function useBranchById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['branches', 'byId', id],
    queryFn: () => apiClient.get<Branch>(`/branches/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
