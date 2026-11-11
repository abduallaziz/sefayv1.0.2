import { apiClient } from '@/lib/api';
import {
  Shipment, PickList, PutawayRule, ReplenishmentRule, WarehouseTask,
  PickListsQuery, PagedPickLists, PickListHistoryEntry,
  ShipmentsQuery, PagedShipments, ZoneSplitPickList, CreateZoneSplitPickListsRequest,
  Wave, WavesQuery, PagedWaves, WaveReleasePickList, CreateWaveRequest,
  WarehouseTasksQuery, PagedWarehouseTasks, CreateWarehouseTaskRequest,
} from '../types/wms.types';

export const wmsApi = {
  // Shipments (packing/shipping)
  getShipments: (status?: string) => apiClient.get<Shipment[]>(`/inventory/wms/shipments${status ? `?status=${status}` : ''}`),
  // Inventory #7 / F6 (Owner-approved) — F17 server-side page/sort/filter
  // form for shipments, mirrors getPickListsPaged's query-builder pattern.
  // Used by the zone-split shipment-selection panel so it never loads a
  // warehouse's full shipment list.
  getShipmentsPaged: (query: ShipmentsQuery = {}): Promise<PagedShipments> => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.warehouse_id) params.set('warehouse_id', query.warehouse_id);
    if (query.date_from) params.set('date_from', query.date_from);
    if (query.date_to) params.set('date_to', query.date_to);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiClient.get<PagedShipments>(`/inventory/wms/shipments${qs ? `?${qs}` : ''}`);
  },
  createShipment: (body: Record<string, unknown>) => apiClient.post<Shipment>('/inventory/wms/shipments', body),
  cancelShipment: (id: string) => apiClient.post(`/inventory/wms/shipments/${id}/cancel`, {}),
  shipShipment: (id: string, trackingNumber?: string) => apiClient.post(`/inventory/wms/shipments/${id}/ship`, { tracking_number: trackingNumber }),
  confirmPack: (shipmentLineId: string, quantity: number) => apiClient.post(`/inventory/wms/shipment-lines/${shipmentLineId}/pack`, { quantity }),

  // Pick lists
  getPickLists: (status?: string) => apiClient.get<PickList[]>(`/inventory/wms/pick-lists${status ? `?status=${status}` : ''}`),
  // Inventory #7 / F2 (Owner-approved) — F17 server-side page/sort/filter
  // form. Mirrors customersApi.getPaged's query-builder pattern exactly.
  getPickListsPaged: (query: PickListsQuery = {}): Promise<PagedPickLists> => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.warehouse_id) params.set('warehouse_id', query.warehouse_id);
    if (query.priority) params.set('priority', query.priority);
    if (query.strategy) params.set('strategy', query.strategy);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiClient.get<PagedPickLists>(`/inventory/wms/pick-lists${qs ? `?${qs}` : ''}`);
  },
  createPickList: (body: { warehouse_id: string; shipment_ids: string[]; strategy: string; zone_location_id?: string }) =>
    apiClient.post<PickList>('/inventory/wms/pick-lists', body),
  confirmPick: (pickListLineId: string, quantity: number, batchId?: string) =>
    apiClient.post(`/inventory/wms/pick-list-lines/${pickListLineId}/pick`, { quantity, batch_id: batchId }),
  // Inventory #7 / F4 (Owner-approved) — POST .../assign is the single
  // backend endpoint for both assign (assigned_to was null) and reassign
  // (assigned_to already set) — fn_assign_pick_list branches on that
  // itself and writes the appropriate history note either way, so the
  // frontend does not need (and must not invent) a separate reassign call.
  assignPickList: (id: string, assignedTo: string) =>
    apiClient.post<PickList>(`/inventory/wms/pick-lists/${id}/assign`, { assigned_to: assignedTo }),
  // Inventory #7 / F5 (Owner-approved) — reason is required and sent
  // exactly as the user entered it (only trimmed), never truncated or
  // mapped through an invented enum — CancelPickListDto accepts free text.
  cancelPickList: (id: string, reason: string) =>
    apiClient.post<PickList>(`/inventory/wms/pick-lists/${id}/cancel`, { reason }),
  // Inventory #7 / F3 (Owner-approved) — detail drawer data source.
  getPickListById: (id: string) => apiClient.get<PickList>(`/inventory/wms/pick-lists/${id}`),
  // Inventory #7 / F7 (Owner-approved) — F17 server-side page/sort/filter
  // for GET /inventory/wms/waves, mirrors WavesQueryDto exactly (only
  // status/warehouse_id filters and created_at/status sort — no invented
  // date-range/search/shipment-count params the backend doesn't support).
  getWavesPaged: (query: WavesQuery = {}): Promise<PagedWaves> => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.warehouse_id) params.set('warehouse_id', query.warehouse_id);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiClient.get<PagedWaves>(`/inventory/wms/waves${qs ? `?${qs}` : ''}`);
  },
  getWaveById: (id: string) => apiClient.get<Wave>(`/inventory/wms/waves/${id}`),
  // Inventory #7 / F10 (Owner-approved) — POST /inventory/wms/waves already
  // exists (CreateWaveDto: warehouse_id required, criteria optional
  // free-form JSONB); no backend change needed. Returns the bare created
  // wave row (status defaults to 'planning' via the table DEFAULT).
  createWave: (body: CreateWaveRequest) => apiClient.post<Wave>('/inventory/wms/waves', body),
  // Inventory #7 / F7 gap closure (Owner-approved, read-only, no schema
  // change) — same real warehouse_work_status_history source as pick
  // lists' history (entity_type='wave' instead of 'pick_list'), reuses
  // the exact same PickListHistoryEntry shape since both endpoints read
  // the same table with the same columns.
  getWaveHistory: (id: string) => apiClient.get<PickListHistoryEntry[]>(`/inventory/wms/waves/${id}/history`),
  // Inventory #8 / F8 (Owner-approved) — the 3 real Wave action endpoints
  // audited against the actual controller/service (wms.controller.ts,
  // wms.service.ts): evaluate only runs from 'planning' (fn_evaluate_
  // wave_eligibility raises otherwise), release only from 'reviewing'
  // (fn_release_wave), cancel only from planning/evaluating/reviewing
  // (fn_cancel_wave, migration 237) — all three enforced server-side, the
  // frontend only mirrors the gating to avoid showing a button the
  // backend will certainly reject. No separate "claim" endpoint exists —
  // claim is an atomic sub-step inside release by design.
  evaluateWave: (id: string) =>
    apiClient.post<{ included_reason: unknown; excluded_reason: unknown }[]>(`/inventory/wms/waves/${id}/evaluate`, {}),
  releaseWave: (id: string, priority?: 'low' | 'medium' | 'high' | 'urgent') =>
    apiClient.post<WaveReleasePickList[]>(`/inventory/wms/waves/${id}/release`, priority ? { priority } : {}),
  cancelWave: (id: string, reason: string) =>
    apiClient.post<Wave>(`/inventory/wms/waves/${id}/cancel`, { reason }),
  getPickListHistory: (id: string) => apiClient.get<PickListHistoryEntry[]>(`/inventory/wms/pick-lists/${id}/history`),
  // Bounded by one pick list's own real shipment ids (usually 1, rarely
  // more than a handful for batch strategy) — not a list-wide N+1, and no
  // batch-by-ids endpoint exists on /shipments to fetch these in one call.
  getShipmentById: (id: string) => apiClient.get<Shipment>(`/inventory/wms/shipments/${id}`),
  // Inventory #7 / F6 (Owner-approved) — fn_create_zone_pick_lists_for_shipments
  // (migration 229) auto-discovers every real zone represented among the
  // given shipments' lines and creates one 'zone' pick list per zone —
  // no zone_location_id/strategy param, matching the actual 7-3 contract.
  createZoneSplitPickLists: (body: CreateZoneSplitPickListsRequest) =>
    apiClient.post<ZoneSplitPickList[]>('/inventory/wms/pick-lists/zone-split', body),

  // Putaway
  getPutawayRules: () => apiClient.get<PutawayRule[]>('/inventory/putaway/rules'),
  createPutawayRule: (body: Record<string, unknown>) => apiClient.post<PutawayRule>('/inventory/putaway/rules', body),
  suggestPutaway: (warehouseId: string, itemId: string, quantity: number) =>
    apiClient.get(`/inventory/putaway/suggest?warehouse_id=${warehouseId}&item_id=${itemId}&quantity=${quantity}`),

  // Replenishment
  getReplenishmentRules: () => apiClient.get<ReplenishmentRule[]>('/inventory/replenishment/rules'),
  createReplenishmentRule: (body: Record<string, unknown>) => apiClient.post<ReplenishmentRule>('/inventory/replenishment/rules', body),
  runReplenishmentCheck: (warehouseId: string) => apiClient.post(`/inventory/replenishment/run-check?warehouse_id=${warehouseId}`, {}),

  // Warehouse tasks (putaway + replenishment execution)
  // Inventory #7 / F11 (Owner-approved) — F17 server-side page/sort/filter
  // for GET /inventory/warehouse-tasks, mirrors WarehouseTasksQueryDto
  // exactly (api/src/modules/inventory/dto/wms-list-query.dto.ts) — the
  // backend contract already existed, unused by any frontend list until
  // this item.
  getWarehouseTasksPaged: (query: WarehouseTasksQuery = {}): Promise<PagedWarehouseTasks> => {
    const params = new URLSearchParams();
    if (query.task_type) params.set('task_type', query.task_type);
    if (query.status) params.set('status', query.status);
    if (query.assigned_to) params.set('assigned_to', query.assigned_to);
    if (query.warehouse_id) params.set('warehouse_id', query.warehouse_id);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiClient.get<PagedWarehouseTasks>(`/inventory/warehouse-tasks${qs ? `?${qs}` : ''}`);
  },
  getWarehouseTaskById: (id: string) => apiClient.get<WarehouseTask>(`/inventory/warehouse-tasks/${id}`),
  getWarehouseTaskHistory: (id: string) => apiClient.get<PickListHistoryEntry[]>(`/inventory/warehouse-tasks/${id}/history`),
  createWarehouseTask: (body: CreateWarehouseTaskRequest) => apiClient.post<WarehouseTask>('/inventory/warehouse-tasks', body),
  assignWarehouseTask: (id: string, assignedTo: string) => apiClient.post<WarehouseTask>(`/inventory/warehouse-tasks/${id}/assign`, { assigned_to: assignedTo }),
  confirmWarehouseTask: (id: string, quantity: number, confirmedLocationId: string) =>
    apiClient.post<WarehouseTask>(`/inventory/warehouse-tasks/${id}/confirm`, { quantity, confirmed_location_id: confirmedLocationId }),
  cancelWarehouseTask: (id: string) => apiClient.post<WarehouseTask>(`/inventory/warehouse-tasks/${id}/cancel`, {}),
};
