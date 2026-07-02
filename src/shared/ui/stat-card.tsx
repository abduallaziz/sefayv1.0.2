'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'

/* ── Sparkline (SVG inline — zero deps) ─────────────────── */
function Sparkline({ data, color = '#0C447C' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 32
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  const area = `0,${h} ${polyline} ${w},${h}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={area}
        fill={`url(#sg-${color.replace('#', '')})`}
      />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r="3"
        fill={color}
      />
    </svg>
  )
}

/* ── StatCard Props ──────────────────────────────────────── */
export interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  sparkline?: number[]
  sparklineColor?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  theme?: 'dashboard' | 'superadmin'
  className?: string
}

/* ── Color maps ──────────────────────────────────────────── */
const iconColors: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-brand-light dark:bg-brand/20',     text: 'text-brand dark:text-blue-300' },
  success: { bg: 'bg-semantic-success-bg',               text: 'text-semantic-success' },
  warning: { bg: 'bg-semantic-warning-bg',               text: 'text-semantic-warning' },
  danger:  { bg: 'bg-semantic-error-bg',                 text: 'text-semantic-error' },
  info:    { bg: 'bg-semantic-info-bg',                  text: 'text-semantic-info' },
}

const changeColors = {
  up:      'text-semantic-success',
  down:    'text-semantic-error',
  neutral: 'text-content-muted',
}

/* ── Component ───────────────────────────────────────────── */
export function StatCard({
  title,
  value,
  sub,
  change,
  changeLabel,
  icon: Icon,
  sparkline,
  sparklineColor = '#0C447C',
  variant = 'default',
  theme = 'dashboard',
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral  = change === 0

  const ic = iconColors[variant] ?? iconColors.default

  /* superadmin uses navy dark bg, dashboard uses surface-card */
  const cardBg = theme === 'superadmin'
    ? 'bg-[#161B22] border border-[#21262D]'
    : 'bg-surface-card dark:bg-surface-card'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        cardBg,
        className
      )}
      style={{ borderTop: '3px solid #0C447C' }}
    >
      <div className="p-4 lg:p-5 flex flex-col gap-3">

        {/* Top row: label + icon */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-content-secondary uppercase tracking-wide leading-tight">
            {title}
          </span>
          {Icon && (
            <div className={cn('w-8 h-8 rounded-sm flex items-center justify-center shrink-0', ic.bg)}>
              <Icon className={cn('w-4 h-4', ic.text)} strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Value */}
        <p className="tabular-nums text-2xl font-semibold text-content-primary leading-none">
          {value}
        </p>

        {/* Bottom row: sub + change + sparkline */}
        <div className="flex items-end justify-between gap-2 min-h-[32px]">
          <div className="space-y-1">
            {sub && (
              <p className="text-xs text-content-muted">{sub}</p>
            )}
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive && <TrendingUp className={cn('w-3.5 h-3.5', changeColors.up)} strokeWidth={2} />}
                {isNegative && <TrendingDown className={cn('w-3.5 h-3.5', changeColors.down)} strokeWidth={2} />}
                {isNeutral  && <Minus className={cn('w-3.5 h-3.5', changeColors.neutral)} strokeWidth={2} />}
                <span className={cn(
                  'text-xs font-medium',
                  isPositive ? changeColors.up : isNegative ? changeColors.down : changeColors.neutral
                )}>
                  {isPositive ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-content-muted">{changeLabel}</span>
                )}
              </div>
            )}
          </div>

          {sparkline && (
            <div className="shrink-0 opacity-80">
              <Sparkline data={sparkline} color={sparklineColor} />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}