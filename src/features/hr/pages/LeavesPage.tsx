'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDays, Check, X } from 'lucide-react'
import { useLeaveRequests, useApproveLeaveRequest, useRejectLeaveRequest } from '../hooks/useHr'
import type { LeaveRequest } from '../api/hr.api'

type Filter = 'pending' | 'approved' | 'rejected' | undefined

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: undefined, labelKey: 'filterAll' },
  { key: 'pending', labelKey: 'filterPending' },
  { key: 'approved', labelKey: 'filterApproved' },
  { key: 'rejected', labelKey: 'filterRejected' },
]

const AVATAR_COLORS = ['#0C447C', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function LeavesPage() {
  const t = useTranslations('leaves')
  const [filter, setFilter] = useState<Filter>(undefined)
  const { data: requests = [], isLoading } = useLeaveRequests(filter)
  const approve = useApproveLeaveRequest()
  const reject = useRejectLeaveRequest()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.labelKey}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-white dark:bg-gray-900 text-[#0C447C] dark:text-[#5B9BD5] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">{t('noRequests')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {requests.map((r) => (
              <LeaveRow
                key={r.id}
                request={r}
                onApprove={() => approve.mutate(r.id)}
                onReject={() => reject.mutate(r.id)}
                pending={approve.isPending || reject.isPending}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LeaveRow({
  request,
  onApprove,
  onReject,
  pending,
  t,
}: {
  request: LeaveRequest
  onApprove: () => void
  onReject: () => void
  pending: boolean
  t: ReturnType<typeof useTranslations>
}) {
  const name = request.users?.name ?? '—'
  const typeKey = `leaveType${request.leave_type.charAt(0).toUpperCase()}${request.leave_type.slice(1)}`

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {initials(name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{name}</p>
        {request.users?.job_title && <p className="text-xs text-slate-400 truncate">{request.users.job_title}</p>}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 hidden sm:block">
        {t(typeKey)}
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-300 shrink-0 text-end">
        <p>{request.date_from} → {request.date_to}</p>
        <p className="text-slate-400">{request.days_count} {t('days')}</p>
      </div>

      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
        request.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
        : request.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
      }`}>
        {t(`filter${request.status.charAt(0).toUpperCase()}${request.status.slice(1)}`)}
      </span>

      {request.status === 'pending' && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onApprove}
            disabled={pending}
            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
            title={t('approve')}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReject}
            disabled={pending}
            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            title={t('reject')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
