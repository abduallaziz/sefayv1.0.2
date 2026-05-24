'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Shield, Search, RefreshCw, ChevronDown,
  FileText, DollarSign, LogIn, Settings,
  AlertTriangle, Trash2, CheckCircle, XCircle,
} from 'lucide-react'

type AuditAction =
  | 'invoice.create' | 'invoice.cancel'
  | 'shift.open' | 'shift.close'
  | 'expense.approve' | 'expense.reject'
  | 'user.login' | 'user.logout'
  | 'tenant.activate' | 'tenant.deactivate'
  | 'settings.change' | 'user.delete'
  | 'plan.change' | 'permission.grant'

interface AuditEntry {
  id: string
  actor: string
  actor_role: string
  tenant: string
  action: AuditAction
  resource_type: string
  resource_id: string
  ip: string
  device: string
  created_at: string
  severity: 'info' | 'warning' | 'critical'
}

const mockLogs: AuditEntry[] = [
  { id: '1', actor: 'أحمد محمد', actor_role: 'cashier', tenant: 'مطعم البيت', action: 'invoice.create', resource_type: 'invoice', resource_id: 'INV-2391', ip: '192.168.1.10', device: 'Chrome / Windows', created_at: '2025-06-14T10:23:11Z', severity: 'info' },
  { id: '2', actor: 'سارة علي', actor_role: 'owner', tenant: 'كافيه نجمة', action: 'expense.approve', resource_type: 'expense', resource_id: 'EXP-441', ip: '10.0.0.5', device: 'Safari / macOS', created_at: '2025-06-14T10:18:44Z', severity: 'info' },
  { id: '3', actor: 'You', actor_role: 'superadmin', tenant: '—', action: 'tenant.deactivate', resource_type: 'tenant', resource_id: 'محل الأمل', ip: '203.0.113.1', device: 'Chrome / macOS', created_at: '2025-06-14T09:55:02Z', severity: 'critical' },
  { id: '4', actor: 'محمد خالد', actor_role: 'manager', tenant: 'ورشة السرعة', action: 'shift.close', resource_type: 'shift', resource_id: 'SHF-102', ip: '192.168.2.21', device: 'Mobile / Android', created_at: '2025-06-14T09:30:00Z', severity: 'info' },
  { id: '5', actor: 'You', actor_role: 'superadmin', tenant: '—', action: 'plan.change', resource_type: 'tenant', resource_id: 'سوبرماركت النور', ip: '203.0.113.1', device: 'Chrome / macOS', created_at: '2025-06-14T09:12:33Z', severity: 'warning' },
  { id: '6', actor: 'نورة سعد', actor_role: 'cashier', tenant: 'مطعم البيت', action: 'invoice.cancel', resource_type: 'invoice', resource_id: 'INV-2388', ip: '192.168.1.11', device: 'Chrome / Windows', created_at: '2025-06-14T08:50:17Z', severity: 'warning' },
  { id: '7', actor: 'You', actor_role: 'superadmin', tenant: '—', action: 'tenant.activate', resource_type: 'tenant', resource_id: 'مطعم الزيتونة', ip: '203.0.113.1', device: 'Chrome / macOS', created_at: '2025-06-14T08:22:55Z', severity: 'info' },
  { id: '8', actor: 'عبدالله ناصر', actor_role: 'owner', tenant: 'محل الأمل', action: 'user.delete', resource_type: 'user', resource_id: 'USR-77', ip: '10.0.1.3', device: 'Firefox / Windows', created_at: '2025-06-14T07:44:08Z', severity: 'critical' },
  { id: '9', actor: 'ريم جمال', actor_role: 'manager', tenant: 'كافيه نجمة', action: 'settings.change', resource_type: 'settings', resource_id: 'notifications', ip: '10.0.0.6', device: 'Chrome / Windows', created_at: '2025-06-14T07:10:41Z', severity: 'info' },
  { id: '10', actor: 'You', actor_role: 'superadmin', tenant: '—', action: 'permission.grant', resource_type: 'user', resource_id: 'USR-33', ip: '203.0.113.1', device: 'Chrome / macOS', created_at: '2025-06-13T23:05:19Z', severity: 'critical' },
]

