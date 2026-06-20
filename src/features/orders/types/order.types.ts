export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'split' | 'wallet';

export interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  tenant_id?: string;
  branch_id: string;
  cashier_id: string;
  cashier_name: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  shift_id?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  notes?: string | null;
  items?: OrderItem[];
  created_at: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
  search?: string;
  branch_id?: string;
}

export interface CancelOrderPayload {
  reason?: string;
}