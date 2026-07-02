import { apiClient } from '@/lib/api';
import {
  StockCount,
  StockCountFilters,
  CreateStockCountDTO,
  SubmitCountItemDTO,
} from '../types/stock-count.types';

export const stockCountsApi = {
  getAll: (filters: StockCountFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<StockCount[]>(`/inventory/counts${qs}`);
  },
  getById: (id: string) => apiClient.get<StockCount>(`/inventory/counts/${id}`),
  create: (dto: CreateStockCountDTO) => apiClient.post<StockCount>('/inventory/counts', dto),
  submitCount: (countId: string, itemId: string, dto: SubmitCountItemDTO) =>
    apiClient.patch<StockCount>(`/inventory/counts/${countId}/items/${itemId}`, dto),
  finalize: (id: string) => apiClient.post<StockCount>(`/inventory/counts/${id}/finalize`, undefined),
};
