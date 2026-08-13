import { apiClient } from '@/lib/api';
import {
  ReorderPoint,
  CreateReorderPointDTO,
  UpdateReorderPointDTO,
  PurchaseSuggestion,
  ConvertSuggestionsPayload,
} from '../types/planning.types';

export const planningApi = {
  getReorderPoints: (warehouseId?: string) =>
    apiClient.get<ReorderPoint[]>(
      `/inventory/reorder-points${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`,
    ),
  getBelowMinimum: () => apiClient.get<ReorderPoint[]>('/inventory/reorder-points/below-minimum'),
  createReorderPoint: (dto: CreateReorderPointDTO) =>
    apiClient.post<ReorderPoint>('/inventory/reorder-points', dto),
  updateReorderPoint: (id: string, dto: UpdateReorderPointDTO) =>
    apiClient.patch<ReorderPoint>(`/inventory/reorder-points/${id}`, dto),
  deleteReorderPoint: (id: string) => apiClient.delete<void>(`/inventory/reorder-points/${id}`),

  getPurchaseSuggestions: () =>
    apiClient.get<PurchaseSuggestion[]>('/inventory/planning/purchase-suggestions'),

  getSafetyStockRecommendation: (params: {
    warehouse_id: string;
    item_id: string;
    variant_id?: string;
    lookback_days?: number;
  }) => {
    const query = new URLSearchParams({
      warehouse_id: params.warehouse_id,
      item_id: params.item_id,
      ...(params.variant_id ? { variant_id: params.variant_id } : {}),
      ...(params.lookback_days ? { lookback_days: String(params.lookback_days) } : {}),
    });
    return apiClient.get<number>(`/inventory/planning/safety-stock?${query.toString()}`);
  },

  convertSuggestionsToRequest: (payload: ConvertSuggestionsPayload) =>
    apiClient.post('/purchasing/purchase-requests/from-suggestions', payload),
};
