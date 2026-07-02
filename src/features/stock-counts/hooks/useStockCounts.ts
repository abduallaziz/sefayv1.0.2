import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockCountsApi } from '../api/stock-counts.api';
import { StockCountFilters, CreateStockCountDTO, SubmitCountItemDTO } from '../types/stock-count.types';

export function useStockCounts(filters: StockCountFilters = {}) {
  return useQuery({
    queryKey: ['stock-counts', filters],
    queryFn: () => stockCountsApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function useStockCount(id: string | null) {
  return useQuery({
    queryKey: ['stock-counts', id],
    queryFn: () => stockCountsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStockCountDTO) => stockCountsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-counts'] }),
  });
}

export function useSubmitCountItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ countId, itemId, data }: { countId: string; itemId: string; data: SubmitCountItemDTO }) =>
      stockCountsApi.submitCount(countId, itemId, data),
    onSuccess: (_res, { countId }) => {
      qc.invalidateQueries({ queryKey: ['stock-counts', countId] });
    },
  });
}

export function useFinalizeStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stockCountsApi.finalize(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-counts', id] });
    },
  });
}
