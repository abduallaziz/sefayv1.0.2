import { apiClient } from '@/lib/api';
import { Order, OrderFilters, CancelOrderPayload } from '../types/order.types';

export async function fetchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.payment_method) params.payment_method = filters.payment_method;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.branch_id) params.branch_id = filters.branch_id;

  const qs = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';

  return apiClient.get<Order[]>(`/invoices${qs}`);
}

export async function fetchOrderById(id: string): Promise<Order> {
  return apiClient.get<Order>(`/invoices/${id}`);
}

export async function cancelOrder(id: string, payload: CancelOrderPayload): Promise<void> {
  return apiClient.patch<void>(`/invoices/${id}/cancel`, payload);
}