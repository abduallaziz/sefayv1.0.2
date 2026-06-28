import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  AdjustStockDTO,
  SetThresholdDTO,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  CreatePurchaseOrderDTO,
} from '../types/inventory.types';

const INVENTORY_KEYS = {
  warehouses: ['inventory', 'warehouses'],
  stockLevels: ['inventory', 'stockLevels'],
  movements: ['inventory', 'movements'],
  suppliers: ['inventory', 'suppliers'],
  purchaseOrders: ['inventory', 'purchaseOrders'],
};

export function useWarehouses() {
  return useQuery({
    queryKey: INVENTORY_KEYS.warehouses,
    queryFn: () => inventoryApi.getWarehouses(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockLevels() {
  return useQuery({
    queryKey: INVENTORY_KEYS.stockLevels,
    queryFn: () => inventoryApi.getStockLevels(),
    staleTime: 30 * 1000,
  });
}

export function useMovements() {
  return useQuery({
    queryKey: INVENTORY_KEYS.movements,
    queryFn: () => inventoryApi.getMovements(),
    staleTime: 30 * 1000,
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: INVENTORY_KEYS.suppliers,
    queryFn: () => inventoryApi.getSuppliers(),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: INVENTORY_KEYS.purchaseOrders,
    queryFn: () => inventoryApi.getPurchaseOrders(),
    staleTime: 30 * 1000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWarehouseDTO) => inventoryApi.createWarehouse(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.warehouses }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseDTO }) => inventoryApi.updateWarehouse(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.warehouses }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdjustStockDTO) => inventoryApi.adjustStock(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.stockLevels });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
    },
  });
}

export function useSetThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetThresholdDTO) => inventoryApi.setThreshold(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.stockLevels }),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierDTO) => inventoryApi.createSupplier(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.suppliers }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDTO }) => inventoryApi.updateSupplier(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.suppliers }),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderDTO) => inventoryApi.createPurchaseOrder(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.purchaseOrders }),
  });
}

export function useMarkPurchaseOrderOrdered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.markPurchaseOrderOrdered(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.purchaseOrders }),
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.cancelPurchaseOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEYS.purchaseOrders }),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.receivePurchaseOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.purchaseOrders });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.stockLevels });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
    },
  });
}
