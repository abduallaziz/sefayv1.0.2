import { useQuery, useQueries, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { wmsApi } from '../api/wms.api';
import { PickList, PickListsQuery, ShipmentsQuery, CreateZoneSplitPickListsRequest, WavesQuery, CreateWaveRequest, WarehouseTasksQuery, CreateWarehouseTaskRequest } from '../types/wms.types';

const staleTime = 30 * 1000;

export function useShipments(status?: string) {
  return useQuery({ queryKey: ['wms', 'shipments', status ?? 'all'], queryFn: () => wmsApi.getShipments(status), staleTime });
}
export function usePickLists(status?: string) {
  return useQuery({ queryKey: ['wms', 'pick-lists', status ?? 'all'], queryFn: () => wmsApi.getPickLists(status), staleTime });
}
// Inventory #7 / F7 (Owner-approved) — server-paginated waves list, same
// keepPreviousData pattern as usePagedPickLists.
export function usePagedWaves(query: WavesQuery) {
  return useQuery({
    queryKey: ['wms', 'waves', 'paged', query],
    queryFn: () => wmsApi.getWavesPaged(query),
    placeholderData: keepPreviousData,
  });
}
// Wave Detail Drawer data source. Query key includes the id so switching
// between two waves never serves the wrong record; `enabled` lets the
// drawer own when the fetch fires (only while open).
export function useWaveDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'waves', id],
    queryFn: () => wmsApi.getWaveById(id as string),
    enabled: enabled && !!id,
  });
}
// Inventory #7 / F10 (Owner-approved) — same request -> server
// confirmation -> targeted invalidation shape as useCreateZoneSplitPickLists.
// Only the 'planning'-scoped list/paged key needs invalidating (a brand
// new wave never has a detail-drawer or dashboard-summary query mounted
// yet), so this deliberately does NOT touch the wider ['wms','dashboard',...]
// keys the other wave mutations invalidate.
export function useCreateWave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWaveRequest) => wmsApi.createWave(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'waves', 'paged'] });
    },
  });
}
export function useWaveHistory(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'waves', id, 'history'],
    queryFn: () => wmsApi.getWaveHistory(id as string),
    enabled: enabled && !!id,
  });
}
// Inventory #8 / F8 (Owner-approved) — same request -> server confirmation
// -> targeted invalidation shape as useAssignPickList/useCancelPickList:
// invalidating ['wms','waves',id] alone already covers
// ['wms','waves',id,'history'] via TanStack's prefix matching, so history
// is never invalidated a second time separately. The per-wave shipment
// breakdown card lives under a *different* top-level key
// (['wms','dashboard','wave-shipment-summary',id], see
// useWaveShipmentSummary in useWmsDashboard.ts) since it's sourced from
// the 7-8 dashboard aggregate RPC, not the waves list/detail endpoint —
// found and fixed during F8 browser validation: without this explicit
// third invalidation the eligible/excluded counts kept showing the
// pre-evaluate value (0) after a real evaluate/release, since
// ['wms','waves',id]'s prefix match never reaches a sibling
// ['wms','dashboard',...] key. Never a blanket ['wms'] invalidation.
export function useEvaluateWave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wmsApi.evaluateWave(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['wms', 'waves', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'waves', 'paged'] });
      qc.invalidateQueries({ queryKey: ['wms', 'dashboard', 'wave-shipment-summary', id] });
    },
  });
}
export function useReleaseWave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority?: 'low' | 'medium' | 'high' | 'urgent' }) => wmsApi.releaseWave(id, priority),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['wms', 'waves', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'waves', 'paged'] });
      qc.invalidateQueries({ queryKey: ['wms', 'dashboard', 'wave-shipment-summary', id] });
      // A real pick list now exists — the F2 picking list must reflect it.
      qc.invalidateQueries({ queryKey: ['wms', 'pick-lists', 'paged'] });
    },
  });
}
export function useCancelWave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => wmsApi.cancelWave(id, reason),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['wms', 'waves', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'waves', 'paged'] });
      qc.invalidateQueries({ queryKey: ['wms', 'dashboard', 'wave-shipment-summary', id] });
    },
  });
}
// Inventory #7 / F2 (Owner-approved) — server-paginated pick lists list.
// `placeholderData: keepPreviousData` mirrors usePagedCustomers: keeps the
// current page on screen while the next page/filter/sort settles instead of
// flashing an empty table.
export function usePagedPickLists(query: PickListsQuery) {
  return useQuery({
    queryKey: ['wms', 'pick-lists', 'paged', query],
    queryFn: () => wmsApi.getPickListsPaged(query),
    placeholderData: keepPreviousData,
  });
}
// Inventory #7 / F3 (Owner-approved) — Pick List Detail Drawer data source.
// Query key includes the id so switching between two pick lists (or
// reopening the same one) never serves the wrong record; `enabled` lets the
// drawer own when the fetch actually fires (only while open).
export function usePickListDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'pick-lists', id],
    queryFn: () => wmsApi.getPickListById(id as string),
    enabled: enabled && !!id,
  });
}
export function usePickListHistory(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'pick-lists', id, 'history'],
    queryFn: () => wmsApi.getPickListHistory(id as string),
    enabled: enabled && !!id,
  });
}
// Bounded by this ONE pick list's own real shipment ids (pickList.shipments,
// typically 1, rarely more than a handful) — not a list-wide N+1 and not an
// unbounded warehouse-wide shipments fetch. No batch-by-ids endpoint exists
// on /shipments, so this is the minimum real data actually required.
export function usePickListShipments(pickList: PickList | undefined, enabled: boolean) {
  const ids = (pickList?.shipments ?? []).map((s) => s.shipment_id);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['wms', 'shipments', id],
      queryFn: () => wmsApi.getShipmentById(id),
      enabled: enabled && !!pickList,
    })),
  });
}
// Inventory #7 / F4 (Owner-approved) — request -> server confirmation ->
// targeted invalidation, no optimistic assignee (assignment is gated by
// real backend status rules the client can't safely predict). Invalidates
// exactly: this pick list's detail (new assigned_to), its history (the RPC
// writes a real assign/reassign entry), and the F2 paged list (assignment
// column) — never a blanket ['wms'] invalidation.
export function useAssignPickList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => wmsApi.assignPickList(id, assignedTo),
    onSuccess: (_data, { id }) => {
      // TanStack Query's invalidateQueries matches by key *prefix*, so
      // invalidating ['wms','pick-lists', id] alone already covers
      // ['wms','pick-lists', id, 'history'] too — invalidating both
      // separately (as an earlier version of this did) double-fires the
      // history refetch. Two calls, not three.
      qc.invalidateQueries({ queryKey: ['wms', 'pick-lists', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'pick-lists', 'paged'] });
    },
  });
}
// Inventory #7 / F5 (Owner-approved) — same request -> server confirmation
// -> targeted invalidation shape as useAssignPickList, and the same fix for
// the F4 duplicate-history-request bug: invalidate the detail key ONLY
// (its prefix already covers the history query key beneath it) plus the
// F2 paged list, never a blanket ['wms'] invalidation.
export function useCancelPickList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => wmsApi.cancelPickList(id, reason),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['wms', 'pick-lists', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'pick-lists', 'paged'] });
    },
  });
}
// Inventory #7 / F6 (Owner-approved) — server-paginated shipments, same
// keepPreviousData shape as usePagedPickLists. Used by the zone-split
// shipment-selection panel — never fetches a warehouse's full shipment list.
export function usePagedShipments(query: ShipmentsQuery, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'shipments', 'paged', query],
    queryFn: () => wmsApi.getShipmentsPaged(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}
