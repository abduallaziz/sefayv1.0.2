export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  item_id: string;
  item_name?: string;
  variant_id: string | null;
  variant_name?: string | null;
  quantity_ordered: number;
  unit_cost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  order_number: string;
  order_date: string | null;
  expected_date: string | null;
  notes: string | null;
  status: PurchaseOrderStatus;
  items?: PurchaseOrderItem[];
  created_at: string;
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
}

export interface CreatePurchaseOrderItemDTO {
  item_id: string;
  variant_id?: string;
  quantity_ordered: number;
  unit_cost: number;
}

export interface CreatePurchaseOrderDTO {
  supplier_id: string;
  warehouse_id: string;
  order_number: string;
  order_date?: string;
  expected_date?: string;
  notes?: string;
  items: CreatePurchaseOrderItemDTO[];
}

export interface UpdatePurchaseOrderDTO {
  expected_date?: string;
  notes?: string;
}
