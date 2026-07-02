import { apiClient } from '@/lib/api';
import type { MovementsLedgerFilters, MovementsLedgerResponse } from '../types/movements.types';

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const movementsApi = {
  getLedger: (filters: MovementsLedgerFilters = {}) =>
    apiClient.get<MovementsLedgerResponse>(
      `/inventory/stock/movements/ledger${buildQuery({
        warehouse_id: filters.warehouse_id,
        item_id: filters.item_id,
        movement_type: filters.movement_type,
        reference_type: filters.reference_type,
        reference_id: filters.reference_id,
        created_by: filters.created_by,
        date_from: filters.date_from,
        date_to: filters.date_to,
        page: filters.page,
        per_page: filters.per_page,
      })}`
    ),
};
