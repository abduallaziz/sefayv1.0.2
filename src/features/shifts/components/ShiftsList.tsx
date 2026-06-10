'use client';

import { useTranslations } from 'next-intl';
import { useShifts } from '../hooks/useShifts';
import type { Shift } from '../types';

interface Props {
  onViewSummary: (id: string) => void;
}

export function ShiftsList({ onViewSummary }: Props) {
  const t = useTranslations('shifts');
  const { data: shifts, isLoading } = useShifts();

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400 text-sm">{t('loading')}</div>;
  }

  if (!shifts?.length) {
    return <div className="py-8 text-center text-gray-400 text-sm">{t('no_shifts')}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-start py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cashier')}</th>
            <th className="text-start py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('opened_at')}</th>
            <th className="text-start py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('closed_at')}</th>
            <th className="text-start py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('opening_cash')}</th>
            <th className="text-start py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('status')}</th>
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

  const fmt = (d: string) =>
    new Date(d).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4 text-gray-900 dark:text-white">{shift.cashier_name ?? shift.cashier_id}</td>
      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{fmt(shift.opened_at)}</td>
      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shift.closed_at ? fmt(shift.closed_at) : '—'}</td>
      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shift.opening_cash} ر.س</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          shift.status === 'open'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {t(`status_${shift.status}`)}
        </span>
      </td>
      <td className="py-3 px-4 text-end">
        <button
          onClick={() => onViewSummary(shift.id)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          {t('summary')}
        </button>
      </td>
    </tr>
  );
}