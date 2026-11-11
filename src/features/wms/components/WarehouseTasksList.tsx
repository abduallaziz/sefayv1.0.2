'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ListTodo } from 'lucide-react';
import { DataTable, type Column } from '@/shared/ui/data-table';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { formatDate } from '@/lib/locale';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useUsers } from '../../users/hooks/useUsers';
import { usePagedWarehouseTasks } from '../hooks/useWms';
import { WarehouseTask, WarehouseTasksQuery } from '../types/wms.types';
import { translateEnum } from '../lib/enumTranslation';
import { WarehouseTaskDetailDrawer } from './WarehouseTaskDetailDrawer';
import { CreateWarehouseTaskSheet } from './CreateWarehouseTaskSheet';

// Inventory #7 / F11 (Owner-approved) — Warehouse Task Management UI.
// Source of truth: GET /inventory/warehouse-tasks via the F17 contract
// (WarehouseTasksQueryDto) — supersedes WmsPage.tsx's old "tasks" tab,
// which fetched every putaway + replenishment task unbounded via two
// separate useWarehouseTasks(taskType) calls and had a broken assign
// button (called assignTask.mutate({ id, assignedTo: '' }) — an empty
// UUID, which fn_assign_warehouse_task would reject) and a confirm button
// gated on `task.confirmed_location_id`, a field that is never set before
// the task's first confirm — making confirm unreachable via that tab.
// Both are fixed here via the same real assign/confirm pattern already
// established for pick lists (F4) and waves (F8): a real user select for
// assign, and a real quantity + location select for confirm, in the
// detail drawer.
// WmsRepository (WarehouseTasksRepository.findAll) returns bare
// `warehouse_tasks.*` rows joined with `items(name)`/`warehouses(name)` —
// item/warehouse *names* come from that real join; assignee names still
// resolve via the existing bulk useUsers() list (same established
// precedent as F2's assignment column), never a fabricated join.

const STATUS_KEYS = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;
const TASK_TYPE_KEYS = ['putaway', 'replenishment'] as const;
const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;

const STATUS_TONE: Record<string, StatusTone> = {
  pending: 'neutral',
  assigned: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};
const PRIORITY_TONE: Record<string, StatusTone> = {
  low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger',
};

export function WarehouseTasksList() {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';

  const [warehouseId, setWarehouseId] = useState('');
  const [taskType, setTaskType] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const withPageReset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const setWarehouseIdReset = withPageReset(setWarehouseId);
  const setTaskTypeReset = withPageReset(setTaskType);
  const setStatusReset = withPageReset(setStatus);
  const setSortByReset = withPageReset(setSortBy);
  const setSortOrderReset = withPageReset(setSortOrder);
  const setPerPage = withPageReset(setPerPageState);

  const query: WarehouseTasksQuery = {
    warehouse_id: warehouseId || undefined,
    task_type: taskType || undefined,
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

  const { data: paged, isLoading, isFetching, isError } = usePagedWarehouseTasks(query);
  const tasks = paged?.data ?? [];
  const total = paged?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasActiveFilters = !!(warehouseId || taskType || status);

  const columns: Column<WarehouseTask>[] = [
    {
      key: 'id',
      header: t('tasks.columns.id'),
      render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    {
      key: 'taskType',
      header: t('tasks.columns.type'),
      render: (row) => translateEnum(t, 'tasks.type', TASK_TYPE_KEYS, row.task_type),
    },
    {
      key: 'item',
      header: t('tasks.columns.item'),
      render: (row) => row.items?.name ?? row.item_id.slice(0, 8),
    },
    {
      key: 'quantity',
      header: t('tasks.columns.quantity'),
      render: (row) => `${row.quantity_completed}/${row.quantity}`,
    },
    {
      key: 'status',
      header: t('tasks.columns.status'),
      render: (row) => <StatusBadge tone={STATUS_TONE[row.status] ?? 'neutral'} label={translateEnum(t, 'tasks.status', STATUS_KEYS, row.status)} />,
    },
    {
      key: 'priority',
      header: t('tasks.columns.priority'),
      render: (row) => <StatusBadge tone={PRIORITY_TONE[row.priority] ?? 'neutral'} label={translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, row.priority)} />,
    },
    {
      key: 'warehouse',
      header: t('tasks.columns.warehouse'),
      render: (row) => warehouseName(row.warehouse_id),
    },
    {
      key: 'assignedTo',
      header: t('tasks.columns.assignedTo'),
      render: (row) => userName(row.assigned_to) ?? (
        <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickLists.unassigned')}</span>
      ),
    },
    {
      key: 'createdAt',
      header: t('tasks.columns.createdAt'),
      render: (row) => formatDate(row.created_at, { locale, format: 'short' }),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseIdReset(e.target.value)}
            aria-label={t('tasks.filters.warehouse')}
            className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
          >
            <option value="">{t('tasks.filters.allWarehouses')}</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select
            value={taskType}
            onChange={(e) => setTaskTypeReset(e.target.value)}
            aria-label={t('tasks.filters.type')}
            className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
          >
            <option value="">{t('tasks.filters.allTypes')}</option>
            {TASK_TYPE_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'tasks.type', TASK_TYPE_KEYS, k)}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => setStatusReset(e.target.value)}
            aria-label={t('tasks.filters.status')}
            className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
          >
            <option value="">{t('tasks.filters.allStatuses')}</option>
            {STATUS_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'tasks.status', STATUS_KEYS, k)}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortByReset(e.target.value as 'created_at' | 'priority' | 'status')}
            aria-label={t('tasks.filters.sortBy')}
            className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
          >
            <option value="created_at">{t('tasks.filters.sortCreatedAt')}</option>
            <option value="priority">{t('tasks.filters.sortPriority')}</option>
            <option value="status">{t('tasks.filters.sortStatus')}</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrderReset(e.target.value as 'asc' | 'desc')}
            aria-label={t('tasks.filters.sortOrder')}
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
          {t('tasks.create.trigger')}
        </button>
      </div>

      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-posCloud-danger/30 bg-posCloud-danger-light dark:bg-posCloud-danger/15 px-3.5 py-2.5 text-[13px] text-posCloud-danger">
          {t('tasks.loadError')}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          keyExtractor={(row) => row.id}
          theme="dashboard"
          loading={isLoading}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyState={
            <EmptyState
              icon={ListTodo}
              theme="inventory"
              size="sm"
              title={hasActiveFilters ? t('tasks.emptyFilteredTitle') : t('tasks.emptyTitle')}
              description={hasActiveFilters ? t('tasks.emptyFilteredDescription') : t('tasks.emptyDescription')}
            />
          }
        />
      )}

      {!isError && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            <span>{t('tasks.count', { count: total })}</span>
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

      <WarehouseTaskDetailDrawer
        taskId={selectedId}
        open={!!selectedId}
        onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedId(null); }}
      />
      <CreateWarehouseTaskSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
