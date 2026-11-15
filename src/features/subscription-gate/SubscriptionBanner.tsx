'use client'

import { useTranslations } from 'next-intl'
import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Entitlements } from './api'

/** Countdown strip for the last 30 days: 30, 29 ... 1, 0. Shown to the owner / managers only. */
export function SubscriptionBanner({ ent, onRenew }: { ent: Entitlements; onRenew: () => void }) {
  const t = useTranslations('subscriptionGate.banner')
  const days = ent.days_left ?? 0
  const tone =
    days <= 3
      ? 'bg-red-600 text-white'
      : days <= 7
        ? 'bg-amber-500 text-white'
        : 'bg-sky-600 text-white'

  return (
    <div role="status" className={cn('flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm font-medium', tone)}>
      <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
      <span>{days <= 0 ? t('lastDay') : t('daysLeft', { days })}</span>
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold tabular-nums" dir="ltr">{days}</span>
      <button
        type="button"
        onClick={onRenew}
        className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-900 transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        {t('renew')}
      </button>
    </div>
  )
}
