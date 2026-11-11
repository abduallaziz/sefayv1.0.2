'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ListChecks } from 'lucide-react';
import { DataTable, type Column } from '@/shared/ui/data-table';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { formatDate } from '@/lib/locale';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useUsers } from '../../users/hooks/useUsers';
import { usePagedPickLists } from '../hooks/useWms';
import { PickList, PickListsQuery } from '../types/wms.types';
import { translateEnum } from '../lib/enumTranslation';
import { PickListDetailDrawer } from './PickListDetailDrawer';
import { ZoneSplitSheet } from './ZoneSplitSheet';
import { usePermission } from '@/core/permissions/hooks/usePermission';

// Inventory #7 / F2 (Owner-approved) — Pick Lists List + Filters.
// Source of truth is GET /inventory/wms/pick-lists via the F17 contract
// (PickListsQueryDto, api/src/modules/inventory/dto/wms-list-query.dto.ts):
// filters = status, warehouse_id, priority, strategy; sort = created_at,
// priority only. The backend does not support search, date-range, or an
// assignment-state filter for this endpoint — those are intentionally NOT
// offered here rather than invented client-side. Assignment state, wave
// linkage, and zone linkage are shown using only fields the backend
// actually returns (assigned_to / wave_id / zone_location_id); assigned
// user *names* are resolved via the existing bulk useUsers() list (same
// established pattern as WmsPage.tsx's itemName() lookup) rather than a
// new per-row request. Wave/zone *names* are not in the current pick-lists
// response (no join) — audited gap, reported in the F2 completion report;
// their raw linkage is still shown via the real id, never fabricated.

const STATUS_KEYS = ['open', 'in_progress', 'completed', 'cancelled'] as const;
const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;
const STRATEGY_KEYS = ['single', 'batch', 'zone', 'wave'] as const;

