import { apiClient } from '@/lib/api';
import type { Tenant } from './types';

export interface TenantsFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface TenantsResponse {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
}

export const tenantsApi = {
  getAll: async (filters: TenantsFilters = {}): Promise<TenantsResponse> => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit ?? 20));
    return apiClient.get(`/superadmin/tenants?${params.toString()}`);
  },

  getById: async (id: string): Promise<Tenant> => {
    return apiClient.get(`/superadmin/tenants/${id}`);
  },

  activate: async (id: string): Promise<void> => {
    return apiClient.patch(`/superadmin/tenants/${id}/activate`);
  },

  deactivate: async (id: string): Promise<void> => {
    return apiClient.patch(`/superadmin/tenants/${id}/deactivate`);
  },

  softDelete: async (id: string): Promise<void> => {
    return apiClient.delete(`/superadmin/tenants/${id}`);
  },

  extendTrial: async (id: string, days: number): Promise<void> => {
    return apiClient.patch(`/superadmin/tenants/${id}/extend-trial`, { days });
  },
};