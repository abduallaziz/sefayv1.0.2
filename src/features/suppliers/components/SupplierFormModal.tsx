'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Supplier, CreateSupplierDTO } from '../types/supplier.types';

const schema = z.object({
  name: z.string().min(1),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  tax_number: z.string().optional(),
  payment_terms: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierDTO) => void;
  supplier?: Supplier | null;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function SupplierFormModal({ open, onClose, onSubmit, supplier, isLoading }: Props) {
  const t = useTranslations('suppliers');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', contact_name: '', phone: '', email: '', address: '', tax_number: '', payment_terms: '' },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contact_name: supplier.contact_name ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        tax_number: supplier.tax_number ?? '',
        payment_terms: supplier.payment_terms ?? '',
      });
    } else {
      reset({ name: '', contact_name: '', phone: '', email: '', address: '', tax_number: '', payment_terms: '' });
    }
  }, [supplier, reset]);

  if (!open) return null;

  const handleFormSubmit = (data: z.infer<typeof schema>) => {
    const dto: CreateSupplierDTO = {
      name: data.name,
      contact_name: data.contact_name || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      tax_number: data.tax_number || undefined,
      payment_terms: data.payment_terms || undefined,
    };
    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {supplier ? t('editSupplier') : t('addSupplier')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('name')}</label>
            <input {...register('name')} className={inputClass} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('contactName')}</label>
              <input {...register('contact_name')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('phone')}</label>
              <input {...register('phone')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('email')}</label>
            <input type="email" {...register('email')} className={inputClass} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{t('invalidEmail')}</p>}
          </div>

          <div>
            <label className={labelClass}>{t('address')}</label>
            <input {...register('address')} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('taxNumber')}</label>
              <input {...register('tax_number')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('paymentTerms')}</label>
              <input {...register('payment_terms')} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isLoading ? t('saving') : t('save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
