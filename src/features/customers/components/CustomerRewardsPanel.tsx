'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Gift } from 'lucide-react'
import { useCustomerRewardsHistory } from '@/features/rewards/hooks/useRewards'
import type { RewardInstanceStatus } from '@/features/rewards/api/rewards.api'
import { formatDate } from '@/lib/locale'

const STATUS_COLORS: Record<RewardInstanceStatus, string> = {
  locked: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  unlocked: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  redeemed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

// Reads GET /customers/:id/rewards — a non-mutating suggestion surface (see
// api/src/modules/rewards/customer-rewards.controller.ts). Passing no status
// fetches every instance for this customer regardless of lifecycle state, so
// the panel shows the customer's full reward history, not just what's
// currently redeemable (that's what the POS redemption UI is for).
export function CustomerRewardsPanel({ customerId }: { customerId: string }) {
  const t = useTranslations('rewards')
  const rawLocale = useLocale()
  const locale: 'ar' | 'en' = rawLocale === 'ar' ? 'ar' : 'en'
  const { data: instances, isLoading } = useCustomerRewardsHistory(customerId)

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Gift className="w-4 h-4 text-gray-400" />
        {t('customer.title')}
      </h3>
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-4">{t('customer.loading')}</p>
      ) : !instances?.length ? (
        <p className="text-sm text-gray-400 text-center py-4">{t('customer.empty')}</p>
      ) : (
        <div className="space-y-2">
          {instances.map((instance) => (
            <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {instance.reward_definitions?.name ?? '—'}
                </p>
                {instance.status === 'redeemed' && instance.redeemed_at && (
                  <p className="text-xs text-gray-400">
                    {t('customer.redeemedOn', { date: formatDate(instance.redeemed_at, { locale }) })}
                  </p>
                )}
                {instance.status !== 'redeemed' && instance.expires_at && (
                  <p className="text-xs text-gray-400">
                    {t('customer.expiresOn', { date: formatDate(instance.expires_at, { locale }) })}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[instance.status]}`}>
                {t(`customer.status.${instance.status}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
