'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { POSItem, POSVariant } from '../types/pos.types'
import { useItems, useCategories, useItemVariants } from '@/features/items/hooks/useItems'

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
  const currency = t('currency')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-2xl p-5 w-full max-w-sm">
        <h3 className="font-semibold text-lg text-white mb-1">{item.name_ar}</h3>
        <p className="text-sm text-slate-500 mb-4">{t('variant.title')}</p>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="h-10 bg-[#1e2130] rounded animate-pulse" />
          ) : variants.length === 0 ? (
            <button
              onClick={() => { onAddItem(item); onClose(); }}
              className="flex justify-between items-center p-3 rounded-xl border border-[#1e2130] hover:border-blue-500 hover:bg-blue-500/5 transition-all"
            >
              <span className="font-medium text-white">{item.name_ar}</span>
              <span className="text-blue-400 font-bold">{item.price.toLocaleString('en-US')} {currency}</span>
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
                className="flex justify-between items-center p-3 rounded-xl border border-[#1e2130] hover:border-blue-500 hover:bg-blue-500/5 transition-all"
              >
                <span className="font-medium text-white">{v.name}</span>
                <span className="text-blue-400 font-bold">
                  {(item.price + (v.price_adjustment ?? 0)).toLocaleString('en-US')} {currency}
                </span>
              </button>
            ))
          )}
        </div>
        <button
          className="w-full mt-3 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm"
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
  const currency = t('currency')
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
    <div className="flex flex-col h-full gap-3">
      <input
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-600"
      />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-[#141720] text-slate-400 hover:text-white'
          }`}
        >
          {t('categories.all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-[#141720] text-slate-400 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 pb-2">
          {filtered.length === 0 && (
            <p className="col-span-3 text-center text-slate-500 text-sm py-8">{t('noItems')}</p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="relative bg-[#141720] border border-[#1e2130] rounded-xl p-3 text-right hover:border-blue-500 hover:shadow-sm transition-all active:scale-95"
            >
              {item.type === 'service' && (
                <span className="absolute top-2 left-2 text-xs bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded">{t('service')}</span>
              )}
              {item.has_variants && (
                <span className="absolute top-2 right-2 text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{t('multiple')}</span>
              )}
              <div className="mt-4">
                <p className="font-medium text-sm text-white truncate">{item.name_ar}</p>
                <p className="text-blue-400 font-bold text-base mt-2">{item.price.toLocaleString('en-US')} {currency}</p>
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