// Inventory #7 / F6 (Owner-approved) — request -> real backend automatic
// multi-zone split -> targeted invalidation. Invalidates the F2 paged
// pick-lists list (new zone pick lists appear there) and the shipments
// queries (their status moved pending -> picking) — never a blanket
// ['wms'] invalidation.
export function useCreateZoneSplitPickLists() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneSplitPickListsRequest) => wmsApi.createZoneSplitPickLists(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'pick-lists', 'paged'] });
      qc.invalidateQueries({ queryKey: ['wms', 'shipments'] });
    },
  });
}
export function usePutawayRules() {
  return useQuery({ queryKey: ['wms', 'putaway-rules'], queryFn: wmsApi.getPutawayRules, staleTime });
}
export function useReplenishmentRules() {
  return useQuery({ queryKey: ['wms', 'replenishment-rules'], queryFn: wmsApi.getReplenishmentRules, staleTime });
}
// Inventory #7 / F11 (Owner-approved) — supersedes the old unbounded
// useWarehouseTasks(taskType, status) (removed below), same precedent as
// F2/F7 superseding their own prior ad-hoc list views.
export function usePagedWarehouseTasks(query: WarehouseTasksQuery) {
  return useQuery({
    queryKey: ['wms', 'tasks', 'paged', query],
    queryFn: () => wmsApi.getWarehouseTasksPaged(query),
    placeholderData: keepPreviousData,
  });
}
export function useWarehouseTaskDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'tasks', id],
    queryFn: () => wmsApi.getWarehouseTaskById(id as string),
    enabled: enabled && !!id,
  });
}
export function useWarehouseTaskHistory(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['wms', 'tasks', id, 'history'],
    queryFn: () => wmsApi.getWarehouseTaskHistory(id as string),
    enabled: enabled && !!id,
  });
}

