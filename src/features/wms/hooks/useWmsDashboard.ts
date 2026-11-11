import { useQuery } from '@tanstack/react-query';
import { wmsDashboardApi } from '../api/wmsDashboard.api';

// Inventory #7 / F1 (Owner-approved) — one query per 7-8 aggregate
// endpoint (not the combined /overview call) so a single failed widget
// (e.g. exceptions) never corrupts the loading/error state of unrelated
// widgets (e.g. tasks) — each has its own isLoading/isError/data.
// staleTime matches the "Transactional" tier from the established
// query-key convention (operational counts change per user action, not
// per keystroke) — refetches on warehouse filter change via the query key.

const STALE_TIME = 30_000;

export function useWmsTaskOverview(warehouseId?: string) {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'tasks', warehouseId ?? 'all'],
    queryFn: () => wmsDashboardApi.getTasks(warehouseId),
    staleTime: STALE_TIME,
  });
}

export function useWmsPickListOverview(warehouseId?: string) {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'pick-lists', warehouseId ?? 'all'],
    queryFn: () => wmsDashboardApi.getPickLists(warehouseId),
    staleTime: STALE_TIME,
  });
}

export function useWmsWaveOverview(warehouseId?: string) {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'waves', warehouseId ?? 'all'],
    queryFn: () => wmsDashboardApi.getWaves(warehouseId),
    staleTime: STALE_TIME,
  });
}

// Inventory #7 / F7 (Owner-approved) — Wave detail drawer's shipment
// breakdown. Query key includes the wave id so switching between two waves
// never serves the wrong record; `enabled` lets the drawer own when the
// fetch fires (only while open).
export function useWaveShipmentSummary(waveId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'wave-shipment-summary', waveId],
    queryFn: () => wmsDashboardApi.getWaveShipmentSummary(waveId as string),
    enabled: enabled && !!waveId,
  });
}

export function useWmsShipmentOverview(warehouseId?: string) {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'shipments', warehouseId ?? 'all'],
    queryFn: () => wmsDashboardApi.getShipments(warehouseId),
    staleTime: STALE_TIME,
  });
}

export function useWmsExceptionOverview(
  warehouseId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery({
    queryKey: [
      'wms',
      'dashboard',
      'exceptions',
      warehouseId ?? 'all',
      dateFrom ?? '',
      dateTo ?? '',
    ],
    queryFn: () => wmsDashboardApi.getExceptions(warehouseId, dateFrom, dateTo),
    staleTime: STALE_TIME,
  });
}

export function useWmsReservationOverview(warehouseId?: string) {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'reservations', warehouseId ?? 'all'],
    queryFn: () => wmsDashboardApi.getReservations(warehouseId),
    staleTime: STALE_TIME,
  });
}
