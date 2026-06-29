'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
}

export function LocationFiltersBar({ search, onSearchChange }: Props) {
  const t = useTranslations('locations');

  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full ps-9 pe-4 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
      />
    </div>
  );
}
