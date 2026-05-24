'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Trash2 } from 'lucide-react';
import { Item, ItemVariant } from '../types/item.types';

interface Props {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  onAddVariant: (itemId: string, data: { name: string; price_adjustment: number; sku: string; stock_quantity: number }) => void;
  onDeleteVariant: (itemId: string, variantId: string) => void;
}

export function VariantsModal({ open, onClose, item, onAddVariant, onDeleteVariant }: Props) {
  const t = useTranslations('items');
  const [form, setForm] = useState({ name: '', price_adjustment: 0, sku: '', stock_quantity: 0 });

  if (!open || !item) return null;

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAddVariant(item.id, form);
    setForm({ name: '', price_adjustment: 0, sku: '', stock_quantity: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{t('variants')}</h2>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Existing Variants */}
          <div className="space-y-2">
            {(item.variants ?? []).map((v: ItemVariant) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.price_adjustment > 0 ? `+${v.price_adjustment}` : v.price_adjustment} {t('currency')} • {v.sku}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteVariant(item.id, v.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(item.variants ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noVariants')}</p>
            )}
          </div>

          {/* Add New Variant */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium mb-3">{t('addVariant')}</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder={t('variantName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder={t('sku')}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder={t('priceAdjustment')}
                value={form.price_adjustment}
                onChange={(e) => setForm({ ...form, price_adjustment: Number(e.target.value) })}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder={t('stock')}
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleAdd}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              {t('addVariant')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}