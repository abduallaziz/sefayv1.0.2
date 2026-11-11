'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { StickyNote } from 'lucide-react'
import { updateInvoiceNote } from '@/features/orders/api/orders.api'
import { ApiError } from '@/lib/api'
import { Button } from '@/shared/ui/button'

interface Props {
  orderId: string
  initialNote?: string | null
  /** Shown when there is no note yet (the receipt passes nothing). */
  emptyText?: string
}

/**
 * G6 - edits ONLY the non-financial note of an already-sold invoice
 * (PATCH /invoices/:id/note). Totals, payment and items are never touched.
 */
export function InvoiceNoteEditor({ orderId, initialNote, emptyText }: Props) {
  const t = useTranslations('pos.invoiceNote')
  const queryClient = useQueryClient()
  const [note, setNote] = useState(initialNote ?? '')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (value: string) => updateInvoiceNote(orderId, value),
    onSuccess: (res) => {
      setNote(res.notes ?? '')
      setEditing(false)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (e: unknown) => setError(e instanceof ApiError && e.message ? e.message : t('failed')),
  })

  if (!editing) {
    return (
      <div className="space-y-1.5">
        {note ? (
          <p className="text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary whitespace-pre-wrap">{note}</p>
        ) : emptyText ? (
          <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{emptyText}</p>
        ) : null}
        <button
          type="button"
          onClick={() => { setDraft(note); setEditing(true) }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-posCloud-primary hover:underline"
        >
          <StickyNote className="h-3.5 w-3.5" />
          {note ? t('edit') : t('add')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={500}
        rows={3}
        autoFocus
        placeholder={t('placeholder')}
        className="w-full rounded-lg border border-posCloud-border bg-posCloud-background px-3 py-2 text-sm text-posCloud-text-primary focus:border-posCloud-primary focus:outline-none dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
      />
      {error && <p className="text-xs text-posCloud-danger">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { setEditing(false); setError(null) }} className="flex-1" disabled={mutation.isPending}>
          {t('cancel')}
        </Button>
        <Button onClick={() => mutation.mutate(draft)} className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  )
}
