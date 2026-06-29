export type StockCountStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface StockCountItem {
  id: string;
  item_id: string;
  item_name?: string;
  variant_id: string | null;
  batch_id: string | null;
  location_id: string | null;
  location_name?: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
}

export interface StockCount {
  id: string;
  warehouse_id: string;
  warehouse_name?: string;
  count_number: string;
  status: StockCountStatus;
  started_by: string | null;
  started_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  items?: StockCountItem[];
  items_count?: number;
  items_counted?: number;
  items_with_variance?: number;
  net_variance_quantity?: number;
  created_at: string;
}

export interface StockCountFilters {
  status?: StockCountStatus;
}

export interface CreateStockCountDTO {
  warehouse_id: string;
  count_number: string;
  notes?: string;
}

export interface SubmitCountItemDTO {
  counted_quantity: number;
}
