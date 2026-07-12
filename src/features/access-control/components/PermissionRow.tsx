'use client'

import { useTranslations } from 'next-intl'
import { RotateCcw } from 'lucide-react'
import { Switch } from '@/shared/ui/switch'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { ResolvedPermission } from '../api/access-control.api'

interface PermissionRowProps {
  permission: ResolvedPermission
  label: string
  advanced: boolean
  readOnly: boolean
  onToggle: (isGranted: boolean) => void
  onReset: () => void
}

export function PermissionRow({ permission, label, advanced, readOnly, onToggle, onReset }: PermissionRowProps) {
  const t = useTranslations('accessControl')
  const isCustomized = permission.source === 'tenant_override'

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-1">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
          {isCustomized && <StatusBadge label={t('customized')} tone="brand" />}
        </div>
        {advanced && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{permission.permission_key}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isCustomized && (
          <button
            type="button"
            onClick={onReset}
            disabled={readOnly}
            title={t('resetToDefault')}
            className="p-1.5 text-slate-400 hover:text-[#0C447C] dark:hover:text-[#5B9BD5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        <Switch
          checked={permission.granted}
          onCheckedChange={onToggle}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}
