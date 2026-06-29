export type TransferStatus = 'draft' | 'in_transit' | 'completed' | 'cancelled';

export interface TransferItem {
  id: string;
  item_id: string;
  item_name?: string;
  variant_id: string | null;
  batch_id: string | null;
  quantity: number;
  from_location_id?: string | null;
  to_location_id?: string | null;
}

export interface Transfer {
  id: string;
  from_warehouse_id: string;
  from_warehouse_name?: string;
  to_warehouse_id: string;
  to_warehouse_name?: string;
  transfer_number: string;
  notes: string | null;
  status: TransferStatus;
  items?: TransferItem[];
  created_at: string;
}

export interface TransferFilters {
  status?: TransferStatus;
}

export interface CreateTransferItemDTO {
  item_id: string;
  variant_id?: string;
  batch_id?: string;
  quantity: number;
  from_location_id?: string;
  to_location_id?: string;
}

export interface CreateTransferDTO {
  from_warehouse_id: string;
  to_warehouse_id: string;
  transfer_number: string;
  notes?: string;
  items: CreateTransferItemDTO[];
}
