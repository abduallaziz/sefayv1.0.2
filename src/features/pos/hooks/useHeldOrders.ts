import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  holdOrder,
  fetchHeldOrders,
  fetchHeldOrder,
  updateHeldOrderVisibility,
  cancelHeldOrder,
  type HoldOrderPayload,
  type HeldOrderVisibility,
} from '@/features/orders/api/orders.api';

const KEYS = {
  list: (branchId: string) => ['held-orders', branchId] as const,
  detail: (id: string) => ['held-orders', 'detail', id] as const,
};

export function useHeldOrders(branchId: string) {
  return useQuery({
    queryKey: KEYS.list(branchId),
    queryFn: () => fetchHeldOrders(branchId),
    enabled: !!branchId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useHeldOrder(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => fetchHeldOrder(id as string),
    enabled: !!id,
  });
}

export function useHoldOrder(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: HoldOrderPayload) => holdOrder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list(branchId) });
    },
  });
}

export function useUpdateHeldOrderVisibility(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: HeldOrderVisibility }) =>
      updateHeldOrderVisibility(id, visibility),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list(branchId) });
    },
  });
}

export function useCancelHeldOrder(branchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelHeldOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list(branchId) });
    },
  });
}
