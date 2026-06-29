export type AdjustmentStatus = 'pending_approval' | 'approved' | 'rejected' | 'posted';

export interface StockAdjustment {
  id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  batch_id: string | null;
  quantity_delta: number;
  unit_cost: number | null;
  reason: string;
  location_id?: string | null;
  status: AdjustmentStatus;
  requires_approval: boolean;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  posted_at?: string | null;
  created_at: string;
  items?: { name: string; sku: string } | null;
  warehouses?: { name: string; code: string } | null;
  requested_by_user?: { name: string } | null;
  approved_by_user?: { name: string } | null;
}

export interface AdjustmentFilters {
  status?: AdjustmentStatus;
}

export interface CreateAdjustmentDTO {
  warehouse_id: string;
  item_id: string;
  variant_id?: string;
  batch_id?: string;
  quantity_delta: number;
  unit_cost?: number;
  reason: string;
  location_id?: string;
}
