'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'
import { Item, ItemVariant } from '../types/item.types'
import { useItemVariants } from '../hooks/useItems'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { parseStrictNumber } from '@/lib/number-input'

const MAX_ADJUSTMENT = 99_999_999

interface VariantFields {
  name: string
  price_adjustment: number
  sku: string
}

interface Props {
  open: boolean
  onClose: () => void
  item: Item | null
  onAddVariant: (itemId: string, data: VariantFields) => Promise<void>
  onUpdateVariant: (itemId: string, variantId: string, data: VariantFields) => Promise<void>
  onDeleteVariant: (itemId: string, variantId: string) => Promise<void>
}

const fieldClass = "px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"

export function VariantsModal({ open, onClose, item, onAddVariant, onUpdateVariant, onDeleteVariant }: Props) {
  const t = useTranslations('items')
  const currency = useCurrencyDisplay()
  const [form, setForm] = useState({ name: '', price_adjustment: '', sku: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price_adjustment: '', sku: '' })

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: variants = [], isLoading } = useItemVariants(item?.id ?? null)

  useEscapeClose(open && !!item, onClose, deleteId === null)

  if (!open || !item) return null

  // Strict adjustment: empty = 0, anything non-numeric / out of range is rejected
  // (never silently saved as 0). Arabic-Indic digits are normalized.
  const parseAdjustment = (raw: string): number | null => {
    if (raw.trim() === '') return 0
    const n = parseStrictNumber(raw)
    if (n === null || Math.abs(n) > MAX_ADJUSTMENT) return null
    return Math.round(n * 100) / 100
  }

  const run = async (fn: () => Promise<void>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      return true
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('variantError'))
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async () => {
    if (!form.name.trim()) { setError(t('variantNameRequired')); return }
    const adj = parseAdjustment(form.price_adjustment)
    if (adj === null) { setError(t('priceAdjustmentInvalid')); return }
    const ok = await run(() => onAddVariant(item.id, { name: form.name.trim(), price_adjustment: adj, sku: form.sku.trim() }))
    if (ok) setForm({ name: '', price_adjustment: '', sku: '' })
  }

  const startEdit = (v: ItemVariant) => {
    setEditingId(v.id)
    setEditForm({ name: v.name, price_adjustment: String(v.price_adjustment ?? 0), sku: v.sku ?? '' })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (variantId: string) => {
    if (!editForm.name.trim()) { setError(t('variantNameRequired')); return }
    const adj = parseAdjustment(editForm.price_adjustment)
    if (adj === null) { setError(t('priceAdjustmentInvalid')); return }
    const ok = await run(() => onUpdateVariant(item.id, variantId, { name: editForm.name.trim(), price_adjustment: adj, sku: editForm.sku.trim() }))
    if (ok) setEditingId(null)
  }

  const confirmDelete = async () => {
    const id = deleteId
    setDeleteId(null)
    if (id) await run(() => onDeleteVariant(item.id, id))
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('variants')}</h2>
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <div className="h-10 bg-posCloud-background dark:bg-posCloudDark-background rounded animate-pulse" />
          ) : variants.length === 0 ? (
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-4">{t('noVariants')}</p>
          ) : (
            variants.map((v) =>
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
                      type="button"
                      disabled={busy}
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
                      type="button"
                      aria-label={t('editVariant')}
                      title={t('editVariant')}
                      onClick={() => startEdit(v)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('deleteVariant')}
                      title={t('deleteVariant')}
                      onClick={() => setDeleteId(v.id)}
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
          {error && <p role="alert" className="mt-2 text-sm text-posCloud-danger">{error}</p>}
          <Button onClick={handleAdd} disabled={busy} className="mt-3 w-full">
            <Plus className="w-4 h-4" />
            {t('addVariant')}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title={t('deleteVariant')}
        message={t('deleteVariantConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}
