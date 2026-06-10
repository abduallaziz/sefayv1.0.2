'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import {
  Shield, Search, RefreshCw, ChevronDown,
  FileText, DollarSign, LogIn, Settings,
  AlertTriangle, Trash2, CheckCircle, XCircle,
} from 'lucide-react'
import { superadminApi } from '../../api/superadmin.api'
import type { AuditLog } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getActionIcon(action: string): { icon: any; color: string } {
  if (action.startsWith('invoice'))  return { icon: FileText,      color: 'text-blue-400' }
  if (action.startsWith('expense'))  return { icon: DollarSign,    color: 'text-emerald-400' }
  if (action.startsWith('shift'))    return { icon: CheckCircle,   color: 'text-emerald-400' }
  if (action.includes('deactivate')) return { icon: AlertTriangle, color: 'text-red-400' }
  if (action.includes('activate'))   return { icon: CheckCircle,   color: 'text-emerald-400' }
  if (action.includes('delete'))     return { icon: Trash2,        color: 'text-red-500' }
  if (action.includes('login'))      return { icon: LogIn,         color: 'text-slate-400' }
  if (action.includes('logout'))     return { icon: LogIn,         color: 'text-slate-400' }
  if (action.includes('cancel'))     return { icon: XCircle,       color: 'text-amber-400' }
  if (action.includes('permission')) return { icon: Shield,        color: 'text-amber-400' }
  return { icon: Settings, color: 'text-slate-400' }
}

function getSeverity(action: string): 'info' | 'warning' | 'critical' {
  if (
    action.includes('deactivate') ||
    action.includes('delete') ||
    action.includes('permission') ||
    action.includes('cancel')
  ) return 'critical'
  if (
    action.includes('approve') ||
    action.includes('reject') ||
    action.includes('plan')
  ) return 'warning'
  return 'info'
}

const severityBadge = {
  info:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditLogViewer() {
  const t = useTranslations('auditLog')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['superadmin', 'audit-logs', { page, action: actionFilter }],
    queryFn: () =>
      superadminApi.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
      }),
  })

  const logs: AuditLog[] = data?.data ?? []
  const total: number = data?.total ?? 0

  // Client-side search filter (on current page)
  const filtered = logs.filter((log) => {
    if (!search) return true
    return (
      log.action.includes(search.toLowerCase()) ||
      (log.resource ?? '').includes(search.toLowerCase()) ||
      (log.resource_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (log.ip_address ?? '').includes(search)
    )
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#0f1117] border border-[#1e2130] rounded-lg ps-9 pe-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="appearance-none bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 pe-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="">{t('allActions')}</option>
              <option value="invoice">{t('actionTypes.invoice')}</option>
              <option value="expense">{t('actionTypes.expense')}</option>
              <option value="shift">{t('actionTypes.shift')}</option>
              <option value="tenant">{t('actionTypes.tenant')}</option>
              <option value="user">{t('actionTypes.user')}</option>
              <option value="plan">{t('actionTypes.plan')}</option>
              <option value="settings">{t('actionTypes.settings')}</option>
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-[#0f1117] border border-[#1e2130] rounded-lg text-sm text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <div className="text-xs text-slate-500 ms-auto">
            {total} {t('entries')}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#1e2130]">
          {isLoading && (
            <div className="py-12 text-center text-slate-500 text-sm">Loading...</div>
          )}
          {isError && (
            <div className="py-12 text-center text-red-400 text-sm">Failed to load audit logs</div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">{t('noResults')}</div>
          )}

          {filtered.map((log) => {
            const { icon: Icon, color } = getActionIcon(log.action)
            const severity = getSeverity(log.action)
            const isExpanded = expanded === log.id

            return (
              <div key={log.id}>
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1f2e] cursor-pointer transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1e2130] flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{log.action}</span>
                      {log.resource_id && (
                        <span className="text-xs text-slate-500 font-mono">{log.resource_id}</span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${severityBadge[severity]}`}>
                        {severity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">{log.user_id ?? '—'}</span>
                      {log.resource && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span>{log.resource}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex-shrink-0 text-end">
                    {timeAgo(log.created_at)}
                  </div>

                  <ChevronDown className={`w-4 h-4 text-slate-600 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 bg-[#0f1117]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                      {[
                        { label: 'Action',     value: log.action },
                        { label: 'Resource',   value: `${log.resource} / ${log.resource_id ?? '—'}` },
                        { label: 'User',       value: log.user_id ?? '—' },
                        { label: 'Tenant',     value: log.tenant_id ?? 'superadmin' },
                        { label: 'IP',         value: log.ip_address ?? '—' },
                        { label: 'Device',     value: log.user_agent ?? '—' },
                        { label: 'Timestamp',  value: new Date(log.created_at).toLocaleString('en-SA') },
                        { label: 'Severity',   value: severity },
                      ].map((item) => (
                        <div key={item.label} className="bg-[#141720] border border-[#1e2130] rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                          <div className="text-xs font-medium text-white break-all">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2130]">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 bg-[#0f1117] border border-[#1e2130] rounded-lg transition-all"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 bg-[#0f1117] border border-[#1e2130] rounded-lg transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}