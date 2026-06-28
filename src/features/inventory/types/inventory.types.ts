export interface Warehouse {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface StockLevel {
  id: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  variant_name: string | null;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  low_stock_threshold: number;
  cost_price: number;
  updated_at: string;
}

export type StockMovementType = 'sale' | 'purchase' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'return';

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  variant_name: string | null;
  warehouse_id: string;
  warehouse_name: string;
  type: StockMovementType;
  quantity_change: number;
  quantity_after: number;
  reference: string | null;
  note: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  total_cost: number;
  note: string | null;
  created_at: string;
  received_at: string | null;
}

export interface StockLevelFilters {
  search: string;
  warehouse_id: string | 'all';
  low_stock_only: boolean;
}

export interface MovementFilters {
  search: string;
  warehouse_id: string | 'all';
  type: StockMovementType | 'all';
}

export interface CreateWarehouseDTO {
  name: string;
  is_default?: boolean;
}

export interface UpdateWarehouseDTO extends Partial<CreateWarehouseDTO> {
  is_active?: boolean;
}

export interface AdjustStockDTO {
  item_id: string;
  item_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  warehouse_id: string;
  quantity_change: number;
  type: StockMovementType;
  reference?: string | null;
  note?: string | null;
}

export interface SetThresholdDTO {
  item_id: string;
  variant_id?: string | null;
  warehouse_id: string;
  low_stock_threshold: number;
}

export interface CreateSupplierDTO {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {
  is_active?: boolean;
}

export interface CreatePurchaseOrderItemDTO {
  item_id: string;
  item_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseOrderDTO {
  supplier_id: string;
  warehouse_id: string;
  items: CreatePurchaseOrderItemDTO[];
  note?: string;
}
