'use client';

import { useTranslations } from 'next-intl';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { Edit, Trash2, Layers, ToggleLeft, ToggleRight, Barcode } from 'lucide-react';
import { Item } from '../types/item.types';

interface Props {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onVariants: (item: Item) => void;
  onBarcodes: (item: Item) => void;
  onToggleActive: (item: Item) => void;
}

export function ItemsTable({ items, onEdit, onDelete, onVariants, onBarcodes, onToggleActive }: Props) {
  const t = useTranslations('items');
  const currency = useCurrencyDisplay();

  const typeColors: Record<string, string> = {
    product: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary',
    service: 'bg-posCloud-info-light dark:bg-posCloud-info/15 text-posCloud-info',
    custom: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
    raw_material: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
    semi_finished: 'bg-posCloud-info-light dark:bg-posCloud-info/15 text-posCloud-info',
    finished_goods: 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success',
    asset: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
    consumable: 'bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary',
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
        <p className="text-lg">{t('noItems')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                    {t(item.type)}
                  </span>
                  {item.category_name && (
                    <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{item.category_name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onBarcodes(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors">
                  <Barcode className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-danger transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-posCloud-border dark:border-posCloudDark-border">
              <span className="font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums">
                {item.price.toLocaleString('en-US')} {currency}
              </span>
              <div className="flex items-center gap-3">
                {item.has_variants && (
                  <button onClick={() => onVariants(item)} className="flex items-center gap-1 text-posCloud-primary hover:underline text-xs">
                    <Layers className="w-3 h-3" />
                    {(item as any).variants_count ?? 0}
                  </button>
                )}
                <button
                  onClick={() => onToggleActive(item)}
                  className={`flex items-center gap-1 text-xs font-medium ${
                    item.is_active ? 'text-posCloud-success' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
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
      <div className="hidden md:block overflow-x-auto rounded-xl border border-posCloud-border dark:border-posCloudDark-border">
        <table className="w-full text-sm">
          <thead className="bg-posCloud-background dark:bg-posCloudDark-background border-b border-posCloud-border dark:border-posCloudDark-border">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('name')}</th>
              <th className="text-start px-3 py-3 font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('type')}</th>
              <th className="text-start px-3 py-3 font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('category')}</th>
              <th className="text-start px-3 py-3 font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary w-24">{t('price')}</th>
              <th className="text-start px-3 py-3 font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('variants')}</th>
              <th className="text-start px-3 py-3 font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary w-20">{t('status')}</th>
              <th className="px-3 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-posCloud-border dark:divide-posCloudDark-border">
            {items.map((item, i) => (
              <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${i % 2 === 1 ? 'bg-posCloud-background/40 dark:bg-white/[0.02]' : ''}`}>
                <td className="px-3 py-3 font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary max-w-[160px] truncate">
                  {item.name}
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                    {t(item.type)}
                  </span>
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary max-w-[140px] truncate">
                  {item.category_name ?? '—'}
                </td>
                <td className="px-3 py-3 font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary w-24 tabular-nums">
                  {item.price.toLocaleString('en-US')} {currency}
                </td>
                <td className="px-3 py-3">
                  {item.has_variants ? (
                    <button
                      onClick={() => onVariants(item)}
                      className="flex items-center gap-1 text-posCloud-primary hover:underline text-xs"
                    >
                      <Layers className="w-3 h-3" />
                      {(item as any).variants_count ?? 0} {t('variants')}
                    </button>
                  ) : (
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3 w-20">
                  <button
                    onClick={() => onToggleActive(item)}
                    className={`flex items-center gap-1 text-xs font-medium ${
                      item.is_active ? 'text-posCloud-success' : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
                    }`}
                  >
                    {item.is_active
                      ? <><ToggleRight className="w-4 h-4" /><span>{t('active')}</span></>
                      : <><ToggleLeft className="w-4 h-4" /><span>{t('inactive')}</span></>
                    }
                  </button>
                </td>
                <td className="px-3 py-3 w-24">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onBarcodes(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors"
                      title={t('barcodes')}
                    >
                      <Barcode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded-lg hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-danger transition-colors"
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