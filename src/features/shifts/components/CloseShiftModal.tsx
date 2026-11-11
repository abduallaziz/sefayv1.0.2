'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCloseShift } from '../hooks/useShifts';
import { useShiftReportStore } from '../stores/shift-report.store';
import { formatCurrency } from '@/lib/format';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import type { CountedMethod, Shift } from '../types';

interface Props {
  shift: Shift;
  onClose: () => void;
}

const METHODS: CountedMethod[] = ['cash', 'mada', 'visa', 'mastercard'];

type Values = Record<CountedMethod, string>;

// Blind count (owner decision 2026-11-09): the cashier enters what was
// physically counted per payment method. Expected amounts are NOT shown
// here; they appear in the close report after the register is closed.
export function CloseShiftModal({ shift, onClose }: Props) {
  const t = useTranslations('shifts');
  const currency = useCurrencyDisplay();
  const mutation = useCloseShift();
  const router = useRouter();
  const showReport = useShiftReportStore((s) => s.show);

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: { cash: '', mada: '', visa: '', mastercard: '' },
  });

  const onSubmit = async (data: Values) => {
    const counts: Partial<Record<CountedMethod, number>> = {};
    for (const m of METHODS) counts[m] = Number(data[m]) || 0;

    const result = await mutation.mutateAsync({ id: shift.id, dto: { counts } });
    router.refresh();
    // The report outlives this dialog (and the POS screen that swaps to its
    // "register closed" view): it is shown by ShiftReportHost.
    showReport(result.shift.id, result.report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{t('close_shift')}</h2>
        <p className="text-sm text-slate-500 mb-1">
          {t('opening_was')}: <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(shift.opening_cash, currency)}</span>
        </p>
        <p className="text-xs text-slate-500 mb-4">{t('count_hint')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {METHODS.map((m) => (
            <div key={m}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t(`counted_${m}`)}
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                {...register(m)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
              />
            </div>
          ))}
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
