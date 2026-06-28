import { apiClient } from '@/lib/api';
import {
  StockAdjustment,
  AdjustmentFilters,
  CreateAdjustmentDTO,
} from '../types/adjustment.types';

export const adjustmentsApi = {
  getAll: (filters: AdjustmentFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<StockAdjustment[]>(`/inventory/adjustments${qs}`);
  },
  getById: (id: string) => apiClient.get<StockAdjustment>(`/inventory/adjustments/${id}`),
  create: (dto: CreateAdjustmentDTO) =>
    apiClient.post<StockAdjustment>('/inventory/adjustments', dto),
  approve: (id: string) => apiClient.post<StockAdjustment>(`/inventory/adjustments/${id}/approve`, undefined),
  reject: (id: string) => apiClient.post<StockAdjustment>(`/inventory/adjustments/${id}/reject`, undefined),
  post: (id: string) => apiClient.post<StockAdjustment>(`/inventory/adjustments/${id}/post`, undefined),
};
