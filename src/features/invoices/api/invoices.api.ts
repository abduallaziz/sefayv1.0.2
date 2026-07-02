import { apiClient } from '@/lib/api';

export interface InvoiceItem {
  item_id: string;
  item_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
}

export interface CreateInvoiceDto {
  branch_id: string;
  shift_id?: string;
  customer_id?: string;
  items: InvoiceItem[];
  payment_method: 'cash' | 'card' | 'split';
  cash_tendered?: number;    // H-015 FIX: was tendered_amount
  cash_amount?: number;
  card_amount?: number;
  discount?: {               // H-015 FIX: was discount_amount (flat number)
    type: 'percentage' | 'fixed';
    value: number;
    max_allowed?: number;
  };
  tax_rate?: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  status: 'pending' | 'completed' | 'cancelled';
  subtotal: number;
  discount_amount: number;   // H-001: backend aliases discount → discount_amount
  tax: number;
  total: number;
  payment_method: string;
  cashier_id: string;
  cashier_name: string | null;  // H-006 FIX
  customer_id: string | null;
  customer_name: string | null; // H-006 FIX
  branch_id: string;
  notes: string | null;
  created_at: string;
  items?: InvoiceItemResponse[];
}

export interface InvoiceItemResponse {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;          // H-002: backend aliases qty → quantity
  unit_price: number;        // H-003: backend aliases price → unit_price
  total_price: number;       // H-004 FIX
  variant_id: string | null;
  variant_name: string | null;
}

export const invoicesApi = {
  getAll: (params?: { branch_id?: string; status?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiClient.get<Invoice[]>(`/invoices${qs}`);
  },
  getById: (id: string) => apiClient.get<Invoice>(`/invoices/${id}`),
  create: (dto: CreateInvoiceDto) => apiClient.post<Invoice>('/invoices', dto),
  cancel: (id: string, reason?: string) =>
    apiClient.patch<Invoice>(`/invoices/${id}/cancel`, { reason }),
};