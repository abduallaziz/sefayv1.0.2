import { apiClient } from '@/lib/api';
import type {
  Location,
  LocationsResponse,
  CreateLocationDTO,
  UpdateLocationDTO,
} from '../types/location.types';

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const locationsApi = {
  getAll: (
    warehouseId: string,
    params: { search?: string; page?: number; limit?: number; isActive?: boolean } = {},
  ) =>
    apiClient.get<LocationsResponse>(
      `/inventory/warehouses/${warehouseId}/locations${buildQuery({
        search: params.search,
        page: params.page,
        limit: params.limit,
        isActive: params.isActive === undefined ? undefined : String(params.isActive),
      })}`
    ),
  getById: (warehouseId: string, id: string) =>
    apiClient.get<Location>(`/inventory/warehouses/${warehouseId}/locations/${id}`),
  create: (warehouseId: string, dto: CreateLocationDTO) =>
    apiClient.post<Location>(`/inventory/warehouses/${warehouseId}/locations`, dto),
  update: (warehouseId: string, id: string, dto: UpdateLocationDTO) =>
    apiClient.patch<Location>(`/inventory/warehouses/${warehouseId}/locations/${id}`, dto),
  delete: (warehouseId: string, id: string) =>
    apiClient.delete<void>(`/inventory/warehouses/${warehouseId}/locations/${id}`),
};
