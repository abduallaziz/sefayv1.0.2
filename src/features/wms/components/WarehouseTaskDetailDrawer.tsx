'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, ListChecks } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/shared/ui/sheet';
import { SectionCard } from '@/shared/ui/section-card';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { formatDate } from '@/lib/locale';
import { ApiError } from '@/lib/api';
import { usePermission } from '@/core/permissions/hooks/usePermission';
import { useUsers } from '../../users/hooks/useUsers';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { LocationSelect } from '../../locations/components/LocationSelect';
import {
  useWarehouseTaskDetail, useWarehouseTaskHistory, useAssignWarehouseTask, useConfirmWarehouseTask, useCancelWarehouseTask,
} from '../hooks/useWms';
import { translateEnum } from '../lib/enumTranslation';

// Inventory #7 / F11 (Owner-approved) — Warehouse Task Detail Drawer.
// Source of truth: GET /inventory/warehouse-tasks/:id (WarehouseTasksRepository.
// findById — bare warehouse_tasks row joined with items(name) only, no
// warehouses join at this endpoint, unlike the paged list; warehouse
// *name* is resolved client-side via the existing bulk useWarehouses()
// list, same established precedent as F2's assignment column) plus one
// entity-scoped call: /warehouse-tasks/:id/history
// (warehouse_work_status_history, entity_type='warehouse_task').
//
// Assign gating mirrors fn_assign_warehouse_task exactly (migration
// 223): only 'pending'/'assigned' may be (re)assigned. Confirm gating
// mirrors fn_confirm_warehouse_task exactly: only 'assigned'/'in_progress',
// and a replenishment task with no source_location_id is rejected
// server-side — this UI only hides the control for states it already
// knows will be rejected, the backend remains authoritative. Confirm
// supports partial quantities (quantity_completed accumulates across
// multiple confirms until it reaches quantity, matching the RPC's own
// v_new_status derivation) — never assumed to complete the task in one
// call. Cancel has no reason parameter (fn_cancel_warehouse_task takes
// none, unlike fn_cancel_pick_list/fn_cancel_wave), so this uses a plain
// ConfirmDialog with no textarea, not the reason-required variant.

const STATUS_KEYS = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;
const TASK_TYPE_KEYS = ['putaway', 'replenishment'] as const;
const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;

const STATUS_TONE: Record<string, StatusTone> = {
  pending: 'neutral', assigned: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
};
const PRIORITY_TONE: Record<string, StatusTone> = {
  low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger',
};

const ASSIGNABLE_STATUSES = ['pending', 'assigned'];
const CONFIRMABLE_STATUSES = ['assigned', 'in_progress'];
const CANCELLABLE_STATUSES = ['pending', 'assigned', 'in_progress'];

interface Props {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WarehouseTaskDetailDrawer({ taskId, open, onOpenChange }: Props) {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';
  const canManage = usePermission('warehouse.manage');
  const canApprove = usePermission('warehouse.approve');

  const detail = useWarehouseTaskDetail(taskId, open);
  const history = useWarehouseTaskHistory(taskId, open);
  const { data: users = [] } = useUsers();
  const { data: warehouses = [] } = useWarehouses();
  const userName = (id: string | null) => (id ? (users.find((u) => u.id === id)?.name ?? id.slice(0, 8)) : null);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id.slice(0, 8);

  const [isAssigning, setIsAssigning] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState('');
  const assignMutation = useAssignWarehouseTask();

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmQuantity, setConfirmQuantity] = useState('');
  const [confirmLocationId, setConfirmLocationId] = useState('');
  const confirmMutation = useConfirmWarehouseTask();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const cancelMutation = useCancelWarehouseTask();

  const isNotFound = detail.error instanceof ApiError && detail.error.status === 404;
  const isForbidden = detail.error instanceof ApiError && detail.error.status === 403;
  const isOtherError = detail.isError && !isNotFound && !isForbidden;

