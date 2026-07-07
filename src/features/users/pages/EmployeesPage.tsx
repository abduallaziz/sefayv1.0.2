'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEmployees, useLinkableUsers, useLinkAsEmployee, useUpdateEmployee, useDeleteUser } from '../hooks/useUsers'
import { Plus, Search, Eye, CalendarClock, Link2, Ban, UserCheck, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import type { User } from '../api/users.api'

type StatusFilter = 'all' | 'active' | 'inactive'
type PendingAction = { type: 'disable' | 'enable' | 'delete'; employee: User }

export function EmployeesPage() {
  const t = useTranslations('employees')
  const { data: users, isLoading } = useEmployees()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const { mutate: updateEmployee, isPending: updating } = useUpdateEmployee()
  const { mutate: deleteEmployee, isPending: deleting } = useDeleteUser()

  const employees = useMemo(() => {
    let list = users ?? []
    if (statusFilter !== 'all') {
      list = list.filter((u) => (statusFilter === 'active' ? u.is_active : !u.is_active))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) || u.employee_number?.toLowerCase().includes(q),
      )
    }
    return list
  }, [users, search, statusFilter])

  function confirmPendingAction() {
    if (!pendingAction) return
    if (pendingAction.type === 'delete') {
      deleteEmployee(pendingAction.employee.id, { onSuccess: () => setPendingAction(null) })
    } else {
      updateEmployee(
        { id: pendingAction.employee.id, data: { is_active: pendingAction.type === 'enable' } },
        { onSuccess: () => setPendingAction(null) },
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLinkModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors shrink-0"
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('linkExistingUser')}</span>
          </button>
          <Link
            href="/dashboard/employees/new"
            className="flex items-center gap-2 px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] rounded-lg text-sm text-white transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('addEmployee')}</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full ps-9 pe-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
        >
          <option value="all">{t('filterAllStatus')}</option>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('title')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">{t('employeeNumber')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">{t('department')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">{t('jobTitle')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">{t('status')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">{t('attendance')}</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#E8F0FB] dark:bg-[#0C447C]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#0C447C] dark:text-[#5B9BD5] text-xs font-medium">
                            {emp.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-[160px]">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">{emp.employee_number ?? '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">{emp.department ?? '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">{emp.job_title ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${emp.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {emp.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${emp.attendance_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        <CalendarClock className="w-3.5 h-3.5" />
                        {emp.attendance_enabled ? t('attendanceEnabled') : t('attendanceDisabled')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/users/${emp.id}`}
                          className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-[#0C447C] dark:hover:text-[#5B9BD5] transition-colors"
                          title={t('viewProfile')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setPendingAction({ type: emp.is_active ? 'disable' : 'enable', employee: emp })}
                          className={`p-1.5 transition-colors ${emp.is_active ? 'text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400' : 'text-emerald-500 hover:text-emerald-600'}`}
                          title={emp.is_active ? t('disable') : t('enable')}
                        >
                          {emp.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setPendingAction({ type: 'delete', employee: emp })}
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
          {employees.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
              {users?.length === 0 ? t('empty') : t('noResults')}
            </div>
          )}
        </div>
      )}

      {linkModalOpen && <LinkExistingUserModal onClose={() => setLinkModalOpen(false)} />}

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
              <span className="font-semibold text-slate-700 dark:text-white">{pendingAction.employee.name}</span>؟
            </>
          )
        }
        confirmLabel={pendingAction ? t(pendingAction.type) : ''}
        cancelLabel={t('cancel')}
        loadingLabel={t('processing')}
        isLoading={deleting || updating}
      />
    </div>
  )
}

function LinkExistingUserModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('employees')
  const { data: linkable = [], isLoading } = useLinkableUsers()
  const { mutate: linkAsEmployee, isPending } = useLinkAsEmployee()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleLink() {
    if (!selectedId) return
    linkAsEmployee(selectedId, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{t('linkExistingUser')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-1.5">
          <p className="text-xs text-gray-400 mb-2">{t('linkExistingUserHint')}</p>
          {isLoading ? (
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : linkable.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('noLinkableUsers')}</p>
          ) : (
            linkable.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className={`w-full text-start flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedId === u.id
                    ? 'border-[#0C447C] bg-[#0C447C]/5'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className="text-xs text-gray-400">{u.role}</span>
              </button>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedId || isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 transition-colors"
          >
            {isPending ? t('linking') : t('link')}
          </button>
        </div>
      </div>
    </div>
  )
}
