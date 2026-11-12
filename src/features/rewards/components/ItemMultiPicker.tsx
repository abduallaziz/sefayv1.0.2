'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { useCatalogItems } from '@/features/items/hooks/useItems'

interface Props {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

/**
 * Pick one or several products from the catalog (search + checkboxes).
 * Used for the "free item" reward so the owner never has to type an item id.
 */
export function ItemMultiPicker({ selectedIds, onChange }: Props) {
  const t = useTranslations('rewards.rewardConfig')
  const { items, isLoading } = useCatalogItems()
  const [query, setQuery] = useState('')

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items
  }, [items, query])

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  return (
    <div className="space-y-2">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-posCloud-primary/10 px-2 py-0.5 text-xs text-posCloud-primary"
            >
              {byId.get(id)?.name ?? id.slice(0, 8)}
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-label={t('removeItem')}
                className="rounded-full hover:bg-posCloud-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchItems')}
        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
      />

      <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <p className="p-3 text-xs text-gray-400">…</p>
        ) : filtered.length === 0 ? (
          <p className="p-3 text-xs text-gray-400">{t('noItems')}</p>
        ) : (
          filtered.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="h-3.5 w-3.5 accent-posCloud-primary"
              />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="shrink-0 text-xs text-gray-400">
                {Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
