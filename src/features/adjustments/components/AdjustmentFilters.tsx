'use client';

import { useTranslations } from 'next-intl';
import { AdjustmentFilters as IAdjustmentFilters, AdjustmentStatus } from '../types/adjustment.types';

interface Props {
  filters: IAdjustmentFilters;
  onChange: (filters: IAdjustmentFilters) => void;
}

const inputClass =
  'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

export function AdjustmentFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('adjustments');

  const statuses: { value: AdjustmentStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'pending_approval', labelKey: 'status.pending_approval' },
    { value: 'approved', labelKey: 'status.approved' },
    { value: 'rejected', labelKey: 'status.rejected' },
    { value: 'posted', labelKey: 'status.posted' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: (e.target.value as AdjustmentStatus) || undefined })}
        className={inputClass}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.value === '' ? t('status.all') : t(`status.${s.value}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
