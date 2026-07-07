'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionRow } from './PermissionRow'
import type { ResolvedPermission } from '../api/access-control.api'

interface PermissionGroupSectionProps {
  title: string
  icon: React.ReactNode
  iconBg: string
  iconFg: string
  permissions: ResolvedPermission[]
  labelFor: (permission: ResolvedPermission) => string
  advanced: boolean
  readOnly: boolean
  defaultOpen?: boolean
  onToggle: (permissionKey: string, isGranted: boolean) => void
  onReset: (permissionKey: string) => void
}

export function PermissionGroupSection({
  title,
  icon,
  iconBg,
  iconFg,
  permissions,
  labelFor,
  advanced,
  readOnly,
  defaultOpen = false,
  onToggle,
  onReset,
}: PermissionGroupSectionProps) {
  const t = useTranslations('accessControl')
  const [open, setOpen] = useState(defaultOpen)

  const total = permissions.length
  const grantedCount = permissions.filter((p) => p.granted).length
  const customizedCount = permissions.filter((p) => p.source === 'tenant_override').length
  const pct = total === 0 ? 0 : Math.round((grantedCount / total) * 100)

  const status: 'custom' | 'partial' | 'default' =
    customizedCount === 0 ? 'default' : customizedCount === total ? 'custom' : 'partial'

  const statusLabel = { custom: t('customized'), partial: t('partial'), default: t('defaultSource') }[status]
  const statusClass = {
    custom: 'bg-[#E8F1FB] text-[#0C447C] dark:bg-[#0C447C]/20 dark:text-[#5B9BD5]',
    partial: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    default: 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-slate-400',
  }[status]

  return (
    <div className="border-b border-slate-100 dark:border-gray-800 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3.5 px-5 py-3.5 text-start hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0', open && 'rotate-180')} />

        <span className={cn('text-[10.5px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0 min-w-[62px] text-center', statusClass)}>
          {statusLabel}
        </span>

        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-14 flex-shrink-0">
          {grantedCount}/{total}
        </span>

        <span className="text-xs font-semibold text-slate-400 w-20 flex-shrink-0">
          {t('permissionCount', { count: total })}
        </span>

        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#0C447C]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 w-9 flex-shrink-0">{pct}%</span>
        </div>

        <div className="flex items-center gap-2.5 w-52 flex-shrink-0 flex-row-reverse">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconFg }}>
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{title}</span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 divide-y divide-slate-100 dark:divide-gray-800 bg-slate-50/60 dark:bg-gray-800/20">
          {permissions.map((permission) => (
            <PermissionRow
              key={permission.permission_key}
              permission={permission}
              label={labelFor(permission)}
              advanced={advanced}
              readOnly={readOnly}
              onToggle={(isGranted) => onToggle(permission.permission_key, isGranted)}
              onReset={() => onReset(permission.permission_key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
