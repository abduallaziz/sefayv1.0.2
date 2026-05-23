'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTenants } from './hooks';
import { TenantsTable } from './components/TenantsTable';
import { TenantsFiltersBar } from './components/TenantsFilters';
import { Building2 } from 'lucide-react';

export function TenantsPage() {
  const t = useTranslations('tenants');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTenants({ search, status, page, limit: 20 });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.total} {t('title')}
            </p>
          )}
        </div>
      </div>

      <TenantsFiltersBar
        search={search}
        status={status}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
      />

      <TenantsTable tenants={data?.data ?? []} isLoading={isLoading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-[#1e2130] text-sm text-muted-foreground disabled:opacity-40 hover:text-white hover:border-white/20 transition-colors"
          >
            {t('prev')}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-[#1e2130] text-sm text-muted-foreground disabled:opacity-40 hover:text-white hover:border-white/20 transition-colors"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}