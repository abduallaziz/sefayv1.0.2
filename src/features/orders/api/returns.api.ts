import { apiClient } from '@/lib/api';

export interface ReturnableItem {
  order_item_id: string;
  item_name: string;
  variant_name: string | null;
  quantity: number;
  unit_value: number;
  returned_quantity: number;
  returnable_quantity: number;
}

export interface OrderReturnRecord {
  id: string;
  created_at: string;
  reason: string | null;
  refund_method: string;
  refund_total: number;
  refund_cash: number;
  refund_noncash: number;
}

export interface OrderReturnInfo {
  order: { id: string; status: string; total: number; payment_method: string };
  items: ReturnableItem[];
  returns: OrderReturnRecord[];
}

export interface ReturnLineInput {
  order_item_id: string;
  quantity: number;
}

export interface ReturnRequest {
  items: ReturnLineInput[];
  reason?: string;
}

export interface ReturnResult {
  dry_run: boolean;
  id?: string;
  net_amount: number;
  tax_amount: number;
  refund_total: number;
  refund_cash: number;
  refund_noncash: number;
  refund_method: string;
}

export const returnsApi = {
  getInfo: (orderId: string): Promise<OrderReturnInfo> =>
    apiClient.get<OrderReturnInfo>(`/invoices/${orderId}/returns`),

  preview: (orderId: string, body: ReturnRequest): Promise<ReturnResult> =>
    apiClient.post<ReturnResult>(`/invoices/${orderId}/returns/preview`, body),

  create: (orderId: string, body: ReturnRequest): Promise<ReturnResult> =>
    apiClient.post<ReturnResult>(`/invoices/${orderId}/returns`, body),
};
