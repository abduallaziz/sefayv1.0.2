'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTenantFeatures } from '../hooks/useFeatureFlags'
import { FeatureRow } from './FeatureRow'
import type { FeatureCategory } from '../types/feature-flags.types'

interface Props {
  tenantId: string
  tenantName: string
}

const CATEGORIES: FeatureCategory[] = ['core', 'advanced', 'premium']

export function TenantFeaturesPanel({ tenantId, tenantName }: Props) {
  const t = useTranslations('featureFlags')
  const { data: features, isLoading } = useTenantFeatures(tenantId)
  const [activeCategory, setActiveCategory] = useState<FeatureCategory | 'all'>('all')

  const filtered = features?.filter(
    (f) => activeCategory === 'all' || f.category === activeCategory
  )

  const overriddenCount = features?.filter((f) => f.tenant_override).length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{tenantName}</h2>
          <p className="text-sm text-gray-500">
            {overriddenCount > 0
              ? t('overriddenCount', { count: overriddenCount })
              : t('noOverrides')}
          </p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border border-[#1e2130] bg-[#0f1117] p-1 w-fit">
        {(['all', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[#1e2130] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t(`category.${cat}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[#141720] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((feature) => (
            <FeatureRow key={feature.key} tenantId={tenantId} feature={feature} />
          ))}
          {filtered?.length === 0 && (
            <p className="text-center text-sm text-gray-600 py-8">{t('noFeatures')}</p>
          )}
        </div>
      )}
    </div>
  )
}