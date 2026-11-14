'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { documentsApi } from '@/features/documents/api/documents.api'
import { BRANCHES_SHORTCUT, SETTINGS_GROUPS, SETTINGS_NAV, type SettingsNavItem } from '../config/settings-nav'

function stripLocale(p: string) {
  return p.replace(/^\/(ar|en)(?=\/|$)/, '').replace(/\/$/, '')
}

function isActive(item: SettingsNavItem, path: string) {
  return [item.href, ...(item.alsoMatches ?? [])].some((h) => path === h)
}

/**
 * Persistent settings sub-navigation. Shown for every top-level settings page;
 * full-screen editors (document editor, print designers, role editor) render
 * bare so they keep their own canvas.
 */
export function SettingsShell({ children }: { children: ReactNode }) {
  const t = useTranslations('settings.nav')
  const locale = useLocale()
  const path = stripLocale(usePathname())
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'owner' || user?.role === 'superadmin'
  const { data: documentsEnabled } = useQuery({
    queryKey: ['documents', 'enabled'],
    queryFn: documentsApi.enabled,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const visible = SETTINGS_NAV.filter(
    (i) => (!i.ownerOnly || isOwner) && (!i.needsDocuments || documentsEnabled?.enabled),
  )
  const inShell = SETTINGS_NAV.some((i) => isActive(i, path))

  const mobileRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mobileRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [path])

  if (!inShell) return <>{children}</>

  const href = (h: string) => `/${locale}${h}`
  const linkCls = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40',
      active
        ? 'bg-posCloud-primary/10 text-posCloud-primary dark:text-[#5B9BD5]'
        : 'text-posCloud-text-secondary hover:bg-slate-100 dark:text-posCloudDark-text-secondary dark:hover:bg-white/5',
    )

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      {/* Mobile / tablet: horizontally scrollable tabs */}
      <nav aria-label={t('label')} className="min-w-0 lg:hidden">
        <div ref={mobileRef} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((item) => {
            const active = isActive(item, path)
            return (
              <Link
                key={item.key}
                href={href(item.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40',
                  active
                    ? 'border-posCloud-primary bg-posCloud-primary text-white'
                    : 'border-posCloud-border bg-posCloud-surface text-posCloud-text-secondary dark:border-posCloudDark-border dark:bg-posCloudDark-surface dark:text-posCloudDark-text-secondary',
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {t(`items.${item.key}`)}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop: grouped vertical sidebar */}
      <nav aria-label={t('label')} className="hidden lg:block">
        <div className="sticky top-0 space-y-5">
          {SETTINGS_GROUPS.map((g) => {
            const items = visible.filter((i) => i.group === g)
            if (!items.length) return null
            return (
              <div key={g}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {t(`groups.${g}`)}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActive(item, path)
                    return (
                      <li key={item.key}>
                        <Link href={href(item.href)} aria-current={active ? 'page' : undefined} className={linkCls(active)}>
                          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{t(`items.${item.key}`)}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
          <div className="border-t border-posCloud-border pt-3 dark:border-posCloudDark-border">
            <Link href={href(BRANCHES_SHORTCUT.href)} className={linkCls(false)}>
              <BRANCHES_SHORTCUT.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{t('items.branches')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </div>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  )
}