  const task = detail.data;
  const remainingQty = task ? task.quantity - task.quantity_completed : 0;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{task ? t('tasks.detail.title', { id: task.id.slice(0, 8) }) : t('tasks.detail.title', { id: '' })}</SheetTitle>
          <SheetDescription>{t('tasks.detail.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {detail.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
            </div>
          )}

          {!detail.isLoading && isNotFound && (
            <EmptyState icon={AlertTriangle} title={t('tasks.detail.notFound.title')} description={t('tasks.detail.notFound.description')} theme="dashboard" size="md" />
          )}
          {!detail.isLoading && isForbidden && (
            <EmptyState icon={AlertTriangle} title={t('tasks.detail.notFound.title')} description={t('tasks.detail.notFound.description')} theme="dashboard" size="md" />
          )}
          {!detail.isLoading && isOtherError && (
            <EmptyState icon={AlertTriangle} title={t('tasks.detail.error.title')} description={t('tasks.detail.error.description')} theme="dashboard" size="md" />
          )}

          {!detail.isLoading && task && (
            <>
              <SectionCard theme="dashboard">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral" label={translateEnum(t, 'tasks.type', TASK_TYPE_KEYS, task.task_type)} />
                    <StatusBadge tone={STATUS_TONE[task.status] ?? 'neutral'} label={translateEnum(t, 'tasks.status', STATUS_KEYS, task.status)} />
                    <StatusBadge tone={PRIORITY_TONE[task.priority] ?? 'neutral'} label={translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, task.priority)} />
                  </div>
                  {canManage && CANCELLABLE_STATUSES.includes(task.status) && (
                    <button
                      type="button"
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-posCloud-danger/30 text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15"
                    >
                      {t('tasks.detail.actions.cancel')}
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('tasks.columns.warehouse')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{warehouseName(task.warehouse_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('tasks.columns.item')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{task.items?.name ?? task.item_id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('tasks.detail.quantity')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{task.quantity_completed} / {task.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0">{t('tasks.columns.assignedTo')}</span>
                    {isAssigning ? (
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <select
                          value={pendingAssignee}
                          onChange={(e) => setPendingAssignee(e.target.value)}
                          aria-label={t('tasks.detail.assign.selectAssignee')}
                          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
                        >
                          <option value="">{t('tasks.detail.assign.selectAssignee')}</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button
                          type="button"
                          disabled={!pendingAssignee || assignMutation.isPending}
                          onClick={() => {
                            assignMutation.mutate(
                              { id: task.id, assignedTo: pendingAssignee },
                              {
                                onSuccess: () => {
                                  toast.success(t('tasks.detail.assign.success'));
                                  setIsAssigning(false);
                                  setPendingAssignee('');
                                },
                                onError: (err) => {
                                  toast.error(err instanceof ApiError ? err.message : t('tasks.detail.assign.error'));
                                },
                              },
                            );
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                        >
                          {assignMutation.isPending ? t('tasks.detail.assign.submitting') : t('tasks.detail.assign.confirm')}
                        </button>
                        <button
                          type="button"
                          disabled={assignMutation.isPending}
                          onClick={() => { setIsAssigning(false); setPendingAssignee(''); }}
                          className="text-xs px-3 py-1.5 rounded-lg text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background"
                        >
                          {t('tasks.detail.assign.cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{userName(task.assigned_to) ?? t('pickLists.unassigned')}</span>
                        {canManage && ASSIGNABLE_STATUSES.includes(task.status) && (
                          <button
                            type="button"
                            onClick={() => { setPendingAssignee(task.assigned_to ?? ''); setIsAssigning(true); }}
                            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-posCloud-primary/15 dark:text-posCloud-primary"
                          >
                            {task.assigned_to ? t('tasks.detail.assign.reassign') : t('tasks.detail.assign.assign')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('tasks.columns.createdAt')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(task.created_at, { locale, format: 'long' })}</span>
                  </div>
                  {task.started_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.startedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(task.started_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                  {task.completed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.completedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(task.completed_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                </div>
              </SectionCard>

              {canApprove && CONFIRMABLE_STATUSES.includes(task.status) && (
                <SectionCard title={t('tasks.detail.confirm.title')} theme="dashboard">
                  {isConfirming ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.detail.confirm.quantity', { remaining: remainingQty })}</label>
                        <input
                          type="number"
                          min={0.0001}
                          max={remainingQty}
                          step="any"
                          value={confirmQuantity}
                          onChange={(e) => setConfirmQuantity(e.target.value)}
                          className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.detail.confirm.location')}</label>
                        <LocationSelect
                          warehouseId={task.warehouse_id}
                          value={confirmLocationId}
                          onChange={setConfirmLocationId}
                          className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!confirmQuantity || Number(confirmQuantity) <= 0 || Number(confirmQuantity) > remainingQty || !confirmLocationId || confirmMutation.isPending}
                          onClick={() => {
                            confirmMutation.mutate(
                              { id: task.id, quantity: Number(confirmQuantity), locationId: confirmLocationId },
                              {
                                onSuccess: () => {
                                  toast.success(t('tasks.detail.confirm.success'));
                                  setIsConfirming(false);
                                  setConfirmQuantity('');
                                  setConfirmLocationId('');
                                },
                                onError: (err) => {
                                  toast.error(err instanceof ApiError ? err.message : t('tasks.detail.confirm.error'));
                                },
                              },
                            );
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                        >
                          {confirmMutation.isPending ? t('tasks.detail.confirm.submitting') : t('tasks.detail.confirm.confirm')}
                        </button>
                        <button
                          type="button"
                          disabled={confirmMutation.isPending}
                          onClick={() => { setIsConfirming(false); setConfirmQuantity(''); setConfirmLocationId(''); }}
                          className="text-xs px-3 py-1.5 rounded-lg text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background"
                        >
                          {t('tasks.detail.assign.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setConfirmQuantity(String(remainingQty)); setConfirmLocationId(task.suggested_location_id ?? ''); setIsConfirming(true); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white hover:bg-[#0a3a6b]"
                    >
                      {t('tasks.detail.confirm.action')}
                    </button>
                  )}
                </SectionCard>
              )}

              <SectionCard title={t('tasks.detail.history.title')} theme="dashboard" padding="none">
                {history.isLoading ? (
                  <div className="p-5 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                    {(history.data ?? []).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                        <div className="min-w-0">
                          <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                            {t('pickListDetail.history.transition', {
                              from: entry.old_status ? translateEnum(t, 'tasks.status', STATUS_KEYS, entry.old_status) : '—',
                              to: translateEnum(t, 'tasks.status', STATUS_KEYS, entry.new_status),
                            })}
                          </p>
                          <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                            {userName(entry.actor_id) ?? t('pickListDetail.history.unknownActor')}
                          </p>
                        </div>
                        <span className="tabular-nums text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0">
                          {formatDate(entry.created_at, { locale, format: 'long' })}
                        </span>
                      </div>
                    ))}
                    {(history.data ?? []).length === 0 && (
                      <div className="px-5 py-6 text-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        <EmptyState icon={ListChecks} theme="inventory" size="sm" title={t('pickListDetail.history.empty')} />
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>

    {task && (
      <ConfirmDialog
        open={isCancelDialogOpen}
        onClose={() => { if (!cancelMutation.isPending) setIsCancelDialogOpen(false); }}
        onConfirm={() => {
          cancelMutation.mutate(task.id, {
            onSuccess: () => {
              toast.success(t('tasks.detail.cancel.success'));
              setIsCancelDialogOpen(false);
            },
            onError: (err) => {
              toast.error(err instanceof ApiError ? err.message : t('tasks.detail.cancel.error'));
            },
          });
        }}
        variant="danger"
        title={t('tasks.detail.cancel.title')}
        message={t('tasks.detail.cancel.warning')}
        confirmLabel={t('tasks.detail.cancel.confirm')}
        cancelLabel={t('tasks.detail.cancel.keep')}
        loadingLabel={t('tasks.detail.cancel.cancelling')}
        isLoading={cancelMutation.isPending}
      />
    )}
    </>
  );
}
