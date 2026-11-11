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
import {
  usePickListDetail, usePickListHistory, usePickListShipments, useAssignPickList, useCancelPickList,
} from '../hooks/useWms';
import { translateEnum } from '../lib/enumTranslation';

// Inventory #7 / F3 (Owner-approved) — Pick List Detail Drawer.
// Source of truth: GET /inventory/wms/pick-lists/:id (same fields already
// used by F2's list row — id, strategy, status, priority, warehouse_id,
// zone_location_id, wave_id, assigned_to, created_by, cancellation_reason,
// created_at/updated_at/started_at/completed_at, warehouses{name,code},
// shipments[{shipment_id}], lines[{...,items{name,sku},exception_quantity}]),
// plus one entity-scoped call: /pick-lists/:id/history
// (warehouse_work_status_history). Per-line exception_quantity (F3
// residual fix) is a server-side aggregate already embedded in the detail
// response by WmsRepository.findPickListById — one bounded extra query on
// the backend (IN over this pick list's own line ids), not N requests from
// here and not client-side computation of an authoritative total. Location/
// variant *names* are still not available from these endpoints (no join) —
// shown via their real raw id (never fabricated), same precedent as F2's
// wave/zone columns.

const STATUS_KEYS = ['open', 'in_progress', 'completed', 'cancelled'] as const;
const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;
const STRATEGY_KEYS = ['single', 'batch', 'zone', 'wave'] as const;
const SHIPMENT_STATUS_KEYS = ['pending', 'picking', 'picked', 'packing', 'packed', 'shipped', 'cancelled'] as const;

const STATUS_TONE: Record<string, StatusTone> = {
  open: 'neutral', in_progress: 'info', completed: 'success', cancelled: 'danger',
};
const PRIORITY_TONE: Record<string, StatusTone> = {
  low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger',
};
const SHIPMENT_STATUS_TONE: Record<string, StatusTone> = {
  pending: 'neutral', picking: 'info', picked: 'info', packing: 'info', packed: 'info', shipped: 'success', cancelled: 'danger',
};

interface Props {
  pickListId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PickListDetailDrawer({ pickListId, open, onOpenChange }: Props) {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';
  const canFulfill = usePermission('inventory.fulfill');

  const detail = usePickListDetail(pickListId, open);
  const history = usePickListHistory(pickListId, open);
  const shipmentQueries = usePickListShipments(detail.data, open);
  const { data: users = [] } = useUsers();
  const userName = (id: string | null) => (id ? (users.find((u) => u.id === id)?.name ?? id.slice(0, 8)) : null);

  // Inventory #7 / F4 (Owner-approved) — inline assign/reassign, same
  // established pattern as AssignBranchOwnerSheet.tsx (select + confirm +
  // toast, no optimistic assignee). Status gating mirrors
  // fn_assign_pick_list exactly (migration 226): only 'open'/'in_progress'
  // may be (re)assigned — the backend remains authoritative; this only
  // hides the control for statuses it already knows will be rejected.
  const [isAssigning, setIsAssigning] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState('');
  const assignMutation = useAssignPickList();
  const ASSIGNABLE_STATUSES = ['open', 'in_progress'];

  // Inventory #7 / F5 (Owner-approved) — cancel, same established
  // destructive-action pattern as CancelPurchaseOrderModal/CancelTransferModal
  // (ConfirmDialog, danger variant), extended with a reason field since
  // fn_cancel_pick_list (migration 226) requires a non-empty reason
  // server-side too. Status gating is the SAME set as assign
  // (ASSIGNABLE_STATUSES) — fn_cancel_pick_list uses the identical
  // `status NOT IN ('open','in_progress')` guard.
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonTouched, setCancelReasonTouched] = useState(false);
  const cancelMutation = useCancelPickList();
  const cancelReasonError = cancelReasonTouched && cancelReason.trim().length === 0;

