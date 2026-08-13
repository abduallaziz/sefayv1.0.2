export interface AnalyticsFilters {
  warehouse_id?: string;
  date_from: string;
  date_to: string;
}

export interface ValuationRow {
  warehouse_id: string;
  warehouse_name: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  quantity_on_hand: number;
  average_unit_cost: number;
  total_value: number;
}

export interface TurnoverRow {
  warehouse_id: string;
  item_id: string;
  cogs_in_period: number;
  average_inventory_value: number;
  turnover_ratio: number | null;
  days_in_period: number;
}

export interface AgingRow {
  warehouse_id: string;
  item_id: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_quantity: number;
  total_value: number;
}

export interface AbcRow {
  item_id: string;
  item_name: string;
  warehouse_id: string;
  cogs_in_period: number;
  cumulative_percentage: number;
  classification: 'A' | 'B' | 'C';
}

export interface DeadStockRow {
  item_id: string;
  item_name: string;
  warehouse_id: string;
  quantity_on_hand: number;
  total_value: number;
  last_outbound_at: string | null;
}

export interface SlowMovingRow {
  item_id: string;
  item_name: string;
  warehouse_id: string;
  quantity_on_hand: number;
  units_sold_in_window: number;
  turnover_ratio: number | null;
}

export interface OverstockRow {
  item_id: string;
  item_name: string;
  warehouse_id: string;
  quantity_on_hand: number;
  max_quantity: number | null;
  excess_quantity: number | null;
  excess_value: number | null;
  has_reorder_point: boolean;
}

export interface StockAccuracyRow {
  warehouse_id: string;
  total_items_counted: number;
  zero_variance_items: number;
  total_expected_quantity: number;
  total_absolute_variance_quantity: number;
  accuracy_percentage: number | null;
}

export interface CoverageRow {
  warehouse_id: string;
  item_id: string;
  item_name: string;
  quantity_on_hand: number;
  average_daily_demand: number;
  days_of_coverage: number | null;
}
