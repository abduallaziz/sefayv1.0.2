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
    product: 'bg-blue-500/10 text-blue-400',
    service: 'bg-violet-500/10 text-violet-400',
    custom: 'bg-amber-500/10 text-amber-400',
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('noItems')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1e2130]">
      <table className="w-full text-sm">
        <thead className="bg-white/5 border-b border-[#1e2130]">
          <tr>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('name')}</th>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('type')}</th>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('category')}</th>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('price')}</th>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('variants')}</th>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('status')}</th>
            <th className="text-start px-4 py-3 font-medium text-slate-500">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2130]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 font-medium text-white">{item.name}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                  {t(item.type)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">{item.category_name ?? '—'}</td>
              <td className="px-4 py-3 font-semibold text-white">{item.price.toLocaleString('en-US')} {currency}</td>
              <td className="px-4 py-3">
                {item.has_variants ? (
                  <button
                    onClick={() => onVariants(item)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <Layers className="w-3 h-3" />
                    {(item as any).variants_count ?? 0} {t('variants')}
                  </button>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(item)}
                  className={`flex items-center gap-1 text-xs font-medium ${
                    item.is_active ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {item.is_active
                    ? <><ToggleRight className="w-4 h-4" />{t('active')}</>
                    : <><ToggleLeft className="w-4 h-4" />{t('inactive')}</>
                  }
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}