'use client'

import { useState } from 'react'
import { POSItem, POSVariant } from '../types/pos.types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'

// Mock data — يتحول لـ API call بعدين
const MOCK_CATEGORIES = ['الكل', 'مشروبات', 'طعام', 'خدمات', 'أخرى']

const MOCK_ITEMS: POSItem[] = [
  { id: '1', name: 'Espresso', name_ar: 'إسبريسو', price: 12, category: 'مشروبات', type: 'product', has_variants: false },
  { id: '2', name: 'Latte', name_ar: 'لاتيه', price: 18, category: 'مشروبات', type: 'product', has_variants: true, variants: [{ id: 'v1', name: 'صغير', price_adjustment: 0 }, { id: 'v2', name: 'وسط', price_adjustment: 4 }, { id: 'v3', name: 'كبير', price_adjustment: 8 }] },
  { id: '3', name: 'Cappuccino', name_ar: 'كابتشينو', price: 16, category: 'مشروبات', type: 'product', has_variants: false },
  { id: '4', name: 'Croissant', name_ar: 'كروسان', price: 14, category: 'طعام', type: 'product', has_variants: false },
  { id: '5', name: 'Sandwich', name_ar: 'ساندويتش', price: 22, category: 'طعام', type: 'product', has_variants: true, variants: [{ id: 'v4', name: 'دجاج', price_adjustment: 0 }, { id: 'v5', name: 'لحم', price_adjustment: 5 }] },
  { id: '6', name: 'Cheesecake', name_ar: 'تشيز كيك', price: 20, category: 'طعام', type: 'product', has_variants: false },
  { id: '7', name: 'Haircut', name_ar: 'قص شعر', price: 50, category: 'خدمات', type: 'service', has_variants: false },
  { id: '8', name: 'Beard Trim', name_ar: 'تشذيب لحية', price: 30, category: 'خدمات', type: 'service', has_variants: false },
]

interface Props {
  onAddItem: (item: POSItem, variant?: POSVariant) => void
}

export function ItemGrid({ onAddItem }: Props) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('الكل')
  const [variantModal, setVariantModal] = useState<POSItem | null>(null)

  const filtered = MOCK_ITEMS.filter((item) => {
    const matchCat = activeCategory === 'الكل' || item.category === activeCategory
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
        placeholder="بحث عن منتج..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 pb-2 pr-1">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="relative bg-card border border-border rounded-xl p-3 text-right hover:border-primary hover:shadow-sm transition-all group active:scale-95"
          >
            {item.type === 'service' && (
              <Badge variant="muted" className="absolute top-2 left-2 text-xs">خدمة</Badge>
            )}
            {item.has_variants && (
              <Badge variant="default" className="absolute top-2 right-2 text-xs">متعدد</Badge>
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
            <p className="text-sm text-muted-foreground mb-4">اختر الخيار</p>
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
              إلغاء
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}