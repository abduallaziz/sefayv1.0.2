// src/features/orders/api/orders.api.ts

import { Order, OrderFilters, CancelOrderPayload } from '../types/order.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.payment_method) params.set('payment_method', filters.payment_method);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.search) params.set('search', filters.search);
  if (filters.branch_id) params.set('branch_id', filters.branch_id);

  const res = await fetch(`${API_BASE}/invoices?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/invoices/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}

export async function cancelOrder(id: string, payload: CancelOrderPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/invoices/${id}/cancel`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to cancel order');
}