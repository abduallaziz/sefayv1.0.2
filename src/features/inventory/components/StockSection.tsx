'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { useStockLevels, useWarehouses } from '../hooks/useInventory';
import { StockLevel } from '../types/inventory.types';
import { AdjustStockModal } from './AdjustStockModal';

export function StockSection() {
  const t = useTranslations('inventory');
  const currency = useTenantStore((s) => s.currency_symbol);
  const { data: stockLevels = [], isLoading } = useStockLevels();
  const { data: warehouses = [] } = useWarehouses();

  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockLevel | null>(null);

  const filtered = useMemo(() => {
    return stockLevels.filter((s) => {
      if (search && !s.item_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (warehouseId !== 'all' && s.warehouse_id !== warehouseId) return false;
      if (lowStockOnly && s.quantity > s.low_stock_threshold) return false;
      return true;
    });
  }, [stockLevels, search, warehouseId, lowStockOnly]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-3 flex-1">
          <input
            type="text"
            placeholder={t('stock.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] text-slate-800 dark:text-white placeholder-slate-400"
          />
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] text-slate-800 dark:text-white"
          >
            <option value="all">{t('stock.allWarehouses')}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer px-3 py-2">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 accent-[#0C447C]"
            />
            {t('stock.lowStockOnly')}
          </label>
        </div>
        <button
          onClick={() => { setEditingStock(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('stock.adjustStock')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">{t('movements.noMovements')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">{t('stock.noStock')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('stock.item')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('stock.warehouse')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('stock.quantity')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('stock.threshold')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('stock.costPrice')}</th>
                <th className="text-start px-3 py-3 font-medium text-slate-500">{t('stock.status')}</th>
                <th className="px-3 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filtered.map((s) => {
                const isLow = s.quantity <= s.low_stock_threshold && s.quantity > 0;
                const isOut = s.quantity <= 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">
                      {s.item_name}{s.variant_name ? ` — ${s.variant_name}` : ''}
                    </td>
                    <td className="px-3 py-3 text-slate-500">{s.warehouse_name}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800 dark:text-white tabular-nums">{s.quantity}</td>
                    <td className="px-3 py-3 text-slate-500 tabular-nums">{s.low_stock_threshold}</td>
                    <td className="px-3 py-3 text-slate-500 tabular-nums">{s.cost_price.toLocaleString('en-US')} {currency}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isOut ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : isLow ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isOut ? t('stock.outOfStock') : isLow ? t('stock.lowStock') : t('stock.inStock')}
                      </span>
                    </td>
                    <td className="px-3 py-3 w-16">
                      <button
                        onClick={() => { setEditingStock(s); setModalOpen(true); }}
                        className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline"
                      >
                        {t('stock.adjustStock')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdjustStockModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingStock(null); }}
        prefill={editingStock}
      />
    </div>
  );
}
