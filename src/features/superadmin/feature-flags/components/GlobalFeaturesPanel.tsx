'use client'

import { useTranslations } from 'next-intl'
import { useFeatures } from '../hooks/useFeatureFlags'
import { FeatureCategoryBadge } from './FeatureCategoryBadge'

export function GlobalFeaturesPanel() {
  const t = useTranslations('superadmin.featureFlags')

  const { data: features, isLoading } = useFeatures()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">{t('allFeatures')}</h2>
        <p className="text-sm text-gray-500">{t('allFeaturesDesc')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[#141720] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {features?.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center gap-3 rounded-lg border border-[#1e2130] bg-[#141720] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white">{feature.name}</span>
                  <FeatureCategoryBadge category={feature.category} />
                </div>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
              <code className="text-xs text-gray-600 font-mono bg-[#0f1117] px-2 py-0.5 rounded">
                {feature.key}
              </code>
              <span className={`w-2 h-2 rounded-full shrink-0 ${feature.is_enabled ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}