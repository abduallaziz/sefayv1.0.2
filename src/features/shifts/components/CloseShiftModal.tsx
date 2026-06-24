'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCloseShift } from '../hooks/useShifts';
import { formatCurrency } from '@/lib/format';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import type { Shift } from '../types';

interface Props {
  shift: Shift;
  onClose: () => void;
}

export function CloseShiftModal({ shift, onClose }: Props) {
  const t = useTranslations('shifts');
  const currency = useTenantStore((s) => s.currency_symbol);
  const mutation = useCloseShift();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { closing_cash: '' },
  });

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync({
      id: shift.id,
      dto: { closing_cash: Number(data.closing_cash) || 0 },
    });
    router.refresh();
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{t('close_shift')}</h2>
        <p className="text-sm text-slate-500 mb-4">
          {t('opening_was')}: <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(shift.opening_cash, currency)}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('closing_cash')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...register('closing_cash')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
            />
            {errors.closing_cash && (
              <p className="text-xs text-red-500 mt-1">{String(errors.closing_cash.message)}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? t('closing') : t('close')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}