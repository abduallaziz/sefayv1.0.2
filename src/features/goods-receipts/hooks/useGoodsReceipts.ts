import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptsApi } from '../api/goods-receipts.api';
import { GoodsReceiptFilters, CreateGoodsReceiptDTO } from '../types/goods-receipt.types';

export function useGoodsReceipts(filters: GoodsReceiptFilters = {}) {
  return useQuery({
    queryKey: ['goods-receipts', filters],
    queryFn: () => goodsReceiptsApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function useGoodsReceipt(id: string | null) {
  return useQuery({
    queryKey: ['goods-receipts', id],
    queryFn: () => goodsReceiptsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoodsReceiptDTO) => goodsReceiptsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goods-receipts'] }),
  });
}

export function usePostGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goodsReceiptsApi.post(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['goods-receipts'] });
      qc.invalidateQueries({ queryKey: ['goods-receipts', id] });
      qc.invalidateQueries({ queryKey: ['stock-levels'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
}

export function useCancelGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goodsReceiptsApi.cancel(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['goods-receipts'] });
      qc.invalidateQueries({ queryKey: ['goods-receipts', id] });
    },
  });
}
