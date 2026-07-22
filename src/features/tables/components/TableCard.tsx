'use client'

import { useTranslations } from 'next-intl'
import { Users } from 'lucide-react'
import type { RestaurantTable } from '../api/tables.api'

const STATUS_STYLES: Record<string, string> = {
  available: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  occupied: 'border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 text-red-700 dark:text-red-400',
  reserved: 'border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
  cleaning: 'border-slate-300 bg-slate-50 dark:bg-slate-500/10 dark:border-slate-500/30 text-slate-500 dark:text-slate-400',
}

interface Props {
  table: RestaurantTable
  onClick: () => void
}

export function TableCard({ table, onClick }: Props) {
  const t = useTranslations('tables')

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${STATUS_STYLES[table.status] ?? STATUS_STYLES.available}`}
    >
      <span className="text-lg font-bold">{table.name}</span>
      <div className="flex items-center gap-1 text-xs opacity-80">
        <Users className="w-3 h-3" />
        {table.capacity}
      </div>
      <span className="text-xs font-medium uppercase tracking-wide">{t(`status.${table.status}`)}</span>
    </button>
  )
}
