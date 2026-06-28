import { apiClient } from '@/lib/api';
import { InventoryReportsOverview } from '../types/inventory-reports.types';

export const inventoryReportsApi = {
  getOverview: () => apiClient.get<InventoryReportsOverview>('/inventory/reports/overview'),
};
