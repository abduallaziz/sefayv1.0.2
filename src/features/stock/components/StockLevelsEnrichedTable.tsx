'use client';

import { useTranslations } from 'next-intl';
import { StockLevelEnriched } from '../types/stock.types';

interface Props {
  levels: StockLevelEnriched[];
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function StatusBadge({ status }: { status: StockLevelEnriched['status'] }) {
  const t = useTranslations('stock');
  const classes =
    status === 'out_of_stock'
      ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
      : status === 'low_stock'
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400';
  const label =
    status === 'out_of_stock' ? t('statusOutOfStock') : status === 'low_stock' ? t('statusLowStock') : t('statusInStock');
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${classes}`}>{label}</span>;
}

export function StockLevelsEnrichedTable({ levels }: Props) {
  const t = useTranslations('stock');

  if (levels.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noStockLevels')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {levels.map((level) => (
          <div
            key={level.stock_level_id}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">
                  {level.item_name}
                  {level.variant_name && <span className="text-slate-400 text-xs ms-1">({level.variant_name})</span>}
                </p>
                <p className="text-xs text-slate-500 truncate">{level.item_sku} · {level.warehouse_name}</p>
              </div>
              <StatusBadge status={level.status} />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>{t('quantityOnHand')}: {level.quantity_on_hand}</span>
              <span>{t('available')}: {level.quantity_available}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('sku')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('variant')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('location')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('batch')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('quantityOnHand')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('reserved')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('available')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('incoming')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('reorderPoint')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('status')}</th>
              <th className="text-end px-3 py-3 font-medium text-slate-500">{t('inventoryValue')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('lastMovement')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {levels.map((level) => (
              <tr key={level.stock_level_id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-3 py-3 text-slate-800 dark:text-white max-w-[160px] truncate">{level.item_name}</td>
                <td className="px-3 py-3 text-slate-500">{level.item_sku}</td>
                <td className="px-3 py-3 text-slate-500">{level.variant_name ?? '-'}</td>
                <td className="px-3 py-3 text-slate-500">{level.warehouse_name}</td>
                <td className="px-3 py-3 text-slate-500">{level.location_name ?? '-'}</td>
                <td className="px-3 py-3 text-slate-500">{level.batch_number ?? '-'}</td>
                <td className="px-3 py-3 text-end font-medium text-slate-800 dark:text-white">{level.quantity_on_hand}</td>
                <td className="px-3 py-3 text-end text-slate-500">{level.quantity_reserved}</td>
                <td className="px-3 py-3 text-end text-slate-500">{level.quantity_available}</td>
                <td className="px-3 py-3 text-end text-slate-500">{level.quantity_incoming}</td>
                <td className="px-3 py-3 text-end text-slate-500">{level.reorder_min ?? '-'}</td>
                <td className="px-3 py-3"><StatusBadge status={level.status} /></td>
                <td className="px-3 py-3 text-end text-slate-500">{level.inventory_value.toLocaleString()}</td>
                <td className="px-3 py-3 text-slate-500">{formatDate(level.last_movement_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
