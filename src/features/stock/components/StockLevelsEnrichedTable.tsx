'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { StockLevelEnriched } from '../types/stock.types';

interface Props {
  levels: StockLevelEnriched[];
}

interface ProductGroup {
  key: string;
  item_name: string;
  item_sku: string;
  variant_name: string | null;
  status: StockLevelEnriched['status'];
  totalOnHand: number;
  totalAvailable: number;
  totalReserved: number;
  totalValue: number;
  warehouseCount: number;
  rows: StockLevelEnriched[];
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function statusRank(status: StockLevelEnriched['status']) {
  return status === 'out_of_stock' ? 2 : status === 'low_stock' ? 1 : 0;
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
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${classes}`}>{label}</span>;
}

function groupLevels(levels: StockLevelEnriched[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const level of levels) {
    const key = `${level.item_id}:${level.variant_id ?? ''}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        item_name: level.item_name,
        item_sku: level.item_sku,
        variant_name: level.variant_name,
        status: level.status,
        totalOnHand: 0,
        totalAvailable: 0,
        totalReserved: 0,
        totalValue: 0,
        warehouseCount: 0,
        rows: [],
      };
      groups.set(key, group);
    }
    group.totalOnHand += level.quantity_on_hand;
    group.totalAvailable += level.quantity_available;
    group.totalReserved += level.quantity_reserved;
    group.totalValue += level.inventory_value;
    if (statusRank(level.status) > statusRank(group.status)) group.status = level.status;
    group.rows.push(level);
  }

  for (const group of groups.values()) {
    group.warehouseCount = new Set(group.rows.map((r) => r.warehouse_id)).size;
    group.rows.sort((a, b) => b.quantity_on_hand - a.quantity_on_hand);
  }

  return Array.from(groups.values()).sort((a, b) => a.item_name.localeCompare(b.item_name));
}

function locationLabel(level: StockLevelEnriched, t: ReturnType<typeof useTranslations>) {
  const code = level.location_code ?? null;
  const name = level.location_name ?? null;
  if (code && name) return `${code} - ${name}`;
  if (code) return code;
  if (name) return name;
  return t('noLocations');
}

export function StockLevelsEnrichedTable({ levels }: Props) {
  const t = useTranslations('stock');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupLevels(levels), [levels]);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noStockLevels')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = expanded.has(group.key);
        const singleLocation = group.rows.length === 1;

        return (
          <div
            key={group.key}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => !singleLocation && toggle(group.key)}
              disabled={singleLocation}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors disabled:cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                {!singleLocation && (
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">
                    {group.item_name}
                    {group.variant_name && <span className="text-slate-400 text-sm ms-1.5">({group.variant_name})</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {group.item_sku}
                    {group.warehouseCount > 1 && (
                      <span className="ms-1.5">· {group.warehouseCount} {t('warehouse').toLowerCase()}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                <div className="text-end hidden sm:block">
                  <p className="text-xs text-slate-500">{t('available')}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{group.totalAvailable}</p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-slate-500">{t('totalStock')}</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white">{group.totalOnHand}</p>
                </div>
                <StatusBadge status={group.status} />
              </div>
            </button>

            {(isOpen || singleLocation) && (
              <div className="border-t border-slate-100 dark:border-gray-800">
                {!singleLocation && (
                  <p className="px-4 pt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {t('locationsBreakdown')}
                  </p>
                )}

                {/* Mobile rows */}
                <div className="sm:hidden divide-y divide-slate-50 dark:divide-gray-800/60">
                  {group.rows.map((row) => (
                    <div key={row.stock_level_id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{locationLabel(row, t)}</p>
                        {group.warehouseCount > 1 && (
                          <p className="text-[11px] text-slate-400 truncate">{row.warehouse_name}</p>
                        )}
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{row.quantity_on_hand}</p>
                        <StatusBadge status={row.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/60 dark:bg-gray-800/30">
                      <tr>
                        <th className="text-start px-4 py-2 font-medium text-slate-500 text-xs">{t('location')}</th>
                        {group.warehouseCount > 1 && (
                          <th className="text-start px-4 py-2 font-medium text-slate-500 text-xs">{t('warehouse')}</th>
                        )}
                        <th className="text-start px-4 py-2 font-medium text-slate-500 text-xs">{t('batch')}</th>
                        <th className="text-end px-4 py-2 font-medium text-slate-500 text-xs">{t('quantityOnHand')}</th>
                        <th className="text-end px-4 py-2 font-medium text-slate-500 text-xs">{t('reserved')}</th>
                        <th className="text-end px-4 py-2 font-medium text-slate-500 text-xs">{t('available')}</th>
                        <th className="text-end px-4 py-2 font-medium text-slate-500 text-xs">{t('incoming')}</th>
                        <th className="text-start px-4 py-2 font-medium text-slate-500 text-xs">{t('status')}</th>
                        <th className="text-end px-4 py-2 font-medium text-slate-500 text-xs">{t('inventoryValue')}</th>
                        <th className="text-start px-4 py-2 font-medium text-slate-500 text-xs">{t('lastMovement')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-gray-800/60">
                      {group.rows.map((row, i) => (
                        <tr
                          key={row.stock_level_id}
                          className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}
                        >
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{locationLabel(row, t)}</td>
                          {group.warehouseCount > 1 && (
                            <td className="px-4 py-2.5 text-slate-500">{row.warehouse_name}</td>
                          )}
                          <td className="px-4 py-2.5 text-slate-500">{row.batch_number ?? '-'}</td>
                          <td className="px-4 py-2.5 text-end font-medium text-slate-800 dark:text-white">{row.quantity_on_hand}</td>
                          <td className="px-4 py-2.5 text-end text-slate-500">{row.quantity_reserved}</td>
                          <td className="px-4 py-2.5 text-end text-slate-500">{row.quantity_available}</td>
                          <td className="px-4 py-2.5 text-end text-slate-500">{row.quantity_incoming}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                          <td className="px-4 py-2.5 text-end text-slate-500">{row.inventory_value.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(row.last_movement_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
