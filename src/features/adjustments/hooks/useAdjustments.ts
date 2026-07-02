import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustmentsApi } from '../api/adjustments.api';
import { AdjustmentFilters, CreateAdjustmentDTO } from '../types/adjustment.types';

export function useAdjustments(filters: AdjustmentFilters = {}) {
  return useQuery({
    queryKey: ['adjustments', filters],
    queryFn: () => adjustmentsApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function useAdjustment(id: string | null) {
  return useQuery({
    queryKey: ['adjustments', id],
    queryFn: () => adjustmentsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdjustmentDTO) => adjustmentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adjustments'] }),
  });
}

export function useApproveAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adjustmentsApi.approve(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['adjustments'] });
      qc.invalidateQueries({ queryKey: ['adjustments', id] });
    },
  });
}

export function useRejectAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adjustmentsApi.reject(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['adjustments'] });
      qc.invalidateQueries({ queryKey: ['adjustments', id] });
    },
  });
}

export function usePostAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adjustmentsApi.post(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['adjustments'] });
      qc.invalidateQueries({ queryKey: ['adjustments', id] });
      qc.invalidateQueries({ queryKey: ['stock-levels'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
}
