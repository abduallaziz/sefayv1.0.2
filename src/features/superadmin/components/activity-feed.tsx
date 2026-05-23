'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, CreditCard, AlertTriangle, Shield,
  Zap, TrendingUp, RefreshCw, XCircle, CheckCircle,
} from 'lucide-react'

type Severity = 'info' | 'success' | 'warning' | 'critical'

interface ActivityEvent {
  id: string
  severity: Severity
  category: string
  titleKey: string
  detailKey: string
  time: string
  tenant?: string
  actionKey?: string
}

const severityConfig = {
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.15)',  labelKey: 'info' },
  success:  { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)',  labelKey: 'ok' },
  warning:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)',  labelKey: 'warn' },
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)', labelKey: 'crit' },
}

const categoryIcons: Record<string, React.ReactNode> = {
  tenant:   <UserPlus className="h-3.5 w-3.5" />,
  billing:  <CreditCard className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
  system:   <RefreshCw className="h-3.5 w-3.5" />,
  ai:       <Zap className="h-3.5 w-3.5" />,
  growth:   <TrendingUp className="h-3.5 w-3.5" />,
}

const initialEvents: ActivityEvent[] = [
  { id: '1', severity: 'critical', category: 'billing',  titleKey: 'paymentFailure',    detailKey: 'paymentFailureDetail',    time: '2m ago',  tenant: 'Platform-wide', actionKey: 'investigate' },
  { id: '2', severity: 'warning',  category: 'system',   titleKey: 'queueDelay',        detailKey: 'queueDelayDetail',        time: '4m ago' },
  { id: '3', severity: 'success',  category: 'tenant',   titleKey: 'newTenant',         detailKey: 'newTenantDetail',         time: '7m ago',  tenant: 'Coffee House' },
  { id: '4', severity: 'info',     category: 'billing',  titleKey: 'subUpgraded',       detailKey: 'subUpgradedDetail',       time: '12m ago', tenant: 'Tech Repairs' },
  { id: '5', severity: 'warning',  category: 'security', titleKey: 'suspiciousLogin',   detailKey: 'suspiciousLoginDetail',   time: '18m ago', tenant: 'Fashion Store', actionKey: 'review' },
  { id: '6', severity: 'info',     category: 'ai',       titleKey: 'aiAnomaly',         detailKey: 'aiAnomalyDetail',         time: '25m ago', tenant: 'Quick Bites' },
  { id: '7', severity: 'success',  category: 'billing',  titleKey: 'invoicePaid',       detailKey: 'invoicePaidDetail',       time: '31m ago', tenant: 'Fashion Store' },
  { id: '8', severity: 'info',     category: 'growth',   titleKey: 'restaurantGrowth',  detailKey: 'restaurantGrowthDetail',  time: '1h ago' },
]

const newEventTemplates: ActivityEvent[] = [
  { id: '', severity: 'success', category: 'tenant',  titleKey: 'newSignup',     detailKey: 'newSignupDetail',     time: 'justNow', tenant: 'Beauty Salon' },
  { id: '', severity: 'warning', category: 'billing', titleKey: 'trialExpiring', detailKey: 'trialExpiringDetail', time: 'justNow' },
  { id: '', severity: 'info',    category: 'ai',      titleKey: 'aiWorkflow',    detailKey: 'aiWorkflowDetail',    time: 'justNow', tenant: 'Tech Repairs' },
]

const FILTER_KEYS = ['all', 'critical', 'billing', 'security', 'system', 'ai'] as const
type Filter = typeof FILTER_KEYS[number]

function EventRow({ event, isNew, t }: { event: ActivityEvent; isNew?: boolean; t: any }) {
  const cfg = severityConfig[event.severity]
  const icon = categoryIcons[event.category]

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, height: 0 } : { opacity: 1, x: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className="group flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer border-b border-white/3 last:border-0"
    >
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: cfg.bg, color: cfg.color }}>
          {icon}
        </div>
        <span className="text-[9px] font-bold tracking-wider" style={{ color: cfg.color }}>
          {t(`severity.${cfg.labelKey}`)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-white/85 truncate">{t(`events.${event.titleKey}`)}</p>
          {isNew && (
            <span className="shrink-0 rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-400 uppercase">
              {t('new')}
            </span>
          )}
        </div>
        <p className="text-xs text-white/35 mt-0.5">{t(`events.${event.detailKey}`)}</p>
        {event.tenant && <p className="text-xs text-white/20 mt-0.5">↳ {event.tenant}</p>}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-xs text-white/25 font-mono">{event.time}</span>
        {event.actionKey && (
          <button
            className="text-[10px] font-medium rounded-md px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {t(`actions.${event.actionKey}`)}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function ActivityFeed() {
  const t = useTranslations('activity')
  const [events, setEvents] = useState(initialEvents)
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      const template = newEventTemplates[Math.floor(Math.random() * newEventTemplates.length)]
      const newEvent = { ...template, id: Date.now().toString() }
      setEvents(prev => [newEvent, ...prev.slice(0, 19)])
      setNewIds(prev => new Set([...prev, newEvent.id]))
      setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(newEvent.id); return n }), 3000)
    }, 5000)
    return () => clearInterval(interval)
  }, [paused])

  const filtered = events.filter(e => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'critical') return e.severity === 'critical'
    return e.category.toLowerCase() === activeFilter.toLowerCase()
  })

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
          <span className="text-xs text-white/25 font-mono">{events.length} {t('eventsCount')}</span>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 transition-all"
          style={{
            color: paused ? '#fbbf24' : '#ffffff50',
            background: paused ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${paused ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {paused ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {paused ? t('resume') : t('pause')}
        </button>
      </div>

      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto">
        {FILTER_KEYS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="shrink-0 text-xs rounded-lg px-3 py-1.5 transition-all font-medium"
            style={{
              color: activeFilter === f ? '#fff' : 'rgba(255,255,255,0.3)',
              background: activeFilter === f ? 'rgba(124,58,237,0.2)' : 'transparent',
              border: `1px solid ${activeFilter === f ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
            }}
          >
            {t(`filters.${f}`)}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
        <AnimatePresence initial={false}>
          {filtered.map(event => (
            <EventRow key={event.id} event={event} isNew={newIds.has(event.id)} t={t} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}