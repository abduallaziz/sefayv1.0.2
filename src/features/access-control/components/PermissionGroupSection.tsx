'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionRow } from './PermissionRow'
import type { ResolvedPermission } from '../api/access-control.api'

interface PermissionGroupSectionProps {
  title: string
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
  permissions,
  labelFor,
  advanced,
  readOnly,
  defaultOpen = false,
  onToggle,
  onReset,
}: PermissionGroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const grantedCount = permissions.filter((p) => p.granted).length

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-start hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-white">{title}</span>
          <span className="text-xs text-slate-400">
            {grantedCount}/{permissions.length}
          </span>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-gray-800 px-3 divide-y divide-slate-100 dark:divide-gray-800">
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
