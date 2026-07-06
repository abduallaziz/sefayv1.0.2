'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays, Plus, X } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { TenantHeader } from '../components/TenantHeader'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'

interface Leave {
  id: string
  leave_type: string
  date_from: string
  date_to: string
  days_count: number
  status: 'pending' | 'approved' | 'rejected'
}

const LEAVE_TYPES = ['annual', 'sick', 'unpaid', 'other'] as const

function calculateLeaveDays(dateFrom: string, dateTo: string): number {
  return Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1
}

export function AttendLeavesPage({ token }: { token: string }) {
  const t = useTranslations('attend')
  const [leaves, setLeaves] = useState<Leave[] | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [leaveType, setLeaveType] = useState<typeof LEAVE_TYPES[number]>('annual')
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined)
  const [dateTo, setDateTo] = useState<string | undefined>(undefined)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const requestedDays = useMemo(
    () => (dateFrom && dateTo && dateTo >= dateFrom ? calculateLeaveDays(dateFrom, dateTo) : 0),
    [dateFrom, dateTo],
  )
  const exceedsBalance = balance !== null && requestedDays > balance

  function loadLeaves() {
    fetch(`/api/v1/attend/${token}/dashboard`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setLeaves(data.recent_leaves)
          setBalance(data.leave_balance)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadLeaves()
  }, [token])

  async function handleSubmit() {
    if (!dateFrom || !dateTo || exceedsBalance) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch(`/api/v1/attend/${token}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_type: leaveType, date_from: dateFrom, date_to: dateTo, reason: reason || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.error === 'LEAVE_BALANCE_EXCEEDED') {
          setFormError(t('leaveBalanceExceeded', { count: data.available }))
        } else {
          setFormError(t('leaveRequestError'))
        }
        return
      }
      setShowForm(false)
      setLeaveType('annual')
      setDateFrom(undefined)
      setDateTo(undefined)
      setReason('')
      loadLeaves()
    } catch {
      setFormError(t('leaveRequestError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 w-full max-w-sm">
        <TenantHeader token={token} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-slate-400" />
            <h1 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">{t('navLeaves')}</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-[#0C447C] hover:bg-[#0a3863] transition-colors rounded-lg px-3 py-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('newLeaveRequest')}
            </button>
          )}
        </div>

        {balance !== null && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 text-center mb-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{balance}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('leaveBalance')}</p>
          </div>
        )}

        {showForm && (
          <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('newLeaveRequest')}</p>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('leaveTypeLabel')}</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as typeof leaveType)}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-slate-800 dark:text-white"
              >
                {LEAVE_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{t(`leaveType${lt.charAt(0).toUpperCase()}${lt.slice(1)}`)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('dateFromLabel')}</label>
                <SingleDatePicker value={dateFrom} onChange={setDateFrom} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('dateToLabel')}</label>
                <SingleDatePicker value={dateTo} onChange={setDateTo} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('reasonLabel')}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                rows={2}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-slate-800 dark:text-white resize-none"
              />
            </div>

            {exceedsBalance && (
              <p className="text-xs text-red-500 font-medium">{t('leaveBalanceExceeded', { count: balance })}</p>
            )}
            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !dateFrom || !dateTo || exceedsBalance}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[#0C447C] hover:bg-[#0a3863] disabled:opacity-50 transition-colors shadow-sm"
              >
                {submitting ? t('submitting') : t('submitLeaveRequest')}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
          {leaves === null ? (
            <div className="h-16 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : leaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('noLeaves')}</p>
          ) : (
            leaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-lg p-3 text-xs shadow-sm">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  l.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : l.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  {t(l.status)}
                </span>
                <div className="text-end">
                  <p className="font-medium text-slate-700 dark:text-slate-300">{t('leaveDaysCount', { count: l.days_count })}</p>
                  <p className="text-slate-400">{t('leaveDateRange', { from: l.date_from, to: l.date_to })}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <BottomNav token={token} />
      </div>
    </div>
  )
}
