'use client';

import { useTranslations } from 'next-intl';
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

  const typeColors: Record<string, string> = {
    product: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    service: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    custom: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">{t('noItems')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('name')}</th>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('type')}</th>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('category')}</th>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('price')}</th>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('variants')}</th>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('status')}</th>
            <th className="text-start px-4 py-3 font-medium text-muted-foreground">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                  {t(item.type)}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{item.category_name ?? '—'}</td>
              <td className="px-4 py-3 font-semibold">{item.price} {t('currency')}</td>
              <td className="px-4 py-3">
                {item.has_variants ? (
                  <button
                    onClick={() => onVariants(item)}
                    className="flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    <Layers className="w-3 h-3" />
                    {item.variants?.length ?? 0} {t('variants')}
                  </button>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(item)}
                  className={`flex items-center gap-1 text-xs font-medium ${
                    item.is_active ? 'text-green-600' : 'text-muted-foreground'
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
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"
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