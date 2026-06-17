'use client';

import { useTranslations } from 'next-intl';
import { useShifts } from '../hooks/useShifts';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Shift } from '../types';

interface Props {
  onViewSummary: (id: string) => void;
}

export function ShiftsList({ onViewSummary }: Props) {
  const t = useTranslations('shifts');
  const { data: shifts, isLoading } = useShifts();

  if (isLoading) {
    return <div className="py-8 text-center text-slate-500 text-sm">{t('loading')}</div>;
  }

  if (!shifts?.length) {
    return <div className="py-8 text-center text-slate-500 text-sm">{t('no_shifts')}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-gray-800">
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('cashier')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('opened_at')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('closed_at')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('opening_cash')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('status')}</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
          {shifts.map((shift) => (
            <ShiftRow key={shift.id} shift={shift} onViewSummary={onViewSummary} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShiftRow({ shift, onViewSummary }: { shift: Shift; onViewSummary: (id: string) => void }) {
  const t = useTranslations('shifts');
  const currency = useTenantStore((s) => s.currency_symbol);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="py-3 px-4 text-slate-800 dark:text-white">{shift.cashier_name ?? shift.cashier_id}</td>
      <td className="py-3 px-4 text-slate-500">{formatDateTime(shift.opened_at)}</td>
      <td className="py-3 px-4 text-slate-500">{shift.closed_at ? formatDateTime(shift.closed_at) : '—'}</td>
      <td className="py-3 px-4 text-slate-500">{formatCurrency(shift.opening_cash, currency)}</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          shift.status === 'open'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {t(`status_${shift.status}`)}
        </span>
      </td>
      <td className="py-3 px-4 text-end">
        <button
          onClick={() => onViewSummary(shift.id)}
          className="text-xs text-[#0C447C] dark:text-blue-400 hover:underline font-medium"
        >
          {t('summary')}
        </button>
      </td>
    </tr>
  );
}