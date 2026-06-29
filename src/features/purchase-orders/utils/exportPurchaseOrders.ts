import { exportToCsv } from '@/shared/utils/exportCsv';
import { PurchaseOrder } from '../types/purchase-order.types';

const COLUMNS: { key: keyof PurchaseOrder; label: string }[] = [
  { key: 'order_number', label: 'Order Number' },
  { key: 'supplier_name', label: 'Supplier' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'order_date', label: 'Order Date' },
  { key: 'expected_date', label: 'Expected Date' },
  { key: 'quantity_ordered', label: 'Quantity Ordered' },
  { key: 'quantity_received', label: 'Quantity Received' },
  { key: 'total_value', label: 'Total Value' },
  { key: 'created_at', label: 'Created At' },
];

export function exportPurchaseOrdersToCsv(orders: PurchaseOrder[], filename = 'purchase-orders.csv') {
  exportToCsv(orders, COLUMNS, filename);
}
