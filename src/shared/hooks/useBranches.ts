import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Branch {
  id: string;
  name: string;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get<Branch[]>('/branches'),
    staleTime: 5 * 60_000,
  });
}
