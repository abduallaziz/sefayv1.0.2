'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Customer, CreateCustomerDto } from '../types/customer.types';

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (data: CreateCustomerDto) => void;
  isLoading?: boolean;
}

export function CustomerFormModal({ customer, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('customers');
  const isEdit = !!customer;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (customer) {
      reset({ full_name: customer.full_name ?? '', phone: customer.phone ?? '', email: customer.email ?? '' });
    } else {
      reset({ full_name: '', phone: '', email: '' });
    }
  }, [customer, reset]);

  const onValid = (data: FormValues) => {
    onSubmit({ full_name: data.full_name, phone: data.phone, email: data.email || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {isEdit ? t('form.title_edit') : t('form.title_add')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onValid)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('form.name')} *
            </label>
            <input
              {...register('full_name')}
              className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{t('form.errors.name')}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('form.phone')} *
            </label>
            <input
              {...register('phone')}
              type="tel"
              dir="ltr"
              className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{t('form.errors.phone')}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('form.email')}
            </label>
            <input
              {...register('email')}
              type="email"
              dir="ltr"
              className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{t('form.errors.email')}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              {t('form.cancel')}
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {isLoading ? t('form.saving') : isEdit ? t('form.save') : t('form.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}