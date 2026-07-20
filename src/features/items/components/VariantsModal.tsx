'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2 } from 'lucide-react'
import { Item } from '../types/item.types'
import { useItemVariants } from '../hooks/useItems'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { Button } from '@/shared/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  item: Item | null
  onAddVariant: (itemId: string, data: { name: string; price_adjustment: number; sku: string; stock_quantity: number }) => void
  onDeleteVariant: (itemId: string, variantId: string) => void
}

export function VariantsModal({ open, onClose, item, onAddVariant, onDeleteVariant }: Props) {
  const t = useTranslations('items')
  const currency = useCurrencyDisplay()
  const [form, setForm] = useState({ name: '', price_adjustment: '', sku: '', stock_quantity: '' })

  const { data: variants = [], isLoading } = useItemVariants(item?.id ?? null)

  if (!open || !item) return null

  const handleAdd = () => {
    if (!form.name.trim()) return
    onAddVariant(item.id, {
      name: form.name,
      price_adjustment: parseFloat(form.price_adjustment) || 0,
      sku: form.sku,
      stock_quantity: parseInt(form.stock_quantity) || 0,
    })
    setForm({ name: '', price_adjustment: '', sku: '', stock_quantity: '' })
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('variants')}</h2>
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <div className="h-10 bg-posCloud-background dark:bg-posCloudDark-background rounded animate-pulse" />
          ) : variants.length === 0 ? (
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-4">{t('noVariants')}</p>
          ) : (
            variants.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background">
                <div>
                  <p className="font-medium text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">{v.name}</p>
                  <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {v.price_adjustment > 0 ? `+${v.price_adjustment}` : v.price_adjustment} {currency}
                    {v.sku ? ` • ${v.sku}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteVariant(item.id, v.id)}
                  className="p-1.5 rounded-lg hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-posCloud-border dark:border-posCloudDark-border p-5 shrink-0">
          <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-3">{t('addVariant')}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder={t('variantName')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
            />
            <input
              placeholder={t('sku')}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('priceAdjustment')}
              value={form.price_adjustment}
              onChange={(e) => setForm({ ...form, price_adjustment: e.target.value })}
              className="px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder={t('stock')}
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              className="px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
            />
          </div>
          <Button onClick={handleAdd} className="mt-3 w-full">
            <Plus className="w-4 h-4" />
            {t('addVariant')}
          </Button>
        </div>
      </div>
    </div>
  )
}