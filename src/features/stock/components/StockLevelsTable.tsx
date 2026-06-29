'use client';

import { useTranslations } from 'next-intl';
import { StockLevel } from '../types/stock.types';

interface Props {
  levels: StockLevel[];
}

export function StockLevelsTable({ levels }: Props) {
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
            key={level.id}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">
                  {level.items?.name ?? level.item_id}
                  {level.item_variants?.name && (
                    <span className="text-slate-400 text-xs ms-1">({level.item_variants.name})</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 truncate">{level.warehouses?.name ?? level.warehouse_id}</p>
              </div>
              <span className="font-bold text-slate-800 dark:text-white shrink-0">{level.quantity_on_hand}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{t('reserved')}: {level.quantity_reserved}</span>
              <span>{t('available')}: {level.quantity_on_hand - level.quantity_reserved}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('warehouse')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('quantityOnHand')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('reserved')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('available')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {levels.map((level) => (
              <tr key={level.id}>
                <td className="px-3 py-3 text-slate-800 dark:text-white">
                  {level.items?.name ?? level.item_id}
                  {level.item_variants?.name && (
                    <span className="text-slate-400 text-xs ms-1">({level.item_variants.name})</span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-500">{level.warehouses?.name ?? level.warehouse_id}</td>
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{level.quantity_on_hand}</td>
                <td className="px-3 py-3 text-slate-500">{level.quantity_reserved}</td>
                <td className="px-3 py-3 text-slate-500">{level.quantity_on_hand - level.quantity_reserved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
