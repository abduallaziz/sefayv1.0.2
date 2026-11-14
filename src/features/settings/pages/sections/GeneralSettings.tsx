'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/shared/ui/input'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { useProfile } from '../../hooks/useSettings'
import type { TenantProfile } from '../../api/settings.api'
import {
  FieldRow, PageStack, SectionFooter, SettingsPageHeader, SettingsSection, SettingsSkeleton, choiceCls, useProfileSave,
} from '../../components/settings-ui'

// `symbol` is the currency's own glyph, identical in every locale.
const CURRENCIES = [
  { code: 'SAR', symbol: 'ر.س' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'KWD', symbol: 'د.ك' },
  { code: 'BHD', symbol: 'د.ب' },
  { code: 'QAR', symbol: 'ر.ق' },
  { code: 'OMR', symbol: 'ر.ع' },
]

function ProfileSection({ profile }: { profile: TenantProfile }) {
  const t = useTranslations('settings')
  const [name, setName] = useState(profile.name ?? '')
  const [nameError, setNameError] = useState(false)
  const { save, saving, error, setError } = useProfileSave()
  const dirty = name.trim() !== (profile.name ?? '')
  const type = profile.business_type
    ? t.has(`businessTypes.${profile.business_type}`) ? t(`businessTypes.${profile.business_type}`) : profile.business_type
    : '—'

  function handleSave() {
    if (name.trim().length < 2) { setNameError(true); return }
    setNameError(false)
    save({ name: name.trim() })
  }

  return (
    <SettingsSection
      title={t('profile')}
      description={t('sections.profileHint')}
      footer={
        <SectionFooter
          dirty={dirty} saving={saving} onSave={handleSave} error={error} onDismissError={() => setError(null)}
          onReset={() => { setName(profile.name ?? ''); setNameError(false) }}
        />
      }
    >
      <FieldRow label={t('businessName')} htmlFor="biz-name" error={nameError ? t('nameError') : null}>
        <Input
          id="biz-name" value={name} maxLength={100} aria-invalid={nameError}
          onChange={(e) => { setName(e.target.value); setNameError(false) }}
        />
      </FieldRow>
      <FieldRow label={t('businessType')} description={t('sections.businessTypeHint')} htmlFor="biz-type">
        <Input id="biz-type" value={type} disabled readOnly />
      </FieldRow>
    </SettingsSection>
  )
}

function CurrencySection() {
  const t = useTranslations('settings')
  const { currency_code, setCurrency } = useTenantStore()
  const [selected, setSelected] = useState(currency_code)
  const { save, saving, error, setError } = useProfileSave()

  function handleSave() {
    const cur = CURRENCIES.find((c) => c.code === selected)
    if (!cur) return
    save({ currency_code: cur.code, currency_symbol: cur.symbol }, () => setCurrency(cur.code, cur.symbol))
  }

  return (
    <SettingsSection
      title={t('currency')}
      description={t('sections.currencyHint')}
      footer={
        <SectionFooter
          dirty={selected !== currency_code} saving={saving} onSave={handleSave}
          error={error} onDismissError={() => setError(null)} onReset={() => setSelected(currency_code)}
        />
      }
    >
      <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-4">
        {CURRENCIES.map((cur) => (
          <button
            key={cur.code}
            type="button"
            aria-pressed={selected === cur.code}
            aria-label={`${cur.code} ${cur.symbol}`}
            onClick={() => setSelected(cur.code)}
            className={`${choiceCls(selected === cur.code)} flex flex-col items-center gap-1 py-3`}
          >
            <span className="text-lg font-bold">{cur.symbol}</span>
            <span className="text-xs">{cur.code}</span>
          </button>
        ))}
      </div>
    </SettingsSection>
  )
}

export function GeneralSettings() {
  const t = useTranslations('settings')
  const { data: profile, isLoading } = useProfile()
  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.general')} description={t('nav.descriptions.general')} />
      {isLoading || !profile ? <SettingsSkeleton /> : (
        <>
          <ProfileSection profile={profile} />
          <CurrencySection />
        </>
      )}
    </PageStack>
  )
}
