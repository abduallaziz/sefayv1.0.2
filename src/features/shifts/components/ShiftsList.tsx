'use client';

import { useTranslations } from 'next-intl';
import { useShifts } from '../hooks/useShifts';
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
          <tr className="border-b border-[#1e2130]">
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('cashier')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('opened_at')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('closed_at')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('opening_cash')}</th>
            <th className="text-start py-3 px-4 font-medium text-slate-500">{t('status')}</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
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

  return (
    <tr className="border-b border-[#1e2130] last:border-0 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-4 text-white">{shift.cashier_name ?? shift.cashier_id}</td>
      <td className="py-3 px-4 text-slate-400">{formatDateTime(shift.opened_at)}</td>
      <td className="py-3 px-4 text-slate-400">{shift.closed_at ? formatDateTime(shift.closed_at) : '—'}</td>
      <td className="py-3 px-4 text-slate-400">{formatCurrency(shift.opening_cash)}</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          shift.status === 'open'
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-slate-500/10 text-slate-400'
        }`}>
          {t(`status_${shift.status}`)}
        </span>
      </td>
      <td className="py-3 px-4 text-end">
        <button
          onClick={() => onViewSummary(shift.id)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          {t('summary')}
        </button>
      </td>
    </tr>
  );
}