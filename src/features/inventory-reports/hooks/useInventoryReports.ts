import { useQuery } from '@tanstack/react-query';
import { inventoryReportsApi } from '../api/inventory-reports.api';

export function useInventoryReports() {
  return useQuery({
    queryKey: ['inventory', 'reports', 'overview'],
    queryFn: () => inventoryReportsApi.getOverview(),
    staleTime: 60 * 1000,
  });
}
