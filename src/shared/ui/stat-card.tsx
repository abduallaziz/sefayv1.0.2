'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'

/* ── Sparkline (SVG inline — zero deps) ─────────────────── */
function Sparkline({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
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
  /** Supporting line under the value. Accepts a node so callers can render
   *  an inline action (e.g. a "View products" link) rather than plain text. */
  sub?: ReactNode
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
// Every class here resolves against the posCloud palette in tailwind.config.js.
// The previous map referenced `brand-*` / `semantic-*` / `content-*` families
// that were never defined in the active config, so all five variants rendered
// with no background and no icon colour at all.
const iconColors: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-posCloud-primary-light dark:bg-posCloud-primary/20', text: 'text-posCloud-primary dark:text-posCloud-primary-400' },
  success: { bg: 'bg-posCloud-success-light dark:bg-posCloud-success/20', text: 'text-posCloud-success' },
  warning: { bg: 'bg-posCloud-warning-light dark:bg-posCloud-warning/20', text: 'text-posCloud-warning' },
  danger:  { bg: 'bg-posCloud-danger-light dark:bg-posCloud-danger/20',   text: 'text-posCloud-danger' },
  info:    { bg: 'bg-posCloud-info-light dark:bg-posCloud-info/20',       text: 'text-posCloud-info' },
}

const changeColors = {
  up:      'text-posCloud-success',
  down:    'text-posCloud-danger',
  neutral: 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary',
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
  sparklineColor = '#2563eb',
  variant = 'default',
  theme = 'dashboard',
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral  = change === 0

  const ic = iconColors[variant] ?? iconColors.default

  const hasTrendRow = Boolean(sparkline) || change !== undefined
  const hasFooter = Boolean(sub) || hasTrendRow

  /* superadmin keeps its own dark navy surface; dashboard follows posCloud */
  const cardBg = theme === 'superadmin'
    ? 'bg-posCloud-navy-900 border border-posCloud-navy-800'
    : 'bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        cardBg,
        className
      )}
    >
      <div className="p-4 lg:p-5 flex flex-col gap-3">

        {/* Top row: label + icon */}
        <div className="flex items-start justify-between gap-2">
          {/* No uppercase/tracking here: `uppercase` is inert for Arabic and
              `tracking-wide` letter-spaces a cursive script, breaking the
              connected glyphs. Titles render natural in both locales. */}
          <span className="text-xs font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary leading-tight">
            {title}
          </span>
          {Icon && (
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', ic.bg)}>
              <Icon className={cn('w-4 h-4', ic.text)} strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Value */}
        <p className="tabular-nums text-2xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary leading-none">
          {value}
        </p>

        {/* Bottom row: sub + change + sparkline. Omitted entirely when the
            card has none of the three, so the flex `gap-3` above it doesn't
            add trailing space under the value. */}
        {/* The 32px floor exists only to keep a sparkline/trend row from
            collapsing. A plain KPI card (sub text only) must not reserve it —
            that was dead space at the bottom of every card. */}
        {hasFooter && (
        <div
          className={cn(
            'flex items-end justify-between gap-2',
            hasTrendRow && 'min-h-[32px]'
          )}
        >
          <div className="space-y-1">
            {sub && (
              <div className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{sub}</div>
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
                  <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{changeLabel}</span>
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
        )}

      </div>
    </div>
  )
}