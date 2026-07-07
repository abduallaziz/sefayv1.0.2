'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Lock, Circle } from 'lucide-react'
import type { RoleSummary } from '../api/access-control.api'

// Client-side only — purely for UX (protected-role framing). The backend's
// AccessControlAdminGuard + protected-role check in AccessControlService are
// the real enforcement; this list only decides whether the card shows a lock
// badge / read-only wording, never whether an action is actually possible.
const PROTECTED_ROLE_NAMES = new Set(['owner', 'superadmin'])

// Pastel icon-color palette, cycled by position — not tied to specific role
// names, so it works the same way once custom tenant roles exist.
const PALETTE = [
  { bg: '#E8F1FB', fg: '#0C447C' },
  { bg: '#E6F9EE', fg: '#16A34A' },
  { bg: '#FEF3DA', fg: '#D97706' },
  { bg: '#EDEAFB', fg: '#7C6EF6' },
]

export function RoleCard({ role, index }: { role: RoleSummary; index: number }) {
  const t = useTranslations('accessControl')
  const isProtected = PROTECTED_ROLE_NAMES.has(role.name)
  const color = PALETTE[index % PALETTE.length]

  return (
    <Link
      href={`/dashboard/settings/access-control/${role.id}`}
      className="block bg-white dark:bg-gray-900 border-[1.5px] border-slate-200 dark:border-gray-800 rounded-2xl p-4 hover:border-[#0C447C] hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
          style={{ background: color.bg, color: color.fg }}
        >
          {role.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-800 dark:text-white truncate">{role.name}</p>
          {isProtected ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 mt-0.5">
              <Lock className="w-2.5 h-2.5" /> {t('protectedRole')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 mt-0.5">
              <Circle className="w-1.5 h-1.5 fill-current" /> {t('active')}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold mb-0.5">{t('permissionsShort')}</p>
          <p className="text-base font-extrabold text-slate-800 dark:text-white">{role.permission_count}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-semibold mb-0.5">{t('userCount')}</p>
          <p className="text-base font-extrabold text-slate-800 dark:text-white">{role.user_count}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#0C447C] dark:text-[#5B9BD5] border-t border-slate-100 dark:border-gray-800 pt-2.5">
        {t('viewDetails')}
        <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
      </div>
    </Link>
  )
}
