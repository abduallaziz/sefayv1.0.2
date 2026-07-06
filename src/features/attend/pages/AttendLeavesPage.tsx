'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { TenantHeader } from '../components/TenantHeader'

interface Leave {
  id: string
  leave_type: string
  date_from: string
  date_to: string
  days_count: number
  status: 'pending' | 'approved' | 'rejected'
}

export function AttendLeavesPage({ token }: { token: string }) {
  const t = useTranslations('attend')
  const [leaves, setLeaves] = useState<Leave[] | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/v1/attend/${token}/dashboard`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setLeaves(data.recent_leaves)
          setBalance(data.leave_balance)
        }
      })
      .catch(() => {})
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <TenantHeader token={token} />
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-slate-400" />
          <h1 className="text-base font-semibold text-slate-800 dark:text-white">{t('navLeaves')}</h1>
        </div>

        {balance !== null && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 text-center mb-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{balance}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('leaveBalance')}</p>
          </div>
        )}

        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
          {leaves === null ? (
            <div className="h-16 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : leaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('noLeaves')}</p>
          ) : (
            leaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-lg p-3 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  l.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : l.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  {t(l.status)}
                </span>
                <div className="text-end">
                  <p className="font-medium text-slate-700 dark:text-slate-300">{t('leaveDaysCount', { count: l.days_count })}</p>
                  <p className="text-slate-400">{l.date_from} → {l.date_to}</p>
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
