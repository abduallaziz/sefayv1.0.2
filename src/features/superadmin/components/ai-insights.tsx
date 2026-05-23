'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, TrendingDown, TrendingUp, AlertTriangle,
  Shield, ChevronRight, Brain, RefreshCw,
} from 'lucide-react'

type InsightType = 'churn' | 'growth' | 'risk' | 'anomaly' | 'security'

interface Insight {
  id: string
  type: InsightType
  severity: 'low' | 'medium' | 'high'
  titleKey: string
  detailKey: string
  metric?: string
  metricLabelKey?: string
  actionKey: string
  tenants?: string[]
  confidence: number
}

const typeConfig = {
  churn:    { color: '#f87171', bg: 'rgba(248,113,113,0.06)',  border: 'rgba(248,113,113,0.15)', icon: <TrendingDown className="h-4 w-4" /> },
  growth:   { color: '#34d399', bg: 'rgba(52,211,153,0.06)',   border: 'rgba(52,211,153,0.15)',  icon: <TrendingUp className="h-4 w-4" /> },
  risk:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',   border: 'rgba(251,191,36,0.15)',  icon: <AlertTriangle className="h-4 w-4" /> },
  anomaly:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.06)',  border: 'rgba(167,139,250,0.15)', icon: <Brain className="h-4 w-4" /> },
  security: { color: '#fb923c', bg: 'rgba(251,146,60,0.06)',   border: 'rgba(251,146,60,0.15)',  icon: <Shield className="h-4 w-4" /> },
}

const insights: Insight[] = [
  { id: '1', type: 'churn',    severity: 'high',   titleKey: 'churnTitle',    detailKey: 'churnDetail',    metric: '87%', metricLabelKey: 'confidence', actionKey: 'viewTenants', tenants: ['Quick Bites', 'Al Noor Shop', 'Fix It Workshop'], confidence: 87 },
  { id: '2', type: 'growth',   severity: 'low',    titleKey: 'growthTitle',   detailKey: 'growthDetail',   metric: '+18%', metricLabelKey: 'thisWeek',  actionKey: 'viewSegment', confidence: 94 },
  { id: '3', type: 'risk',     severity: 'high',   titleKey: 'riskTitle',     detailKey: 'riskDetail',     metric: '22%',  metricLabelKey: 'failureRate', actionKey: 'investigate', confidence: 91 },
  { id: '4', type: 'security', severity: 'medium', titleKey: 'securityTitle', detailKey: 'securityDetail', metric: '3x',   metricLabelKey: 'deviation',  actionKey: 'review', tenants: ['Fashion Store', 'Beauty Salon'], confidence: 78 },
  { id: '5', type: 'anomaly',  severity: 'medium', titleKey: 'anomalyTitle',  detailKey: 'anomalyDetail',  metric: '8x',   metricLabelKey: 'normalUsage', actionKey: 'viewLogs', confidence: 82 },
]

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-white/20"
        />
      </div>
      <span className="text-[10px] text-white/25">{value}%</span>
    </div>
  )
}

function InsightCard({ insight, index, t }: { insight: Insight; index: number; t: any }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = typeConfig[insight.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => setExpanded(!expanded)}
      className="group relative rounded-xl p-4 cursor-pointer transition-all duration-200"
      style={{
        background: expanded ? cfg.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${expanded ? cfg.border : 'rgba(255,255,255,0.05)'}`,
      }}
      onMouseEnter={e => { if (!expanded) { e.currentTarget.style.background = cfg.bg; e.currentTarget.style.borderColor = cfg.border } }}
      onMouseLeave={e => { if (!expanded) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' } }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white/85 leading-snug">{t(`insights.${insight.titleKey}`)}</p>
            {insight.metric && (
              <div className="shrink-0 text-right">
                <p className="text-base font-bold" style={{ color: cfg.color }}>{insight.metric}</p>
                <p className="text-[10px] text-white/25">{insight.metricLabelKey ? t(`metrics.${insight.metricLabelKey}`) : ''}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-white/35 mt-1 leading-relaxed">{t(`insights.${insight.detailKey}`)}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3 w-3 text-white/20" />
              <span className="text-[10px] text-white/25">{t('aiConfidence')}</span>
              <ConfidenceBar value={insight.confidence} />
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-white/20 transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              {insight.tenants && (
                <div className="flex flex-wrap gap-1">
                  {insight.tenants.map(t => (
                    <span key={t} className="text-[10px] rounded-md px-2 py-1 font-medium"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={e => e.stopPropagation()}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
              >
                {t(`actions.${insight.actionKey}`)}
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function AiInsights() {
  const t = useTranslations('aiInsights')
  const [refreshing, setRefreshing] = useState(false)
  const critical = insights.filter(i => i.severity === 'high').length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.15))', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
            <p className="text-[10px] text-white/25">{t('updated')}</p>
          </div>
          {critical > 0 && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
              {critical} {t('critical')}
            </span>
          )}
        </div>
        <button
          onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1200) }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8 }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </motion.div>
        </button>
      </div>
      <div className="p-3 space-y-2">
        {insights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} index={i} t={t} />
        ))}
      </div>
    </div>
  )
}