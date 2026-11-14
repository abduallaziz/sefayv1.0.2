'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChefHat, Receipt } from 'lucide-react'
import { Switch } from '@/shared/ui/switch'
import { useProfile } from '../../hooks/useSettings'
import type { TenantProfile } from '../../api/settings.api'
import {
  FieldRow, InlineError, LinkRow, PageStack, SectionFooter, SettingsPageHeader, SettingsSection, SettingsSkeleton,
  SwitchRow, choiceCls, useProfileSave,
} from '../../components/settings-ui'

// every method the API knows (default of tenants.enabled_payment_methods)
const ALL_METHODS = ['cash', 'card', 'split', 'wallet', 'mada', 'visa', 'mastercard', 'stc_pay', 'apple_pay', 'tab'] as const
// the ones the owner may switch on/off at the POS
const SWITCHABLE_METHODS = ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay', 'wallet', 'split'] as const

function PaymentMethodsSection({ profile }: { profile: TenantProfile }) {
  const t = useTranslations('settings')
  const { save, saving, error, setError } = useProfileSave()

  // 'card' and 'tab' are not offered at the POS today so they are kept as they are;
  // 'cash' can never be switched off.
  function toggle(method: string, enabled: boolean) {
    const current = profile.enabled_payment_methods ?? [...ALL_METHODS]
    const next = enabled ? [...new Set([...current, method])] : current.filter((m) => m !== method)
    save({ enabled_payment_methods: next })
  }

  return (
    <SettingsSection
      title={t('paymentMethods.title')}
      description={t('paymentMethods.hint')}
      footer={<InlineError message={error} onDismiss={() => setError(null)} />}
    >
      {SWITCHABLE_METHODS.map((method) => (
        <SwitchRow
          key={method}
          label={t(`paymentMethods.methods.${method}`)}
          checked={(profile.enabled_payment_methods ?? [...ALL_METHODS]).includes(method)}
          disabled={saving}
          onChange={(v) => toggle(method, v)}
        />
      ))}
      <FieldRow label={t('paymentMethods.methods.cash')} control="switch">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-posCloud-text-tertiary dark:bg-white/10">
          {t('paymentMethods.cashAlways')}
        </span>
      </FieldRow>
    </SettingsSection>
  )
}

function PrinterSection({ profile }: { profile: TenantProfile }) {
  const t = useTranslations('settings')
  const init = {
    width: profile.printer_settings?.paper_width ?? '80mm',
    auto: profile.printer_settings?.auto_print ?? false,
    kitchen: profile.printer_settings?.kitchen_auto_print ?? false,
  }
  const [width, setWidth] = useState<'58mm' | '80mm'>(init.width)
  const [auto, setAuto] = useState(init.auto)
  const [kitchen, setKitchen] = useState(init.kitchen)
  const { save, saving, error, setError } = useProfileSave()
  const dirty = width !== init.width || auto !== init.auto || kitchen !== init.kitchen

  return (
    <SettingsSection
      title={t('printerSettings')}
      description={t('sections.printerHint')}
      footer={
        <SectionFooter
          dirty={dirty} saving={saving} error={error} onDismissError={() => setError(null)}
          onSave={() => save({ printer_settings: { paper_width: width, auto_print: auto, kitchen_auto_print: kitchen } })}
          onReset={() => { setWidth(init.width); setAuto(init.auto); setKitchen(init.kitchen) }}
        />
      }
    >
      <FieldRow label={t('paperWidth')}>
        <div className="flex gap-2" role="group" aria-label={t('paperWidth')}>
          {(['58mm', '80mm'] as const).map((w) => (
            <button key={w} type="button" aria-pressed={width === w} onClick={() => setWidth(w)} className={choiceCls(width === w)}>
              <span dir="ltr">{w}</span>
            </button>
          ))}
        </div>
      </FieldRow>
      <FieldRow label={t('autoPrint')} control="switch">
        <Switch checked={auto} onCheckedChange={setAuto} aria-label={t('autoPrint')} />
      </FieldRow>
      <FieldRow label={t('kitchenAutoPrint')} control="switch">
        <Switch checked={kitchen} onCheckedChange={setKitchen} aria-label={t('kitchenAutoPrint')} />
      </FieldRow>
    </SettingsSection>
  )
}

export function SalesSettings() {
  const t = useTranslations('settings')
  const tp = useTranslations('print.designer')
  const locale = useLocale()
  const { data: profile, isLoading } = useProfile()

  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.sales')} description={t('nav.descriptions.sales')} />
      {isLoading || !profile ? <SettingsSkeleton /> : (
        <>
          <PaymentMethodsSection profile={profile} />
          <PrinterSection profile={profile} />
        </>
      )}
      <SettingsSection title={t('sections.designersTitle')} description={t('sections.designersHint')}>
        <LinkRow
          href={`/${locale}/dashboard/settings/invoice-designer`} icon={Receipt}
          title={tp('openInvoice')} description={tp('openInvoiceHint')}
        />
        <LinkRow
          href={`/${locale}/dashboard/settings/kitchen-designer`} icon={ChefHat}
          title={tp('openKitchen')} description={tp('openKitchenHint')}
        />
      </SettingsSection>
    </PageStack>
  )
}
