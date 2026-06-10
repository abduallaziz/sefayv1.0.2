'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useCloseShift } from '../hooks/useShifts';
import type { Shift, CloseShiftDto } from '../types';

interface Props {
  shift: Shift;
  onClose: () => void;
}

export function CloseShiftModal({ shift, onClose }: Props) {
  const t = useTranslations('shifts');
  const mutation = useCloseShift();

  const { register, handleSubmit, formState: { errors } } = useForm<CloseShiftDto>({
    defaultValues: { closing_cash: 0 },
  });

  const onSubmit = async (data: CloseShiftDto) => {
    await mutation.mutateAsync({ id: shift.id, dto: { closing_cash: Number(data.closing_cash) } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('close_shift')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('opening_was')}: <span className="font-medium">{shift.opening_cash} ر.س</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('closing_cash')}
            </label>
            <input
              type="number"
              step="0.01"
              {...register('closing_cash', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.closing_cash && (
              <p className="text-xs text-red-500 mt-1">{errors.closing_cash.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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