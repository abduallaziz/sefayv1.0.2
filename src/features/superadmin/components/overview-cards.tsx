'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Building2, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { GlobalStats } from '../types'

interface StatCardProps {
  title: string
  value: string
  change?: number
  icon: React.ReactNode
  gradient: string
  glowColor: string
  index: number
  badge?: string
}

function StatCard({ title, value, change, icon, gradient, index, badge }: StatCardProps) {
  const [hovered, setHovered] = useState(false)
  const isPositive = change !== undefined && change > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative cursor-pointer rounded-xl p-4 transition-all duration-200"
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${gradient}`}>
            {icon}
          </div>
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</span>
        </div>
        {badge && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/40">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-2">{value}</p>
      {change !== undefined && (
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
          <div className="flex items-end gap-0.5 h-5">
            {[3, 5, 4, 7, 6, 8, 9].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h * 2.5}px` }}
                transition={{ delay: index * 0.08 + i * 0.04 }}
                className={`w-1 rounded-full ${isPositive ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface OverviewCardsProps {
  stats: GlobalStats
  mrr?: number
  arr?: number
}

export function OverviewCards({ stats, mrr = 0, arr = 0 }: OverviewCardsProps) {
  const t = useTranslations('overview')

  const cards = [
    {
      title: t('totalTenants'),
      value: stats.totalTenants.toLocaleString(),
      change: 12,
      icon: <Building2 className="h-4 w-4 text-white" />,
      gradient: 'bg-gradient-to-br from-violet-600 to-indigo-600',
      glowColor: 'bg-violet-600',
      badge: 'Live',
    },
    {
      title: t('monthlyRevenue'),
      value: `$${mrr.toLocaleString()}`,
      change: 8,
      icon: <DollarSign className="h-4 w-4 text-white" />,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      glowColor: 'bg-emerald-500',
      badge: 'MRR',
    },
    {
      title: t('totalUsers'),
      value: stats.totalUsers.toLocaleString(),
      change: 5,
      icon: <Users className="h-4 w-4 text-white" />,
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      glowColor: 'bg-blue-500',
    },
    {
      title: t('annualRevenue'),
      value: `$${(arr / 1000).toFixed(0)}k`,
      change: -2,
      icon: <TrendingUp className="h-4 w-4 text-white" />,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      glowColor: 'bg-amber-500',
      badge: 'ARR',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <StatCard key={card.title} {...card} index={index} />
      ))}
    </div>
  )
}