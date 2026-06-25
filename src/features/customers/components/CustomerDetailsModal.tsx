'use client';

import { useTranslations } from 'next-intl';
import { X, Phone, Mail, Star, ShoppingBag, TrendingUp } from 'lucide-react';
import { Customer } from '../types/customer.types';
import { useCustomerHistory } from '../hooks/useCustomers';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';

interface Props {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}

export function CustomerDetailsModal({ customer, onClose, onEdit }: Props) {
  const t = useTranslations('customers');
  const currency = useTenantStore((s) => s.currency_symbol);
  const { data: orders, isLoading } = useCustomerHistory(customer.id);

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0C447C] font-bold">
              {(customer.full_name || '?').charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {customer.full_name || '—'}
              </h2>
              <p className="text-sm text-gray-400">
                {t('details.since')} {new Date(customer.created_at).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400" />
              <span dir="ltr">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                <span dir="ltr">{customer.email}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <ShoppingBag className="w-5 h-5 text-[#0C447C] mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {customer.orders_count ?? 0}
              </p>
              <p className="text-xs text-gray-400">{t('details.orders')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {(customer.total_spent ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{currency}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1 fill-yellow-500" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {customer.loyalty_points.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{t('details.points')}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('details.history')}
            </h3>
            {isLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">{t('loading')}</p>
            ) : !orders?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">{t('details.no_orders')}</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.total.toLocaleString()} {currency}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('ar-SA')} · {order.items_count} {t('details.items')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                      {t(`status.${order.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onEdit} className="w-full py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors">
            {t('actions.edit')}
          </button>
        </div>
      </div>
    </div>
  );
}