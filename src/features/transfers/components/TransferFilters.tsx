'use client';

import { useTranslations } from 'next-intl';
import { TransferFilters as ITransferFilters, TransferStatus } from '../types/transfer.types';

interface Props {
  filters: ITransferFilters;
  onChange: (filters: ITransferFilters) => void;
}

export function TransferFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('transfers');

  const statuses: { value: TransferStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'draft', labelKey: 'status.draft' },
    { value: 'in_transit', labelKey: 'status.in_transit' },
    { value: 'completed', labelKey: 'status.completed' },
    { value: 'cancelled', labelKey: 'status.cancelled' },
  ];

  const inputClass =
    'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: (e.target.value as TransferStatus) || undefined })}
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
