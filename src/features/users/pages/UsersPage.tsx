'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useUsers, useDeleteUser, useUpdateUser } from '../hooks/useUsers'
import { CreateUserDialog } from '../components/CreateUserDialog'
import type { User } from '../api/users.api'
import { Trash2, Plus, Eye, Ban, UserCheck, Search } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

type PendingAction = { type: 'disable' | 'enable' | 'delete'; user: User }

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  manager: 'bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5] border-[#0C447C]/20',
  cashier: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  worker: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

export function UsersPage() {
  const t = useTranslations('users')
  const { data: allUsers, isLoading } = useUsers()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const users = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (allUsers ?? []).filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (statusFilter === 'active' && !u.is_active) return false
      if (statusFilter === 'inactive' && u.is_active) return false
      if (q && !`${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [allUsers, search, roleFilter, statusFilter])
  const filtering = !!(search || roleFilter || statusFilter)
  const { mutate: deleteUser, isPending: deleting } = useDeleteUser()
  const { mutate: updateUser, isPending: updating } = useUpdateUser()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  function confirmPendingAction() {
    if (!pendingAction) return
    if (pendingAction.type === 'delete') {
      deleteUser(pendingAction.user.id, { onSuccess: () => setPendingAction(null) })
    } else {
      updateUser(
        { id: pendingAction.user.id, data: { is_active: pendingAction.type === 'enable' } },
        { onSuccess: () => setPendingAction(null) },
      )
    }
  }

  return (
    <div className="space-y-6">
      <CreateUserDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filtering ? t('countFiltered', { shown: users.length, count: allUsers?.length ?? 0 }) : t('count', { count: allUsers?.length ?? 0 })}
          </p>
        </div>
        <button
          type="button"
          aria-label={t('addUser')}
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] rounded-lg text-sm text-white transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('addUser')}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ps-9 pe-3 py-2 text-sm text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label={t('roleFilterLabel')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="">{t('allRoles')}</option>
          {['owner', 'manager', 'cashier', 'worker', 'inventory_clerk', 'none'].map((r) => (
            <option key={r} value={r}>{t(`roles.${r}`)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
          aria-label={t('statusFilterLabel')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="">{t('allStatuses')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {users.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#E8F0FB] dark:bg-[#0C447C]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0C447C] dark:text-[#5B9BD5] text-xs font-medium">
                        {user.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/dashboard/users/${user.id}`}
                      className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-[#0C447C] dark:hover:text-[#5B9BD5] transition-colors"
                      title={t('viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
 aria-label={user.is_active ? t('disable') : t('enable')}
 onClick={() => setPendingAction({ type: user.is_active ? 'disable' : 'enable', user })}
                      className={`p-1.5 transition-colors ${user.is_active ? 'text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400' : 'text-emerald-500 hover:text-emerald-600'}`}
                      title={user.is_active ? t('disable') : t('enable')}
                    >
                      {user.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
 aria-label={t('delete')}
 onClick={() => setPendingAction({ type: 'delete', user })}
                      className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[user.role] ?? 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'}`}>
                    {t.has(`roles.${user.role}`) ? t(`roles.${user.role}`) : user.role}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                    {user.is_active ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{filtering ? t('noMatch') : t('empty')}</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('name')}</th>
                    <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('email')}</th>
                    <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">{t('role')}</th>
                    <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">{t('status')}</th>
                    <th className="px-3 py-3 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E8F0FB] dark:bg-[#0C447C]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#0C447C] dark:text-[#5B9BD5] text-xs font-medium">
                              {user.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-[140px]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{user.email}</td>
                      <td className="px-3 py-3 w-24">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[user.role] ?? 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'}`}>
                          {t.has(`roles.${user.role}`) ? t(`roles.${user.role}`) : user.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 w-20">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          {user.is_active ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-3 py-3 w-20">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-[#0C447C] dark:hover:text-[#5B9BD5] transition-colors"
                            title={t('viewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
 aria-label={user.is_active ? t('disable') : t('enable')}
 onClick={() => setPendingAction({ type: user.is_active ? 'disable' : 'enable', user })}
                            className={`p-1.5 transition-colors ${user.is_active ? 'text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400' : 'text-emerald-500 hover:text-emerald-600'}`}
                            title={user.is_active ? t('disable') : t('enable')}
                          >
                            {user.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
 aria-label={t('delete')}
 onClick={() => setPendingAction({ type: 'delete', user })}
                            className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{filtering ? t('noMatch') : t('empty')}</div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        variant={pendingAction?.type === 'delete' ? 'danger' : 'warning'}
        title={t('confirmActionTitle')}
        message={
          pendingAction && (
            <>
              {t(`confirmActionMessage_${pendingAction.type}`)}{' '}
              <span dir="auto" className="[unicode-bidi:isolate] font-semibold text-slate-700 dark:text-white">{pendingAction.user.name}</span>؟
            </>
          )
        }
        confirmLabel={pendingAction ? t(pendingAction.type) : ''}
        cancelLabel={t('cancel')}
        loadingLabel={t('saving')}
        isLoading={deleting || updating}
      />
    </div>
  )
}