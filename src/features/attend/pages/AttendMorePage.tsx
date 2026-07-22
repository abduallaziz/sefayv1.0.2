'use client'

import { useTranslations } from 'next-intl'
import { MoreHorizontal } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { TenantHeader } from '../components/TenantHeader'

export function AttendMorePage({ token }: { token: string }) {
  const t = useTranslations('attend')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <TenantHeader token={token} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MoreHorizontal className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">{t('comingSoon')}</p>
        </div>
        <BottomNav token={token} />
      </div>
    </div>
  )
}
