'use client'

import { useTranslations } from 'next-intl'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/empty-state'
import { ShieldCheck } from 'lucide-react'
import { useAccessControlRoles } from '../hooks/useAccessControl'
import { RoleCard } from '../components/RoleCard'

export function AccessControlRolesPage() {
  const t = useTranslations('accessControl')
  const { data: roles, isLoading, isError } = useAccessControlRoles()

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

      {isError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{t('loadError')}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : roles && roles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
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
  )
}
