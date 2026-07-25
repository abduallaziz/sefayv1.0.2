import { apiClient } from '@/lib/api';
import { Transfer, TransferFilters, CreateTransferDTO } from '../types/transfer.types';

export const transfersApi = {
  getAll: (filters: TransferFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<Transfer[]>(`/inventory/transfers${qs}`);
  },
  getById: (id: string) => apiClient.get<Transfer>(`/inventory/transfers/${id}`),
  create: (dto: CreateTransferDTO) => apiClient.post<Transfer>('/inventory/transfers', dto),
  approve: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/approve`, undefined),
  dispatch: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/dispatch`, undefined),
  receive: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/receive`, undefined),
  complete: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/complete`, undefined),
  cancel: (id: string) => apiClient.post<Transfer>(`/inventory/transfers/${id}/cancel`, undefined),
};
