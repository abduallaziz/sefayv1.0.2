'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { TenantFeaturesPanel } from './components/TenantFeaturesPanel'
import { GlobalFeaturesPanel } from './components/GlobalFeaturesPanel'
import { useTenants } from '../tenants/hooks'

type ActiveView = 'global' | 'tenant'

export function FeatureFlagsPage() {
  const t = useTranslations('superadmin.featureFlags')
  const [view, setView] = useState<ActiveView>('global')
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  const { data: tenantsData, isLoading } = useTenants({ page: 1, limit: 50 })
  const tenants = tenantsData?.data ?? []

  const selectedTenant = tenants.find((ten) => ten.id === selectedTenantId) ?? tenants[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] p-1 w-fit">
        <button
          onClick={() => setView('global')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'global' ? 'bg-white dark:bg-[#1e2130] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          {t('globalView')}
        </button>
        <button
          onClick={() => setView('tenant')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'tenant' ? 'bg-white dark:bg-[#1e2130] text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          {t('tenantView')}
        </button>
      </div>

      {view === 'global' ? (
        <GlobalFeaturesPanel />
      ) : (
        <div className="grid grid-cols-[240px_1fr] gap-6">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-gray-500 font-medium px-2 mb-2">{t('selectTenant')}</p>
            {isLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg bg-slate-100 dark:bg-[#141720] animate-pulse" />
                ))}
              </div>
            ) : (
              tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => setSelectedTenantId(tenant.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    (selectedTenantId || tenants[0]?.id) === tenant.id
                      ? 'bg-slate-100 dark:bg-[#1e2130] text-slate-800 dark:text-white'
                      : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#141720] hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {tenant.name}
                </button>
              ))
            )}
          </div>

          {selectedTenant && (
            <TenantFeaturesPanel
              tenantId={selectedTenant.id}
              tenantName={selectedTenant.name}
            />
          )}
        </div>
      )}
    </div>
  )
}