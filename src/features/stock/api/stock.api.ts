import { apiClient } from '@/lib/api';
import type {
  StockLevel,
  StockLevelFilters,
  StockMovementFilters,
  StockMovementsResponse,
} from '../types/stock.types';

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const stockApi = {
  getLevels: (filters: StockLevelFilters = {}) =>
    apiClient.get<StockLevel[]>(
      `/inventory/stock/levels${buildQuery({
        warehouse_id: filters.warehouse_id,
        item_id: filters.item_id,
        variant_id: filters.variant_id,
      })}`
    ),

  getMovements: (filters: StockMovementFilters = {}) =>
    apiClient.get<StockMovementsResponse>(
      `/inventory/stock/movements${buildQuery({
        warehouse_id: filters.warehouse_id,
        item_id: filters.item_id,
        variant_id: filters.variant_id,
        reference_type: filters.reference_type,
        reference_id: filters.reference_id,
        page: filters.page,
        per_page: filters.per_page,
      })}`
    ),
};
