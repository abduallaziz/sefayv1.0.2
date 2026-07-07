'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useUsers } from '../hooks/useUsers'
import { Plus, Search, Eye, CalendarClock } from 'lucide-react'

type StatusFilter = 'all' | 'active' | 'inactive'

export function EmployeesPage() {
  const t = useTranslations('employees')
  const { data: users, isLoading } = useUsers()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <Link
          href="/dashboard/employees/new"
          className="flex items-center gap-2 px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] rounded-lg text-sm text-white transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('addEmployee')}</span>
        </Link>
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
                  <th className="px-3 py-3 w-16" />
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
                      <Link
                        href={`/dashboard/users/${emp.id}`}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-[#0C447C] dark:hover:text-[#5B9BD5] transition-colors inline-block"
                        title={t('viewProfile')}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
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
    </div>
  )
}
