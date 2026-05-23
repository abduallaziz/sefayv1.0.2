'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useUpsertOverride } from '../hooks/useFeatureFlags'
import type { FeatureWithOverride } from '../types/feature-flags.types'

interface Props {
  tenantId: string
  feature: FeatureWithOverride
  open: boolean
  onClose: () => void
}

export function OverrideLimitDialog({ tenantId, feature, open, onClose }: Props) {
  const t = useTranslations('featureFlags')
  const { mutate, isPending } = useUpsertOverride()
  const [limit, setLimit] = useState<string>(
    String(feature.effective_limit ?? feature.plan_limit ?? '')
  )
  const [note, setNote] = useState(feature.tenant_override?.note ?? '')

  if (!open) return null

  function handleSave() {
    mutate(
      {
        tenant_id: tenantId,
        feature_key: feature.key,
        is_enabled: feature.effective_enabled,
        limit_value: limit === '' ? null : Number(limit),
        note: note || undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-[#1e2130] bg-[#141720] p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-1">
          {t('overrideLimit')}
        </h3>
        <p className="text-sm text-gray-400 mb-4">{feature.name}</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">{t('limitValue')}</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder={t('unlimited')}
              className="w-full rounded-lg border border-[#1e2130] bg-[#0f1117] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">{t('note')}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              className="w-full rounded-lg border border-[#1e2130] bg-[#0f1117] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#1e2130] px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}