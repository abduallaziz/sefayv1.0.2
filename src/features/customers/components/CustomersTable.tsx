'use client';

import { useTranslations } from 'next-intl';
import { Eye, Edit2, Trash2, Star, Phone, Mail } from 'lucide-react';
import { Customer } from '../types/customer.types';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';

interface Props {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomersTable({ customers, onView, onEdit, onDelete }: Props) {
  const t = useTranslations('customers');
  const currency = useTenantStore((s) => s.currency_symbol);

  if (customers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">{t('empty.title')}</p>
        <p className="text-sm mt-1">{t('empty.desc')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.customer')}</th>
            <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.contact')}</th>
            <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.orders')}</th>
            <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.spent')}</th>
            <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.points')}</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm shrink-0">
                    {customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.full_name}</p>
                    <p className="text-xs text-gray-400">{new Date(customer.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-xs">{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-xs">{customer.email}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-900 dark:text-white font-medium">{customer.orders_count ?? 0}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-900 dark:text-white font-medium">
                  {(customer.total_spent ?? 0).toLocaleString()} {currency}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{customer.loyalty_points.toLocaleString()}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onView(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title={t('actions.view')}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={t('actions.edit')}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={t('actions.delete')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}