function invalidateWms(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['wms'] });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => wmsApi.createShipment(body), onSuccess: () => invalidateWms(qc) });
}
export function useCancelShipment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => wmsApi.cancelShipment(id), onSuccess: () => invalidateWms(qc) });
}
export function useShipShipment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, trackingNumber }: { id: string; trackingNumber?: string }) => wmsApi.shipShipment(id, trackingNumber), onSuccess: () => invalidateWms(qc) });
}
export function useConfirmPack() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) => wmsApi.confirmPack(lineId, quantity), onSuccess: () => invalidateWms(qc) });
}
export function useCreatePickList() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: wmsApi.createPickList, onSuccess: () => invalidateWms(qc) });
}
export function useConfirmPick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, quantity, batchId }: { lineId: string; quantity: number; batchId?: string }) => wmsApi.confirmPick(lineId, quantity, batchId),
    onSuccess: () => invalidateWms(qc),
  });
}
export function useCreatePutawayRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => wmsApi.createPutawayRule(body), onSuccess: () => invalidateWms(qc) });
}
export function useCreateReplenishmentRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => wmsApi.createReplenishmentRule(body), onSuccess: () => invalidateWms(qc) });
}
export function useRunReplenishmentCheck() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (warehouseId: string) => wmsApi.runReplenishmentCheck(warehouseId), onSuccess: () => invalidateWms(qc) });
}
// Inventory #7 / F11 (Owner-approved) — narrow, explicit invalidation
// (['wms','tasks',id] + ['wms','tasks','paged']) instead of the old
// blanket invalidateWms(['wms']) these three previously used — same
// targeted-invalidation fix already established for waves (F8's
// stale-cache bug) and pick lists.
export function useCreateWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWarehouseTaskRequest) => wmsApi.createWarehouseTask(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', 'paged'] });
    },
  });
}
export function useAssignWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => wmsApi.assignWarehouseTask(id, assignedTo),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', 'paged'] });
    },
  });
}
export function useConfirmWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity, locationId }: { id: string; quantity: number; locationId: string }) => wmsApi.confirmWarehouseTask(id, quantity, locationId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', 'paged'] });
    },
  });
}
export function useCancelWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wmsApi.cancelWarehouseTask(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', id] });
      qc.invalidateQueries({ queryKey: ['wms', 'tasks', 'paged'] });
    },
  });
}
