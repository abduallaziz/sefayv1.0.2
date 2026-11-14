'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Wallet, ChevronRight, ChevronLeft, Download } from 'lucide-react'
import { usePayrollReport } from '../hooks/useReports'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { formatNumber } from '@/lib/format'
import { useCreateException } from '@/features/hr/hooks/useHr'
import { useUsers } from '@/features/users/hooks/useUsers'
import { DateRangePicker } from '@/shared/ui/date-range-picker'

function currentMonth() {
  return new Date().toISOString().substring(0, 7)
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return d.toISOString().substring(0, 7)
}

// Amounts must never wrap or lose their minus sign (bidi): one unbreakable LTR run.
function Amount({ value, currency, negative }: { value: number; currency: string; negative?: boolean }) {
  return (
    <span dir="ltr" className="whitespace-nowrap [unicode-bidi:isolate]">
      {negative ? '-' : ''}{formatNumber(value)} {currency}
    </span>
  )
}

export function PayrollReportPage() {
  const t = useTranslations('reports.payroll')
  const locale = useLocale()
  const currency = useCurrencyDisplay()
  const [month, setMonth] = useState(currentMonth())
  const { data, isLoading, refetch } = usePayrollReport(month)
  const { data: users = [] } = useUsers()
  const { mutate: createException, isPending: excusing } = useCreateException()

  const [excuseUserId, setExcuseUserId] = useState('')
  const [excuseDateFrom, setExcuseDateFrom] = useState('')
  const [excuseDateTo, setExcuseDateTo] = useState('')
  const [excuseReason, setExcuseReason] = useState('')
  const [excuseSuccess, setExcuseSuccess] = useState(false)
  const [excuseError, setExcuseError] = useState<string | null>(null)

  const isFutureMonth = month > currentMonth()
  const monthLabel = new Date(`${month}-15T12:00:00`).toLocaleDateString(
    locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US',
    { month: 'long', year: 'numeric' },
  )
  const rows = useMemo(() => data?.employees ?? [], [data])
  const totals = useMemo(
    () => rows.reduce(
      (acc, e) => ({
        base: acc.base + e.base_salary,
        absence: acc.absence + e.absence_deduction,
        late: acc.late + e.late_deduction,
        leave: acc.leave + e.leave_deduction,
        net: acc.net + e.net_salary,
      }),
      { base: 0, absence: 0, late: 0, leave: 0, net: 0 },
    ),
    [rows],
  )
  // Only employees that are actually on payroll can be excused from an absence.
  const excusable = rows.length > 0 ? users.filter((u) => rows.some((r) => r.user_id === u.id)) : users

  function exportCsv() {
    const header = [t('employee'), t('baseSalary'), t('scheduledDays'), t('absences'), t('absenceDeduction'), t('late'), t('lateDeduction'), t('leaveDeduction'), t('netSalary')]
    const lines = rows.map((e) => [
      e.name, e.base_salary, e.scheduled_days, e.absence_count, e.absence_deduction, e.late_count, e.late_deduction, e.leave_deduction, e.net_salary,
    ])
    const csv = [header, ...lines]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExcuse = () => {
    setExcuseSuccess(false)
    if (!excuseUserId) return setExcuseError(t('errExcuseEmployee'))
    if (!excuseDateFrom || !excuseDateTo) return setExcuseError(t('errExcusePeriod'))
    if (!excuseReason.trim()) return setExcuseError(t('errExcuseReason'))
    setExcuseError(null)
    createException(
      { user_id: excuseUserId, date_from: excuseDateFrom, date_to: excuseDateTo, reason: excuseReason.trim() },
      {
        onSuccess: () => {
          setExcuseDateFrom('')
          setExcuseDateTo('')
          setExcuseReason('')
          setExcuseSuccess(true)
          refetch()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" /> {t('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t('prevMonth')} onClick={() => setMonth((m) => shiftMonth(m, -1))} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="min-w-[8rem] text-center text-sm font-semibold text-gray-900 dark:text-white">{monthLabel}</span>
          <button type="button" aria-label={t('nextMonth')} onClick={() => setMonth((m) => shiftMonth(m, 1))} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            {t('export')}
          </button>
        </div>
      </div>
      {isFutureMonth && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">{t('futureMonthNote')}</p>
      )}

      {isLoading ? (
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ) : (data?.employees ?? []).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('empty')}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('baseSalary')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('scheduledDays')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('absences')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('late')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('leave')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('netSalary')}</th>
                </tr>
              </thead>
              <tbody>
                {data!.employees.map((e) => (
                  <tr key={e.user_id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="px-3 py-3 text-gray-900 dark:text-white font-medium">{e.name}</td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400"><Amount value={e.base_salary} currency={currency} /></td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{e.scheduled_days}</td>
                    <td className="px-3 py-3">
                      <span className="text-red-600 dark:text-red-400">{e.absence_count}</span>
                      {e.absence_deduction > 0 && (
                        <span className="text-xs text-gray-400 block"><Amount value={e.absence_deduction} currency={currency} negative /></span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-amber-600 dark:text-amber-400">{e.late_count}</span>
                      {e.late_deduction > 0 && (
                        <span className="text-xs text-gray-400 block"><Amount value={e.late_deduction} currency={currency} negative /></span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {e.leave_paid_days > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">{t('leavePaidDays', { count: e.leave_paid_days })}</span>
                      )}
                      {e.leave_unpaid_days > 0 && (
                        <span className="text-red-600 dark:text-red-400 block">
                          {t('leaveUnpaidDays', { count: e.leave_unpaid_days })}
                          {e.leave_deduction > 0 && (
                            <span className="text-xs text-gray-400 block"><Amount value={e.leave_deduction} currency={currency} negative /></span>
                          )}
                        </span>
                      )}
                      {e.leave_paid_days === 0 && e.leave_unpaid_days === 0 && (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white"><Amount value={e.net_salary} currency={currency} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 font-semibold text-gray-900 dark:text-white">
                  <td className="px-3 py-3">{t('totals')}</td>
                  <td className="px-3 py-3"><Amount value={totals.base} currency={currency} /></td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3"><Amount value={totals.absence} currency={currency} negative /></td>
                  <td className="px-3 py-3"><Amount value={totals.late} currency={currency} negative /></td>
                  <td className="px-3 py-3"><Amount value={totals.leave} currency={currency} negative /></td>
                  <td className="px-3 py-3"><Amount value={totals.net} currency={currency} /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('excuseAbsence')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              aria-label={t('selectEmployee')}
              value={excuseUserId}
              onChange={(e) => { setExcuseUserId(e.target.value); setExcuseSuccess(false); setExcuseError(null) }}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
            >
              <option value="">{t('selectEmployee')}</option>
              {excusable.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <DateRangePicker
              className="w-full"
              value={{ from: excuseDateFrom || undefined, to: excuseDateTo || undefined }}
              onChange={(range) => {
                setExcuseDateFrom(range.from ?? '')
                setExcuseDateTo(range.to ?? '')
                setExcuseError(null)
              }}
            />
            <input
              aria-label={t('reason')}
              placeholder={t('reason')}
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
            />
          </div>
          {excuseSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('excused')}</p>}
          {excuseError && <p role="alert" className="text-sm text-red-500">{excuseError}</p>}
          <button
            type="button"
            onClick={handleExcuse}
            disabled={excusing}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {excusing ? t('saving') : t('markExcused')}
          </button>
        </div>
      )}
    </div>
  )
}