const STATUS_TONE: Record<string, StatusTone> = {
  open: 'neutral',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const PRIORITY_TONE: Record<string, StatusTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function PickListsList() {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';

  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState('');
  const [strategy, setStrategy] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isZoneSplitOpen, setIsZoneSplitOpen] = useState(false);
  const canFulfill = usePermission('inventory.fulfill');

  // Filter/sort changes go through a setter that also resets to page 1 in
  // the same event handler (not a useEffect) — matches usePagedCustomers'
  // documented fix for the PGRST103-on-stale-offset issue: an effect runs
  // after render, so a stale page number could pair with a newly-filtered
  // result set for one render before the reset lands.
  const withPageReset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const setWarehouseIdReset = withPageReset(setWarehouseId);
  const setStatusReset = withPageReset(setStatus);
  const setStrategyReset = withPageReset(setStrategy);
  const setPriorityReset = withPageReset(setPriority);
  const setSortByReset = withPageReset(setSortBy);
  const setSortOrderReset = withPageReset(setSortOrder);
  const setPerPage = withPageReset(setPerPageState);

  const query: PickListsQuery = {
    warehouse_id: warehouseId || undefined,
    status: status || undefined,
    strategy: strategy || undefined,
    priority: priority || undefined,
    sortBy,
    sortOrder,
    page,
    limit: perPage,
  };

  const { data: warehouses = [] } = useWarehouses();
  const { data: users = [] } = useUsers();
  const userName = (id: string | null) => (id ? (users.find((u) => u.id === id)?.name ?? id.slice(0, 8)) : null);

  const { data: paged, isLoading, isFetching, isError } = usePagedPickLists(query);
  const pickLists = paged?.data ?? [];
  const total = paged?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasActiveFilters = !!(warehouseId || status || strategy || priority);

  const columns: Column<PickList>[] = [
    {
      key: 'id',
      header: t('pickLists.columns.id'),
      render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    {
      key: 'strategy',
      header: t('pickLists.columns.strategy'),
      render: (row) => (
        <StatusBadge tone="neutral" label={translateEnum(t, 'dashboard.strategies', STRATEGY_KEYS, row.strategy)} />
      ),
    },
    {
      key: 'status',
      header: t('pickLists.columns.status'),
      render: (row) => (
        <StatusBadge tone={STATUS_TONE[row.status] ?? 'neutral'} label={translateEnum(t, 'pickLists.status', STATUS_KEYS, row.status)} />
      ),
    },
    {
      key: 'priority',
      header: t('pickLists.columns.priority'),
      render: (row) => (
        <StatusBadge tone={PRIORITY_TONE[row.priority] ?? 'neutral'} label={translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, row.priority)} />
      ),
    },
    {
      key: 'warehouse',
      header: t('pickLists.columns.warehouse'),
      render: (row) => row.warehouses?.name ?? row.warehouse_id.slice(0, 8),
    },
    {
      key: 'assignment',
      header: t('pickLists.columns.assignment'),
      render: (row) => userName(row.assigned_to) ?? (
        <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickLists.unassigned')}</span>
      ),
    },
    {
      key: 'shipments',
      header: t('pickLists.columns.shipments'),
      align: 'center',
      render: (row) => row.shipments?.length ?? 0,
    },
    {
      key: 'quantity',
      header: t('pickLists.columns.quantity'),
      render: (row) => {
        const lines = row.lines ?? [];
        const picked = lines.reduce((sum, l) => sum + l.quantity_picked, 0);
        const total_qty = lines.reduce((sum, l) => sum + l.quantity_to_pick, 0);
        return `${picked}/${total_qty}`;
      },
    },
    {
      key: 'wave',
      header: t('pickLists.columns.wave'),
      render: (row) => (row.wave_id ? <span className="font-mono text-xs">{row.wave_id.slice(0, 8)}</span> : t('pickLists.notLinked')),
    },
    {
      key: 'zone',
      header: t('pickLists.columns.zone'),
      render: (row) => (row.zone_location_id ? <span className="font-mono text-xs">{row.zone_location_id.slice(0, 8)}</span> : t('pickLists.notLinked')),
    },
    {
      key: 'createdAt',
      header: t('pickLists.columns.createdAt'),
      render: (row) => formatDate(row.created_at, { locale, format: 'short' }),
    },
    {
      key: 'completedAt',
      header: t('pickLists.columns.completedAt'),
      render: (row) => (row.completed_at ? formatDate(row.completed_at, { locale, format: 'short' }) : t('pickLists.notLinked')),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseIdReset(e.target.value)}
          aria-label={t('pickLists.filters.warehouse')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="">{t('pickLists.filters.allWarehouses')}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatusReset(e.target.value)}
          aria-label={t('pickLists.filters.status')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="">{t('pickLists.filters.allStatuses')}</option>
          {STATUS_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'pickLists.status', STATUS_KEYS, k)}</option>)}
        </select>
        <select
          value={strategy}
          onChange={(e) => setStrategyReset(e.target.value)}
          aria-label={t('pickLists.filters.strategy')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="">{t('pickLists.filters.allStrategies')}</option>
          {STRATEGY_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'dashboard.strategies', STRATEGY_KEYS, k)}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriorityReset(e.target.value)}
          aria-label={t('pickLists.filters.priority')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="">{t('pickLists.filters.allPriorities')}</option>
          {PRIORITY_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, k)}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortByReset(e.target.value as 'created_at' | 'priority')}
          aria-label={t('pickLists.filters.sortBy')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="created_at">{t('pickLists.sortCreatedAt')}</option>
          <option value="priority">{t('pickLists.sortPriority')}</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrderReset(e.target.value as 'asc' | 'desc')}
          aria-label={t('pickLists.filters.sortOrder')}
          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
        >
          <option value="desc">{t('pickLists.filters.sortDesc')}</option>
          <option value="asc">{t('pickLists.filters.sortAsc')}</option>
        </select>
        {canFulfill && (
          <button
            type="button"
            onClick={() => setIsZoneSplitOpen(true)}
            className="ms-auto text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white hover:bg-[#0a3a6b]"
          >
            {t('zoneSplit.action')}
          </button>
        )}
      </div>

      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/15 px-3.5 py-2.5 text-[13px] text-posCloud-danger">
          {t('pickLists.loadError')}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pickLists}
          keyExtractor={(row) => row.id}
          theme="dashboard"
          loading={isLoading}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyState={
            <EmptyState
              icon={ListChecks}
              theme="inventory"
              size="sm"
              title={hasActiveFilters ? t('pickLists.emptyFilteredTitle') : t('pickLists.emptyTitle')}
              description={hasActiveFilters ? t('pickLists.emptyFilteredDescription') : t('pickLists.emptyDescription')}
            />
          }
        />
      )}

      {!isError && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            <span>{t('pickLists.count', { count: total })}</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              aria-label={t('pickLists.rowsPerPage')}
              className="bg-transparent border border-posCloud-border dark:border-posCloudDark-border rounded-md px-2 py-1 text-xs tabular-nums focus:outline-none focus:border-posCloud-primary"
            >
              {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {isFetching && <span>{t('pickLists.loading')}</span>}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        </div>
      )}

      <PickListDetailDrawer
        pickListId={selectedId}
        open={!!selectedId}
        onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedId(null); }}
      />

      <ZoneSplitSheet
        open={isZoneSplitOpen}
        onOpenChange={setIsZoneSplitOpen}
        initialWarehouseId={warehouseId || undefined}
      />
    </div>
  );
}
