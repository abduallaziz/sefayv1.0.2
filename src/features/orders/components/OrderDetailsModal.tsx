'use client';

import { Order } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { X } from 'lucide-react';

interface Props {
  order: Order | null;
  onClose: () => void;
  onCancel: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

export function OrderDetailsModal({ order, onClose, onCancel }: Props) {
  const t = useTranslations('orders');
  const currency = useTenantStore((s) => s.currency_symbol);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e2130]">
          <div>
            <h2 className="text-lg font-bold text-white">{t('details.title')}</h2>
            <p className="text-xs text-slate-500">#{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {t(`status.${order.status}` as any)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400">
              {t(`payment_method.${order.payment_method}` as any)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs">{t('cashier')}</p>
              <p className="font-medium text-white">{order.cashier_name}</p>
            </div>
            {order.customer_name && (
              <div>
                <p className="text-slate-500 text-xs">{t('customer')}</p>
                <p className="font-medium text-white">{order.customer_name}</p>
              </div>
            )}
            <div>
              <p className="text-slate-500 text-xs">{t('date')}</p>
              <p className="font-medium text-white">
                {new Date(order.created_at).toLocaleString('en-US')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-2">{t('details.items')}</h3>
            <div className="space-y-2">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm bg-white/5 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-white">{item.item_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-slate-500">{item.variant_name}</p>
                    )}
                  </div>
                  <div className="text-end">
                    <p className="font-medium text-white">{item.total_price} {currency}</p>
                    <p className="text-xs text-slate-500">{item.qty} × {item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e2130] pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>{t('details.subtotal')}</span>
              <span>{order.subtotal} {currency}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>{t('details.discount')}</span>
                <span>-{order.discount} {currency}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>{t('details.tax')}</span>
              <span>{order.tax} {currency}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-base border-t border-[#1e2130] pt-2">
              <span>{t('total')}</span>
              <span>{order.total} {currency}</span>
            </div>
          </div>

          {order.notes && (
            <div className="text-sm">
              <p className="text-slate-500 text-xs">{t('notes')}</p>
              <p className="text-white">{order.notes}</p>
            </div>
          )}
        </div>

        {order.status !== 'cancelled' && (
          <div className="p-5 border-t border-[#1e2130]">
            <button
              onClick={() => onCancel(order)}
              className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              {t('cancel.action')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}