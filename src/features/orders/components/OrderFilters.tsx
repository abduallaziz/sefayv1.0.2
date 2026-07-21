'use client';

import { OrderFilters as IOrderFilters, OrderStatus, PaymentMethod } from '../types/order.types';
import { useTranslations } from 'next-intl';
import { DateRangePicker } from '@/shared/ui/date-range-picker';
import { RotateCcw, SlidersHorizontal, Building2, Search } from 'lucide-react';
import { useBranches } from '@/shared/hooks/useBranches';

interface Props {
  filters: IOrderFilters;
  onChange: (filters: IOrderFilters) => void;
}

export function OrderFilters({ filters, onChange }: Props) {
  const t = useTranslations('orders');
  const { data: branches = [] } = useBranches();

  const statuses: { value: OrderStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'completed', labelKey: 'status.completed' },
    { value: 'pending', labelKey: 'status.pending' },
    { value: 'cancelled', labelKey: 'status.cancelled' },
  ];

  const methods: { value: PaymentMethod | ''; labelKey: string }[] = [
    { value: '', labelKey: 'status.all' },
    { value: 'cash', labelKey: 'payment_method.cash' },
    { value: 'mada', labelKey: 'payment_method.mada' },
    { value: 'visa', labelKey: 'payment_method.visa' },
    { value: 'mastercard', labelKey: 'payment_method.mastercard' },
    { value: 'apple_pay', labelKey: 'payment_method.apple_pay' },
    { value: 'stc_pay', labelKey: 'payment_method.stc_pay' },
    { value: 'wallet', labelKey: 'payment_method.wallet' },
    { value: 'split', labelKey: 'payment_method.split' },
    { value: 'gift_card', labelKey: 'payment_method.gift_card' },
  ];

  const hasActiveFilters = !!(filters.status || filters.payment_method || filters.branch_id || filters.search || filters.date_from || filters.date_to);

  const pillClass =
    'h-9 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-primary';

  return (
    <div className="flex w-full flex-wrap items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => onChange({})}
        disabled={!hasActiveFilters}
        className="flex items-center gap-1.5 h-9 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-primary hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCcw size={13} />
        {t('filters.reset')}
      </button>

      <button
        type="button"
        title={t('edit.soon')}
        className="flex items-center gap-1.5 h-9 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        <SlidersHorizontal size={13} />
        {t('filters.more')}
      </button>

      <select
        value={filters.payment_method || ''}
        onChange={e => onChange({ ...filters, payment_method: (e.target.value as PaymentMethod) || undefined })}
        className={pillClass}
      >
        {methods.map(m => (
          <option key={m.value} value={m.value}>{t(m.labelKey as Parameters<typeof t>[0])}</option>
        ))}
      </select>

      <select
        value={filters.status || ''}
        onChange={e => onChange({ ...filters, status: (e.target.value as OrderStatus) || undefined })}
        className={pillClass}
      >
        {statuses.map(s => (
          <option key={s.value} value={s.value}>{t(s.labelKey as Parameters<typeof t>[0])}</option>
        ))}
      </select>

      <div className="relative">
        <Building2 size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary pointer-events-none" />
        <select
          value={filters.branch_id || ''}
          onChange={e => onChange({ ...filters, branch_id: e.target.value || undefined })}
          className={`${pillClass} ps-7`}
        >
          <option value="">{t('filters.allBranches')}</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <DateRangePicker
        value={{ from: filters.date_from, to: filters.date_to }}
        onChange={range => onChange({ ...filters, date_from: range.from, date_to: range.to })}
      />

      <div className="relative flex-1 min-w-[140px]">
        <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full h-9 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface ps-9 pe-3 text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-posCloud-primary"
        />
      </div>
    </div>
  );
}
