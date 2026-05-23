'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FeatureCategoryBadge } from './FeatureCategoryBadge'
import { OverrideLimitDialog } from './OverrideLimitDialog'
import { useUpsertOverride, useResetOverride } from '../hooks/useFeatureFlags'
import type { FeatureWithOverride } from '../types/feature-flags.types'

interface Props {
  tenantId: string
  feature: FeatureWithOverride
}

export function FeatureRow({ tenantId, feature }: Props) {
  const t = useTranslations('featureFlags')
  const [limitOpen, setLimitOpen] = useState(false)
  const { mutate: upsert, isPending: upserting } = useUpsertOverride()
  const { mutate: reset, isPending: resetting } = useResetOverride()

  const hasOverride = !!feature.tenant_override
  const isEnabled = feature.effective_enabled

  function handleToggle() {
    upsert({
      tenant_id: tenantId,
      feature_key: feature.key,
      is_enabled: !isEnabled,
      limit_value: feature.effective_limit,
    })
  }

  function handleReset() {
    reset({ tenantId, featureKey: feature.key })
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border border-[#1e2130] bg-[#141720] px-4 py-3 hover:border-[#2a3050] transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white truncate">{feature.name}</span>
            <FeatureCategoryBadge category={feature.category} />
            {hasOverride && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {t('overridden')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{feature.description}</p>
        </div>

        {feature.plan_limit !== null && (
          <div className="text-center w-20">
            <p className="text-xs text-gray-500 mb-0.5">{t('limit')}</p>
            <button
              onClick={() => setLimitOpen(true)}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              {feature.effective_limit ?? '∞'}
            </button>
          </div>
        )}

        <div className="text-center w-24">
          <p className="text-xs text-gray-500 mb-0.5">{t('planDefault')}</p>
          <span className={`text-xs font-medium ${feature.plan_default ? 'text-emerald-400' : 'text-red-400'}`}>
            {feature.plan_default ? t('on') : t('off')}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={upserting}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>

        {hasOverride && (
          <button
            onClick={handleReset}
            disabled={resetting}
            title={t('resetOverride')}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            ↺
          </button>
        )}
      </div>

      <OverrideLimitDialog
        tenantId={tenantId}
        feature={feature}
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
      />
    </>
  )
}