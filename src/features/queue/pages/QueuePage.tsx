'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Car, ArrowRight, RotateCcw, X, Plus } from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useBranches } from '@/shared/hooks/useBranches'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ApiError } from '@/lib/api'
import {
  useWashBoard,
  useCreateWashJob,
  useChangeWashStatus,
  useAssignWashWorker,
} from '../hooks/useQueue'
import type { WashJob, WashStatus } from '../api/queue.api'

const COLUMNS = ['waiting', 'washing', 'ready'] as const
const NEXT: Record<string, Exclude<WashStatus, 'waiting'>> = {
  waiting: 'washing',
  washing: 'ready',
  ready: 'delivered',
}
const REWASH_ROLES = ['superadmin', 'owner', 'manager']

const COLUMN_COLORS: Record<string, string> = {
  waiting: 'border-amber-300 dark:border-amber-500/30',
  washing: 'border-blue-300 dark:border-blue-500/30',
  ready: 'border-emerald-300 dark:border-emerald-500/30',
}

function elapsedMinutes(job: WashJob, now: number): number {
  const since =
    job.status === 'ready' && job.ready_at
      ? job.ready_at
      : job.status === 'washing' && job.washing_at
        ? job.washing_at
        : job.created_at
  return Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000))
}

export function QueuePage() {
  const t = useTranslations('queue')
  const { user } = useAuthStore()
  const { data: branches } = useBranches()
  const branchId = user?.branchId ?? branches?.[0]?.id ?? ''
  const canRewash = REWASH_ROLES.includes(user?.role ?? '')

  const { data: board, isLoading } = useWashBoard(branchId)
  const { data: users = [] } = useUsers()
  // Lazy initializer keeps "now" a stable render input (same pattern as the sidebar).
  const [now] = useState(() => Date.now())
  const [plate, setPlate] = useState('')
  const [size, setSize] = useState('')

  const onError = (e: unknown) => {
    toast.error(e instanceof ApiError && e.message ? e.message : t('errors.action'))
  }
  const create = useCreateWashJob(onError)
  const change = useChangeWashStatus(onError)
  const assign = useAssignWashWorker(onError)

  const workerName = (id: string | null) =>
    id ? (users.find((u) => u.id === id)?.name ?? t('unknownWorker')) : t('unassigned')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!plate.trim() || !branchId) return
    create.mutate(
      { branch_id: branchId, plate: plate.trim(), vehicle_size: size || undefined },
      { onSuccess: () => { setPlate(''); setSize('') } },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-gray-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('form.plate')}</label>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            maxLength={32}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('form.size')}</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">{t('size.none')}</option>
            {['small', 'medium', 'large', 'suv'].map((s) => (
              <option key={s} value={s}>{t(`size.${s}`)}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!plate.trim() || !branchId || create.isPending}
          className="flex items-center gap-1 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('form.add')}
        </button>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNS.map((status) => {
            const jobs = board?.columns[status] ?? []
            return (
              <div key={status} className={`bg-white dark:bg-gray-800 border-2 rounded-xl p-4 ${COLUMN_COLORS[status]}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t(`status.${status}`)}</h2>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {jobs.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {jobs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">{t('empty')}</p>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            #{job.queue_number} · {job.plate}
                          </span>
                          <span className="text-xs text-gray-400">
                            {t('elapsed', { minutes: elapsedMinutes(job, now) })}
                          </span>
                        </div>
                        {job.vehicle_size && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t(`size.${job.vehicle_size}`)}</p>
                        )}
                        <select
                          value={job.assigned_worker_id ?? ''}
                          onChange={(e) => assign.mutate({ id: job.id, workerId: e.target.value || null })}
                          aria-label={t('worker')}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="">{t('unassigned')}</option>
                          {users.filter((u) => u.is_active).map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                          {job.assigned_worker_id && !users.some((u) => u.id === job.assigned_worker_id) && (
                            <option value={job.assigned_worker_id}>{workerName(job.assigned_worker_id)}</option>
                          )}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => change.mutate({ id: job.id, status: NEXT[status] })}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-xs font-medium"
                          >
                            {t(`advanceTo.${NEXT[status]}`)}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          {status === 'ready' && canRewash && (
                            <button
                              onClick={() => change.mutate({ id: job.id, status: 'washing' })}
                              title={t('rewash')}
                              aria-label={t('rewash')}
                              className="px-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                          {status !== 'ready' && (
                            <button
                              onClick={() => change.mutate({ id: job.id, status: 'cancelled' })}
                              title={t('cancel')}
                              aria-label={t('cancel')}
                              className="px-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
