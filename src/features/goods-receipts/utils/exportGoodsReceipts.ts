import { exportToCsv } from '@/shared/utils/exportCsv';
import { GoodsReceipt } from '../types/goods-receipt.types';

const COLUMNS: { key: keyof GoodsReceipt; label: string }[] = [
  { key: 'receipt_number', label: 'Receipt Number' },
  { key: 'purchase_order_number', label: 'Purchase Order' },
  { key: 'supplier_name', label: 'Supplier' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'items_count', label: 'Items Count' },
  { key: 'created_at', label: 'Created At' },
];

export function exportGoodsReceiptsToCsv(receipts: GoodsReceipt[], filename = 'goods-receipts.csv') {
  exportToCsv(receipts, COLUMNS, filename);
}
