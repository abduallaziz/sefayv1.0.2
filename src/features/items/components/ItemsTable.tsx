'use client';

import { useTranslations } from 'next-intl';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { Edit, Trash2, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { Item } from '../types/item.types';

interface Props {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onVariants: (item: Item) => void;
  onToggleActive: (item: Item) => void;
}

export function ItemsTable({ items, onEdit, onDelete, onVariants, onToggleActive }: Props) {
  const t = useTranslations('items');
  const currency = useTenantStore((s) => s.currency_symbol);

  const typeColors: Record<string, string> = {
    product: 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]',
    service: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    custom: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noItems')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                    {t(item.type)}
                  </span>
                  {item.category_name && (
                    <span className="text-xs text-slate-500 truncate">{item.category_name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-gray-800">
              <span className="font-semibold text-slate-800 dark:text-white tabular-nums">
                {item.price.toLocaleString('en-US')} {currency}
              </span>
              <div className="flex items-center gap-3">
                {item.has_variants && (
                  <button onClick={() => onVariants(item)} className="flex items-center gap-1 text-[#0C447C] dark:text-[#5B9BD5] hover:underline text-xs">
                    <Layers className="w-3 h-3" />
                    {(item as any).variants_count ?? 0}
                  </button>
                )}
                <button
                  onClick={() => onToggleActive(item)}
                  className={`flex items-center gap-1 text-xs font-medium ${
                    item.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {item.is_active
                    ? <><ToggleRight className="w-4 h-4" />{t('active')}</>
                    : <><ToggleLeft className="w-4 h-4" />{t('inactive')}</>
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('name')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('type')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('category')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-24">{t('price')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('variants')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-20">{t('status')}</th>
              <th className="px-3 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white max-w-[160px] truncate">
                  {item.name}
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                    {t(item.type)}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-500 max-w-[140px] truncate">
                  {item.category_name ?? '—'}
                </td>
                <td className="px-3 py-3 font-semibold text-slate-800 dark:text-white w-24 tabular-nums">
                  {item.price.toLocaleString('en-US')} {currency}
                </td>
                <td className="px-3 py-3">
                  {item.has_variants ? (
                    <button
                      onClick={() => onVariants(item)}
                      className="flex items-center gap-1 text-[#0C447C] dark:text-[#5B9BD5] hover:underline text-xs"
                    >
                      <Layers className="w-3 h-3" />
                      {(item as any).variants_count ?? 0} {t('variants')}
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3 w-20">
                  <button
                    onClick={() => onToggleActive(item)}
                    className={`flex items-center gap-1 text-xs font-medium ${
                      item.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {item.is_active
                      ? <><ToggleRight className="w-4 h-4" /><span>{t('active')}</span></>
                      : <><ToggleLeft className="w-4 h-4" /><span>{t('inactive')}</span></>
                    }
                  </button>
                </td>
                <td className="px-3 py-3 w-16">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}