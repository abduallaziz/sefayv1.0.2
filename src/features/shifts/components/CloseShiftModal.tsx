'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useCloseShift } from '../hooks/useShifts';
import { formatCurrency } from '@/lib/format';
import type { Shift } from '../types';

interface Props {
  shift: Shift;
  onClose: () => void;
}

export function CloseShiftModal({ shift, onClose }: Props) {
  const t = useTranslations('shifts');
  const mutation = useCloseShift();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { closing_cash: '' },
  });

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync({ id: shift.id, dto: { closing_cash: Number(data.closing_cash) || 0 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-white mb-1">{t('close_shift')}</h2>
        <p className="text-sm text-slate-500 mb-4">
          {t('opening_was')}: <span className="font-medium text-white">{formatCurrency(shift.opening_cash)}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('closing_cash')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...register('closing_cash')}
              className="w-full px-3 py-2 rounded-lg border border-[#1e2130] bg-[#141720] text-white focus:outline-none focus:border-blue-500"
            />
            {errors.closing_cash && (
              <p className="text-xs text-red-500 mt-1">{String(errors.closing_cash.message)}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#1e2130] text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
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