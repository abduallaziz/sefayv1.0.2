'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import type { SupplierFilters } from '../types/supplier.types';

interface Props {
  filters: SupplierFilters;
  onChange: (filters: SupplierFilters) => void;
}

export function SupplierFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('suppliers');

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full ps-9 pe-4 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
        />
      </div>

      <select
        value={String(filters.is_active)}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ ...filters, is_active: val === 'all' ? 'all' : val === 'true' });
        }}
        className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] text-slate-800 dark:text-white"
      >
        <option value="all">{t('allStatus')}</option>
        <option value="true">{t('active')}</option>
        <option value="false">{t('inactive')}</option>
      </select>
    </div>
  );
}
