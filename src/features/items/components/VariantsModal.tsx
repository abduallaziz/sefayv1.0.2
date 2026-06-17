'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2 } from 'lucide-react'
import { Item } from '../types/item.types'
import { useItemVariants } from '../hooks/useItems'

interface Props {
  open: boolean
  onClose: () => void
  item: Item | null
  onAddVariant: (itemId: string, data: { name: string; price_adjustment: number; sku: string; stock_quantity: number }) => void
  onDeleteVariant: (itemId: string, variantId: string) => void
}

export function VariantsModal({ open, onClose, item, onAddVariant, onDeleteVariant }: Props) {
  const t = useTranslations('items')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('variants')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : variants.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noVariants')}</p>
          ) : (
            variants.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{v.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {v.price_adjustment > 0 ? `+${v.price_adjustment}` : v.price_adjustment} {t('currency')}
                    {v.sku ? ` • ${v.sku}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteVariant(item.id, v.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 p-5 shrink-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('addVariant')}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder={t('variantName')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-600"
            />
            <input
              placeholder={t('sku')}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-600"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('priceAdjustment')}
              value={form.price_adjustment}
              onChange={(e) => setForm({ ...form, price_adjustment: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-600"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder={t('stock')}
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addVariant')}
          </button>
        </div>
      </div>
    </div>
  )
}