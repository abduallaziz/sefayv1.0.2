'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Search, UserPlus, Trash2, Users as UsersIcon, Lock, ShieldCheck, ChevronUp } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  Button,
  Input,
  EmptyState,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/shared/ui'
import { StatusBadge } from '@/shared/ui/status-badge'
import { useRoleUsers, useRoleDisplayName, useAccessControlRoles } from '../hooks/useAccessControl'
import { useAddUserRole, useRemoveUserRole, useChangeRole, useUsers } from '@/features/users/hooks/useUsers'
import { RolesTableSkeleton } from './RolesTableSkeleton'
import { UserPermissionChecklist } from './UserPermissionChecklist'
import type { RoleSummary, RoleUserRow } from '../api/access-control.api'

interface RoleUsersSheetProps {
  role: RoleSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleUsersSheet({ role, open, onOpenChange }: RoleUsersSheetProps) {
  if (!role) return null
  return <RoleUsersSheetContent role={role} open={open} onOpenChange={onOpenChange} />
}

function RoleUsersSheetContent({
  role,
  open,
  onOpenChange,
}: {
  role: RoleSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('accessControl')
  const displayName = useRoleDisplayName(role)

  const { data: roleUsers, isLoading } = useRoleUsers(role.id, open)
  const { data: allRoles } = useAccessControlRoles()
  const addUserRole = useAddUserRole(role.id)
  const removeUserRole = useRemoveUserRole(role.id)
  const changeRole = useChangeRole()

  const [search, setSearch] = useState('')
  const [addingOpen, setAddingOpen] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    if (!roleUsers) return []
    const q = search.trim().toLowerCase()
    if (!q) return roleUsers
    return roleUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [roleUsers, search])

  // Only system roles are valid changeRole() targets — its DTO is a fixed
  // UserRole enum, not a free role_id, so a custom role never appears in
  // the "promote/demote" picker (see users.service.ts changeRole()).
  const systemRoles = useMemo(() => (allRoles ?? []).filter((r) => r.is_system), [allRoles])

  function handleRemove(user: RoleUserRow) {
    removeUserRole.mutate(user.id, {
      onError: (err) => toast.error(err instanceof Error ? err.message : t('roleUsersSheet.removeError')),
    })
  }

  function handleAdd(userId: string) {
    addUserRole.mutate(userId, {
      onSuccess: () => setAddingOpen(false),
      onError: (err) => toast.error(err instanceof Error ? err.message : t('roleUsersSheet.addError')),
    })
  }

  function handlePromoteDemote(userId: string, newRoleName: string) {
    changeRole.mutate(
      { id: userId, role: newRoleName },
      { onError: (err) => toast.error(err instanceof Error ? err.message : t('roleUsersSheet.changePrimaryError')) },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="top-[66px] w-full border-s border-slate-200 bg-white dark:border-[#1e2130] dark:bg-[#1a1f2e] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('roleUsersSheet.title', { role: displayName })}</SheetTitle>
          <SheetDescription>{t('roleUsersSheet.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('roleUsersSheet.searchPlaceholder')}
                className="h-10 rounded-md bg-white dark:bg-[#141720] ps-9 focus-visible:ring-[#0C447C]"
              />
            </div>
            <Button
              type="button"
              onClick={() => setAddingOpen((v) => !v)}
              className="h-10 shrink-0 bg-[#0C447C] font-medium text-white hover:bg-[#0a3a6b]"
            >
              <UserPlus className="me-1.5 h-4 w-4" /> {t('roleUsersSheet.addUser')}
            </Button>
          </div>

          {addingOpen && (
            <AddUserPanel
              t={t}
              alreadyAssignedIds={new Set((roleUsers ?? []).map((u) => u.id))}
              onAdd={handleAdd}
              adding={addUserRole.isPending}
            />
          )}

          {isLoading ? (
            <RolesTableSkeleton rows={4} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={roleUsers && roleUsers.length > 0 ? t('roleUsersSheet.noSearchResults') : t('roleUsersSheet.emptyTitle')}
              description={roleUsers && roleUsers.length > 0 ? undefined : t('roleUsersSheet.emptyDescription')}
              size="sm"
            />
          ) : (
            <div className="space-y-1.5">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  t={t}
                  systemRoles={systemRoles}
                  currentRoleName={role.name}
                  onRemove={() => handleRemove(user)}
                  onPromoteDemote={(newRoleName) => handlePromoteDemote(user.id, newRoleName)}
                  removing={removeUserRole.isPending}
                  expanded={expandedUserId === user.id}
                  onToggleExpand={() => setExpandedUserId((cur) => (cur === user.id ? null : user.id))}
                  roleId={role.id}
                  locked={role.name === 'owner'}
                />
              ))}
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function UserRow({
  user,
  t,
  systemRoles,
  currentRoleName,
  onRemove,
  onPromoteDemote,
  removing,
  expanded,
  onToggleExpand,
  roleId,
  locked,
}: {
  user: RoleUserRow
  t: ReturnType<typeof useTranslations>
  systemRoles: RoleSummary[]
  currentRoleName: string
  onRemove: () => void
  onPromoteDemote: (newRoleName: string) => void
  removing: boolean
  expanded: boolean
  onToggleExpand: () => void
  roleId: string
  locked: boolean
}) {
  // The role currently open in this sheet may itself be a custom role even
  // though the picker only ever lists system roles — the picker still shows
  // so a system-role member can be promoted/demoted, but selecting is a
  // no-op display of the current value when this user's primary role isn't
  // in the system-role list at all.
  const showPromoteDemote = user.is_primary && systemRoles.length > 0

  return (
    <div className="rounded-lg border border-slate-100 dark:border-gray-800">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-800 dark:text-white">{user.name}</span>
            {user.is_primary && <StatusBadge label={t('roleUsersSheet.primaryBadge')} tone="brand" />}
            {locked && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                <Lock className="h-3 w-3" /> {t('userPermissionChecklist.ownerBadge')}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showPromoteDemote && (
            <Select value={currentRoleName} onValueChange={onPromoteDemote}>
              <SelectTrigger className="h-8 w-36 rounded-md border-slate-200 bg-white text-xs text-slate-700 dark:border-[#1e2130] dark:bg-[#1a1f2e] dark:text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white dark:border-[#1e2130] dark:bg-[#1a1f2e]">
                {systemRoles.map((r) => (
                  // SelectItem's base styling hard-codes hover:/focus:bg-[#242938]
                  // (dark) and an indigo checkmark — overriding both here rather
                  // than in the shared component, since Select is used
                  // elsewhere as an intentionally always-dark (superadmin-style)
                  // control. [&_svg]:text-[#0C447C] retargets the checkmark
                  // icon, which isn't reachable via className on SelectItem
                  // itself (it's rendered by a nested SelectPrimitive.ItemIndicator).
                  //
                  // r.name is the fixed backend enum value ('cashier',
                  // 'inventory_clerk', ...) — same lookup useRoleDisplayName()
                  // does, inlined here since hooks can't be called inside
                  // .map(). SelectValue automatically shows whichever
                  // SelectItem's rendered children matches the current value,
                  // so translating the children here also fixes the trigger's
                  // own display, not just the open dropdown.
                  <SelectItem
                    key={r.id}
                    value={r.name}
                    className="text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800 [&_svg]:text-[#0C447C]"
                  >
                    {t.has(`roles.${r.name}.name`) ? t(`roles.${r.name}.name`) : r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onToggleExpand}
                  className="h-8 w-8 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                  aria-label={t('userPermissionChecklist.togglePermissions')}
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('userPermissionChecklist.togglePermissions')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={user.is_primary || removing}
                    onClick={onRemove}
                    className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label={t('roleUsersSheet.removeRole')}
                  >
                    {user.is_primary ? <Lock className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {user.is_primary ? t('roleUsersSheet.cannotRemovePrimary') : t('roleUsersSheet.removeRole')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-2 dark:border-gray-800">
          <UserPermissionChecklist userId={user.id} roleId={roleId} locked={locked} />
        </div>
      )}
    </div>
  )
}

// TODO(server-side search): filters the already-fetched full tenant user
// list client-side — fine at today's scale, but won't hold up once tenants
// have thousands of users. Swap for a paginated GET /users?search= endpoint
// (doesn't exist yet) when that becomes the bottleneck.
function AddUserPanel({
  t,
  alreadyAssignedIds,
  onAdd,
  adding,
}: {
  t: ReturnType<typeof useTranslations>
  alreadyAssignedIds: Set<string>
  onAdd: (userId: string) => void
  adding: boolean
}) {
  const { data: allUsers, isLoading } = useUsers()
  const [query, setQuery] = useState('')

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (allUsers ?? [])
      .filter((u) => !alreadyAssignedIds.has(u.id))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 20)
  }, [allUsers, alreadyAssignedIds, query])

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('roleUsersSheet.addUserSearchPlaceholder')}
        className="h-9 rounded-md bg-white dark:bg-[#141720] text-sm"
      />
      {isLoading ? (
        <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">{t('roleUsersSheet.loadingUsers')}</p>
      ) : candidates.length === 0 ? (
        <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">{t('roleUsersSheet.noCandidates')}</p>
      ) : (
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {candidates.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5 dark:bg-gray-900">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{u.name}</p>
                <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{u.email}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={adding}
                onClick={() => onAdd(u.id)}
                className="h-7 shrink-0 px-2 text-xs"
              >
                {t('roleUsersSheet.add')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
