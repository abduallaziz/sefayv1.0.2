'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { RequiredMark } from '@/shared/components/ui/RequiredMark';
import type { Location, CreateLocationDTO } from '../types/location.types';

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLocationDTO) => void;
  location?: Location | null;
  isLoading?: boolean;
  submitError?: string | null;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function LocationFormModal({ open, onClose, onSubmit, location, isLoading, submitError }: Props) {
  const t = useTranslations('locations');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', description: '', is_active: true },
  });

  useEffect(() => {
    if (location) {
      reset({
        code: location.code,
        name: location.name,
        description: location.description ?? '',
        is_active: location.is_active,
      });
    } else {
      reset({ code: '', name: '', description: '', is_active: true });
    }
  }, [location, reset]);

  if (!open) return null;

  const handleFormSubmit = (data: z.infer<typeof schema>) => {
    const dto: CreateLocationDTO = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      is_active: data.is_active,
    };
    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {location ? t('editLocation') : t('addLocation')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('code')}<RequiredMark /></label>
              <input {...register('code')} className={inputClass} />
              {errors.code && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('name')}<RequiredMark /></label>
              <input {...register('name')} className={inputClass} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('description')}</label>
            <textarea {...register('description')} rows={2} className={inputClass} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]" />
            <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">{t('active')}</label>
          </div>

          {submitError && (
            <p className="text-xs text-red-500 -mt-1">{submitError}</p>
          )}

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
