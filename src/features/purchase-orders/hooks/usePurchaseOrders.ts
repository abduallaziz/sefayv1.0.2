import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '../api/purchase-orders.api';
import {
  PurchaseOrderFilters,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
} from '../types/purchase-order.types';

export function usePurchaseOrders(filters: PurchaseOrderFilters = {}) {
  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: () => purchaseOrdersApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderDTO) => purchaseOrdersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrderDTO }) =>
      purchaseOrdersApi.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
}

export function useSubmitPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.submit(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.approve(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });
}
