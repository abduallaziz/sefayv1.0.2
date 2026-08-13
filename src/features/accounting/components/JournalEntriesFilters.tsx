'use client'

import { useTranslations } from 'next-intl'
import { DateRangePicker, DateRange } from '@/shared/ui/date-range-picker'
import { useBranches } from '@/shared/hooks/useBranches'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useFiscalPeriods } from '../hooks/useAccountingCommandCenter'
import { useChartOfAccounts } from '../hooks/useJournalEntries'
import { JournalEntriesQuery } from '../api/accounting.api'

interface Props {
  filters: JournalEntriesQuery
  onChange: (filters: JournalEntriesQuery) => void
  canView: boolean
}

const inputClass =
  'border border-posCloud-border dark:border-posCloudDark-border rounded-lg px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-primary'

export function JournalEntriesFilters({ filters, onChange, canView }: Props) {
  const t = useTranslations('accounting.journalEntries.filters')
  const tRoot = useTranslations('accounting.journalEntries')

  // Only fetched when the parent already knows the user can view journal
  // entries — same enabled-gating pattern as Step 1's Command Center, so an
  // unauthorized user never fires these lookups either.
  const { data: branches } = useBranches()
  const { data: fiscalPeriods } = useFiscalPeriods(canView)
  const { data: accounts } = useChartOfAccounts(canView)
  const { data: users } = useUsers()

  const dateRange: DateRange = { from: filters.date_from, to: filters.date_to }

  const set = <K extends keyof JournalEntriesQuery>(key: K, value: JournalEntriesQuery[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker
        value={dateRange}
        onChange={(range) => onChange({ ...filters, date_from: range.from, date_to: range.to })}
        placeholder={t('dateRange')}
      />

      <select
        value={filters.fiscal_period_id ?? ''}
        onChange={(e) => set('fiscal_period_id', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('fiscalPeriod')}</option>
        {(fiscalPeriods ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {tRoot('fiscalPeriodLabel', { number: p.period_number })}
          </option>
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
        value={filters.account_id ?? ''}
        onChange={(e) => set('account_id', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('account')}</option>
        {(accounts ?? []).map((a) => (
          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
        ))}
      </select>

      <select
        value={filters.source_module ?? ''}
        onChange={(e) => set('source_module', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('source')}</option>
        <option value="sales">{t('sourceSales')}</option>
      </select>

      <select
        value={filters.status ?? ''}
        onChange={(e) => set('status', (e.target.value || undefined) as JournalEntriesQuery['status'])}
        className={inputClass}
      >
        <option value="">{t('status')}</option>
        <option value="draft">{t('statusDraft')}</option>
        <option value="posted">{t('statusPosted')}</option>
        <option value="reversed">{t('statusReversed')}</option>
      </select>

      <select
        value={filters.created_by ?? ''}
        onChange={(e) => set('created_by', e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">{t('user')}</option>
        {(users ?? []).map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      <input
        type="number"
        inputMode="decimal"
        placeholder={t('amountMin')}
        value={filters.amount_min ?? ''}
        onChange={(e) => set('amount_min', e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${inputClass} w-28 tabular-nums`}
      />
      <input
        type="number"
        inputMode="decimal"
        placeholder={t('amountMax')}
        value={filters.amount_max ?? ''}
        onChange={(e) => set('amount_max', e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${inputClass} w-28 tabular-nums`}
      />
    </div>
  )
}
