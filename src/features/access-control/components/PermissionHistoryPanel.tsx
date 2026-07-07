'use client'

import { useTranslations } from 'next-intl'
import { History } from 'lucide-react'

// Reserved UI area for permission change history (audit_logs already records
// before/after per permission on the backend — see AccessControlService —
// but there is no GET /access-control/audit endpoint yet). This intentionally
// shows a clear placeholder rather than fabricating data.
export function PermissionHistoryPanel() {
  const t = useTranslations('accessControl')

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-white">{t('history.title')}</h3>
      </div>
      <p className="text-xs text-slate-400">{t('history.comingSoon')}</p>
    </div>
  )
}
