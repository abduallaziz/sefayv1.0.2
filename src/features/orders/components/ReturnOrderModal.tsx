'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Minus, Plus, Undo2, X } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { Order } from '../types/order.types';
import { returnsApi, ReturnLineInput } from '../api/returns.api';

interface Props {
  order: Order | null;
  onClose: () => void;
}

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

// Partial return (owner decision 2026-11-09): pick the lines and quantities,
// the server works out the refund (share of the order's net and tax) and
// pays it out: cash from the CURRENT open register, anything else back to
// the original payment method.
export function ReturnOrderModal({ order, onClose }: Props) {
  const t = useTranslations('orders');
  const currency = useCurrencyDisplay();
  const qc = useQueryClient();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  const orderId = order?.id ?? '';
  const { data: info, isLoading } = useQuery({
    queryKey: ['order-returns', orderId],
    queryFn: () => returnsApi.getInfo(orderId),
    enabled: !!orderId,
    staleTime: 0,
  });

  const lines: ReturnLineInput[] = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([order_item_id, quantity]) => ({ order_item_id, quantity })),
    [qty],
  );

  // Live preview of what will be refunded (dry run on the server: the same
  // calculation the real return uses).
  const preview = useQuery({
    queryKey: ['order-return-preview', orderId, lines],
    queryFn: () => returnsApi.preview(orderId, { items: lines }),
    enabled: !!orderId && lines.length > 0,
    retry: false,
    staleTime: 0,
  });

  const submit = useMutation({
    mutationFn: () => returnsApi.create(orderId, { items: lines, reason: reason.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('returns.done'));
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['shifts'] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e, t('returns.failed'))),
  });

  useEffect(() => {
    if (!order) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && !submit.isPending && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [order, submit.isPending, onClose]);

  if (!order) return null;

  const change = (id: string, delta: number, max: number) =>
    setQty((prev) => {
      const next = Math.min(max, Math.max(0, (prev[id] ?? 0) + delta));
      return { ...prev, [id]: next };
    });

  const canSubmit = lines.length > 0 && !!preview.data && !preview.isError && !submit.isPending;
  const methodLabel = (m: string) => t(`payment_method.${m}` as Parameters<typeof t>[0]);

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={() => !submit.isPending && onClose()} />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
            <Undo2 size={17} /> {t('returns.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('back')}
            className="p-1 rounded-md text-posCloud-text-tertiary hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm">
          {isLoading && <p className="text-center text-posCloud-text-tertiary">{t('loading')}</p>}

          {info && (
            <>
              <ul className="divide-y divide-posCloud-border dark:divide-posCloudDark-border rounded-lg border border-posCloud-border dark:border-posCloudDark-border">
                {info.items.map((it) => {
                  const q = qty[it.order_item_id] ?? 0;
                  return (
                    <li key={it.order_item_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">
                          {it.item_name}
                        </div>
                        <div className="text-xs text-posCloud-text-tertiary tabular-nums">
                          {formatCurrency(it.unit_value, currency)} · {t('returns.available')}: {it.returnable_quantity}/{it.quantity}
                        </div>
                      </div>
                      {it.returnable_quantity > 0 ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => change(it.order_item_id, -1, it.returnable_quantity)}
                            disabled={q <= 0}
                            aria-label={t('returns.less')}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-posCloud-border dark:border-posCloudDark-border disabled:opacity-40"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-6 text-center tabular-nums font-semibold">{q}</span>
                          <button
                            type="button"
                            onClick={() => change(it.order_item_id, 1, it.returnable_quantity)}
                            disabled={q >= it.returnable_quantity}
                            aria-label={t('returns.more')}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-posCloud-border dark:border-posCloudDark-border disabled:opacity-40"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-posCloud-text-tertiary shrink-0">{t('returns.fullyReturned')}</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div>
                <label className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary block mb-1">
                  {t('cancel.reason')}{' '}
                  <span className="text-posCloud-text-tertiary font-normal">{t('cancel.reasonOptional')}</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('returns.reasonPlaceholder')}
                  rows={2}
                  className="w-full border border-posCloud-border dark:border-posCloudDark-border rounded-lg px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-primary resize-none"
                />
              </div>

              {lines.length > 0 && (
                <div className="rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-3 space-y-1.5">
                  {preview.isError ? (
                    <p className="text-posCloud-danger text-xs">{errorMessage(preview.error, t('returns.failed'))}</p>
                  ) : preview.data ? (
                    <>
                      <Row label={t('returns.net')} value={formatCurrency(preview.data.net_amount, currency)} />
                      <Row label={t('returns.tax')} value={formatCurrency(preview.data.tax_amount, currency)} />
                      <div className="flex items-center justify-between border-t border-posCloud-border dark:border-posCloudDark-border pt-1.5 font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                        <span>{t('returns.refund')}</span>
                        <span dir="ltr">{formatCurrency(preview.data.refund_total, currency)}</span>
                      </div>
                      <p className="text-xs text-posCloud-text-tertiary">
                        {preview.data.refund_cash > 0 && (
                          <>
                            {t('returns.cashFromRegister')}: {formatCurrency(preview.data.refund_cash, currency)}
                          </>
                        )}
                        {preview.data.refund_cash > 0 && preview.data.refund_noncash > 0 && ' · '}
                        {preview.data.refund_noncash > 0 && (
                          <>
                            {t('returns.backToMethod', { method: methodLabel(preview.data.refund_method) })}:{' '}
                            {formatCurrency(preview.data.refund_noncash, currency)}
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-posCloud-text-tertiary">{t('loading')}</p>
                  )}
                </div>
              )}

              {info.returns.length > 0 && (
                <div className="text-xs text-posCloud-text-tertiary">
                  {t('returns.previous', { count: info.returns.length })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submit.isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
          >
            {t('back')}
          </button>
          <button
            type="button"
            onClick={() => submit.mutate()}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 rounded-lg bg-posCloud-primary text-white text-sm font-medium hover:brightness-95 disabled:opacity-50"
          >
            {submit.isPending ? t('returns.submitting') : t('returns.submit')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
      <span>{label}</span>
      <span dir="ltr" className="tabular-nums">{value}</span>
    </div>
  );
}