  const isNotFound = detail.error instanceof ApiError && detail.error.status === 404;
  const isForbidden = detail.error instanceof ApiError && detail.error.status === 403;
  const isOtherError = detail.isError && !isNotFound && !isForbidden;

  const pl = detail.data;
  const lines = pl?.lines ?? [];
  const shipments = pl?.shipments ?? [];
  const requestedQty = lines.reduce((sum, l) => sum + l.quantity_to_pick, 0);
  const pickedQty = lines.reduce((sum, l) => sum + l.quantity_picked, 0);
  // Reconciliation identity: requested = picked + exception + remaining.
  // exceptionQty is a straight sum of the server-provided per-line
  // aggregate (never recomputed as an authoritative total client-side);
  // remainingQty is derived to make the identity hold exactly.
  const exceptionQty = lines.reduce((sum, l) => sum + (l.exception_quantity ?? 0), 0);
  const remainingQty = requestedQty - pickedQty - exceptionQty;

  const lineState = (requested: number, picked: number, exceptionQuantity: number) => {
    if (picked <= 0 && exceptionQuantity <= 0) return 'notStarted';
    if (picked + exceptionQuantity >= requested) return 'complete';
    return 'partial';
  };
  const lineStateTone: Record<string, StatusTone> = { notStarted: 'neutral', partial: 'warning', complete: 'success' };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{pl ? t('pickListDetail.title', { id: pl.id.slice(0, 8) }) : t('pickListDetail.title', { id: '' })}</SheetTitle>
          <SheetDescription>{t('pickListDetail.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {detail.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
            </div>
          )}

          {!detail.isLoading && isNotFound && (
            <EmptyState icon={AlertTriangle} title={t('pickListDetail.notFound.title')} description={t('pickListDetail.notFound.description')} theme="dashboard" size="md" />
          )}
          {!detail.isLoading && isForbidden && (
            <EmptyState icon={AlertTriangle} title={t('pickListDetail.notFound.title')} description={t('pickListDetail.notFound.description')} theme="dashboard" size="md" />
          )}
          {!detail.isLoading && isOtherError && (
            <EmptyState icon={AlertTriangle} title={t('pickListDetail.error.title')} description={t('pickListDetail.error.description')} theme="dashboard" size="md" />
          )}

