'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Users, SlidersHorizontal, ChevronLeft } from 'lucide-react'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { RoleSummary } from '../api/access-control.api'

// Client-side only — purely for UX (protected-role framing). The backend's
// AccessControlAdminGuard + protected-role check in AccessControlService are
// the real enforcement; this list only decides whether the card shows a lock
// badge / read-only wording, never whether an action is actually possible.
const PROTECTED_ROLE_NAMES = new Set(['owner', 'superadmin'])

export function RoleCard({ role }: { role: RoleSummary }) {
  const t = useTranslations('accessControl')
  const isProtected = PROTECTED_ROLE_NAMES.has(role.name)

  return (
    <Link
      href={`/dashboard/settings/access-control/${role.id}`}
      className="block bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 hover:border-[#0C447C]/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{role.name}</h3>
        {isProtected && (
          <StatusBadge label={`🔒 ${t('protectedRole')}`} tone="neutral" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5" /> {t('userCount')}
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{role.user_count}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> {t('customizations')}
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">
            {role.customized_permission_count}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-800">
        <span className="text-xs text-slate-400">
          {role.permission_count} {t('activePermissions')}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-[#0C447C] dark:text-[#5B9BD5] group-hover:gap-1.5 transition-all">
          {isProtected ? t('viewAccess') : t('manageAccess')}
          <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  )
}
