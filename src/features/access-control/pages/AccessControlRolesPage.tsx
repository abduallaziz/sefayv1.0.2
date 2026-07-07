'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Plus, LayoutGrid, List } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/empty-state'
import { ShieldCheck } from 'lucide-react'
import { useAccessControlRoles } from '../hooks/useAccessControl'
import { RoleCard } from '../components/RoleCard'

const PAGE_SIZE = 8

export function AccessControlRolesPage() {
  const t = useTranslations('accessControl')
  const { data: roles, isLoading, isError } = useAccessControlRoles()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!roles) return []
    if (!search.trim()) return roles
    const q = search.trim().toLowerCase()
    return roles.filter((r) => r.name.toLowerCase().includes(q))
  }, [roles, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumb={[
          { label: t('breadcrumbSettings'), href: '/dashboard/settings' },
          { label: t('title') },
        ]}
      />

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            {t('rolesListTitle')}
            <span className="bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] text-[11px] font-extrabold rounded-full px-2.5 py-0.5">
              {filtered.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('searchRolePlaceholder')}
              className="w-full bg-transparent border-0 outline-none text-sm text-slate-800 dark:text-white"
            />
          </div>
          <button className="w-9 h-9 flex-shrink-0 rounded-lg border border-[#0C447C] bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#5B9BD5] flex items-center justify-center">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 flex-shrink-0 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-400 flex items-center justify-center">
            <List className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          disabled
          title={t('newRoleSoon')}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-gray-800 text-slate-400 rounded-lg py-2.5 text-sm font-bold mb-5 cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> {t('newRole')}
        </button>

        {isError && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{t('loadError')}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : pageItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pageItems.map((role, i) => (
                <RoleCard key={role.id} role={role} index={(page - 1) * PAGE_SIZE + i} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-gray-800">
              <span className="text-xs text-slate-400">
                {t('paginationInfo', {
                  from: filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-gray-700 text-slate-500 flex items-center justify-center disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="w-7 h-7 rounded-md bg-[#0C447C] text-white text-xs font-bold flex items-center justify-center">
                  {page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-gray-700 text-slate-500 flex items-center justify-center disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        ) : (
          !isError && (
            <EmptyState
              icon={ShieldCheck}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
            />
          )
        )}
      </div>
    </div>
  )
}
