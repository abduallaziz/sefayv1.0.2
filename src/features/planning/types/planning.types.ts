export interface ReorderPoint {
  id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  min_quantity: number;
  max_quantity: number | null;
  reorder_quantity: number;
  lead_time_days: number | null;
  service_level_z: number | null;
  is_active: boolean;
  items?: { name: string } | null;
  warehouses?: { name: string } | null;
}

export interface CreateReorderPointDTO {
  warehouse_id: string;
  item_id: string;
  variant_id?: string;
  min_quantity: number;
  max_quantity?: number;
  reorder_quantity: number;
  lead_time_days?: number;
  service_level_z?: number;
}

export type UpdateReorderPointDTO = Partial<
  Omit<CreateReorderPointDTO, 'warehouse_id' | 'item_id' | 'variant_id'>
> & { is_active?: boolean };

export interface PurchaseSuggestion {
  reorder_point_id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  item_name: string;
  quantity_available: number;
  quantity_incoming: number;
  avg_daily_demand: number;
  lead_time_days: number;
  forecasted_demand_during_lead_time: number;
  suggested_order_quantity: number;
}

export interface ConvertSuggestionsPayload {
  warehouse_id?: string;
  branch_id?: string;
  notes?: string;
  items: {
    item_id: string;
    variant_id?: string;
    quantity_requested: number;
  }[];
}
