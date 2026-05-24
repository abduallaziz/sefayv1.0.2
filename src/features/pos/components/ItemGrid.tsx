'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { POSItem, POSVariant } from '../types/pos.types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'

const MOCK_ITEMS: POSItem[] = [
  { id: '1', name: 'Espresso', name_ar: 'إسبريسو', price: 12, category: 'drinks', type: 'product', has_variants: false },
  { id: '2', name: 'Latte', name_ar: 'لاتيه', price: 18, category: 'drinks', type: 'product', has_variants: true, variants: [{ id: 'v1', name: 'صغير', price_adjustment: 0 }, { id: 'v2', name: 'وسط', price_adjustment: 4 }, { id: 'v3', name: 'كبير', price_adjustment: 8 }] },
  { id: '3', name: 'Cappuccino', name_ar: 'كابتشينو', price: 16, category: 'drinks', type: 'product', has_variants: false },
  { id: '4', name: 'Croissant', name_ar: 'كروسان', price: 14, category: 'food', type: 'product', has_variants: false },
  { id: '5', name: 'Sandwich', name_ar: 'ساندويتش', price: 22, category: 'food', type: 'product', has_variants: true, variants: [{ id: 'v4', name: 'دجاج', price_adjustment: 0 }, { id: 'v5', name: 'لحم', price_adjustment: 5 }] },
  { id: '6', name: 'Cheesecake', name_ar: 'تشيز كيك', price: 20, category: 'food', type: 'product', has_variants: false },
  { id: '7', name: 'Haircut', name_ar: 'قص شعر', price: 50, category: 'services', type: 'service', has_variants: false },
  { id: '8', name: 'Beard Trim', name_ar: 'تشذيب لحية', price: 30, category: 'services', type: 'service', has_variants: false },
]

interface Props {
  onAddItem: (item: POSItem, variant?: POSVariant) => void
}

export function ItemGrid({ onAddItem }: Props) {
  const t = useTranslations('pos')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [variantModal, setVariantModal] = useState<POSItem | null>(null)

  const CATEGORIES = [
  { key: 'all', label: t('categories.all') },
  { key: 'drinks', label: t('categories.drinks') },
  { key: 'food', label: t('categories.food') },
  { key: 'services', label: t('categories.services') },
  { key: 'other', label: t('categories.other') },
]

  const filtered = MOCK_ITEMS.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.name_ar.includes(search) || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleItemClick = (item: POSItem) => {
    if (item.has_variants && item.variants?.length) {
      setVariantModal(item)
    } else {
      onAddItem(item)
    }
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search */}
      <Input
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 pb-2 pr-1">
        {filtered.length === 0 && (
          <p className="col-span-3 text-center text-muted-foreground text-sm py-8">{t('noItems')}</p>
        )}
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="relative bg-card border border-border rounded-xl p-3 text-right hover:border-primary hover:shadow-sm transition-all group active:scale-95"
          >
            {item.type === 'service' && (
              <Badge variant="muted" className="absolute top-2 left-2 text-xs">{t('service')}</Badge>
            )}
            {item.has_variants && (
              <Badge variant="default" className="absolute top-2 right-2 text-xs">{t('multiple')}</Badge>
            )}
            <div className="mt-4">
              <p className="font-medium text-sm text-foreground truncate">{item.name_ar}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.name}</p>
              <p className="text-primary font-bold text-base mt-2">{item.price} ر.س</p>
            </div>
          </button>
        ))}
      </div>

      {/* Variant Modal */}
      {variantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm border border-border">
            <h3 className="font-semibold text-lg mb-1">{variantModal.name_ar}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('variant.title')}</p>
            <div className="grid grid-cols-1 gap-2">
              {variantModal.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    onAddItem(variantModal, v)
                    setVariantModal(null)
                  }}
                  className="flex justify-between items-center p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="text-primary font-bold">
                    {variantModal.price + v.price_adjustment} ر.س
                  </span>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-3" onClick={() => setVariantModal(null)}>
              {t('variant.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}