// Inventory #7 / F1 (Owner-approved) — types mirror the real 7-8 backend
// aggregate response shapes exactly (fn_wms_* SQL functions, migration
// 244/245). No field here is invented; every property maps to a real
// column/aggregate in the backend contract.

export interface TaskOverview {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  open: number;
  by_task_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface PickListOverview {
  total: number;
  open: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  assigned: number;
  unassigned: number;
  by_priority: Record<string, number>;
  by_strategy: Record<string, number>;
}

export interface WaveOverview {
  total: number;
  planning: number;
  evaluating: number;
  reviewing: number;
  released: number;
  picking: number;
  completed: number;
  cancelled: number;
  active: number;
  eligible_shipments: number;
  excluded_shipments: number;
  failed_at_release_shipments: number;
  claimed_shipments: number;
}

// Inventory #7 / F7 (Owner-approved) — GET /wms/dashboard/wave-shipment-summary
// (fn_wms_wave_shipment_summary, migration 244). One real bounded call per
// wave detail view, never looped across a list.
export interface WaveShipmentSummaryLine {
  shipment_id: string;
  status: string;
  included_reason: Record<string, unknown> | null;
  excluded_reason: Record<string, unknown> | null;
  claimed: boolean;
}

export interface WaveShipmentSummary {
  wave_id: string;
  eligible: number;
  excluded: number;
  failed_at_release: number;
  shipments: WaveShipmentSummaryLine[];
}

export interface ShipmentQuantities {
  requested: number;
  picked: number;
  exception: number;
  unfulfilled: number;
}

export interface ShipmentOverview {
  total: number;
  pending: number;
  picking: number;
  picked: number;
  packing: number;
  packed: number;
  shipped: number;
  cancelled: number;
  backordered_shipments: number;
  quantities: ShipmentQuantities;
}

export interface ExceptionTypeStat {
  count: number;
  quantity: number;
}

export interface ExceptionOverview {
  total: number;
  by_type: Record<string, ExceptionTypeStat>;
  resolved: number;
  open: number;
  backordered: number;
  total_affected_quantity: number;
  top_reasons: { reason: string; count: number }[];
  volume_by_day: { date: string; count: number }[];
}

export interface ReservationOverview {
  active_count: number;
  active_quantity: number;
  released_count: number;
  consumed_count: number;
  expired_count: number;
  reservation_affecting_exceptions: number;
}

export interface WmsDashboardOverview {
  tasks: TaskOverview;
  pickLists: PickListOverview;
  waves: WaveOverview;
  shipments: ShipmentOverview;
  exceptions: ExceptionOverview;
  reservations: ReservationOverview;
}
