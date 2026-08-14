'use client'

import { useTranslations } from 'next-intl'
import { DateRangePicker, DateRange } from '@/shared/ui/date-range-picker'
import { useBranches } from '@/shared/hooks/useBranches'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useItems } from '@/features/items/hooks/useItems'
import { useAccessControlRoles } from '@/features/access-control/hooks/useAccessControl'
import { PriceOverrideAuditQuery } from '../api/accounting.api'

interface Props {
  filters: PriceOverrideAuditQuery
  onChange: (filters: PriceOverrideAuditQuery) => void
}

const inputClass =
  'border border-posCloud-border dark:border-posCloudDark-border rounded-lg px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-primary'

export function PriceOverrideAuditFilters({ filters, onChange }: Props) {
  const t = useTranslations('accounting.priceOverrideAudit.filters')

  const { data: branches } = useBranches()
  const { data: users } = useUsers()
  const { data: items } = useItems()
  const { data: roles } = useAccessControlRoles()

  const dateRange: DateRange = { from: filters.date_from, to: filters.date_to }

  const set = <K extends keyof PriceOverrideAuditQuery>(key: K, value: PriceOverrideAuditQuery[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker
        value={dateRange}
        onChange={(range) => onChange({ ...filters, date_from: range.from, date_to: range.to })}
        placeholder={t('dateRange')}
      />

      <input
        type="text"
        placeholder={t('orderId')}
        value={filters.order_id ?? ''}
        onChange={(e) => set('order_id', e.target.value || undefined)}
        className={`${inputClass} w-48`}
      />

      <select
        value={filters.item_id ?? ''}
        onChange={(e) => set('item_id', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('item')}</option>
        {(items ?? []).map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>

      <select
        value={filters.actor_id ?? ''}
        onChange={(e) => set('actor_id', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('user')}</option>
        {(users ?? []).map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      <select
        value={filters.actor_role_id ?? ''}
        onChange={(e) => set('actor_role_id', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('effectiveRole')}</option>
        {(roles ?? []).map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <select
        value={filters.branch_id ?? ''}
        onChange={(e) => set('branch_id', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('branch')}</option>
        {(branches ?? []).map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select
        value={filters.direction ?? ''}
        onChange={(e) => set('direction', (e.target.value || undefined) as PriceOverrideAuditQuery['direction'])}
        className={inputClass}
      >
        <option value="">{t('direction')}</option>
        <option value="discount">{t('directionDiscount')}</option>
        <option value="increase">{t('directionIncrease')}</option>
      </select>

      <input
        type="number"
        inputMode="decimal"
        placeholder={t('percentMin')}
        value={filters.difference_percent_min ?? ''}
        onChange={(e) => set('difference_percent_min', e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${inputClass} w-28 tabular-nums`}
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder={t('percentMax')}
        value={filters.difference_percent_max ?? ''}
        onChange={(e) => set('difference_percent_max', e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${inputClass} w-28 tabular-nums`}
      />

      <input
        type="text"
        placeholder={t('reason')}
        value={filters.reason ?? ''}
        onChange={(e) => set('reason', e.target.value || undefined)}
        className={`${inputClass} w-40`}
      />
    </div>
  )
}
