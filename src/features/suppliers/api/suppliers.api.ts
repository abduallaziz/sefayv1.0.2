import { apiClient } from '@/lib/api';
import type { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../types/supplier.types';

export const suppliersApi = {
  getAll: () => apiClient.get<Supplier[]>('/purchasing/suppliers'),
  getById: (id: string) => apiClient.get<Supplier>(`/purchasing/suppliers/${id}`),
  create: (dto: CreateSupplierDTO) => apiClient.post<Supplier>('/purchasing/suppliers', dto),
  update: (id: string, dto: UpdateSupplierDTO) =>
    apiClient.patch<Supplier>(`/purchasing/suppliers/${id}`, dto),
  delete: (id: string) => apiClient.delete<void>(`/purchasing/suppliers/${id}`),
};
