export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SupplierProfileStats {
  outstanding_po_count: number;
  open_receipts_count: number;
  total_purchase_orders: number;
  total_purchases_value: number;
  inventory_value_purchased: number;
  last_purchase_date: string | null;
  avg_lead_time_days: number | null;
}

export interface SupplierFilters {
  search: string;
  is_active: boolean | 'all';
}

export interface CreateSupplierDTO {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  is_active?: boolean;
}

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;

// #9.6 Supplier Price History & Procurement Price Timeline
// (Owner-approved) — GET /purchasing/suppliers/:id/items/:itemId/price-timeline.
// Bare rows from SuppliersRepository.findPriceTimeline: no fabricated
// data — a supplier-scoped timeline can never include a goods receipt
// with no purchase_order_id (goods_receipts has no direct supplier_id
// column anywhere in the schema), so unlinked receipts are correctly
// absent, not guessed.
export interface SupplierPriceTimelineEntry {
  stage: 'quote' | 'purchase_order' | 'goods_receipt';
  supplier_id: string;
  item_id: string;
  variant_id: string | null;
  price: number;
  quantity: number | null;
  document_id: string;
  warehouse_id: string | null;
  date: string;
  source_reference: Record<string, unknown>;
}

export interface PagedSupplierPriceTimeline {
  data: SupplierPriceTimelineEntry[];
  total: number;
  page: number;
  perPage: number;
}
