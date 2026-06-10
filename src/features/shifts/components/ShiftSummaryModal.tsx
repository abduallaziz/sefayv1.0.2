'use client';

import { useTranslations } from 'next-intl';
import { useShiftSummary } from '../hooks/useShifts';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

interface Props {
  shiftId: string;
  onClose: () => void;
}

export function ShiftSummaryModal({ shiftId, onClose }: Props) {
  const t = useTranslations('shifts');
  const { data, isLoading } = useShiftSummary(shiftId);

  const summary = data?.summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('summary')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400">{t('loading')}</div>
        ) : summary ? (
          <div className="space-y-3">
            <Row icon={FileText} label={t('total_invoices')} value={String(summary.totalInvoices)} />
            <Row icon={TrendingUp} label={t('total_sales')} value={`${summary.totalRevenue} ر.س`} color="green" />
            <Row icon={DollarSign} label={t('cash_sales')} value={`${summary.totalCash} ر.س`} />
            <Row icon={DollarSign} label={t('card_sales')} value={`${summary.totalCard} ر.س`} />
            <Row icon={TrendingDown} label={t('total_expenses')} value={`${summary.totalExpenses} ر.س`} color="red" />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <Row icon={DollarSign} label={t('expected_cash')} value={`${summary.expectedCash} ر.س`} />
              {summary.discrepancy !== null && (
                <Row
                  icon={DollarSign}
                  label={t('discrepancy')}
                  value={`${summary.discrepancy} ر.س`}
                  color={summary.discrepancy === 0 ? 'green' : 'red'}
                />
              )}
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: 'green' | 'red';
}) {
  const valueColor = color === 'green'
    ? 'text-green-600 dark:text-green-400'
    : color === 'red'
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-900 dark:text-white';

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}