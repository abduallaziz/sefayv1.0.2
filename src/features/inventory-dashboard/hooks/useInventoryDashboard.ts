import { useQuery } from '@tanstack/react-query';
import { inventoryAnalyticsApi } from '../api/analytics.api';

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ['inventory', 'analytics', 'dashboard'],
    queryFn: () => inventoryAnalyticsApi.getDashboard(),
    staleTime: 60 * 1000,
  });
}
