'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import type { ItemFilters, ItemType, Category } from '../types/item.types';

interface Props {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
  categories: Category[];
}

export function ItemFiltersBar({ filters, onChange, categories }: Props) {
  const t = useTranslations('items');

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
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value as ItemType | 'all' })}
        className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] text-slate-800 dark:text-white"
      >
        <option value="all">{t('allTypes')}</option>
        <option value="product">{t('product')}</option>
        <option value="service">{t('service')}</option>
        <option value="custom">{t('custom')}</option>
      </select>

      <select
        value={filters.category_id}
        onChange={(e) => onChange({ ...filters, category_id: e.target.value })}
        className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] text-slate-800 dark:text-white"
      >
        <option value="all">{t('allCategories')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

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