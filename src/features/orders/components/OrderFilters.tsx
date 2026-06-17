'use client';

import { OrderFilters as IOrderFilters, OrderStatus, PaymentMethod } from '../types/order.types';
import { useTranslations } from 'next-intl';

interface Props {
  filters: IOrderFilters;
  onChange: (filters: IOrderFilters) => void;
}

export function OrderFilters({ filters, onChange }: Props) {
  const t = useTranslations('orders');

  const statuses: { value: OrderStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'completed', labelKey: 'status.completed' },
    { value: 'pending', labelKey: 'status.pending' },
    { value: 'cancelled', labelKey: 'status.cancelled' },
  ];

  const methods: { value: PaymentMethod | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'cash', labelKey: 'payment_method.cash' },
    { value: 'card', labelKey: 'payment_method.card' },
    { value: 'split', labelKey: 'payment_method.split' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={filters.search || ''}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        className="border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white w-48 focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
      />

      <select
        value={filters.status || ''}
        onChange={e => onChange({ ...filters, status: (e.target.value as OrderStatus) || undefined })}
        className="border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500"
      >
        {statuses.map(s => (
          <option key={s.value} value={s.value}>{t(s.labelKey as any)}</option>
        ))}
      </select>

      <select
        value={filters.payment_method || ''}
        onChange={e => onChange({ ...filters, payment_method: (e.target.value as PaymentMethod) || undefined })}
        className="border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500"
      >
        {methods.map(m => (
          <option key={m.value} value={m.value}>{t(m.labelKey as any)}</option>
        ))}
      </select>
    </div>
  );
}