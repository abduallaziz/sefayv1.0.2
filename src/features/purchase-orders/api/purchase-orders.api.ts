import { apiClient } from '@/lib/api';
import {
  PurchaseOrder,
  PurchaseOrderFilters,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
} from '../types/purchase-order.types';

export const purchaseOrdersApi = {
  getAll: (filters: PurchaseOrderFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<PurchaseOrder[]>(`/purchasing/purchase-orders${qs}`);
  },
  getById: (id: string) => apiClient.get<PurchaseOrder>(`/purchasing/purchase-orders/${id}`),
  create: (dto: CreatePurchaseOrderDTO) =>
    apiClient.post<PurchaseOrder>('/purchasing/purchase-orders', dto),
  update: (id: string, dto: UpdatePurchaseOrderDTO) =>
    apiClient.patch<PurchaseOrder>(`/purchasing/purchase-orders/${id}`, dto),
  submit: (id: string) => apiClient.post<PurchaseOrder>(`/purchasing/purchase-orders/${id}/submit`, undefined),
  approve: (id: string) => apiClient.post<PurchaseOrder>(`/purchasing/purchase-orders/${id}/approve`, undefined),
  cancel: (id: string) => apiClient.post<PurchaseOrder>(`/purchasing/purchase-orders/${id}/cancel`, undefined),
  delete: (id: string) => apiClient.delete<void>(`/purchasing/purchase-orders/${id}`),
};
