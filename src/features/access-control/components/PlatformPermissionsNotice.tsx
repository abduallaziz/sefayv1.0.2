'use client'

import { useTranslations } from 'next-intl'
import { ShieldAlert } from 'lucide-react'

// Shown only to non-superadmin viewers (owner). There is nothing to "hide"
// client-side here — the backend's /access-control/permissions and
// /access-control/roles/:id/permissions endpoints already exclude
// resource='superadmin' rows entirely for non-superadmin callers, so an
// owner's response simply never contains them. This panel is context only,
// not a filter.
export function PlatformPermissionsNotice() {
  const t = useTranslations('accessControl')

  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3">
      <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
      <div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          🔒 {t('platformPermissionsTitle')}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{t('platformPermissionsHint')}</p>
      </div>
    </div>
  )
}
