'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'
import { Item } from '../types/item.types'
import { useItemVariants } from '../hooks/useItems'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { Button } from '@/shared/ui/button'

interface VariantFields {
  name: string
  price_adjustment: number
  sku: string
}

interface Props {
  open: boolean
  onClose: () => void
  item: Item | null
  onAddVariant: (itemId: string, data: VariantFields) => void
  onUpdateVariant: (itemId: string, variantId: string, data: VariantFields) => void
  onDeleteVariant: (itemId: string, variantId: string) => void
}

const fieldClass = "px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"

export function VariantsModal({ open, onClose, item, onAddVariant, onUpdateVariant, onDeleteVariant }: Props) {
  const t = useTranslations('items')
  const currency = useCurrencyDisplay()
  const [form, setForm] = useState({ name: '', price_adjustment: '', sku: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price_adjustment: '', sku: '' })

  const { data: variants = [], isLoading } = useItemVariants(item?.id ?? null)

  if (!open || !item) return null

  const handleAdd = () => {
    if (!form.name.trim()) return
    onAddVariant(item.id, {
      name: form.name,
      price_adjustment: parseFloat(form.price_adjustment) || 0,
      sku: form.sku,
    })
    setForm({ name: '', price_adjustment: '', sku: '' })
  }

  const startEdit = (v: any) => {
    setEditingId(v.id)
    setEditForm({ name: v.name, price_adjustment: String(v.price_adjustment ?? 0), sku: v.sku ?? '' })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = (variantId: string) => {
    if (!editForm.name.trim()) return
    onUpdateVariant(item.id, variantId, {
      name: editForm.name,
      price_adjustment: parseFloat(editForm.price_adjustment) || 0,
      sku: editForm.sku,
    })
    setEditingId(null)
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
            variants.map((v: any) =>
              editingId === v.id ? (
                <div key={v.id} className="p-3 rounded-lg border border-posCloud-primary bg-posCloud-background dark:bg-posCloudDark-background space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder={t('variantName')}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={fieldClass}
                    />
                    <input
                      placeholder={t('sku')}
                      value={editForm.sku}
                      onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                      className={fieldClass}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={t('priceAdjustment')}
                      value={editForm.price_adjustment}
                      onChange={(e) => setEditForm({ ...editForm, price_adjustment: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs rounded-lg text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => saveEdit(v.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-posCloud-primary text-white hover:opacity-90"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background">
                  <div>
                    <p className="font-medium text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">{v.name}</p>
                    <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      {v.price_adjustment > 0 ? `+${v.price_adjustment}` : v.price_adjustment} {currency}
                      {v.sku ? ` • ${v.sku}` : ''}
                      {` • ${t('stock')}: ${v.stock_quantity ?? 0}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(v)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteVariant(item.id, v.id)}
                      className="p-1.5 rounded-lg hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>

        <div className="border-t border-posCloud-border dark:border-posCloudDark-border p-5 shrink-0">
          <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-3">{t('addVariant')}</p>
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder={t('variantName')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
            />
            <input
              placeholder={t('sku')}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className={fieldClass}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('priceAdjustment')}
              value={form.price_adjustment}
              onChange={(e) => setForm({ ...form, price_adjustment: e.target.value })}
              className={fieldClass}
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
