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
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useUsers } from '../../users/hooks/useUsers';
import { useWaveDetail, useWaveHistory, useEvaluateWave, useReleaseWave, useCancelWave } from '../hooks/useWms';
import { useWaveShipmentSummary } from '../hooks/useWmsDashboard';
import { translateEnum } from '../lib/enumTranslation';

// Inventory #7 / F7 (Owner-approved) — Wave Detail Drawer, read-only base.
// Source of truth: GET /inventory/wms/waves/:id (bare `waves.*` row — id,
// warehouse_id, status, criteria, cancellation_reason, created_by,
// created/updated/evaluated/released/completed/cancelled_at) plus one
// entity-scoped call: GET /wms/dashboard/wave-shipment-summary?wave_id=
// (fn_wms_wave_shipment_summary, migration 244) for the real per-wave
// eligible/excluded/failed_at_release breakdown and per-shipment list.
// History: GET /inventory/wms/waves/:id/history reads the exact same
// real warehouse_work_status_history rows the pick-list history endpoint
// reads (entity_type='wave' instead of 'pick_list', no new table).
// Warehouse/creator *names* are resolved via the existing bulk
// useWarehouses()/useUsers() lists (same precedent as F2/F3).
//
// Inventory #8 / F8 (Owner-approved) — Wave Operations. Adds the 3 real
// backend action endpoints audited against wms.controller.ts/wms.
// service.ts: evaluate (only from 'planning' — fn_evaluate_wave_
// eligibility raises otherwise), release (only from 'reviewing' —
// fn_release_wave, requires an optional priority), cancel (only from
// planning/evaluating/reviewing — fn_cancel_wave, migration 237,
// requires a non-empty reason). Status gating below only mirrors what
// the backend will already reject — it is not an independent business
// rule. No manual "mark completed" action exists (F7 gap closure already
// makes completion fully backend-authoritative); no separate "claim"
// action exists (claim is an atomic sub-step inside release).

const STATUS_KEYS = ['planning', 'evaluating', 'reviewing', 'released', 'picking', 'completed', 'cancelled'] as const;
const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;
const SHIPMENT_STATUS_KEYS = ['pending', 'picking', 'picked', 'packing', 'packed', 'shipped', 'cancelled'] as const;

const STATUS_TONE: Record<string, StatusTone> = {
  planning: 'neutral', evaluating: 'info', reviewing: 'warning', released: 'info',
  picking: 'info', completed: 'success', cancelled: 'danger',
};
const SHIPMENT_STATUS_TONE: Record<string, StatusTone> = {
  pending: 'neutral', picking: 'info', picked: 'info', packing: 'info', packed: 'info', shipped: 'success', cancelled: 'danger',
};

// Real criteria JSONB keys, verified against the actual eligibility
// evaluator (migrations 231/232) — never invented. Any key present in a
// wave's criteria that isn't in this list is still shown, via its raw
// key (the established safe-fallback pattern), never hidden or guessed.
const CRITERIA_KEYS = [
  'release_after', 'release_before', 'priority_min', 'zone_ids', 'route', 'carrier',
  'order_type', 'cutoff_before', 'require_inventory_ready',
  'require_replenishment_ready', 'capacity_ok', 'labor_available',
  'dock_ready', 'customer_service_level_ok',
] as const;
const BOOLEAN_CRITERIA_KEYS = new Set([
  'require_inventory_ready', 'require_replenishment_ready',
  'capacity_ok', 'labor_available', 'dock_ready', 'customer_service_level_ok',
]);
const DATE_CRITERIA_KEYS = new Set(['release_after', 'release_before', 'cutoff_before']);

