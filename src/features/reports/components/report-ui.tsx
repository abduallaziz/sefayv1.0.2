'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionCard } from '@/shared/ui/section-card'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState } from '@/shared/ui/empty-state'

/** Chart palette: posCloud tokens (primary, info, success, warning, danger, primary-400). */
export const CHART_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#60a5fa']

/** Group heading that introduces a band of report cards. */
export function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2 lg:col-span-12 md:col-span-2">
      <h2 className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary shrink-0">{children}</h2>
      <div className="h-px flex-1 bg-posCloud-border dark:bg-posCloudDark-border" aria-hidden />
    </div>
  )
}

interface ReportCardProps {
  title: string
  description?: string
  actions?: ReactNode
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  /** Reserved height while loading, prevents layout shift. */
  minHeight?: string
  className?: string
  children: ReactNode
}

/** One report = one SectionCard with consistent header and loading / error / empty states. */
export function ReportCard({
  title, description, actions, isLoading, error, onRetry, isEmpty, emptyTitle, emptyDescription,
  minHeight = 'min-h-[160px]', className, children,
}: ReportCardProps) {
  const t = useTranslations('reports')
  let body: ReactNode
  if (isLoading) {
    body = (
      <div className={cn('space-y-3', minHeight)} aria-busy="true" aria-live="polite">
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  } else if (error) {
    body = (
      <div className={cn('flex items-center justify-center', minHeight)} role="alert">
        <EmptyState
          size="sm"
          icon={AlertTriangle}
          title={t('errorTitle')}
          description={t('errorDescription')}
          action={onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border px-3 py-1.5 text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:bg-posCloud-sidebar dark:hover:bg-posCloudDark-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden />{t('retry')}
            </button>
          )}
        />
      </div>
    )
  } else if (isEmpty) {
    body = (
      <div className={cn('flex items-center justify-center', minHeight)}>
        <EmptyState size="sm" icon={Inbox} title={emptyTitle ?? t('noData')} description={emptyDescription ?? t('noDataDescription')} />
      </div>
    )
  } else {
    body = children
  }
  return (
    <SectionCard title={title} description={description} actions={actions} className={cn('min-w-0', className)}>
      {body}
    </SectionCard>
  )
}

/** Label / value tile used inside cards (tax, reconciliation, shifts, COGS). */
export function MetricTile({ label, value, hint, tone = 'default' }: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'danger' | 'success'
}) {
  return (
    <div className="rounded-lg bg-posCloud-sidebar dark:bg-posCloudDark-sidebar px-3.5 py-3 min-w-0">
      <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{label}</p>
      <p
        className={cn(
          'mt-1 text-base font-semibold tabular-nums truncate',
          tone === 'danger' ? 'text-posCloud-danger' : tone === 'success' ? 'text-posCloud-success' : 'text-posCloud-text-primary dark:text-posCloudDark-text-primary',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums">{hint}</p>}
    </div>
  )
}

export interface RankedItem {
  key: string
  label: string
  /** numeric weight for the bar */
  weight: number
  /** formatted main value */
  display: string
  /** secondary info (counts, averages) */
  meta?: string
}

/** Ranked rows with proportional bars. */
export function RankedList({ items, color = '#2563eb', ariaLabel }: { items: RankedItem[]; color?: string; ariaLabel: string }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.weight)))
  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary truncate min-w-0">{i.label}</span>
            <span className="text-sm font-semibold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary shrink-0">{i.display}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-posCloud-border/60 dark:bg-posCloudDark-border overflow-hidden" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (Math.abs(i.weight) / max) * 100)}%`, background: color }} />
          </div>
          {i.meta && <p className="mt-1 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary tabular-nums">{i.meta}</p>}
        </li>
      ))}
    </ul>
  )
}

/** Small segmented control (sort by). */
export function Segmented<T extends string>({ value, onChange, options, ariaLabel }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  ariaLabel: string
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex rounded-lg border border-posCloud-border dark:border-posCloudDark-border p-0.5 print:hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary',
            value === o.value
              ? 'bg-posCloud-primary text-white'
              : 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