const actionIcons: Record<AuditAction, { icon: any, color: string }> = {
  'invoice.create':    { icon: FileText,      color: 'text-blue-400' },
  'invoice.cancel':    { icon: XCircle,       color: 'text-amber-400' },
  'shift.open':        { icon: CheckCircle,   color: 'text-emerald-400' },
  'shift.close':       { icon: CheckCircle,   color: 'text-emerald-400' },
  'expense.approve':   { icon: DollarSign,    color: 'text-emerald-400' },
  'expense.reject':    { icon: DollarSign,    color: 'text-red-400' },
  'user.login':        { icon: LogIn,         color: 'text-slate-400' },
  'user.logout':       { icon: LogIn,         color: 'text-slate-400' },
  'tenant.activate':   { icon: CheckCircle,   color: 'text-emerald-400' },
  'tenant.deactivate': { icon: AlertTriangle, color: 'text-red-400' },
  'settings.change':   { icon: Settings,      color: 'text-slate-400' },
  'user.delete':       { icon: Trash2,        color: 'text-red-500' },
  'plan.change':       { icon: Settings,      color: 'text-purple-400' },
  'permission.grant':  { icon: Shield,        color: 'text-amber-400' },
}

const severityBadge = {
  info:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AuditLogViewer() {
  const t = useTranslations('auditLog')
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    return mockLogs.filter(log => {
      const matchSearch = search === '' ||
        log.actor.includes(search) ||
        log.tenant.includes(search) ||
        log.action.includes(search) ||
        log.resource_id.toLowerCase().includes(search.toLowerCase())
      const matchSeverity = severityFilter === 'all' || log.severity === severityFilter
      const matchAction = actionFilter === 'all' || log.action.startsWith(actionFilter)
      return matchSearch && matchSeverity && matchAction
    })
  }, [search, severityFilter, actionFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#0f1117] border border-[#1e2130] rounded-lg ps-9 pe-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="relative">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="appearance-none bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 pe-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="all">{t('allSeverity')}</option>
              <option value="info">{t('severity.info')}</option>
              <option value="warning">{t('severity.warning')}</option>
              <option value="critical">{t('severity.critical')}</option>
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="appearance-none bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 pe-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="all">{t('allActions')}</option>
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
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800) }}
            className="flex items-center gap-2 px-3 py-2 bg-[#0f1117] border border-[#1e2130] rounded-lg text-sm text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="text-xs text-slate-500 ms-auto">
            {filtered.length} {t('entries')}
          </div>

        </div>
      </div>

      {/* Log Table */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#1e2130]">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">{t('noResults')}</div>
          )}

          {filtered.map(log => {
            const { icon: Icon, color } = actionIcons[log.action]
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
                      <span className="text-sm font-medium text-white">{t(`actions.${log.action.replace('.', '_')}`)}</span>
                      <span className="text-xs text-slate-500 font-mono">{log.resource_id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${severityBadge[log.severity]}`}>
                        {t(`severity.${log.severity}`)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{log.actor}</span>
                      <span className="text-slate-700">·</span>
                      <span className="capitalize">{log.actor_role}</span>
                      {log.tenant !== '—' && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span>{log.tenant}</span>
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
                        { label: t('details.actor'),     value: `${log.actor} (${log.actor_role})` },
                        { label: t('details.tenant'),    value: log.tenant },
                        { label: t('details.ip'),        value: log.ip },
                        { label: t('details.device'),    value: log.device },
                        { label: t('details.action'),    value: log.action },
                        { label: t('details.resource'),  value: `${log.resource_type} / ${log.resource_id}` },
                        { label: t('details.timestamp'), value: new Date(log.created_at).toLocaleString('en-SA') },
                        { label: t('details.severity'),  value: log.severity },
                      ].map(item => (
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
      </div>
    </div>
  )
}