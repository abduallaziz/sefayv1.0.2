'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Database, Cpu, Zap, HardDrive, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline'

interface ServiceHealth {
  id: string
  labelKey: string
  status: HealthStatus
  metric: string
  subKey: string
  icon: React.ReactNode
}

const statusConfig = {
  healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',  dot: 'bg-emerald-500', textKey: 'healthy',  Icon: CheckCircle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)', dot: 'bg-amber-500',   textKey: 'warning',  Icon: AlertTriangle },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',  dot: 'bg-red-500',     textKey: 'critical', Icon: XCircle },
  offline:  { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)',dot: 'bg-slate-500',   textKey: 'offline',  Icon: MinusCircle },
}

const mockServices: ServiceHealth[] = [
  { id: 'api',      labelKey: 'api',      status: 'healthy',  metric: '98ms',  subKey: 'apiSub',      icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'db',       labelKey: 'database', status: 'healthy',  metric: '12ms',  subKey: 'dbSub',       icon: <Database className="h-3.5 w-3.5" /> },
  { id: 'queue',    labelKey: 'queue',    status: 'warning',  metric: '1.2k',  subKey: 'queueSub',    icon: <Cpu className="h-3.5 w-3.5" /> },
  { id: 'ai',       labelKey: 'ai',       status: 'healthy',  metric: '340ms', subKey: 'aiSub',       icon: <Zap className="h-3.5 w-3.5" /> },
  { id: 'storage',  labelKey: 'storage',  status: 'healthy',  metric: '2.1TB', subKey: 'storageSub',  icon: <HardDrive className="h-3.5 w-3.5" /> },
  { id: 'payments', labelKey: 'payments', status: 'critical', metric: '↑22%',  subKey: 'paymentsSub', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
]

function PulseDot({ status }: { status: HealthStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className="relative flex h-2 w-2">
      {status !== 'offline' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-60`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
    </span>
  )
}

function ServiceChip({ service, t }: { service: ServiceHealth; t: any }) {
  const [hovered, setHovered] = useState(false)
  const cfg = statusConfig[service.status]

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
      <span style={{ color: cfg.color }}>{service.icon}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/80">{t(`services.${service.labelKey}`)}</span>
          <PulseDot status={service.status} />
        </div>
        <span className="text-xs font-bold" style={{ color: cfg.color }}>{service.metric}</span>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-50 rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap"
            style={{ background: '#0d0d18', border: `1px solid ${cfg.border}` }}
          >
            <p className="font-semibold" style={{ color: cfg.color }}>{t(`status.${cfg.textKey}`)}</p>
            <p className="text-white/40 mt-0.5">{t(`services.${service.subKey}`)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function SystemHealth() {
  const t = useTranslations('systemHealth')
  const [time, setTime] = useState<Date | null>(null)
  const hasIncident = mockServices.some(s => s.status === 'critical')
  const hasWarning = mockServices.some(s => s.status === 'warning')
  const overallStatus = hasIncident ? 'critical' : hasWarning ? 'warning' : 'healthy'
  const cfg = statusConfig[overallStatus]

  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {hasIncident && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300 font-medium">
              <span className="font-bold">{t('incident.title')}</span> {t('incident.detail')}
            </p>
            <button className="ml-auto text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1 hover:bg-red-500/10 transition-all shrink-0">
              {t('incident.action')}
            </button>
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
              {overallStatus === 'healthy' ? t('overall.healthy') : overallStatus === 'warning' ? t('overall.warning') : t('overall.critical')}
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-xs text-white/25 font-mono">
            {time ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {mockServices.map(s => (
            <ServiceChip key={s.id} service={s} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}