// Inventory #9 / F9 (Owner-approved) — Wave Evaluation Review. Real
// wave_shipments.included_reason/excluded_reason JSONB keys, verified
// against the actual evaluator (migration 232's v_reasons assembly) —
// never invented. Exactly one of included_reason/excluded_reason is set
// per shipment (chk_wave_shipment_exactly_one_reason); both share this
// same key vocabulary since v_reasons is one accumulated object written
// to whichever column applies. A key present here that isn't in this
// list is still shown via its raw key (established safe-fallback), not
// hidden. The evaluator itself is the sole authority on which criteria
// actually caused exclusion — this UI never re-derives or guesses that;
// it only renders the exact real value/required pairs the RPC already
// computed, letting the supervisor see the comparison directly.
const REASON_KEYS = [
  'external_signal_blocked', 'priority', 'priority_min_required',
  'zone_ids_required', 'route', 'route_required', 'carrier', 'carrier_required',
  'order_type', 'order_type_required', 'cutoff_at', 'cutoff_before_required',
  'inventory_ready', 'replenishment_ready',
] as const;
const REASON_BOOLEAN_KEYS = new Set(['external_signal_blocked', 'inventory_ready', 'replenishment_ready']);
const REASON_DATE_KEYS = new Set(['cutoff_at', 'cutoff_before_required']);
const REASON_PRIORITY_KEYS = new Set(['priority', 'priority_min_required']);

