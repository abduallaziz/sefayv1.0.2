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
