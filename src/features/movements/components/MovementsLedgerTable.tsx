'use client';

import { useTranslations } from 'next-intl';
import { MovementLedgerRow } from '../types/movements.types';

interface Props {
  rows: MovementLedgerRow[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function MovementsLedgerTable({ rows }: Props) {
  const t = useTranslations('movements');

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noMovements')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0">
          <tr>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('date')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movementType')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('reference')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('product')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('location')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('batch')}</th>
            <th className="text-end px-3 py-3 font-medium text-slate-500">{t('quantity')}</th>
            <th className="text-end px-3 py-3 font-medium text-slate-500">{t('unitCost')}</th>
            <th className="text-end px-3 py-3 font-medium text-slate-500">{t('runningBalance')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('performedBy')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={row.id} className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}>
              <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatDate(row.occurred_at)}</td>
              <td className="px-3 py-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    row.direction === 'in'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                  }`}
                >
                  {t(`type.${row.movement_type}`)}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-500">{row.reference_type}</td>
              <td className="px-3 py-3 text-slate-800 dark:text-white max-w-[160px] truncate">
                {row.item_name}{row.variant_name ? ` / ${row.variant_name}` : ''}
                <span className="text-slate-400 text-xs ms-1">{row.item_sku}</span>
              </td>
              <td className="px-3 py-3 text-slate-500">{row.warehouse_name}</td>
              <td className="px-3 py-3 text-slate-500">{row.location_name ?? '-'}</td>
              <td className="px-3 py-3 text-slate-500">{row.batch_number ?? '-'}</td>
              <td className={`px-3 py-3 text-end font-medium ${row.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                {row.direction === 'in' ? '+' : '-'}{row.quantity}
              </td>
              <td className="px-3 py-3 text-end text-slate-500">{row.unit_cost}</td>
              <td className="px-3 py-3 text-end font-semibold text-slate-800 dark:text-white">{row.running_balance}</td>
              <td className="px-3 py-3 text-slate-500">{row.performed_by ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
