'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useOpenShift } from '../hooks/useShifts';

interface Props {
  branchId: string;
  onClose: () => void;
}

export function OpenShiftModal({ branchId, onClose }: Props) {
  const t = useTranslations('shifts');
  const mutation = useOpenShift();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { opening_cash: '', branch_id: branchId },
  });

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync({ ...data, opening_cash: Number(data.opening_cash) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('open_shift')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('opening_cash')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...register('opening_cash')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
            />
            {errors.opening_cash && (
              <p className="text-xs text-red-500 mt-1">{String(errors.opening_cash.message)}</p>
            )}
          </div>
          <input type="hidden" {...register('branch_id')} />
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
              className="flex-1 px-4 py-2 rounded-lg bg-[#0C447C] hover:bg-[#0a3a6b] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? t('opening') : t('open')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}