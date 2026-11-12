export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type PaymentMethod =
  | 'cash' | 'card' | 'split' | 'wallet' | 'mada' | 'visa'
  | 'mastercard' | 'stc_pay' | 'apple_pay' | 'tab';

export interface ReceiptLineItem {
  item_id: string;
  item_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
}

export interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  // G4 - worker + commission snapshot taken at sale time.
  worker_id?: string | null;
  commission_rate?: number | null;
  commission_amount?: number | null;
}

export interface Order {
  id: string;
  /** Sequential legal invoice number (null for orders created before numbering). */
  invoice_no?: string | null;
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
  // T12 - the car washed (snapshot of the plate at sale time).
  vehicle_id?: string | null;
  plate_snapshot?: string | null;
  vehicle_size?: string | null;
  items?: OrderItem[];
  created_at: string;
  // Phase 3a: who/when/why an order was cancelled (null until cancelled).
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancel_reason?: string | null;
  // Only present on the create-order response (invoices.service.ts create()),
  // not on the full Order shape returned by GET — non-blocking stock-deduction
  // failure surfaced to the cashier instead of being silent.
  stock_warning?: string | null;
  // Same create-response-only note as stock_warning — the tax rate actually
  // applied server-side at the moment of sale, for the printed receipt.
  tax_rate?: number;
  // Create-response-only line items for the receipt (see invoices.service.ts
  // create()) — mirrors PosEngine's BuiltInvoice line shape exactly, the
  // same figures already used to post this invoice's accounting entry.
  // Never recompute these client-side for display; they can diverge from a
  // live cart preview (coupon race, server-side reward discount, etc.).
  // Named `receipt_items` (not `items`) since it lacks the full persisted
  // OrderItem shape (no `id`/`total_price` — total is display-derived here,
  // quantity * unit_price, never independently rounded server-side per line).
  receipt_items?: ReceiptLineItem[];
  // Create-response-only, present when a `free_item` reward was redeemed on
  // this sale — see api/src/modules/rewards/reward-redemption.service.ts
  // (FreeItemGrant) and invoices.service.ts create(). The backend
  // intentionally does NOT auto-insert these as order lines; the POS/cashier
  // is expected to hand the item over manually, hence this informational
  // list on the receipt only.
  free_item_grants?: FreeItemGrant[];
}

export interface FreeItemGrant {
  reward_instance_id: string;
  item_id: string;
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