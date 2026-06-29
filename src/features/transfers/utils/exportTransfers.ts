import { exportToCsv } from '@/shared/utils/exportCsv';
import { Transfer } from '../types/transfer.types';

const COLUMNS: { key: keyof Transfer; label: string }[] = [
  { key: 'transfer_number', label: 'Transfer Number' },
  { key: 'from_warehouse_name', label: 'From Warehouse' },
  { key: 'to_warehouse_name', label: 'To Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'items_count', label: 'Items Count' },
  { key: 'dispatched_at', label: 'Dispatched At' },
  { key: 'received_at', label: 'Received At' },
  { key: 'created_at', label: 'Created At' },
];

export function exportTransfersToCsv(transfers: Transfer[], filename = 'transfers.csv') {
  exportToCsv(transfers, COLUMNS, filename);
}
