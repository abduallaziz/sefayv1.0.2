import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliers.api';
import type { CreateSupplierDTO, UpdateSupplierDTO } from '../types/supplier.types';

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => suppliersApi.getById(id!),
    enabled: !!id,
  });
}

export function useSupplierProfileStats(id: string | null) {
  return useQuery({
    queryKey: ['suppliers', id, 'profile-stats'],
    queryFn: () => suppliersApi.getProfileStats(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierDTO) => suppliersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDTO }) =>
      suppliersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
