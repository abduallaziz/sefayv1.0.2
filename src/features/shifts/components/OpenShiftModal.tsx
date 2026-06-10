'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useOpenShift } from '../hooks/useShifts';
import type { OpenShiftDto } from '../types';

interface Props {
  branchId: string;
  onClose: () => void;
}

export function OpenShiftModal({ branchId, onClose }: Props) {
  const t = useTranslations('shifts');
  const mutation = useOpenShift();

  const { register, handleSubmit, formState: { errors } } = useForm<OpenShiftDto>({
    defaultValues: { opening_cash: 0, branch_id: branchId },
  });

  const onSubmit = async (data: OpenShiftDto) => {
    await mutation.mutateAsync({ ...data, opening_cash: Number(data.opening_cash) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('open_shift')}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('opening_cash')}
            </label>
            <input
              type="number"
              step="0.01"
              {...register('opening_cash', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.opening_cash && (
              <p className="text-xs text-red-500 mt-1">{errors.opening_cash.message}</p>
            )}
          </div>
          <input type="hidden" {...register('branch_id')} />
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
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? t('opening') : t('open')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}