'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Item, Category, ItemType, CreateItemDTO } from '../types/item.types';
import { Button } from '@/shared/ui/button';

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['product', 'service', 'custom', 'raw_material', 'semi_finished', 'finished_goods', 'asset', 'consumable']),
  operation_type: z.enum(['sell', 'book', 'repair', 'rent']),
  price: z.string().transform(val => parseFloat(val) || 0),
  category_id: z.string().optional(),
  has_inventory: z.boolean(),
  has_variants: z.boolean(),
  sku: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemDTO) => void;
  item?: Item | null;
  /** Type pre-selected from the page's "New Item" dropdown (create mode only). */
  defaultType?: ItemType;
  categories: Category[];
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary";
const labelClass = "block text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary mb-1";

export function ItemFormModal({ open, onClose, onSubmit, item, defaultType = 'product', categories, isLoading }: Props) {
  const t = useTranslations('items');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      has_inventory: false,
      has_variants: false,
      type: 'product' as const,
      operation_type: 'sell' as const,
      price: '',
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        type: item.type,
        operation_type: item.operation_type,
        price: String(item.price),
        category_id: item.category_id ?? undefined,
        has_inventory: item.has_inventory,
        has_variants: item.has_variants,
        sku: item.sku ?? '',
      });
    } else {
      reset({ has_inventory: false, has_variants: false, type: defaultType, operation_type: 'sell', price: '', sku: '' });
    }
  }, [item, defaultType, reset]);

  if (!open) return null;

  const handleFormSubmit = (data: any) => {
    const { sku, ...rest } = data;
    const payload: CreateItemDTO = { ...rest, category_id: data.category_id || undefined };
    // Only include sku in the request if the user actually changed it —
    // resubmitting the same value on every edit must never flip an 'auto'
    // sku to 'manual', and creating with an empty field means "auto-generate".
    const originalSku = item?.sku ?? '';
    if (sku !== originalSku) {
      payload.sku = sku || undefined;
    }
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border sticky top-0 bg-posCloud-surface dark:bg-posCloudDark-surface z-10">
          <h2 className="text-base font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
            {item ? t('editItem') : t('addItem')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('name')}</label>
            <input {...register('name')} className={inputClass} />
            {errors.name && <p className="text-xs text-posCloud-danger mt-1">{t('required')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('type')}</label>
              <select {...register('type')} className={inputClass}>
                <option value="product">{t('product')}</option>
                <option value="service">{t('service')}</option>
                <option value="custom">{t('custom')}</option>
                <option value="raw_material">{t('raw_material')}</option>
                <option value="semi_finished">{t('semi_finished')}</option>
                <option value="finished_goods">{t('finished_goods')}</option>
                <option value="asset">{t('asset')}</option>
                <option value="consumable">{t('consumable')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('operationType')}</label>
              <select {...register('operation_type')} className={inputClass}>
                <option value="sell">{t('sell')}</option>
                <option value="book">{t('book')}</option>
                <option value="repair">{t('repair')}</option>
                <option value="rent">{t('rent')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('price')}</label>
              <input type="text" inputMode="decimal" placeholder="0.00" {...register('price')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('category')}</label>
              <select {...register('category_id')} className={inputClass}>
                <option value="">{t('noCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('sku')}</label>
            <input placeholder={t('autoGenerated')} {...register('sku')} className={inputClass} />
            {item?.sku_source === 'manual' && (
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-1">{t('skuManualHint')}</p>
            )}
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary cursor-pointer">
              <input type="checkbox" {...register('has_inventory')} className="w-4 h-4 accent-posCloud-primary" />
              {t('hasInventory')}
            </label>
            <label className="flex items-center gap-2 text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary cursor-pointer">
              <input type="checkbox" {...register('has_variants')} className="w-4 h-4 accent-posCloud-primary" />
              {t('hasVariants')}
            </label>
          </div>

          {/* Stock is never entered here — it's always derived from
              stock_levels via Goods Receipts / Stock Adjustments / Counts. */}
          {item && !item.has_variants && (
            <div>
              <label className={labelClass}>{t('stock')}</label>
              <div className={`${inputClass} bg-slate-50 dark:bg-white/5 cursor-not-allowed`}>
                {item.stock_quantity ?? 0}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t('saving') : t('save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}