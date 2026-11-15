'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscriptionGateApi, type Entitlements } from './api'
import { ENTITLEMENTS_KEY } from './useEntitlements'

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '—')
const fmtMoney = (n: number) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })

/**
 * The ONLY way out of an ended plan. Rendered at the dashboard layout level, so every page (even one opened
 * through a direct link) shows it over a blocked page. When `forced` it cannot be dismissed: renewing is the exit.
 * When opened from the countdown banner (`forced` false) it can be closed.
 */
export function SubscriptionLockModal({
  ent,
  canRenew,
  forced,
  onClose,
}: {
  ent: Entitlements
  canRenew: boolean
  forced: boolean
  onClose?: () => void
}) {
  const t = useTranslations('subscriptionGate')
  const locale = useLocale()
  const qc = useQueryClient()
  const [step, setStep] = useState<'notice' | 'renew'>(forced ? 'notice' : 'renew')
  const [planId, setPlanId] = useState<string | null>(ent.plan?.id ?? null)
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(ent.billing_cycle ?? 'monthly')

  const plansQ = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: subscriptionGateApi.getPlans,
    enabled: step === 'renew' && canRenew,
  })
  const plans = (plansQ.data ?? []).filter((p) => p.is_active)
  const selected = plans.find((p) => p.id === planId) ?? null
  const total = selected ? (cycle === 'yearly' ? selected.price_yearly : selected.price_monthly) : 0

  const pay = useMutation({
    mutationFn: () => subscriptionGateApi.renew(selected!.id, cycle),
    // Wait for the fresh entitlements + subscription/usage before closing, so the plan card never flashes
    // "no plan" right after a successful renewal (the stale-cache gap the owner hit).
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ENTITLEMENTS_KEY }),
        qc.invalidateQueries({ queryKey: ['tenant', 'subscription'] }),
        qc.invalidateQueries({ queryKey: ['tenant', 'usage'] }),
        qc.invalidateQueries({ queryKey: ['tenant', 'profile'] }),
      ])
      onClose?.()
    },
  })

  const limit = (n: number) => (n === -1 ? t('renew.unlimited') : String(n))

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-lock-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      onKeyDown={(e) => {
        if (forced && e.key === 'Escape') e.stopPropagation()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-posCloudDark-surface">
        {step === 'notice' ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15">
              <Lock className="h-6 w-6" aria-hidden />
            </span>
            <h2 id="sub-lock-title" className="text-lg font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {t('locked.title')}
            </h2>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {t('locked.endedOn', { date: fmtDate(ent.ends_at) })}
            </p>
            <p className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
              {canRenew ? t('locked.ownerHint') : t('locked.staffHint')}
            </p>
            {canRenew && (
              <button
                type="button"
                onClick={() => setStep('renew')}
                className="mt-2 w-full rounded-lg bg-posCloud-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {t('locked.renew')}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 id="sub-lock-title" className="text-lg font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {t('renew.title')}
            </h2>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('renew.cycle')}>
              {(['monthly', 'yearly'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={cycle === c}
                  onClick={() => setCycle(c)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    cycle === c
                      ? 'border-posCloud-primary bg-posCloud-primary/10 text-posCloud-primary'
                      : 'border-slate-200 text-posCloud-text-secondary hover:bg-slate-50 dark:border-posCloudDark-border',
                  )}
                >
                  {t(`renew.${c}`)}
                </button>
              ))}
            </div>

            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto" role="radiogroup" aria-label={t('renew.plan')}>
              {plansQ.isLoading && <p className="text-sm text-posCloud-text-tertiary">...</p>}
              {plansQ.isError && <p className="text-sm text-red-600">{t('renew.loadFailed')}</p>}
              {plans.map((p) => {
                const price = cycle === 'yearly' ? p.price_yearly : p.price_monthly
                const on = p.id === planId
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border p-3 text-start transition-colors',
                      on
                        ? 'border-posCloud-primary bg-posCloud-primary/5'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-posCloudDark-border',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                        {p.name}
                        {p.id === ent.plan?.id && (
                          <span className="ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t('renew.current')}</span>
                        )}
                      </span>
                      <span className="block text-xs text-posCloud-text-tertiary">
                        {t('renew.limits', { users: limit(p.max_users), branches: limit(p.max_branches) })}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary" dir="ltr">
                      {fmtMoney(price)}
                      <span className="ms-1 text-[11px] font-medium text-posCloud-text-tertiary">
                        {cycle === 'yearly' ? t('renew.perYear') : t('renew.perMonth')}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-posCloudDark-border">
              <span className="text-sm font-medium text-posCloud-text-secondary">{t('renew.total')}</span>
              <span className="text-xl font-bold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary" dir="ltr">
                {fmtMoney(total)}
              </span>
            </div>

            {pay.isError && (
              <p role="alert" className="text-sm text-red-600">
                {t('renew.failed')}
              </p>
            )}

            <div className="flex gap-2">
              {(forced || onClose) && (
                <button
                  type="button"
                  onClick={() => (forced ? setStep('notice') : onClose?.())}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-posCloud-text-secondary hover:bg-slate-50 dark:border-posCloudDark-border"
                >
                  {t('renew.back')}
                </button>
              )}
              <button
                type="button"
                disabled={!selected || pay.isPending}
                onClick={() => pay.mutate()}
                className="flex-1 rounded-lg bg-posCloud-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pay.isPending ? t('renew.paying') : t('renew.payNow')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
