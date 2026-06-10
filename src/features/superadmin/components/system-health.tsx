'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Database, Cpu, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'degraded' | 'down' | 'loading'

interface ComponentHealth {
  status: 'ok' | 'degraded' | 'down'
  latency_ms?: number
  detail?: string
}

interface HealthReport {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  components: {
    database: ComponentHealth
    redis: ComponentHealth
    queues: ComponentHealth
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig = {
  ok:       { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',  dot: 'bg-emerald-500', Icon: CheckCircle },
  degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)', dot: 'bg-amber-500',   Icon: AlertTriangle },
  down:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',  dot: 'bg-red-500',     Icon: XCircle },
  loading:  { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)',dot: 'bg-slate-500',   Icon: MinusCircle },
}

// ─── PulseDot ─────────────────────────────────────────────────────────────────

function PulseDot({ status }: { status: HealthStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className="relative flex h-2 w-2">
      {status !== 'loading' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-60`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
    </span>
  )
}

// ─── ServiceChip ──────────────────────────────────────────────────────────────

interface ServiceChipProps {
  label: string
  status: HealthStatus
  metric: string
  detail?: string
  icon: React.ReactNode
}

function ServiceChip({ label, status, metric, detail, icon }: ServiceChipProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = statusConfig[status]

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200"
      style={{
        background: hovered ? cfg.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? cfg.border : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <span style={{ color: cfg.color }}>{icon}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/80">{label}</span>
          <PulseDot status={status} />
        </div>
        <span className="text-xs font-bold" style={{ color: cfg.color }}>{metric}</span>
      </div>

      <AnimatePresence>
        {hovered && detail && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-50 rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap"
            style={{ background: '#0d0d18', border: `1px solid ${cfg.border}` }}
          >
            <p className="font-semibold" style={{ color: cfg.color }}>{status}</p>
            <p className="text-white/40 mt-0.5">{detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SystemHealth() {
  const t = useTranslations('systemHealth')
  const [time, setTime] = useState<Date | null>(null)

  const { data, isError } = useQuery<HealthReport>({
    queryKey: ['superadmin', 'health'],
    queryFn: () => apiClient.get('/superadmin/health'),
    refetchInterval: 30_000,
    retry: false,
  })

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Derive display values from API data
  const overallStatus: HealthStatus = isError ? 'down' : data ? data.status : 'loading'
  const cfg = statusConfig[overallStatus]

  const db = data?.components.database
  const redis = data?.components.redis
  const queues = data?.components.queues

  const services: ServiceChipProps[] = [
    {
      label: 'Database',
      status: db ? db.status : overallStatus,
      metric: db?.latency_ms != null ? `${db.latency_ms}ms` : '—',
      detail: db?.detail,
      icon: <Database className="h-3.5 w-3.5" />,
    },
    {
      label: 'Redis',
      status: redis ? redis.status : overallStatus,
      metric: redis?.latency_ms != null ? `${redis.latency_ms}ms` : '—',
      detail: redis?.detail,
      icon: <Cpu className="h-3.5 w-3.5" />,
    },
    {
      label: 'Queues',
      status: queues ? queues.status : overallStatus,
      metric: queues?.status ?? '—',
      detail: queues?.detail,
      icon: <Activity className="h-3.5 w-3.5" />,
    },
  ]

  const hasIncident = overallStatus === 'down'
  const hasWarning = overallStatus === 'degraded'

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {(hasIncident || hasWarning) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: hasIncident ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: hasIncident ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <AlertTriangle className={`h-4 w-4 shrink-0 ${hasIncident ? 'text-red-400' : 'text-amber-400'}`} />
            <p className={`text-sm font-medium ${hasIncident ? 'text-red-300' : 'text-amber-300'}`}>
              {hasIncident ? t('incident.title') : t('overall.warning')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex items-center justify-between rounded-xl px-4 py-2.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <PulseDot status={overallStatus} />
            <span className="text-xs font-semibold" style={{ color: cfg.color }}>
              {overallStatus === 'ok'
                ? t('overall.healthy')
                : overallStatus === 'degraded'
                ? t('overall.warning')
                : overallStatus === 'down'
                ? t('overall.critical')
                : '...'}
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-xs text-white/25 font-mono">
            {time
              ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '--:--:--'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {services.map((s) => (
            <ServiceChip key={s.label} {...s} />
          ))}
        </div>
      </div>
    </div>
  )
}