'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { SectionCard } from '@/shared/ui/section-card'
import { useSubscription, useUsage } from '../../hooks/useSettings'
import { effectiveSubscriptionStatus } from '../../lib/validators'
import { PageStack, SettingsPageHeader, SettingsSection, SettingsSkeleton } from '../../components/settings-ui'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useEntitlements } from '@/features/subscription-gate/useEntitlements'
import { subscriptionGateApi } from '@/features/subscription-gate/api'
import { ENTITLEMENTS_KEY } from '@/features/subscription-gate/useEntitlements'

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-posCloudDark-border dark:bg-white/[0.02]">
      <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{label}</p>
      <div className="mt-1 text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{children}</div>
    </div>
  )
}

function Meter({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const percent = Math.min((used / (limit || 1)) * 100, 100)
  return (
    <div className="px-5 py-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{label}</span>
        <span className="tabular-nums text-xs text-posCloud-text-tertiary" dir="ltr">{used}/{limit}</span>
      </div>
      <div
        role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}
        className="h-2 rounded-full bg-slate-100 dark:bg-posCloudDark-border/60"
      >
        <div className={cn('h-2 rounded-full transition-all', color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function SubscriptionSettings() {
  const t = useTranslations('settings')
  const locale = useLocale()
  const { data: subscriptionData, isLoading: subLoading } = useSubscription()
  const { data: usage, isLoading: usageLoading } = useUsage()
  const sub = subscriptionData?.subscription
  const status = effectiveSubscriptionStatus(sub)
  const bad = status === 'expired' || status === 'cancelled' || status === 'suspended' || status === 'none'
  const tr = (prefix: string, key?: string, fallback?: string) => (key ? (t.has(`${prefix}.${key}`) ? t(`${prefix}.${key}`) : (fallback ?? key)) : '—')

  const role = useAuthStore((s) => s.user?.role)
  const { data: ent } = useEntitlements()
  const qc = useQueryClient()

  // Prefer entitlements (source of truth) for the plan card; fall back to /tenant/subscription.
  const planName = ent?.plan?.name ?? sub?.plan_name ?? null
  const effectiveStatus = ent?.status ?? (sub ? status : null)
  const endsAt = ent?.ends_at ?? sub?.current_period_end ?? null
  const badStatus = effectiveStatus
    ? ['expired', 'cancelled', 'suspended', 'none'].includes(effectiveStatus)
    : bad
  // Test-only control: shown to the owner only while enforcement (test mode) is on for this tenant.
  const showTestExpire = role === 'owner' && !!ent?.enforced && !ent.locked
  const expire = useMutation({
    mutationFn: subscriptionGateApi.devExpire,
    onSuccess: () => qc.invalidateQueries({ queryKey: ENTITLEMENTS_KEY }),
  })

  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.subscription')} description={t('nav.descriptions.subscription')} />

      {subLoading && !ent ? <SettingsSkeleton rows={2} /> : (
        <SectionCard title={t('subscription')} description={t('sections.subscriptionHint')}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* Entitlements is the source of truth (always correct, never blocked by the lock); /tenant/subscription
                is only a fallback. This is why the plan no longer reads "no plan" after a renewal. */}
            <Stat label={t('plan')}>{planName ? tr('planNames', planName.toLowerCase(), planName) : '—'}</Stat>
            <Stat label={t('status')}>
              <span className={cn('inline-flex items-center gap-1.5', badStatus ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', badStatus ? 'bg-red-500' : 'bg-emerald-500')} aria-hidden />
                {effectiveStatus ? tr('subStatus', effectiveStatus) : '—'}
              </span>
            </Stat>
            <Stat label={t('interval')}>{tr('billingCycles', ent?.billing_cycle ?? sub?.billing_cycle ?? undefined)}</Stat>
            <Stat label={t('endsAt')}>
              <span className="tabular-nums">
                {endsAt ? new Date(endsAt).toLocaleDateString(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-CA') : '—'}
              </span>
            </Stat>
          </div>
        </SectionCard>
      )}

      {usageLoading ? <SettingsSkeleton rows={2} /> : (
        <SettingsSection title={t('usage')} description={t('sections.usageHint')}>
          <Meter label={t('users')} used={usage?.users?.used ?? 0} limit={usage?.users?.limit ?? sub?.max_users ?? 0} color="bg-posCloud-primary" />
          <Meter label={t('branches')} used={usage?.branches?.used ?? 0} limit={usage?.branches?.limit ?? sub?.max_branches ?? 0} color="bg-violet-500" />
          <div className="flex items-center justify-between px-5 py-4 text-sm">
            <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('invoicesThisMonth')}</span>
            <span className="font-semibold tabular-nums text-posCloud-text-primary dark:text-posCloudDark-text-primary">{usage?.invoices_this_month?.used ?? 0}</span>
          </div>
        </SettingsSection>
      )}

      {showTestExpire && (
        <SectionCard title={t('testTools.title')} description={t('testTools.hint')}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
              {t('testTools.expireHint')}
            </span>
            <button
              type="button"
              onClick={() => expire.mutate()}
              disabled={expire.isPending}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              {expire.isPending ? '…' : t('testTools.expireNow')}
            </button>
          </div>
        </SectionCard>
      )}
    </PageStack>
  )
}
