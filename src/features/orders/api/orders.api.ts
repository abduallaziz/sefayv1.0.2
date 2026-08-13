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

export interface CreateOrderItem {
  item_id: string;
  item_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  max_allowed?: number;
}

export interface CreateOrderPayload {
  branch_id: string;
  shift_id?: string;
  sale_attempt_id: string;
  payment_method: string;
  cash_tendered?: number;
  cash_amount?: number;
  card_amount?: number;
  items: CreateOrderItem[];
  discount?: CreateOrderDiscount;
  customer_id?: string;
  notes?: string;
  tax_rate?: number;
  redeem_points?: number;
  coupon_code?: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return apiClient.post<Order>('/invoices', payload);
}

// Held orders — a held order is inert data on the backend (no payment, no
// stock deduction) until resumed and pushed through the normal
// createOrder() above, which is completely unmodified for this feature.
export type HeldOrderVisibility = 'self' | 'all_cashiers';

export interface HoldOrderPayload {
  branch_id: string;
  shift_id?: string;
  customer_id?: string;
  items: CreateOrderItem[];
  notes?: string;
  held_visibility?: HeldOrderVisibility;
}

export interface HeldOrder {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
  cashier_id: string;
  customer_id: string | null;
  branch_id: string;
  held: boolean;
  held_visibility: HeldOrderVisibility;
  held_by: string;
  held_at: string;
  cashier_name: string | null;
  customer_name: string | null;
  items?: CreateOrderItem[];
}

export async function holdOrder(payload: HoldOrderPayload): Promise<HeldOrder> {
  return apiClient.post<HeldOrder>('/invoices/held', payload);
}

export async function fetchHeldOrders(branchId: string): Promise<HeldOrder[]> {
  return apiClient.get<HeldOrder[]>(`/invoices/held?branch_id=${encodeURIComponent(branchId)}`);
}

export async function fetchHeldOrder(id: string): Promise<HeldOrder> {
  return apiClient.get<HeldOrder>(`/invoices/held/${id}`);
}

export async function updateHeldOrderVisibility(
  id: string,
  visibility: HeldOrderVisibility,
): Promise<{ id: string; held_visibility: HeldOrderVisibility }> {
  return apiClient.patch(`/invoices/held/${id}/visibility`, { held_visibility: visibility });
}

export async function cancelHeldOrder(id: string): Promise<{ id: string; held: boolean }> {
  return apiClient.delete(`/invoices/held/${id}`);
}