'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { X, Pencil } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface Props {
  order: Order | null;
  onClose: () => void;
  onCancel: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success',
  pending: 'bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning',
  cancelled: 'bg-posCloud-danger-light dark:bg-posCloud-danger/15 text-posCloud-danger',
};

export function OrderDetailsModal({ order, onClose, onCancel }: Props) {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border">
          <div>
            <h2 className="text-lg font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('details.title')}</h2>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">#{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {t(`status.${order.status}` as Parameters<typeof t>[0])}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              {order.payment_method ? t(`payment_method.${order.payment_method}` as Parameters<typeof t>[0]) : t('payment_method.unknown')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">{t('cashier')}</p>
              <p className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{order.cashier_name}</p>
            </div>
            {order.customer_name && (
              <div>
                <p className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">{t('customer')}</p>
                <p className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{order.customer_name}</p>
              </div>
            )}
            <div>
              <p className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">{t('date')}</p>
              <p className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                {new Date(order.created_at).toLocaleString('en-US')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-2">{t('details.items')}</h3>
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

          <div className="border-t border-posCloud-border dark:border-posCloudDark-border pt-3 space-y-1 text-sm">
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
            <div className="flex justify-between font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary text-base border-t border-posCloud-border dark:border-posCloudDark-border pt-2">
              <span>{t('total')}</span>
              <span>{order.total} {currency}</span>
            </div>
          </div>

          {order.notes && (
            <div className="text-sm">
              <p className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-xs">{t('notes')}</p>
              <p className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{order.notes}</p>
            </div>
          )}
        </div>

        {order.status !== 'cancelled' && (
          <div className="p-5 border-t border-posCloud-border dark:border-posCloudDark-border flex gap-2">
            <Button
              variant="outline"
              disabled
              title={t('edit.soon')}
              className="flex-1 relative"
            >
              <Pencil size={15} />
              {t('edit.action')}
              <span className="absolute -top-2 -end-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-posCloud-warning-light dark:bg-posCloud-warning/15 text-posCloud-warning">
                {t('edit.soon')}
              </span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => onCancel(order)}
              className="flex-1"
            >
              {t('cancel.action')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}