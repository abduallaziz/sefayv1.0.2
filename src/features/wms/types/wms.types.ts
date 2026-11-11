export interface Shipment {
  id: string;
  warehouse_id: string;
  reference_type: string;
  reference_id: string;
  status: 'pending' | 'picking' | 'picked' | 'packing' | 'packed' | 'shipped' | 'cancelled';
  tracking_number: string | null;
  shipped_at: string | null;
  created_at: string;
  warehouses?: { name: string; code: string };
  lines?: ShipmentLine[];
}

// Inventory #7 / F6 (Owner-approved) — F17 server-side page/sort/filter
// contract for GET /inventory/wms/shipments, mirrors ShipmentsQueryDto
// exactly (api/src/modules/inventory/dto/wms-list-query.dto.ts).
export interface ShipmentsQuery {
  status?: string;
  warehouse_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PagedShipments {
  data: Shipment[];
  total: number;
  page: number;
  perPage: number;
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

// Inventory #7 / F7 (Owner-approved) — GET /inventory/wms/waves, mirrors
// WavesQueryDto exactly (api/src/modules/inventory/dto/wms-list-query.dto.ts).
// Bare `waves.*` row, no join — WmsRepository.findWaves does a plain
// `.select('*')`, so warehouse/creator *names* are resolved client-side via
// the existing bulk useWarehouses()/useUsers() lists (same established
// precedent as F2's assignment column), never a fabricated join. Only the 2
// sort fields the backend actually implements (WAVE_SORT_FIELDS) — no
// invented shipment-count sort, since no such column/aggregate exists on
// this table to sort by server-side.
export interface Wave {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  status: 'planning' | 'evaluating' | 'reviewing' | 'released' | 'picking' | 'completed' | 'cancelled';
  criteria: Record<string, unknown>;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  evaluated_at: string | null;
  released_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

// Inventory #7 / F10 (Owner-approved) — POST /inventory/wms/waves
// (createWave, wms.controller.ts / CreateWaveDto). `criteria` is
// deliberately free-form JSONB at the DTO layer (no shape validation
// there) — the real, authoritative vocabulary of 13 of the 14 known keys
// this builder can produce is fn_evaluate_wave_eligibility's own
// validation block (migration 232). `zone_ids` (the 14th key) is
// intentionally NOT offered here: there is no backend endpoint anywhere
// that lists zone-type warehouse_locations for a warehouse to populate a
// real multi-select from (confirmed via full controller search), so this
// is a disclosed, out-of-scope gap rather than an invented one.
export interface CreateWaveCriteria {
  priority_min?: 'low' | 'medium' | 'high' | 'urgent';
  // F10 zone-criteria gap closure (Owner-approved) — real
  // warehouse_locations.id values for location_type='zone' rows (the
  // sole hierarchy root type, migration 097), sourced via
  // GET /inventory/warehouses/:warehouseId/locations?locationType=zone
  // (extended, not duplicated — same endpoint the existing Locations
  // feature already uses). Matches fn_evaluate_wave_eligibility's own
  // `z.zone_id::uuid` cast (migration 231/232) exactly.
  zone_ids?: string[];
  route?: string;
  carrier?: string;
  order_type?: string;
  cutoff_before?: string;
  release_after?: string;
  release_before?: string;
  require_inventory_ready?: 'true' | 'false';
  require_replenishment_ready?: 'true' | 'false';
  capacity_ok?: 'true' | 'false';
  labor_available?: 'true' | 'false';
  dock_ready?: 'true' | 'false';
  customer_service_level_ok?: 'true' | 'false';
}

export interface CreateWaveRequest {
  warehouse_id: string;
  criteria?: CreateWaveCriteria;
}

export interface WavesQuery {
  status?: string;
  warehouse_id?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PagedWaves {
  data: Wave[];
  total: number;
  page: number;
  perPage: number;
}

export interface PickList {
  id: string;
  warehouse_id: string;
  strategy: 'single' | 'batch' | 'wave' | 'zone';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  zone_location_id: string | null;
  wave_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  warehouses?: { name: string; code: string };
  shipments?: { shipment_id: string }[];
  lines?: PickListLine[];
}

// Inventory #7 / F2 (Owner-approved) — F17 server-side query contract for
// GET /inventory/wms/pick-lists, mirrors PickListsQueryDto exactly
// (api/src/modules/inventory/dto/wms-list-query.dto.ts). Only the 4 filters
// and 2 sort fields the backend actually implements — no invented search or
// date-range params, since the backend contract doesn't support them for
// this endpoint.
export interface PickListsQuery {
  status?: string;
  warehouse_id?: string;
  priority?: string;
  strategy?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface PagedPickLists {
  data: PickList[];
  total: number;
  page: number;
  perPage: number;
}

// Inventory #7 / F6 (Owner-approved) — POST /pick-lists/zone-split
// `RETURNS SETOF pick_lists` (fn_create_zone_pick_lists_for_shipments,
// migration 229): bare pick_lists rows, no joins — unlike PickList above
// (which is F2/F3's joined list/detail shape), this response has no
// warehouses/shipments/lines nested data. The result UI links each created
// id into the existing PickListDetailDrawer (F3) for full detail instead
// of re-fetching/re-rendering that data here.
export interface ZoneSplitPickList {
  id: string;
  warehouse_id: string;
  strategy: 'zone';
  zone_location_id: string;
  status: 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

export interface CreateZoneSplitPickListsRequest {
  warehouse_id: string;
  shipment_ids: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Inventory #8 / F8 (Owner-approved) — POST /waves/:id/release
// `RETURNS SETOF pick_lists` (fn_release_wave, migration 248): bare
// pick_lists row, no join, strategy is always 'wave' and
// zone_location_id is always null for this path (distinct shape from
// ZoneSplitPickList's strategy='zone').
export interface WaveReleasePickList {
  id: string;
  warehouse_id: string;
  strategy: 'wave';
  wave_id: string;
  zone_location_id: null;
  status: 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
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
  // Inventory #7 / F3 residual (Owner-approved) — server-side aggregate,
  // summed from warehouse_exceptions (entity_type='pick_list_line') in one
  // bounded query per detail fetch (WmsRepository.findPickListById), not
  // computed client-side and not one request per line.
  exception_quantity: number;
  items?: { name: string; sku: string };
}

// Inventory #7 / F3 (Owner-approved) — GET /inventory/wms/pick-lists/:id/history
// returns raw warehouse_work_status_history rows (entity_type='pick_list').
// No actor-name join; resolved client-side via the existing bulk useUsers()
// list, same established pattern as F2's assignment column.
export interface PickListHistoryEntry {
  id: string;
  entity_type: 'warehouse_task' | 'pick_list' | 'wave';
  entity_id: string;
  old_status: string | null;
  new_status: string;
  actor_id: string | null;
  notes: string | null;
  created_at: string;
}

// GET /inventory/wms/exceptions?entity_type=pick_list&entity_id=:id — a
// single entity-scoped call (same bounded pattern as the history endpoint
// above), not a global/unfiltered exceptions fetch.
export interface WarehouseException {
  id: string;
  entity_type: string;
  entity_id: string;
  exception_type: 'short_pick' | 'damaged' | 'lost' | 'cancelled';
  affected_quantity: number | null;
  reason: string;
  status: 'open' | 'resolved';
  created_at: string;
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
  created_by: string | null;
  source_document_type: string | null;
  source_document_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  items?: { name: string };
  warehouses?: { name: string };
}

// Inventory #7 / F11 (Owner-approved) — Warehouse Task Management UI.
// GET /inventory/warehouse-tasks, mirrors WarehouseTasksQueryDto exactly
// (api/src/modules/inventory/dto/wms-list-query.dto.ts) — the F17
// pagination/filter/sort contract already existed on the backend, just
// had no frontend consumer until now (the old WmsPage.tsx "tasks" tab
// used the unbounded, non-paginated getWarehouseTasks(taskType, status)
// call instead, which this supersedes — same precedent as F2/F7
// superseding their own prior ad-hoc list views).
export interface WarehouseTasksQuery {
  task_type?: string;
  status?: string;
  assigned_to?: string;
  warehouse_id?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PagedWarehouseTasks {
  data: WarehouseTask[];
  total: number;
  page: number;
  perPage: number;
}

export interface CreateWarehouseTaskRequest {
  warehouse_id: string;
  task_type: 'putaway' | 'replenishment';
  item_id: string;
  variant_id?: string;
  batch_id?: string;
  quantity: number;
  source_location_id?: string;
  suggested_location_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}
