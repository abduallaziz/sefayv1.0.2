'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Wallet, Calendar } from 'lucide-react'
import { usePayrollReport } from '../hooks/useReports'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { formatNumber } from '@/lib/format'
import { useCreateException } from '@/features/hr/hooks/useHr'
import { useUsers } from '@/features/users/hooks/useUsers'
import { DateRangePicker, SingleDatePicker } from '@/shared/ui/date-range-picker'

function currentMonth() {
  return new Date().toISOString().substring(0, 7)
}

export function PayrollReportPage() {
  const t = useTranslations('reports.payroll')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [month, setMonth] = useState(currentMonth())
  const { data, isLoading, refetch } = usePayrollReport(month)
  const { data: users = [] } = useUsers()
  const { mutate: createException, isPending: excusing } = useCreateException()

  const [excuseUserId, setExcuseUserId] = useState('')
  const [excuseDateFrom, setExcuseDateFrom] = useState('')
  const [excuseDateTo, setExcuseDateTo] = useState('')
  const [excuseReason, setExcuseReason] = useState('')
  const [excuseSuccess, setExcuseSuccess] = useState(false)

  const handleExcuse = () => {
    if (!excuseUserId || !excuseDateFrom || !excuseDateTo || !excuseReason) return
    setExcuseSuccess(false)
    createException(
      { user_id: excuseUserId, date_from: excuseDateFrom, date_to: excuseDateTo, reason: excuseReason },
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
          <Calendar className="w-4 h-4 text-gray-400" />
          <SingleDatePicker
            value={`${month}-01`}
            onChange={(v) => setMonth((v ?? currentMonth()).substring(0, 7))}
          />
        </div>
      </div>

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
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{formatNumber(e.base_salary)} {currency}</td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{e.scheduled_days}</td>
                    <td className="px-3 py-3">
                      <span className="text-red-600 dark:text-red-400">{e.absence_count}</span>
                      {e.absence_deduction > 0 && (
                        <span className="text-xs text-gray-400"> (-{formatNumber(e.absence_deduction)} {currency})</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-amber-600 dark:text-amber-400">{e.late_count}</span>
                      {e.late_deduction > 0 && (
                        <span className="text-xs text-gray-400"> (-{formatNumber(e.late_deduction)} {currency})</span>
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
                            <span className="text-xs text-gray-400"> (-{formatNumber(e.leave_deduction)} {currency})</span>
                          )}
                        </span>
                      )}
                      {e.leave_paid_days === 0 && e.leave_unpaid_days === 0 && (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white">{formatNumber(e.net_salary)} {currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('excuseAbsence')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={excuseUserId}
              onChange={(e) => setExcuseUserId(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
            >
              <option value="">{t('selectEmployee')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <DateRangePicker
              className="w-full"
              value={{ from: excuseDateFrom || undefined, to: excuseDateTo || undefined }}
              onChange={(range) => {
                setExcuseDateFrom(range.from ?? '')
                setExcuseDateTo(range.to ?? '')
              }}
            />
            <input
              placeholder={t('reason')}
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
            />
          </div>
          {excuseSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('excused')}</p>}
          <button
            onClick={handleExcuse}
            disabled={excusing || !excuseUserId || !excuseDateFrom || !excuseDateTo || !excuseReason}
            className="px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {excusing ? t('saving') : t('markExcused')}
          </button>
        </div>
      )}
    </div>
  )
}
