import { apiClient } from '@/lib/api';
import type {
  WmsDashboardOverview,
  TaskOverview,
  PickListOverview,
  WaveOverview,
  WaveShipmentSummary,
  ShipmentOverview,
  ExceptionOverview,
  ReservationOverview,
} from '../types/wmsDashboard.types';

// Inventory #7 / F1 (Owner-approved) — thin fetch wrappers over the real
// 7-8 operational visibility endpoints. No client-side aggregation: every
// call returns an already-computed backend aggregate.

function qs(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const wmsDashboardApi = {
  getOverview: (warehouseId?: string) =>
    apiClient.get<WmsDashboardOverview>(
      `/inventory/wms/dashboard/overview${qs({ warehouse_id: warehouseId })}`,
    ),
  getTasks: (warehouseId?: string) =>
    apiClient.get<TaskOverview>(
      `/inventory/wms/dashboard/tasks${qs({ warehouse_id: warehouseId })}`,
    ),
  getPickLists: (warehouseId?: string) =>
    apiClient.get<PickListOverview>(
      `/inventory/wms/dashboard/pick-lists${qs({ warehouse_id: warehouseId })}`,
    ),
  getWaves: (warehouseId?: string) =>
    apiClient.get<WaveOverview>(
      `/inventory/wms/dashboard/waves${qs({ warehouse_id: warehouseId })}`,
    ),
  // Inventory #7 / F7 (Owner-approved) — per-wave shipment breakdown
  // (fn_wms_wave_shipment_summary, migration 244). Bounded to exactly one
  // wave_id per call, used only by the F7 detail drawer while it's open —
  // never looped per list row.
  getWaveShipmentSummary: (waveId: string) =>
    apiClient.get<WaveShipmentSummary>(
      `/inventory/wms/dashboard/wave-shipment-summary${qs({ wave_id: waveId })}`,
    ),
  getShipments: (warehouseId?: string) =>
    apiClient.get<ShipmentOverview>(
      `/inventory/wms/dashboard/shipments${qs({ warehouse_id: warehouseId })}`,
    ),
  getExceptions: (warehouseId?: string, dateFrom?: string, dateTo?: string) =>
    apiClient.get<ExceptionOverview>(
      `/inventory/wms/dashboard/exceptions${qs({ warehouse_id: warehouseId, date_from: dateFrom, date_to: dateTo })}`,
    ),
  getReservations: (warehouseId?: string) =>
    apiClient.get<ReservationOverview>(
      `/inventory/wms/dashboard/reservations${qs({ warehouse_id: warehouseId })}`,
    ),
};
