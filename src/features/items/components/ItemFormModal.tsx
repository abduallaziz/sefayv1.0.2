
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemDTO) => void;
  item?: Item | null;
  categories: Category[];
  isLoading?: boolean;
}

export function ItemFormModal({ open, onClose, onSubmit, item, categories, isLoading }: Props) {
  const t = useTranslations('items');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      has_inventory: false,
      has_variants: false,
      type: 'product',
      operation_type: 'sell',
      price: 0,
    },
  });

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
    }
  }, [item, reset]);

  if (!open) return null;

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as CreateItemDTO);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">
            {item ? t('editItem') : t('addItem')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('name')}</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('type')}</label>
              <select {...register('type')} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="product">{t('product')}</option>
                <option value="service">{t('service')}</option>
                <option value="custom">{t('custom')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('operationType')}</label>
              <select {...register('operation_type')} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="sell">{t('sell')}</option>
                <option value="book">{t('book')}</option>
                <option value="repair">{t('repair')}</option>
                <option value="rent">{t('rent')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('price')}</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('category')}</label>
              <select {...register('category_id')} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{t('noCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('has_inventory')} className="w-4 h-4" />
              {t('hasInventory')}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('has_variants')} className="w-4 h-4" />
              {t('hasVariants')}
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? t('saving') : t('save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}