import { useInventoryStore } from '../store/inventory.store';
import {
  Warehouse,
  StockLevel,
  StockMovement,
  Supplier,
  PurchaseOrder,
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  AdjustStockDTO,
  SetThresholdDTO,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  CreatePurchaseOrderDTO,
} from '../types/inventory.types';

const simulateDelay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 150));

export const inventoryApi = {
  getWarehouses: (): Promise<Warehouse[]> => simulateDelay(useInventoryStore.getState().warehouses),

  createWarehouse: (dto: CreateWarehouseDTO): Promise<Warehouse> =>
    simulateDelay(useInventoryStore.getState().addWarehouse(dto)),

  updateWarehouse: (id: string, dto: UpdateWarehouseDTO): Promise<void> => {
    useInventoryStore.getState().updateWarehouse(id, dto);
    return simulateDelay(undefined);
  },

  getStockLevels: (): Promise<StockLevel[]> =>
    simulateDelay(Object.values(useInventoryStore.getState().stockLevels)),

  getMovements: (): Promise<StockMovement[]> => simulateDelay(useInventoryStore.getState().movements),

  adjustStock: (dto: AdjustStockDTO): Promise<{ stockLevel: StockLevel; movement: StockMovement }> =>
    simulateDelay(useInventoryStore.getState().adjustStock(dto)),

  setThreshold: (dto: SetThresholdDTO): Promise<void> => {
    useInventoryStore.getState().setThreshold(dto);
    return simulateDelay(undefined);
  },

  getSuppliers: (): Promise<Supplier[]> => simulateDelay(useInventoryStore.getState().suppliers),

  createSupplier: (dto: CreateSupplierDTO): Promise<Supplier> =>
    simulateDelay(useInventoryStore.getState().addSupplier(dto)),

  updateSupplier: (id: string, dto: UpdateSupplierDTO): Promise<void> => {
    useInventoryStore.getState().updateSupplier(id, dto);
    return simulateDelay(undefined);
  },

  getPurchaseOrders: (): Promise<PurchaseOrder[]> => simulateDelay(useInventoryStore.getState().purchaseOrders),

  createPurchaseOrder: (dto: CreatePurchaseOrderDTO): Promise<PurchaseOrder> =>
    simulateDelay(useInventoryStore.getState().createPurchaseOrder(dto)),

  markPurchaseOrderOrdered: (id: string): Promise<void> => {
    useInventoryStore.getState().markPurchaseOrderOrdered(id);
    return simulateDelay(undefined);
  },

  cancelPurchaseOrder: (id: string): Promise<void> => {
    useInventoryStore.getState().cancelPurchaseOrder(id);
    return simulateDelay(undefined);
  },

  receivePurchaseOrder: (id: string): Promise<void> => {
    useInventoryStore.getState().receivePurchaseOrder(id);
    return simulateDelay(undefined);
  },
};
