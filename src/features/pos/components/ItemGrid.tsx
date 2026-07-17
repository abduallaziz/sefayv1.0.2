'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { POSItem, POSVariant } from '../types/pos.types'
import { useItems, useCategories, useItemVariants } from '@/features/items/hooks/useItems'

// Sefay's real Item model has no image_url field anywhere (confirmed — no
// backend upload feature exists yet, see docs/rebuild/PARKING_LOT.md B3).
// Per explicit user decision, a temporary stand-in photo is pulled from a
// public stock-photo service keyed by the item's own name (real, tenant-
// specific text — not a fabricated value) and locked to the item's id so
// the same item always gets the same photo across renders, exactly the
// technique pos-cloud's own mock data uses (loremflickr, ?lock=id).
function itemImageUrl(item: POSItem) {
  return `https://loremflickr.com/300/300/${encodeURIComponent(item.name_ar || item.name)}?lock=${item.id}`
}

interface Props {
  onAddItem: (item: POSItem, variant?: POSVariant) => void
}

function VariantModal({ item, onAddItem, onClose, t }: {
  item: POSItem
  onAddItem: (item: POSItem, variant?: POSVariant) => void
  onClose: () => void
  t: any
}) {
  const { data: variants = [], isLoading } = useItemVariants(item.id)
  const currency = useTenantStore((s) => s.currency_symbol)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-2xl p-5 w-full max-w-sm">
        <h3 className="font-semibold text-lg text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-1">{item.name_ar}</h3>
        <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mb-4">{t('variant.title')}</p>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="h-10 bg-posCloud-background dark:bg-posCloudDark-background rounded animate-pulse" />
          ) : variants.length === 0 ? (
            <button
              onClick={() => { onAddItem(item); onClose(); }}
              className="flex justify-between items-center p-3 rounded-xl border border-posCloud-border dark:border-posCloudDark-border hover:border-posCloud-primary/40 hover:bg-posCloud-primary-light/50 dark:hover:bg-white/5 transition-all"
            >
              <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.name_ar}</span>
              <span className="text-posCloud-primary font-bold">{item.price.toLocaleString('en-US')} {currency}</span>
            </button>
          ) : (
            variants.map((v: any) => (
              <button
                key={v.id}
                onClick={() => {
                  onAddItem(item, {
                    id: v.id,
                    name: v.name,
                    price_adjustment: v.price_adjustment ?? 0,
                  });
                  onClose();
                }}
                className="flex justify-between items-center p-3 rounded-xl border border-posCloud-border dark:border-posCloudDark-border hover:border-posCloud-primary/40 hover:bg-posCloud-primary-light/50 dark:hover:bg-white/5 transition-all"
              >
                <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{v.name}</span>
                <span className="text-posCloud-primary font-bold">
                  {(item.price + (v.price_adjustment ?? 0)).toLocaleString('en-US')} {currency}
                </span>
              </button>
            ))
          )}
        </div>
        <button
          className="w-full mt-3 py-2 border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary rounded-lg text-sm transition-colors"
          onClick={onClose}
        >
          {t('variant.cancel')}
        </button>
      </div>
    </div>
  )
}

export function ItemGrid({ onAddItem }: Props) {
  const t = useTranslations('pos')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [variantModal, setVariantModal] = useState<POSItem | null>(null)

  const { data: rawItems = [], isLoading } = useItems()
  const { data: categories = [] } = useCategories()

  const items: POSItem[] = rawItems
    .filter(i => i.is_active)
    .map(i => ({
      id: i.id,
      name: i.name,
      name_ar: i.name,
      price: i.price,
      category: i.category_id ?? 'other',
      type: i.type,
      has_variants: i.has_variants,
      variants: [],
    }))

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.name_ar.includes(search) || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleItemClick = (item: POSItem) => {
    if (item.has_variants) {
      setVariantModal(item)
    } else {
      onAddItem(item)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>
        <div className="flex items-center gap-2 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <Search className="h-4 w-4 shrink-0" />
          <input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary text-posCloud-text-primary dark:text-posCloudDark-text-primary sm:w-56"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-posCloud-primary text-white'
              : 'bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-secondary dark:text-posCloudDark-text-secondary border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          {t('categories.all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-posCloud-primary text-white'
                : 'bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-secondary dark:text-posCloudDark-text-secondary border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-sm">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 min-h-0 pb-2 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-sm py-10">{t('noItems')}</p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-transform hover:-translate-y-0.5 hover:border-posCloud-primary/40"
            >
              {item.type === 'service' && (
                <span className="absolute top-2 left-2 text-xs bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary px-1.5 py-0.5 rounded">{t('service')}</span>
              )}
              {item.has_variants && (
                <span className="absolute top-2 right-2 text-xs bg-posCloud-primary-light text-posCloud-primary px-1.5 py-0.5 rounded">{t('multiple')}</span>
              )}
              <div className="relative h-24 w-full shrink-0 bg-posCloud-background dark:bg-posCloudDark-background">
                <Image src={itemImageUrl(item)} alt={item.name_ar} fill sizes="200px" className="object-cover" unoptimized />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{item.name_ar}</p>
                <p className="text-posCloud-primary font-bold text-sm mt-1">{item.price.toLocaleString('en-US')} {currency}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {variantModal && (
        <VariantModal
          item={variantModal}
          onAddItem={onAddItem}
          onClose={() => setVariantModal(null)}
          t={t}
        />
      )}
    </div>
  )
}