interface Props {
  waveId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaveDetailDrawer({ waveId, open, onOpenChange }: Props) {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';

  const canFulfill = usePermission('inventory.fulfill');

  const detail = useWaveDetail(waveId, open);
  const summary = useWaveShipmentSummary(waveId, open);
  const history = useWaveHistory(waveId, open);
  const { data: warehouses = [] } = useWarehouses();
  const { data: users = [] } = useUsers();
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? id.slice(0, 8);
  const userName = (id: string | null) => (id ? (users.find((u) => u.id === id)?.name ?? id.slice(0, 8)) : null);

  // Evaluate: single-shot, no user input required — direct action, no
  // inline expand/dialog, matching how low-risk non-destructive actions
  // are handled elsewhere in this codebase.
  const evaluateMutation = useEvaluateWave();

  // Release: requires one input (priority) — inline expand, same
  // established pattern as PickListDetailDrawer's assign/reassign
  // control (F4), not a full ConfirmDialog since it isn't destructive.
  const [isReleasing, setIsReleasing] = useState(false);
  const [pendingPriority, setPendingPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const releaseMutation = useReleaseWave();

  // Cancel: destructive, requires a reason — same ConfirmDialog pattern
  // as PickListDetailDrawer's cancel (F5).
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonTouched, setCancelReasonTouched] = useState(false);
  const cancelMutation = useCancelWave();
  const cancelReasonError = cancelReasonTouched && cancelReason.trim().length === 0;

  const CANCELLABLE_STATUSES = ['planning', 'evaluating', 'reviewing'];

  // Inventory #9 / F9 (Owner-approved) — Wave Evaluation Review: one
  // shipment's reason detail expanded at a time, no new component, just
  // local toggle state over data already fetched by useWaveShipmentSummary.
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);
  const reasonValueLabel = (key: string, value: unknown): string => {
    if (REASON_BOOLEAN_KEYS.has(key)) {
      return String(value) === 'true' ? t('waves.criteria.yes') : t('waves.criteria.no');
    }
    if (REASON_PRIORITY_KEYS.has(key) && PRIORITY_KEYS.includes(String(value) as (typeof PRIORITY_KEYS)[number])) {
      return translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, String(value));
    }
    if (REASON_DATE_KEYS.has(key) && typeof value === 'string') {
      return formatDate(value, { locale, format: 'long' });
    }
    if (key === 'zone_ids_required' && Array.isArray(value)) {
      return value.map((v) => String(v).slice(0, 8)).join(', ');
    }
    return String(value);
  };

  const isNotFound = detail.error instanceof ApiError && detail.error.status === 404;
  const isForbidden = detail.error instanceof ApiError && detail.error.status === 403;
  const isOtherError = detail.isError && !isNotFound && !isForbidden;

  const wave = detail.data;
  const criteria = wave?.criteria ?? {};
  const criteriaEntries = Object.entries(criteria).filter(([, v]) => v !== null && v !== undefined && v !== '');
  const knownFirst = [...criteriaEntries].sort((a, b) => {
    const ai = CRITERIA_KEYS.indexOf(a[0] as (typeof CRITERIA_KEYS)[number]);
    const bi = CRITERIA_KEYS.indexOf(b[0] as (typeof CRITERIA_KEYS)[number]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const criteriaValueLabel = (key: string, value: unknown) => {
    if (BOOLEAN_CRITERIA_KEYS.has(key)) {
      return String(value) === 'true' ? t('waves.criteria.yes') : t('waves.criteria.no');
    }
    if (key === 'priority_min' && PRIORITY_KEYS.includes(String(value) as (typeof PRIORITY_KEYS)[number])) {
      return translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, String(value));
    }
    if (DATE_CRITERIA_KEYS.has(key) && typeof value === 'string') {
      return formatDate(value, { locale, format: 'long' });
    }
    if (key === 'zone_ids' && Array.isArray(value)) {
      return value.map((v) => String(v).slice(0, 8)).join(', ');
    }
    return String(value);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{wave ? t('waves.detail.title', { id: wave.id.slice(0, 8) }) : t('waves.detail.title', { id: '' })}</SheetTitle>
          <SheetDescription>{t('waves.detail.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {detail.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
            </div>
          )}

          {!detail.isLoading && isNotFound && (
            <EmptyState icon={AlertTriangle} title={t('waves.detail.notFound.title')} description={t('waves.detail.notFound.description')} theme="dashboard" size="md" />
          )}
          {!detail.isLoading && isForbidden && (
            <EmptyState icon={AlertTriangle} title={t('waves.detail.notFound.title')} description={t('waves.detail.notFound.description')} theme="dashboard" size="md" />
          )}
          {!detail.isLoading && isOtherError && (
            <EmptyState icon={AlertTriangle} title={t('waves.detail.error.title')} description={t('waves.detail.error.description')} theme="dashboard" size="md" />
          )}

          {!detail.isLoading && wave && (
            <>
              <SectionCard theme="dashboard">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <StatusBadge tone={STATUS_TONE[wave.status] ?? 'neutral'} label={translateEnum(t, 'waves.status', STATUS_KEYS, wave.status)} />
                  {canFulfill && (
                    <div className="flex items-center gap-2">
                      {wave.status === 'planning' && (
                        <button
                          type="button"
                          disabled={evaluateMutation.isPending}
                          onClick={() => {
                            evaluateMutation.mutate(wave.id, {
                              onSuccess: (rows) => {
                                const included = rows.filter((r) => r.included_reason !== null).length;
                                const excluded = rows.length - included;
                                toast.success(t('waves.detail.actions.evaluateSuccess', { included, excluded }));
                              },
                              onError: (err) => {
                                toast.error(err instanceof ApiError ? err.message : t('waves.detail.actions.evaluateError'));
                              },
                            });
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                        >
                          {evaluateMutation.isPending ? t('waves.detail.actions.evaluating') : t('waves.detail.actions.evaluate')}
                        </button>
                      )}
                      {wave.status === 'reviewing' && !isReleasing && (
                        <button
                          type="button"
                          onClick={() => { setPendingPriority('medium'); setIsReleasing(true); }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-[#0C447C] text-white hover:bg-[#0a3a6b]"
                        >
                          {t('waves.detail.actions.release')}
                        </button>
                      )}
                      {CANCELLABLE_STATUSES.includes(wave.status) && (
                        <button
                          type="button"
                          onClick={() => { setCancelReason(''); setCancelReasonTouched(false); setIsCancelDialogOpen(true); }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-posCloud-danger/30 text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15"
                        >
                          {t('waves.detail.actions.cancel')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isReleasing && (
                  <div className="flex items-center gap-2 flex-wrap mb-3 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-3">
                    <label className="text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary shrink-0">
                      {t('waves.detail.actions.releasePriority')}
                    </label>
                    <select
                      value={pendingPriority}
                      onChange={(e) => setPendingPriority(e.target.value as typeof pendingPriority)}
                      aria-label={t('waves.detail.actions.releasePriority')}
                      className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
                    >
                      {PRIORITY_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, k)}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={releaseMutation.isPending}
                      onClick={() => {
                        releaseMutation.mutate(
                          { id: wave.id, priority: pendingPriority },
                          {
                            onSuccess: (pickLists) => {
                              toast.success(t('waves.detail.actions.releaseSuccess', { count: pickLists.length }));
                              setIsReleasing(false);
                            },
                            onError: (err) => {
                              const message = err instanceof ApiError && err.message.includes('WAVE_NO_ELIGIBLE_SHIPMENTS')
                                ? t('waves.detail.actions.releaseNoEligible')
                                : err instanceof ApiError ? err.message : t('waves.detail.actions.releaseError');
                              toast.error(message);
                              // Not closed on error — the supervisor may want to retry the same priority.
                            },
                          },
                        );
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                    >
                      {releaseMutation.isPending ? t('waves.detail.actions.releasing') : t('waves.detail.actions.confirmRelease')}
                    </button>
                    <button
                      type="button"
                      disabled={releaseMutation.isPending}
                      onClick={() => setIsReleasing(false)}
                      className="text-xs px-3 py-1.5 rounded-lg text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background"
                    >
                      {t('waves.detail.actions.cancelRelease')}
                    </button>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.header.warehouse')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{warehouseName(wave.warehouse_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.header.createdBy')}</span>
                    <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{userName(wave.created_by) ?? t('waves.unknownActor')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.header.createdAt')}</span>
                    <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(wave.created_at, { locale, format: 'long' })}</span>
                  </div>
                  {wave.evaluated_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.header.evaluatedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(wave.evaluated_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                  {wave.released_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.header.releasedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(wave.released_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                  {wave.completed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.header.completedAt')}</span>
                      <span className="tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{formatDate(wave.completed_at, { locale, format: 'long' })}</span>
                    </div>
                  )}
                  {wave.status === 'cancelled' && wave.cancellation_reason && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0">{t('waves.detail.header.cancellationReason')}</span>
                      <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary text-end">{wave.cancellation_reason}</span>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title={t('waves.detail.summary.title')} theme="dashboard">
                {summary.isLoading ? (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-3">
                      <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.summary.eligible')}</span>
                      <span className="tabular-nums text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{summary.data?.eligible ?? 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-3">
                      <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.summary.excluded')}</span>
                      <span className="tabular-nums text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{summary.data?.excluded ?? 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-3">
                      <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.detail.summary.failedAtRelease')}</span>
                      <span className="tabular-nums text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{summary.data?.failed_at_release ?? 0}</span>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title={t('waves.detail.criteria.title')} theme="dashboard" padding="none">
                <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                  {knownFirst.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                      <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                        {(CRITERIA_KEYS as readonly string[]).includes(key) ? t(`waves.criteria.${key}`) : key}
                      </span>
                      <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary text-end">{criteriaValueLabel(key, value)}</span>
                    </div>
                  ))}
                  {knownFirst.length === 0 && (
                    <div className="px-5 py-6 text-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('waves.criteria.none')}</div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title={t('waves.detail.shipments.title')} theme="dashboard" padding="none">
                {summary.isLoading ? (
                  <div className="p-5 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                    {(summary.data?.shipments ?? []).map((s) => {
                      const reason = s.included_reason ?? s.excluded_reason;
                      const reasonEntries = reason ? Object.entries(reason).filter(([, v]) => v !== null && v !== undefined) : [];
                      const isExpanded = expandedShipmentId === s.shipment_id;
                      return (
                        <div key={s.shipment_id}>
                          <div className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                            <span className="font-mono text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary">{s.shipment_id.slice(0, 8)}</span>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                tone={s.included_reason ? 'success' : 'danger'}
                                label={s.included_reason ? t('waves.detail.shipments.eligible') : t('waves.detail.shipments.excluded')}
                              />
                              {s.claimed && <StatusBadge tone="success" label={t('waves.detail.shipments.claimed')} />}
                              <StatusBadge tone={SHIPMENT_STATUS_TONE[s.status] ?? 'neutral'} label={translateEnum(t, 'pickListDetail.shipments.status', SHIPMENT_STATUS_KEYS, s.status)} />
                              {reasonEntries.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedShipmentId(isExpanded ? null : s.shipment_id)}
                                  aria-expanded={isExpanded}
                                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-posCloud-primary/15 dark:text-posCloud-primary shrink-0"
                                >
                                  {isExpanded ? t('waves.detail.shipments.hideWhy') : t('waves.detail.shipments.showWhy')}
                                </button>
                              )}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-5 pb-3 -mt-1 space-y-1.5 bg-posCloud-background dark:bg-posCloudDark-background">
                              {reasonEntries.map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between text-xs gap-3">
                                  <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                                    {(REASON_KEYS as readonly string[]).includes(key) ? t(`waves.detail.shipments.reasons.${key}`) : key}
                                  </span>
                                  <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary text-end">{reasonValueLabel(key, value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(summary.data?.shipments ?? []).length === 0 && (
                      <div className="px-5 py-6 text-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('pickLists.notLinked')}</div>
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={t('pickListDetail.history.title')} theme="dashboard" padding="none">
                {history.isLoading ? (
                  <div className="p-5 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                  </div>
                ) : history.isError ? (
                  <div className="px-5 py-6 text-center text-sm text-posCloud-danger">{t('pickListDetail.error.title')}</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                    {(history.data ?? []).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                        <div className="min-w-0">
                          <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                            {t('pickListDetail.history.transition', {
                              from: entry.old_status ? translateEnum(t, 'waves.status', STATUS_KEYS, entry.old_status) : '—',
                              to: translateEnum(t, 'waves.status', STATUS_KEYS, entry.new_status),
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

    {wave && (
      <ConfirmDialog
        open={isCancelDialogOpen}
        onClose={() => { if (!cancelMutation.isPending) setIsCancelDialogOpen(false); }}
        onConfirm={() => {
          setCancelReasonTouched(true);
          if (cancelReason.trim().length === 0) return;
          cancelMutation.mutate(
            { id: wave.id, reason: cancelReason.trim() },
            {
              onSuccess: () => {
                toast.success(t('waves.detail.actions.cancelSuccess'));
                setIsCancelDialogOpen(false);
                setCancelReason('');
                setCancelReasonTouched(false);
              },
              onError: (err) => {
                const message = err instanceof ApiError ? err.message : t('waves.detail.actions.cancelWaveError');
                toast.error(message);
                // Reason is deliberately preserved on failure.
              },
            },
          );
        }}
        variant="danger"
        title={t('waves.detail.actions.cancelTitle')}
        message={
          <div className="text-start space-y-2">
            <p>{t('waves.detail.actions.cancelWarning')}</p>
            <div>
              <label htmlFor="wave-cancel-reason" className="block text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary mb-1">
                {t('waves.detail.actions.cancelReasonLabel')}
              </label>
              <textarea
                id="wave-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onBlur={() => setCancelReasonTouched(true)}
                disabled={cancelMutation.isPending}
                rows={3}
                aria-required="true"
                aria-invalid={cancelReasonError}
                aria-describedby={cancelReasonError ? 'wave-cancel-reason-error' : undefined}
                className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-danger"
                placeholder={t('waves.detail.actions.cancelReasonPlaceholder')}
              />
              {cancelReasonError && (
                <p id="wave-cancel-reason-error" className="text-xs text-posCloud-danger mt-1">{t('waves.detail.actions.cancelReasonRequired')}</p>
              )}
            </div>
          </div>
        }
        confirmLabel={t('waves.detail.actions.cancelConfirm')}
        cancelLabel={t('waves.detail.actions.cancelKeep')}
        loadingLabel={t('waves.detail.actions.cancelling')}
        isLoading={cancelMutation.isPending}
      />
    )}
    </>
  );
}
