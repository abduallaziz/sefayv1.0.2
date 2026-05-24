
'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { CustomerFilters } from '../types/customer.types';

interface Props {
  filters: CustomerFilters;
  onChange: (filters: CustomerFilters) => void;
}

export function CustomerFiltersBar({ filters, onChange }: Props) {
  const t = useTranslations('customers');

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full ps-10 pe-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sort */}
      <select
        value={filters.sortBy}
        onChange={(e) =>
          onChange({ ...filters, sortBy: e.target.value as CustomerFilters['sortBy'] })
        }
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="created_at">{t('sort.newest')}</option>
        <option value="name">{t('sort.name')}</option>
        <option value="loyalty_points">{t('sort.points')}</option>
        <option value="total_spent">{t('sort.spent')}</option>
      </select>

      <select
        value={filters.sortOrder}
        onChange={(e) =>
          onChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })
        }
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="desc">{t('sort.desc')}</option>
        <option value="asc">{t('sort.asc')}</option>
      </select>
    </div>
  );
}