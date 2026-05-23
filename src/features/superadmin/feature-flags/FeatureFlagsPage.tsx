'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { TenantFeaturesPanel } from './components/TenantFeaturesPanel'
import { GlobalFeaturesPanel } from './components/GlobalFeaturesPanel'

const MOCK_TENANTS = [
  { id: 'tenant-1', name: 'مطعم الأصالة' },
  { id: 'tenant-2', name: 'كافيه ليمون' },
  { id: 'tenant-3', name: 'ورشة الخليج' },
]

type ActiveView = 'global' | 'tenant'

export function FeatureFlagsPage() {
  const t = useTranslations('featureFlags')
  const [view, setView] = useState<ActiveView>('global')
  const [selectedTenantId, setSelectedTenantId] = useState<string>(MOCK_TENANTS[0].id)

  const selectedTenant = MOCK_TENANTS.find((ten) => ten.id === selectedTenantId)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-[#1e2130] bg-[#0f1117] p-1 w-fit">
        <button
          onClick={() => setView('global')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'global' ? 'bg-[#1e2130] text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {t('globalView')}
        </button>
        <button
          onClick={() => setView('tenant')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'tenant' ? 'bg-[#1e2130] text-white' : 'text-gray-500 hover:text-gray-300'
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
            <p className="text-xs text-gray-500 font-medium px-2 mb-2">{t('selectTenant')}</p>
            {MOCK_TENANTS.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => setSelectedTenantId(tenant.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTenantId === tenant.id
                    ? 'bg-[#1e2130] text-white'
                    : 'text-gray-400 hover:bg-[#141720] hover:text-white'
                }`}
              >
                {tenant.name}
              </button>
            ))}
          </div>

          <TenantFeaturesPanel
            tenantId={selectedTenantId}
            tenantName={selectedTenant.name}
          />
        </div>
      )}
    </div>
  )
}