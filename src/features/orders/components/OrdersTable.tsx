'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { Eye, Pencil, Ban, MoreVertical, Printer, Store } from 'lucide-react';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { MethodMark } from '@/shared/ui/method-mark';
import { useBranches } from '@/shared/hooks/useBranches';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/dropdown';

interface Props {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success',
  pending: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
  cancelled: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
};

// Colored pill background per payment network, matching the reference
// screenshot's per-brand chip styling instead of a single neutral border.
const PAYMENT_PILL_BG: Record<string, string> = {
  visa: 'bg-blue-50 dark:bg-blue-500/10',
  mada: 'bg-green-50 dark:bg-green-500/10',
  mastercard: 'bg-red-50 dark:bg-red-500/10',
  apple_pay: 'bg-slate-100 dark:bg-white/10',
  stc_pay: 'bg-purple-50 dark:bg-purple-500/10',
  gift_card: 'bg-amber-50 dark:bg-amber-500/10',
  cash: 'bg-slate-100 dark:bg-white/5',
  wallet: 'bg-slate-100 dark:bg-white/5',
  split: 'bg-slate-100 dark:bg-white/5',
};

// Two-line date/time matching the reference exactly: Arabic month name with
// Western numerals (house rule), then "AM/PM h:mm:ss" with the period first.
function formatOrderDateTime(iso: string) {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const hours24 = d.getHours();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return { dateStr, timeStr: `${period} ${hours12}:${mm}:${ss}` };
}

export function OrdersTable({ orders, onViewOrder, onPrintOrder, onCancelOrder }: Props) {
  const t = useTranslations('orders');
  const currency = useCurrencyDisplay();
  const { data: branches = [] } = useBranches();
  const branchName = (id: string) => branches.find(b => b.id === id)?.name || '—';

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
        <p className="text-lg font-medium">{t('noOrders')}</p>
        <p className="text-sm mt-1">{t('tryFilters')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onViewOrder(order)}
            className="w-full text-start bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-3 hover:border-posCloud-primary/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">#{order.id.slice(-6).toUpperCase()}</span>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {t(`status.${order.status}`)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onPrintOrder(order); }}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary"
                >
                  <Printer size={15} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewOrder(order)}>
                      <Eye size={14} />
                      {t('actions.view')}
                    </DropdownMenuItem>
                    {order.status !== 'cancelled' && (
                      <>
                        <DropdownMenuItem disabled title={t('edit.soon')}>
                          <Pencil size={14} />
                          {t('edit.action')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onCancelOrder(order)}
                          className="text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/10"
                        >
                          <Ban size={14} />
                          {t('cancel.action')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="min-w-0">
                <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary font-medium truncate">{order.cashier_name}</p>
                {order.customer_name && <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{order.customer_name}</p>}
              </div>
              <span className="font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums shrink-0">
                {order.total.toLocaleString('en-US')} {currency}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-posCloud-border dark:border-posCloudDark-border text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <span>{branchName(order.branch_id)}</span>
              <span>{order.payment_method ? t(`payment_method.${order.payment_method}`) : t('payment_method.unknown')}</span>
              <span>{new Date(order.created_at).toLocaleString('en-US')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-posCloud-border dark:border-posCloudDark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-posCloud-background dark:bg-posCloudDark-background border-b border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <th className="text-start px-3 py-3 font-medium w-28 whitespace-nowrap">{t('invoiceNumber')}</th>
              <th className="text-start px-3 py-3 font-medium w-36 whitespace-nowrap">{t('date')}</th>
              <th className="text-start px-3 py-3 font-medium w-28 whitespace-nowrap">{t('cashier')}</th>
              <th className="text-start px-3 py-3 font-medium w-24 whitespace-nowrap">{t('amount')}</th>
              <th className="text-start px-3 py-3 font-medium w-24 whitespace-nowrap">{t('status.header')}</th>
              <th className="text-start px-3 py-3 font-medium w-28 whitespace-nowrap">{t('paymentMethod')}</th>
              <th className="text-start px-3 py-3 font-medium w-28 whitespace-nowrap">{t('filters.branch')}</th>
              <th className="text-start px-3 py-3 font-medium w-20 whitespace-nowrap">{t('actions.header')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-posCloud-border dark:divide-posCloudDark-border">
            {orders.map((order) => {
              const { dateStr, timeStr } = formatOrderDateTime(order.created_at);
              return (
                <tr key={order.id} className="bg-white dark:bg-posCloudDark-surface hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 py-3 w-28">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="font-mono text-xs font-semibold text-posCloud-primary hover:underline"
                    >
                      #{order.id.slice(-6).toUpperCase()}
                    </button>
                  </td>
                  <td className="px-3 py-3 w-36 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs whitespace-nowrap">
                    <p>{dateStr}</p>
                    <p dir="ltr" className="text-start">{timeStr}</p>
                  </td>
                  <td className="px-3 py-3 w-28 text-posCloud-text-secondary dark:text-posCloudDark-text-primary truncate">
                    {order.cashier_name || '—'}
                  </td>
                  <td className="px-3 py-3 w-24 font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums whitespace-nowrap">
                    {order.total.toLocaleString('en-US')} {currency}
                  </td>
                  <td className="px-3 py-3 w-24">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[order.status]}`}>
                      {t(`status.${order.status}`)}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-28">
                    <span className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-posCloud-text-primary dark:text-posCloudDark-text-primary ${order.payment_method ? PAYMENT_PILL_BG[order.payment_method] ?? PAYMENT_PILL_BG.cash : PAYMENT_PILL_BG.cash}`}>
                      {order.payment_method ? <MethodMark id={order.payment_method} /> : <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('payment_method.unknown')}</span>}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-28 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    <span className="flex items-center gap-1.5">
                      <Store size={13} className="shrink-0" />
                      <span className="truncate">{branchName(order.branch_id)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 w-20">
                    <div className="flex items-center gap-0.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => onViewOrder(order)}>
                            <Eye size={14} />
                            {t('actions.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrintOrder(order)}>
                            <Printer size={14} />
                            {t('details.print')}
                          </DropdownMenuItem>
                          {order.status !== 'cancelled' && (
                            <>
                              <DropdownMenuItem disabled title={t('edit.soon')}>
                                <Pencil size={14} />
                                {t('edit.action')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onCancelOrder(order)}
                                className="text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/10"
                              >
                                <Ban size={14} />
                                {t('cancel.action')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}