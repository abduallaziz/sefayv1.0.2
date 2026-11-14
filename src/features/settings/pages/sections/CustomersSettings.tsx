'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { useCustomerFieldDefinitions } from '@/features/customers/hooks/useCustomers'
import { CustomFieldsManager } from '@/features/customers/components/CustomFieldsManager'
import { useProfile } from '../../hooks/useSettings'
import {
  InlineError, PageStack, SettingsPageHeader, SettingsSection, SettingsSkeleton, SwitchRow, useProfileSave,
} from '../../components/settings-ui'

export function CustomersSettings() {
  const t = useTranslations('settings')
  const { data: profile, isLoading } = useProfile()
  const { data: defs } = useCustomerFieldDefinitions()
  const { save, saving, error, setError } = useProfileSave()
  // Customer capture on, yet nothing for the cashier to fill: checkout would have no way to pick a customer.
  const captureHasNoFields =
    !!profile?.customer_capture_enabled &&
    defs !== undefined &&
    !defs.some((f) => f.is_active) &&
    !profile?.name_field_enabled

  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.customers')} description={t('nav.descriptions.customers')} />
      {isLoading || !profile ? <SettingsSkeleton /> : (
        <SettingsSection
          title={t('sections.captureTitle')}
          footer={<InlineError message={error} onDismiss={() => setError(null)} />}
        >
          <SwitchRow
            label={t('customFields')}
            description={t('customFieldsHint')}
            checked={!!profile.customer_capture_enabled}
            disabled={saving}
            onChange={(v) => save({ customer_capture_enabled: v })}
          />
          {captureHasNoFields && (
            <div className="px-5 py-4">
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{t('customFieldsEmptyWarning')}</span>
              </div>
            </div>
          )}
        </SettingsSection>
      )}
      <SettingsSection title={t('sections.fieldsTitle')} description={t('sections.fieldsHint')}>
        <div className="p-5">
          <CustomFieldsManager />
        </div>
      </SettingsSection>
    </PageStack>
  )
}
