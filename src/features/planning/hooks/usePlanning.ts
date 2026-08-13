import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningApi } from '../api/planning.api';
import {
  CreateReorderPointDTO,
  UpdateReorderPointDTO,
  ConvertSuggestionsPayload,
} from '../types/planning.types';

export function useReorderPoints(warehouseId?: string) {
  return useQuery({
    queryKey: ['reorder-points', warehouseId ?? 'all'],
    queryFn: () => planningApi.getReorderPoints(warehouseId),
    staleTime: 60 * 1000,
  });
}

export function useBelowMinimum() {
  return useQuery({
    queryKey: ['reorder-points', 'below-minimum'],
    queryFn: () => planningApi.getBelowMinimum(),
    staleTime: 60 * 1000,
  });
}

export function usePurchaseSuggestions() {
  return useQuery({
    queryKey: ['planning', 'purchase-suggestions'],
    queryFn: () => planningApi.getPurchaseSuggestions(),
    staleTime: 60 * 1000,
  });
}

export function useSafetyStockRecommendation(
  params: { warehouse_id: string; item_id: string; variant_id?: string } | null,
) {
  return useQuery({
    queryKey: ['planning', 'safety-stock', params],
    queryFn: () => planningApi.getSafetyStockRecommendation(params!),
    enabled: !!params?.warehouse_id && !!params?.item_id,
  });
}

function invalidateReorderQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['reorder-points'] });
  qc.invalidateQueries({ queryKey: ['planning', 'purchase-suggestions'] });
}

export function useCreateReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReorderPointDTO) => planningApi.createReorderPoint(dto),
    onSuccess: () => invalidateReorderQueries(qc),
  });
}

export function useUpdateReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateReorderPointDTO }) =>
      planningApi.updateReorderPoint(id, dto),
    onSuccess: () => invalidateReorderQueries(qc),
  });
}

export function useDeleteReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.deleteReorderPoint(id),
    onSuccess: () => invalidateReorderQueries(qc),
  });
}

export function useConvertSuggestionsToRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConvertSuggestionsPayload) =>
      planningApi.convertSuggestionsToRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planning', 'purchase-suggestions'] });
      qc.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
  });
}
