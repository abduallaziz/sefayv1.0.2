'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { LoyaltyTiersManager } from '@/features/loyalty-tiers/components/LoyaltyTiersManager'
import { useProfile } from '../../hooks/useSettings'
import type { TenantProfile } from '../../api/settings.api'
import {
  FieldRow, InlineError, PageStack, SectionFooter, SettingsPageHeader, SettingsSection, SettingsSkeleton, SwitchRow,
  controlCls, useProfileSave,
} from '../../components/settings-ui'

function RulesSection({ profile }: { profile: TenantProfile }) {
  const t = useTranslations('settings')
  const initPoints = String(profile.loyalty_points_per_currency ?? 1)
  const initRedeem = String(profile.loyalty_redemption_value ?? 0.01)
  const [points, setPoints] = useState(initPoints)
  const [redeem, setRedeem] = useState(initRedeem)
  const { save, saving, error, setError } = useProfileSave()

  function handleSave() {
    const p = Number(points)
    const r = Number(redeem)
    if (!points.trim() || !redeem.trim() || Number.isNaN(p) || p < 0 || Number.isNaN(r) || r < 0) {
      toast.error(t('loyalty.invalid'), { id: 'loyalty-invalid' })
      return
    }
    save({ loyalty_points_per_currency: p, loyalty_redemption_value: r })
  }

  return (
    <SettingsSection
      title={t('sections.loyaltyRulesTitle')}
      description={t('sections.loyaltyRulesHint')}
      footer={
        <SectionFooter
          dirty={points !== initPoints || redeem !== initRedeem} saving={saving} onSave={handleSave}
          error={error} onDismissError={() => setError(null)} onReset={() => { setPoints(initPoints); setRedeem(initRedeem) }}
        />
      }
    >
      <FieldRow label={t('loyalty.pointsPerCurrency')} htmlFor="loy-points">
        <input id="loy-points" type="number" min={0} step="0.1" dir="ltr" value={points} onChange={(e) => setPoints(e.target.value)} className={controlCls} />
      </FieldRow>
      <FieldRow label={t('loyalty.redemptionValue')} htmlFor="loy-redeem">
        <input id="loy-redeem" type="number" min={0} step="0.001" dir="ltr" value={redeem} onChange={(e) => setRedeem(e.target.value)} className={controlCls} />
      </FieldRow>
    </SettingsSection>
  )
}

export function LoyaltySettings() {
  const t = useTranslations('settings')
  const { data: profile, isLoading } = useProfile()
  const toggle = useProfileSave()
  const enabled = profile?.loyalty_enabled ?? true

  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.loyalty')} description={t('nav.descriptions.loyalty')} />
      {isLoading || !profile ? <SettingsSkeleton /> : (
        <>
          <SettingsSection
            title={t('loyalty.title')}
            footer={<InlineError message={toggle.error} onDismiss={() => toggle.setError(null)} />}
          >
            <SwitchRow
              label={t('loyalty.title')}
              description={enabled ? t('sections.loyaltyOnHint') : t('loyalty.disabledHint')}
              checked={enabled}
              disabled={toggle.saving}
              onChange={(v) => toggle.save({ loyalty_enabled: v })}
            />
          </SettingsSection>
          {enabled && (
            <>
              <RulesSection profile={profile} />
              <SettingsSection title={t('sections.tiersTitle')} description={t('loyalty.tiersHint')}>
                <div className="p-5">
                  <LoyaltyTiersManager />
                </div>
              </SettingsSection>
            </>
          )}
        </>
      )}
    </PageStack>
  )
}
