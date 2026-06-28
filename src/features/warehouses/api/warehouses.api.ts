import { apiClient } from '@/lib/api';
import { Warehouse, CreateWarehouseDTO, UpdateWarehouseDTO } from '../types/warehouse.types';

export const warehousesApi = {
  getAll: () => apiClient.get<Warehouse[]>('/inventory/warehouses'),
  getById: (id: string) => apiClient.get<Warehouse>(`/inventory/warehouses/${id}`),
  create: (dto: CreateWarehouseDTO) => apiClient.post<Warehouse>('/inventory/warehouses', dto),
  update: (id: string, dto: UpdateWarehouseDTO) =>
    apiClient.patch<Warehouse>(`/inventory/warehouses/${id}`, dto),
  delete: (id: string) => apiClient.delete<void>(`/inventory/warehouses/${id}`),
};
