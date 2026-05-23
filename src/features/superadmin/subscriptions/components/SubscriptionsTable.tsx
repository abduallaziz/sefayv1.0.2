'use client'

import { useTranslations } from 'next-intl'
import { Ban } from 'lucide-react'
import type { Subscription, SubscriptionStatus } from '../types/subscription.types'

const statusStyles: Record<SubscriptionStatus, string> = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trial:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
  suspended: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

interface Props {
  subscriptions: Subscription[]
  onCancel: (id: string) => void
}

export function SubscriptionsTable({ subscriptions, onCancel }: Props) {
  const t = useTranslations('subscriptions')

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2130]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2130] bg-[#141720]">
            <th className="px-4 py-3 text-left font-medium text-slate-400">{t('table.tenant')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">{t('table.plan')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">{t('table.status')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">{t('table.interval')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">{t('table.endsAt')}</th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">{t('table.amount')}</th>
            <th className="px-4 py-3 text-right font-medium text-slate-400">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2130] bg-[#0f1117]">
          {subscriptions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('table.empty')}</td>
            </tr>
          )}
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="transition hover:bg-[#141720]">
              <td className="px-4 py-3 font-medium text-white">{sub.tenant_name}</td>
              <td className="px-4 py-3 text-slate-300">{sub.plan_name}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[sub.status]}`}>
                  {t(`status.${sub.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">{t(`interval.${sub.interval}`)}</td>
              <td className="px-4 py-3 text-slate-400">{new Date(sub.ends_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-slate-300">${sub.amount_paid}</td>
              <td className="px-4 py-3 text-right">
                {sub.status === 'active' || sub.status === 'trial' ? (
                  <button onClick={() => onCancel(sub.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10">
                    <Ban size={12} />{t('table.cancelAction')}
                  </button>
                ) : <span className="text-xs text-slate-600">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
