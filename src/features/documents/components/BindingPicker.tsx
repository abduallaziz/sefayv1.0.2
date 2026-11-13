'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { documentsApi } from '../api/documents.api'

interface Props {
  onInsert: (path: string) => void
}

/** Visual picker for the whitelisted fields a text can bind to ({{company.name}} ...). */
export function BindingPicker({ onInsert }: Props) {
  const te = useTranslations('documents.editor')
  const lang = useLocale() === 'en' ? 'en' : 'ar'
  const [q, setQ] = useState('')
  const catalog = useQuery({
    queryKey: ['documents', 'bindings'],
    queryFn: documentsApi.bindings,
    staleTime: 10 * 60_000,
  })

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const map = new Map<string, { path: string; label: string }[]>()
    for (const b of catalog.data?.bindings ?? []) {
      const label = b.label[lang]
      if (needle && !label.toLowerCase().includes(needle) && !b.path.includes(needle)) continue
      map.set(b.group, [...(map.get(b.group) ?? []), { path: b.path, label }])
    }
    return [...map.entries()]
  }, [catalog.data, q, lang])

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-2 dark:border-gray-800">
      <h4 className="text-xs font-semibold text-slate-600 dark:text-gray-400">{te('bindings.title')}</h4>
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
        <Input className="h-9 ps-8" placeholder={te('bindings.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {groups.map(([group, items]) => (
          <div key={group}>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{te(`bindings.group.${group}` as never)}</p>
            <div className="flex flex-wrap gap-1">
              {items.map((i) => (
                <button
                  key={i.path}
                  type="button"
                  title={`{{${i.path}}}`}
                  onClick={() => onInsert(i.path)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {catalog.isSuccess && groups.length === 0 && <p className="text-xs text-slate-500">{te('bindings.none')}</p>}
      </div>
    </div>
  )
}
