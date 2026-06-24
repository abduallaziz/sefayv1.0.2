'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomerFilters } from '../types/customer.types';

interface Props {
  filters: CustomerFilters;
  onChange: (filters: CustomerFilters) => void;
}

export function CustomerFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('customers');

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full ps-10 pe-4 py-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] placeholder-slate-400 dark:placeholder-slate-600"
        />
      </div>

      <select
        value={filters.sortBy}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value as CustomerFilters['sortBy'] })}
        className="px-3 py-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
      >
        <option value="created_at">{t('sort.newest')}</option>
        <option value="name">{t('sort.name')}</option>
        <option value="loyalty_points">{t('sort.points')}</option>
        <option value="total_spent">{t('sort.spent')}</option>
      </select>

      <select
        value={filters.sortOrder}
        onChange={(e) => onChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
        className="px-3 py-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
      >
        <option value="desc">{t('sort.desc')}</option>
        <option value="asc">{t('sort.asc')}</option>
      </select>
    </div>
  );
}