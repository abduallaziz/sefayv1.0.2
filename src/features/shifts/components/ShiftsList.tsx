'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useShifts } from '../hooks/useShifts';
import { useShiftReportStore } from '../stores/shift-report.store';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Shift } from '../types';

const PAGE_SIZE = 20;

interface Props {
  onViewSummary: (id: string) => void;
}

export function ShiftsList({ onViewSummary }: Props) {
  const t = useTranslations('shifts');
  const { data: allShifts, isLoading } = useShifts();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shifts = allShifts?.slice(0, visible);

  if (isLoading) {
    return <div className="py-8 text-center text-slate-500 text-sm">{t('loading')}</div>;
  }

  if (!shifts?.length) {
    return <div className="py-8 text-center text-slate-500 text-sm">{t('no_shifts')}</div>;
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-gray-800">
        {shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} onViewSummary={onViewSummary} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800">
              <th className="text-start py-3 px-3 font-medium text-slate-500">{t('cashier')}</th>
              <th className="text-start py-3 px-3 font-medium text-slate-500">{t('opened_at')}</th>
              <th className="text-start py-3 px-3 font-medium text-slate-500">{t('closed_at')}</th>
              <th className="text-start py-3 px-3 font-medium text-slate-500">{t('opening_cash')}</th>
              <th className="text-start py-3 px-3 font-medium text-slate-500 w-20">{t('status')}</th>
              <th className="py-3 px-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {shifts.map((shift) => (
              <ShiftRow key={shift.id} shift={shift} onViewSummary={onViewSummary} />
            ))}
          </tbody>
        </table>
      </div>

      {allShifts && allShifts.length > visible && (
        <div className="py-3 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="text-sm font-medium text-[#0C447C] dark:text-[#5B9BD5] hover:underline"
          >
            {t('load_more')} ({allShifts.length - visible})
          </button>
        </div>
      )}
    </>
  );
}

function ShiftCard({ shift, onViewSummary }: { shift: Shift; onViewSummary: (id: string) => void }) {
  const t = useTranslations('shifts');
  const locale = useLocale();
  const currency = useCurrencyDisplay();
  const showReport = useShiftReportStore((st) => st.show);

  return (
    <div className="py-3 px-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800 dark:text-white truncate">{shift.cashier_name ?? shift.cashier_id}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
          shift.status === 'open'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {t(`status_${shift.status}`)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
        <span>{formatDateTime(shift.opened_at, locale)}{shift.closed_at ? ` — ${formatDateTime(shift.closed_at, locale)}` : ''}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-slate-500 tabular-nums">{t('opening_cash')}: {formatCurrency(shift.opening_cash, currency)}</span>
        <button
          onClick={() => onViewSummary(shift.id)}
          className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline font-medium"
        >
          {t('summary')}
        </button>
        {shift.status === 'closed' && (
          <button
            onClick={() => showReport(shift.id)}
            className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline font-medium"
          >
            {t('report')}
          </button>
        )}
      </div>
    </div>
  );
}

function ShiftRow({ shift, onViewSummary }: { shift: Shift; onViewSummary: (id: string) => void }) {
  const t = useTranslations('shifts');
  const locale = useLocale();
  const currency = useCurrencyDisplay();
  const showReport = useShiftReportStore((st) => st.show);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="py-3 px-3 text-slate-800 dark:text-white max-w-[140px] truncate">
        {shift.cashier_name ?? shift.cashier_id}
      </td>
      <td className="py-3 px-3 text-slate-500 text-xs">
        {formatDateTime(shift.opened_at, locale)}
      </td>
      <td className="py-3 px-3 text-slate-500 text-xs">
        {shift.closed_at ? formatDateTime(shift.closed_at, locale) : '—'}
      </td>
      <td className="py-3 px-3 text-slate-500 tabular-nums">
        {formatCurrency(shift.opening_cash, currency)}
      </td>
      <td className="py-3 px-3 w-20">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          shift.status === 'open'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {t(`status_${shift.status}`)}
        </span>
      </td>
      <td className="py-3 px-3 text-end w-32 whitespace-nowrap">
        <button
          onClick={() => onViewSummary(shift.id)}
          className="text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline font-medium"
        >
          {t('summary')}
        </button>
        {shift.status === 'closed' && (
          <button
            onClick={() => showReport(shift.id)}
            className="ms-3 text-xs text-[#0C447C] dark:text-[#5B9BD5] hover:underline font-medium"
          >
            {t('report')}
          </button>
        )}
      </td>
    </tr>
  );
}