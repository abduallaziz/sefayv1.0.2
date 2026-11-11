'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Waves as WavesIcon } from 'lucide-react';
import { DataTable, type Column } from '@/shared/ui/data-table';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { formatDate } from '@/lib/locale';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useUsers } from '../../users/hooks/useUsers';
import { usePagedWaves } from '../hooks/useWms';
import { Wave, WavesQuery } from '../types/wms.types';
import { translateEnum } from '../lib/enumTranslation';
import { WaveDetailDrawer } from './WaveDetailDrawer';
import { CreateWaveSheet } from './CreateWaveSheet';

// Inventory #7 / F7 (Owner-approved) — Wave Overview / Wave Management.
// Source of truth is GET /inventory/wms/waves via the F17 contract
// (WavesQueryDto, api/src/modules/inventory/dto/wms-list-query.dto.ts):
// filters = status, warehouse_id; sort = created_at, status only. The
// backend does not support a search, date-range, or creator filter for
// this endpoint, and there is no server-side shipment-count sort (no such
// aggregate column exists on `waves` to sort by) — none of those are
// invented here. WmsRepository.findWaves returns bare `waves.*` rows (no
// join), so warehouse and creator *names* are resolved via the existing
// bulk useWarehouses()/useUsers() lists, same established pattern as F2's
// assignment column, not a fabricated join and not a per-row request.
// Per-wave shipment/eligible/excluded/claimed/failed counts are NOT shown
// as list columns: the only real backend source for a per-wave breakdown
// is fn_wms_wave_shipment_summary, which is single-wave-scoped — using it
// per list row would be a real N+1 the 7-9/F17 performance contract
// forbids. Those counts are instead shown in the on-demand detail drawer
// (one bounded call per open), matching this session's established
// row-detail/drawer pattern for dense-data avoidance. Aggregate,
// warehouse-wide wave totals (including total eligible/claimed/excluded/
// failed) are already surfaced on the F1 WMS Overview dashboard tab via
// fn_wms_wave_overview — not duplicated here.

const STATUS_KEYS = ['planning', 'evaluating', 'reviewing', 'released', 'picking', 'completed', 'cancelled'] as const;

const STATUS_TONE: Record<string, StatusTone> = {
  planning: 'neutral',
  evaluating: 'info',
  reviewing: 'warning',
  released: 'info',
  picking: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export function WavesList() {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';

  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Same page-reset-in-the-event-handler fix as PickListsList (F2) —
  // resets before the next render so a stale page never pairs with a
  // freshly filtered/sorted result set.
  const withPageReset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const setWarehouseIdReset = withPageReset(setWarehouseId);
  const setStatusReset = withPageReset(setStatus);
  const setSortByReset = withPageReset(setSortBy);
  const setSortOrderReset = withPageReset(setSortOrder);
  const setPerPage = withPageReset(setPerPageState);

  const query: WavesQuery = {
    warehouse_id: warehouseId || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
    page,
    limit: perPage,
  };

  const { data: warehouses = [] } = useWarehouses();
  const { data: users = [] } = useUsers();
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id.slice(0, 8);
  const userName = (id: string | null) => (id ? (users.find((u) => u.id === id)?.name ?? id.slice(0, 8)) : null);

  const { data: paged, isLoading, isFetching, isError } = usePagedWaves(query);
  const waves = paged?.data ?? [];
  const total = paged?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasActiveFilters = !!(warehouseId || status);

  const columns: Column<Wave>[] = [
    {
      key: 'id',
      header: t('waves.columns.id'),
      render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    {
      key: 'status',
      header: t('waves.columns.status'),
      render: (row) => (
        <StatusBadge tone={STATUS_TONE[row.status] ?? 'neutral'} label={translateEnum(t, 'waves.status', STATUS_KEYS, row.status)} />
      ),
    },
    {
      key: 'warehouse',
      header: t('waves.columns.warehouse'),
      render: (row) => warehouseName(row.warehouse_id),
    },
    {
      key: 'createdBy',
      header: t('waves.columns.createdBy'),
      render: (row) => userName(row.created_by) ?? (
        <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.unknownActor')}</span>
      ),
    },
    {
      key: 'createdAt',
      header: t('waves.columns.createdAt'),
      render: (row) => formatDate(row.created_at, { locale, format: 'short' }),
    },
    {
      key: 'evaluatedAt',
      header: t('waves.columns.evaluatedAt'),
      render: (row) => (row.evaluated_at ? formatDate(row.evaluated_at, { locale, format: 'short' }) : t('waves.notYet')),
    },
    {
      key: 'releasedAt',
      header: t('waves.columns.releasedAt'),
      render: (row) => (row.released_at ? formatDate(row.released_at, { locale, format: 'short' }) : t('waves.notYet')),
    },
    {
      key: 'completedAt',
      header: t('waves.columns.completedAt'),
      render: (row) => (row.completed_at ? formatDate(row.completed_at, { locale, format: 'short' }) : t('waves.notYet')),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseIdReset(e.target.value)}
          aria-label={t('waves.filters.warehouse')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="">{t('waves.filters.allWarehouses')}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatusReset(e.target.value)}
          aria-label={t('waves.filters.status')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="">{t('waves.filters.allStatuses')}</option>
          {STATUS_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'waves.status', STATUS_KEYS, k)}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortByReset(e.target.value as 'created_at' | 'status')}
          aria-label={t('waves.filters.sortBy')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="created_at">{t('waves.sortCreatedAt')}</option>
          <option value="status">{t('waves.sortStatus')}</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrderReset(e.target.value as 'asc' | 'desc')}
          aria-label={t('waves.filters.sortOrder')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="desc">{t('waves.filters.sortDesc')}</option>
          <option value="asc">{t('waves.filters.sortAsc')}</option>
        </select>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="text-sm px-3 py-1.5 rounded-lg font-medium bg-[#0C447C] text-white hover:bg-[#0a3a6b] shrink-0"
        >
          {t('waves.create.trigger')}
        </button>
      </div>

      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/15 px-3.5 py-2.5 text-[13px] text-posCloud-danger">
          {t('waves.loadError')}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={waves}
          keyExtractor={(row) => row.id}
          theme="dashboard"
          loading={isLoading}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyState={
            <EmptyState
              icon={WavesIcon}
              theme="inventory"
              size="sm"
              title={hasActiveFilters ? t('waves.emptyFilteredTitle') : t('waves.emptyTitle')}
              description={hasActiveFilters ? t('waves.emptyFilteredDescription') : t('waves.emptyDescription')}
            />
          }
        />
      )}

      {!isError && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            <span>{t('waves.count', { count: total })}</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              aria-label={t('waves.rowsPerPage')}
              className="bg-transparent border border-posCloud-border dark:border-posCloudDark-border rounded-md px-2 py-1 text-xs tabular-nums focus:outline-none focus:border-posCloud-primary"
            >
              {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {isFetching && <span>{t('waves.loading')}</span>}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        </div>
      )}

      <WaveDetailDrawer
        waveId={selectedId}
        open={!!selectedId}
        onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedId(null); }}
      />
      <CreateWaveSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
