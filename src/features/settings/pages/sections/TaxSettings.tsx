'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { FileCheck2 } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { NumberInput } from '@/shared/ui/number-input'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { zatcaApi } from '@/features/zatca/api/zatca.api'
import { useProfile } from '../../hooks/useSettings'
import type { TenantProfile } from '../../api/settings.api'
import { checkTaxRatePercent, checkVatNumber, normalizeDigits } from '../../lib/validators'
import {
  FieldRow, LinkRow, PageStack, SectionFooter, SettingsPageHeader, SettingsSection, SettingsSkeleton, controlCls, useProfileSave,
} from '../../components/settings-ui'

const pct = (rate: number | undefined) => (rate === undefined ? '' : String(Math.round(rate * 100 * 100) / 100))

function TaxRateSection({ profile }: { profile: TenantProfile }) {
  const t = useTranslations('settings')
  const initial = pct(profile.tax_rate)
  const [value, setValue] = useState(initial)
  const [err, setErr] = useState<null | 'required' | 'range' | 'decimals'>(null)
  const { save, saving, error, setError } = useProfileSave()

  function handleSave() {
    const check = checkTaxRatePercent(value)
    if (!check.ok) { setErr(check.reason); return }
    setErr(null)
    save({ tax_rate: Math.round(check.value * 100) / 10000 })
  }

  return (
    <SettingsSection
      title={t('taxRate')}
      description={t('sections.taxRateHint')}
      footer={
        <SectionFooter
          dirty={value !== initial} saving={saving} onSave={handleSave} error={error}
          onDismissError={() => setError(null)} onReset={() => { setValue(initial); setErr(null) }}
        />
      }
    >
      <FieldRow label={t('taxRate')} description={t('taxRateHint')} htmlFor="tax-rate" error={err ? t(`taxRateErrors.${err}`) : null}>
        <div className="flex max-w-[10rem] items-center gap-2">
          <NumberInput
            id="tax-rate" value={value} aria-invalid={!!err} aria-label={t('taxRate')}
            onChange={(v) => { setValue(v); setErr(null) }}
            className={controlCls}
          />
          <span className="text-sm text-posCloud-text-tertiary" aria-hidden>%</span>
        </div>
      </FieldRow>
    </SettingsSection>
  )
}

function InvoiceSection({ profile, zatcaEnabled }: { profile: TenantProfile; zatcaEnabled: boolean }) {
  const t = useTranslations('settings')
  const initialVat = profile.tax_number ?? ''
  const initialFooter = profile.invoice_footer ?? ''
  const [taxNumber, setTaxNumber] = useState(initialVat)
  const [footer, setFooter] = useState(initialFooter)
  const [vatError, setVatError] = useState<null | 'digits' | 'zatca'>(null)
  const { save, saving, error, setError } = useProfileSave()

  function handleSave() {
    const vat = normalizeDigits(taxNumber).trim()
    const check = checkVatNumber(vat, zatcaEnabled)
    if (check !== 'ok') { setVatError(check); return }
    setVatError(null)
    setTaxNumber(vat)
    save({
      ...(profile.logo_url?.trim() ? { logo_url: profile.logo_url.trim() } : {}),
      tax_number: vat,
      invoice_footer: footer.trim(),
    })
  }

  return (
    <SettingsSection
      title={t('invoiceCustomization')}
      description={t('sections.invoiceHint')}
      footer={
        <SectionFooter
          dirty={taxNumber !== initialVat || footer !== initialFooter} saving={saving} onSave={handleSave}
          error={error} onDismissError={() => setError(null)}
          onReset={() => { setTaxNumber(initialVat); setFooter(initialFooter); setVatError(null) }}
        />
      }
    >
      <FieldRow label={t('taxNumber')} description={t('sections.vatHint')} htmlFor="vat-number" error={vatError ? t(`vatErrors.${vatError}`) : null}>
        <Input
          id="vat-number" value={taxNumber} inputMode="numeric" dir="ltr" maxLength={15} aria-invalid={!!vatError}
          onChange={(e) => { setTaxNumber(normalizeDigits(e.target.value).replace(/\D/g, '')); setVatError(null) }}
        />
      </FieldRow>
      <FieldRow label={t('invoiceFooter')} description={t('sections.footerHint')} htmlFor="invoice-footer">
        <textarea
          id="invoice-footer" value={footer} rows={3} maxLength={500} className={controlCls}
          onChange={(e) => setFooter(e.target.value)}
        />
        <p className="mt-1 text-end text-[11px] tabular-nums text-posCloud-text-tertiary">{footer.length}/500</p>
      </FieldRow>
    </SettingsSection>
  )
}

export function TaxSettings() {
  const t = useTranslations('settings')
  const tz = useTranslations('zatca')
  const locale = useLocale()
  const { data: profile, isLoading } = useProfile()
  const isOwner = ['owner', 'superadmin'].includes(useAuthStore((s) => s.user?.role) ?? '')
  const { data: zatcaDevices } = useQuery({ queryKey: ['zatca', 'devices'], queryFn: zatcaApi.devices, retry: false })
  const zatcaEnabled = (zatcaDevices ?? []).length > 0

  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.tax')} description={t('nav.descriptions.tax')} />
      {isLoading || !profile ? <SettingsSkeleton /> : (
        <>
          <TaxRateSection profile={profile} />
          <InvoiceSection profile={profile} zatcaEnabled={zatcaEnabled} />
        </>
      )}
      {isOwner && (
        <SettingsSection title={tz('link')} description={tz('linkHint')}>
          <LinkRow href={`/${locale}/dashboard/settings/zatca`} icon={FileCheck2} title={tz('link')} description={tz('linkHint')} />
        </SettingsSection>
      )}
    </PageStack>
  )
}
