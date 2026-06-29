export interface PurchaseOrderSummaryRow {
  status: string;
  order_count: number;
  total_value: number;
}

export interface GoodsReceiptSummaryRow {
  status: string;
  receipt_count: number;
  total_value: number;
}

export interface AdjustmentSummaryRow {
  status: string;
  adjustment_count: number;
  net_quantity: number;
  net_value: number;
}

export interface TransferSummaryRow {
  status: string;
  transfer_count: number;
}

export interface StockCountVarianceRow {
  stock_count_id: string;
  count_number: string;
  warehouse_id: string;
  status: string;
  items_counted: number;
  items_with_variance: number;
  net_variance_quantity: number;
}

export interface WarehouseValuationRow {
  warehouse_id: string;
  code: string;
  name: string;
  is_active: boolean;
  location_count: number;
  inventory_value: number;
}

export interface LowStockRow {
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

export interface InventoryReportsOverview {
  purchaseOrders: PurchaseOrderSummaryRow[];
  goodsReceipts: GoodsReceiptSummaryRow[];
  adjustments: AdjustmentSummaryRow[];
  transfers: TransferSummaryRow[];
  stockCountsVariance: StockCountVarianceRow[];
  warehouseValuation: WarehouseValuationRow[];
  lowStock: LowStockRow[];
}
