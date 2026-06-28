import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '../api/warehouses.api';
import { CreateWarehouseDTO, UpdateWarehouseDTO } from '../types/warehouse.types';

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useWarehouse(id: string | null) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => warehousesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWarehouseDTO) => warehousesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseDTO }) =>
      warehousesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehousesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}
