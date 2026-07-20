'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { Eye, Pencil, Ban, MoreVertical, User, Printer, ChevronDown } from 'lucide-react';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
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

export function OrdersTable({ orders, onViewOrder, onPrintOrder, onCancelOrder }: Props) {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);
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
              <th className="px-3 py-3 w-20" />
              <th className="text-start px-3 py-3 font-medium">{t('cashier')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('filters.branch')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('payment')}</th>
              <th className="text-start px-3 py-3 font-medium w-24">{t('total')}</th>
              <th className="text-start px-3 py-3 font-medium">{t('customer')}</th>
              <th className="text-start px-3 py-3 font-medium w-20">{t('invoiceNumber')}</th>
              <th className="text-start px-3 py-3 font-medium">
                <span className="flex items-center gap-1">{t('date')} <ChevronDown size={12} /></span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-posCloud-border dark:divide-posCloudDark-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
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
                    <button
                      onClick={() => onPrintOrder(order)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary"
                      title={t('details.print')}
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      onClick={() => onViewOrder(order)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary"
                      title={t('actions.view')}
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 text-posCloud-text-secondary dark:text-posCloudDark-text-primary max-w-[120px] truncate">
                  {order.cashier_name || '—'}
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary max-w-[120px] truncate">
                  {branchName(order.branch_id)}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-2 py-1 text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                    {order.payment_method ? <MethodMark id={order.payment_method} /> : <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('payment_method.unknown')}</span>}
                  </span>
                </td>
                <td className="px-3 py-3 font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary w-24 tabular-nums">
                  {order.total.toLocaleString('en-US')} {currency}
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary max-w-[140px]">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      <User size={13} />
                    </span>
                    <span className="truncate">{order.customer_name || t('generalCustomer')}</span>
                  </span>
                </td>
                <td className="px-3 py-3 w-20">
                  <button
                    onClick={() => onViewOrder(order)}
                    className="font-mono text-xs font-semibold text-posCloud-primary hover:underline"
                  >
                    #{order.id.slice(-6).toUpperCase()}
                  </button>
                </td>
                <td className="px-3 py-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">
                  {new Date(order.created_at).toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}