import { exportToCsv } from '@/shared/utils/exportCsv';
import { StockAdjustment } from '../types/adjustment.types';

interface AdjustmentExportRow {
  warehouse_name: string;
  item_name: string;
  item_sku: string;
  quantity_delta: number;
  reason: string;
  status: string;
  requested_by_name: string;
  approved_by_name: string;
  created_at: string;
}

const COLUMNS: { key: keyof AdjustmentExportRow; label: string }[] = [
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'item_name', label: 'Item' },
  { key: 'item_sku', label: 'SKU' },
  { key: 'quantity_delta', label: 'Quantity Delta' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'requested_by_name', label: 'Requested By' },
  { key: 'approved_by_name', label: 'Approved By' },
  { key: 'created_at', label: 'Created At' },
];

export function exportAdjustmentsToCsv(adjustments: StockAdjustment[], filename = 'adjustments.csv') {
  const rows: AdjustmentExportRow[] = adjustments.map((a) => ({
    warehouse_name: a.warehouses?.name ?? '',
    item_name: a.items?.name ?? '',
    item_sku: a.items?.sku ?? '',
    quantity_delta: a.quantity_delta,
    reason: a.reason,
    status: a.status,
    requested_by_name: a.requested_by_user?.name ?? '',
    approved_by_name: a.approved_by_user?.name ?? '',
    created_at: a.created_at,
  }));
  exportToCsv(rows, COLUMNS, filename);
}
