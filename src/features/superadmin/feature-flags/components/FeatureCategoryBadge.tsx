'use client'

import { useTranslations } from 'next-intl'
import type { FeatureCategory } from '../types/feature-flags.types'

interface Props {
  category: FeatureCategory
}

const styles: Record<FeatureCategory, string> = {
  core: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  advanced: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  premium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
}

export function FeatureCategoryBadge({ category }: Props) {
  const t = useTranslations('superadmin.featureFlags')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[category]}`}>
      {t(`category.${category}`)}
    </span>
  )
}