'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Item, Category, CreateItemDTO } from '../types/item.types';

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['product', 'service', 'custom']),
  operation_type: z.enum(['sell', 'book', 'repair', 'rent']),
  price: z.number().min(0),
  category_id: z.string().optional(),
  has_inventory: z.boolean(),
  has_variants: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface VariantRow {
  name: string;
  price_adjustment: number;
  sku: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemDTO, variants?: VariantRow[]) => void;
  item?: Item | null;
  categories: Category[];
  isLoading?: boolean;
}

export function ItemFormModal({ open, onClose, onSubmit, item, categories, isLoading }: Props) {
  const t = useTranslations('items');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      has_inventory: false,
      has_variants: false,
      type: 'product',
      operation_type: 'sell',
      price: 0,
    },
  });

  const hasVariants = watch('has_variants');

  const [variants, setVariants] = useState<VariantRow[]>([]);

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        type: item.type,
        operation_type: item.operation_type,
        price: item.price,
        category_id: item.category_id ?? undefined,
        has_inventory: item.has_inventory,
        has_variants: item.has_variants,
      });
    } else {
      reset({ has_inventory: false, has_variants: false, type: 'product', operation_type: 'sell', price: 0 });
      setVariants([]);
    }
  }, [item, reset]);

  if (!open) return null;

  const addVariant = () => {
    setVariants([...variants, { name: '', price_adjustment: 0, sku: '' }]);
  };

  const removeVariant = (i: number) => {
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const updateVariant = (i: number, field: keyof VariantRow, value: string | number) => {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  };

  const handleFormSubmit = (data: FormData) => {
    const validVariants = variants.filter(v => v.name.trim());
    onSubmit(data as CreateItemDTO, validVariants.length > 0 ? validVariants : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e2130] sticky top-0 bg-[#0d1117] z-10">
          <h2 className="text-base font-semibold text-white">
            {item ? t('editItem') : t('addItem')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t('name')}</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
          </div>

          {/* Type + Operation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('type')}</label>
              <select {...register('type')} className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500">
                <option value="product">{t('product')}</option>
                <option value="service">{t('service')}</option>
                <option value="custom">{t('custom')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('operationType')}</label>
              <select {...register('operation_type')} className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500">
                <option value="sell">{t('sell')}</option>
                <option value="book">{t('book')}</option>
                <option value="repair">{t('repair')}</option>
                <option value="rent">{t('rent')}</option>
              </select>
            </div>
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('price')}</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('category')}</label>
              <select {...register('category_id')} className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500">
                <option value="">{t('noCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" {...register('has_inventory')} className="w-4 h-4 accent-blue-600" />
              {t('hasInventory')}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" {...register('has_variants')} className="w-4 h-4 accent-blue-600" />
              {t('hasVariants')}
            </label>
          </div>

          {/* Variants Section */}
          {hasVariants && (
            <div className="border border-[#1e2130] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{t('variants')}</p>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-3 h-3" />
                  {t('addVariant')}
                </button>
              </div>

              {variants.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-2">{t('noVariants')}</p>
              )}

              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    placeholder={t('variantName')}
                    value={v.name}
                    onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    className="px-3 py-2 text-sm bg-[#0d1117] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                  <input
                    type="number"
                    placeholder={t('priceAdjustment')}
                    value={v.price_adjustment}
                    onChange={(e) => updateVariant(i, 'price_adjustment', Number(e.target.value))}
                    className="px-3 py-2 text-sm bg-[#0d1117] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="p-2 text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? t('saving') : t('save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-sm"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}