'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent, Switch } from '@/shared/ui'
import { cn } from '@/lib/utils'
import { PermissionRow } from './PermissionRow'
import type { PermissionGroup, ResolvedPermission } from '../api/access-control.api'

// Backend permission-group codes bucketed into the 3 top-level domain tabs
// the spec calls for. "platform" is deliberately absent — those permissions
// are never shown to tenant admins in the first place (see
// listPermissionsCatalog(includeSuperadmin) on the backend).
// Keys here are stable machine ids (used as Tabs values) — translated via
// t(`domains.${id}`) for display, never used as display text directly.
const DOMAIN_BUCKETS: Record<string, string[]> = {
  sales: ['sales', 'reports', 'settings'],
  inventory: ['inventory', 'purchasing', 'expenses'],
  hr: ['employees', 'attendance', 'payroll'],
}

interface PermissionConfiguratorProps {
  groups: PermissionGroup[]
  permissions: ResolvedPermission[]
  readOnly: boolean
  onToggle: (permissionKey: string, isGranted: boolean) => void
  onReset: (permissionKey: string) => void
}

export function PermissionConfigurator({
  groups,
  permissions,
  readOnly,
  onToggle,
  onReset,
}: PermissionConfiguratorProps) {
  const locale = useLocale()
  const t = useTranslations('accessControl')

  const byGroupCode = useMemo(() => {
    const map = new Map<string, ResolvedPermission[]>()
    for (const p of permissions) {
      const key = p.group_code ?? 'other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return map
  }, [permissions])

  const domainTabs = Object.entries(DOMAIN_BUCKETS).map(([domain, codes]) => ({
    domain,
    groups: groups.filter((g) => codes.includes(g.code)),
  }))

  return (
    <Tabs defaultValue={domainTabs[0]?.domain}>
      <TabsList className="grid w-full grid-cols-3 rounded-md border-0 bg-slate-100 p-1">
        {domainTabs.map(({ domain }) => (
          <TabsTrigger
            key={domain}
            value={domain}
            className="rounded-md text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t(`domains.${domain}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      {domainTabs.map(({ domain, groups: domainGroups }) => (
        <TabsContent key={domain} value={domain} className="space-y-4">
          {domainGroups.map((group) => {
            const items = byGroupCode.get(group.code) ?? []
            if (items.length === 0) return null
            const allGranted = items.every((p) => p.granted)

            return (
              <div key={group.id} className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {locale === 'ar' ? group.name_ar : group.name_en}
                  </p>
                  <Switch
                    checked={allGranted}
                    disabled={readOnly}
                    // Indeterminate isn't a native Switch state — someGranted
                    // without allGranted is visually implied by the sub-grid
                    // itself (some rows on, some off) rather than a 3rd
                    // master-switch visual state.
                    onCheckedChange={(checked) => {
                      for (const p of items) onToggle(p.permission_key, checked)
                    }}
                  />
                </div>
                {/* Toggling the module switch OFF blocks the sub-grid entirely
                    (opacity-50 pointer-events-none), per spec — a partial
                    state is possible (some children still granted from
                    before), but the master switch off state takes priority
                    over per-row nuance visually. */}
                <div
                  className={cn(
                    'grid grid-cols-1 gap-1 p-2 transition-opacity sm:grid-cols-2',
                    !allGranted && 'opacity-50 pointer-events-none',
                  )}
                >
                  {items.map((p) => (
                    <PermissionRow
                      key={p.permission_key}
                      permission={p}
                      label={p.description ?? p.permission_key}
                      advanced={false}
                      readOnly={readOnly}
                      onToggle={(granted) => onToggle(p.permission_key, granted)}
                      onReset={() => onReset(p.permission_key)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {domainGroups.every((g) => (byGroupCode.get(g.code) ?? []).length === 0) && (
            <p className="py-8 text-center text-sm text-slate-400">{t('noPermissionsInDomain')}</p>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
