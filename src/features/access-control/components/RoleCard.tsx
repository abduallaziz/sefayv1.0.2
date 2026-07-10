'use client'

import { Pencil, Trash2, Eye, Users, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/ui'
import { RoleStatusBadge } from './RoleStatusBadge'
import type { RoleSummary } from '../api/access-control.api'

interface RoleCardProps {
  role: RoleSummary
  onView: (role: RoleSummary) => void
  onEdit: (role: RoleSummary) => void
  onDelete: (role: RoleSummary) => void
}

// Replaces the old select-to-view-detail list card from the pre-rebuild
// master-detail layout (this file was orphaned after that rewrite — no
// remaining imports referenced it). This version puts the actions directly
// on the card instead of requiring a click-through.
export function RoleCard({ role, onView, onEdit, onDelete }: RoleCardProps) {
  const t = useTranslations('accessControl')
  const isSystem = role.is_system

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-semibold text-slate-900">{role.name}</h3>
          {isSystem && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        </div>
        <RoleStatusBadge isSystem={isSystem} className="shrink-0" />
      </div>

      <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">
        {role.description || t('card.noDescription')}
      </p>

      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        <Users className="h-4 w-4 text-slate-400" />
        <span className="font-medium tabular-nums">{role.user_count}</span>
        <span className="text-slate-400">{t('userCount')}</span>
      </div>

      <div className="mt-1 flex items-center gap-2 border-t border-slate-100 pt-3">
        {isSystem ? (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(role)}>
            <Eye className="me-1.5 h-3.5 w-3.5" /> {t('actionsMenu.viewOnly')}
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(role)}>
              <Pencil className="me-1.5 h-3.5 w-3.5" /> {t('actionsMenu.edit')}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Disabled deliberately, not a stub — users.role is a
                      fixed 5-value DB enum today, not a FK to the roles
                      table this card manages, so there is no real
                      assignment to perform yet (see STATUS.md). */}
                  <span className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Users className="me-1.5 h-3.5 w-3.5" /> {t('card.manageUsers')}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('card.manageUsersComingSoon')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-slate-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(role)}
              aria-label={t('actionsMenu.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
