import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const genId = () => crypto.randomUUID();

const stockLevelKey = (itemId: string, variantId: string | null | undefined, warehouseId: string) =>
  `${itemId}__${variantId ?? ''}__${warehouseId}`;

interface InventoryState {
  warehouses: Warehouse[];
  stockLevels: Record<string, StockLevel>;
  movements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];

  addWarehouse: (dto: CreateWarehouseDTO) => Warehouse;
  updateWarehouse: (id: string, dto: UpdateWarehouseDTO) => void;

  getOrCreateStockLevel: (
    itemId: string,
    itemName: string,
    variantId: string | null | undefined,
    variantName: string | null | undefined,
    warehouseId: string
  ) => StockLevel;
  adjustStock: (dto: AdjustStockDTO) => { stockLevel: StockLevel; movement: StockMovement };
  setThreshold: (dto: SetThresholdDTO) => void;
  setCostPrice: (itemId: string, variantId: string | null | undefined, warehouseId: string, costPrice: number) => void;

  addSupplier: (dto: CreateSupplierDTO) => Supplier;
  updateSupplier: (id: string, dto: UpdateSupplierDTO) => void;

  createPurchaseOrder: (dto: CreatePurchaseOrderDTO) => PurchaseOrder;
  markPurchaseOrderOrdered: (id: string) => void;
  cancelPurchaseOrder: (id: string) => void;
  receivePurchaseOrder: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      warehouses: [
        { id: 'main', name: 'المستودع الرئيسي', is_default: true, is_active: true, created_at: new Date().toISOString() },
      ],
      stockLevels: {},
      movements: [],
      suppliers: [],
      purchaseOrders: [],

      addWarehouse: (dto) => {
        const warehouse: Warehouse = {
          id: genId(),
          name: dto.name,
          is_default: dto.is_default ?? false,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ warehouses: [...s.warehouses, warehouse] }));
        return warehouse;
      },

      updateWarehouse: (id, dto) => {
        set((s) => ({
          warehouses: s.warehouses.map((w) => (w.id === id ? { ...w, ...dto } : w)),
        }));
      },

      getOrCreateStockLevel: (itemId, itemName, variantId, variantName, warehouseId) => {
        const key = stockLevelKey(itemId, variantId, warehouseId);
        const existing = get().stockLevels[key];
        if (existing) return existing;

        const warehouse = get().warehouses.find((w) => w.id === warehouseId);
        const created: StockLevel = {
          id: key,
          item_id: itemId,
          item_name: itemName,
          variant_id: variantId ?? null,
          variant_name: variantName ?? null,
          warehouse_id: warehouseId,
          warehouse_name: warehouse?.name ?? '',
          quantity: 0,
          low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
          cost_price: 0,
          updated_at: new Date().toISOString(),
        };
        set((s) => ({ stockLevels: { ...s.stockLevels, [key]: created } }));
        return created;
      },

      adjustStock: (dto) => {
        const stockLevel = get().getOrCreateStockLevel(
          dto.item_id,
          dto.item_name,
          dto.variant_id,
          dto.variant_name,
          dto.warehouse_id
        );
        const key = stockLevelKey(dto.item_id, dto.variant_id, dto.warehouse_id);
        const quantityAfter = stockLevel.quantity + dto.quantity_change;
        const updatedLevel: StockLevel = {
          ...stockLevel,
          quantity: quantityAfter,
          updated_at: new Date().toISOString(),
        };

        const movement: StockMovement = {
          id: genId(),
          item_id: dto.item_id,
          item_name: dto.item_name,
          variant_id: dto.variant_id ?? null,
          variant_name: dto.variant_name ?? null,
          warehouse_id: dto.warehouse_id,
          warehouse_name: stockLevel.warehouse_name,
          type: dto.type,
          quantity_change: dto.quantity_change,
          quantity_after: quantityAfter,
          reference: dto.reference ?? null,
          note: dto.note ?? null,
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          stockLevels: { ...s.stockLevels, [key]: updatedLevel },
          movements: [movement, ...s.movements],
        }));

        return { stockLevel: updatedLevel, movement };
      },

      setThreshold: (dto) => {
        const stockLevel = get().getOrCreateStockLevel(
          dto.item_id,
          get().stockLevels[stockLevelKey(dto.item_id, dto.variant_id, dto.warehouse_id)]?.item_name ?? '',
          dto.variant_id,
          null,
          dto.warehouse_id
        );
        const key = stockLevelKey(dto.item_id, dto.variant_id, dto.warehouse_id);
        set((s) => ({
          stockLevels: {
            ...s.stockLevels,
            [key]: { ...stockLevel, low_stock_threshold: dto.low_stock_threshold },
          },
        }));
      },

      setCostPrice: (itemId, variantId, warehouseId, costPrice) => {
        const key = stockLevelKey(itemId, variantId, warehouseId);
        const stockLevel = get().stockLevels[key];
        if (!stockLevel) return;
        set((s) => ({
          stockLevels: { ...s.stockLevels, [key]: { ...stockLevel, cost_price: costPrice } },
        }));
      },

      addSupplier: (dto) => {
        const supplier: Supplier = {
          id: genId(),
          name: dto.name,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          address: dto.address ?? null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ suppliers: [...s.suppliers, supplier] }));
        return supplier;
      },

      updateSupplier: (id, dto) => {
        set((s) => ({
          suppliers: s.suppliers.map((sup) => (sup.id === id ? { ...sup, ...dto } : sup)),
        }));
      },

      createPurchaseOrder: (dto) => {
        const supplier = get().suppliers.find((s) => s.id === dto.supplier_id);
        const warehouse = get().warehouses.find((w) => w.id === dto.warehouse_id);
        const items = dto.items.map((i) => ({
          id: genId(),
          item_id: i.item_id,
          item_name: i.item_name,
          variant_id: i.variant_id ?? null,
          variant_name: i.variant_name ?? null,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
        }));
        const order: PurchaseOrder = {
          id: genId(),
          supplier_id: dto.supplier_id,
          supplier_name: supplier?.name ?? '',
          warehouse_id: dto.warehouse_id,
          warehouse_name: warehouse?.name ?? '',
          status: 'draft',
          items,
          total_cost: items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0),
          note: dto.note ?? null,
          created_at: new Date().toISOString(),
          received_at: null,
        };
        set((s) => ({ purchaseOrders: [order, ...s.purchaseOrders] }));
        return order;
      },

      markPurchaseOrderOrdered: (id) => {
        set((s) => ({
          purchaseOrders: s.purchaseOrders.map((po) => (po.id === id ? { ...po, status: 'ordered' } : po)),
        }));
      },

      cancelPurchaseOrder: (id) => {
        set((s) => ({
          purchaseOrders: s.purchaseOrders.map((po) => (po.id === id ? { ...po, status: 'cancelled' } : po)),
        }));
      },

      receivePurchaseOrder: (id) => {
        const order = get().purchaseOrders.find((po) => po.id === id);
        if (!order || order.status === 'received' || order.status === 'cancelled') return;

        for (const item of order.items) {
          get().adjustStock({
            item_id: item.item_id,
            item_name: item.item_name,
            variant_id: item.variant_id,
            variant_name: item.variant_name,
            warehouse_id: order.warehouse_id,
            quantity_change: item.quantity,
            type: 'purchase',
            reference: order.id,
            note: `Purchase order from ${order.supplier_name}`,
          });
          get().setCostPrice(item.item_id, item.variant_id, order.warehouse_id, item.unit_cost);
        }

        set((s) => ({
          purchaseOrders: s.purchaseOrders.map((po) =>
            po.id === id ? { ...po, status: 'received', received_at: new Date().toISOString() } : po
          ),
        }));
      },
    }),
    { name: 'sefay-inventory' }
  )
);
