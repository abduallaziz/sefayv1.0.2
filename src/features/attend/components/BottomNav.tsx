'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, ClipboardList, CalendarDays, MoreHorizontal } from 'lucide-react'

export function BottomNav({ token }: { token: string }) {
  const t = useTranslations('attend')
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { key: 'home', href: `/attend/${token}`, icon: Home, label: t('navHome') },
    { key: 'log', href: `/attend/${token}/log`, icon: ClipboardList, label: t('navLog') },
    { key: 'leaves', href: `/attend/${token}/leaves`, icon: CalendarDays, label: t('navLeaves') },
    { key: 'more', href: `/attend/${token}/more`, icon: MoreHorizontal, label: t('navMore') },
  ]

  return (
    <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-800 -mx-6 -mb-6 mt-4 px-6 pt-3 pb-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.key === 'home' && pathname === `/attend/${token}`)
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.href)}
            className={`flex flex-col items-center gap-1 text-[10px] ${active ? 'text-[#0C447C] dark:text-[#5B9BD5]' : 'text-slate-400'}`}
          >
            <Icon className="w-5 h-5" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
