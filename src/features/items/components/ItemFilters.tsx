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
      <div className="flex items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 flex-1 min-w-[200px]">
        <Search className="w-4 h-4 shrink-0 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-transparent text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
        />
      </div>

      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value as ItemType | 'all' })}
        className="px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-lg focus:outline-none focus:border-posCloud-primary text-posCloud-text-primary dark:text-posCloudDark-text-primary"
      >
        <option value="all">{t('allTypes')}</option>
        <option value="product">{t('product')}</option>
        <option value="service">{t('service')}</option>
        <option value="custom">{t('custom')}</option>
      </select>

      <select
        value={filters.category_id}
        onChange={(e) => onChange({ ...filters, category_id: e.target.value })}
        className="px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-lg focus:outline-none focus:border-posCloud-primary text-posCloud-text-primary dark:text-posCloudDark-text-primary"
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
        className="px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-lg focus:outline-none focus:border-posCloud-primary text-posCloud-text-primary dark:text-posCloudDark-text-primary"
      >
        <option value="all">{t('allStatus')}</option>
        <option value="true">{t('active')}</option>
        <option value="false">{t('inactive')}</option>
      </select>
    </div>
  );
}