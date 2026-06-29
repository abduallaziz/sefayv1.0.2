import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../api/locations.api';
import { CreateLocationDTO, UpdateLocationDTO } from '../types/location.types';

export function useLocations(
  warehouseId: string | null,
  params: { search?: string; page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: ['locations', warehouseId, params],
    queryFn: () => locationsApi.getAll(warehouseId!, params),
    enabled: !!warehouseId,
    staleTime: 60 * 1000,
  });
}

export function useCreateLocation(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLocationDTO) => locationsApi.create(warehouseId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations', warehouseId] }),
  });
}

export function useUpdateLocation(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationDTO }) =>
      locationsApi.update(warehouseId!, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations', warehouseId] }),
  });
}

export function useDeleteLocation(warehouseId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationsApi.delete(warehouseId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations', warehouseId] }),
  });
}
