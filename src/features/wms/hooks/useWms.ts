import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wmsApi } from '../api/wms.api';

const staleTime = 30 * 1000;

export function useShipments(status?: string) {
  return useQuery({ queryKey: ['wms', 'shipments', status ?? 'all'], queryFn: () => wmsApi.getShipments(status), staleTime });
}
export function usePickLists(status?: string) {
  return useQuery({ queryKey: ['wms', 'pick-lists', status ?? 'all'], queryFn: () => wmsApi.getPickLists(status), staleTime });
}
export function usePutawayRules() {
  return useQuery({ queryKey: ['wms', 'putaway-rules'], queryFn: wmsApi.getPutawayRules, staleTime });
}
export function useReplenishmentRules() {
  return useQuery({ queryKey: ['wms', 'replenishment-rules'], queryFn: wmsApi.getReplenishmentRules, staleTime });
}
export function useWarehouseTasks(taskType?: string, status?: string) {
  return useQuery({ queryKey: ['wms', 'tasks', taskType ?? 'all', status ?? 'all'], queryFn: () => wmsApi.getWarehouseTasks(taskType, status), staleTime });
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
export function useAssignWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => wmsApi.assignWarehouseTask(id, assignedTo), onSuccess: () => invalidateWms(qc) });
}
export function useConfirmWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity, locationId }: { id: string; quantity: number; locationId: string }) => wmsApi.confirmWarehouseTask(id, quantity, locationId),
    onSuccess: () => invalidateWms(qc),
  });
}
export function useCancelWarehouseTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => wmsApi.cancelWarehouseTask(id), onSuccess: () => invalidateWms(qc) });
}
