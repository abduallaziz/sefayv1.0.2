'use client';

import { useTranslations } from 'next-intl';
import { Eye, Edit2, Trash2, Star, Phone, Mail, Gauge, Calendar } from 'lucide-react';
import { Customer } from '../types/customer.types';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { useProfile } from '@/features/settings/hooks/useSettings';

const VEHICLE_BUSINESS_TYPES = ['workshop', 'services'];

interface Props {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomersTable({ customers, onView, onEdit, onDelete }: Props) {
  const t = useTranslations('customers');
  const currency = useTenantStore((s) => s.currency_symbol);
  const { data: profile } = useProfile();
  const showVehicleColumn = !!profile?.business_type && VEHICLE_BUSINESS_TYPES.includes(profile.business_type);

  if (customers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">{t('empty.title')}</p>
        <p className="text-sm mt-1">{t('empty.desc')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0C447C] dark:text-[#5B9BD5] font-semibold text-sm shrink-0">
                  {(customer.full_name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{customer.full_name}</p>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mt-0.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span className="text-xs truncate">{customer.phone}</span>
                  </div>
                  {showVehicleColumn && (customer.plate_number || customer.visit_date || customer.odometer != null) && (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mt-0.5 text-xs">
                      {customer.plate_number && <span dir="ltr">{customer.plate_number}</span>}
                      {customer.odometer != null && (
                        <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" />{customer.odometer.toLocaleString()}</span>
                      )}
                      {customer.visit_date && (
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(customer.visit_date).toLocaleDateString('ar-SA')}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onView(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0C447C] hover:bg-[#E8F0FB] dark:hover:bg-blue-900/20 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onEdit(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{customer.orders_count ?? 0} {t('table.orders')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{(customer.total_spent ?? 0).toLocaleString()} {currency}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-white">{customer.loyalty_points.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.customer')}</th>
              <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.contact')}</th>
              {showVehicleColumn && (
                <th className="text-start py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{t('table.vehicle')}</th>
              )}
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
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0C447C] dark:text-[#5B9BD5] font-semibold text-sm shrink-0">
                      {(customer.full_name || '?').charAt(0)}
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
                {showVehicleColumn && (
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {customer.plate_number && (
                        <p className="text-xs text-gray-600 dark:text-gray-300" dir="ltr">{customer.plate_number}</p>
                      )}
                      {customer.odometer != null && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Gauge className="w-3.5 h-3.5" />
                          <span className="text-xs">{customer.odometer.toLocaleString()}</span>
                        </div>
                      )}
                      {customer.visit_date && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">{new Date(customer.visit_date).toLocaleDateString('ar-SA')}</span>
                        </div>
                      )}
                      {!customer.plate_number && customer.odometer == null && !customer.visit_date && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                )}
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
                    <button onClick={() => onView(customer)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0C447C] hover:bg-[#E8F0FB] dark:hover:bg-blue-900/20 transition-colors" title={t('actions.view')}>
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
    </>
  );
}