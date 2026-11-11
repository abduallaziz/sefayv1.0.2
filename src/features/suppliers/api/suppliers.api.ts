import { apiClient } from '@/lib/api';
import type { Supplier, SupplierProfileStats, CreateSupplierDTO, UpdateSupplierDTO, PagedSupplierPriceTimeline } from '../types/supplier.types';

export const suppliersApi = {
  getAll: () => apiClient.get<Supplier[]>('/purchasing/suppliers'),
  getById: (id: string) => apiClient.get<Supplier>(`/purchasing/suppliers/${id}`),
  getProfileStats: (id: string) =>
    apiClient.get<SupplierProfileStats>(`/purchasing/suppliers/${id}/profile-stats`),
  create: (dto: CreateSupplierDTO) => apiClient.post<Supplier>('/purchasing/suppliers', dto),
  update: (id: string, dto: UpdateSupplierDTO) =>
    apiClient.patch<Supplier>(`/purchasing/suppliers/${id}`, dto),
  delete: (id: string) => apiClient.delete<void>(`/purchasing/suppliers/${id}`),
  // #9.6 Supplier Price History & Procurement Price Timeline (Owner-approved).
  getPriceTimeline: (
    supplierId: string,
    itemId: string,
    params: { variant_id?: string; page?: number; limit?: number } = {},
  ) => {
    const search = new URLSearchParams();
    if (params.variant_id) search.set('variant_id', params.variant_id);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return apiClient.get<PagedSupplierPriceTimeline>(
      `/purchasing/suppliers/${supplierId}/items/${itemId}/price-timeline${qs ? `?${qs}` : ''}`,
    );
  },
};
