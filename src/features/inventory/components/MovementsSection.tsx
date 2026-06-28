'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMovements, useWarehouses } from '../hooks/useInventory';
import { StockMovementType } from '../types/inventory.types';

const ALL_TYPES: StockMovementType[] = ['sale', 'purchase', 'adjustment', 'transfer_in', 'transfer_out', 'return'];

export function MovementsSection() {
  const t = useTranslations('inventory');
  const { data: movements = [], isLoading } = useMovements();
  const { data: warehouses = [] } = useWarehouses();

  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('all');
  const [type, setType] = useState<StockMovementType | 'all'>('all');

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (search && !m.item_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (warehouseId !== 'all' && m.warehouse_id !== warehouseId) return false;
      if (type !== 'all' && m.type !== type) return false;
      return true;
    });
  }, [movements, search, warehouseId, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t('movements.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] text-slate-800 dark:text-white placeholder-slate-400"
        />
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] text-slate-800 dark:text-white"
        >
          <option value="all">{t('movements.allWarehouses')}</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as StockMovementType | 'all')}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] text-slate-800 dark:text-white"
        >
          <option value="all">{t('movements.allTypes')}</option>
          {ALL_TYPES.map((mt) => (
            <option key={mt} value={mt}>{t(`movementType.${mt}`)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('movements.noMovements')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">{t('movements.noMovements')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.date')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.item')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.warehouse')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.type')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.change')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.after')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('movements.note')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{new Date(m.created_at).toLocaleString('en-US')}</td>
                  <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">
                    {m.item_name}{m.variant_name ? ` — ${m.variant_name}` : ''}
                  </td>
                  <td className="px-3 py-3 text-slate-500">{m.warehouse_name}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]">
                      {t(`movementType.${m.type}`)}
                    </span>
                  </td>
                  <td className={`px-3 py-3 font-semibold tabular-nums ${m.quantity_change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {m.quantity_change >= 0 ? '+' : ''}{m.quantity_change}
                  </td>
                  <td className="px-3 py-3 text-slate-800 dark:text-white tabular-nums">{m.quantity_after}</td>
                  <td className="px-3 py-3 text-slate-500 max-w-[200px] truncate">{m.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
