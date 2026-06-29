import { exportToCsv } from '@/shared/utils/exportCsv';
import { StockCount } from '../types/stock-count.types';

const COLUMNS: { key: keyof StockCount; label: string }[] = [
  { key: 'count_number', label: 'Count Number' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'items_count', label: 'Items Count' },
  { key: 'items_counted', label: 'Items Counted' },
  { key: 'items_with_variance', label: 'Items With Variance' },
  { key: 'net_variance_quantity', label: 'Net Variance' },
  { key: 'started_at', label: 'Started At' },
  { key: 'completed_at', label: 'Completed At' },
  { key: 'created_at', label: 'Created At' },
];

export function exportStockCountsToCsv(counts: StockCount[], filename = 'stock-counts.csv') {
  exportToCsv(counts, COLUMNS, filename);
}
