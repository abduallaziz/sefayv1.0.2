'use client'

import { useTranslations } from 'next-intl'
import { Ban } from 'lucide-react'
import type { Subscription, SubscriptionStatus } from '../types/subscription.types'

const statusStyles: Record<SubscriptionStatus, string> = {
  active:       'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  trial:        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  cancelled:    'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  expired:      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  suspended:    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  grace_period: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
}

interface Props {
  subscriptions: Subscription[]
  onCancel: (id: string) => void
}

export function SubscriptionsTable({ subscriptions, onCancel }: Props) {
  const t = useTranslations('subscriptions')

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#1e2130]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#141720]">
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('table.tenant')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('table.plan')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('table.status')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('table.interval')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('table.endsAt')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('table.amount')}</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-[#1e2130] bg-white dark:bg-[#0f1117]">
          {subscriptions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-500">{t('table.empty')}</td>
            </tr>
          )}
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="transition hover:bg-slate-50 dark:hover:bg-[#141720]">
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{sub.tenant_name ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{sub.plan_name ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[sub.status]}`}>
                  {t(`status.${sub.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t(`interval.${sub.billing_cycle}`)}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{sub.amount_paid ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                {sub.status === 'active' || sub.status === 'trial' ? (
                  <button onClick={() => onCancel(sub.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-500 dark:text-red-400 transition hover:bg-red-500/10">
                    <Ban size={12} />{t('table.cancelAction')}
                  </button>
                ) : <span className="text-xs text-slate-400 dark:text-slate-600">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}