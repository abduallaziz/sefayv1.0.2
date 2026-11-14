'use client'

import { useTranslations } from 'next-intl'
import { useProfile } from '../../hooks/useSettings'
import type { NotificationPreferences } from '../../api/settings.api'
import {
  InlineError, PageStack, SettingsPageHeader, SettingsSection, SettingsSkeleton, SwitchRow, useProfileSave,
} from '../../components/settings-ui'

const NOTIFICATION_KEYS: (keyof NotificationPreferences)[] = ['subscription_expired', 'payment_failed', 'payment_success']

export function NotificationsSettings() {
  const t = useTranslations('settings')
  const { data: profile, isLoading } = useProfile()
  const { save, saving, error, setError } = useProfileSave()

  return (
    <PageStack>
      <SettingsPageHeader title={t('nav.items.notifications')} description={t('nav.descriptions.notifications')} />
      {isLoading || !profile ? <SettingsSkeleton /> : (
        <SettingsSection
          title={t('notificationPreferences')}
          description={t('notificationPreferencesHint')}
          footer={<InlineError message={error} onDismiss={() => setError(null)} />}
        >
          {NOTIFICATION_KEYS.map((key) => (
            <SwitchRow
              key={key}
              label={t(`notifications.${key}`)}
              checked={profile.notification_preferences?.[key] !== false}
              disabled={saving}
              onChange={(v) => save({ notification_preferences: { ...profile.notification_preferences, [key]: v } })}
            />
          ))}
        </SettingsSection>
      )}
    </PageStack>
  )
}
