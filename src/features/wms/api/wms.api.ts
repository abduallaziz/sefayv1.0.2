import { apiClient } from '@/lib/api';
import { Shipment, PickList, PutawayRule, ReplenishmentRule, WarehouseTask } from '../types/wms.types';

export const wmsApi = {
  // Shipments (packing/shipping)
  getShipments: (status?: string) => apiClient.get<Shipment[]>(`/inventory/wms/shipments${status ? `?status=${status}` : ''}`),
  createShipment: (body: Record<string, unknown>) => apiClient.post<Shipment>('/inventory/wms/shipments', body),
  cancelShipment: (id: string) => apiClient.post(`/inventory/wms/shipments/${id}/cancel`, {}),
  shipShipment: (id: string, trackingNumber?: string) => apiClient.post(`/inventory/wms/shipments/${id}/ship`, { tracking_number: trackingNumber }),
  confirmPack: (shipmentLineId: string, quantity: number) => apiClient.post(`/inventory/wms/shipment-lines/${shipmentLineId}/pack`, { quantity }),

  // Pick lists
  getPickLists: (status?: string) => apiClient.get<PickList[]>(`/inventory/wms/pick-lists${status ? `?status=${status}` : ''}`),
  createPickList: (body: { warehouse_id: string; shipment_ids: string[]; strategy: string; zone_location_id?: string }) =>
    apiClient.post<PickList>('/inventory/wms/pick-lists', body),
  confirmPick: (pickListLineId: string, quantity: number, batchId?: string) =>
    apiClient.post(`/inventory/wms/pick-list-lines/${pickListLineId}/pick`, { quantity, batch_id: batchId }),

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
  getWarehouseTasks: (taskType?: string, status?: string) => {
    const params = new URLSearchParams();
    if (taskType) params.set('task_type', taskType);
    if (status) params.set('status', status);
    const qs = params.toString();
    return apiClient.get<WarehouseTask[]>(`/inventory/warehouse-tasks${qs ? `?${qs}` : ''}`);
  },
  createWarehouseTask: (body: Record<string, unknown>) => apiClient.post<WarehouseTask>('/inventory/warehouse-tasks', body),
  assignWarehouseTask: (id: string, assignedTo: string) => apiClient.post(`/inventory/warehouse-tasks/${id}/assign`, { assigned_to: assignedTo }),
  confirmWarehouseTask: (id: string, quantity: number, confirmedLocationId: string) =>
    apiClient.post(`/inventory/warehouse-tasks/${id}/confirm`, { quantity, confirmed_location_id: confirmedLocationId }),
  cancelWarehouseTask: (id: string) => apiClient.post(`/inventory/warehouse-tasks/${id}/cancel`, {}),
};
