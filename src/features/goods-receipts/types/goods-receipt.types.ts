export type GoodsReceiptStatus = 'draft' | 'posted' | 'cancelled';

export interface GoodsReceiptItem {
  id: string;
  purchase_order_item_id: string | null;
  item_id: string;
  item_name?: string;
  variant_id: string | null;
  variant_name?: string | null;
  quantity_received: number;
  quantity_ordered?: number | null;
  unit_cost: number;
  batch_number: string | null;
  serial_number: string | null;
  expiration_date: string | null;
  location_id?: string | null;
}

export interface GoodsReceipt {
  id: string;
  purchase_order_id: string | null;
  purchase_order_number?: string | null;
  supplier_name?: string | null;
  warehouse_id: string;
  warehouse_name?: string;
  receipt_number: string;
  notes: string | null;
  status: GoodsReceiptStatus;
  items?: GoodsReceiptItem[];
  items_count?: number;
  created_at: string;
}

export interface GoodsReceiptFilters {
  status?: GoodsReceiptStatus;
}

export interface CreateGoodsReceiptItemDTO {
  purchase_order_item_id?: string;
  item_id: string;
  variant_id?: string;
  quantity_received: number;
  unit_cost: number;
  batch_number?: string;
  serial_number?: string;
  expiration_date?: string;
  location_id?: string;
}

export interface CreateGoodsReceiptDTO {
  purchase_order_id?: string;
  warehouse_id: string;
  receipt_number: string;
  notes?: string;
  items: CreateGoodsReceiptItemDTO[];
}
