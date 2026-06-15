'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useProfile, useSubscription, useUsage, useUpdateProfile } from '../hooks/useSettings'
import { Building2, CreditCard, BarChart3, Save } from 'lucide-react'

export function SettingsPage() {
  const t = useTranslations('settings')
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: subscriptionData, isLoading: subLoading } = useSubscription()
  const { data: usage, isLoading: usageLoading } = useUsage()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const [name, setName] = useState('')

  const sub = (subscriptionData as any)?.subscription

  function handleSave() {
    if (name.trim()) {
      updateProfile({ name: name.trim() })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Profile */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">{t('profile')}</h2>
        </div>
        {profileLoading ? (
          <div className="h-10 bg-[#1e2130] rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('businessName')}</label>
              <input
                type="text"
                defaultValue={profile?.name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('businessType')}</label>
              <input
                type="text"
                value={profile?.business_type ?? '—'}
                disabled
                className="w-full bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-slate-500"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">{t('subscription')}</h2>
        </div>
        {subLoading ? (
          <div className="h-10 bg-[#1e2130] rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">{t('plan')}</p>
              <p className="text-sm font-medium text-white mt-1">{sub?.plan_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('status')}</p>
              <p className="text-sm font-medium text-emerald-400 mt-1">{sub?.status ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('interval')}</p>
              <p className="text-sm font-medium text-white mt-1">{sub?.billing_cycle ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('endsAt')}</p>
              <p className="text-sm font-medium text-white mt-1">
                {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-US') : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">{t('usage')}</h2>
        </div>
        {usageLoading ? (
          <div className="h-10 bg-[#1e2130] rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('users')}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0f1117] rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(((usage?.users?.current ?? 0) / (usage?.users?.max ?? 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{usage?.users?.current ?? 0}/{usage?.users?.max ?? sub?.max_users ?? 0}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('branches')}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0f1117] rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full"
                    style={{ width: `${Math.min(((usage?.branches?.current ?? 0) / (usage?.branches?.max ?? 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{usage?.branches?.current ?? 0}/{usage?.branches?.max ?? sub?.max_branches ?? 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}