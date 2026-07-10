'use client'

import { Pencil, Trash2, Eye, Users, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/ui'
import { RoleStatusBadge } from './RoleStatusBadge'
import { useRoleDisplayName, useRoleDisplayDescription } from '../hooks/useAccessControl'
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
  const displayName = useRoleDisplayName(role)
  const displayDescription = useRoleDisplayDescription(role)

  return (
    // h-full so every card in a CSS Grid row stretches to the row's tallest
    // card (Grid's default align-items:stretch already does this — h-full
    // just makes the card's own flex-col content actually fill that height
    // instead of staying at its intrinsic size), and the flex-1 content
    // block below pins the action row to the same bottom edge on every card
    // regardless of description length.
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">{displayName}</h3>
            {isSystem && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
          </div>
          <RoleStatusBadge isSystem={isSystem} className="shrink-0" />
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">
          {displayDescription || t('card.noDescription')}
        </p>

        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Users className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="shrink-0 font-medium tabular-nums">{role.user_count}</span>
          <span className="truncate text-slate-400">{t('userCount')}</span>
        </div>
      </div>

      {/* min-w-0 on every flex-1 item is load-bearing, not decorative: flex
          items default to min-width:auto (their content's natural width),
          so without it a long translated label (e.g. Arabic "إدارة
          المستخدمين") refuses to shrink, the row overflows past the card's
          padding, and the trailing Delete button visibly pokes outside the
          card. truncate on each label lets it ellipsize instead of forcing
          the row wider than the card. */}
      <div className="flex items-center gap-2 overflow-hidden border-t border-slate-100 pt-3">
        {isSystem ? (
          <Button variant="outline" size="sm" className="min-w-0 flex-1" onClick={() => onView(role)}>
            <Eye className="me-1.5 h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t('actionsMenu.viewOnly')}</span>
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" className="min-w-0 flex-1" onClick={() => onEdit(role)}>
              <Pencil className="me-1.5 h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t('actionsMenu.edit')}</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Disabled deliberately, not a stub — users.role is a
                      fixed 5-value DB enum today, not a FK to the roles
                      table this card manages, so there is no real
                      assignment to perform yet (see STATUS.md). */}
                  <span className="min-w-0 flex-1">
                    <Button variant="outline" size="sm" className="w-full min-w-0" disabled>
                      <Users className="me-1.5 h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t('card.manageUsers')}</span>
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
