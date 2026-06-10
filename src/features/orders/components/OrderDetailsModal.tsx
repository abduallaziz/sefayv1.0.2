'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

interface Props {
  order: Order | null;
  onClose: () => void;
  onCancel: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function OrderDetailsModal({ order, onClose, onCancel }: Props) {
  const t = useTranslations('orders');

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('details.title')}</h2>
            <p className="text-xs text-muted-foreground">#{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {t(`status.${order.status}` as any)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {t(`payment_method.${order.payment_method}` as any)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">{t('cashier')}</p>
              <p className="font-medium text-foreground">{order.cashier_name}</p>
            </div>
            {order.customer_name && (
              <div>
                <p className="text-muted-foreground text-xs">{t('customer')}</p>
                <p className="font-medium text-foreground">{order.customer_name}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs">{t('date')}</p>
              <p className="font-medium text-foreground">
                {new Date(order.created_at).toLocaleString('ar-SA')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('details.items')}</h3>
            <div className="space-y-2">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{item.item_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{item.total_price} ر.س</p>
                    <p className="text-xs text-muted-foreground">{item.qty} × {item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t('details.subtotal')}</span>
              <span>{order.subtotal} ر.س</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t('details.discount')}</span>
                <span>-{order.discount} ر.س</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{t('details.tax')}</span>
              <span>{order.tax} ر.س</span>
            </div>
            <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
              <span>{t('total')}</span>
              <span>{order.total} ر.س</span>
            </div>
          </div>

          {order.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">{t('notes')}</p>
              <p className="text-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {order.status !== 'cancelled' && (
          <div className="p-5 border-t border-border">
            <button
              onClick={() => onCancel(order)}
              className="w-full py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
            >
              {t('cancel.action')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}