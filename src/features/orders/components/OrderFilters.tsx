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
        className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <select
        value={filters.status || ''}
        onChange={e => onChange({ ...filters, status: (e.target.value as OrderStatus) || undefined })}
        className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none"
      >
        {statuses.map(s => (
          <option key={s.value} value={s.value}>{t(s.labelKey as any)}</option>
        ))}
      </select>

      <select
        value={filters.payment_method || ''}
        onChange={e => onChange({ ...filters, payment_method: (e.target.value as PaymentMethod) || undefined })}
        className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none"
      >
        {methods.map(m => (
          <option key={m.value} value={m.value}>{t(m.labelKey as any)}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.date_from || ''}
        onChange={e => onChange({ ...filters, date_from: e.target.value })}
        className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none"
      />
      <input
        type="date"
        value={filters.date_to || ''}
        onChange={e => onChange({ ...filters, date_to: e.target.value })}
        className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none"
      />
    </div>
  );
}