export interface InventoryDashboardSummary {
  inventory_value: number;
  total_warehouses: number;
  products_in_stock: number;
  low_stock_items: number;
  out_of_stock_items: number;
  reserved_stock: number;
  pending_purchase_orders: number;
  pending_goods_receipts: number;
  movements_today: number;
  adjustments_today: number;
}

export interface InventoryWarehouseSummary {
  warehouse_id: string;
  code: string;
  name: string;
  is_active: boolean;
  location_count: number;
  inventory_value: number;
}

export interface InventoryLowStockRow {
  item_id: string;
  variant_id: string | null;
  warehouse_id: string;
  item_name: string;
  variant_name: string | null;
  warehouse_name: string;
  quantity_on_hand: number;
  min_quantity: number;
  reorder_quantity: number;
  status: 'out_of_stock' | 'low_stock';
}

export interface InventoryRecentMovement {
  id: string;
  occurred_at: string;
  movement_type: string;
  quantity: number;
  items: { name: string; sku: string } | null;
  item_variants: { name: string; sku: string } | null;
  warehouses: { name: string; code: string } | null;
}

export interface InventoryPendingPurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  expected_date: string | null;
  suppliers: { name: string } | null;
  warehouses: { name: string } | null;
}

export interface InventoryDashboardData {
  summary: InventoryDashboardSummary;
  warehouses: InventoryWarehouseSummary[];
  recentMovements: InventoryRecentMovement[];
  lowStock: InventoryLowStockRow[];
  purchaseOrdersWaitingReceipt: InventoryPendingPurchaseOrder[];
}
