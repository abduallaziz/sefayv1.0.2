
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderFilters, CancelOrderPayload } from '../types/order.types';
import { fetchOrders, fetchOrderById, cancelOrder } from '../api/orders.api';
import { MOCK_ORDERS } from '../mock/orders.mock';

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => MOCK_ORDERS, // استبدل بـ fetchOrders(filters) عند ربط API
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => MOCK_ORDERS.find(o => o.id === id) ?? null,
    enabled: !!id,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelOrderPayload }) =>
      cancelOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}