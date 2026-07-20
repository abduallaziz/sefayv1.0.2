'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { X, Receipt, User, UserCog, CreditCard, CircleCheck, ShoppingBasket, StickyNote, Calculator, FileText, Download, Send, Printer } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { MethodMark } from '@/shared/ui/method-mark';

interface Props {
  order: Order | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success',
  pending: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
  cancelled: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
  refunded: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
};

export function OrderDetailsModal({ order, onClose }: Props) {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);

  if (!order) return null;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-2xl w-full max-w-xl max-h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                {t('details.title')} <span dir="ltr">#{order.id.slice(-6).toUpperCase()}</span>
              </h2>
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {new Date(order.created_at).toLocaleString('en-US')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2.5">
              <div className="flex items-center gap-1 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-[11px] mb-1">
                <User size={12} /> {t('customer')}
              </div>
              <p className="text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">
                {order.customer_name || t('generalCustomer')}
              </p>
            </div>
            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2.5">
              <div className="flex items-center gap-1 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-[11px] mb-1">
                <UserCog size={12} /> {t('cashier')}
              </div>
              <p className="text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">
                {order.cashier_name || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2.5">
              <div className="flex items-center gap-1 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-[11px] mb-1">
                <CreditCard size={12} /> {t('payment')}
              </div>
              <div className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                {order.payment_method ? <MethodMark id={order.payment_method} /> : t('payment_method.unknown')}
              </div>
            </div>
            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-2.5">
              <div className="flex items-center gap-1 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-[11px] mb-1">
                <CircleCheck size={12} /> {t('status.all')}
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                {t(`status.${order.status}` as Parameters<typeof t>[0])}
              </span>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-2">
              <ShoppingBasket size={15} /> {t('details.items')}
            </h3>
            <div className="space-y-2">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm bg-posCloud-background dark:bg-posCloudDark-background rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.item_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.variant_name}</p>
                    )}
                  </div>
                  <div className="text-end">
                    <p className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.total_price} {currency}</p>
                    <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.quantity} × {item.unit_price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes + financial summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-1.5">
                <StickyNote size={13} /> {t('notes')}
              </h4>
              <p className="text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                {order.notes || t('noNotes')}
              </p>
            </div>
            <div className="rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-1.5">
                <Calculator size={13} /> {t('details.summary')}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  <span>{t('details.subtotal')}</span>
                  <span>{order.subtotal} {currency}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-posCloud-success">
                    <span>{t('details.discount')}</span>
                    <span>-{order.discount_amount} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  <span>{t('details.tax')}</span>
                  <span>{order.tax} {currency}</span>
                </div>
                <div className="flex justify-between font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary text-base border-t border-posCloud-border dark:border-posCloudDark-border pt-1.5 mt-1.5">
                  <span>{t('total')}</span>
                  <span>{order.total} {currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Accounting journal entry — no ledger module yet, placeholder only */}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-posCloud-border dark:border-posCloudDark-border p-2.5 opacity-60">
            <span className="flex items-center gap-1.5 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <FileText size={13} /> {t('details.journalEntry')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning">
              {t('edit.soon')}
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-posCloud-border dark:border-posCloudDark-border flex flex-wrap gap-2">
          <Button variant="outline" disabled title={t('edit.soon')} className="flex-1 min-w-[100px]">
            <Download size={15} />
            {t('details.downloadPdf')}
          </Button>
          <Button variant="outline" disabled title={t('edit.soon')} className="flex-1 min-w-[100px]">
            <Send size={15} />
            {t('details.sendPdf')}
          </Button>
          <Button onClick={handlePrint} className="flex-1 min-w-[100px]">
            <Printer size={15} />
            {t('details.print')}
          </Button>
        </div>
      </div>
    </div>
  );
}
