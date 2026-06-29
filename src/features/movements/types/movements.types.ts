export type MovementType =
  | 'receipt' | 'sale' | 'sale_return' | 'adjustment_in' | 'adjustment_out'
  | 'transfer_out' | 'transfer_in' | 'count_correction_in' | 'count_correction_out';

export interface MovementLedgerRow {
  id: string;
  occurred_at: string;
  movement_type: MovementType;
  direction: 'in' | 'out';
  reference_type: string;
  reference_id: string | null;
  item_id: string;
  variant_id: string | null;
  item_name: string;
  item_sku: string;
  variant_name: string | null;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string | null;
  location_name: string | null;
  batch_id: string | null;
  batch_number: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  running_balance: number;
  created_by: string | null;
  performed_by: string | null;
  total_count: number;
}

export interface MovementsLedgerFilters {
  warehouse_id?: string;
  item_id?: string;
  movement_type?: string;
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface MovementsLedgerResponse {
  data: MovementLedgerRow[];
  total: number;
  page: number;
  perPage: number;
}