          {!detail.isLoading && pl && (
            <>
              <SectionCard theme="dashboard">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral" label={translateEnum(t, 'dashboard.strategies', STRATEGY_KEYS, pl.strategy)} />
                    <StatusBadge tone={STATUS_TONE[pl.status] ?? 'neutral'} label={translateEnum(t, 'pickLists.status', STATUS_KEYS, pl.status)} />
                    <StatusBadge tone={PRIORITY_TONE[pl.priority] ?? 'neutral'} label={translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, pl.priority)} />
                  </div>
                  {canFulfill && ASSIGNABLE_STATUSES.includes(pl.status) && (
                    <button
                      type="button"
                      onClick={() => { setCancelReason(''); setCancelReasonTouched(false); setIsCancelDialogOpen(true); }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-posCloud-danger/30 text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15"
                    >
                      {t('pickListDetail.cancel.action')}
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.warehouse')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{pl.warehouses?.name ?? pl.warehouse_id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0">{t('pickListDetail.header.assignedTo')}</span>
                    {isAssigning ? (
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <select
                          value={pendingAssignee}
                          onChange={(e) => setPendingAssignee(e.target.value)}
                          aria-label={t('pickListDetail.assign.selectAssignee')}
                          className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
                        >
                          <option value="">{t('pickListDetail.assign.selectAssignee')}</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button
                          type="button"
                          disabled={!pendingAssignee || assignMutation.isPending}
                          onClick={() => {
                            assignMutation.mutate(
                              { id: pl.id, assignedTo: pendingAssignee },
                              {
                                onSuccess: () => {
                                  toast.success(t('pickListDetail.assign.success'));
                                  setIsAssigning(false);
                                  setPendingAssignee('');
                                },
                                onError: (err) => {
                                  const message = err instanceof ApiError ? err.message : t('pickListDetail.assign.error');
                                  toast.error(message);
                                },
                              },
                            );
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                        >
                          {assignMutation.isPending ? t('pickListDetail.assign.submitting') : t('pickListDetail.assign.confirm')}
                        </button>
                        <button
                          type="button"
                          disabled={assignMutation.isPending}
                          onClick={() => { setIsAssigning(false); setPendingAssignee(''); }}
                          className="text-xs px-3 py-1.5 rounded-lg text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background"
                        >
                          {t('pickListDetail.assign.cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{userName(pl.assigned_to) ?? t('pickLists.unassigned')}</span>
                        {canFulfill && ASSIGNABLE_STATUSES.includes(pl.status) && (
                          <button
                            type="button"
                            onClick={() => { setPendingAssignee(pl.assigned_to ?? ''); setIsAssigning(true); }}
                            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-posCloud-primary/15 dark:text-posCloud-primary"
                          >
                            {pl.assigned_to ? t('pickListDetail.assign.reassign') : t('pickListDetail.assign.assign')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.createdAt')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(pl.created_at, { locale, format: 'long' })}</span>
                  </div>
                  {pl.started_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.startedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(pl.started_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                  {pl.completed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.completedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(pl.completed_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                  {pl.status === 'cancelled' && pl.cancellation_reason && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.header.cancellationReason')}</span>
                      <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{pl.cancellation_reason}</span>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title={t('pickListDetail.summary.title')} theme="dashboard">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.summary.shipments')}</span><span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{shipments.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.summary.lines')}</span><span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{lines.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.summary.requestedQty')}</span><span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{requestedQty}</span></div>
                  <div className="flex items-center justify-between"><span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.summary.pickedQty')}</span><span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{pickedQty}</span></div>
                  <div className="flex items-center justify-between"><span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.summary.remainingQty')}</span><span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{remainingQty}</span></div>
                  <div className="flex items-center justify-between"><span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickListDetail.summary.exceptionQty')}</span><span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{exceptionQty}</span></div>
                </div>
              </SectionCard>

              <SectionCard title={t('pickListDetail.lines.title')} theme="dashboard" padding="none">
                <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                  {lines.map((line) => {
                    const lineException = line.exception_quantity ?? 0;
                    const lineRemaining = line.quantity_to_pick - line.quantity_picked - lineException;
                    const state = lineState(line.quantity_to_pick, line.quantity_picked, lineException);
                    return (
                      <div key={line.id} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                        <div className="min-w-0">
                          <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{line.items?.name ?? line.item_id.slice(0, 8)}</p>
                          <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-mono">
                            {line.location_id ? line.location_id.slice(0, 8) : t('pickListDetail.lines.noLocation')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 tabular-nums text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                          <span>{t('pickListDetail.lines.requested')} {line.quantity_to_pick}</span>
                          <span>{t('pickListDetail.lines.picked')} {line.quantity_picked}</span>
                          {lineException > 0 && <span className="text-posCloud-danger">{t('pickListDetail.lines.exception')} {lineException}</span>}
                          <span>{t('pickListDetail.lines.remaining')} {lineRemaining}</span>
                          <StatusBadge tone={lineStateTone[state]} label={t(`pickListDetail.lines.${state}`)} />
                        </div>
                      </div>
                    );
                  })}
                  {lines.length === 0 && (
                    <div className="px-5 py-6 text-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickLists.notLinked')}</div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title={t('pickListDetail.shipments.title')} theme="dashboard" padding="none">
                <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                  {shipmentQueries.map((q, i) => {
                    const s = q.data;
                    const shipmentId = shipments[i]?.shipment_id ?? '';
                    return (
                      <div key={shipmentId} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                        <span className="font-mono text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary">{shipmentId.slice(0, 8)}</span>
                        {q.isLoading ? (
                          <Skeleton className="h-5 w-16 rounded-full" />
                        ) : s ? (
                          <StatusBadge tone={SHIPMENT_STATUS_TONE[s.status] ?? 'neutral'} label={translateEnum(t, 'pickListDetail.shipments.status', SHIPMENT_STATUS_KEYS, s.status)} />
                        ) : (
                          <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">{t('pickListDetail.error.title')}</span>
                        )}
                      </div>
                    );
                  })}
                  {shipments.length === 0 && (
                    <div className="px-5 py-6 text-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickLists.notLinked')}</div>
                  )}
                </div>
              </SectionCard>

              <div className="grid grid-cols-2 gap-3">
                <SectionCard title={t('pickListDetail.wave.title')} theme="dashboard">
                  <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    {pl.wave_id ? t('pickListDetail.wave.linked', { id: pl.wave_id.slice(0, 8) }) : t('pickListDetail.wave.none')}
                  </p>
                </SectionCard>
                <SectionCard title={t('pickListDetail.zone.title')} theme="dashboard">
                  <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
                    {pl.zone_location_id ? t('pickListDetail.zone.linked', { id: pl.zone_location_id.slice(0, 8) }) : t('pickListDetail.zone.none')}
                  </p>
                </SectionCard>
              </div>

              <SectionCard title={t('pickListDetail.history.title')} theme="dashboard" padding="none">
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
                              from: entry.old_status ? translateEnum(t, 'pickLists.status', STATUS_KEYS, entry.old_status) : '—',
                              to: translateEnum(t, 'pickLists.status', STATUS_KEYS, entry.new_status),
                            })}
                          </p>
                          <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                            {userName(entry.actor_id) ?? t('pickListDetail.history.unknownActor')}
                            {entry.notes ? ` — ${entry.notes}` : ''}
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

    {pl && (
      <ConfirmDialog
        open={isCancelDialogOpen}
        onClose={() => { if (!cancelMutation.isPending) setIsCancelDialogOpen(false); }}
        onConfirm={() => {
          setCancelReasonTouched(true);
          if (cancelReason.trim().length === 0) return;
          cancelMutation.mutate(
            { id: pl.id, reason: cancelReason.trim() },
            {
              onSuccess: () => {
                toast.success(t('pickListDetail.cancel.success'));
                setIsCancelDialogOpen(false);
                setCancelReason('');
                setCancelReasonTouched(false);
              },
              onError: (err) => {
                const message = err instanceof ApiError ? err.message : t('pickListDetail.cancel.error');
                toast.error(message);
                // Reason is deliberately preserved on failure — the user
                // shouldn't have to retype it after a transient error.
              },
            },
          );
        }}
        variant="danger"
        title={t('pickListDetail.cancel.title')}
        message={
          <div className="text-start space-y-2">
            <p>{t('pickListDetail.cancel.warning')}</p>
            <div>
              <label htmlFor="pick-list-cancel-reason" className="block text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary mb-1">
                {t('pickListDetail.cancel.reasonLabel')}
              </label>
              <textarea
                id="pick-list-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onBlur={() => setCancelReasonTouched(true)}
                disabled={cancelMutation.isPending}
                rows={3}
                aria-required="true"
                aria-invalid={cancelReasonError}
                aria-describedby={cancelReasonError ? 'pick-list-cancel-reason-error' : undefined}
                className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-danger"
                placeholder={t('pickListDetail.cancel.reasonPlaceholder')}
              />
              {cancelReasonError && (
                <p id="pick-list-cancel-reason-error" className="text-xs text-posCloud-danger mt-1">{t('pickListDetail.cancel.reasonRequired')}</p>
              )}
            </div>
          </div>
        }
        confirmLabel={t('pickListDetail.cancel.confirm')}
        cancelLabel={t('pickListDetail.cancel.keep')}
        loadingLabel={t('pickListDetail.cancel.cancelling')}
        isLoading={cancelMutation.isPending}
      />
    )}
    </>
  );
}
