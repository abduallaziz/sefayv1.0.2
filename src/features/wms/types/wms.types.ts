export interface Shipment {
  id: string;
  warehouse_id: string;
  reference_type: string;
  reference_id: string;
  status: 'pending' | 'picking' | 'picked' | 'packing' | 'packed' | 'shipped' | 'cancelled';
  tracking_number: string | null;
  shipped_at: string | null;
  created_at: string;
  lines?: ShipmentLine[];
}

export interface ShipmentLine {
  id: string;
  shipment_id: string;
  item_id: string;
  variant_id: string | null;
  location_id: string | null;
  quantity_requested: number;
  quantity_picked: number;
  quantity_packed: number;
  items?: { name: string; sku: string };
}

export interface PickList {
  id: string;
  warehouse_id: string;
  strategy: 'single' | 'batch' | 'wave' | 'zone';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  created_at: string;
  lines?: PickListLine[];
}

export interface PickListLine {
  id: string;
  pick_list_id: string;
  item_id: string;
  variant_id: string | null;
  location_id: string | null;
  batch_id: string | null;
  quantity_to_pick: number;
  quantity_picked: number;
  items?: { name: string; sku: string };
}

export interface PutawayRule {
  id: string;
  name: string;
  warehouse_id: string | null;
  applies_to_item_id: string | null;
  applies_to_category_id: string | null;
  target_location_purpose: string;
  target_location_id: string;
  priority: number;
  is_active: boolean;
}

export interface ReplenishmentRule {
  id: string;
  warehouse_id: string;
  item_id: string;
  variant_id: string | null;
  destination_location_id: string;
  source_location_id: string;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
}

export interface WarehouseTask {
  id: string;
  warehouse_id: string;
  task_type: 'putaway' | 'replenishment';
  item_id: string;
  variant_id: string | null;
  batch_id: string | null;
  quantity: number;
  quantity_completed: number;
  source_location_id: string | null;
  suggested_location_id: string | null;
  confirmed_location_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  created_at: string;
  items?: { name: string };
}
