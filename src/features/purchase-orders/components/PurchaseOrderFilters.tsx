'use client';

import { useTranslations } from 'next-intl';
import { PurchaseOrderFilters as IPurchaseOrderFilters, PurchaseOrderStatus } from '../types/purchase-order.types';

interface Props {
  filters: IPurchaseOrderFilters;
  onChange: (filters: IPurchaseOrderFilters) => void;
}

export function PurchaseOrderFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('purchasing');

  const statuses: { value: PurchaseOrderStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'draft', labelKey: 'status.draft' },
    { value: 'submitted', labelKey: 'status.submitted' },
    { value: 'approved', labelKey: 'status.approved' },
    { value: 'cancelled', labelKey: 'status.cancelled' },
  ];

  const inputClass =
    'border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: (e.target.value as PurchaseOrderStatus) || undefined })}
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
