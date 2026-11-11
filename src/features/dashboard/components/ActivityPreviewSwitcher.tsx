'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { FlaskConical } from 'lucide-react'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { ACTIVITY_CONFIG, type ActivityKey } from '@/shared/config/business-type.config'
import { useActivityPreviewStore } from '@/shared/stores/activity-preview.store'

const ACTIVITIES = Object.keys(ACTIVITY_CONFIG) as ActivityKey[]

/**
 * Dev/QA helper: switch the dashboard to any activity's view in one click.
 * Shown only on the internal test tenant (activity 'all'); nothing is written
 * to the database, so the tenant keeps its 'all' status and you can return to
 * "All" at any time.
 */
export function ActivityPreviewSwitcher() {
  const isTestTenant = useAuthStore((s) => s.user?.activity === 'all')
  const override = useActivityPreviewStore((s) => s.override)
  const hydrate = useActivityPreviewStore((s) => s.hydrate)
  const setOverride = useActivityPreviewStore((s) => s.setOverride)
  const t = useTranslations('header')
  const tActivity = useTranslations('onboarding.activity')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!isTestTenant) return null

  return (
    <label
      className={`flex min-w-0 shrink items-center gap-1 rounded-lg border px-1.5 py-1.5 text-xs sm:shrink-0 sm:gap-1.5 sm:px-2 ${
        override
          ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-300'
          : 'border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary'
      }`}
      title={t('previewActivityHint')}
    >
      <FlaskConical size={14} className="shrink-0" />
      <select
        value={override ?? ''}
        onChange={(e) => setOverride((e.target.value || null) as ActivityKey | null)}
        aria-label={t('previewActivity')}
        className="max-w-[64px] bg-transparent text-xs font-medium outline-none sm:max-w-[130px]"
      >
        <option value="">{t('previewAll')}</option>
        {ACTIVITIES.map((key) => (
          <option key={key} value={key}>{tActivity(key)}</option>
        ))}
      </select>
    </label>
  )
}
