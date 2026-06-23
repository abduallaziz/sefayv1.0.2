'use client';

import { useTranslations } from 'next-intl';
import { Clock, CheckCircle } from 'lucide-react';
import { useCurrentShift } from '../hooks/useShifts';
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { formatCurrency } from '@/lib/format'

interface Props {
  onOpenShift: () => void;
  onCloseShift: () => void;
  onViewSummary: (id: string) => void;
}

export function CurrentShiftBanner({ onOpenShift, onCloseShift, onViewSummary }: Props) {
  const t = useTranslations('shifts');
  const { data: shift, isLoading } = useCurrentShift();
  const currency = useTenantStore((s) => s.currency_symbol)

  if (isLoading) return null;

  if (!shift) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{t('no_open_shift')}</span>
        </div>
        <button
          onClick={onOpenShift}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {t('open_shift')}
        </button>
      </div>
    );
  }

  const openedAt = new Date(shift.opened_at).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {t('shift_open')}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            {t('opened_at')} {openedAt} · {t('opening_cash')}: {formatCurrency(shift.opening_cash, currency)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onViewSummary(shift.id)}
          className="px-3 py-1.5 rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 text-sm hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors"
        >
          {t('summary')}
        </button>
        <button
          onClick={onCloseShift}
          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          {t('close_shift')}
        </button>
      </div>
    </div>
  );
}