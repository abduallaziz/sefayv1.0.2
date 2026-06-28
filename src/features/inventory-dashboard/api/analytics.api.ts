import { apiClient } from '@/lib/api';
import { InventoryDashboardData } from '../types/dashboard.types';

export const inventoryAnalyticsApi = {
  getDashboard: () => apiClient.get<InventoryDashboardData>('/inventory/analytics/dashboard'),
};
