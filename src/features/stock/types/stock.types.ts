export interface StockLevel {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  updated_at: string;
  items?: { name: string; sku: string } | null;
  item_variants?: { name: string; sku: string } | null;
  warehouses?: { name: string; code: string } | null;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  movement_type: string;
  direction: 'in' | 'out';
  quantity: number;
  unit_cost: number;
  reference_type: string | null;
  reference_id: string | null;
  occurred_at: string;
  items?: { name: string; sku: string } | null;
  warehouses?: { name: string; code: string } | null;
}

export interface StockLevelFilters {
  warehouse_id?: string;
  item_id?: string;
  variant_id?: string;
}

export interface StockLevelEnriched {
  stock_level_id: string;
  item_id: string;
  variant_id: string | null;
  warehouse_id: string;
  location_id: string | null;
  batch_id: string | null;
  item_name: string;
  item_sku: string;
  variant_name: string | null;
  warehouse_name: string;
  location_name: string | null;
  location_code: string | null;
  batch_number: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_incoming: number;
  reorder_min: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  inventory_value: number;
  last_movement_at: string | null;
}

export interface StockLevelEnrichedFilters {
  warehouse_id?: string;
  item_id?: string;
  category_id?: string;
  location_id?: string;
  batch_id?: string;
  supplier_id?: string;
  status?: string;
}

export interface StockMovementFilters extends StockLevelFilters {
  reference_type?: string;
  reference_id?: string;
  page?: number;
  per_page?: number;
}

export interface StockMovementsResponse {
  data: StockMovement[];
  total: number;
  page: number;
  perPage: number;
}
