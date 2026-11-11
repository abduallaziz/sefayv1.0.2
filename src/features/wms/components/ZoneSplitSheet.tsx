'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/shared/ui/sheet';
import { SectionCard } from '@/shared/ui/section-card';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { EmptyState } from '@/shared/ui/empty-state';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatDate } from '@/lib/locale';
import { ApiError } from '@/lib/api';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { usePagedShipments, useCreateZoneSplitPickLists } from '../hooks/useWms';
import { ZoneSplitPickList } from '../types/wms.types';
import { translateEnum } from '../lib/enumTranslation';
import { PickListDetailDrawer } from './PickListDetailDrawer';

// Inventory #7 / F6 (Owner-approved) — Zone Split Creation UI.
// Source of truth: POST /inventory/wms/pick-lists/zone-split ->
// fn_create_zone_pick_lists_for_shipments (migration 229). No
// zone_location_id/strategy input — the backend discovers every real zone
// represented among the selected shipments' lines and creates one 'zone'
// pick list per zone automatically; this UI only selects warehouse +
// shipments (via the existing F17-paged shipments endpoint, reused from
// F2's exact pattern) and shows the real backend result. It does NOT
// predict how many pick lists will be created, does NOT compute zone
// membership client-side, and does NOT re-fetch/re-render each created
// pick list's lines/shipments here — each result row links into the
// existing F3 PickListDetailDrawer for that (already correct, already
// RTL-fixed) detail view instead of duplicating it.

const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;
const SHIPMENT_STATUS_KEYS = ['pending', 'picking', 'picked', 'packing', 'packed', 'shipped', 'cancelled'] as const;
const PRIORITY_TONE: Record<string, StatusTone> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWarehouseId?: string;
}

export function ZoneSplitSheet({ open, onOpenChange, initialWarehouseId }: Props) {
  const t = useTranslations('wms');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';

  const { data: warehouses = [] } = useWarehouses();
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ZoneSplitPickList[] | null>(null);
  const [resultDetailId, setResultDetailId] = useState<string | null>(null);

  const shipments = usePagedShipments(
    { status: 'pending', warehouse_id: warehouseId, page, limit: 20, sortBy: 'created_at', sortOrder: 'desc' },
    open && !!warehouseId && !result,
  );
  const splitMutation = useCreateZoneSplitPickLists();

  const rows = shipments.data?.data ?? [];
  const total = shipments.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setWarehouseId(initialWarehouseId ?? '');
    setSelectedIds(new Set());
    setPriority('medium');
    setPage(1);
    setResult(null);
    setResultDetailId(null);
  };

  const handleClose = () => {
    if (splitMutation.isPending) return;
    onOpenChange(false);
    reset();
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0 || !warehouseId || splitMutation.isPending) return;
    splitMutation.mutate(
      { warehouse_id: warehouseId, shipment_ids: Array.from(selectedIds), priority },
      {
        onSuccess: (created) => {
          setResult(created);
          toast.success(t('zoneSplit.success', { count: created.length }));
        },
        onError: (err) => {
          const message = err instanceof ApiError && err.message.includes('ZONE_SPLIT_NO_RESOLVABLE_ZONE')
            ? t('zoneSplit.noResolvableZone')
            : err instanceof ApiError ? err.message : t('zoneSplit.error');
          toast.error(message);
          // Selection is deliberately preserved on failure — nothing was
          // claimed/created (the RPC rejects atomically before any
          // shipment state change), so retrying with the same selection
          // after fixing the underlying issue is a valid next step.
        },
      },
    );
  };

  return (
    <>
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('zoneSplit.title')}</SheetTitle>
          <SheetDescription>{t('zoneSplit.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {result ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-posCloud-success/30 bg-posCloud-success-light dark:bg-posCloud-success/15 px-3.5 py-2.5 text-[13px] text-posCloud-success">
                <CheckCircle2 size={16} />
                <span>{t('zoneSplit.success', { count: result.length })}</span>
              </div>
              <SectionCard title={t('zoneSplit.resultTitle')} theme="dashboard" padding="none">
                <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                  {result.map((pl) => (
                    <div key={pl.id} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                      <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary">{pl.id.slice(0, 8)}</span>
                        <StatusBadge tone="neutral" label={translateEnum(t, 'dashboard.strategies', ['single', 'batch', 'zone', 'wave'] as const, pl.strategy)} />
                        <StatusBadge tone={PRIORITY_TONE[pl.priority] ?? 'neutral'} label={translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, pl.priority)} />
                        <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                          {t('zoneSplit.zoneLabel', { id: pl.zone_location_id.slice(0, 8) })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResultDetailId(pl.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-posCloud-primary/15 dark:text-posCloud-primary shrink-0"
                      >
                        {t('zoneSplit.viewDetail')}
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-posCloud-primary hover:underline"
              >
                {t('zoneSplit.splitMore')}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('zoneSplit.warehouse')}</label>
                <select
                  value={warehouseId}
                  onChange={(e) => { setWarehouseId(e.target.value); setSelectedIds(new Set()); setPage(1); }}
                  className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
                >
                  <option value="">{t('zoneSplit.selectWarehouse')}</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              {warehouseId && (
                <>
                  <SectionCard title={t('zoneSplit.selectShipments')} theme="dashboard" padding="none">
                    {shipments.isLoading ? (
                      <div className="p-5 text-center text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('zoneSplit.loading')}</div>
                    ) : rows.length === 0 ? (
                      <EmptyState icon={AlertTriangle} theme="inventory" size="sm" title={t('zoneSplit.noPendingShipments')} />
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-posCloudDark-border">
                        {rows.map((s) => (
                          <label key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm cursor-pointer hover:bg-posCloud-background dark:hover:bg-posCloudDark-background">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(s.id)}
                              onChange={() => toggleSelected(s.id)}
                              className="shrink-0"
                              aria-label={t('zoneSplit.selectShipment', { id: s.id.slice(0, 8) })}
                            />
                            <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-mono text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary">{s.id.slice(0, 8)}</p>
                                <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                                  {t('zoneSplit.lineCount', { count: s.lines?.length ?? 0 })} · {formatDate(s.created_at, { locale, format: 'short' })}
                                </p>
                              </div>
                              <StatusBadge tone="neutral" label={translateEnum(t, 'pickListDetail.shipments.status', SHIPMENT_STATUS_KEYS, s.status)} />
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  {totalPages > 1 && (
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      {t('zoneSplit.selectedCount', { count: selectedIds.size })}
                    </span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as typeof priority)}
                      aria-label={t('pickListDetail.summary.title')}
                      className="text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
                    >
                      {PRIORITY_KEYS.map((k) => (
                        <option key={k} value={k}>{translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, k)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3.5 py-2.5 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {t('zoneSplit.explainer')}
                  </div>

                  <button
                    type="button"
                    disabled={selectedIds.size === 0 || splitMutation.isPending}
                    onClick={handleSubmit}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
                  >
                    {splitMutation.isPending ? t('zoneSplit.creating') : t('zoneSplit.confirm')}
                  </button>
                </>
              )}
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>

    <PickListDetailDrawer
      pickListId={resultDetailId}
      open={!!resultDetailId}
      onOpenChange={(next) => { if (!next) setResultDetailId(null); }}
    />
    </>
  );
}
