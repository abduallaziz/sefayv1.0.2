import { StockLevelEnriched } from '../types/stock.types';

const COLUMNS: { key: keyof StockLevelEnriched; label: string }[] = [
  { key: 'item_name', label: 'Item' },
  { key: 'item_sku', label: 'SKU' },
  { key: 'variant_name', label: 'Variant' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'location_name', label: 'Location' },
  { key: 'batch_number', label: 'Batch' },
  { key: 'quantity_on_hand', label: 'On Hand' },
  { key: 'quantity_reserved', label: 'Reserved' },
  { key: 'quantity_available', label: 'Available' },
  { key: 'quantity_incoming', label: 'Incoming' },
  { key: 'reorder_min', label: 'Reorder Point' },
  { key: 'status', label: 'Status' },
  { key: 'inventory_value', label: 'Inventory Value' },
  { key: 'last_movement_at', label: 'Last Movement' },
];

function csvEscape(value: unknown) {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function exportStockLevelsToCsv(levels: StockLevelEnriched[], filename = 'stock-levels.csv') {
  const header = COLUMNS.map((c) => csvEscape(c.label)).join(',');
  const rows = levels.map((row) => COLUMNS.map((c) => csvEscape(row[c.key])).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
