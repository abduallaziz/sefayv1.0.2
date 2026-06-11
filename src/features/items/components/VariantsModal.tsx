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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#1e2130]">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('variants')}</h2>
            <p className="text-sm text-slate-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {(item.variants ?? []).map((v: ItemVariant) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e2130] bg-[#141720]">
                <div>
                  <p className="font-medium text-sm text-white">{v.name}</p>
                  <p className="text-xs text-slate-500">
                    {v.price_adjustment > 0 ? `+${v.price_adjustment}` : v.price_adjustment} {t('currency')} • {v.sku}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteVariant(item.id, v.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(item.variants ?? []).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">{t('noVariants')}</p>
            )}
          </div>

          <div className="border-t border-[#1e2130] pt-4">
            <p className="text-sm font-medium text-white mb-3">{t('addVariant')}</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder={t('variantName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-600"
              />
              <input
                placeholder={t('sku')}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-600"
              />
              <input
                type="number"
                placeholder={t('priceAdjustment')}
                value={form.price_adjustment}
                onChange={(e) => setForm({ ...form, price_adjustment: Number(e.target.value) })}
                className="px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder={t('stock')}
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                className="px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleAdd}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
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