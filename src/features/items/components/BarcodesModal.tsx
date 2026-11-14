'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2, Star } from 'lucide-react'
import { Item, BarcodeType } from '../types/item.types'
import { useItemBarcodes, useCreateBarcode, useDeleteBarcode } from '../hooks/useItems'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'

const BARCODE_TYPES: BarcodeType[] = ['UPC', 'EAN', 'GS1', 'QR']

interface Props {
  open: boolean
  onClose: () => void
  item: Item | null
}

const inputClass = "px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"

export function BarcodesModal({ open, onClose, item }: Props) {
  const t = useTranslations('items')
  const [form, setForm] = useState({ barcode: '', barcode_type: 'UPC' as BarcodeType, is_primary: false })

  const { data: barcodes = [], isLoading } = useItemBarcodes(item?.id ?? null)
  const createBarcode = useCreateBarcode()
  const deleteBarcode = useDeleteBarcode()

  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEscapeClose(open && !!item, onClose, deleteId === null)

  if (!open || !item) return null

  const handleAdd = () => {
    const code = form.barcode.trim()
    if (!code) { setError(t('barcodeRequired')); return }
    setError(null)
    createBarcode.mutate(
      { item_id: item.id, barcode: code, barcode_type: form.barcode_type, is_primary: form.is_primary },
      {
        onSuccess: () => setForm({ barcode: '', barcode_type: 'UPC', is_primary: false }),
        onError: (err: unknown) =>
          setError(err instanceof Error && err.message ? err.message : t('barcodeError')),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('barcodes')}</h2>
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <div className="h-10 bg-posCloud-background dark:bg-posCloudDark-background rounded animate-pulse" />
          ) : barcodes.length === 0 ? (
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-4">{t('noBarcodes')}</p>
          ) : (
            barcodes.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background">
                <div className="flex items-center gap-2">
                  {b.is_primary && <Star className="w-3.5 h-3.5 text-posCloud-warning fill-posCloud-warning shrink-0" />}
                  <div>
                    <p className="font-mono font-medium text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">{b.barcode}</p>
                    <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                      {b.barcode_type}{b.variant_id ? ` • ${t('variant')}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t('deleteBarcode')}
                  title={t('deleteBarcode')}
                  onClick={() => setDeleteId(b.id)}
                  className="p-1.5 rounded-lg hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-posCloud-border dark:border-posCloudDark-border p-5 shrink-0">
          <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-3">{t('addBarcode')}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder={t('barcodeValue')}
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              className={`${inputClass} col-span-2 font-mono`}
            />
            <select
              value={form.barcode_type}
              onChange={(e) => setForm({ ...form, barcode_type: e.target.value as BarcodeType })}
              className={inputClass}
            >
              {BARCODE_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary cursor-pointer px-1">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                className="w-4 h-4 accent-posCloud-primary"
              />
              {t('setPrimary')}
            </label>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-posCloud-danger">{error}</p>}
          <Button onClick={handleAdd} disabled={createBarcode.isPending} className="mt-3 w-full">
            <Plus className="w-4 h-4" />
            {t('addBarcode')}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const id = deleteId
          setDeleteId(null)
          if (id) deleteBarcode.mutate({ id, itemId: item.id })
        }}
        variant="danger"
        title={t('deleteBarcode')}
        message={t('deleteBarcodeConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}
