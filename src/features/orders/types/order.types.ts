
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'split';

export interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name: string;
  customer_id?: string;
  customer_name?: string;
  shift_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
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