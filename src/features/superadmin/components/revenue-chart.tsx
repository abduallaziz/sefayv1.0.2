'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useThemeStore } from '@/core/theme/stores/theme.store'
import type { MRRHistoryPoint } from '../types'

const PERIODS = ['7D', '1M', '3M', '1Y'] as const
type Period = typeof PERIODS[number]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-4 shadow-2xl">
      <p className="text-xs text-slate-400 dark:text-white/40 mb-2 uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-500" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">${payload[0]?.value?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

interface RevenueChartProps {
  data: MRRHistoryPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const t = useTranslations('revenueChart')
  const [activePeriod, setActivePeriod] = useState<Period>('1M')
  const isDark = useThemeStore((s) => s.theme === 'dark')

  const axisTick = isDark ? '#ffffff30' : '#94a3b8'
  const gridStroke = isDark ? '#ffffff08' : '#e2e8f0'
  const cursorStroke = isDark ? '#ffffff10' : '#cbd5e1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1117] p-6 overflow-hidden relative"
    >
      <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('title')}</h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                activePeriod === p ? 'text-white' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70'
              }`}
            >
              {activePeriod === p && (
                <motion.div layoutId="activePeriod" className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600" />
              )}
              <span className="relative">{p}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span className="text-xs text-slate-400 dark:text-white/40">{t('revenue')}</span>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: axisTick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisTick, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} width={45} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorStroke, strokeWidth: 1 }} />
            <Area type="monotone" dataKey="mrr" stroke="#7c3aed" strokeWidth={2.5} fill="url(#gRevenue)" dot={false} activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}