'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Eye, Edit2, Trash2, Phone, Mail, Gauge, Calendar, MoreVertical, CircleCheck, CircleOff, Clock, User } from 'lucide-react';
import { Customer } from '../types/customer.types';
import { formatNumber } from '@/lib/locale';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { useProfile } from '@/features/settings/hooks/useSettings';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/dropdown';

const VEHICLE_BUSINESS_TYPES = ['workshop', 'services'];

function PlateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="23" height="15" rx="3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="17.5" y1="1" x2="17.5" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="0.5" y1="8" x2="17.5" y2="8" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

interface Props {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomersTable({ customers, onView, onEdit, onDelete }: Props) {
  const t = useTranslations('customers');
  const rawLocale = useLocale();
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en';
  // Latin numerals in both locales (project-wide numerals rule) via the
  // -u-nu-latn Unicode extension, but real Arabic month/weekday names in
  // Arabic — same pattern as DashboardOverview's dateLocale.
  const dateLocale = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
  const currency = useCurrencyDisplay();
  const { data: profile } = useProfile();
  const showVehicleColumn = !!profile?.business_type && VEHICLE_BUSINESS_TYPES.includes(profile.business_type);

  if (customers.length === 0) {
    return (
      <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
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
                  <div className="flex items-center gap-1.5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-0.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span className="text-xs truncate">{customer.phone}</span>
                  </div>
                  {showVehicleColumn && (customer.plate_number || customer.visit_date || customer.odometer != null) && (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mt-0.5 text-xs">
                      {customer.plate_number && (
                        <span className="flex items-center gap-0.5"><PlateIcon className="w-3.5 h-2.5" /><span dir="ltr">{customer.plate_number}</span></span>
                      )}
                      {customer.odometer != null && (
                        <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" />{formatNumber(customer.odometer, { locale, decimals: 0 })}</span>
                      )}
                      {customer.visit_date && (
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(customer.visit_date).toLocaleDateString(dateLocale)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={t('actions.more')} title={t('actions.more')} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(customer)}>
                    <Eye className="w-3.5 h-3.5" /> {t('actions.view')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(customer)}>
                    <Edit2 className="w-3.5 h-3.5" /> {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(customer)} className="text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/10">
                    <Trash2 className="w-3.5 h-3.5" /> {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
              <span className={`flex items-center gap-1 text-xs font-medium ${customer.is_active ? 'text-posCloud-success' : 'text-posCloud-text-tertiary'}`}>
                {customer.is_active ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleOff className="w-3.5 h-3.5" />}
                {customer.is_active ? t('fields.status.active') : t('fields.status.inactive')}
              </span>
              <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{formatNumber(customer.orders_count ?? 0, { locale, decimals: 0 })} {t('table.orders')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatNumber(customer.total_spent ?? 0, { locale, decimals: 2 })} {currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {/* Canonical Sefay Customers column order (Customer -> ... -> Status),
                  authored in this exact source order so the native <table>'s
                  browser-default RTL mirroring (inherited from the ancestor
                  dir="rtl") reverses it automatically for Arabic — no explicit
                  CSS/flex reversal needed, same as the rest of this page. The
                  row-actions (⋮) column is placed LAST in source for the same
                  reason: last-in-source renders as the trailing/outer edge in
                  both directions (right edge in LTR, left edge in RTL), which
                  is the required position — it must NOT stay physically fixed
                  to one side when direction changes. */}
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.customer')}</th>
              {showVehicleColumn && (
                <th className="text-center py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.vehicle')}</th>
              )}
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.phone')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.email')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.classification')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.invoiceCount')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.totalSpent')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.lastAmount')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.lastOperation')}</th>
              <th className="text-start py-3 px-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary font-medium">{t('table.status')}</th>
              <th className="sticky end-0 bg-white dark:bg-gray-900 py-3 px-4"><span className="sr-only">{t('actions.more')}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-4">
                  <button onClick={() => onView(customer)} className="flex items-center gap-2 text-start hover:underline">
                    <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0C447C] dark:text-[#5B9BD5] shrink-0">
                      <User className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block whitespace-nowrap font-medium text-gray-900 dark:text-white">{customer.full_name}</span>
                      <span className="block text-xs text-posCloud-primary font-mono">#CUST-{customer.id.slice(-6).toUpperCase()}</span>
                    </span>
                  </button>
                </td>
                {showVehicleColumn && (
                  <td className="py-3 px-4">
                    <div className="space-y-1 flex flex-col items-center">
                      {customer.plate_number && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <PlateIcon className="w-4 h-3" />
                          <span className="text-xs" dir="ltr">{customer.plate_number}</span>
                        </div>
                      )}
                      {customer.odometer != null && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Gauge className="w-3.5 h-3.5" />
                          <span className="text-xs">{formatNumber(customer.odometer, { locale, decimals: 0 })}</span>
                        </div>
                      )}
                      {customer.visit_date && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">{new Date(customer.visit_date).toLocaleDateString(dateLocale)}</span>
                        </div>
                      )}
                      {!customer.plate_number && customer.odometer == null && !customer.visit_date && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                )}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs" dir="ltr">{customer.phone}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {customer.email ? (
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs truncate max-w-[160px]">{customer.email}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span title={t('comingSoon')} className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary opacity-50 cursor-not-allowed">—</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-900 dark:text-white font-medium">{formatNumber(customer.orders_count ?? 0, { locale, decimals: 0 })}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatNumber(customer.total_spent ?? 0, { locale, decimals: 2 })} {currency}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span title={t('comingSoon')} className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary opacity-50 cursor-not-allowed">—</span>
                </td>
                <td className="py-3 px-4">
                  <span title={t('comingSoon')} className="flex items-center gap-1 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary opacity-50 cursor-not-allowed">
                    <Clock className="w-3.5 h-3.5" /> —
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${customer.is_active ? 'bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success' : 'bg-gray-100 dark:bg-gray-800 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'}`}>
                    {customer.is_active ? <CircleCheck className="w-3 h-3" /> : <CircleOff className="w-3 h-3" />}
                    {customer.is_active ? t('fields.status.active') : t('fields.status.inactive')}
                  </span>
                </td>
                <td className="sticky end-0 bg-white dark:bg-gray-900 py-3 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={t('actions.more')} title={t('actions.more')} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(customer)}>
                        <Eye className="w-3.5 h-3.5" /> {t('actions.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit2 className="w-3.5 h-3.5" /> {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(customer)} className="text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/10">
                        <Trash2 className="w-3.5 h-3.5" /> {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
