'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/shared/ui/input';
import { Search } from 'lucide-react';

interface Props {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function TenantsFiltersBar({ search, status, onSearchChange, onStatusChange }: Props) {
  const t = useTranslations('tenants')

  const STATUSES = [
    { value: '', label: t('allStatus') },
    { value: 'active', label: t('active') },
    { value: 'trial', label: t('trial') },
    { value: 'suspended', label: t('suspended') },
    { value: 'cancelled', label: t('cancelled') },
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pe-9"
        />
      </div>
      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
              status === s.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-[#1e2130] text-muted-foreground hover:text-white hover:border-white/20'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}